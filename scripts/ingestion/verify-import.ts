/**
 * Verify Import Data
 *
 * Checks the database to see what's been imported
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyImport() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Verifying imported data...\n');

  // Get episodes
  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('*')
    .order('season', { ascending: true })
    .order('episode_number', { ascending: true });

  if (episodesError) {
    console.error('Error fetching episodes:', episodesError);
    return;
  }

  console.log(`📺 Episodes: ${episodes?.length || 0}`);
  episodes?.forEach(ep => {
    console.log(`   S${ep.season}E${ep.episode_number}: ${ep.title}`);
    console.log(`      Air Date: ${ep.air_date}`);
    console.log(`      Slug: ${ep.slug}`);
  });

  // Get restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: true });

  if (restaurantsError) {
    console.error('Error fetching restaurants:', restaurantsError);
    return;
  }

  console.log(`\n🍽️  Restaurants: ${restaurants?.length || 0}`);
  restaurants?.forEach(r => {
    console.log(`   ${r.name}`);
    console.log(`      Location: ${r.city}, ${r.state || r.country}`);
    console.log(`      Slug: ${r.slug}`);
    console.log(`      Status: ${r.status}`);
    console.log(`      Enrichment: ${r.enrichment_status}`);
  });

  // Get restaurant-episode links
  const { data: links, error: linksError } = await supabase
    .from('restaurant_episodes')
    .select('*, restaurants(name), episodes(title)');

  if (linksError) {
    console.error('Error fetching links:', linksError);
    return;
  }

  console.log(`\n🔗 Restaurant-Episode Links: ${links?.length || 0}`);
  links?.forEach(link => {
    console.log(`   ${(link.restaurants as any).name} → ${(link.episodes as any).title}`);
  });

  console.log('\n✅ Verification complete!\n');
}

verifyImport().catch(console.error);
