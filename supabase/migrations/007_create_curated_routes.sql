-- Create Curated Routes Table
-- Separates editorial/SEO content from the route cache system

-- ============================================
-- CURATED ROUTES TABLE
-- ============================================

CREATE TABLE curated_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SEO and routing
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Route data (stored directly, not dependent on cache)
  origin_text TEXT NOT NULL,
  destination_text TEXT NOT NULL,
  polyline TEXT NOT NULL,
  polyline_points JSONB NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  route_geography geography(LINESTRING, 4326) NOT NULL,

  -- Metadata
  map_image_url TEXT,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Spatial index for restaurant queries
CREATE INDEX idx_curated_routes_geography ON curated_routes USING GIST(route_geography);

-- Index for finding routes by slug (primary access pattern)
CREATE INDEX idx_curated_routes_slug ON curated_routes(slug);

-- Index for popular routes
CREATE INDEX idx_curated_routes_views ON curated_routes(view_count DESC);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Insert curated route with proper geography conversion
CREATE OR REPLACE FUNCTION insert_curated_route(
  p_slug TEXT,
  p_title TEXT,
  p_description TEXT,
  p_origin_text TEXT,
  p_destination_text TEXT,
  p_polyline TEXT,
  p_polyline_points JSONB,
  p_distance_meters INTEGER,
  p_duration_seconds INTEGER,
  p_linestring_text TEXT,
  p_map_image_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_route_id UUID;
BEGIN
  INSERT INTO curated_routes (
    slug,
    title,
    description,
    origin_text,
    destination_text,
    polyline,
    polyline_points,
    distance_meters,
    duration_seconds,
    route_geography,
    map_image_url
  ) VALUES (
    p_slug,
    p_title,
    p_description,
    p_origin_text,
    p_destination_text,
    p_polyline,
    p_polyline_points,
    p_distance_meters,
    p_duration_seconds,
    ST_GeogFromText(p_linestring_text),
    p_map_image_url
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    polyline = EXCLUDED.polyline,
    polyline_points = EXCLUDED.polyline_points,
    distance_meters = EXCLUDED.distance_meters,
    duration_seconds = EXCLUDED.duration_seconds,
    route_geography = EXCLUDED.route_geography,
    map_image_url = COALESCE(EXCLUDED.map_image_url, curated_routes.map_image_url),
    updated_at = NOW()
  RETURNING id INTO v_route_id;

  RETURN v_route_id;
END;
$$ LANGUAGE plpgsql;

-- Increment view count atomically
CREATE OR REPLACE FUNCTION increment_curated_route_views(route_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE curated_routes
  SET view_count = COALESCE(view_count, 0) + 1,
      last_accessed_at = NOW()
  WHERE id = route_id;
END;
$$ LANGUAGE plpgsql;

-- Get restaurants near curated route (reuse same logic)
CREATE OR REPLACE FUNCTION get_restaurants_near_curated_route(
  route_id UUID,
  radius_miles DECIMAL DEFAULT 10.0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT,
  price_tier TEXT,
  description TEXT,
  photo_url TEXT,
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    r.id,
    r.name,
    r.slug,
    r.city,
    r.state,
    r.latitude,
    r.longitude,
    r.status,
    r.price_tier,
    r.description,
    r.photo_url,
    (ST_Distance(r.location, cr.route_geography) / 1609.34)::DECIMAL AS distance_miles
  FROM restaurants r
  CROSS JOIN curated_routes cr
  WHERE cr.id = route_id
    AND r.is_public = true
    AND r.latitude IS NOT NULL
    AND r.longitude IS NOT NULL
    AND ST_DWithin(
      r.location::geography,
      cr.route_geography,
      radius_miles * 1609.34
    )
  ORDER BY distance_miles ASC
  LIMIT 200;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE curated_routes IS 'Hand-picked editorial routes for SEO and homepage features. Separate from user route cache.';
COMMENT ON COLUMN curated_routes.slug IS 'SEO-friendly URL slug (e.g., sf-to-la)';
COMMENT ON COLUMN curated_routes.route_geography IS 'PostGIS LINESTRING for finding restaurants along the route';
COMMENT ON FUNCTION insert_curated_route IS 'Upserts a curated route, updating if slug exists';
COMMENT ON FUNCTION increment_curated_route_views IS 'Atomically increments view count for analytics';
COMMENT ON FUNCTION get_restaurants_near_curated_route IS 'Finds restaurants within radius of curated route';

-- ============================================
-- CLEANUP OLD METADATA COLUMNS
-- ============================================

-- Remove the curated route metadata from route_cache since we have a dedicated table now
ALTER TABLE route_cache DROP COLUMN IF EXISTS slug;
ALTER TABLE route_cache DROP COLUMN IF EXISTS is_curated;
ALTER TABLE route_cache DROP COLUMN IF EXISTS view_count;
ALTER TABLE route_cache DROP COLUMN IF EXISTS description;
ALTER TABLE route_cache DROP COLUMN IF EXISTS map_image_url;
ALTER TABLE route_cache DROP COLUMN IF EXISTS title;
