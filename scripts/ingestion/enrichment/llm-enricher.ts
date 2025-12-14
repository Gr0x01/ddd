import { SupabaseClient } from '@supabase/supabase-js';
import { TokenTracker, TokenUsage } from './shared/token-tracker';
import { RestaurantRepository } from './repositories/restaurant-repository';
import { EpisodeRepository } from './repositories/episode-repository';
import { CityRepository } from './repositories/city-repository';
import { RestaurantEnrichmentService } from './services/restaurant-enrichment-service';
import { StatusVerificationService } from './services/status-verification-service';
import { EpisodeDescriptionService } from './services/episode-description-service';
import { ManualRestaurantAdditionWorkflow } from './workflows/manual-restaurant-addition.workflow';
import { RestaurantStatusSweepWorkflow } from './workflows/restaurant-status-sweep.workflow';
import { RefreshStaleRestaurantWorkflow } from './workflows/refresh-stale-restaurant.workflow';
import type { WorkflowResult } from './types/workflow-types';
import { configure as configureSynthesis, getTierInfo } from './shared/synthesis-client';

export type { WorkflowResult };

export interface LLMEnricherConfig {
  model?: string;
  skipLocal?: boolean;
}

export function createLLMEnricher(
  supabase: SupabaseClient,
  config: LLMEnricherConfig = {}
) {
  const modelName = config.model ?? 'gpt-4o-mini';

  // Configure synthesis client with the selected model
  configureSynthesis({ accuracyModel: modelName });

  const tokenTracker = TokenTracker.getInstance();
  const restaurantRepo = new RestaurantRepository(supabase);
  const episodeRepo = new EpisodeRepository(supabase);
  const cityRepo = new CityRepository(supabase);

  const restaurantEnrichmentService = new RestaurantEnrichmentService(tokenTracker);
  const statusVerificationService = new StatusVerificationService(tokenTracker);
  const episodeDescriptionService = new EpisodeDescriptionService(tokenTracker);

  let totalTokensUsed: TokenUsage = { prompt: 0, completion: 0, total: 0 };

  /**
   * Enrich a single restaurant with description, cuisines, price tier, Guy quote, dishes, segment notes, and contact info
   */
  async function enrichRestaurant(
    id: string,
    name: string,
    city: string,
    state: string | null,
    episodeTitle?: string,
    season?: number,
    episodeNumber?: number
  ) {
    const result = await restaurantEnrichmentService.enrichRestaurant(
      id,
      name,
      city,
      state || undefined,
      episodeTitle,
      season,
      episodeNumber
    );

    totalTokensUsed.prompt += result.tokensUsed.prompt;
    totalTokensUsed.completion += result.tokensUsed.completion;
    totalTokensUsed.total += result.tokensUsed.total;

    return result;
  }

  /**
   * Verify if a restaurant is currently open or closed
   */
  async function verifyRestaurantStatus(
    id: string,
    name: string,
    city: string,
    state?: string,
    googlePlaceId?: string | null
  ) {
    const result = await statusVerificationService.verifyStatus(
      id,
      name,
      city,
      state,
      googlePlaceId || undefined
    );

    totalTokensUsed.prompt += result.tokensUsed.prompt;
    totalTokensUsed.completion += result.tokensUsed.completion;
    totalTokensUsed.total += result.tokensUsed.total;

    return result;
  }

  /**
   * Generate SEO-optimized meta description for an episode
   */
  async function generateEpisodeDescription(
    id: string,
    season: number,
    episodeNumber: number,
    title: string,
    restaurantNames: string[]
  ) {
    const result = await episodeDescriptionService.generateEpisodeDescription(
      id,
      season,
      episodeNumber,
      title,
      restaurantNames
    );

    totalTokensUsed.prompt += result.tokensUsed.prompt;
    totalTokensUsed.completion += result.tokensUsed.completion;
    totalTokensUsed.total += result.tokensUsed.total;

    return result;
  }

  /**
   * Get total tokens used across all enrichment operations
   */
  function getTotalTokensUsed(): TokenUsage {
    return { ...totalTokensUsed };
  }

  /**
   * Estimate cost based on total tokens used
   * Uses gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
   */
  function estimateCost(): number {
    const inputCostPer1M = 0.15;
    const outputCostPer1M = 0.60;

    return (totalTokensUsed.prompt / 1_000_000) * inputCostPer1M +
           (totalTokensUsed.completion / 1_000_000) * outputCostPer1M;
  }

  /**
   * Reset the token counter to zero
   */
  function resetTokenCounter(): void {
    totalTokensUsed = { prompt: 0, completion: 0, total: 0 };
  }

  /**
   * Get the active model name
   */
  function getModelName(): string {
    return modelName;
  }

  /**
   * Get synthesis tier info (for debugging/monitoring)
   */
  function getSynthesisTierInfo() {
    return getTierInfo();
  }

  // Workflow execution functions
  async function runManualRestaurantAddition(input: {
    restaurantId: string;
    name: string;
    city: string;
    state: string | null;
    episodeTitle?: string;
    dryRun?: boolean;
  }): Promise<WorkflowResult> {
    const workflow = new ManualRestaurantAdditionWorkflow(supabase, { model: modelName });
    const result = await workflow.execute(input);

    totalTokensUsed.prompt += result.totalCost.tokens.prompt;
    totalTokensUsed.completion += result.totalCost.tokens.completion;
    totalTokensUsed.total += result.totalCost.tokens.total;

    return result;
  }

  async function runRestaurantStatusSweep(input: {
    restaurantIds?: string[];
    criteria?: {
      notVerifiedInDays?: number;
      status?: 'open' | 'closed' | 'unknown';
      cityFilter?: string;
    };
    limit?: number;
    minConfidence?: number;
    batchSize?: number;
    dryRun?: boolean;
  }): Promise<WorkflowResult> {
    const workflow = new RestaurantStatusSweepWorkflow(supabase, { model: modelName });
    const result = await workflow.execute(input);

    totalTokensUsed.prompt += result.totalCost.tokens.prompt;
    totalTokensUsed.completion += result.totalCost.tokens.completion;
    totalTokensUsed.total += result.totalCost.tokens.total;

    return result;
  }

  async function runRefreshStaleRestaurant(input: {
    restaurantId: string;
    scope: {
      data?: boolean;
      status?: boolean;
    };
    dryRun?: boolean;
  }): Promise<WorkflowResult> {
    const workflow = new RefreshStaleRestaurantWorkflow(supabase, { model: modelName });
    const result = await workflow.execute(input);

    totalTokensUsed.prompt += result.totalCost.tokens.prompt;
    totalTokensUsed.completion += result.totalCost.tokens.completion;
    totalTokensUsed.total += result.totalCost.tokens.total;

    return result;
  }

  return {
    // Direct service methods
    enrichRestaurant,
    verifyRestaurantStatus,
    generateEpisodeDescription,

    // Token tracking
    getTotalTokensUsed,
    estimateCost,
    resetTokenCounter,
    getModelName,
    getSynthesisTierInfo,

    // Workflows
    workflows: {
      manualRestaurantAddition: runManualRestaurantAddition,
      restaurantStatusSweep: runRestaurantStatusSweep,
      refreshStaleRestaurant: runRefreshStaleRestaurant,
    },
  };
}

export type LLMEnricher = ReturnType<typeof createLLMEnricher>;
