-- Migration: Get routes with restaurant counts in a single query
-- Avoids N+1 queries when displaying routes on the roadtrip page

-- ============================================
-- FUNCTION: Get routes with restaurant counts
-- ============================================

CREATE OR REPLACE FUNCTION get_routes_with_counts(
  p_limit INTEGER DEFAULT 20,
  p_curated_only BOOLEAN DEFAULT false,
  p_radius_miles DECIMAL DEFAULT 15.0
)
RETURNS TABLE(
  id UUID,
  origin_text TEXT,
  destination_text TEXT,
  distance_meters INTEGER,
  duration_seconds INTEGER,
  polyline TEXT,
  polyline_points JSONB,
  hit_count INTEGER,
  view_count INTEGER,
  slug TEXT,
  is_curated BOOLEAN,
  title TEXT,
  description TEXT,
  map_image_url TEXT,
  created_at TIMESTAMPTZ,
  restaurant_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.origin_text,
    rc.destination_text,
    rc.distance_meters,
    rc.duration_seconds,
    rc.polyline,
    rc.polyline_points,
    rc.hit_count,
    rc.view_count,
    rc.slug,
    rc.is_curated,
    rc.title,
    rc.description,
    rc.map_image_url,
    rc.created_at,
    -- Subquery to count restaurants near this route
    (
      SELECT COUNT(DISTINCT r.id)
      FROM restaurants r
      WHERE r.is_public = true
        AND r.latitude IS NOT NULL
        AND r.longitude IS NOT NULL
        AND rc.route_geography IS NOT NULL
        AND ST_DWithin(
          r.location::geography,
          rc.route_geography,
          p_radius_miles * 1609.34
        )
    ) AS restaurant_count
  FROM route_cache rc
  WHERE rc.expires_at > NOW()
    AND (NOT p_curated_only OR rc.is_curated = true)
  ORDER BY
    rc.is_curated DESC NULLS LAST,
    rc.view_count DESC NULLS LAST,
    rc.hit_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Count restaurants near a route (lightweight)
-- ============================================

CREATE OR REPLACE FUNCTION count_restaurants_near_route(
  route_id UUID,
  radius_miles DECIMAL DEFAULT 15.0
)
RETURNS BIGINT AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT r.id) INTO v_count
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
    );

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_routes_with_counts IS 'Returns routes with restaurant counts in a single query for the roadtrip page display';
COMMENT ON FUNCTION count_restaurants_near_route IS 'Lightweight function to count restaurants near a specific route';
