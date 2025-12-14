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

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : null;

  console.log('\n🍔 Enriching Remaining Restaurants (Seasons 33-42)\n');

  // Step 1: Get restaurant IDs from seasons 33-42 that need enrichment
  const { data: links } = await supabase
    .from('restaurant_episodes')
    .select(`
      restaurant_id,
      restaurants!inner (enrichment_status, description),
      episodes!inner (season)
    `)
    .gte('episodes.season', 33)
    .lte('episodes.season', 42)
    .neq('restaurants.enrichment_status', 'completed');

  if (!links || links.length === 0) {
    console.log('✅ All restaurants from seasons 33-42 are enriched!');
    process.exit(0);
  }

  // Get unique restaurant IDs
  const restaurantIds = [...new Set(links.map((l: any) => l.restaurant_id))];
  const toEnrich = limit ? restaurantIds.slice(0, limit) : restaurantIds;

  console.log(`Found ${restaurantIds.length} restaurants to enrich`);
  if (limit) {
    console.log(`Limiting to first ${limit} restaurants`);
  }
  console.log('');

  // Step 2: Fetch full data for these specific restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      id, name, city, state, description, status, enrichment_status,
      restaurant_episodes!left (
        episode_id,
        episodes!left (
          id, season, episode_number, title
        )
      )
    `)
    .in('id', toEnrich);

  if (!restaurants || restaurants.length === 0) {
    console.log('❌ No restaurants found');
    process.exit(1);
  }

  console.log(`Processing ${restaurants.length} restaurants in batches of 50...\n`);

  let totalSuccessCount = 0;
  let totalFailCount = 0;
  const concurrency = 50;

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
            photos: result.photos,
          })
          .eq('id', restaurant.id);

        if (error) {
          console.log(`  ❌ DB Update Error: ${error.message}`);
          return { success: false };
        }

        console.log(`  ✅ Enriched: ${result.cuisines?.join(', ')} | ${result.price_tier}`);
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

  // Process in batches of 50
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

  console.log('\n━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${totalSuccessCount}`);
  console.log(`❌ Failed: ${totalFailCount}`);
  console.log(`🪙 Tokens: ${tokens.total.toLocaleString()} (${tokens.prompt.toLocaleString()} in / ${tokens.completion.toLocaleString()} out)`);
  console.log(`💰 Cost: $${cost.toFixed(4)}`);
  console.log('');
}

main().catch(console.error);
