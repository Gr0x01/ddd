-- Add photos and google_rating columns to get_restaurants_near_route function
-- The original function only returned photo_url, but photos are now stored in the photos JSONB array

DROP FUNCTION IF EXISTS get_restaurants_near_route(uuid, numeric);

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
  photos TEXT[],
  google_rating NUMERIC,
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
    r.status::TEXT,
    r.price_tier::TEXT,
    r.description,
    r.photo_url,
    CASE
      WHEN r.photos IS NULL THEN NULL
      ELSE ARRAY(SELECT jsonb_array_elements_text(r.photos))
    END,
    r.google_rating,
    (ST_Distance(r.location, rc.route_geography) / 1609.34)::DECIMAL AS distance_miles
  FROM restaurants r
  CROSS JOIN route_cache rc
  WHERE rc.id = route_id
    AND r.is_public = true
    AND r.latitude IS NOT NULL
    AND r.longitude IS NOT NULL
    AND ST_DWithin(
      r.location::geography,
      rc.route_geography,
      radius_miles * 1609.34
    )
  ORDER BY distance_miles ASC
  LIMIT 200;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_restaurants_near_route IS 'Finds restaurants within a specified radius of a cached route using PostGIS ST_DWithin. Returns photos array and google_rating.';
