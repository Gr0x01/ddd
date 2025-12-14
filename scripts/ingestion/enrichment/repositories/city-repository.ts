import { SupabaseClient } from '@supabase/supabase-js';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// City record
export interface CityRecord {
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

// Restaurant from city context
export interface CityRestaurantRecord {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  status: 'open' | 'closed' | 'unknown';
  price_tier: string | null;
}

/**
 * Repository for city data access
 * Handles all database operations for cities table
 */
export class CityRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update city meta description (for SEO)
   * Future use: LLM can generate city-specific SEO descriptions
   */
  async updateDescription(
    id: string,
    description: string
  ): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('cities')
        .update({
          meta_description: description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find city by name and state
   * State can be full name or abbreviation
   */
  async getByName(
    city: string,
    state: string
  ): Promise<Result<CityRecord>> {
    try {
      // Try exact match on city name and state_name
      let query = this.supabase
        .from('cities')
        .select('*')
        .eq('name', city);

      // Check if state is an abbreviation (2 chars) or full name
      if (state.length === 2) {
        // Need to join with states table to match abbreviation
        const { data: stateData, error: stateError } = await this.supabase
          .from('states')
          .select('name')
          .eq('abbreviation', state.toUpperCase())
          .single();

        if (stateError || !stateData) {
          return { success: false, error: 'State not found' };
        }

        query = query.eq('state_name', stateData.name);
      } else {
        query = query.eq('state_name', state);
      }

      const { data, error } = await query.single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'City not found' };
      }

      return { success: true, data: data as CityRecord };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all restaurants in a city
   * @param city City name
   * @param state State name or abbreviation
   */
  async getCityRestaurants(
    city: string,
    state: string
  ): Promise<Result<CityRestaurantRecord[]>> {
    try {
      // Normalize state (convert abbreviation to full name if needed)
      let stateName = state;
      if (state.length === 2) {
        const { data: stateData, error: stateError } = await this.supabase
          .from('states')
          .select('name')
          .eq('abbreviation', state.toUpperCase())
          .single();

        if (stateError || !stateData) {
          return { success: false, error: 'State not found' };
        }
        stateName = stateData.name;
      }

      const { data, error } = await this.supabase
        .from('restaurants')
        .select('id, name, slug, address, status, price_tier')
        .eq('city', city)
        .eq('state', stateName)
        .eq('is_public', true)
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as CityRestaurantRecord[] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all cities with restaurant counts
   * Useful for city listing pages
   */
  async getAllCities(): Promise<Result<CityRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('cities')
        .select('*')
        .order('restaurant_count', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as CityRecord[] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get cities by state
   * @param state State name or abbreviation
   */
  async getCitiesByState(state: string): Promise<Result<CityRecord[]>> {
    try {
      // Normalize state
      let stateName = state;
      if (state.length === 2) {
        const { data: stateData, error: stateError } = await this.supabase
          .from('states')
          .select('name')
          .eq('abbreviation', state.toUpperCase())
          .single();

        if (stateError || !stateData) {
          return { success: false, error: 'State not found' };
        }
        stateName = stateData.name;
      }

      const { data, error } = await this.supabase
        .from('cities')
        .select('*')
        .eq('state_name', stateName)
        .order('restaurant_count', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as CityRecord[] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
