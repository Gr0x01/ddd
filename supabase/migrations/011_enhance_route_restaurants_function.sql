-- Enhance get_restaurants_near_route to return all fields needed for RestaurantCard
-- Adds: google_review_count, cuisine_tags (aggregated from junction table)

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
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT,
  price_tier TEXT,
  description TEXT,
  photo_url TEXT,
  photos TEXT[],
  google_rating NUMERIC,
  google_review_count INTEGER,
  cuisine_tags TEXT[],
  distance_miles DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (r.id)
    r.id,
    r.name,
    r.slug,
    r.city,
    r.state,
    r.country,
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
    r.google_review_count,
    -- Aggregate cuisine names from junction table
    (
      SELECT ARRAY_AGG(c.name ORDER BY c.name)
      FROM restaurant_cuisines rc_cuisine
      JOIN cuisines c ON c.id = rc_cuisine.cuisine_id
      WHERE rc_cuisine.restaurant_id = r.id
    ),
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
  ORDER BY r.id, (ST_Distance(r.location, rc.route_geography) / 1609.34)::DECIMAL ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_restaurants_near_route IS 'Finds restaurants within a specified radius of a cached route. Returns full restaurant data including cuisine_tags for RestaurantCard display.';
