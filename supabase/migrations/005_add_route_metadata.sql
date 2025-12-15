-- Add metadata columns to route_cache for curated routes and SEO
-- This enables route pages at /route/[slug] with social sharing

-- ============================================
-- ADD COLUMNS
-- ============================================

ALTER TABLE route_cache
ADD COLUMN slug TEXT,
ADD COLUMN is_curated BOOLEAN DEFAULT false,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN description TEXT,
ADD COLUMN map_image_url TEXT,
ADD COLUMN title TEXT;

-- ============================================
-- INDEXES
-- ============================================

-- Index for route page lookups by slug
CREATE UNIQUE INDEX idx_route_cache_slug ON route_cache(slug) WHERE slug IS NOT NULL;

-- Index for finding curated routes
CREATE INDEX idx_route_cache_curated ON route_cache(is_curated) WHERE is_curated = true;

-- Index for popular routes (by view count)
CREATE INDEX idx_route_cache_views ON route_cache(view_count DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN route_cache.slug IS 'SEO-friendly URL slug for curated routes (e.g., sf-to-la)';
COMMENT ON COLUMN route_cache.is_curated IS 'Whether this route is hand-picked and featured on homepage';
COMMENT ON COLUMN route_cache.view_count IS 'Number of times the route page has been viewed';
COMMENT ON COLUMN route_cache.description IS 'SEO description and social sharing text';
COMMENT ON COLUMN route_cache.map_image_url IS 'URL to static map image preview';
COMMENT ON COLUMN route_cache.title IS 'Human-readable route title (e.g., "San Francisco to Los Angeles")';
