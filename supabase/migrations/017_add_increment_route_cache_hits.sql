-- Migration: Add atomic function for incrementing route cache hit count
-- Prevents race conditions when multiple concurrent requests hit the same cached route

CREATE OR REPLACE FUNCTION increment_route_cache_hits(p_route_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE route_cache
  SET
    hit_count = COALESCE(hit_count, 0) + 1,
    last_accessed_at = NOW()
  WHERE id = p_route_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_route_cache_hits IS 'Atomically increments hit count for a cached route to prevent race conditions';
