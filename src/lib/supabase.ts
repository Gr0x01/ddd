import { createClient } from '@supabase/supabase-js';

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

// IMPORTANT: Do NOT export supabaseAdmin or service role key in frontend code
// Server-side operations should use separate admin client in API routes or scripts

// ============================================
// TYPE DEFINITIONS
// ============================================

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
  country: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phone: string | null;
  website_url: string | null;
  social_urls: Record<string, string>;

  // Hours
  hours_json: any | null;
  hours_notes: string | null;

  // Status & Verification
  status: 'open' | 'closed' | 'unknown';
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
  photos: string[];

  // Ratings
  google_rating: number | null;
  yelp_rating: number | null;
  google_review_count: number | null;
  google_place_id: string | null;

  // SEO
  meta_description: string | null;

  // Pricing
  price_tier: '$' | '$$' | '$$$' | '$$$$' | null;

  // Enrichment
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

export interface State {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  restaurant_count: number;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  state_id: string | null;
  state_name: string;
  restaurant_count: number;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

// Combined type for restaurant with episodes and cuisines
export interface RestaurantWithDetails extends Restaurant {
  episodes?: Episode[];
  cuisines?: Cuisine[];
  dishes?: Dish[];
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

export const db = {
  // Get all restaurants
  async getRestaurants() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select('*')
      .eq('is_public', true)
      .order('name')
      .limit(5000);

    if (error) throw error;
    return data as Restaurant[];
  },

  // Get restaurant by slug with episodes and cuisines
  async getRestaurant(slug: string): Promise<RestaurantWithDetails | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select(`
        *,
        restaurant_episodes!inner(
          episode:episodes(*)
        ),
        restaurant_cuisines!inner(
          cuisine:cuisines(*)
        ),
        dishes(*)
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }

    // Transform the data to match our interface
    const restaurant = data as any;
    return {
      ...restaurant,
      episodes: restaurant.restaurant_episodes?.map((re: any) => re.episode) || [],
      cuisines: restaurant.restaurant_cuisines?.map((rc: any) => rc.cuisine) || [],
      dishes: restaurant.dishes || []
    };
  },

  // Get restaurants by city
  async getRestaurantsByCity(city: string, state?: string) {
    const client = getSupabaseClient();
    let query = client
      .from('restaurants')
      .select('*')
      .eq('is_public', true)
      .eq('city', city);

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data as Restaurant[];
  },

  // Get restaurants by state
  async getRestaurantsByState(state: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('restaurants')
      .select('*')
      .eq('is_public', true)
      .eq('state', state)
      .order('city')
      .order('name');

    if (error) throw error;
    return data as Restaurant[];
  },

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

  // Get episode by slug with restaurants
  async getEpisode(slug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('episodes')
      .select(`
        *,
        restaurant_episodes!inner(
          restaurant:restaurants(*)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching episode:', error);
      return null;
    }

    const episode = data as any;
    return {
      ...episode,
      restaurants: episode.restaurant_episodes?.map((re: any) => re.restaurant).filter((r: any) => r.is_public) || []
    };
  },

  // Get all states with restaurant counts
  async getStates() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('states')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as State[];
  },

  // Get state by slug
  async getState(slug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('states')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching state:', error);
      return null;
    }
    return data as State;
  },

  // Get cities by state
  async getCitiesByState(stateSlug: string) {
    const client = getSupabaseClient();
    const { data: state } = await client
      .from('states')
      .select('name')
      .eq('slug', stateSlug)
      .single();

    if (!state) return [];

    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('state_name', state.name)
      .order('name');

    if (error) throw error;
    return data as City[];
  },

  // Get city by slug and state
  async getCity(citySlug: string, stateSlug: string) {
    const client = getSupabaseClient();
    const { data: state } = await client
      .from('states')
      .select('name')
      .eq('slug', stateSlug)
      .single();

    if (!state) return null;

    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('slug', citySlug)
      .eq('state_name', state.name)
      .single();

    if (error) {
      console.error('Error fetching city:', error);
      return null;
    }
    return data as City;
  },

  // Get stats for homepage
  async getStats() {
    const client = getSupabaseClient();
    const [restaurantsResult, episodesResult, citiesResult] = await Promise.all([
      client.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_public', true),
      client.from('episodes').select('id', { count: 'exact', head: true }),
      client.from('cities').select('id', { count: 'exact', head: true })
    ]);

    return {
      restaurants: restaurantsResult.count || 0,
      episodes: episodesResult.count || 0,
      cities: citiesResult.count || 0
    };
  },

  // Search restaurants by name
  async searchRestaurants(query: string) {
    const client = getSupabaseClient();
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
    const { data, error } = await client
      .from('restaurants')
      .select('*')
      .eq('is_public', true)
      .ilike('name', `%${sanitizedQuery}%`)
      .order('name')
      .limit(50);

    if (error) throw error;
    return data as Restaurant[];
  }
};

export default getSupabaseClient;
