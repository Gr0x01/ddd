import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

// Supabase client configuration for frontend
// IMPORTANT: Only uses anonymous key - never expose service role key to client
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Create Supabase client with anonymous key
// This client respects Row Level Security (RLS) policies
let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false, // No user auth needed for this read-only app
      },
      realtime: {
        params: {
          eventsPerSecond: 10 // Rate limit for realtime if needed later
        }
      }
    });
  }
  return _supabase;
}

// Export the getter function, not the result
export { getSupabaseClient as supabase };

// Type definitions for our database schema
export interface Episode {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  slug: string;
  air_date: string | null;
  description: string | null;
  episode_summary: string | null;
  cities_visited: string[] | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cuisine {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_description: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;

  // Location
  address: string | null;
  city: string;
  state: string | null;
  zip: string | null;
  country: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  location?: any; // PostGIS geography(POINT, 4326) - auto-generated from lat/lng

  // Contact
  phone: string | null;
  website_url: string | null;
  social_urls: Record<string, string> | null;

  // Hours
  hours_json: Record<string, any> | null;
  hours_notes: string | null;

  // Status & Verification
  status: 'open' | 'closed' | 'unknown';
  closed_date: string | null;
  last_verified: string | null;
  verification_source: string | null;

  // Episode Info
  first_episode_id: string | null;
  first_air_date: string | null;

  // Content
  description: string | null;
  dishes_featured: string[] | null;
  guy_quote: string | null;

  // Media
  photo_url: string | null;
  photos: string[] | null;

  // Ratings
  google_rating: number | null;
  yelp_rating: number | null;
  google_review_count: number | null;
  google_place_id: string | null;

  // SEO
  meta_description: string | null;

  // Pricing
  price_tier: '$' | '$$' | '$$$' | '$$$$' | null;

  // Enrichment tracking
  enrichment_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_enriched_at: string | null;

  // Admin
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  restaurant_id: string;
  episode_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  guy_reaction: string | null;
  is_signature_dish: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state_id: string | null;
  state_name: string;
  restaurant_count?: number;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  restaurant_count?: number;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

// Combined type for restaurant with episode info
export interface RestaurantWithEpisodes extends Restaurant {
  episodes?: Episode[];
  cuisines?: Cuisine[];
  dishes?: Dish[];
  first_episode?: Episode | null;
}

// Map pin type (compatible with RestaurantMapPins component)
export interface MapPin {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string | null;
  price_tier: string | null;
  status: string;
  chef_name: string;
  chef_slug: string;
}

// Route cache type
export interface RouteCache {
  id: string;
  origin_place_id: string;
  destination_place_id: string;
  origin_text: string;
  destination_text: string;
  polyline: string;
  polyline_points: Array<{ lat: number; lng: number }>;
  distance_meters: number;
  duration_seconds: number;
  route_geography: any;
  hit_count: number;
  created_at: string;
  expires_at: string;
  // New metadata fields for curated routes
  slug?: string | null;
  is_curated?: boolean;
  view_count?: number;
  description?: string | null;
  map_image_url?: string | null;
  title?: string | null;
}

// Route with restaurant count for display
export interface RouteWithRestaurantCount extends RouteCache {
  restaurant_count: number;
}

// Restaurant with distance from route (from get_restaurants_near_route function)
export interface RestaurantNearRoute {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  status: 'open' | 'closed' | 'unknown';
  price_tier: string | null;
  description: string | null;
  photo_url: string | null;
  photos: string[] | null;
  google_rating: number | null;
  google_review_count: number | null;
  cuisine_tags: string[] | null;
  distance_miles: number;
}

// Database helper functions
export const db = {
  // Get all episodes
  async getEpisodes() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('episodes')
      .select('*')
      .order('season', { ascending: false })
      .order('episode_number', { ascending: false });

    if (error) throw error;
    return data as Episode[];
  },

  // Get episode by slug
  async getEpisode(slug: string): Promise<Episode | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('episodes')
      .select(`
        *,
        restaurants:restaurant_episodes(
          restaurant:restaurants(*)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Episode;
  },

  // Get all restaurants
  async getRestaurants() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .order('name')
      .limit(5000);

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Get restaurants for map (lightweight)
  async getMapPins(): Promise<MapPin[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select('id, slug, name, latitude, longitude, city, state, price_tier, status')
      .eq('is_public', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;
    return (data as any[]).map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      city: r.city,
      state: r.state,
      price_tier: r.price_tier,
      status: r.status,
      chef_name: 'Guy Fieri',  // DDD is all Guy Fieri
      chef_slug: 'guy-fieri'
    }));
  },

  // Get restaurants by city (and optionally state)
  async getRestaurantsByCity(city: string, state?: string) {
    const client = getSupabaseClient();
    let query = client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .eq('city', city);

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Get restaurants by state
  async getRestaurantsByState(state: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .eq('state', state)
      .order('city')
      .order('name');

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Search restaurants by name or city
  async searchRestaurants(query: string) {
    const client = getSupabaseClient();
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .or(`name.ilike.%${sanitizedQuery}%,city.ilike.%${sanitizedQuery}%`)
      .order('name');

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Get restaurants by episode ID
  async getRestaurantsByEpisode(episodeId: string): Promise<Restaurant[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurant_episodes')
      .select(`
        restaurant:restaurants(
          *,
          first_episode:episodes!first_episode_id(*),
          restaurant_episodes(
            episode:episodes(*)
          ),
          restaurant_cuisines(
            cuisine:cuisines(*)
          )
        )
      `)
      .eq('episode_id', episodeId);

    if (error) throw error;

    // Extract restaurants from junction table and transform
    const restaurants = (data as Array<{ restaurant: any }>)
      .map((item) => item.restaurant)
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return transformRestaurants(restaurants);
  },

  // Get restaurant by slug
  async getRestaurant(slug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        ),
        dishes(*)
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (error) throw error;
    const transformed = transformRestaurants([data]);
    return transformed[0];
  },

  // Get stats for homepage
  async getStats() {
    const client = getSupabaseClient();
    const [restaurantsResult, openResult, episodesResult, citiesResult] = await Promise.all([
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true),
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true).eq('status', 'open'),
      client.from('episodes').select('id', { count: 'exact', head: true }),
      client.from('cities').select('id', { count: 'exact', head: true })
    ]);

    return {
      restaurants: restaurantsResult.count || 0,
      openRestaurants: openResult.count || 0,
      episodes: episodesResult.count || 0,
      cities: citiesResult.count || 0
    };
  },

  // Get featured restaurants (for homepage)
  async getFeaturedRestaurants(limit: number = 12) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .eq('status', 'open')
      .not('google_rating', 'is', null)
      .not('photos', 'eq', '[]') // Filter for restaurants with photos
      .order('google_rating', { ascending: false })
      .limit(limit * 3); // Get more than needed for randomization

    if (error) throw error;

    const restaurants = transformRestaurants(data);

    // Shuffle for randomization
    for (let i = restaurants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [restaurants[i], restaurants[j]] = [restaurants[j], restaurants[i]];
    }

    return restaurants.slice(0, limit);
  },

  // Get cities with restaurant counts
  async getCitiesWithCounts() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cities')
      .select(`
        *,
        restaurants(count)
      `)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get states with restaurant counts
  async getStatesWithCounts() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('states')
      .select(`
        *,
        restaurants(count)
      `)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get recent episodes
  async getRecentEpisodes(limit: number = 10) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('episodes')
      .select('*')
      .order('air_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Episode[];
  },

  // Get city by slug
  async getCity(state: string, city: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('state_name', state)
      .eq('slug', city)
      .single();

    if (error) throw error;
    return data as City;
  },

  // Get state by slug
  async getState(slug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('states')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as State;
  },

  // Get cities by state
  async getCitiesByState(state: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('state_name', state)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get all states
  async getStates() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('states')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as State[];
  },

  // Get all cities
  async getCities() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cities')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as City[];
  },

  // Get all cuisines
  async getCuisines() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cuisines')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Cuisine[];
  },

  // Get cuisines with restaurant counts (efficient - counts at DB level)
  async getCuisinesWithCounts() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cuisines')
      .select(`
        *,
        restaurant_cuisines(count)
      `)
      .order('name');

    if (error) throw error;
    if (!data) return [];

    return data.map((c: any) => ({
      ...(c as Cuisine),
      restaurantCount: c.restaurant_cuisines?.[0]?.count || 0
    })).filter(c => c.restaurantCount > 0);
  },

  // Get cuisine by slug
  async getCuisine(slug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cuisines')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Cuisine;
  },

  // Get restaurants by cuisine
  async getRestaurantsByCuisine(cuisineSlug: string) {
    const client = getSupabaseClient();
    const { data, error} = await client
      .from('restaurants')
      .select(`
        *,
        restaurant_cuisines!inner(
          cuisine:cuisines!inner(slug)
        )
      `)
      .eq('restaurant_cuisines.cuisine.slug', cuisineSlug)
      .eq('is_public', true)
      .order('name');

    if (error) throw error;
    return data as Restaurant[];
  },

  // ============================================
  // EFFICIENT QUERY METHODS (Optimized for specific use cases)
  // ============================================

  // Get top restaurants by state (for "More in State" section)
  // Much more efficient than fetching ALL restaurants and filtering
  async getTopRestaurantsByState(
    stateAbbreviation: string,
    excludeId?: string,
    limit: number = 6
  ): Promise<RestaurantWithEpisodes[]> {
    const client = getSupabaseClient();

    let query = client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .eq('state', stateAbbreviation)
      .order('google_rating', { ascending: false, nullsFirst: false });

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    // Apply limit after exclusion filter (neq happens in DB)
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Get restaurant counts by state (for /states page)
  // Returns aggregated counts instead of full records
  async getRestaurantCountsByState(): Promise<{ state: string; count: number }[]> {
    const client = getSupabaseClient();

    // Use a raw SQL query via RPC for efficient GROUP BY
    // Fallback to client-side aggregation if RPC not available
    const { data, error } = await client
      .from('restaurants')
      .select('state')
      .eq('is_public', true)
      .not('state', 'is', null);

    if (error) throw error;

    // Aggregate counts client-side (still more efficient than fetching full records)
    const counts: Record<string, number> = {};
    // Type assertion needed because Supabase can't infer types for partial selects
    const rows = (data || []) as Array<{ state: string | null }>;
    for (const row of rows) {
      const state = row.state;
      if (state) {
        counts[state] = (counts[state] || 0) + 1;
      }
    }

    return Object.entries(counts).map(([state, count]) => ({ state, count }));
  },

  // Get restaurants by status (for /still-open and /closed pages)
  // More efficient than fetching ALL and filtering client-side
  async getRestaurantsByStatus(status: 'open' | 'closed'): Promise<RestaurantWithEpisodes[]> {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        first_episode:episodes!first_episode_id(*),
        restaurant_episodes(
          episode:episodes(*)
        ),
        restaurant_cuisines(
          cuisine:cuisines(*)
        )
      `)
      .eq('is_public', true)
      .eq('status', status)
      .order('name');

    if (error) throw error;
    return transformRestaurants(data);
  },

