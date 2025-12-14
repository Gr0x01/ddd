-- Add search-specific columns to cache table for tavily search caching
ALTER TABLE cache
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id TEXT,
ADD COLUMN IF NOT EXISTS entity_name TEXT,
ADD COLUMN IF NOT EXISTS query TEXT,
ADD COLUMN IF NOT EXISTS query_hash TEXT,
ADD COLUMN IF NOT EXISTS results JSONB,
ADD COLUMN IF NOT EXISTS result_count INTEGER,
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add indexes for search-specific queries
CREATE INDEX IF NOT EXISTS idx_cache_query_hash ON cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_cache_entity ON cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cache_source ON cache(source);

-- Comments
COMMENT ON COLUMN cache.entity_type IS 'For search cache: restaurant, episode, city';
COMMENT ON COLUMN cache.entity_id IS 'For search cache: UUID of the entity';
COMMENT ON COLUMN cache.entity_name IS 'For search cache: Human-readable entity name';
COMMENT ON COLUMN cache.query IS 'For search cache: The search query text';
COMMENT ON COLUMN cache.query_hash IS 'For search cache: SHA256 hash of query for deduplication';
COMMENT ON COLUMN cache.results IS 'For search cache: Array of search results';
COMMENT ON COLUMN cache.result_count IS 'For search cache: Number of results';
COMMENT ON COLUMN cache.source IS 'For search cache: tavily, wikipedia, etc.';
