import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getTavilyLimiter } from './rate-limiter';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
    }
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilyResponse {
  results: TavilyResult[];
  query: string;
  fromCache: boolean;
  cachedAt?: Date;
}

export interface CacheOptions {
  entityType: 'restaurant' | 'episode' | 'city';
  entityId?: string;
  entityName?: string;
  ttlDays?: number;
}

const DEFAULT_TTL_DAYS: Record<CacheOptions['entityType'], number> = {
  restaurant: 30,
  episode: 180,
  city: 90,
};

function hashQuery(query: string): string {
  // Use SHA256 instead of MD5 to prevent hash collision attacks
  return crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
}

async function getCachedResults(queryHash: string): Promise<TavilyResponse | null> {
  const { data, error } = await getSupabase()
    .from('cache')
    .select('*')
    .eq('query_hash', queryHash)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    results: data.results as TavilyResult[],
    query: data.query,
    fromCache: true,
    cachedAt: new Date(data.fetched_at),
  };
}

async function cacheResults(
  query: string,
  queryHash: string,
  results: TavilyResult[],
  options: CacheOptions
): Promise<void> {
  const ttlDays = options.ttlDays ?? DEFAULT_TTL_DAYS[options.entityType];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await getSupabase().from('cache').insert({
    entity_type: options.entityType,
    entity_id: options.entityId || null,
    entity_name: options.entityName || null,
    query,
    query_hash: queryHash,
    results,
    result_count: results.length,
    source: 'tavily',
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });
}

export async function searchTavily(
  query: string,
  options: CacheOptions & { skipCache?: boolean; maxResults?: number } = { entityType: 'restaurant' }
): Promise<TavilyResponse> {
  const queryHash = hashQuery(query);

  if (!options.skipCache) {
    const cached = await getCachedResults(queryHash);
    if (cached) {
      console.log(`      📦 Cache hit: "${query.substring(0, 40)}..."`);
      return cached;
    }
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not set');
  }

  console.log(`      🔍 Tavily search: "${query.substring(0, 40)}..."`);

  // Use rate limiter and add 30s timeout
  const rateLimiter = getTavilyLimiter();
  const response = await rateLimiter.add(async () => {
    return fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_raw_content: true,
        max_results: options.maxResults ?? 10,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const results: TavilyResult[] = data.results || [];

  await cacheResults(query, queryHash, results, options);

  return {
    results,
    query,
    fromCache: false,
  };
}

export async function searchRestaurantDetails(
  restaurantName: string,
  city: string,
  state?: string,
  restaurantId?: string
): Promise<TavilyResponse> {
  const location = state ? `${city}, ${state}` : city;
  return searchTavily(
    `${restaurantName} ${location} Diners Drive-ins Dives Guy Fieri restaurant cuisine menu`,
    {
      entityType: 'restaurant',
      entityId: restaurantId,
      entityName: restaurantName,
      ttlDays: 90,
    }
  );
}

export async function searchRestaurantStatus(
  restaurantName: string,
  city: string,
  state?: string,
  restaurantId?: string
): Promise<TavilyResponse> {
  const location = state ? `${city}, ${state}` : city;
  return searchTavily(`${restaurantName} ${location} restaurant open closed status 2024 2025`, {
    entityType: 'restaurant',
    entityId: restaurantId,
    entityName: restaurantName,
    ttlDays: 7, // Short TTL for status checks
  });
}

export async function searchEpisodeDetails(
  season: number,
  episodeNumber: number,
  episodeTitle: string,
  episodeId?: string
): Promise<TavilyResponse> {
  return searchTavily(
    `Diners Drive-ins Dives Season ${season} Episode ${episodeNumber} ${episodeTitle} Guy Fieri restaurants featured`,
    {
      entityType: 'episode',
      entityId: episodeId,
      entityName: episodeTitle,
      ttlDays: 180,
    }
  );
}

export async function searchCityRestaurants(
  city: string,
  state: string,
  cityId?: string
): Promise<TavilyResponse> {
  return searchTavily(`Diners Drive-ins Dives ${city} ${state} Guy Fieri restaurants featured`, {
    entityType: 'city',
    entityId: cityId,
    entityName: `${city}, ${state}`,
    ttlDays: 90,
  });
}

export async function getCacheStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  expired: number;
}> {
  const { data: all } = await getSupabase()
    .from('cache')
    .select('entity_type, source, expires_at');

  if (!all) return { total: 0, byType: {}, bySource: {}, expired: 0 };

  const now = new Date();
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let expired = 0;

  for (const row of all) {
    byType[row.entity_type] = (byType[row.entity_type] || 0) + 1;
    bySource[row.source] = (bySource[row.source] || 0) + 1;
    if (row.expires_at && new Date(row.expires_at) < now) expired++;
  }

  return { total: all.length, byType, bySource, expired };
}

export async function invalidateCache(entityType: string, entityId: string): Promise<number> {
  const { data } = await getSupabase()
    .from('cache')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .select('id');

  return data?.length || 0;
}