  // Get restaurant stats for metadata (just counts, no full records)
  async getRestaurantStats(): Promise<{ total: number; open: number; closed: number }> {
    const client = getSupabaseClient();

    const [totalResult, openResult, closedResult] = await Promise.all([
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true),
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true).eq('status', 'open'),
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true).eq('status', 'closed'),
    ]);

    return {
      total: totalResult.count || 0,
      open: openResult.count || 0,
      closed: closedResult.count || 0,
    };
  },

  // ============================================
  // ROAD TRIP PLANNER METHODS
  // ============================================

  // Normalize location text for consistent cache lookups
  _normalizeLocation(location: string): string {
    if (!location || typeof location !== 'string') {
      throw new Error('Location must be a non-empty string');
    }

    const normalized = location
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace

    if (normalized.length === 0) {
      throw new Error('Location cannot be empty');
    }

    if (normalized.length > 200) {
      throw new Error('Location name too long');
    }

    return normalized;
  },

  // Find cached route by text (checks before calling Google API)
  async findCachedRouteByText(
    origin: string,
    destination: string
  ): Promise<RouteCache | null> {
    const client = getSupabaseClient();

    // Normalize inputs for consistent cache matching
    const normalizedOrigin = this._normalizeLocation(origin);
    const normalizedDest = this._normalizeLocation(destination);

    // Query database with LOWER() for case-insensitive exact match
    // This uses the database index instead of fetching all routes
    const { data, error } = await client
      .from('route_cache')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .limit(100); // Safety limit to prevent huge result sets

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data || data.length === 0) return null;

    // Find matching route by normalized text
    // Note: Doing client-side filtering for now since Supabase doesn't support LOWER() in queries
    // TODO: Add migration to create normalized text columns with index
    const match = data.find((route: any) => {
      const cachedOrigin = this._normalizeLocation(route.origin_text);
      const cachedDest = this._normalizeLocation(route.destination_text);
      return cachedOrigin === normalizedOrigin && cachedDest === normalizedDest;
    });

    if (!match) return null;

    // Update access tracking (fire-and-forget, don't block response)
    void (async () => {
      try {
        await client
          .from('route_cache')
          // @ts-expect-error - route_cache table not in generated types yet
          .update({
            last_accessed_at: new Date().toISOString(),
            // @ts-expect-error
            hit_count: match.hit_count + 1
          })
          // @ts-expect-error
          .eq('id', match.id);
      } catch (err) {
        console.error('Failed to update cache hit count:', err);
      }
    })();

    return match as RouteCache;
  },

  // Find cached route by place IDs (fallback for when we already have place IDs)
  async findCachedRoute(
    originPlaceId: string,
    destinationPlaceId: string
  ): Promise<RouteCache | null> {
    const client = getSupabaseClient();

    // TODO: Regenerate Supabase types after running migration 003
    const { data, error } = await client
      .from('route_cache')
      .select('*')
      .eq('origin_place_id', originPlaceId)
      .eq('destination_place_id', destinationPlaceId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Update access tracking
    await client
      .from('route_cache')
      // @ts-expect-error - route_cache table not in generated types yet
      .update({
        last_accessed_at: new Date().toISOString(),
        // @ts-expect-error
        hit_count: data.hit_count + 1
      })
      // @ts-expect-error
      .eq('id', data.id);

    return data as RouteCache;
  },

  // Save route to cache
  async saveRoute(
    origin: string,
    destination: string,
    directionsResponse: {
      polyline: string;
      polylinePoints: Array<{ lat: number; lng: number }>;
      distanceMeters: number;
      durationSeconds: number;
      originPlaceId: string;
      destinationPlaceId: string;
      bounds: any;
    }
  ): Promise<string> {
    const client = getSupabaseClient();

    // Convert polyline points to PostGIS LINESTRING text format
    const linestringText = `LINESTRING(${directionsResponse.polylinePoints
      .map((p) => `${p.lng} ${p.lat}`)
      .join(',')})`;

    // Use RPC function to insert with proper PostGIS geography conversion
    // @ts-expect-error - insert_route_cache function not in generated types yet
    const { data, error } = await client.rpc('insert_route_cache', {
      p_origin_place_id: directionsResponse.originPlaceId,
      p_destination_place_id: directionsResponse.destinationPlaceId,
      p_origin_text: origin,
      p_destination_text: destination,
      p_polyline: directionsResponse.polyline,
      p_polyline_points: directionsResponse.polylinePoints,
      p_distance_meters: directionsResponse.distanceMeters,
      p_duration_seconds: directionsResponse.durationSeconds,
      p_linestring_text: linestringText,
      p_google_response: directionsResponse
    });

    if (error) {
      // Handle duplicate place ID constraint violation (unique constraint on origin_place_id + destination_place_id)
      if (error.code === '23505') {
        // Route already exists in cache, find and return existing ID
        const existing = await this.findCachedRoute(
          directionsResponse.originPlaceId,
          directionsResponse.destinationPlaceId
        );
        if (existing) return existing.id;
      }
      throw error;
    }

    // data is the UUID returned by the function
    return data as string;
  },

  // Get restaurants near a cached route
  async getRestaurantsNearRoute(
    routeId: string,
    radiusMiles: number = 10
  ): Promise<RestaurantNearRoute[]> {
    const client = getSupabaseClient();

    // TODO: Regenerate Supabase types after running migration 003
    // @ts-expect-error - get_restaurants_near_route function not in generated types yet
    const { data, error } = await client.rpc('get_restaurants_near_route', {
      route_id: routeId,
      radius_miles: radiusMiles
    });

    if (error) throw error;
    return data as RestaurantNearRoute[];
  },

  // Get a route by its slug (for curated route pages)
  async getRouteBySlug(slug: string): Promise<RouteCache | null> {
    // Validate slug format (lowercase alphanumeric, hyphens only)
    if (!slug || typeof slug !== 'string') return null;
    if (!/^[a-z0-9-]+$/.test(slug)) return null;
    if (slug.length > 100) return null; // Reasonable max length

    const client = getSupabaseClient();
    const { data, error} = await client
      .from('route_cache')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as RouteCache;
  },

  // Get all curated routes for homepage
  async getCuratedRoutes(): Promise<RouteCache[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('route_cache')
      .select('*')
      .eq('is_curated', true)
      .order('created_at', { ascending: true }); // Keep in order they were added

    if (error) throw error;
    return (data || []) as RouteCache[];
  },

  // Increment view count for a route page (atomic to prevent race conditions)
  async incrementRouteViews(routeId: string): Promise<void> {
    const client = getSupabaseClient();

    // Use RPC function for atomic increment
    // @ts-expect-error - increment_route_views function not in generated types yet
    const { error } = await client.rpc('increment_route_views', {
      route_id: routeId
    });

    if (error) {
      // Log but don't throw - view count is non-critical
      console.error('Failed to increment route views:', error);
    }
  },

  // Get all routes (curated first, then user-generated) with restaurant counts
  // Uses efficient single-query RPC function
  async getRoutesForDisplay(limit: number = 20): Promise<RouteWithRestaurantCount[]> {
    const client = getSupabaseClient();

    // Use RPC function for efficient single-query with counts
    // @ts-expect-error - get_routes_with_counts function not in generated types
    const { data, error } = await client.rpc('get_routes_with_counts', {
      p_limit: limit,
      p_curated_only: false,
      p_radius_miles: 15
    });

    if (error) {
      console.error('Error fetching routes with counts:', error);
      // Fallback to basic query without counts
      return this.getRoutesBasic(limit);
    }

    return (data || []) as RouteWithRestaurantCount[];
  },

  // Get curated routes only with restaurant counts
  async getCuratedRoutesWithCounts(): Promise<RouteWithRestaurantCount[]> {
    const client = getSupabaseClient();

    // @ts-expect-error - get_routes_with_counts function not in generated types
    const { data, error } = await client.rpc('get_routes_with_counts', {
      p_limit: 10,
      p_curated_only: true,
      p_radius_miles: 15
    });

    if (error) {
      console.error('Error fetching curated routes:', error);
      return [];
    }

    return (data || []) as RouteWithRestaurantCount[];
  },

  // Get user-generated routes (non-curated) sorted by popularity
  async getUserRoutes(limit: number = 12): Promise<RouteWithRestaurantCount[]> {
    const client = getSupabaseClient();

    // @ts-expect-error - get_routes_with_counts function not in generated types
    const { data, error } = await client.rpc('get_routes_with_counts', {
      p_limit: limit + 10, // Fetch extra to filter out curated
      p_curated_only: false,
      p_radius_miles: 15
    });

    if (error) {
      console.error('Error fetching user routes:', error);
      return [];
    }

    // Filter out curated routes and limit
    const routes = data as RouteWithRestaurantCount[] | null;
    const userRoutes = (routes || [])
      .filter((r) => !r.is_curated)
      .slice(0, limit);

    return userRoutes;
  },

  // Fallback: basic route query without counts (if RPC fails)
  async getRoutesBasic(limit: number = 20): Promise<RouteWithRestaurantCount[]> {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('route_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('is_curated', { ascending: false, nullsFirst: false })
      .order('view_count', { ascending: false, nullsFirst: true })
      .order('hit_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Return with 0 counts as fallback
    const routes = data as RouteCache[] | null;
    return (routes || []).map(r => ({ ...r, restaurant_count: 0 }));
  },

  // Get all routes with slugs for sitemap (both curated and user-generated)
  async getAllRoutesWithSlugs(): Promise<RouteCache[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('route_cache')
      .select('*')
      .not('slug', 'is', null) // Only routes with slugs
      .gt('expires_at', new Date().toISOString()) // Not expired
      .order('is_curated', { ascending: false }) // Curated first
      .order('view_count', { ascending: false, nullsFirst: true })
      .limit(100); // Cap for sitemap size

    if (error) throw error;
    return (data || []) as RouteCache[];
  },

  // Generate a slug from origin/destination text
  generateRouteSlug(origin: string, destination: string): string {
    // Validate inputs
    if (!origin || !destination || typeof origin !== 'string' || typeof destination !== 'string') {
      throw new Error('Origin and destination are required strings');
    }
    if (origin.length > 200 || destination.length > 200) {
      throw new Error('Location names too long');
    }

    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/,\s*(ca|ny|tx|fl|il|pa|oh|ga|nc|mi|nj|va|wa|az|ma|tn|in|mo|md|wi|mn|co|al|sc|la|ky|or|ok|ct|ut|ia|nv|ar|ms|ks|nm|ne|wv|id|hi|nh|me|mt|ri|de|sd|nd|ak|vt|dc|wy)$/i, '') // Remove state abbreviation
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 30); // Limit length
    };

    const originSlug = normalize(origin);
    const destSlug = normalize(destination);

    // Ensure valid slugs were generated
    if (!originSlug || !destSlug) {
      throw new Error('Failed to generate valid slug from locations');
    }

    return `${originSlug}-to-${destSlug}`;
  },

  // Update route with auto-generated slug (for user routes without slugs)
  async ensureRouteHasSlug(routeId: string, origin: string, destination: string): Promise<string | null> {
    const client = getSupabaseClient();

    // First check if route already has a slug
    const { data: existing } = await client
      .from('route_cache')
      .select('slug')
      .eq('id', routeId)
      .single();

    const existingRoute = existing as { slug: string | null } | null;
    if (existingRoute?.slug) {
      return existingRoute.slug;
    }

    // Generate a slug with short unique suffix to avoid race conditions
    // Using base36 timestamp + random chars for uniqueness without database lookups
    const baseSlug = this.generateRouteSlug(origin, destination);
    const uniqueSuffix = Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(-2);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // Update the route with the slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('route_cache')
      .update({ slug, title: `${origin.split(',')[0]} to ${destination.split(',')[0]}` })
      .eq('id', routeId);

    if (error) {
      console.error('Failed to set route slug:', error);
      return null;
    }

    return slug;
  },
};

