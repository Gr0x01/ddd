---
Last-Updated: 2025-12-14
Maintainer: RB
Status: Phase 1A - Foundation + Latest Episodes (SEO Priority)
---

# Active Context: DDD (Diners, Drive-ins and Dives)

## Current Status
- **Phase**: Phase 1A - Foundation + Latest Episodes (SEO Priority)
- **Mode**: Get pages live for Google indexing ASAP
- **Focus**: Database + newest DDD episodes (2024-2025) + static pages
- **Strategy**: Newest-to-oldest episodes (better survival rate, fresher SEO)
- **Blocker**: None - starting fresh

## Phase Progress Tracker

### ✅ Phase 1A: Foundation + Latest Episodes (Week 1) - SEO PRIORITY
**Goal**: Database + 50-100 newest restaurants + static pages deployed for Google indexing

**Foundation:**
- [ ] Next.js 14 project initialization with TypeScript
- [ ] Supabase project setup with PostGIS extension
- [ ] Database schema implementation (all tables)
- [ ] Environment variables configured

**Latest Episode Data (2024-2025):**
- [ ] Research latest episode sources (Food Network, Wikipedia, fan sites)
- [ ] Collect most recent 2-3 seasons of episode data
- [ ] Extract restaurant names/locations from latest episodes
- [ ] Manual entry of 50-100 newest restaurants
- [ ] Basic enrichment (addresses, cities, states)

**Static Pages (SSG for SEO):**
- [ ] Restaurant detail pages (`/restaurant/[slug]`)
- [ ] City landing pages (`/city/[state]/[city]`)
- [ ] State landing pages (`/state/[state]`)
- [ ] Homepage with restaurant browse/list
- [ ] Basic styling with Tailwind

**Deployment:**
- [ ] Deploy to Vercel
- [ ] Verify all pages render correctly
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor indexing status

### ⏳ Phase 1B: Interactive Features (Week 2)
**Goal**: Add client-side interactivity (map, filters, search)

- [ ] Leaflet map integration
- [ ] Restaurant markers on map
- [ ] Client-side filtering (city, state, cuisine)
- [ ] Search functionality (basic text search)
- [ ] Mobile optimization
- [ ] Performance tuning

### ⏳ Phase 2: Road Trip Planner (Week 3-4)
**Goal**: Unique differentiator - route-based discovery

- [ ] Google Directions API integration
- [ ] Point A → Point B route interface
- [ ] PostGIS route distance calculations
- [ ] Restaurants along route display
- [ ] Shareable road trip URLs (`/roadtrip/[slug]`)
- [ ] Road trip page SEO optimization

### ⏳ Phase 3: Historical Backfill (Ongoing)
**Goal**: Progressively add older episodes (newest → oldest)

**2023-2022 Seasons:**
- [ ] Collect episode data
- [ ] Add restaurants (~100-150 more)
- [ ] Deploy updated pages

**2021-2020 Seasons:**
- [ ] Collect episode data
- [ ] Add restaurants (~100-150 more)
- [ ] Deploy updated pages

**2019-2018 Seasons:**
- [ ] Continue backfill process
- [ ] Target: 500+ total restaurants

**2017-Earlier (to 2007):**
- [ ] Complete historical backfill
- [ ] Target: 1,000-1,500 total restaurants

### ⏳ Phase 4: Enrichment & Polish (Ongoing)
**Goal**: Enhance data quality and user experience

- [ ] LLM enrichment pipeline (descriptions, cuisines)
- [ ] Google Places API integration (status verification)
- [ ] Open/closed status system with "Last verified" dates
- [ ] Photo collection and storage
- [ ] Google/Yelp ratings import
- [ ] Episode pages with featured restaurants
- [ ] Cuisine filtering system
- [ ] "Near me" geolocation feature

### Database Schema Design (Detailed)

**Core Tables:**

