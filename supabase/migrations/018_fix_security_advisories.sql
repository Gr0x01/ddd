-- Migration: Fix Supabase Security Advisories
-- Addresses: Missing RLS on tables, mutable search_path on functions
-- Applied: 2025-12-16

-- ============================================
-- 1. ENABLE RLS ON TABLES MISSING IT
-- ============================================

-- Enable RLS on cache table
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cache" ON cache FOR SELECT USING (true);

-- Enable RLS on route_cache table
ALTER TABLE route_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read route_cache" ON route_cache FOR SELECT USING (true);

-- Note: spatial_ref_sys is a PostGIS internal system table - not modified

-- ============================================
-- 2. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- ============================================

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: update_restaurant_location
CREATE OR REPLACE FUNCTION update_restaurant_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$;

-- Fix: sync_state_counts
CREATE OR REPLACE FUNCTION sync_state_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE states s
  SET
    restaurant_count = COALESCE(counts.restaurant_count, 0),
    updated_at = NOW()
  FROM (
    SELECT st.id as state_id, COUNT(DISTINCT r.id) as restaurant_count
    FROM states st
    LEFT JOIN restaurants r ON r.state IS NOT NULL AND (
      r.state = st.name OR r.state = st.abbreviation
      OR (st.abbreviation = 'DC' AND r.state IN ('DC', 'D.C.', 'Washington, D.C.', 'District of Columbia'))
    ) AND r.is_public = true
    GROUP BY st.id
  ) counts
  WHERE s.id = counts.state_id;
END;
$$;

-- Fix: sync_city_counts
CREATE OR REPLACE FUNCTION sync_city_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE cities c
  SET
    restaurant_count = COALESCE(counts.restaurant_count, 0),
    updated_at = NOW()
  FROM (
    SELECT ct.id as city_id, COUNT(DISTINCT r.id) as restaurant_count
    FROM cities ct
    LEFT JOIN restaurants r ON r.city = ct.name AND r.state = ct.state_name AND r.is_public = true
    GROUP BY ct.id
  ) counts
  WHERE c.id = counts.city_id;
END;
$$;

-- Fix: trigger_sync_location_counts
CREATE OR REPLACE FUNCTION trigger_sync_location_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() = 0 THEN
    PERFORM sync_state_counts();
    PERFORM sync_city_counts();
  END IF;
  RETURN NULL;
END;
$$;

