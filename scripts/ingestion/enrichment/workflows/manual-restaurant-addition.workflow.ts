import { SupabaseClient } from '@supabase/supabase-js';
import { BaseWorkflow } from './base-workflow';
import { CostEstimate, ValidationResult } from '../types/workflow-types';
import { RestaurantEnrichmentService } from '../services/restaurant-enrichment-service';
import { StatusVerificationService } from '../services/status-verification-service';
import { RestaurantRepository } from '../repositories/restaurant-repository';
import { TokenTracker } from '../shared/token-tracker';
import { configure as configureSynthesis } from '../shared/synthesis-client';
import { isValidUUID } from '../shared/input-sanitizer';

export interface ManualRestaurantAdditionInput {
  restaurantId: string;
  name: string;
  city: string;
  state: string | null;
  episodeTitle?: string;
  dryRun?: boolean;
}

export interface ManualRestaurantAdditionOutput {
  restaurantId: string;
  restaurantName: string;
  enriched: boolean;
  statusVerified: boolean;
  googlePlaceIdUpdated: boolean;
  finalStatus: 'open' | 'closed' | 'unknown';
  statusConfidence: number;
}

export class ManualRestaurantAdditionWorkflow extends BaseWorkflow<ManualRestaurantAdditionInput, ManualRestaurantAdditionOutput> {
  private supabase: SupabaseClient;
  private enrichmentService: RestaurantEnrichmentService;
  private statusService: StatusVerificationService;
  private restaurantRepo: RestaurantRepository;

  constructor(
    supabase: SupabaseClient,
    options: { model?: string } = {}
  ) {
    super({
      workflowName: 'manual-restaurant-addition',
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

  validate(input: ManualRestaurantAdditionInput): ValidationResult {
    const errors: string[] = [];

    if (!input.restaurantId || !isValidUUID(input.restaurantId)) {
      errors.push('Invalid restaurant ID (must be valid UUID v4)');
    }

    if (!input.name || input.name.trim().length === 0) {
      errors.push('Restaurant name is required');
    }

    if (!input.city || input.city.trim().length === 0) {
      errors.push('City is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async estimateCost(input: ManualRestaurantAdditionInput): Promise<CostEstimate> {
    // Enrichment: ~1000-1500 tokens
    const enrichmentTokens = 1500;
    // Status verification: ~500-800 tokens
    const statusTokens = 800;

    const estimatedTokens = enrichmentTokens + statusTokens;
    const maxTokens = 3000;

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

  async executeSteps(input: ManualRestaurantAdditionInput): Promise<ManualRestaurantAdditionOutput> {
    const output: ManualRestaurantAdditionOutput = {
      restaurantId: input.restaurantId,
      restaurantName: input.name,
      enriched: false,
      statusVerified: false,
      googlePlaceIdUpdated: false,
      finalStatus: 'unknown',
      statusConfidence: 0,
    };

    // Step 1: Verify restaurant exists in database
    const verifyStep = this.startStep('Verify restaurant exists in database');
    try {
      const result = await this.restaurantRepo.getById(input.restaurantId);

      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : 'Restaurant not found';
        throw new Error(`Restaurant not found: ${errorMsg}`);
      }

      this.completeStep(verifyStep, undefined, { restaurantFound: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.failStep(verifyStep, errorMessage);
      throw error;
    }

    // Step 2: Enrich restaurant data
    const enrichStep = this.startStep('Enrich restaurant data (description, cuisines, price)');
    try {
      const result = await this.enrichmentService.enrichRestaurant(
        input.restaurantId,
        input.name,
        input.city,
        input.state || undefined,
        input.episodeTitle
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

        output.enriched = true;
      }

      this.completeStep(enrichStep, result.tokensUsed, {
        enriched: output.enriched,
        cuisines: result.cuisines,
        priceTier: result.price_tier,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.failStep(enrichStep, errorMessage);
      throw error;
    }

    // Step 3: Verify restaurant status
    const statusStep = this.startStep('Verify restaurant status (open/closed)');
    try {
      // Get Google Place ID if it exists
      const restaurantData = await this.restaurantRepo.getById(input.restaurantId);
      const googlePlaceId = restaurantData.success ? restaurantData.data.google_place_id : null;

      const result = await this.statusService.verifyStatus(
        input.restaurantId,
        input.name,
        input.city,
        input.state || undefined,
        googlePlaceId
      );

      if (!result.success) {
        console.warn(`   ⚠️  Status verification failed: ${result.error}`);
      }

      output.finalStatus = result.status;
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
          output.statusVerified = true;
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

    // Step 4: Mark enrichment complete
    if (!input.dryRun && output.enriched) {
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
