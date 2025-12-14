---
Last-Updated: 2025-12-14
Maintainer: RB
Status: Phase 1A - Data Pipeline Complete
---

# Quickstart: DDD (Diners, Drive-ins and Dives)

## Current Status
- **Phase**: Phase 1A - Data Pipeline Complete ✅
- **Version**: 0.1.0
- **Environment**: Development (Ready for deployment)
- **Focus**: Import recent episodes (2024-2026) → Deploy → SEO indexing
- **Data Available**: 572 episodes, 1,695 restaurants (cached in Supabase)
- **Test Import**: 1 episode, 3 restaurants successfully imported
- **Market**: Targeting 263k+ monthly visitors (based on competitor analysis)

## What We Actually Have

**✅ Built:**
- Wikipedia data pipeline (cache → parse → import)
- Database schema with PostGIS
- Restaurant, city, state pages (not tested)
- Import scripts that work

**❌ NOT Built:**
- No enrichment system
- No LLM integration
- No Google Places
- No tests run
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

# Enrichment (Phase 2 - not built yet)
# npx tsx scripts/enrich-restaurants.ts     # LLM enrichment (descriptions, cuisines)
# npx tsx scripts/enrich-google-places.ts   # Google Places verification
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

**Pages (Not Tested):**
- `src/app/page.tsx` - Homepage with stats
- `src/app/restaurant/[slug]/page.tsx` - Restaurant details
- `src/app/city/[state]/[city]/page.tsx` - City browse
- `src/app/state/[state]/page.tsx` - State browse

**What We DON'T Have:**
- No enrichment system
- No LLM descriptions
- No Google Places integration
- No tests run

---

## Current Reality Check

**What Works:**
- ✅ Wikipedia data cached in Supabase
- ✅ 572 episodes, 1,695 restaurants parsed
- ✅ Import script works (tested with 1 episode)
- ✅ Database schema is ready

**What Doesn't Exist:**
- ❌ No enrichment system
- ❌ No LLM integration
- ❌ No Google Places
- ❌ No tests run
- ❌ Pages exist but not tested
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
