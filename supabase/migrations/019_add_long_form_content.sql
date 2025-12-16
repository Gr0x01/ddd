-- Migration: Add long-form SEO content fields to restaurants table
-- Purpose: Store enriched long-form content for SEO optimization
-- These fields will contain ~700 words of storytelling content per restaurant

-- About story: Origin, unique character, what makes it special (~200 words)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS about_story TEXT;

-- Culinary philosophy: Cooking philosophy, sourcing, techniques (~150 words)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS culinary_philosophy TEXT;

-- History highlights: Founding story, milestones, achievements (~150 words)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS history_highlights TEXT;

-- Why visit: Why food lovers should visit, the experience (~100 words)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS why_visit TEXT;

-- City context: Restaurant's place in city's food scene (~100 words)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city_context TEXT;

-- Track when long-form enrichment was completed
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS long_form_enriched_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.about_story IS 'Long-form content: origin story, unique character, what makes it special (~200 words)';
COMMENT ON COLUMN restaurants.culinary_philosophy IS 'Long-form content: cooking philosophy, sourcing, techniques (~150 words)';
COMMENT ON COLUMN restaurants.history_highlights IS 'Long-form content: founding story, milestones, achievements (~150 words)';
COMMENT ON COLUMN restaurants.why_visit IS 'Long-form content: why food lovers should visit, the experience (~100 words)';
COMMENT ON COLUMN restaurants.city_context IS 'Long-form content: restaurant place in city food scene (~100 words)';
COMMENT ON COLUMN restaurants.long_form_enriched_at IS 'Timestamp when long-form content was generated';
