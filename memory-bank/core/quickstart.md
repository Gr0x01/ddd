---
Last-Updated: 2025-12-14
Maintainer: RB
Status: Initial Setup
---

# Quickstart: DDD (Diners, Drive-ins and Dives)

## Current Status
- **Phase**: Phase 1A - Foundation + Latest Episodes (Week 1)
- **Version**: 0.1.0
- **Environment**: Development (Not yet deployed)
- **Focus**: SEO-first strategy - newest DDD episodes + static pages for Google indexing
- **Strategy**: Newest-to-oldest episodes (2024-2025 first, then backfill to 2007)
- **Market**: Targeting 263k+ monthly visitors (based on competitor analysis)

## Key Commands
```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Testing
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # Interactive test mode

# Enrichment (when ready)
npx tsx scripts/harvest-episodes.ts        # Populate episode cache
npx tsx scripts/extract-from-cache.ts      # Extract restaurants from cache
npx tsx scripts/enrich-google-places.ts    # Backfill Google Place IDs
```

## Adding a New Episode or Restaurant
Use enrichment scripts to add episodes and restaurants from DDD show:
1. Creates episode records in database
2. Creates restaurant records for each location
3. Runs full enrichment (description, cuisine type, price tier, status)
4. Generates episode SEO descriptions
5. Reports Google Places status

**Local LLM**: Auto-detects `LM_STUDIO_URL` env var and uses local LLM if available.

## Active Focus (MVP Phase 1)
- **Database**: Full schema with PostGIS for geo queries
- **Road Trip Feature**: Point A → Point B with restaurants along route
- **Data Collection**: Wikipedia episode scraping, initial 50-100 restaurants
- **Core Pages**: Restaurant, city, state pages with SEO optimization
- **Status Verification**: "Last verified" system for open/closed restaurants

## Quick Links
- [Project Brief](./projectbrief.md)
- [Tech Stack](../architecture/techStack.md)
- [Active Context](../development/activeContext.md)

## MVP Checklist (Phase 1: 2-3 weeks)
1. ⏳ Next.js 14 project initialization
2. ⏳ Supabase project with PostGIS extension
3. ⏳ Database schema implementation (restaurants, episodes, cuisines, dishes)
4. ⏳ Initial data scrape (Wikipedia + manual entry)
5. ⏳ Restaurant pages with status badges
6. ⏳ City/State SEO pages
7. ⏳ Interactive map with Leaflet
8. ⏳ **Road Trip Planner** (Point A → Point B feature)
9. ⏳ Google Directions API integration
10. ⏳ Environment variables (OpenAI, Tavily, Google Places, Directions)

## Database Status (Target)
- **Restaurants**: 1,000-1,500+ DDD locations (across 30+ seasons, show started 2007)
- **Episodes**: 500+ episodes (still producing new content)
- **Coverage**: 300+ cities, 50 states, international locations
- **Data Quality Goals**:
  - 95%+ Google Places verification
  - 90%+ open/closed status verified
  - 100% episode-restaurant linkage
  - Dishes featured for top restaurants

## Admin Panel (Planned)
- **Login**: `/admin/login` (Supabase Auth with magic link)
- **Entities**: `/admin/entities` (restaurant management)
- **Review Queue**: `/admin/review` (pending approvals)
- **Activity Log**: `/admin/activity` (audit trail)
- **Data Dashboard**: `/admin/data` (completeness metrics)
- **Episodes**: `/admin/episodes` (episode visibility management)
- **Enrichment Jobs**: `/admin/enrichment-jobs` (job monitoring)