**restaurants** (Primary entity)
- Basic: name, slug, address, city, state, zip, country, neighborhood
- Location: latitude, longitude (PostGIS geography type for geo queries)
- Contact: phone, website_url, social_urls (jsonb)
- Hours: hours_json, hours_notes
- Status: status (open/closed/unknown), last_verified, verification_source
- Episode: first_episode_id, first_air_date
- Content: description, dishes_featured[], guy_quote
- Media: photo_url, photos[] (jsonb)
- Ratings: google_rating, yelp_rating, google_review_count
- SEO: meta_description
- Enrichment: enrichment_status, last_enriched_at

**episodes**
- Basic: season, episode_number, title, slug
- Meta: air_date, description, meta_description
- Content: episode_summary, cities_visited[]

**cuisines** (categories for filtering)
- Basic: name, slug, description, meta_description
- Hierarchy: parent_id (optional, for subcategories like "BBQ" → "Texas BBQ")

**dishes** (Guy's featured dishes)
- Basic: name, slug, description
- Link: restaurant_id, episode_id
- Content: guy_reaction, is_signature_dish

**Junction Tables:**
- `restaurant_cuisines` - Many-to-many (restaurant_id, cuisine_id)
- `restaurant_episodes` - Many-to-many (restaurant_id, episode_id, segment_notes)

**Reference Data:**
- `states` - US states (name, abbreviation, slug, meta_description, restaurant_count)
- `cities` - Cities (name, slug, state_id, meta_description, restaurant_count)

**Database Views:**
- `restaurants_full` - Restaurants with cuisines, episodes, city/state aggregated
- `city_stats` - Cities with restaurant counts, open/closed breakdown
- `state_stats` - States with restaurant counts
- `episode_restaurants` - Episodes with all restaurants listed

## Tech Stack (Inherited from Chefs)
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API routes, Supabase PostgreSQL
- **Maps**: Leaflet.js with OpenStreetMap
- **LLM**: OpenAI gpt-4o-mini (Flex tier)
- **Search**: Tavily API for web data
- **Analytics**: PostHog
- **Testing**: Playwright E2E
- **Deployment**: Vercel

## Data Strategy
Following the chefs project enrichment model:
1. **Episode Data Collection**: Scrape/parse episode lists from Food Network
2. **Restaurant Discovery**: Extract restaurant names and locations from episode data
3. **Enrichment**: Use Tavily + OpenAI to gather details (cuisine, price, description)
4. **Verification**: Google Places API for status and place IDs
5. **Photos**: Scrape from Google Places or restaurant websites

## Current Sprint Focus

### Phase 1: MVP Foundation (2-3 weeks)
**Database & Data:**
- [ ] Design and implement full schema with PostGIS
- [ ] Initial data scrape (Wikipedia episode lists)
- [ ] Manual data entry for first 50-100 restaurants
- [ ] Set up enrichment pipeline

**Core Pages:**
- [ ] Homepage with map + search + browse
- [ ] Restaurant pages with status badges, episodes, dishes
- [ ] City pages with local restaurants + map
- [ ] State pages with all cities
- [ ] **Road Trip Planner** - Point A → Point B with route and restaurants

**Technical:**
- [ ] Next.js 14 initialization
- [ ] Supabase with PostGIS extension
- [ ] Leaflet map integration
- [ ] Google Directions API setup (for road trips)

### Key Differentiators in MVP
1. **Open/Closed Status** - "Last verified: [date]" trust signal
2. **Road Trip Feature** - Shareable URLs like `/roadtrip/austin-to-houston`
3. **Interactive Map** - Filterable, fast, mobile-friendly
4. **City/State SEO Pages** - Landing pages for geographic searches

## Key Scripts (Planned)
- `scripts/harvest-episodes.ts` - Scrape episode lists from sources
- `scripts/enrich-restaurants.ts` - LLM enrichment for restaurant data
- `scripts/enrich-google-places.ts` - Backfill Google Place IDs
- `scripts/verify-status.ts` - Check if restaurants are still open

## Reference Projects
- **chefs**: `/Users/rb/Documents/coding_projects/chefs` (primary reference)
- **shark-tank**: `/Users/rb/Documents/coding_projects/shark-tank` (secondary reference)
