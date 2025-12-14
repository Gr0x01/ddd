import { z } from 'zod';
import { TokenTracker, TokenUsage } from '../shared/token-tracker';
import { searchRestaurant, combineSearchResultsCompact } from '../shared/search-client';
import { synthesize } from '../shared/synthesis-client';
import { sanitizeRestaurantName, sanitizeLocation } from '../shared/input-sanitizer';

const RestaurantEnrichmentSchema = z.object({
  description: z.string().describe('2-3 sentence description of the restaurant'),
  cuisines: z.array(z.string()).describe('Array of cuisine types like ["American", "BBQ"]'),
  price_tier: z.enum(['$', '$$', '$$$', '$$$$']).describe('Price tier from $ to $$$$'),
  guy_quote: z.string().nullable().describe('Memorable quote from Guy Fieri\'s visit, or null if not found'),
});

export interface RestaurantEnrichmentResult {
  restaurantId: string;
  description: string | null;
  cuisines: string[] | null;
  price_tier: string | null;
  guy_quote: string | null;
  tokensUsed: TokenUsage;
  success: boolean;
  error?: string;
}

const ENRICHMENT_SYSTEM_PROMPT = `You are a restaurant industry expert analyzing information about restaurants featured on Diners, Drive-Ins and Dives.

Guidelines:
- Write descriptions that capture the restaurant's unique character and cuisine in 2-3 sentences
- Extract specific cuisine types (e.g., ["American", "BBQ"], ["Mexican"], ["Italian", "Pizza"])
- Determine price tier based on context: $ (under $10), $$ ($10-20), $$$ ($20-35), $$$$ ($35+)
- If Guy Fieri's visit is mentioned, extract the most memorable quote from him
- Set guy_quote to null if no specific quote is found
- Be specific and accurate based on the search results provided

CRITICAL: Respond with ONLY valid JSON. No explanatory text.

Response format:
{
  "description": "2-3 sentence description",
  "cuisines": ["cuisine1", "cuisine2"],
  "price_tier": "$" | "$$" | "$$$" | "$$$$",
  "guy_quote": "quote text" or null
}`;

export class RestaurantEnrichmentService {
  constructor(private tokenTracker: TokenTracker) {}

  async enrichRestaurant(
    restaurantId: string,
    name: string,
    city: string,
    state?: string,
    episodeTitle?: string
  ): Promise<RestaurantEnrichmentResult> {
    // Sanitize inputs to prevent prompt injection
    const safeName = sanitizeRestaurantName(name);
    const safeCity = sanitizeLocation(city);
    const safeState = state ? sanitizeLocation(state) : undefined;
    const safeEpisodeTitle = episodeTitle ? sanitizeLocation(episodeTitle) : undefined;

    const location = safeState ? `${safeCity}, ${safeState}` : safeCity;
    console.log(`   🔍 Enriching: ${safeName} (${location})`);

    try {
      // Search for restaurant information (use original values for search, not sanitized)
      const searchResult = await searchRestaurant(name, city, state, restaurantId);
      const searchContext = combineSearchResultsCompact([searchResult], 8000);

      if (!searchContext || searchContext.length < 50) {
        console.log(`      ⚠️  No search results for ${safeName}`);
        return {
          restaurantId,
          description: null,
          cuisines: null,
          price_tier: null,
          guy_quote: null,
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          success: true,
          error: 'No search results found',
        };
      }

      // Build context-aware prompt (use sanitized values)
      const episodeContext = safeEpisodeTitle ? ` (featured in episode "${safeEpisodeTitle}")` : '';
      const prompt = `Analyze information about "${safeName}" in ${location}${episodeContext}.

SEARCH RESULTS:
${searchContext}

Based on the search results above, extract:
- A compelling 2-3 sentence description
- The cuisine types (as an array)
- The price tier
- Any memorable quote from Guy Fieri's visit (or null)

Return ONLY JSON.`;

      const result = await synthesize(
        'creative',
        ENRICHMENT_SYSTEM_PROMPT,
        prompt,
        RestaurantEnrichmentSchema,
        {
          maxTokens: 1500,
          temperature: 0.3,
        }
      );

      this.tokenTracker.trackUsage(result.usage);

      if (!result.success || !result.data) {
        return {
          restaurantId,
          description: null,
          cuisines: null,
          price_tier: null,
          guy_quote: null,
          tokensUsed: result.usage,
          success: false,
          error: result.error,
        };
      }

      console.log(`      ✅ Enriched (${result.data.cuisines.join(', ')}, ${result.data.price_tier})`);

      return {
        restaurantId,
        description: result.data.description,
        cuisines: result.data.cuisines,
        price_tier: result.data.price_tier,
        guy_quote: result.data.guy_quote,
        tokensUsed: result.usage,
        success: true,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Enrichment error for "${name}": ${msg}`);

      return {
        restaurantId,
        description: null,
        cuisines: null,
        price_tier: null,
        guy_quote: null,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        success: false,
        error: msg,
      };
    }
  }
}
