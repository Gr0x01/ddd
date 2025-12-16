#!/usr/bin/env tsx
/**
 * Long-Form Content Enrichment Script
 *
 * Generates SEO-optimized long-form content for restaurant pages.
 * This is ADDITIVE ONLY - it does not modify existing enrichment data.
 *
 * Usage:
 *   npx tsx scripts/ingestion/enrich-long-form.ts --limit 10
 *   npx tsx scripts/ingestion/enrich-long-form.ts --limit 10 --dry-run
 *   npx tsx scripts/ingestion/enrich-long-form.ts --all --concurrency 10
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import PQueue from 'p-queue';
import { LongFormService } from './enrichment/services/long-form-service';
import { TokenTracker } from './enrichment/shared/token-tracker';
import { estimateCost } from './enrichment/shared/synthesis-client';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tokenTracker = TokenTracker.getInstance();
const longFormService = new LongFormService(tokenTracker);

interface RestaurantRow {
  id: string;
  name: string;
  city: string;
  state: string | null;
  description: string | null;
  guy_quote: string | null;
  price_tier: string | null;
  status: string;
  long_form_enriched_at: string | null;
  restaurant_cuisines: Array<{
    cuisines: { name: string } | null;
  }>;
  restaurant_episodes: Array<{
    segment_notes: string | null;
  }>;
}

async function main() {
  const args = process.argv.slice(2);
  const noLimit = args.includes('--no-limit');
  const limit = noLimit
    ? 10000
    : args.includes('--limit')
      ? parseInt(args[args.indexOf('--limit') + 1], 10)
      : 10;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');
  const concurrency = args.includes('--concurrency')
    ? parseInt(args[args.indexOf('--concurrency') + 1], 10)
    : 10;

  console.log('\n📝 DDD Long-Form Content Enrichment');
  console.log('━'.repeat(50));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${noLimit ? 'ALL' : limit} restaurants`);
  console.log(`Concurrency: ${concurrency} parallel`);
  console.log(`Force All: ${forceAll ? 'YES (re-enrich all)' : 'NO (only unenriched)'}`);
  console.log('');

  // Fetch restaurants that need long-form enrichment
  // Include existing data to provide context to the LLM
  let query = supabase
    .from('restaurants')
    .select(`
      id, name, city, state, description, guy_quote, price_tier, status, long_form_enriched_at,
      restaurant_cuisines!left (
        cuisines!left (name)
      ),
      restaurant_episodes!left (
        segment_notes
      )
    `)
    .eq('is_public', true)
    .limit(limit);

  if (!forceAll) {
    // Only restaurants without long-form content
    query = query.is('long_form_enriched_at', null);
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need long-form enrichment!');
    process.exit(0);
  }

  console.log(`Found ${restaurants.length} restaurant(s) to enrich\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // Create queue for parallel processing
  const queue = new PQueue({ concurrency });

  // Process restaurants in parallel
  const tasks = restaurants.map((restaurant: RestaurantRow, i: number) =>
    queue.add(async () => {
      const num = `[${i + 1}/${restaurants.length}]`;
      console.log(`${num} ${restaurant.name} (${restaurant.city}${restaurant.state ? ', ' + restaurant.state : ''})`);

      if (dryRun) {
        console.log('      🔍 DRY RUN - Skipping actual enrichment');
        return;
      }

      try {
        // Extract cuisines from the join
        const cuisines = restaurant.restaurant_cuisines
          ?.map((rc) => rc.cuisines?.name)
          .filter((name): name is string => !!name) || [];

        // Get segment notes from first episode link
        const segmentNotes = restaurant.restaurant_episodes?.[0]?.segment_notes || null;

        const result = await longFormService.generateLongFormContent(
          restaurant.id,
          restaurant.name,
          restaurant.city,
          restaurant.state || undefined,
          {
            description: restaurant.description,
            guy_quote: restaurant.guy_quote,
            segment_notes: segmentNotes,
            cuisines,
            price_tier: restaurant.price_tier,
            status: restaurant.status,
          }
        );

        if (result.success) {
          // Update only long-form fields
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({
              about_story: result.about_story,
              culinary_philosophy: result.culinary_philosophy,
              history_highlights: result.history_highlights,
              why_visit: result.why_visit,
              city_context: result.city_context,
              long_form_enriched_at: new Date().toISOString(),
            })
            .eq('id', restaurant.id);

          if (updateError) {
            console.log(`      ❌ Database update failed: ${updateError.message}`);
            failCount++;
          } else {
            successCount++;
          }
        } else {
          console.log(`      ⚠️  Generation failed: ${result.error}`);
          failCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`      ❌ Error: ${msg}`);
        failCount++;
      }
    })
  );

  // Wait for all tasks to complete
  await Promise.all(tasks);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const tokens = tokenTracker.getTotalUsage();
  const cost = estimateCost(tokens, 'gpt-4.1-mini');

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Time: ${elapsed}s`);
  console.log(`🪙 Tokens: ${tokens.total.toLocaleString()} (${tokens.prompt.toLocaleString()} in / ${tokens.completion.toLocaleString()} out)`);
  console.log(`💰 Estimated Cost: $${cost.toFixed(4)}`);
  console.log('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
