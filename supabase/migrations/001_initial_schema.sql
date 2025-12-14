-- DDD (Diners, Drive-ins and Dives) Database Schema
-- Initial schema with PostGIS for geographic queries

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- CORE TABLES
-- ============================================

-- Episodes table
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    air_date DATE,
    description TEXT,
    episode_summary TEXT,
    cities_visited TEXT[],
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(season, episode_number)
);

-- Cuisines table (for filtering)
CREATE TABLE cuisines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    meta_description TEXT,
    parent_id UUID REFERENCES cuisines(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurants table (PostGIS geography for accurate distance calculations)
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,

    -- Location
    address TEXT,
    city TEXT NOT NULL,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'US',
    neighborhood TEXT,
    latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    location geography(POINT, 4326), -- PostGIS geography for accurate distance calculations

    -- Contact
    phone TEXT,
    website_url TEXT,
    social_urls JSONB DEFAULT '{}',

    -- Hours
    hours_json JSONB,
    hours_notes TEXT,

    -- Status & Verification
    status TEXT DEFAULT 'unknown' CHECK (status IN ('open', 'closed', 'unknown')),
    last_verified TIMESTAMPTZ,
    verification_source TEXT,

    -- Episode Info
    first_episode_id UUID REFERENCES episodes(id),
    first_air_date DATE,

    -- Content
    description TEXT,
    dishes_featured TEXT[],
    guy_quote TEXT,

    -- Media
    photo_url TEXT,
    photos JSONB DEFAULT '[]',

    -- Ratings
    google_rating DECIMAL(2,1),
    yelp_rating DECIMAL(2,1),
    google_review_count INTEGER,
    google_place_id TEXT,

    -- SEO
    meta_description TEXT,

    -- Pricing
    price_tier TEXT CHECK (price_tier IN ('$', '$$', '$$$', '$$$$')),

    -- Enrichment tracking
    enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
    last_enriched_at TIMESTAMPTZ,

    -- Admin
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Dishes table (Guy's featured dishes)
CREATE TABLE dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    guy_reaction TEXT,
    is_signature_dish BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, slug)
);

-- ============================================
-- JUNCTION TABLES
-- ============================================

-- Restaurant-Episodes junction (many-to-many)
CREATE TABLE restaurant_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    segment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, episode_id)
);

-- Restaurant-Cuisines junction (many-to-many)
CREATE TABLE restaurant_cuisines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    cuisine_id UUID NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, cuisine_id)
);

-- ============================================
-- REFERENCE DATA TABLES
-- ============================================

-- States table
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT UNIQUE NOT NULL,
    restaurant_count INTEGER DEFAULT 0,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cities table
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    state_id UUID REFERENCES states(id),
    state_name TEXT NOT NULL,
    restaurant_count INTEGER DEFAULT 0,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(slug, state_name)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Episodes
-- Note: slug has UNIQUE constraint which automatically creates index, so no separate index needed
CREATE INDEX idx_episodes_season ON episodes(season, episode_number);
CREATE INDEX idx_episodes_air_date ON episodes(air_date DESC);

-- Cuisines
-- Note: slug has UNIQUE constraint which automatically creates index
CREATE INDEX idx_cuisines_parent ON cuisines(parent_id);

-- Restaurants
-- Note: slug has UNIQUE constraint which automatically creates index
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_state ON restaurants(state);
CREATE INDEX idx_restaurants_location ON restaurants(city, state, country);
CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_price_tier ON restaurants(price_tier);
CREATE INDEX idx_restaurants_is_public ON restaurants(is_public);
CREATE INDEX idx_restaurants_first_episode ON restaurants(first_episode_id);
CREATE INDEX idx_restaurants_enrichment_status ON restaurants(enrichment_status);

-- PostGIS spatial index for geographic queries (for Phase 2: road trip planner)
CREATE INDEX idx_restaurants_geography ON restaurants USING GIST(location);

-- Dishes
CREATE INDEX idx_dishes_restaurant ON dishes(restaurant_id);
CREATE INDEX idx_dishes_episode ON dishes(episode_id);
-- Note: slug is part of compound UNIQUE constraint, index auto-created

