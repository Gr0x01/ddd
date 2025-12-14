---
title: Enrichment System Quick Reference
created: 2025-12-14
last-updated: 2025-12-14
maintainer: Claude
status: Active
---

# Enrichment System Quick Reference

> **Status:** ACTIVE - Core enrichment implemented and operational
> **Full Architecture:** See `enrichment-system.md` for complete design details.

## Current Implementation Status

### ✅ Implemented & Working

**Core Enrichment Script:** `scripts/ingestion/enrich-restaurants.ts`

**Features:**
- Episode-aware enrichment (passes episode title, season, episode number to LLM)
- **Status detection** (`open`, `closed`, `unknown`)
- **Closure date extraction** (handles `YYYY`, `YYYY-MM`, `YYYY-MM-DD` formats)
- **Dish extraction** (linked to episodes with Guy's reactions)
- **Segment notes** (what happened during Guy's visit)
- **Contact info** (address, phone, website from search results)
- **Photo storage** (Google Places → Supabase Storage with `--with-photos` flag)
- **Full-content search** (Tavily with `include_raw_content: true` for complete Wikipedia articles)
- **Cost tracking** (separate for LLM and Google Places API)
- **Search caching** (90-day TTL for restaurant searches)

**Database Schema:**
```typescript
restaurants {
  // Core fields
  name, slug, city, state, address, phone, website_url

  // Enrichment fields
  description, price_tier, guy_quote
  status: 'open' | 'closed' | 'unknown'
  closed_date: DATE

  // Episode context
  first_episode_id, first_air_date

  // Media
  photos: JSONB  // Array of Supabase Storage URLs
  google_place_id, google_rating, google_review_count

  // Tracking
  enrichment_status: 'pending' | 'completed' | 'failed'
  last_enriched_at
}

dishes {
  restaurant_id, episode_id
  name, slug, description
  guy_reaction, is_signature_dish
}

restaurant_episodes {
  restaurant_id, episode_id
  segment_notes  // What happened during the visit
}

restaurant_cuisines {
  restaurant_id, cuisine_id  // Many-to-many
}
```

**CLI Usage:**
```bash
# Basic enrichment (description, cuisines, price, dishes, status)
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10

# With Google Places photos (adds $0.084/restaurant)
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10 --with-photos

# Force re-enrich completed restaurants
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 5 --all

# Dry run (no database writes)
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 3 --dry-run
```

**Cost Per Restaurant:**
- LLM (gpt-4o-mini): ~$0.0006
- Tavily search: ~$0.005 (cached for 90 days)
- **Total without photos:** ~$0.006
- Google Places (optional): +$0.084
- **Total with photos:** ~$0.09

### ❌ Not Yet Implemented

- Workflow orchestration (manualRestaurantAddition, refreshStaleRestaurant)
- Status verification as standalone operation
- Episode discovery/backfilling
- Partial update modes
- Rollback on failure
- CLI command interface

---

## Quick Start (Current Implementation)

```bash
# 1. Set environment variables
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
GOOGLE_PLACES_API_KEY=AIza...  # Optional, for photos
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 2. Run enrichment
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10
```

**What gets extracted:**
1. Description (2-3 sentences about the restaurant)
2. Cuisines (e.g., `["American", "BBQ"]`)
3. Price tier (`$`, `$$`, `$$$`, `$$$$`)
4. Guy Fieri quote from the episode
5. Dishes featured in the episode (with Guy's reactions)
6. Segment notes (what happened during the visit)
7. Business status (`open`, `closed`, `unknown`)
8. Closure date (if closed, in `YYYY-MM-DD` format)
9. Contact info (address, phone, website)
10. Photos (if `--with-photos` flag used)

---

## Known Issues & Fixes

### ✅ Fixed: Tavily Content Truncation (2025-12-14)

**Problem:** Tavily was returning truncated content because `include_raw_content: false`. This caused Wikipedia articles to be cut off mid-sentence, missing critical information like closure dates.

**Example:** Brint's Diner Wikipedia article was truncated to:
```
"The restaurant closed permanently in October 20..."  [CUT OFF]
```

**Impact:** LLM extracted incorrect or missing closure dates (e.g., `2023-10` instead of `2014-10`).

**Fix:** Changed `include_raw_content: true` in `tavily-client.ts` (commit a860c6b)

**Result:** Full Wikipedia content now available to LLM. Brint's Diner correctly shows `closed_date: 2014-10-01`.

**Files Changed:**
- `scripts/ingestion/enrichment/shared/tavily-client.ts`
- `supabase/migrations/005_add_search_cache_columns.sql`
- `scripts/ingestion/invalidate-cache.ts` (utility)

---

## Current Operations (CLI-Based)

### 1. Enrich Pending Restaurants

Enriches restaurants with `enrichment_status = 'pending'` or `description IS NULL`:

```bash
# Enrich 10 restaurants
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 10

# What gets extracted:
# - Description, cuisines, price tier, Guy quote
# - Dishes (with Guy's reactions, linked to episode)
# - Segment notes (what happened during visit)
# - Status (open/closed/unknown) + closure date
# - Contact info (address, phone, website)
```

**Output:**
```
🍔 DDD Restaurant Enrichment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: gpt-4o-mini
Mode: LIVE
Limit: 10 restaurants
Photos: NO

Found 10 restaurant(s) to enrich

[1/10] Brint's Diner (Wichita, Kansas)
      📺 Episode: S1E1 - Classics
   🔍 Enriching: Brints Diner (Wichita, Kansas)
      🔍 Tavily search: "Brint's Diner Wichita, Kansas..."
      ✅ Enriched (American, $, 3 dishes, closed)
      🏷️  Linking cuisines: American
      🍽️  Processing 3 dish(es)...
      ✅ Saved 3 dish(es)
      📝 Updated segment notes
      📞 Updated contact info (address, phone)
      ✅ Enriched: American | $ | 3 dishes | ⚠️  CLOSED (2014-10-01)
```

**Cost:** ~$0.006/restaurant (LLM + search, cached for 90 days)

---

### 2. Enrich With Photos

Add `--with-photos` flag to download photos from Google Places and upload to Supabase Storage:

```bash
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 5 --with-photos
```

**Additional output:**
```
[1/5] Brint's Diner (Wichita, Kansas)
      ...
      📸 Fetching photos from Google Places...
      ✓ Found place (confidence: 90%)
      ✅ Uploaded and saved 5 photo(s)
```

**Cost:** ~$0.09/restaurant (includes $0.084 for Google Places API)

**Storage:** Photos uploaded to `restaurant-photos/{restaurant_id}/{slug}-{n}.jpg`

---

### 3. Force Re-enrichment

Use `--all` flag to re-enrich restaurants that already have `enrichment_status = 'completed'`:

```bash
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 3 --all
```

**Use cases:**
- Update descriptions after improving prompts
- Re-extract dishes with better parsing
- Fix data after bug fixes (e.g., Tavily truncation)

---

### 4. Dry Run (Preview Changes)

Use `--dry-run` to see what would be enriched without writing to database:

```bash
npx tsx scripts/ingestion/enrich-restaurants.ts --limit 1 --dry-run
```

**Output:**
```
Mode: DRY RUN

[1/1] Brint's Diner (Wichita, Kansas)
      🔍 DRY RUN - Skipping actual enrichment
```

---

### 5. Mark Restaurant for Re-enrichment

Utility script to reset a restaurant's enrichment status:

```bash
npx tsx scripts/ingestion/mark-for-enrichment.ts "Brint"
```

**Output:**
```
✅ Marked for re-enrichment: Brint's Diner
```

---

### 6. Invalidate Search Cache

Clear cached Tavily results to force fresh searches:

```bash
npx tsx scripts/ingestion/invalidate-cache.ts "Brint"
```

**Output:**
```
✅ Invalidated 1 cache entries for "Brint"
   - Brint's Diner: Brint's Diner Wichita, Kansas Diners Drive-ins...
```

**Use cases:**
- After fixing Tavily configuration (e.g., include_raw_content)
- When restaurant info changes significantly
- Testing different search queries

---

## Utility Scripts

### Check Enrichment Status

View detailed enrichment data:

```bash
npx tsx scripts/ingestion/verify-enrichment-detailed.ts --limit 5
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Brint's Diner
Status: completed
Price: $
Description: Brint's Diner in Wichita is a nostalgic gem...
Quote: If you go out to eat with him, he keeps sending...
Contact: Address=Yes | Phone=Yes | Website=No
Dishes: 3
  • Liver and Onions
  • Cincinnati Spaghetti
  • Scrambled Eggs ⭐
Segment Notes: During the segment, Guy Fieri visited...
```

---

## Future Operations (Not Yet Implemented)

These operations require workflow orchestration system (see `enrichment-system.md`):

### ❌ Workflow-Based Operations (Planned)

```typescript
// These APIs don't exist yet - shown for future reference
await enricher.workflows.manualRestaurantAddition({...});
await enricher.workflows.restaurantStatusSweep({...});
await enricher.workflows.refreshStaleRestaurant({...});
await enricher.workflows.partialUpdate({...});
```

**Current alternative:** Use CLI scripts directly (see above)

---

## Cost Tracking

### Get Total Tokens Used

```typescript
const usage = enricher.getTotalTokensUsed();
console.log(`Prompt: ${usage.prompt} tokens`);
console.log(`Completion: ${usage.completion} tokens`);
console.log(`Total: ${usage.total} tokens`);
```

### Estimate Cost

```typescript
const cost = enricher.estimateCost();
console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

### Reset Counter

```typescript
enricher.resetTokenCounter();
```

---

## Workflow Result Structure

```typescript
interface WorkflowResult<T> {
  success: boolean;
  workflowId: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'rolled_back';
  steps: Array<{
    stepNumber: number;
    name: string;
    status: 'completed' | 'failed' | 'skipped';
    tokensUsed?: TokenUsage;
    costUsd?: number;
    error?: string;
  }>;
  output?: T;
  totalCost: {
    tokens: { prompt: number; completion: number; total: number };
    estimatedUsd: number;
  };
  errors: Array<{
    code: string;
    message: string;
    fatal: boolean;
  }>;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}
```

---

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...

# Optional (but recommended for status verification)
GOOGLE_PLACES_API_KEY=AIza...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Cost Reference

| Operation | Tokens | Cost |
|-----------|--------|------|
| Restaurant enrichment | ~1,500 | $0.03 |
| Status verification (Google) | 0 | $0.049 |
| Status verification (LLM) | ~500 | $0.01 |
| Episode discovery | ~1,000 | $0.02 |
| Full manual addition | ~3,000 | $0.06-$0.14 |

**Flex Tier Pricing:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

---

## Error Handling

### Workflow Failures

```typescript
const result = await enricher.workflows.manualRestaurantAddition({...});

if (!result.success) {
  // Check errors
  result.errors.forEach(err => {
    console.error(`${err.code}: ${err.message}`);
    if (err.fatal) {
      // Critical error - workflow aborted
    }
  });

  // Check if rollback occurred
  if (result.status === 'rolled_back') {
    console.log('Changes were rolled back');
  }
}
```

### Service Failures

```typescript
const result = await enricher.enrichRestaurantOnly(...);

if (!result.success) {
  console.error(`Error: ${result.error}`);
  console.log(`Tokens used before failure: ${result.tokensUsed.total}`);
}
```

---

## Best Practices

### 1. Use Workflows for DB Operations
```typescript
// Good: Workflow handles DB saves + rollback
await enricher.workflows.manualRestaurantAddition({...});

// Avoid: Manual DB saves with service methods
const enrichResult = await enricher.enrichRestaurantOnly(...);
await supabase.from('restaurants').update(enrichResult.data)...;
```

### 2. Check Confidence Before Updating Status
```typescript
const statusResult = await enricher.verifyRestaurantStatus(...);

if (statusResult.confidence >= 0.75) {
  // High confidence - safe to update
  await updateRestaurantStatus(statusResult.status);
} else {
  // Low confidence - flag for manual review
  await flagForManualReview(statusResult);
}
```

### 3. Use Dry Run for Testing
```typescript
const result = await enricher.workflows.restaurantStatusSweep({
  ...config,
  dryRun: true,  // No DB writes, see what would happen
});
```

### 4. Monitor Costs
```typescript
enricher.resetTokenCounter();

await enricher.workflows.restaurantStatusSweep({...});

const cost = enricher.estimateCost();
if (cost > 5.0) {
  console.warn(`High cost detected: $${cost.toFixed(2)}`);
}
```

---

## CLI Usage (Future)

```bash
# Add restaurant
npm run enrich -- add \
  --name "Hodad's" \
  --city "San Diego" \
  --state "California" \
  --episode "S01E01"

# Status sweep
npm run enrich -- status-sweep \
  --not-verified-days 180 \
  --limit 50 \
  --dry-run

# Refresh stale
npm run enrich -- refresh \
  --restaurant-id "uuid-here" \
  --scope enrichment,status
```

---

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Set `OPENAI_API_KEY=sk-...` in `.env.local`

### "Cost limit exceeded"
- Workflow aborted due to estimated cost > maxCostUsd
- Increase limit in workflow config or reduce batch size

### "Workflow timeout"
- Operation took longer than configured timeout (default: 5 minutes)
- Reduce batch size or increase timeout

### Status verification returns "unknown" with low confidence
- Google Places API not configured → Install `GOOGLE_PLACES_API_KEY`
- Restaurant closed/moved → LLM finds no recent mentions
- Rare restaurant → Not enough web presence for confident determination

---

## Next Steps

- **Full Architecture:** Read `enrichment-system.md`
- **Implementation:** Start with Phase 1 (copy shared utilities from chefs)
- **Testing:** Use dry-run mode to validate before production
