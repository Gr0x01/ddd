#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLLMEnricher } from './enrichment/llm-enricher';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const enricher = createLLMEnricher(supabase, { model: 'gpt-4o-mini' });

interface RestaurantRow {
  id: string;
  name: string;
  city: string;
  state: string | null;
  description: string | null;
  status: string;
  enrichment_status: string;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10)
    : 10;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');

  console.log('\n🍔 DDD Restaurant Enrichment');
  console.log('━'.repeat(50));
  console.log(`Model: ${enricher.getModelName()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} restaurants`);
  console.log('');

  // Fetch restaurants that need enrichment
  let query = supabase
    .from('restaurants')
    .select('id, name, city, state, description, status, enrichment_status')
    .limit(limit);

  if (!forceAll) {
    query = query.or('description.is.null,enrichment_status.eq.pending');
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need enrichment!');
    process.exit(0);
  }

  console.log(`Found ${restaurants.length} restaurant(s) to enrich\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i] as RestaurantRow;
    const num = `[${i + 1}/${restaurants.length}]`;

    console.log(`${num} ${restaurant.name} (${restaurant.city}${restaurant.state ? ', ' + restaurant.state : ''})`);

    if (dryRun) {
      console.log('      🔍 DRY RUN - Skipping actual enrichment');
      continue;
    }

    try {
      const result = await enricher.enrichRestaurant(
        restaurant.id,
        restaurant.name,
        restaurant.city,
        restaurant.state
      );

      if (result.success) {
        // Update restaurant with enrichment data
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({
            description: result.description,
            price_tier: result.price_tier,
            guy_quote: result.guy_quote,
            enrichment_status: 'completed',
            last_enriched_at: new Date().toISOString(),
          })
          .eq('id', restaurant.id);

        if (updateError) {
          console.log(`      ❌ Database update failed: ${updateError.message}`);
          failCount++;
        } else {
          // Handle cuisines via junction table
          if (result.cuisines && result.cuisines.length > 0) {
            console.log(`      🏷️  Linking cuisines: ${result.cuisines.join(', ')}`);

            // First, delete existing cuisine links
            await supabase
              .from('restaurant_cuisines')
              .delete()
              .eq('restaurant_id', restaurant.id);

            // Then, create/link cuisines
            for (const cuisineName of result.cuisines) {
              const slug = cuisineName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              // Upsert cuisine (create if doesn't exist, return existing if exists)
              const { data: cuisine, error: cuisineError } = await supabase
                .from('cuisines')
                .upsert(
                  { name: cuisineName, slug },
                  { onConflict: 'slug' }
                )
                .select('id')
                .single();

              if (cuisineError) {
                console.log(`      ⚠️  Failed to upsert cuisine "${cuisineName}": ${cuisineError.message}`);
                continue;
              }

              if (cuisine) {
                // Link restaurant to cuisine (ignore if already exists)
                const { error: linkError } = await supabase
                  .from('restaurant_cuisines')
                  .insert({
                    restaurant_id: restaurant.id,
                    cuisine_id: cuisine.id,
                  });

                // Ignore duplicate errors (23505 is PostgreSQL unique violation)
                if (linkError && linkError.code !== '23505') {
                  console.log(`      ⚠️  Failed to link cuisine "${cuisineName}": ${linkError.message}`);
                } else if (!linkError) {
                  console.log(`      ✅ Linked cuisine: ${cuisineName}`);
                }
              }
            }
          }

          console.log(`      ✅ Enriched: ${result.cuisines?.join(', ')} | ${result.price_tier}`);
          successCount++;
        }
      } else {
        console.log(`      ⚠️  Enrichment failed: ${result.error}`);
        failCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`      ❌ Error: ${msg}`);
      failCount++;
    }

    // Small delay to avoid rate limits
    if (i < restaurants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const tokens = enricher.getTotalTokensUsed();
  const cost = enricher.estimateCost();

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Time: ${elapsed}s`);
  console.log(`🪙 Tokens: ${tokens.total.toLocaleString()} (${tokens.prompt.toLocaleString()} in / ${tokens.completion.toLocaleString()} out)`);
  console.log(`💰 Cost: $${cost.toFixed(4)}`);
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
