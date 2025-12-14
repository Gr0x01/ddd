/**
 * Import Episodes and Restaurants from Wikipedia Cache
 *
 * Reads cached Wikipedia data from Supabase and imports episodes/restaurants
 * into the database.
 *
 * Usage:
 *   # Test with 1 episode
 *   npx tsx scripts/ingestion/import-from-wikipedia.ts --limit 1
 *
 *   # Import latest 40 episodes (2024-2026)
 *   npx tsx scripts/ingestion/import-from-wikipedia.ts --recent
 *
 *   # Import all episodes
 *   npx tsx scripts/ingestion/import-from-wikipedia.ts --all
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CACHE_KEY = 'wikipedia:episodes';

interface CacheData {
  url: string;
  content: string;
  rawContent: string;
}

interface Episode {
  season: number;
  episodeNumber: number;
  overallNumber: number;
  title: string;
  restaurants: Restaurant[];
  airDate: string;
}

interface Restaurant {
  name: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const recent = args.includes('--recent');
const all = args.includes('--all');

async function importFromWikipedia() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📖 Reading Wikipedia cache from Supabase...\n');

  // Fetch cached Wikipedia data
  const { data: cacheRow, error } = await supabase
    .from('cache')
    .select('data, fetched_at')
    .eq('cache_key', CACHE_KEY)
    .single();

  if (error || !cacheRow) {
    console.error('❌ No Wikipedia cache found!');
    console.error('Run: npx tsx scripts/ingestion/cache-wikipedia.ts first\n');
    process.exit(1);
  }

  const cache = cacheRow.data as CacheData;
  console.log(`✅ Cache loaded (fetched at: ${cacheRow.fetched_at})\n`);

  // Parse episodes
  const allEpisodes = parseEpisodes(cache.rawContent);
  console.log(`📊 Parsed ${allEpisodes.length} episodes with ${allEpisodes.reduce((sum, ep) => sum + ep.restaurants.length, 0)} restaurants\n`);

  // Filter episodes based on arguments
  let episodesToImport: Episode[];

  if (limit) {
    episodesToImport = allEpisodes.slice(0, limit);
    console.log(`🎯 Importing ${limit} episode(s) for testing\n`);
  } else if (recent) {
    episodesToImport = allEpisodes.filter(ep =>
      ep.airDate.includes('2024') || ep.airDate.includes('2025') || ep.airDate.includes('2026')
    );
    console.log(`🎯 Importing ${episodesToImport.length} recent episodes (2024-2026)\n`);
  } else if (all) {
    episodesToImport = allEpisodes;
    console.log(`🎯 Importing ALL ${episodesToImport.length} episodes\n`);
  } else {
    console.log('❌ Please specify --limit N, --recent, or --all\n');
    console.log('Examples:');
    console.log('  npx tsx scripts/ingestion/import-from-wikipedia.ts --limit 1');
    console.log('  npx tsx scripts/ingestion/import-from-wikipedia.ts --recent');
    console.log('  npx tsx scripts/ingestion/import-from-wikipedia.ts --all\n');
    process.exit(1);
  }

  // Import to database
  console.log('💾 Starting import...\n');

  let episodesImported = 0;
  let restaurantsImported = 0;

  for (const episode of episodesToImport) {
    console.log(`\n📺 Episode ${episode.season}x${episode.episodeNumber}: ${episode.title}`);
    console.log(`   Air Date: ${episode.airDate}`);
    console.log(`   Restaurants: ${episode.restaurants.length}`);

    // Generate slug for episode
    const episodeSlug = generateSlug(`s${episode.season}e${episode.episodeNumber}-${episode.title}`);

    // Insert episode
    const { data: insertedEpisode, error: episodeError } = await supabase
      .from('episodes')
      .upsert({
        season: episode.season,
        episode_number: episode.episodeNumber,
        title: episode.title,
        slug: episodeSlug,
        air_date: parseAirDate(episode.airDate),
        cities_visited: episode.restaurants.map(r => r.city).filter(Boolean) as string[],
      }, {
        onConflict: 'season,episode_number'
      })
      .select()
      .single();

    if (episodeError) {
      console.error(`   ❌ Error inserting episode: ${episodeError.message}`);
      continue;
    }

    console.log(`   ✅ Episode inserted: ${insertedEpisode.id}`);
    episodesImported++;

    // Insert restaurants
    for (const restaurant of episode.restaurants) {
      const restaurantSlug = generateSlug(restaurant.name);

      console.log(`   🍽️  ${restaurant.name} (${restaurant.location})`);

      // Insert restaurant
      const { data: insertedRestaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .upsert({
          name: restaurant.name,
          slug: restaurantSlug,
          city: restaurant.city || 'Unknown',
          state: restaurant.state,
          country: restaurant.country || 'US',
          first_episode_id: insertedEpisode.id,
          first_air_date: parseAirDate(episode.airDate),
          status: 'unknown',
          enrichment_status: 'pending',
        }, {
          onConflict: 'slug'
        })
        .select()
        .single();

      if (restaurantError) {
        console.error(`      ❌ Error inserting restaurant: ${restaurantError.message}`);
        continue;
      }

      // Link restaurant to episode
      const { error: linkError } = await supabase
        .from('restaurant_episodes')
        .upsert({
          restaurant_id: insertedRestaurant.id,
          episode_id: insertedEpisode.id,
        }, {
          onConflict: 'restaurant_id,episode_id'
        });

      if (linkError) {
        console.error(`      ❌ Error linking restaurant to episode: ${linkError.message}`);
      } else {
        console.log(`      ✅ Linked to episode`);
        restaurantsImported++;
      }
    }
  }

  console.log('\n\n✨ Import Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Episodes imported: ${episodesImported}`);
  console.log(`   Restaurants imported: ${restaurantsImported}\n`);
}

function parseEpisodes(content: string): Episode[] {
  const episodes: Episode[] = [];
  const lines = content.split('\n');
  let currentEpisode: Episode | null = null;
  let currentSeason = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const seasonMatch = line.match(/Season (\d+)/i);
    if (seasonMatch) {
      currentSeason = parseInt(seasonMatch[1]);
      continue;
    }

    if (!line.startsWith('|') || line.includes('---') || line.includes('Total') || line.includes('Episode') || line.includes('Title')) {
      continue;
    }

    const cells = line.split('|').map(c => c.trim()).filter(c => c);

    if (cells.length >= 5) {
      const overallNum = parseInt(cells[0]);
      const episodeNum = parseInt(cells[1]);

      if (!isNaN(overallNum) && !isNaN(episodeNum)) {
        const title = cleanMarkdown(cells[2]);
        const restaurantName = cleanMarkdown(cells[3]);
        const location = cleanMarkdown(cells[4]);
        const airDate = cells.length > 5 ? cells[5].trim() : '';

        const parsedLocation = parseLocation(location);

        currentEpisode = {
          season: currentSeason,
          episodeNumber: episodeNum,
          overallNumber: overallNum,
          title,
          restaurants: [{
            name: restaurantName,
            location,
            ...parsedLocation,
          }],
          airDate,
        };

        episodes.push(currentEpisode);
      }
    } else if (cells.length === 2 && currentEpisode) {
      const restaurantName = cleanMarkdown(cells[0]);
      const location = cleanMarkdown(cells[1]);
      const parsedLocation = parseLocation(location);

      currentEpisode.restaurants.push({
        name: restaurantName,
        location,
        ...parsedLocation,
      });
    }
  }

  return episodes;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function parseLocation(locationStr: string): Partial<Restaurant> {
  const cleaned = locationStr
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();

  const parts = cleaned.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    const city = parts[0];
    const state = parts[1];

    if (parts.length === 3) {
      return { city, state: parts[1], country: parts[2] };
    }

    return { city, state, country: 'USA' };
  }

  return {};
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseAirDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Parse various date formats from Wikipedia
  // "January 5, 2024" or "Dec 16, 2024" etc.
  const cleaned = dateStr.replace(/\([^)]+\)/g, '').trim();

  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

importFromWikipedia().catch(console.error);
