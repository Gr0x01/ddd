---
title: Active Development Context
created: 2025-12-14
last-updated: 2025-12-25
maintainer: Claude
status: Active
---

> **Latest**: SEO Phase 3 complete - Content optimization for city, state, and homepage.

# Active Development Context

**Current Phase:** Phase 4 - Live & Indexing
**Status:** Production deployed, SEO indexing in progress
**Focus:** SEO optimization, monitoring, and iteration

---

## Current Production State

### Data
- **1,541 restaurants** - 100% enriched via LLM
- **1,151 verified open** / 390 closed / 0 unknown
- **572 episodes** imported with full metadata
- **8 curated routes** pre-calculated for popular corridors
- **2,550 dishes** categorized into 15 categories via LLM

### Pages Live
- Homepage with road trip hero + "By Dish" browse card
- `/roadtrip` - Road trip planner
- `/route/[slug]` - Individual route pages
- `/restaurant/[slug]` - 1,541 restaurant pages (dishes now clickable)
- `/restaurants` - Searchable restaurant list
- `/city/[state]/[city]` - City landing pages
- `/state/[state]` - State landing pages
- `/cuisines` and `/cuisines/[slug]` - Cuisine pages
- `/still-open` and `/closed` - Status pages
- `/episodes` and `/episode/[slug]` - Episode pages (now with dishes section)
- `/dishes` - Dish index with category browse
- `/dishes/[category]` - Category landing pages (BBQ, Seafood, Burgers, etc.)
- `/dish/[slug]` - Individual dish pages

### Infrastructure
- Deployed to Vercel
- Supabase PostgreSQL + PostGIS
- Google Search Console submitted
- PostHog analytics active
- **IndexNow** configured for Bing/Yandex/Naver (2,943 URLs submitted)

---

## Recently Completed

### SEO Phase 3: Content Optimization (Dec 25)
- **City page intro paragraphs**: Dynamic SEO text targeting "[City] diners" queries with restaurant counts and top cuisines
- **State page intro paragraphs**: Dynamic overview with cuisine types, city counts, and internal link to road trip planner
- **Homepage content sections**: Added "Popular Cities for Triple D Diners" (top 12 cities), "About Diners, Drive-ins and Dives" section, and "How to Use Triple D Map" feature grid

### SEO Phase 2: Schema Enhancement (Dec 25)
- **Homepage FAQ schema**: 5 FAQs targeting show name variations ("What is Diners, Drive-ins and Dives?", "How many restaurants?", etc.)
- **Homepage WebSite schema**: Added SearchAction for sitelinks search
- **Already had**: Restaurant schema on restaurant pages, breadcrumb schema on all page types

### SEO Phase 1: Meta Optimization (Dec 25)
- **Homepage**: New title "Diners, Drive-ins and Dives Restaurants | Guy Fieri Triple D Map"
- **City pages**: Title pattern now "{City} Diners from Triple D | Diners, Drive-ins and Dives in {City}, {State}"
- **State pages**: Title pattern now "{State} Diners | Diners, Drive-ins and Dives Restaurants in {State}"
- **Target keywords**: "[City] diners" (40k-90k volume), show name variations, "Triple D" branded queries

### Dish SEO Improvements (Dec 23)
- **Dish Categories**: Added category field to dishes table, categorized 2,550 dishes via LLM ($0.085)
- **Category Landing Pages**: `/dishes/[category]` for BBQ, Seafood, Burgers, Mexican, Italian, Asian, Breakfast, Comfort Food, Sandwiches, Pizza, Steaks, Southern, Cajun, Desserts, Other
- **Internal Linking**: Made dishes clickable on restaurant and episode pages
- **Homepage**: Added "By Dish" card to explore section (5 cards, 3+2 layout)
- **IndexNow**: Set up instant indexing for Bing/Yandex/Naver - 2,943 URLs submitted
- **Code Quality**: Created centralized `dish-categories.ts` constants file

### Homepage Redesign (Dec 15-16)
- Bold yellow hero with road trip search
- Popular routes section with curated routes
- Browse by state/cuisine
- Featured restaurants sections
- Full mobile responsiveness

### Road Trip Planner (Dec 15)
- MapLibre GL JS map (free, open source)
- City autocomplete with 1,444 cities (free)
- Route caching (80-90% cost savings)
- Configurable search radius (10-100 miles)
- Individual route pages at `/route/[slug]`

### Route Pages (Dec 16)
- Two-column hero layout
- Restaurant counts from database
- View count tracking
- SEO metadata and social sharing

---

## Technical Debt

**Low Priority (MVP is fine):**
- Route cache N+1 query (fetches 100 routes, filters client-side)
- No automatic cache cleanup for expired routes
- Playwright tests not yet run

**Not Blocking:**
- Could add PostgreSQL index on normalized text for O(1) cache lookups
- Could add localStorage caching for city data

---

## Environment

**Required Keys:**
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `GOOGLE_PLACES_API_KEY` (also used for Directions API)

**Optional:**
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`

---

## Key Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Build for production
npm run type-check             # TypeScript verification

# Testing
npm run test:e2e               # Playwright tests
npm run test:e2e:ui            # Interactive test mode

# Data Operations
npm run populate-routes        # Insert curated routes
npm run generate-maps          # Generate route map images
npm run geocode                # Geocode restaurants
```

---

## Active Project: SEO Optimization

**Status**: Planning complete, ready for implementation
**Document**: `projects/seo-optimization.md`

### DataForSEO Analysis (Dec 25)
- Ran competitive analysis vs dinersdriveinsdiveslocations.com
- **Gap**: Competitor has 39,377 keywords (445k traffic) vs our 57 keywords (32 traffic)
- **Key opportunities identified**:
  - "[City] diners" queries (40k-90k volume each)
  - Show name variations (90k volume)
  - Guy Fieri branded queries (33k volume)
- Created `scripts/seo/dataforseo-analysis.ts` for ongoing tracking

### Implementation Phases
1. **Phase 1**: Meta optimization (quick wins)
2. **Phase 2**: Schema markup enhancement
3. **Phase 3**: Content optimization
4. **Phase 4**: Internal linking
5. **Phase 5**: New landing pages (optional)

---

## Next Steps

1. ~~**SEO Phase 1** - Implement meta tag optimizations (homepage, city, state pages)~~ ✅ Done
2. ~~**SEO Phase 2** - Add Restaurant schema, FAQ schema to homepage, breadcrumb schema~~ ✅ Done
3. ~~**SEO Phase 3** - Content optimization (city/state intro text, homepage sections)~~ ✅ Done
4. **Monitor indexing** - Track Google Search Console + DataForSEO results
5. **Run Playwright tests** - Verify all pages work correctly
6. **Performance optimization** - Lighthouse audits
7. **SEO Phase 4** - Internal linking improvements (optional)

---

## Related Documents

- `core/quickstart.md` - Project overview and key commands
- `projects/seo-optimization.md` - **SEO keyword gap analysis and implementation plan**
- `projects/homepage-redesign.md` - Homepage implementation details
- `archive/roadtrip-planner.md` - Road trip technical architecture
- `architecture/enrichment-system.md` - LLM enrichment details
