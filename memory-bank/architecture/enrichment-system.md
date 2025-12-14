---
title: DDD Enrichment System Architecture
created: 2025-12-14
last-updated: 2025-12-14
maintainer: Claude
status: Design
---

# Enrichment System Architecture

## Overview

LLM-powered enrichment system for DDD restaurant data, adapted from the proven chefs project architecture. Uses OpenAI gpt-4o-mini (Flex tier), Tavily web search, and Google Places API to discover and enhance restaurant metadata.

**Source Reference:** `/Users/rb/Documents/coding_projects/chefs/scripts/ingestion/enrichment/`

---

## Architecture Layers

```
Facade (llm-enricher.ts)
    ↓
Workflows (manual-addition, refresh-stale, status-sweep, partial-update)
    ↓
Services (enrichment, status-verification, episode-discovery, google-places)
    ↓
Repositories (restaurant, episode, city)
    ↓
Shared Utilities (token-tracker, synthesis-client, result-parser, retry-handler, tavily-client)
```

**Key Patterns:**
- **Repository Pattern:** All database access centralized
- **Service Layer:** Single-purpose business logic
- **Workflow Orchestration:** Multi-step operations with cost tracking and rollback
- **Facade Pattern:** Simplified public API

---

## Directory Structure

```
scripts/ingestion/enrichment/
├── shared/                      # Copy from chefs, update pricing
│   ├── token-tracker.ts        # Token usage + cost estimation
│   ├── synthesis-client.ts     # OpenAI client (Flex tier)
│   ├── result-parser.ts        # JSON extraction + validation
│   ├── retry-handler.ts        # Exponential backoff
│   └── tavily-client.ts        # Web search wrapper
├── types/
│   └── workflow-types.ts       # Copy from chefs
├── repositories/               # DDD-specific
│   ├── restaurant-repository.ts
│   ├── episode-repository.ts
│   └── city-repository.ts
├── services/                   # DDD-specific
│   ├── restaurant-enrichment-service.ts
│   ├── status-verification-service.ts
│   ├── episode-discovery-service.ts
│   └── google-places-service.ts
├── workflows/                  # Adapt from chefs
│   ├── base-workflow.ts
│   ├── manual-restaurant-addition.workflow.ts
│   ├── refresh-stale-restaurant.workflow.ts
│   ├── restaurant-status-sweep.workflow.ts
│   └── partial-update.workflow.ts
└── processors/
    └── llm-enricher.ts         # Facade (public API)
```

---

## Data Enrichment Scope

### Restaurant Fields to Enrich
```typescript
{
  description: string;              // 2-3 sentences about the restaurant
  cuisineTypes: string[];           // ["American", "BBQ", "Comfort Food"]
  priceTier: "$" | "$$" | "$$$" | "$$$$";
  guyQuote: string;                 // Memorable Guy Fieri quote
  status: "open" | "closed" | "unknown";
  googlePlaceId: string;            // For future lookups
  googleRating: number;             // 0-5 stars
  latitude: number;
  longitude: number;
}
```

### Episode Fields (Optional)
```typescript
{
  metaDescription: string;          // SEO meta description
  episodeSummary: string;           // 1-2 paragraph summary
}
```

---

## Key Repositories

### RestaurantRepository
```typescript
createRestaurant(data, episodeId?)         // Insert with duplicate check
updateEnrichmentData(id, {...})            // Update description, cuisine, price
updateStatus(id, status, source)           // Update open/closed status
updateGooglePlaceData(id, {...})           // Update place_id, rating, coords
getStaleRestaurants(daysThreshold)         // Find old enrichments
getRestaurantsForStatusCheck(criteria)     // Find restaurants needing verification
```

### EpisodeRepository
```typescript
getEpisodeBySeason(season, episodeNumber)
createEpisode(episodeData)
linkRestaurantToEpisode(restaurantId, episodeId)
getRestaurantsForEpisode(episodeId)
```

---

## Key Services

