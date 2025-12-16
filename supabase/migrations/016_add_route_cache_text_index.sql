-- Migration: Add indexes for efficient route cache text lookups
-- This improves performance for findCachedRouteByText() which uses exact match on pre-lowercased text

-- Composite index for the common query pattern (origin + destination + expiry check)
-- Data is stored pre-lowercased, so we use direct column indexes
CREATE INDEX IF NOT EXISTS idx_route_cache_text_lookup
ON route_cache (origin_text, destination_text, expires_at);

-- Index on expires_at for filtering unexpired routes
CREATE INDEX IF NOT EXISTS idx_route_cache_expires_at
ON route_cache (expires_at);

COMMENT ON INDEX idx_route_cache_text_lookup IS 'Composite index for efficient route cache text lookups with expiry filtering';