-- Fix: increment_route_cache_hits
CREATE OR REPLACE FUNCTION increment_route_cache_hits(p_route_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE route_cache SET hit_count = COALESCE(hit_count, 0) + 1, last_accessed_at = NOW() WHERE id = p_route_id;
END;
$$;

-- Fix: increment_route_views
CREATE OR REPLACE FUNCTION increment_route_views(route_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE route_cache SET view_count = COALESCE(view_count, 0) + 1, last_accessed_at = NOW() WHERE id = route_id;
END;
$$;

-- Fix: insert_route_cache
CREATE OR REPLACE FUNCTION insert_route_cache(
  p_origin_place_id TEXT, p_destination_place_id TEXT, p_origin_text TEXT, p_destination_text TEXT,
  p_polyline TEXT, p_polyline_points JSONB, p_distance_meters INTEGER, p_duration_seconds INTEGER,
  p_linestring_text TEXT, p_google_response JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE v_route_id UUID;
BEGIN
  INSERT INTO route_cache (origin_place_id, destination_place_id, origin_text, destination_text, polyline, polyline_points, distance_meters, duration_seconds, route_geography, google_response)
  VALUES (p_origin_place_id, p_destination_place_id, p_origin_text, p_destination_text, p_polyline, p_polyline_points, p_distance_meters, p_duration_seconds, ST_GeogFromText(p_linestring_text), p_google_response)
  ON CONFLICT (origin_place_id, destination_place_id) DO UPDATE SET
    polyline = EXCLUDED.polyline, polyline_points = EXCLUDED.polyline_points, distance_meters = EXCLUDED.distance_meters,
    duration_seconds = EXCLUDED.duration_seconds, route_geography = EXCLUDED.route_geography, google_response = EXCLUDED.google_response,
    hit_count = route_cache.hit_count + 1, last_accessed_at = NOW(), expires_at = NOW() + INTERVAL '30 days'
  RETURNING id INTO v_route_id;
  RETURN v_route_id;
END;
$$;

-- Drop and recreate get_restaurants_near_route with security fix
DROP FUNCTION IF EXISTS get_restaurants_near_route(UUID, DECIMAL);

CREATE FUNCTION get_restaurants_near_route(route_id UUID, radius_miles DECIMAL DEFAULT 10.0)
RETURNS TABLE(
  id UUID, name TEXT, slug TEXT, city TEXT, state TEXT, country TEXT, latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION, status TEXT, price_tier TEXT, description TEXT, photo_url TEXT,
  photos TEXT[], google_rating NUMERIC, google_review_count INTEGER, cuisine_tags TEXT[],
  distance_miles NUMERIC, route_position NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH route AS (SELECT rc.route_geography FROM route_cache rc WHERE rc.id = route_id),
  restaurant_data AS (
    SELECT DISTINCT ON (r.id)
      r.id, r.name, r.slug, r.city, r.state, r.country, r.latitude, r.longitude,
      r.status, r.price_tier, r.description, r.photo_url, r.google_rating, r.google_review_count,
      (ST_Distance(r.location, route.route_geography) / 1609.34)::NUMERIC AS distance_miles,
      ST_LineLocatePoint(route.route_geography::geometry, r.location::geometry)::NUMERIC AS route_position
    FROM restaurants r CROSS JOIN route
    WHERE r.is_public = true AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
      AND ST_DWithin(r.location::geography, route.route_geography, radius_miles * 1609.34)
  )
  SELECT rd.id, rd.name, rd.slug, rd.city, rd.state, rd.country, rd.latitude, rd.longitude,
    rd.status, rd.price_tier, rd.description, rd.photo_url, ARRAY[]::TEXT[] AS photos,
    rd.google_rating, rd.google_review_count,
    COALESCE(ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), ARRAY[]::TEXT[]) AS cuisine_tags,
    rd.distance_miles, rd.route_position
  FROM restaurant_data rd
  LEFT JOIN restaurant_cuisines rc_link ON rc_link.restaurant_id = rd.id
  LEFT JOIN cuisines c ON c.id = rc_link.cuisine_id
  GROUP BY rd.id, rd.name, rd.slug, rd.city, rd.state, rd.country, rd.latitude, rd.longitude,
    rd.status, rd.price_tier, rd.description, rd.photo_url, rd.google_rating, rd.google_review_count,
    rd.distance_miles, rd.route_position
  ORDER BY rd.route_position ASC LIMIT 200;
END;
$$;

-- Drop and recreate get_routes_with_counts overloads with security fix
DROP FUNCTION IF EXISTS get_routes_with_counts(DECIMAL);
DROP FUNCTION IF EXISTS get_routes_with_counts(INTEGER, BOOLEAN, NUMERIC);

CREATE FUNCTION get_routes_with_counts(radius_miles DECIMAL DEFAULT 25.0)
RETURNS TABLE(
  id UUID, origin_text TEXT, destination_text TEXT, distance_meters INTEGER, duration_seconds INTEGER,
  polyline TEXT, polyline_points JSONB, hit_count INTEGER, view_count INTEGER, slug TEXT,
  is_curated BOOLEAN, title TEXT, description TEXT, map_image_url TEXT, created_at TIMESTAMPTZ, restaurant_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rc.id, rc.origin_text, rc.destination_text, rc.distance_meters, rc.duration_seconds,
    rc.polyline, rc.polyline_points, rc.hit_count, rc.view_count, rc.slug, rc.is_curated,
    rc.title, rc.description, rc.map_image_url, rc.created_at,
    COUNT(DISTINCT r.id) AS restaurant_count
  FROM route_cache rc
  LEFT JOIN restaurants r ON r.is_public = true AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    AND ST_DWithin(r.location::geography, rc.route_geography, radius_miles * 1609.34)
  WHERE rc.is_curated = true
  GROUP BY rc.id
  ORDER BY rc.view_count DESC NULLS LAST;
END;
$$;

CREATE FUNCTION get_routes_with_counts(
  p_limit INTEGER DEFAULT 20,
  p_curated_only BOOLEAN DEFAULT false,
  p_radius_miles NUMERIC DEFAULT 15.0
)
RETURNS TABLE(
  id UUID, origin_text TEXT, destination_text TEXT, distance_meters INTEGER, duration_seconds INTEGER,
  polyline TEXT, polyline_points JSONB, hit_count INTEGER, view_count INTEGER, slug TEXT,
  is_curated BOOLEAN, title TEXT, description TEXT, map_image_url TEXT, created_at TIMESTAMPTZ, restaurant_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rc.id, rc.origin_text, rc.destination_text, rc.distance_meters, rc.duration_seconds,
    rc.polyline, rc.polyline_points, rc.hit_count, rc.view_count, rc.slug, rc.is_curated,
    rc.title, rc.description, rc.map_image_url, rc.created_at,
    COUNT(DISTINCT r.id) AS restaurant_count
  FROM route_cache rc
  LEFT JOIN restaurants r ON r.is_public = true AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    AND ST_DWithin(r.location::geography, rc.route_geography, p_radius_miles * 1609.34)
  WHERE (NOT p_curated_only OR rc.is_curated = true)
  GROUP BY rc.id
  ORDER BY rc.view_count DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Drop and recreate count_restaurants_near_route with security fix
DROP FUNCTION IF EXISTS count_restaurants_near_route(UUID, DECIMAL);

CREATE FUNCTION count_restaurants_near_route(route_id UUID, radius_miles DECIMAL DEFAULT 25.0)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE result BIGINT;
BEGIN
  SELECT COUNT(DISTINCT r.id) INTO result
  FROM route_cache rc CROSS JOIN restaurants r
  WHERE rc.id = route_id AND r.is_public = true AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
    AND ST_DWithin(r.location::geography, rc.route_geography, radius_miles * 1609.34);
  RETURN result;
END;
$$;
