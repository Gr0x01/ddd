---
title: Active Development Context
created: 2025-12-14
last-updated: 2025-12-14 (evening)
maintainer: Claude
status: Active
---

# Active Development Context

**Current Phase:** Phase 2.5 - Enrichment System Complete + Status Detection
**Sprint Goal:** Full enrichment operational, ready for batch processing
**Timeline:** Week of Dec 14, 2025

---

## What We Actually Built Today

### ✅ Completed
1. **Wikipedia Data Pipeline**
   - Cache table in Supabase
   - Tavily integration to fetch Wikipedia episode list (one-time, 7-day cache)
   - Parser to extract 572 episodes, 1,695 restaurants from cached data
   - Import script with --limit, --recent, --all flags
   - Successfully tested: 1 episode, 3 restaurants imported

2. **Database Schema**
   - Episodes, restaurants, junction tables
   - PostGIS for geographic data
   - Cache table for API responses

3. **Pages (Not Tested)**
   - Restaurant detail pages
   - City pages
   - State pages
   - Homepage

### ✅ Completed (Dec 14 - Evening Session)
1. **Status Detection & Closure Tracking**
   - Added `status` field (`open`, `closed`, `unknown`)
   - Added `closed_date` field (DATE) with partial date parsing
   - LLM extracts closure dates from Wikipedia (handles `YYYY`, `YYYY-MM`, `YYYY-MM-DD`)
   - Example: Brint's Diner correctly identified as closed 2014-10-01

2. **Episode-Aware Enrichment**
   - Enrichment now receives episode context (title, season, episode number)
   - Dishes linked to specific episodes
   - Segment notes capture what happened during Guy's visit
   - Guy quotes now episode-specific

3. **Contact Info Extraction**
   - Address, phone, website extracted from Tavily search results
   - Stored in restaurants table
   - Example: Brint's Diner → "4834 East Lincoln Street, Wichita, Kansas" + phone

4. **Photo Storage System**
   - Google Places photo download → Supabase Storage
   - Photos stored as `restaurant-photos/{restaurant_id}/{slug}-{n}.jpg`
   - Public URLs saved to `restaurants.photos` JSONB array
   - Optional `--with-photos` flag (adds $0.084/restaurant)

5. **Critical Bug Fix: Tavily Content Truncation**
   - **Problem:** `include_raw_content: false` truncated Wikipedia articles
   - **Impact:** Missed closure dates, incomplete info
   - **Fix:** Changed to `include_raw_content: true`
   - **Result:** Full Wikipedia content now available to LLM
   - Commit: a860c6b

### ✅ Completed (Dec 14 - Morning Session)
1. **LLM Enrichment System** (Phase 2)
   - Full architecture: repositories, services, workflows, facade
   - OpenAI gpt-4o-mini with Flex tier (50% cost savings)
   - Tavily web search integration
   - Google Places API for status verification (with LLM fallback)
   - Token tracking and cost estimation
   - Tested and working on sample restaurants

2. **CLI Scripts**
   - `enrich-restaurants.ts` - Full restaurant enrichment (description, cuisines, price tier, Guy quote)
   - `verify-status.ts` - Status verification with confidence scoring
   - `enrich-episodes.ts` - Episode meta description generation
   - `check-enrichment.ts` - Verification helper
   - `mark-for-enrichment.ts` - Reset enrichment status for re-processing
   - `invalidate-cache.ts` - Clear Tavily search cache

3. **Enrichment Results**
   - 3 test restaurants fully enriched
   - Cuisines linked via junction table
   - Price tiers assigned
   - Guy Fieri quotes extracted
   - **Dishes extracted** (3 per restaurant avg, linked to episodes)
   - **Segment notes** captured
   - **Status verified** (open/closed with dates)
   - **Contact info** saved (address, phone, website)

### ❌ NOT Built (Phase 3)
- No Playwright tests run
- No photos uploaded
- Pages exist but not tested in browser

---

## Current Data State

**In Database (Enriched):**
- 1 test episode (S1E1: "Classics")
- 3 test restaurants **FULLY ENRICHED:**
  - **Brint's Diner** (Wichita, KS) - closed 2014-10-01, 3 dishes, full contact info, 5 photos
  - **Mac & Ernie's Roadside Eatery** (Tarpley, TX) - status verified
  - **Mad Greek Cafe** (Baker, CA) - 4 dishes including signature Gyros