-- Junction tables
CREATE INDEX idx_restaurant_episodes_restaurant ON restaurant_episodes(restaurant_id);
CREATE INDEX idx_restaurant_episodes_episode ON restaurant_episodes(episode_id);
CREATE INDEX idx_restaurant_cuisines_restaurant ON restaurant_cuisines(restaurant_id);
CREATE INDEX idx_restaurant_cuisines_cuisine ON restaurant_cuisines(cuisine_id);

-- States and Cities
-- Note: slug and abbreviation have UNIQUE constraints which automatically create indexes
CREATE INDEX idx_states_restaurant_count ON states(restaurant_count DESC);
-- Note: cities has compound UNIQUE on (slug, state_name), index auto-created
CREATE INDEX idx_cities_state_id ON cities(state_id);
CREATE INDEX idx_cities_restaurant_count ON cities(restaurant_count DESC);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_states_updated_at
    BEFORE UPDATE ON states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_restaurant_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_location_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_restaurant_location();

-- Function to sync state counts
CREATE OR REPLACE FUNCTION sync_state_counts()
RETURNS void AS $$
BEGIN
  UPDATE states s
  SET
    restaurant_count = COALESCE(counts.restaurant_count, 0),
    updated_at = NOW()
  FROM (
    SELECT
      st.id as state_id,
      COUNT(DISTINCT r.id) as restaurant_count
    FROM states st
    LEFT JOIN restaurants r ON r.state IS NOT NULL AND (
      r.state = st.name
      OR r.state = st.abbreviation
      OR (st.abbreviation = 'DC' AND r.state IN ('DC', 'D.C.', 'Washington, D.C.', 'District of Columbia'))
    ) AND r.is_public = true
    GROUP BY st.id
  ) counts
  WHERE s.id = counts.state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to sync city counts
CREATE OR REPLACE FUNCTION sync_city_counts()
RETURNS void AS $$
BEGIN
  UPDATE cities c
  SET
    restaurant_count = COALESCE(counts.restaurant_count, 0),
    updated_at = NOW()
  FROM (
    SELECT
      ct.id as city_id,
      COUNT(DISTINCT r.id) as restaurant_count
    FROM cities ct
    LEFT JOIN restaurants r ON
      r.city = ct.name AND
      r.state = ct.state_name AND
      r.is_public = true
    GROUP BY ct.id
  ) counts
  WHERE c.id = counts.city_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update counts when restaurants change
-- Optimized to only run when location/visibility fields change
CREATE OR REPLACE FUNCTION trigger_sync_location_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if this is a top-level operation (not nested)
  -- This prevents recursive triggers and reduces overhead
  IF pg_trigger_depth() = 0 THEN
    PERFORM sync_state_counts();
    PERFORM sync_city_counts();
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Only trigger on INSERT/DELETE or when city/state/is_public fields change
CREATE TRIGGER restaurants_location_sync
  AFTER INSERT OR DELETE ON restaurants
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_location_counts();

