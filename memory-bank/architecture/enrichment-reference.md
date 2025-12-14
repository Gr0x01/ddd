---
title: Enrichment System Quick Reference
created: 2025-12-14
last-updated: 2025-12-14
maintainer: Claude
status: Design
---

# Enrichment System Quick Reference

> **Full Architecture:** See `enrichment-system.md` for complete design details.

## Quick Start

```typescript
import { createClient } from '@supabase/supabase-js';
import { createLLMEnricher } from '@/scripts/ingestion/processors/llm-enricher';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const enricher = createLLMEnricher(supabase);
```

---

## Common Operations

### 1. Add New Restaurant (Full Enrichment)

```typescript
const result = await enricher.workflows.manualRestaurantAddition({
  restaurantName: "Hodad's",
  city: "San Diego",
  state: "California",
  address: "5010 Newport Ave",      // Optional
  episodeId: "uuid-here",           // Optional: link to episode
  skipStatusCheck: false,           // Optional: skip status verification
  dryRun: false,                    // Optional: test without saving
});

// Check result
if (result.success) {
  console.log(`Restaurant ID: ${result.output.restaurantId}`);
  console.log(`Cost: $${result.totalCost.estimatedUsd.toFixed(4)}`);
} else {
  console.error(`Failed: ${result.errors[0].message}`);
}
```

**Cost:** ~$0.06-$0.14 per restaurant

---

### 2. Verify Restaurant Status

```typescript
const result = await enricher.verifyRestaurantStatus(
  "Hodad's",
  "San Diego",
  "California",
  existingPlaceId  // Optional: if already have Google Place ID
);

console.log(`Status: ${result.status}`);        // 'open', 'closed', 'unknown'
console.log(`Confidence: ${result.confidence}`); // 0.0 to 1.0
console.log(`Reasoning: ${result.reasoning}`);
```

**Cost:** $0.049 (Google Places) OR $0.01 (LLM fallback)

---

### 3. Batch Status Verification

```typescript
const result = await enricher.workflows.restaurantStatusSweep({
  criteria: {
    notVerifiedInDays: 180,         // Restaurants not verified in 180+ days
    status: 'unknown',              // Optional: filter by current status
  },
  limit: 50,                        // Max restaurants to process
  minConfidence: 0.75,              // Only update if confidence ≥ 0.75
  batchSize: 10,                    // Process 10 at a time
  dryRun: false,
});

console.log(`Updated: ${result.output.statusUpdated} restaurants`);
console.log(`Cost: $${result.totalCost.estimatedUsd.toFixed(2)}`);
```

---

### 4. Refresh Stale Restaurant Data

```typescript
const result = await enricher.workflows.refreshStaleRestaurant({
  restaurantId: "uuid-here",
  scope: {
    enrichment: true,    // Re-enrich description, cuisine, price tier
    status: true,        // Re-verify open/closed status
    episodes: false,     // Skip episode backfill
  },
  dryRun: false,
});
```

---

### 5. Enrich Specific Field Only

```typescript
const result = await enricher.workflows.partialUpdate({
  mode: 'enrichment',   // 'enrichment' | 'status' | 'episodes' | 'meta'
  targetId: "uuid-here",
  targetName: "Hodad's",
  dryRun: false,
});
```

---

## Service-Level Methods (Lower-Level API)

### Enrich Restaurant (No DB Save)

```typescript
const result = await enricher.enrichRestaurantOnly(
  "Hodad's",
  "San Diego",
  "California",
  { season: 1, episodeNumber: 5 }  // Optional: episode context
);

if (result.success) {
  console.log(result.data.description);
  console.log(result.data.cuisineTypes);    // ["American", "Burgers"]
  console.log(result.data.priceTier);       // "$" | "$$" | "$$$" | "$$$$"
  console.log(result.data.guyQuote);        // Optional
}
```

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
