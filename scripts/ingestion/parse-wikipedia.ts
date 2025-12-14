/**
 * Parse Cached Wikipedia Episode Data
 *
 * Reads the cached Wikipedia content from Supabase and extracts episode/restaurant data.
 * This runs against the Supabase cache, no Tavily API calls needed.
 *
 * Usage:
 *   npx tsx scripts/ingestion/parse-wikipedia.ts
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
  location: string; // Raw location string from Wikipedia
  city?: string;
  state?: string;
  country?: string;
}

async function parseWikipedia() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('📖 Reading cached Wikipedia data from Supabase...\n');

    // Fetch from cache table
    const { data: cacheRow, error } = await supabase
      .from('cache')
      .select('data, metadata, fetched_at, expires_at')
      .eq('cache_key', CACHE_KEY)
      .single();

    if (error || !cacheRow) {
      console.error('❌ Cache not found in Supabase!');
      console.error('Run: npx tsx scripts/ingestion/cache-wikipedia.ts first\n');
      console.error(`Error: ${error?.message || 'No data found'}\n`);
      process.exit(1);
    }

    const cache = cacheRow.data as CacheData;

    console.log(`📄 URL: ${cache.url}`);
    console.log(`🕐 Cached at: ${cacheRow.fetched_at}`);
    console.log(`⏰ Expires at: ${cacheRow.expires_at || 'Never'}`);
    console.log(`📊 Raw content size: ${cache.rawContent.length.toLocaleString()} characters\n`);

    // Parse episodes (use 'rawContent' which has full data)
    const episodes = parseEpisodes(cache.rawContent);

    console.log(`\n📊 Parsing Results:`);
    console.log(`   Total episodes found: ${episodes.length}`);
    console.log(`   Total restaurants: ${episodes.reduce((sum, ep) => sum + ep.restaurants.length, 0)}\n`);

    // Show recent episodes (2024-2025)
    const recentEpisodes = episodes.filter(ep =>
      ep.airDate.includes('2024') || ep.airDate.includes('2025') || ep.airDate.includes('2026')
    );

    console.log(`📅 Recent Episodes (2024-2026): ${recentEpisodes.length} found\n`);

    recentEpisodes.slice(0, 10).forEach(ep => {
      console.log(`Season ${ep.season}, Ep ${ep.episodeNumber} (#${ep.overallNumber})`);
      console.log(`   Title: ${ep.title}`);
      console.log(`   Air Date: ${ep.airDate}`);
      ep.restaurants.forEach(r => {
        console.log(`   - ${r.name} (${r.location})`);
      });
      console.log();
    });

    return episodes;

  } catch (error) {
    console.error('❌ Error parsing Wikipedia data:', error);
    throw error;
  }
}

function parseEpisodes(content: string): Episode[] {
  const episodes: Episode[] = [];

  // Use the cleaner 'content' field which has better formatting
  // Episodes can have multiple restaurants
  // Format:
  //   | 553 | 1 | Funky Fresh | Tortello | Chicago, Illinois | December 27, 2024 |
  //   | Wally & Buck | Missoula, Montana |  (additional restaurant)
  //   | Backwoods Crossing | Tallahassee, Florida |  (additional restaurant)

  const lines = content.split('\n');
  let currentEpisode: Episode | null = null;
  let currentSeason = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect season headers (Season 41, Season 42, etc.)
    const seasonMatch = line.match(/Season (\d+)/i);
    if (seasonMatch) {
      currentSeason = parseInt(seasonMatch[1]);
      continue;
    }

    // Skip header/separator rows
    if (!line.startsWith('|') || line.includes('---') || line.includes('Total') || line.includes('Episode') || line.includes('Title')) {
      continue;
    }

    const cells = line.split('|').map(c => c.trim()).filter(c => c);

    // Check if this is a new episode row (has 6 cells) or additional restaurant (has 2 cells)
    if (cells.length >= 5) {
      // Try to parse as episode row: | overallNum | episodeNum | title | restaurant | location | date |
      const overallNum = parseInt(cells[0]);
      const episodeNum = parseInt(cells[1]);

      if (!isNaN(overallNum) && !isNaN(episodeNum)) {
        // This is a new episode
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
      // Additional restaurant for current episode: | Restaurant | Location |
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
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links [text](url) -> text
    .trim();
}

function parseLocation(locationStr: string): Partial<Restaurant> {
  // Clean up location string
  const cleaned = locationStr
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .trim();

  // Try to parse City, State pattern
  const parts = cleaned.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    const city = parts[0];
    const state = parts[1];

    // Check if it's international (has country)
    if (parts.length === 3) {
      return { city, state: parts[1], country: parts[2] };
    }

    return { city, state, country: 'USA' };
  }

  return {};
}

parseWikipedia();
