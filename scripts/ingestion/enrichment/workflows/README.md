# DDD Enrichment Workflows

This directory contains workflow orchestration for DDD restaurant enrichment operations.

## Architecture

### Base Classes
- **BaseWorkflow** - Abstract base class providing:
  - Token tracking and cost estimation
  - Step management and error handling
  - Timeout and rollback support
  - Workflow result standardization

### Workflows

#### 1. Manual Restaurant Addition (`manual-restaurant-addition.workflow.ts`)
Full enrichment workflow for manually adding a new restaurant.

**Steps:**
1. Verify restaurant exists in database
2. Enrich restaurant data (description, cuisines, price tier, Guy quote)
3. Verify restaurant status (open/closed)
4. Mark enrichment complete

**Input:**
```typescript
{
  restaurantId: string;
  name: string;
  city: string;
  state: string | null;
  episodeTitle?: string;  // Optional episode context for better enrichment
  dryRun?: boolean;       // Preview without database writes
}
```

**Output:**
```typescript
{
  restaurantId: string;
  restaurantName: string;
  enriched: boolean;
  statusVerified: boolean;
  googlePlaceIdUpdated: boolean;
  finalStatus: 'open' | 'closed' | 'unknown';
  statusConfidence: number;
}
```

#### 2. Restaurant Status Sweep (`restaurant-status-sweep.workflow.ts`)
Batch verification of restaurant status (open/closed).

**Steps:**
1. Fetch restaurants matching criteria
2. Process in batches (concurrent verification)
3. Update database with new status

**Input:**
```typescript
{
  restaurantIds?: string[];  // Explicit list
  criteria?: {               // OR query criteria
    notVerifiedInDays?: number;
    status?: 'open' | 'closed' | 'unknown';
    cityFilter?: string;
  };
  limit?: number;            // Max restaurants to process
  minConfidence?: number;    // Default 0.7
  batchSize?: number;        // Default 10
  dryRun?: boolean;
}
```

**Output:**
```typescript
{
  totalProcessed: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  updates: Array<{
    restaurantId: string;
    restaurantName: string;
    oldStatus: string;
    newStatus: string;
    confidence: number;
  }>;
}
```

#### 3. Refresh Stale Restaurant (`refresh-stale-restaurant.workflow.ts`)
Re-enrichment workflow for stale restaurant data.

**Steps:**
1. Fetch restaurant details
2. Re-enrich data (if scope.data = true)
3. Re-verify status (if scope.status = true)
4. Update enrichment timestamp

**Input:**
```typescript
{
  restaurantId: string;
  scope: {
    data?: boolean;    // Re-enrich description, cuisines, price, quote
    status?: boolean;  // Re-verify restaurant status
  };
  dryRun?: boolean;
}
```

**Output:**
```typescript
{
  restaurantId: string;
  restaurantName: string;
  dataRefreshed: boolean;
  statusRefreshed: boolean;
  newStatus?: 'open' | 'closed' | 'unknown';
  statusConfidence?: number;
  lastEnrichedAt?: string;
}
```

## Usage via Facade

```typescript
import { createLLMEnricher } from '../llm-enricher';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const enricher = createLLMEnricher(supabase, {
  model: 'gpt-4o-mini'  // Optional, defaults to gpt-4o-mini
});

// Manual restaurant addition
const result = await enricher.workflows.manualRestaurantAddition({
  restaurantId: '...',
  name: 'Smoke BBQ',
  city: 'Austin',
  state: 'TX',
  episodeTitle: 'Texas BBQ Legends',
});

// Status sweep
const sweepResult = await enricher.workflows.restaurantStatusSweep({
  criteria: { notVerifiedInDays: 90 },
  limit: 50,
  minConfidence: 0.8,
});

// Refresh stale data
const refreshResult = await enricher.workflows.refreshStaleRestaurant({
  restaurantId: '...',
  scope: { data: true, status: true },
});

// Check costs
console.log('Total cost:', enricher.estimateCost());
console.log('Tokens used:', enricher.getTotalTokensUsed());
```

## Workflow Result Format

All workflows return a `WorkflowResult<TOutput>`:

```typescript
{
  success: boolean;
  workflowId: string;
  workflowName: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  output?: TOutput;
  totalCost: {
    tokens: TokenUsage;
    estimatedUsd: number;
  };
  errors: WorkflowError[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}
```

## Cost Limits & Timeouts

Each workflow has built-in limits:

| Workflow | Max Cost | Timeout |
|----------|----------|---------|
| Manual Addition | $5 | 10 min |
| Status Sweep | $10 | 30 min |
| Refresh Stale | $5 | 10 min |

Workflows fail fast if estimated cost exceeds limit.

## Error Handling

Workflows use a multi-level error strategy:

1. **Validation errors** - Fail before execution
2. **Fatal errors** - Abort workflow, return error result
3. **Non-fatal errors** - Log and continue (e.g., status verification failure)

Critical steps (enrichment) throw on failure.
Non-critical steps (status update timestamp) log errors but don't fail workflow.

## Token Tracking

Token usage is tracked at the step level and aggregated:

```typescript
const result = await workflow.execute(input);
console.log(result.totalCost.tokens);  // { prompt, completion, total }
console.log(result.totalCost.estimatedUsd);  // Cost in USD
```

Pricing uses gpt-4o-mini rates:
- Input: $0.15/1M tokens
- Output: $0.60/1M tokens
