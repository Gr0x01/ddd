import { SupabaseClient } from '@supabase/supabase-js';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Episode record (minimal fields needed by enrichment)
export interface EpisodeRecord {
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

// Restaurant from episode context
export interface EpisodeRestaurantRecord {
  id: string;
  name: string;
  city: string;
  state: string | null;
  slug: string;
}

/**
 * Repository for episode data access
 * Handles all database operations for episodes table
 */
export class EpisodeRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update episode description and meta description (for SEO)
   */
  async updateDescription(
    id: string,
    description: string,
    metaDescription?: string
  ): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = {
        description,
        updated_at: new Date().toISOString(),
      };

      if (metaDescription !== undefined) {
        updateData.meta_description = metaDescription;
      }

      const { error } = await this.supabase
        .from('episodes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateDescription failed for episode ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateDescription exception for episode ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fetch episode by ID
   */
  async getById(id: string): Promise<Result<EpisodeRecord>> {
    try {
      const { data, error } = await this.supabase
        .from('episodes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: `getById failed for episode ${id}: ${error.message}`
        };
      }

      if (!data) {
        return {
          success: false,
          error: `getById failed for episode ${id}: not found`
        };
      }

      return { success: true, data: data as EpisodeRecord };
    } catch (error) {
      return {
        success: false,
        error: `getById exception for episode ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fetch all episodes
   * Ordered by season and episode number
   */
  async getAllEpisodes(): Promise<Result<EpisodeRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('episodes')
        .select('*')
        .order('season', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `getAllEpisodes failed: ${error.message}`
        };
      }

      return { success: true, data: (data || []) as EpisodeRecord[] };
    } catch (error) {
      return {
        success: false,
        error: `getAllEpisodes exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all restaurants featured in an episode
   * Uses the restaurant_episodes junction table
   */
  async getEpisodeRestaurants(id: string): Promise<Result<EpisodeRestaurantRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('restaurant_episodes')
        .select(`
          restaurant_id,
          restaurants!inner (
            id,
            name,
            city,
            state,
            slug
          )
        `)
        .eq('episode_id', id);

      if (error) {
        return {
          success: false,
          error: `getEpisodeRestaurants failed for episode ${id}: ${error.message}`
        };
      }

      // Transform the nested structure into flat records
      const restaurants = (data || []).map((item: any) => ({
        id: item.restaurants.id,
        name: item.restaurants.name,
        city: item.restaurants.city,
        state: item.restaurants.state,
        slug: item.restaurants.slug,
      })) as EpisodeRestaurantRecord[];

      return { success: true, data: restaurants };
    } catch (error) {
      return {
        success: false,
        error: `getEpisodeRestaurants exception for episode ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update episode summary (long-form content)
   */
  async updateSummary(
    id: string,
    episodeSummary: string
  ): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('episodes')
        .update({
          episode_summary: episodeSummary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateSummary failed for episode ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateSummary exception for episode ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update cities visited array
   */
  async updateCitiesVisited(
    id: string,
    cities: string[]
  ): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('episodes')
        .update({
          cities_visited: cities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateCitiesVisited failed for episode ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateCitiesVisited exception for episode ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
