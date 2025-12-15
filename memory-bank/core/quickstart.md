---
Last-Updated: 2025-12-16
Maintainer: RB
Status: Phase 4 - Live & Indexing
---

# Quickstart: DDD (Diners, Drive-ins and Dives)

## Current Status
- **Phase**: Phase 4 - Live & Indexing
- **Version**: 1.0.0
- **Environment**: Production (deployed on Vercel)
- **Data**: 572 episodes, 1,541 restaurants (100% enriched)
- **Status Verified**: 1,151 open, 390 closed, 0 unknown (100% verified)
- **SEO**: Sitemap submitted, Google indexing in progress
- **Market**: Targeting 263k+ monthly visitors (based on competitor analysis)

---

## What's Built & Deployed

### Core Pages
| Route | Purpose |
|-------|---------|
| `/` | Homepage with road trip hero, popular routes, browse sections |
| `/roadtrip` | Road trip planner with map and restaurant discovery |
| `/route/[slug]` | Individual route pages with restaurant lists |
| `/restaurant/[slug]` | 1,541 restaurant detail pages |
| `/restaurants` | Searchable restaurant list with filters |
| `/city/[state]/[city]` | City landing pages |
| `/state/[state]` | State landing pages |
| `/cuisines` | Browse all cuisine types |
| `/cuisines/[slug]` | Cuisine detail pages |
| `/still-open` | Verified open restaurants (trust signal) |
| `/closed` | Closed restaurants (curiosity traffic) |
| `/episodes` | All episodes list |
| `/episode/[slug]` | Episode detail pages |

### Key Features
- **Road Trip Planner**: Enter origin/destination, find restaurants along route
- **City Autocomplete**: 1,444 US cities with fuzzy matching (FREE)
- **Route Caching**: 80-90% cost savings on Google Directions API
- **MapLibre GL JS**: Free, open-source map rendering
- **100% Status Verification**: All restaurants verified open/closed
- **SEO Infrastructure**: Sitemap, robots.txt, structured data

---

## Tech Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Maps**: MapLibre GL JS (free), Leaflet.js
- **Data Source**: Wikipedia (via Tavily, cached in Supabase)
- **Enrichment**: OpenAI gpt-4o-mini, Tavily, Google Places API
- **Deployment**: Vercel
- **Analytics**: PostHog

---

## Key Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks

# Testing
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # Interactive test mode

# Data Operations
npm run populate-routes  # Insert curated routes
npm run generate-maps    # Generate route map images
npm run geocode          # Geocode restaurants

# Enrichment (if needed)
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10
npx tsx scripts/ingestion/verify-status.ts --limit 50
npx tsx scripts/ingestion/check-enrichment.ts
```

---

## Project Structure

### Pages (`src/app/`)
```
src/app/
├── page.tsx                    # Homepage
├── roadtrip/page.tsx           # Road trip planner
├── route/[slug]/page.tsx       # Route detail pages
├── restaurant/[slug]/page.tsx  # Restaurant pages
├── restaurants/page.tsx        # Restaurant list
├── city/[state]/[city]/page.tsx
├── state/[state]/page.tsx
├── cuisines/page.tsx
├── cuisines/[slug]/page.tsx
├── still-open/page.tsx
├── closed/page.tsx
├── episodes/page.tsx
├── episode/[slug]/page.tsx
├── sitemap.ts
└── robots.ts
```

### Components (`src/components/`)
```
src/components/
├── home/                # Homepage hero components
├── homepage/            # Homepage sections (PopularRoutes, BrowseSection, etc.)
├── roadtrip/            # Road trip planner components
├── restaurant/          # Restaurant cards and filters
├── ui/                  # Shared UI components (Button, Card, RouteCard, etc.)
├── seo/                 # Schema.org, breadcrumbs
└── analytics/           # PostHog integration
```

### Database (`supabase/migrations/`)
- 14 migrations total
- Core tables: restaurants, episodes, cuisines, dishes, cities, states
- Route caching: route_cache with PostGIS spatial queries
- RPC functions: get_restaurants_near_route, get_routes_with_counts

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key
GOOGLE_PLACES_API_KEY=your_google_key  # Also used for Directions API

# Optional
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Data Summary

| Entity | Count | Status |
|--------|-------|--------|
| Restaurants | 1,541 | 100% enriched |
| Open | 1,151 | Verified |
| Closed | 390 | Verified |
| Episodes | 572 | Imported |
| Curated Routes | 8 | Active |
| Cities | 1,444 | Autocomplete |

---

## Recent Commits

```
53bef7b feat: Add search/filter components to listing pages
9222836 fix: Show actual restaurant counts on homepage popular routes
82b55e6 perf: Fix database query inefficiencies across 8 pages
bd5ddbe fix: Show actual open restaurant count on homepage
70ddd6c security: Update dependencies and add rate limiting to roadtrip API
af68069 refactor: Replace custom SVG icons with Lucide
c5f9423 feat: Homepage road trip search redirects to route page
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `development/activeContext.md` | Current sprint focus |
| `development/progress.md` | Work log |
| `projects/homepage-redesign.md` | Homepage implementation |
| `archive/roadtrip-planner.md` | Road trip architecture |
| `architecture/enrichment-system.md` | LLM enrichment details |
| `architecture/techStack.md` | Technology decisions |