// Helper function to transform restaurant data
function transformRestaurants(data: any[]): RestaurantWithEpisodes[] {
  return data.map((r: any) => {
    const episodes = (r.restaurant_episodes || [])
      .map((re: any) => re.episode)
      .filter(Boolean);

    const cuisines = (r.restaurant_cuisines || [])
      .map((rc: any) => rc.cuisine)
      .filter(Boolean);

    return {
      ...r,
      episodes,
      cuisines,
      // Remove nested junction table data
      restaurant_episodes: undefined,
      restaurant_cuisines: undefined,
    };
  });
}

// ============================================
// REACT CACHE WRAPPERS
// Deduplicate database calls between generateMetadata() and page components
// within the same request lifecycle
// ============================================

export const getCachedRestaurant = cache((slug: string) => db.getRestaurant(slug));
export const getCachedEpisode = cache((slug: string) => db.getEpisode(slug));
export const getCachedCuisine = cache((slug: string) => db.getCuisine(slug));
export const getCachedRestaurantsByCuisine = cache((slug: string) => db.getRestaurantsByCuisine(slug));
export const getCachedRestaurantsByStatus = cache((status: 'open' | 'closed') => db.getRestaurantsByStatus(status));
export const getCachedRestaurantStats = cache(() => db.getRestaurantStats());
