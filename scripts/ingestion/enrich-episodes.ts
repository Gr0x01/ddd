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

interface EpisodeRow {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  meta_description: string | null;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10)
    : 10;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');

  console.log('\n📺 DDD Episode Enrichment');
  console.log('━'.repeat(50));
  console.log(`Model: ${enricher.getModelName()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} episodes`);
  console.log('');

  // Fetch episodes that need enrichment
  let query = supabase
    .from('episodes')
    .select('id, season, episode_number, title, meta_description')
    .limit(limit);

  if (!forceAll) {
    query = query.is('meta_description', null);
  }

  const { data: episodes, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!episodes || episodes.length === 0) {
    console.log('✅ No episodes need enrichment!');
    process.exit(0);
  }

  console.log(`Found ${episodes.length} episode(s) to enrich\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i] as EpisodeRow;
    const num = `[${i + 1}/${episodes.length}]`;

    console.log(`${num} S${episode.season}E${episode.episode_number}: ${episode.title}`);

    if (dryRun) {
      console.log('      🔍 DRY RUN - Skipping actual enrichment');
      continue;
    }

    try {
      // Get restaurants for this episode
      const { data: episodeRestaurants, error: restaurantError } = await supabase
        .from('restaurant_episodes')
        .select('restaurants(name)')
        .eq('episode_id', episode.id);

      if (restaurantError) {
        console.log(`      ❌ Failed to fetch restaurants: ${restaurantError.message}`);
        failCount++;
        continue;
      }

      const restaurantNames = (episodeRestaurants || [])
        .map((er: any) => er.restaurants?.name)
        .filter(Boolean);

      if (restaurantNames.length === 0) {
        console.log(`      ⚠️  No restaurants linked - skipping`);
        continue;
      }

      console.log(`      Restaurants: ${restaurantNames.join(', ')}`);

      const result = await enricher.generateEpisodeDescription(
        episode.id,
        episode.season,
        episode.episode_number,
        episode.title,
        restaurantNames
      );

      if (result.success) {
        // Update database with meta description
        const { error: updateError } = await supabase
          .from('episodes')
          .update({
            meta_description: result.metaDescription,
          })
          .eq('id', episode.id);

        if (updateError) {
          console.log(`      ❌ Database update failed: ${updateError.message}`);
          failCount++;
        } else {
          console.log(`      ✅ Generated meta description`);
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
    if (i < episodes.length - 1) {
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
