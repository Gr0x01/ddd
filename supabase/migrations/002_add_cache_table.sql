-- Add cache table for external API responses
-- This allows us to cache Wikipedia, Google Places, etc. to avoid repeated API calls

CREATE TABLE IF NOT EXISTS cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,  -- e.g., 'wikipedia:episodes', 'google_places:PLACE_ID'
    cache_type TEXT NOT NULL,        -- e.g., 'wikipedia', 'google_places', 'tavily'
    data JSONB NOT NULL,             -- The cached response data
    metadata JSONB DEFAULT '{}',     -- Additional metadata (URL, query params, etc.)
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,          -- Optional expiration
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_cache_key ON cache(cache_key);
CREATE INDEX idx_cache_type ON cache(cache_type);
CREATE INDEX idx_cache_fetched_at ON cache(fetched_at DESC);
CREATE INDEX idx_cache_expires_at ON cache(expires_at) WHERE expires_at IS NOT NULL;

-- Updated timestamp trigger
CREATE TRIGGER update_cache_updated_at
    BEFORE UPDATE ON cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE cache IS 'Cache for external API responses (Wikipedia, Google Places, Tavily, etc.)';
COMMENT ON COLUMN cache.cache_key IS 'Unique key for this cached item (e.g., "wikipedia:episodes")';
COMMENT ON COLUMN cache.cache_type IS 'Type of cached data (wikipedia, google_places, tavily, etc.)';
COMMENT ON COLUMN cache.data IS 'The actual cached response data as JSONB';
COMMENT ON COLUMN cache.metadata IS 'Additional metadata about the cache entry (URL, query params, etc.)';
COMMENT ON COLUMN cache.expires_at IS 'Optional expiration timestamp - cache is stale after this time';
