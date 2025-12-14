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
  status: string;
  google_place_id: string | null;
  last_verified: string | null;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10)
    : 50;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');
  const minConfidence = args.includes('--min-confidence')
    ? parseFloat(args[args.indexOf('--min-confidence') + 1])
    : 0.75;

  console.log('\n🔍 DDD Restaurant Status Verification');
  console.log('━'.repeat(50));
  console.log(`Model: ${enricher.getModelName()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} restaurants`);
  console.log(`Min confidence: ${minConfidence}`);
  console.log('');

  // Fetch restaurants that need status verification
  let query = supabase
    .from('restaurants')
    .select('id, name, city, state, status, google_place_id, last_verified')
    .limit(limit);

  if (!forceAll) {
    // Get restaurants with unknown status or not verified in 180+ days
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    query = query.or(`status.eq.unknown,last_verified.lt.${sixMonthsAgo.toISOString()}`);
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ No restaurants need status verification!');
    process.exit(0);
  }

  console.log(`Found ${restaurants.length} restaurant(s) to verify\n`);

  let successCount = 0;
  let failCount = 0;
  let lowConfidenceCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i] as RestaurantRow;
    const num = `[${i + 1}/${restaurants.length}]`;

    console.log(`${num} ${restaurant.name} (${restaurant.city}${restaurant.state ? ', ' + restaurant.state : ''})`);
    console.log(`      Current status: ${restaurant.status}`);

    if (dryRun) {
      console.log('      🔍 DRY RUN - Skipping actual verification');
      continue;
    }

    try {
      const result = await enricher.verifyRestaurantStatus(
        restaurant.id,
        restaurant.name,
        restaurant.city,
        restaurant.state || undefined,
        restaurant.google_place_id
      );

      if (result.success) {
        console.log(`      Status: ${result.status} (confidence: ${result.confidence.toFixed(2)})`);
        console.log(`      Reasoning: ${result.reasoning}`);

        if (result.confidence >= minConfidence) {
          // Update database with status
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({
              status: result.status,
              last_verified: new Date().toISOString(),
              verification_source: result.source,
              google_place_id: result.googlePlaceId || restaurant.google_place_id,
            })
            .eq('id', restaurant.id);

          if (updateError) {
            console.log(`      ❌ Database update failed: ${updateError.message}`);
            failCount++;
          } else {
            console.log(`      ✅ Updated status to "${result.status}"`);
            successCount++;
          }
        } else {
          console.log(`      ⚠️  Low confidence - skipping update`);
          lowConfidenceCount++;
        }
      } else {
        console.log(`      ⚠️  Verification failed: ${result.error}`);
        failCount++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`      ❌ Error: ${msg}`);
      failCount++;
    }

    // Delay to avoid rate limits
    if (i < restaurants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const tokens = enricher.getTotalTokensUsed();
  const cost = enricher.estimateCost();

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Low confidence: ${lowConfidenceCount}`);
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
