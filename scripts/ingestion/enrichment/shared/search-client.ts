import { searchTavily, TavilyResult, TavilyResponse, getCacheStats, invalidateCache } from './tavily-client';

export interface SearchResult {
  query: string;
  results: TavilyResult[];
  fromCache: boolean;
  cachedAt?: Date;
  searchType: SearchType;
}

export type SearchType = 'restaurant' | 'episode' | 'status' | 'city';

export interface CacheStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  expired: number;
}

const TTL_DAYS = {
  restaurant: 90,
  episode: 180,
  status: 7,
  city: 90,
};

async function executeSearch(
  query: string,
  searchType: SearchType,
  entityId?: string,
  entityName?: string
): Promise<SearchResult> {
  const entityType = searchType === 'status' ? 'restaurant' : searchType;
  const response = await searchTavily(query, {
    entityType: entityType as 'restaurant' | 'episode' | 'city',
    entityId,
    entityName,
    ttlDays: TTL_DAYS[searchType],
  });

  return {
    query: response.query,
    results: response.results,
    fromCache: response.fromCache,
    cachedAt: response.cachedAt,
    searchType,
  };
}

export async function searchRestaurant(
  restaurantName: string,
  city: string,
  state?: string,
  restaurantId?: string
): Promise<SearchResult> {
  const location = state ? `${city}, ${state}` : city;
  const query = `${restaurantName} ${location} Diners Drive-ins Dives Guy Fieri cuisine menu featured`;
  return executeSearch(query, 'restaurant', restaurantId, restaurantName);
}

export async function searchStatus(
  restaurantName: string,
  city: string,
  state?: string,
  restaurantId?: string
): Promise<SearchResult> {
  const location = state ? `${city}, ${state}` : city;
  const query = `${restaurantName} ${location} restaurant open closed status 2024 2025`;
  return executeSearch(query, 'status', restaurantId, restaurantName);
}

export async function searchEpisode(
  season: number,
  episodeNumber: number,
  episodeTitle: string,
  episodeId?: string
): Promise<SearchResult> {
  const query = `Diners Drive-ins Dives Season ${season} Episode ${episodeNumber} ${episodeTitle} Guy Fieri restaurants`;
  return executeSearch(query, 'episode', episodeId, episodeTitle);
}

export async function searchCityDDD(
  city: string,
  state: string,
  cityId?: string
): Promise<SearchResult> {
  const query = `Diners Drive-ins Dives ${city} ${state} Guy Fieri restaurants featured`;
  return executeSearch(query, 'city', cityId, `${city}, ${state}`);
}

export function combineSearchResults(results: SearchResult[]): string {
  const allContent: string[] = [];

  for (const result of results) {
    for (const item of result.results) {
      allContent.push(`Source: ${item.title}\nURL: ${item.url}\n${item.content}`);
    }
  }

  return allContent.join('\n\n---\n\n');
}

export function combineSearchResultsCompact(results: SearchResult[], maxLength: number = 12000): string {
  const allContent: string[] = [];
  let currentLength = 0;

  outer: for (const result of results) {
    for (const item of result.results) {
      const entry = `[${item.title}]\n${item.content}`;
      if (currentLength + entry.length > maxLength) {
        break outer;
      }
      allContent.push(entry);
      currentLength += entry.length;
    }
  }

  return allContent.join('\n\n');
}

export { getCacheStats, invalidateCache };
export type { TavilyResult };
