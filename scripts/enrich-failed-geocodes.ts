#!/usr/bin/env tsx
/**
 * Enrich Failed Geocodes with Google Places
 *
 * This script finds restaurants that are still missing coordinates after
 * the Nominatim geocoding run and enriches them using Google Places API.
 *
 * The enrichment system will:
 * 1. Use LLM to find the restaurant on Google Places
 * 2. Get accurate lat/lng coordinates
 * 3. Also enrich address, phone, website, hours, ratings, etc.
 *
 * Usage:
 *   npm run tsx scripts/enrich-failed-geocodes.ts
 *   npm run tsx scripts/enrich-failed-geocodes.ts -- --limit=10  # Test with 10
 *   npm run tsx scripts/enrich-failed-geocodes.ts -- --dry-run   # Preview only
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLLMEnricher } from './ingestion/enrichment/llm-enricher';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const enricher = createLLMEnricher(supabase, { model: 'gpt-4.1-mini' });

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  console.log('\n🗺️  ENRICHING FAILED GEOCODES WITH GOOGLE PLACES\n');
  console.log('📋 Configuration:');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no saves)' : 'LIVE'}`);
  if (limit) console.log(`   Limit: ${limit} restaurants`);
  console.log('');

  // Find restaurants that are still missing coordinates
  let query = supabase
    .from('restaurants')
    .select(`
      id, name, city, state, address, latitude, longitude,
      restaurant_episodes!left (
        episode_id,
        episodes!left (
          id, season, episode_number, title
        )
      )
    `)
    .eq('status', 'open')
    .or('latitude.is.null,longitude.is.null')
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: restaurants, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('✅ All restaurants already have coordinates!');
    process.exit(0);
  }

  console.log(`📊 Found ${restaurants.length} restaurants missing coordinates\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN - Preview of restaurants to enrich:\n');
    restaurants.slice(0, 10).forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.name} (${r.city}, ${r.state || ''})`);
      console.log(`   Address: ${r.address || 'N/A'}`);
      console.log(`   Current coords: ${r.latitude}, ${r.longitude}`);
      console.log('');
    });
    if (restaurants.length > 10) {
      console.log(`... and ${restaurants.length - 10} more`);
    }
    console.log('\nRun without --dry-run to enrich these restaurants');
    process.exit(0);
  }

  console.log('⏱️  Estimated cost: ~$' + (restaurants.length * 0.017).toFixed(2));
  console.log('⏱️  Estimated time: ~' + Math.ceil(restaurants.length / 50) + ' minutes\n');

  console.log('Press Ctrl+C to cancel...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  let totalSuccessCount = 0;
  let totalFailCount = 0;
  const concurrency = 50; // Process 50 at a time

  async function enrichOne(restaurant: any, index: number) {
    const episode = restaurant.restaurant_episodes?.[0]?.episodes;

    console.log(`[${index + 1}/${restaurants.length}] ${restaurant.name} (${restaurant.city}, ${restaurant.state || ''})`);

    try {
      const result = await enricher.enrichRestaurant(
        restaurant.id,
        restaurant.name,
        restaurant.city,
        restaurant.state,
        episode?.title,
        episode?.season,
        episode?.episode_number
      );

      if (result.success) {
        // Convert partial dates (YYYY-MM) to full dates (YYYY-MM-01)
        let closedDate = result.closed_date;
        if (closedDate && /^\d{4}-\d{2}$/.test(closedDate)) {
          closedDate = `${closedDate}-01`;
        }

        // Update restaurant with Google Places data
        const { error } = await supabase
          .from('restaurants')
          .update({
            description: result.description,
            price_tier: result.price_tier,
            guy_quote: result.guy_quote,
            enrichment_status: 'completed',
            last_enriched_at: new Date().toISOString(),
            status: result.status,
            closed_date: closedDate,
            address: result.address,
            phone: result.phone,
            website_url: result.website,
            // Google Places data
            google_place_id: result.google_place_id,
            google_rating: result.google_rating,
            google_review_count: result.google_review_count,
            latitude: result.latitude,
            longitude: result.longitude,
          })
          .eq('id', restaurant.id);

        if (error) {
          console.log(`  ❌ DB Update Error: ${error.message}`);
          return { success: false };
        }

        console.log(`  ✅ Enriched: ${result.latitude}, ${result.longitude} | ${result.price_tier || 'N/A'}`);
        return { success: true };
      } else {
        console.log(`  ⚠️  Failed: ${result.error}`);
        return { success: false };
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
      return { success: false };
    }
  }

  // Process in batches
  for (let i = 0; i < restaurants.length; i += concurrency) {
    const batch = restaurants.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(restaurants.length / concurrency);

    console.log(`\n🔄 Batch ${batchNum}/${totalBatches} (${batch.length} restaurants)\n`);

    const promises = batch.map((restaurant: any, idx: number) =>
      enrichOne(restaurant, i + idx)
    );

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    totalSuccessCount += successCount;
    totalFailCount += failCount;

    console.log(`\n✅ Batch ${batchNum}/${totalBatches} complete: ${successCount} success, ${failCount} failed\n`);

    // Small delay between batches
    if (i + concurrency < restaurants.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const tokens = enricher.getTotalTokensUsed();
  const cost = enricher.estimateCost();

  console.log('\n' + '='.repeat(80));
  console.log('📊 ENRICHMENT COMPLETE\n');
  console.log(`Total processed: ${restaurants.length}`);
  console.log(`✅ Success: ${totalSuccessCount}`);
  console.log(`❌ Failed: ${totalFailCount}`);
  console.log(`🪙 Tokens: ${tokens.total.toLocaleString()} (${tokens.prompt.toLocaleString()} in / ${tokens.completion.toLocaleString()} out)`);
  console.log(`💰 Cost: $${cost.toFixed(4)}`);
  console.log('');

  if (totalSuccessCount > 0) {
    const successRate = ((totalSuccessCount / restaurants.length) * 100).toFixed(1);
    console.log(`✨ Success rate: ${successRate}%`);
  }
}

main().catch(console.error);
