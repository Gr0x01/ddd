---
title: DDD Memory Bank - Quickstart
created: 2025-12-14
last-updated: 2025-12-14
maintainer: Claude
status: Active
---

# Memory Bank Quickstart

**One-page situational awareness for the DDD (Diners, Drive-ins and Dives) restaurant directory app.**

---

## What This Project Is

A Next.js 15 app with Supabase backend for browsing DDD restaurants by city, state, cuisine, and episode. Phase 1 (MVP+) focuses on solid foundations with enriched restaurant data via LLM-powered ingestion.

**Live URL:** TBD (Vercel deployment pending)

**Repository:** Local only (no git remote yet)

**Status:** Active Development - Phase 1: Core Features

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS + RLS)
- **Enrichment:** OpenAI gpt-4o-mini (Flex tier), Tavily Search, Google Places API
- **Deployment:** Vercel (Next.js) + Supabase Cloud
- **Testing:** Playwright (E2E)

**Key Dependencies:**
- `@supabase/ssr` - Server-side Supabase client
- `openai` - LLM enrichment
- `zod` - Schema validation
- `@playwright/test` - E2E testing

---

## Current Phase: Phase 1 - Core Features

**Goal:** Solid MVP+ with enriched restaurant data, browse by location/cuisine, working search

**Active Work:**
- LLM enrichment system design (adapting from chefs project)
- Database schema refinement
- City/state browse pages
- Restaurant detail pages

**Completed:**
- Database schema with PostGIS
- Initial project structure
- Supabase integration
- Environment configuration

---

## Key Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build
npm run start                  # Production server

# Database
npx supabase db reset          # Reset local DB + run migrations
npx supabase migration new     # Create new migration
npx supabase gen types         # Generate TypeScript types

# Testing
npm run test:e2e              # Run Playwright tests (headless)
npm run test:e2e:ui           # Run Playwright tests (UI mode)
npm run test:e2e:debug        # Debug Playwright tests

# Enrichment (future)
npm run enrich -- add         # Add restaurant with LLM enrichment
npm run enrich -- status      # Batch verify restaurant status
npm run enrich -- refresh     # Refresh stale restaurant data
```

---

## Directory Structure

```
ddd/
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── page.tsx          # Homepage (city grid)
│   │   ├── state/            # State browse pages
│   │   ├── city/             # City browse pages
│   │   └── restaurant/       # Restaurant detail pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   │   ├── supabase.ts      # Supabase client
│   │   └── env.ts           # Environment config
├── supabase/
│   └── migrations/          # SQL migrations
├── scripts/
│   └── ingestion/
│       └── enrichment/      # LLM enrichment system (in design)
├── memory-bank/             # Project memory and documentation
│   ├── core/               # Must-read startup context
│   ├── development/        # Active engineering focus
│   └── architecture/       # System design and patterns
├── tests/
│   └── e2e/                # Playwright tests
└── package.json
```

---

## Environment Variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM Enrichment (for ingestion, not runtime)
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
GOOGLE_PLACES_API_KEY=AIza...
```

**Files:**
- `.env.local` - Development environment variables
- `.env.production` - Production environment variables (Vercel)

---

## Database Schema (Simplified)

**Core Tables:**
- `restaurants` - Restaurant records with PostGIS location data
- `episodes` - DDD episode metadata
- `restaurant_episodes` - Junction table (many-to-many)
- `cuisines` - Cuisine types (American, BBQ, Italian, etc.)
- `restaurant_cuisines` - Junction table
- `cities` - City metadata with restaurant counts
- `states` - State metadata with restaurant counts

**Key Features:**
- PostGIS for geographic queries (radius search, road trip planner)
- RLS policies for public read access
- Automated triggers for restaurant counts
- Enrichment tracking (last_enriched_at, enrichment_status)

**Full Schema:** `supabase/migrations/001_initial_schema.sql`

---

## Enrichment System (In Design)

**Purpose:** LLM-powered discovery and enhancement of restaurant data

**Architecture Layers:**
1. **Facade:** `llm-enricher.ts` - Simplified public API
2. **Workflows:** Multi-step orchestration (manual addition, status sweep, refresh stale)
3. **Services:** Single-purpose business logic (enrichment, status verification, episode discovery)
4. **Repositories:** Database access layer (restaurant, episode, city)
5. **Shared Utilities:** Token tracking, LLM client, result parsing, retry handling

**Reference:**
- Design: `memory-bank/architecture/enrichment-system.md`
- Quick Reference: `memory-bank/architecture/enrichment-reference.md`
- Source: `/Users/rb/Documents/coding_projects/chefs/scripts/ingestion/enrichment/`

**Cost:** ~$0.06-$0.14 per restaurant (full enrichment)

---

## Active Context

**Current Sprint:** LLM enrichment system architecture design

**Blockers:** None

**Next Steps:**
1. Implement enrichment repositories
2. Implement enrichment services (Google Places, Tavily + LLM)
3. Implement workflows (manual addition, status sweep)
4. Create facade interface
5. Build CLI scripts for common operations

**See:** `memory-bank/development/activeContext.md` for detailed sprint goals

---

## Key Decisions

1. **Solo Dev MVP+:** Prioritize working solutions over perfect architecture
2. **PostgreSQL + PostGIS:** Enable geographic queries (radius search, road trip planner)
3. **Server Components First:** Use Next.js 15 Server Components for data fetching
4. **RLS for Security:** Row Level Security policies instead of API middleware
5. **LLM Enrichment:** Use OpenAI gpt-4o-mini (Flex tier) for 50% cost savings
6. **Google Places Primary:** Use Google Places API as primary status source, LLM as fallback

---

## Common Tasks

### Add a New Restaurant (Manual, Future)
```bash
npm run enrich -- add \
  --name "Hodad's" \
  --city "San Diego" \
  --state "California" \
  --episode "S01E01"
```

### Reset Database
```bash
npx supabase db reset
```

### Generate TypeScript Types
```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### Run Tests
```bash
npm run test:e2e
```

---

## Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard (pending deployment)
- **OpenAI Pricing:** https://openai.com/pricing
- **Tavily Docs:** https://docs.tavily.com/
- **Google Places API:** https://developers.google.com/maps/documentation/places

---

## Getting Help

**Memory Bank Navigation:**
1. Read this file first (quickstart.md)
2. Check `development/activeContext.md` for current sprint
3. Review `architecture/techStack.md` for stack details
4. See `architecture/enrichment-system.md` for enrichment design
5. Use `architecture/enrichment-reference.md` for API examples

**When Stuck:**
- Check `development/progress.md` for what's been completed
- Review database schema: `supabase/migrations/001_initial_schema.sql`
- Search codebase for existing patterns before creating new ones

---

## Project Health

**Build:** ✅ Passing
**Tests:** ✅ Passing (E2E suite in development)
**Type Safety:** ✅ Strict TypeScript
**Database:** ✅ Migrations up-to-date
**Deployment:** ⏸️ Pending (Vercel setup needed)
