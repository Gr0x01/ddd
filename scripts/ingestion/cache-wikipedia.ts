/**
 * Cache Wikipedia Episode List
 *
 * Fetches the full Wikipedia episode list and caches it in Supabase.
 * Run this script daily/weekly to refresh the cache.
 *
 * Usage:
 *   npx tsx scripts/ingestion/cache-wikipedia.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/List_of_Diners,_Drive-Ins_and_Dives_episodes';
const CACHE_KEY = 'wikipedia:episodes';
const CACHE_TYPE = 'wikipedia';

interface CacheData {
  url: string;
  content: string;
  rawContent: string;
}

async function cacheWikipedia() {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY is required');
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Fetching Wikipedia episode list...');
  console.log(`📄 URL: ${WIKIPEDIA_URL}\n`);

  try {
    // Fetch from Tavily
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: `site:wikipedia.org "List of Diners, Drive-Ins and Dives episodes"`,
        search_depth: 'advanced',
        include_raw_content: true,
        max_results: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('No Wikipedia results found');
    }

    const result = data.results[0];

    // Prepare cache data
    const cacheData: CacheData = {
      url: result.url,
      content: result.content || '',
      rawContent: result.raw_content || '',
    };

    const fetchedAt = new Date().toISOString();

    // Upsert to Supabase cache table
    const { error } = await supabase
      .from('cache')
      .upsert({
        cache_key: CACHE_KEY,
        cache_type: CACHE_TYPE,
        data: cacheData,
        metadata: { url: WIKIPEDIA_URL },
        fetched_at: fetchedAt,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('✅ Wikipedia data cached successfully in Supabase!');
    console.log(`🔑 Cache key: ${CACHE_KEY}`);
    console.log(`📊 Content size: ${cacheData.rawContent.length.toLocaleString()} characters`);
    console.log(`🕐 Fetched at: ${fetchedAt}`);
    console.log(`⏰ Expires in: 7 days\n`);

    // Preview
    console.log('📋 Content preview (first 1000 chars):');
    console.log(cacheData.rawContent.substring(0, 1000));
    console.log('...\n');

  } catch (error) {
    console.error('❌ Error caching Wikipedia data:', error);
    throw error;
  }
}

cacheWikipedia();