- **Enrichment completeness:**
  - ✅ Descriptions, cuisines, price tiers
  - ✅ Guy Fieri quotes (episode-specific)
  - ✅ Dishes linked to episodes (with reactions)
  - ✅ Segment notes (what happened during visit)
  - ✅ Status (open/closed) + closure dates
  - ✅ Contact info (address, phone, website)
  - ✅ Photos (Google Places → Supabase Storage)

**Available to Import:**
- 572 episodes cached in Supabase
- 1,695 restaurants ready to import
- 40 recent episodes (2024-2026) for SEO priority

**Enrichment Readiness:**
- Cost: ~$0.006/restaurant (without photos), ~$0.09/restaurant (with photos)
- Tavily cache: 90-day TTL (reduces repeat costs)
- Ready for batch processing of all 1,695 restaurants

---

## Next Steps (Priority Order)

### Option 1: Deploy MVP with Basic Data
1. Import recent 40 episodes (2024-2026) - ~120 restaurants
2. Run Playwright tests on pages
3. Deploy to Vercel
4. Submit to Google Search Console
5. **Result:** Live site with basic restaurant data, no enrichment

### Option 2: Build Enrichment Before Deploy
1. Build LLM enrichment system (descriptions, cuisines)
2. Integrate Google Places API (status, addresses, ratings)
3. Enrich imported restaurants
4. Then deploy
5. **Result:** Delayed launch but richer data

### Option 3: Hybrid Approach
1. Import + deploy basic data NOW (fast SEO indexing)
2. Build enrichment system in background
3. Enrich data incrementally after launch
4. **Result:** Fast launch, progressive enhancement

---

## Previous Work (For Reference)

### Enrichment System Design (NOT IMPLEMENTED)

**Architecture Layers:**
1. **Shared Utilities** - Token tracking, LLM client, result parsing (copy from chefs)
2. **Repositories** - Database access layer (DDD-specific)
3. **Services** - Business logic (enrichment, status verification, episode discovery)
4. **Workflows** - Multi-step orchestration with rollback support
5. **Facade** - Simplified public API

**Key Design Decisions:**
- Use OpenAI gpt-4o-mini with Flex tier (50% cost savings)
- Google Places API as primary status source, LLM as fallback
- Tavily Search for web context
- Repository pattern for all database access
- Workflow orchestration with automatic rollback
- Cost tracking and estimation built-in

**Reference:**
- Full design: `memory-bank/architecture/enrichment-system.md`
- Quick reference: `memory-bank/architecture/enrichment-reference.md`
- Source: `/Users/rb/Documents/coding_projects/chefs/scripts/ingestion/enrichment/`

### Cost Analysis

**Per-Restaurant Enrichment:**
- Enrichment (description, cuisine, price): ~1,500 tokens = $0.03
- Status verification (Google Places): $0.049
- Status verification (LLM fallback): ~500 tokens = $0.01
- Episode discovery: ~1,000 tokens = $0.02
- **Total: $0.06-$0.14 per restaurant**

**1,000 Restaurants:**
- LLM: ~$60
- Tavily: ~$5
- Google Places: ~$49
- **Total: ~$114**

---

## Enrichment System - COMPLETED ✅

**Status:** Fully built and tested (Dec 14, 2025)

### Architecture Implemented

### Phase 1: Foundation (2-3 days)
1. Copy shared utilities from chefs:
   - `token-tracker.ts` (update pricing)
   - `synthesis-client.ts` (set skipLocal: true)
   - `result-parser.ts` (no changes)
   - `retry-handler.ts` (no changes)
   - `tavily-client.ts` (adapt queries)
   - `workflow-types.ts` (no changes)
   - `base-workflow.ts` (update pricing)

2. Test utilities:
   - Token tracking accuracy
   - Cost estimation
   - LLM client with Flex tier

### Phase 2: Repositories (2-3 days)
1. Implement `restaurant-repository.ts`:
   - createRestaurant() with duplicate detection
   - updateEnrichmentData()
   - updateStatus()
   - updateGooglePlaceData()
   - getStaleRestaurants()

2. Implement `episode-repository.ts`:
   - getEpisodeBySeason()
   - linkRestaurantToEpisode()

3. Implement `city-repository.ts`:
   - ensureCityExists()

4. Write unit tests for repositories

