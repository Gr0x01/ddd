---
Last-Updated: 2025-12-15
Maintainer: RB
Status: Phase 3 Complete - Ready for Deployment ✅
---

# Quickstart: DDD (Diners, Drive-ins and Dives)

## Current Status
- **Phase**: Phase 3 Complete - Ready for Deployment ✅
- **Version**: 0.3.0
- **Environment**: Development (SEO ready for deployment)
- **Focus**: Run tests → Deploy to production
- **Data Available**: 572 episodes, 1,541 restaurants (all imported)
- **Enriched**: 1,541 restaurants (100.0%) with full LLM enrichment ✅
- **Status Verified**: 1,151 open, 390 closed, 0 unknown (100% verified!) 🎉
- **SEO Ready**: Sitemap, robots.txt, high-value pages, full metadata
- **Market**: Targeting 263k+ monthly visitors (based on competitor analysis)

## What We Actually Have

**✅ Built:**
- Wikipedia data pipeline (cache → parse → import)
- Database schema with PostGIS
- Restaurant, city, state, cuisine pages
- Import scripts that work
- **Enrichment system (LLM + Tavily + Google Places)**
- **CLI scripts for enrichment, status verification, episodes**
- **Complete SEO infrastructure (sitemap, robots.txt, metadata)**
- **High-value SEO pages (/still-open, /closed, /cuisines)**
- **1,539 restaurants fully enriched** (descriptions, cuisines, prices, dishes, Guy quotes)
- **Interactive map** (Leaflet with filtering)

**❌ NOT Built:**
- No Playwright tests run
- No deployment yet

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Data Source:** Wikipedia (via Tavily, cached in Supabase)
- **Deployment:** Vercel (planned)
- **Testing:** Playwright (not run yet)

**Future (Phase 2):**
- OpenAI gpt-4o-mini for descriptions
- Google Places API for status/addresses
- Tavily for web search

---

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

# Data Import (Phase 1)
npx tsx scripts/ingestion/cache-wikipedia.ts              # Cache Wikipedia (once/week)
npx tsx scripts/ingestion/import-from-wikipedia.ts --recent  # Import 40 newest episodes
npx tsx scripts/ingestion/verify-import.ts                # Verify data

# Enrichment (Phase 2 - ready to use)
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10        # Enrich 10 restaurants
npx tsx scripts/ingestion/enrich-restaurants.ts --all             # Enrich all pending
npx tsx scripts/ingestion/verify-status.ts --limit 50             # Verify restaurant status
npx tsx scripts/ingestion/enrich-episodes.ts --limit 10           # Generate episode SEO descriptions
npx tsx scripts/ingestion/check-enrichment.ts                     # Verify enriched data
```

---

## What We Built

**Data Pipeline:**
- `scripts/ingestion/cache-wikipedia.ts` - Fetch Wikipedia via Tavily, cache in Supabase
- `scripts/ingestion/parse-wikipedia.ts` - Parse 572 episodes from cache
- `scripts/ingestion/import-from-wikipedia.ts` - Import to database
- `scripts/ingestion/verify-import.ts` - Verify data integrity

**Database:**
- `supabase/migrations/001_initial_schema.sql` - Full schema with PostGIS
- `supabase/migrations/002_add_cache_table.sql` - Cache for API responses

**Pages (Built, Not Tested):**
- `src/app/page.tsx` - Homepage with stats
- `src/app/restaurant/[slug]/page.tsx` - Restaurant details
- `src/app/city/[state]/[city]/page.tsx` - City browse
- `src/app/state/[state]/page.tsx` - State browse
- `src/app/cuisines/page.tsx` - Browse by cuisine
- `src/app/cuisines/[slug]/page.tsx` - Cuisine detail pages
- `src/app/still-open/page.tsx` - Verified open restaurants (trust signal)
- `src/app/closed/page.tsx` - Closed restaurants (curiosity traffic)

**SEO Infrastructure:**
- `src/app/sitemap.ts` - Dynamic sitemap with all pages
- `src/app/robots.ts` - Search crawler guidance + AI bot blocking
- `src/lib/schema.ts` - Schema.org structured data with XSS protection
- All metadata uses full "Diners, Drive-ins and Dives" (no abbreviations)

---

## Current Reality Check

**What Works:**
- ✅ Wikipedia data cached in Supabase
- ✅ 572 episodes, 1,695 restaurants parsed
- ✅ Import script works (tested with 1 episode)
- ✅ Database schema is ready

**What Works (Added Dec 14 - Morning):**
- ✅ Enrichment system fully built and tested
- ✅ LLM integration (OpenAI gpt-4o-mini with Flex tier)
- ✅ Tavily web search for restaurant context
- ✅ Google Places API for status verification (optional)
- ✅ CLI scripts for all enrichment operations

**What Works (Added Dec 14 - Evening):**
- ✅ Complete SEO infrastructure
- ✅ Dynamic sitemap with all page types
- ✅ Robots.txt with AI bot blocking
- ✅ High-value pages (/still-open, /closed, /cuisines)
- ✅ Full show name in all metadata (no "DDD" abbreviations)
- ✅ XSS-protected JSON-LD structured data
- ✅ ISR caching on all dynamic pages
- ✅ Database-level aggregations (no N+1 queries)

**What Works (Added Dec 15 - Morning):**
- ✅ **100% enrichment complete!** All 1,541 restaurants enriched
- ✅ **100% status verified!** 1,151 open, 390 closed, 0 unknown 🎉
- ✅ Parallel enrichment (50 concurrent workers)
- ✅ Fixed Tavily rate limiter (900/min instead of 30/min)
- ✅ Fixed closed date parsing (handles invalid LLM responses)
- ✅ Manual corrections applied:
  - The Kitchen → Portsmouth, NH (open)
  - Wrigleyville Grill → San Antonio, TX (open, not Chicago!)
  - Bubba's Diner, Los Tapatios, Town Talk Diner → closed
  - The Pie Dump → open
- ✅ Total cost: $6.78 for full enrichment
- ✅ Total time: ~15 minutes for all 1,541 restaurants

**What Doesn't Exist:**
- ❌ No Playwright tests run
- ❌ Pages exist but not tested in browser
- ❌ Not deployed

## Next Decision

**Option 1: Quick Launch (Recommended)**
```bash
# Import recent data
npx tsx scripts/ingestion/import-from-wikipedia.ts --recent

# Test pages
npm run test:e2e

# Deploy to Vercel
# (user handles this)
```

**Option 2: Build Enrichment First**
- Takes 2-3 weeks to build full enrichment
- Delays launch
- Better initial data quality

**Option 3: Hybrid**
- Deploy basic data NOW
- Build enrichment later
- Progressive enhancement

---

## Documentation

- `development/activeContext.md` - What we actually built
- `development/progress.md` - Today's work log
- `supabase/migrations/` - Database schema
