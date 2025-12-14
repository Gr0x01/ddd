#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get restaurants from seasons 33-42 WITHOUT Google Places data
  const { data } = await supabase
    .from('restaurant_episodes')
    .select(`
      restaurant_id,
      restaurants!inner (id, name, city, state, google_place_id, google_rating, status, address),
      episodes!inner (season, episode_number, title)
    `)
    .gte('episodes.season', 33)
    .lte('episodes.season', 42);

  if (!data) {
    console.log('No data found');
    return;
  }

  const restaurantMap = new Map();
  data.forEach((link: any) => {
    const rest = link.restaurants;
    if (!rest.google_place_id) {
      if (!restaurantMap.has(rest.id)) {
        restaurantMap.set(rest.id, {
          ...rest,
          episodes: []
        });
      }
      restaurantMap.get(rest.id).episodes.push({
        season: link.episodes.season,
        number: link.episodes.episode_number,
        title: link.episodes.title
      });
    }
  });

  const missing = Array.from(restaurantMap.values());

  console.log(`\n❌ Restaurants Missing Google Places Data (Seasons 33-42)\n`);
  console.log(`Total: ${missing.length}\n`);

  missing.forEach((r: any, i: number) => {
    const episodes = r.episodes.map((e: any) => `S${e.season}E${e.number}`).join(', ');
    console.log(`${i + 1}. ${r.name} (${r.city}, ${r.state || 'Unknown'})`);
    console.log(`   Status: ${r.status}, Has Address: ${r.address ? 'YES' : 'NO'}`);
    console.log(`   Episodes: ${episodes}`);
    console.log(``);
  });
}

main();