### RestaurantEnrichmentService
**Purpose:** Enrich restaurant data using Tavily + LLM

**Flow:**
1. Search Tavily for restaurant details
2. Construct LLM prompt with search context
3. Call OpenAI gpt-4o-mini (Flex tier)
4. Extract: description, cuisineTypes, priceTier, guyQuote
5. Return validated result

**Cost:** ~1,500 tokens = **$0.03 per restaurant**

### StatusVerificationService
**Purpose:** Verify if restaurant is open/closed

**Flow:**
1. **Primary:** Google Places API (if available)
   - High confidence (≥0.85) → Use directly
2. **Fallback:** Tavily + LLM
   - Search for recent mentions, reviews, closures
   - LLM analyzes and assigns confidence score
3. Return status + confidence + reasoning

**Cost:** Google Places (~$0.049) OR Tavily + LLM (~$0.015)

### GooglePlacesService
**Purpose:** Interface to Google Places API

```typescript
searchPlace(restaurantName, city, state)   // Text Search API
getPlaceDetails(placeId)                   // Place Details API
```

**Graceful Degradation:** Returns null if GOOGLE_PLACES_API_KEY not set

---

## Key Workflows

### ManualRestaurantAdditionWorkflow
**Purpose:** Add new restaurant with full enrichment

**Steps:**
1. Create restaurant record (check duplicates)
2. Enrich restaurant data (description, cuisine, price, quote)
3. Verify status (Google Places → Tavily + LLM)
4. Link to episode (if episodeId provided)

**Cost:** ~$0.06 per restaurant
**Rollback:** Deletes created restaurant on failure

### RefreshStaleRestaurantWorkflow
**Purpose:** Re-enrich restaurants with old data

**Scope Options:**
- `enrichment`: Re-run description, cuisine, price tier
- `status`: Re-verify open/closed status
- `episodes`: Backfill missing episode links

**Use Case:** Batch refresh restaurants not enriched in 180+ days

### RestaurantStatusSweepWorkflow
**Purpose:** Batch verify restaurant status

**Features:**
- Configurable batch size (default: 10)
- Rate limiting between batches
- Minimum confidence threshold (default: 0.75)
- Dry-run mode

**Use Case:** Monthly status verification for all open restaurants

### PartialUpdateWorkflow
**Purpose:** Selective update of specific fields

**Modes:**
- `enrichment`: Re-enrich description, cuisine, price
- `status`: Re-verify open/closed
- `episodes`: Backfill episodes
- `meta`: Update SEO metadata

---

## Facade API (llm-enricher.ts)

```typescript
const enricher = createLLMEnricher(supabase, { model: 'gpt-4o-mini' });

// Service methods
await enricher.enrichRestaurantOnly(name, city, state);
await enricher.verifyRestaurantStatus(name, city, state, placeId);
await enricher.findEpisodesForRestaurant(name, city, state);

// Workflow methods
await enricher.workflows.manualRestaurantAddition({
  restaurantName: "Hodad's",
  city: "San Diego",
  state: "California",
  episodeId: "abc-123",
});

await enricher.workflows.restaurantStatusSweep({
  criteria: { notVerifiedInDays: 180 },
  limit: 50,
  batchSize: 10,
});

// Utilities
enricher.getTotalTokensUsed();
enricher.estimateCost();
enricher.resetTokenCounter();
```

---

## Cost Breakdown

**OpenAI gpt-4o-mini (Flex Tier):**
- Input: $0.075 per 1M tokens (50% savings vs standard)
- Output: $0.30 per 1M tokens (50% savings vs standard)

**Tavily API:**
- $5/month for 1,000 searches = **$0.005 per search**

**Google Places API:**
- Text Search: $0.032 per request
- Place Details: $0.017 per request

**Per-Restaurant Costs:**
- Enrichment: ~1,500 tokens = **$0.03**
- Status (Google): **$0.049**
- Status (LLM): ~500 tokens = **$0.01**
- Episode discovery: ~1,000 tokens = **$0.02**
- **Full enrichment: ~$0.10-$0.14 per restaurant**