CREATE TRIGGER restaurants_location_update_sync
  AFTER UPDATE OF city, state, is_public ON restaurants
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_location_counts();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert all 50 US states + DC
INSERT INTO states (slug, name, abbreviation) VALUES
  ('alabama', 'Alabama', 'AL'),
  ('alaska', 'Alaska', 'AK'),
  ('arizona', 'Arizona', 'AZ'),
  ('arkansas', 'Arkansas', 'AR'),
  ('california', 'California', 'CA'),
  ('colorado', 'Colorado', 'CO'),
  ('connecticut', 'Connecticut', 'CT'),
  ('delaware', 'Delaware', 'DE'),
  ('florida', 'Florida', 'FL'),
  ('georgia', 'Georgia', 'GA'),
  ('hawaii', 'Hawaii', 'HI'),
  ('idaho', 'Idaho', 'ID'),
  ('illinois', 'Illinois', 'IL'),
  ('indiana', 'Indiana', 'IN'),
  ('iowa', 'Iowa', 'IA'),
  ('kansas', 'Kansas', 'KS'),
  ('kentucky', 'Kentucky', 'KY'),
  ('louisiana', 'Louisiana', 'LA'),
  ('maine', 'Maine', 'ME'),
  ('maryland', 'Maryland', 'MD'),
  ('massachusetts', 'Massachusetts', 'MA'),
  ('michigan', 'Michigan', 'MI'),
  ('minnesota', 'Minnesota', 'MN'),
  ('mississippi', 'Mississippi', 'MS'),
  ('missouri', 'Missouri', 'MO'),
  ('montana', 'Montana', 'MT'),
  ('nebraska', 'Nebraska', 'NE'),
  ('nevada', 'Nevada', 'NV'),
  ('new-hampshire', 'New Hampshire', 'NH'),
  ('new-jersey', 'New Jersey', 'NJ'),
  ('new-mexico', 'New Mexico', 'NM'),
  ('new-york', 'New York', 'NY'),
  ('north-carolina', 'North Carolina', 'NC'),
  ('north-dakota', 'North Dakota', 'ND'),
  ('ohio', 'Ohio', 'OH'),
  ('oklahoma', 'Oklahoma', 'OK'),
  ('oregon', 'Oregon', 'OR'),
  ('pennsylvania', 'Pennsylvania', 'PA'),
  ('rhode-island', 'Rhode Island', 'RI'),
  ('south-carolina', 'South Carolina', 'SC'),
  ('south-dakota', 'South Dakota', 'SD'),
  ('tennessee', 'Tennessee', 'TN'),
  ('texas', 'Texas', 'TX'),
  ('utah', 'Utah', 'UT'),
  ('vermont', 'Vermont', 'VT'),
  ('virginia', 'Virginia', 'VA'),
  ('washington', 'Washington', 'WA'),
  ('west-virginia', 'West Virginia', 'WV'),
  ('wisconsin', 'Wisconsin', 'WI'),
  ('wyoming', 'Wyoming', 'WY'),
  ('washington-dc', 'Washington, D.C.', 'DC')
ON CONFLICT (slug) DO NOTHING;

-- Insert common cuisine types
INSERT INTO cuisines (name, slug, description) VALUES
  ('American', 'american', 'Classic American fare'),
  ('BBQ', 'bbq', 'Barbecue and smoked meats'),
  ('Italian', 'italian', 'Italian cuisine and pasta'),
  ('Mexican', 'mexican', 'Mexican and Tex-Mex cuisine'),
  ('Seafood', 'seafood', 'Fresh seafood and fish'),
  ('Burgers', 'burgers', 'Gourmet burgers and sandwiches'),
  ('Pizza', 'pizza', 'Pizza and flatbreads'),
  ('Asian', 'asian', 'Pan-Asian cuisine'),
  ('Breakfast', 'breakfast', 'Breakfast and brunch'),
  ('Southern', 'southern', 'Southern comfort food'),
  ('Diner', 'diner', 'Classic diner fare'),
  ('Steakhouse', 'steakhouse', 'Steaks and chophouse'),
  ('Cajun', 'cajun', 'Cajun and Creole cuisine'),
  ('Cuban', 'cuban', 'Cuban and Caribbean'),
  ('Greek', 'greek', 'Greek and Mediterranean'),
  ('Thai', 'thai', 'Thai cuisine'),
  ('Vietnamese', 'vietnamese', 'Vietnamese cuisine'),
  ('Korean', 'korean', 'Korean cuisine'),
  ('Indian', 'indian', 'Indian cuisine'),
  ('French', 'french', 'French cuisine')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon key can read)
CREATE POLICY "Public read episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Public read cuisines" ON cuisines FOR SELECT USING (true);
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (is_public = true);
CREATE POLICY "Public read dishes" ON dishes FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_episodes" ON restaurant_episodes FOR SELECT USING (true);
CREATE POLICY "Public read restaurant_cuisines" ON restaurant_cuisines FOR SELECT USING (true);
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);

-- Service role key bypasses RLS for admin operations
