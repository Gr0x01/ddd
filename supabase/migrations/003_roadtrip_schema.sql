-- Road Trip Planner Schema
-- Adds route caching and spatial query support for finding restaurants along routes

-- ============================================
-- ROUTE CACHE TABLE
-- ============================================

-- Store Google Directions API responses to minimize API calls
CREATE TABLE route_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache keys (Google Place IDs for exact matching)
    origin_place_id TEXT NOT NULL,
    destination_place_id TEXT NOT NULL,
    origin_text TEXT NOT NULL,
    destination_text TEXT NOT NULL,

    -- Route data from Google Directions API
    polyline TEXT NOT NULL, -- Encoded polyline string
    polyline_points JSONB NOT NULL, -- Decoded array of {lat, lng} objects
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- PostGIS geography for spatial queries
    -- LINESTRING stores the route path for finding nearby restaurants
    route_geography geography(LINESTRING, 4326),

    -- Full API response for debugging and future features
    google_response JSONB,

    -- Cache management
    hit_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

    -- Ensure we don't cache duplicate routes
    UNIQUE(origin_place_id, destination_place_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Spatial index for fast geography queries (ST_DWithin)
CREATE INDEX idx_route_cache_geography ON route_cache USING GIST(route_geography);

-- Index for cache expiration cleanup
CREATE INDEX idx_route_cache_expires ON route_cache(expires_at);

-- Composite index for fast cache lookup by place IDs
CREATE INDEX idx_route_cache_lookup ON route_cache(origin_place_id, destination_place_id);

-- Index for popular routes (by hit count)
CREATE INDEX idx_route_cache_hits ON route_cache(hit_count DESC);

-- ============================================
-- POSTGIS FUNCTION: Find Restaurants Near Route
-- ============================================

CREATE OR REPLACE FUNCTION get_restaurants_near_route(
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
    -- Calculate distance from restaurant to route in miles
    (ST_Distance(r.location, rc.route_geography) / 1609.34)::DECIMAL AS distance_miles
  FROM restaurants r
  CROSS JOIN route_cache rc
  WHERE rc.id = route_id
    AND r.is_public = true
    AND r.latitude IS NOT NULL
    AND r.longitude IS NOT NULL
    -- Find restaurants within X miles of the route
    -- ST_DWithin uses the spatial index for fast queries
    AND ST_DWithin(
      r.location::geography,
      rc.route_geography,
      radius_miles * 1609.34  -- Convert miles to meters
    )
  ORDER BY distance_miles ASC
  LIMIT 200;  -- Cap results for performance
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE route_cache IS 'Caches Google Directions API responses to minimize costs and improve performance';
COMMENT ON COLUMN route_cache.route_geography IS 'PostGIS LINESTRING geography for spatial queries to find nearby restaurants';
COMMENT ON COLUMN route_cache.hit_count IS 'Tracks how many times this route has been requested (for analytics and cache prioritization)';
COMMENT ON FUNCTION get_restaurants_near_route IS 'Finds restaurants within a specified radius of a cached route using PostGIS ST_DWithin';
