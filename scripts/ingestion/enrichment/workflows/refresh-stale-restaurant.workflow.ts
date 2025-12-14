import { SupabaseClient } from '@supabase/supabase-js';
import { BaseWorkflow } from './base-workflow';
import { CostEstimate, ValidationResult } from '../types/workflow-types';
import { RestaurantEnrichmentService } from '../services/restaurant-enrichment-service';
import { StatusVerificationService } from '../services/status-verification-service';
import { RestaurantRepository } from '../repositories/restaurant-repository';
import { TokenTracker } from '../shared/token-tracker';
import { configure as configureSynthesis } from '../shared/synthesis-client';

export interface RefreshStaleRestaurantInput {
  restaurantId: string;
  scope: {
    data?: boolean;     // Re-enrich description, cuisines, price, quote
    status?: boolean;   // Re-verify restaurant status
  };
  dryRun?: boolean;
}

export interface RefreshStaleRestaurantOutput {
  restaurantId: string;
  restaurantName: string;
  dataRefreshed: boolean;
  statusRefreshed: boolean;
  newStatus?: 'open' | 'closed' | 'unknown';
  statusConfidence?: number;
  lastEnrichedAt?: string;
}

export class RefreshStaleRestaurantWorkflow extends BaseWorkflow<RefreshStaleRestaurantInput, RefreshStaleRestaurantOutput> {
  private supabase: SupabaseClient;
  private enrichmentService: RestaurantEnrichmentService;
  private statusService: StatusVerificationService;
  private restaurantRepo: RestaurantRepository;

  constructor(
    supabase: SupabaseClient,
    options: { model?: string } = {}
  ) {
    super({
      workflowName: 'refresh-stale-restaurant',
      maxCostUsd: 5,
      timeoutMs: 600000, // 10 minutes
      allowRollback: false,
    });

    this.supabase = supabase;
    configureSynthesis({ accuracyModel: options.model || 'gpt-4o-mini' });
    const tokenTracker = TokenTracker.getInstance();

    this.restaurantRepo = new RestaurantRepository(supabase);
    this.enrichmentService = new RestaurantEnrichmentService(tokenTracker);
    this.statusService = new StatusVerificationService(tokenTracker);
  }

  validate(input: RefreshStaleRestaurantInput): ValidationResult {
    const errors: string[] = [];

    if (!input.restaurantId || input.restaurantId.length !== 36) {
      errors.push('Invalid restaurant ID (must be UUID)');
    }

    if (!input.scope.data && !input.scope.status) {
      errors.push('Must specify at least one scope (data or status)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async estimateCost(input: RefreshStaleRestaurantInput): Promise<CostEstimate> {
    let estimatedTokens = 0;
    let maxTokens = 0;

    if (input.scope.data) {
      // Enrichment: ~1000-1500 tokens
      estimatedTokens += 1500;
      maxTokens += 2500;
    }

    if (input.scope.status) {
      // Status verification: ~500-800 tokens
      estimatedTokens += 800;
      maxTokens += 1200;
    }

    const inputCostPer1M = 0.15;
    const outputCostPer1M = 0.60;
    const avgCostPer1M = (inputCostPer1M + outputCostPer1M) / 2;

    return {
      estimatedTokens,
      estimatedUsd: (estimatedTokens / 1_000_000) * avgCostPer1M,
      maxTokens,
      maxUsd: (maxTokens / 1_000_000) * avgCostPer1M,
    };
  }

  async executeSteps(input: RefreshStaleRestaurantInput): Promise<RefreshStaleRestaurantOutput> {
    const output: RefreshStaleRestaurantOutput = {
      restaurantId: input.restaurantId,
      restaurantName: '',
      dataRefreshed: false,
      statusRefreshed: false,
    };

    // Step 1: Fetch restaurant details
    const fetchStep = this.startStep('Fetch restaurant details');
    let restaurantData: any;

    try {
      const result = await this.restaurantRepo.getById(input.restaurantId);

      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : 'Restaurant not found';
        throw new Error(`Restaurant not found: ${errorMsg}`);
      }

      restaurantData = result.data;
      output.restaurantName = restaurantData.name;
      output.lastEnrichedAt = restaurantData.last_enriched_at;

      this.completeStep(fetchStep, undefined, {
        restaurantName: restaurantData.name,
        city: restaurantData.city,
        state: restaurantData.state,
        lastEnrichedAt: restaurantData.last_enriched_at,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.failStep(fetchStep, errorMessage);
      throw error;
    }

    // Step 2: Re-enrich restaurant data (if requested)
    if (input.scope.data) {
      const enrichStep = this.startStep('Re-enrich restaurant data');
      try {
        const result = await this.enrichmentService.enrichRestaurant(
          input.restaurantId,
          restaurantData.name,
          restaurantData.city,
          restaurantData.state
        );

        if (!result.success) {
          throw new Error(result.error || 'Enrichment failed');
        }

        if (!input.dryRun && result.description) {
          const updateResult = await this.restaurantRepo.updateEnrichmentData(
            input.restaurantId,
            {
              description: result.description,
              cuisines: result.cuisines || undefined,
              price_tier: result.price_tier as any,
              guy_quote: result.guy_quote,
            }
          );

          if (!updateResult.success) {
            const errorMsg = 'error' in updateResult ? updateResult.error : 'Update failed';
            throw new Error(`Failed to save enrichment data: ${errorMsg}`);
          }

          output.dataRefreshed = true;
        }

        this.completeStep(enrichStep, result.tokensUsed, {
          refreshed: output.dataRefreshed,
          cuisines: result.cuisines,
          priceTier: result.price_tier,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.failStep(enrichStep, errorMessage);
        throw error;
      }
    }

    // Step 3: Re-verify status (if requested)
    if (input.scope.status) {
      const statusStep = this.startStep('Re-verify restaurant status');
      try {
        const result = await this.statusService.verifyStatus(
          input.restaurantId,
          restaurantData.name,
          restaurantData.city,
          restaurantData.state,
          restaurantData.google_place_id
        );

        if (!result.success) {
          console.warn(`   ⚠️  Status verification failed: ${result.error}`);
        }

        output.newStatus = result.status;
        output.statusConfidence = result.confidence;

        if (!input.dryRun && result.success && result.status !== 'unknown' && result.confidence >= 0.7) {
          const updateResult = await this.restaurantRepo.updateStatus(
            input.restaurantId,
            result.status,
            result.confidence,
            result.reason
          );

          if (!updateResult.success) {
            const errorMsg = 'error' in updateResult ? updateResult.error : 'Update failed';
            console.error(`   ❌ Failed to update status: ${errorMsg}`);
          } else {
            output.statusRefreshed = true;
          }
        }

        this.completeStep(statusStep, result.tokensUsed, {
          status: result.status,
          confidence: result.confidence,
          source: result.source,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.failStep(statusStep, errorMessage);
        // Don't throw - status verification is non-critical
        this.addError('status_verification_failed', errorMessage, false);
      }
    }

    // Step 4: Update enrichment timestamp (if data was refreshed)
    if (!input.dryRun && output.dataRefreshed) {
      const timestampStep = this.startStep('Update enrichment timestamp');
      try {
        const result = await this.restaurantRepo.setEnrichmentTimestamp(input.restaurantId);
        if (!result.success) {
          const errorMsg = 'error' in result ? result.error : 'Update failed';
          throw new Error(`Failed to set timestamp: ${errorMsg}`);
        }
        this.completeStep(timestampStep);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.failStep(timestampStep, errorMessage);
        // Don't throw - this is non-critical
        this.addError('timestamp_update_failed', errorMessage, false);
      }
    }

    return output;
  }
}