**1,000 Restaurants:**
- LLM: ~$60
- Tavily: ~$5
- Google Places: ~$49
- **Total: ~$114**

---

## Implementation Phases

### Phase 1: Foundation (Copy from Chefs)
- [ ] `shared/token-tracker.ts` - Update pricing to Flex tier
- [ ] `shared/synthesis-client.ts` - Set skipLocal: true, update pricing
- [ ] `shared/result-parser.ts` - Copy as-is
- [ ] `shared/retry-handler.ts` - Copy as-is
- [ ] `shared/tavily-client.ts` - Adapt search queries
- [ ] `types/workflow-types.ts` - Copy as-is
- [ ] `workflows/base-workflow.ts` - Update pricing

### Phase 2: Repositories (DDD-Specific)
- [ ] RestaurantRepository (create, update enrichment, update status)
- [ ] EpisodeRepository (get by season, link to restaurant)
- [ ] CityRepository (ensure exists, update meta)

### Phase 3: Services (DDD-Specific)
- [ ] GooglePlacesService (search, get details)
- [ ] RestaurantEnrichmentService (Tavily + LLM)
- [ ] StatusVerificationService (Google → Tavily + LLM)
- [ ] EpisodeDiscoveryService (optional, if auto-discovery needed)

### Phase 4: Workflows (Adapt from Chefs)
- [ ] ManualRestaurantAdditionWorkflow
- [ ] RefreshStaleRestaurantWorkflow
- [ ] RestaurantStatusSweepWorkflow
- [ ] PartialUpdateWorkflow

### Phase 5: Facade & CLI
- [ ] llm-enricher.ts (facade)
- [ ] CLI scripts (enrich-restaurant, status-sweep, refresh-stale)

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...           # Required
TAVILY_API_KEY=tvly-...         # Required
GOOGLE_PLACES_API_KEY=AIza...   # Optional (highly recommended)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Usage Examples

### Add Restaurant Manually
```typescript
const result = await enricher.workflows.manualRestaurantAddition({
  restaurantName: "Hodad's",
  city: "San Diego",
  state: "California",
  address: "5010 Newport Ave",
  episodeId: "abc-123",
  dryRun: false,
});

console.log(`Added: ${result.output.restaurantId}`);
console.log(`Cost: $${result.totalCost.estimatedUsd.toFixed(4)}`);
```

### Batch Verify Status
```typescript
const result = await enricher.workflows.restaurantStatusSweep({
  criteria: {
    notVerifiedInDays: 180,
    status: 'unknown',
  },
  limit: 50,
  minConfidence: 0.75,
  batchSize: 10,
});

console.log(`Updated: ${result.output.statusUpdated} restaurants`);
console.log(`Cost: $${result.totalCost.estimatedUsd.toFixed(2)}`);
```

---

## Optimization Strategies

### 1. Use Flex Tier (50% Savings)
```typescript
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { 'X-Model-Tier': 'flex' },
});
```

### 2. Cache Tavily Results
Cache search results for 30 days using Redis or database cache table. Reduces API costs by 60-80%.

### 3. Google Places First
Use Google Places as primary status source. Only fall back to LLM if confidence < 0.85.

### 4. Batch Processing
Process restaurants in batches of 10 with 1-second delays to avoid rate limits.

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

## Monitoring

**Cost Tracking:**
- Token usage per workflow
- External API costs (Tavily, Google Places)
- Daily/monthly spend reports

**Quality Metrics:**
- Enrichment completion rate
- Status verification confidence distribution
- Manual review queue size

---

## References

- Chefs enrichment system: `/Users/rb/Documents/coding_projects/chefs/scripts/ingestion/enrichment/`
- OpenAI Flex tier: `X-Model-Tier: flex` header for 50% savings
- Database schema: `/Users/rb/Documents/coding_projects/ddd/supabase/migrations/001_initial_schema.sql`