### Phase 3: Services (3-4 days)
1. Implement `google-places-service.ts`
2. Implement `restaurant-enrichment-service.ts`
3. Implement `status-verification-service.ts`
4. Implement `episode-discovery-service.ts` (if needed)
5. Test services with real API calls

### Phase 4: Workflows (3-4 days)
1. Implement `manual-restaurant-addition.workflow.ts`
2. Implement `refresh-stale-restaurant.workflow.ts`
3. Implement `restaurant-status-sweep.workflow.ts`
4. Implement `partial-update.workflow.ts`
5. Test workflows end-to-end

### Phase 5: Facade & CLI (2-3 days)
1. Implement `llm-enricher.ts` facade
2. Create CLI scripts
3. Integration testing
4. Documentation

---

## Blockers

**None currently.**

**Potential Blockers:**
- Google Places API key access (needed for status verification)
- Tavily API key access (needed for web search)
- OpenAI API key access (needed for LLM enrichment)

**Mitigation:**
- All services gracefully degrade if API keys unavailable
- LLM-only fallback for status verification

---

## Open Questions

1. **Episode Discovery Scope:**
   - Do we need automatic episode discovery from web sources?
   - Or are episodes manually curated from official DDD sources?
   - **Decision Needed:** Impacts whether to implement EpisodeDiscoveryService

2. **Enrichment Priority:**
   - Which restaurants to enrich first?
   - New restaurants vs. stale restaurants vs. popular cities?
   - **Decision Needed:** Impacts workflow prioritization

3. **Caching Strategy:**
   - Should we cache Tavily search results?
   - Should we cache Google Places lookups?
   - **Decision Needed:** Could save 60-80% on API costs

4. **Batch Size:**
   - How many restaurants to process in one sweep?
   - What rate limits to respect?
   - **Decision Needed:** Impacts workflow configuration

---

## Recent Decisions

### LLM Model Selection
**Decision:** Use OpenAI gpt-4o-mini with Flex tier
**Rationale:**
- 50% cost savings vs. standard pricing
- Proven reliability in chefs project
- No need for local LLM complexity
- Flex tier: $0.075/1M input, $0.30/1M output

### Status Verification Strategy
**Decision:** Google Places as primary, LLM as fallback
**Rationale:**
- Google Places more reliable for business status
- LLM fallback ensures coverage even without API key
- Confidence scoring allows for manual review of low-confidence results

### Architecture Pattern
**Decision:** Copy architecture from chefs project
**Rationale:**
- Proven in production
- Well-tested and documented
- Similar domain (restaurants + enrichment)
- Reduces risk and development time

---

## Technical Debt

**None yet - still in design phase**

**Future Considerations:**
- Caching layer for API results
- Queue system for background enrichment
- Admin UI for manual review
- Cost monitoring dashboard
- Performance optimization (batch processing, parallel API calls)

---

## Testing Strategy

**Unit Tests:**
- Repository methods (mocked Supabase)
- Service LLM prompts and schema validation
- Workflow step orchestration

**Integration Tests:**
- Full workflow execution with test database
- API integration (Tavily, Google Places, OpenAI)
- Cost tracking accuracy

**E2E Tests:**
- Manual restaurant addition flow
- Status verification sweep
- Stale restaurant refresh

---

## Environment Setup

**Required:**
- `OPENAI_API_KEY` - OpenAI API key
- `TAVILY_API_KEY` - Tavily Search API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Optional:**
- `GOOGLE_PLACES_API_KEY` - Google Places API key (recommended)

---

## Performance Targets

**Enrichment Speed:**
- Single restaurant: ~3-5 seconds
- Batch of 10: ~30-45 seconds
- Batch of 100: ~5-7 minutes

**Cost Targets:**
- Stay under $0.15 per restaurant (full enrichment)
- Monthly budget: ~$150-$200 for 1,000 restaurants

**Quality Targets:**
- 95%+ successful enrichment rate
- 90%+ status verification confidence
- <5% manual review queue size

---

## Sprint Retrospective (Pending)

**What Went Well:**
- TBD after Phase 1 implementation

**What Could Improve:**
- TBD after Phase 1 implementation

**Action Items:**
- TBD after Phase 1 implementation

---

## Related Documents

- **Architecture Design:** `architecture/enrichment-system.md`
- **Quick Reference:** `architecture/enrichment-reference.md`
- **Project Overview:** `core/quickstart.md`
- **Tech Stack:** `architecture/techStack.md`
- **Progress Log:** `development/progress.md`
