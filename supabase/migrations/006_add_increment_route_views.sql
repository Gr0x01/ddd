-- Add atomic increment function for route view counts
-- Fixes race condition in concurrent view count updates

CREATE OR REPLACE FUNCTION increment_route_views(route_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE route_cache
  SET view_count = COALESCE(view_count, 0) + 1,
      last_accessed_at = NOW()
  WHERE id = route_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_route_views IS 'Atomically increments view count for a route to prevent race conditions';
