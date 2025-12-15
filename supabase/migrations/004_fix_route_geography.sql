-- Fix route geography insertion
-- The route_geography field needs to use PostGIS functions to convert text to geography

-- Drop the existing get_restaurants_near_route function
DROP FUNCTION IF EXISTS get_restaurants_near_route(UUID, DECIMAL);

-- Create a function to insert routes with proper geography conversion
CREATE OR REPLACE FUNCTION insert_route_cache(
  p_origin_place_id TEXT,
  p_destination_place_id TEXT,
  p_origin_text TEXT,
  p_destination_text TEXT,
  p_polyline TEXT,
  p_polyline_points JSONB,
  p_distance_meters INTEGER,
  p_duration_seconds INTEGER,
  p_linestring_text TEXT,
  p_google_response JSONB
)
RETURNS UUID AS $$
DECLARE
  v_route_id UUID;
BEGIN
  INSERT INTO route_cache (
    origin_place_id,
    destination_place_id,
    origin_text,
    destination_text,
    polyline,
    polyline_points,
    distance_meters,
    duration_seconds,
    route_geography,
    google_response
  ) VALUES (
    p_origin_place_id,
    p_destination_place_id,
    p_origin_text,
    p_destination_text,
    p_polyline,
    p_polyline_points,
    p_distance_meters,
    p_duration_seconds,
    ST_GeogFromText(p_linestring_text),  -- Convert text to geography
    p_google_response
  )
  RETURNING id INTO v_route_id;

  RETURN v_route_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_restaurants_near_route function (same as before)
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

-- Add comment
COMMENT ON FUNCTION insert_route_cache IS 'Inserts a route into the cache with proper PostGIS geography conversion from LINESTRING text';
