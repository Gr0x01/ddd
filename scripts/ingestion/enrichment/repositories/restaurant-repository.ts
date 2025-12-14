import { SupabaseClient } from '@supabase/supabase-js';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Restaurant enrichment data (from LLM)
export interface RestaurantEnrichmentData {
  description?: string;
  cuisines?: string[]; // cuisine slugs to link
  price_tier?: '$' | '$$' | '$$$' | '$$$$';
  guy_quote?: string;
}

// Restaurant status update data
export interface RestaurantStatusData {
  status: 'open' | 'closed' | 'unknown';
  confidence: number;
  reason: string;
}

// Google Place data
export interface GooglePlaceData {
  google_place_id: string;
  google_rating?: number;
  google_review_count?: number;
}

// Restaurant record (minimal fields needed by enrichment)
export interface RestaurantRecord {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  address: string | null;
  status: 'open' | 'closed' | 'unknown';
  enrichment_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_enriched_at: string | null;
  description: string | null;
  price_tier: string | null;
  guy_quote: string | null;
  google_place_id: string | null;
}

/**
 * Repository for restaurant data access
 * Handles all database operations for restaurants table
 */
export class RestaurantRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update enrichment data (description, cuisines, price_tier, guy_quote)
   */
  async updateEnrichmentData(
    id: string,
    data: RestaurantEnrichmentData
  ): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.price_tier !== undefined) {
        updateData.price_tier = data.price_tier;
      }
      if (data.guy_quote !== undefined) {
        updateData.guy_quote = data.guy_quote;
      }

      const { error } = await this.supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateEnrichmentData failed for restaurant ${id}: ${error.message}`
        };
      }

      // Handle cuisines separately (many-to-many relationship)
      if (data.cuisines && data.cuisines.length > 0) {
        const cuisineResult = await this.updateCuisines(id, data.cuisines);
        if (!cuisineResult.success) {
          return cuisineResult;
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateEnrichmentData exception for restaurant ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update restaurant status with verification metadata
   */
  async updateStatus(
    id: string,
    status: 'open' | 'closed' | 'unknown',
    confidence: number,
    reason: string
  ): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('restaurants')
        .update({
          status,
          last_verified: new Date().toISOString(),
          verification_source: `llm_confidence_${confidence.toFixed(2)}: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateStatus failed for restaurant ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateStatus exception for restaurant ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update Google Place ID and rating data
   */
  async updateGooglePlaceId(
    id: string,
    placeId: string,
    rating?: number,
    reviewCount?: number
  ): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = {
        google_place_id: placeId,
        updated_at: new Date().toISOString(),
      };

      if (rating !== undefined) {
        updateData.google_rating = rating;
      }
      if (reviewCount !== undefined) {
        updateData.google_review_count = reviewCount;
      }

      const { error } = await this.supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `updateGooglePlaceId failed for restaurant ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateGooglePlaceId exception for restaurant ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Mark restaurant as enriched (set timestamp and status)
   */
  async setEnrichmentTimestamp(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase
        .from('restaurants')
        .update({
          enrichment_status: 'completed',
          last_enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: `setEnrichmentTimestamp failed for restaurant ${id}: ${error.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `setEnrichmentTimestamp exception for restaurant ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fetch restaurant by ID
   */
  async getById(id: string): Promise<Result<RestaurantRecord>> {
    try {
      const { data, error } = await this.supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: `getById failed for restaurant ${id}: ${error.message}`
        };
      }

      if (!data) {
        return {
          success: false,
          error: `getById failed for restaurant ${id}: not found`
        };
      }

      return { success: true, data: data as RestaurantRecord };
    } catch (error) {
      return {
        success: false,
        error: `getById exception for restaurant ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fetch multiple restaurants by IDs
   */
  async getBulk(ids: string[]): Promise<Result<RestaurantRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('restaurants')
        .select('*')
        .in('id', ids);

      if (error) {
        return {
          success: false,
          error: `getBulk failed for ${ids.length} restaurants: ${error.message}`
        };
      }

      return { success: true, data: (data || []) as RestaurantRecord[] };
    } catch (error) {
      return {
        success: false,
        error: `getBulk exception for ${ids.length} restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all restaurants with enrichment_status='pending'
   */
  async getAllPending(): Promise<Result<RestaurantRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('restaurants')
        .select('*')
        .eq('enrichment_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: `getAllPending failed: ${error.message}`
        };
      }

      return { success: true, data: (data || []) as RestaurantRecord[] };
    } catch (error) {
      return {
        success: false,
        error: `getAllPending exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get restaurants not enriched in the last N days
   * @param days Number of days threshold
   */
  async getAllStale(days: number): Promise<Result<RestaurantRecord[]>> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('restaurants')
        .select('*')
        .or(`last_enriched_at.is.null,last_enriched_at.lt.${thresholdDate.toISOString()}`)
        .order('last_enriched_at', { ascending: true, nullsFirst: true });

      if (error) {
        return {
          success: false,
          error: `getAllStale failed (${days} days): ${error.message}`
        };
      }

      return { success: true, data: (data || []) as RestaurantRecord[] };
    } catch (error) {
      return {
        success: false,
        error: `getAllStale exception (${days} days): ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update cuisines for a restaurant (many-to-many)
   * Uses upsert pattern to handle concurrent updates gracefully
   */
  private async updateCuisines(
    restaurantId: string,
    cuisineSlugs: string[]
  ): Promise<Result<void>> {
    try {
      // Get cuisine IDs from slugs
      const { data: cuisines, error: fetchError } = await this.supabase
        .from('cuisines')
        .select('id, slug')
        .in('slug', cuisineSlugs);

      if (fetchError) {
        return {
          success: false,
          error: `updateCuisines fetch failed for restaurant ${restaurantId}: ${fetchError.message}`
        };
      }

      if (!cuisines || cuisines.length === 0) {
        return {
          success: false,
          error: `updateCuisines failed for restaurant ${restaurantId}: no matching cuisines found for slugs [${cuisineSlugs.join(', ')}]`
        };
      }

      // Delete existing cuisine links
      const { error: deleteError } = await this.supabase
        .from('restaurant_cuisines')
        .delete()
        .eq('restaurant_id', restaurantId);

      if (deleteError) {
        return {
          success: false,
          error: `updateCuisines delete failed for restaurant ${restaurantId}: ${deleteError.message}`
        };
      }

      // Insert new cuisine links
      const cuisineLinks = cuisines.map(c => ({
        restaurant_id: restaurantId,
        cuisine_id: c.id,
      }));

      const { error: insertError } = await this.supabase
        .from('restaurant_cuisines')
        .insert(cuisineLinks);

      if (insertError) {
        return {
          success: false,
          error: `updateCuisines insert failed for restaurant ${restaurantId}: ${insertError.message}`
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `updateCuisines exception for restaurant ${restaurantId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
