-- Rollback migration 007 - we don't need a separate table
-- Just fix the constraint issue in route_cache instead

-- Drop the curated_routes table and its functions
DROP FUNCTION IF EXISTS get_restaurants_near_curated_route(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_curated_route_views(UUID);
DROP FUNCTION IF EXISTS insert_curated_route(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INTEGER, INTEGER, TEXT, TEXT);
DROP TABLE IF EXISTS curated_routes;

-- Restore the metadata columns to route_cache
ALTER TABLE route_cache
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS map_image_url TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Restore the indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_cache_slug ON route_cache(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_route_cache_curated ON route_cache(is_curated) WHERE is_curated = true;
CREATE INDEX IF NOT EXISTS idx_route_cache_views ON route_cache(view_count DESC);

-- Fix the actual problem: change unique constraint to prevent place ID collisions
-- Drop old constraint
ALTER TABLE route_cache DROP CONSTRAINT IF EXISTS route_cache_origin_place_id_destination_place_id_key;

-- Create new unique index using text fields to prevent collisions
-- This allows different routes even if Google returns similar place IDs
CREATE UNIQUE INDEX IF NOT EXISTS route_cache_unique_key
  ON route_cache(origin_text, destination_text);

-- Comments
COMMENT ON COLUMN route_cache.slug IS 'SEO-friendly URL slug for curated routes (e.g., sf-to-la)';
COMMENT ON COLUMN route_cache.is_curated IS 'Whether this route is hand-picked and featured on homepage';
COMMENT ON COLUMN route_cache.view_count IS 'Number of times the route page has been viewed';
COMMENT ON COLUMN route_cache.description IS 'SEO description and social sharing text';
COMMENT ON COLUMN route_cache.map_image_url IS 'URL to static map image preview';
COMMENT ON COLUMN route_cache.title IS 'Human-readable route title (e.g., "San Francisco to Los Angeles")';
