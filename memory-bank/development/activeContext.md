---
title: Active Development Context
created: 2025-12-14
last-updated: 2025-12-14
maintainer: Claude
status: Active
---

# Active Development Context

**Current Sprint:** LLM Enrichment System Architecture Design
**Sprint Goal:** Complete enrichment system design adapted from chefs project
**Timeline:** Week of Dec 14, 2025

---

## Sprint Focus

### Primary Objective
Design and document a production-ready LLM enrichment system for DDD restaurant data, adapting the proven architecture from the chefs project.

### Success Criteria
- [x] Architecture document created (`architecture/enrichment-system.md`)
- [x] Quick reference guide created (`architecture/enrichment-reference.md`)
- [x] Directory structure defined
- [x] Implementation phases outlined
- [x] Cost estimation completed
- [ ] Phase 1 implementation (copy shared utilities from chefs)
- [ ] Phase 2 implementation (repositories)

---

## Current Work

### Enrichment System Design (Completed)

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

## Next Steps

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
