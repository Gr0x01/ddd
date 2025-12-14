import { z } from 'zod';
import { TokenTracker, TokenUsage } from '../shared/token-tracker';
import { searchRestaurant, combineSearchResultsCompact } from '../shared/search-client';
import { synthesize } from '../shared/synthesis-client';
import { sanitizeRestaurantName, sanitizeLocation } from '../shared/input-sanitizer';

const DishSchema = z.object({
  name: z.string().describe('Name of the dish'),
  description: z.string().nullable().describe('Brief description of the dish, or null'),
  guy_reaction: z.string().nullable().describe('What Guy Fieri said about this dish, or null'),
  is_signature_dish: z.boolean().describe('Whether this is a signature/famous dish'),
});

const RestaurantEnrichmentSchema = z.object({
  description: z.string().describe('2-3 sentence description of the restaurant'),
  cuisines: z.array(z.string()).describe('Array of cuisine types like ["American", "BBQ"]'),
  price_tier: z.enum(['$', '$$', '$$$', '$$$$']).describe('Price tier from $ to $$$$'),
  guy_quote: z.string().nullable().describe('Memorable quote from Guy Fieri\'s visit, or null if not found'),
  dishes: z.array(DishSchema).describe('Dishes featured during Guy\'s visit to this restaurant in this episode'),
  segment_notes: z.string().nullable().describe('Notes about what happened during Guy\'s visit/segment in this episode, or null'),
  status: z.enum(['open', 'closed', 'unknown']).describe('Current business status: open, closed, or unknown'),
  closed_date: z.string().nullable().describe('Date the restaurant closed permanently (YYYY-MM-DD format), or null if still open or unknown'),
  address: z.string().nullable().describe('Full street address, or null if not found'),
  phone: z.string().nullable().describe('Phone number, or null if not found'),
  website: z.string().nullable().describe('Website URL, or null if not found'),
});

export interface Dish {
  name: string;
  description: string | null;
  guy_reaction: string | null;
  is_signature_dish: boolean;
}

export interface RestaurantEnrichmentResult {
  restaurantId: string;
  description: string | null;
  cuisines: string[] | null;
  price_tier: string | null;
  guy_quote: string | null;
  dishes: Dish[] | null;
  segment_notes: string | null;
  status: string | null;
  closed_date: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  tokensUsed: TokenUsage;
  success: boolean;
  error?: string;
}

const ENRICHMENT_SYSTEM_PROMPT = `You are a restaurant industry expert analyzing information about restaurants featured on Diners, Drive-Ins and Dives.

Guidelines:
- Write descriptions that capture the restaurant's unique character and cuisine in 2-3 sentences
- Extract specific cuisine types (e.g., ["American", "BBQ"], ["Mexican"], ["Italian", "Pizza"])
- Determine price tier based on context: $ (under $10), $$ ($10-20), $$$ ($20-35), $$$$ ($35+)
- Extract dishes featured during Guy's visit in THIS episode - include name, description, and Guy's reaction
- Mark signature/famous dishes as is_signature_dish: true
- Extract segment notes: what happened during Guy's visit, what he did, who he talked to, memorable moments
- If Guy Fieri's visit is mentioned, extract the most memorable quote from him
- Set guy_quote to null if no specific quote is found
- Determine current business status: "open", "closed", or "unknown"
- If restaurant is closed, extract the closure date in YYYY-MM-DD format (or YYYY-MM, or YYYY if only year is known)
- Extract contact information: full street address, phone number, and website URL
- Be specific and accurate based on the search results provided

CRITICAL: Respond with ONLY valid JSON. No explanatory text.

Response format:
{
  "description": "2-3 sentence description",
  "cuisines": ["cuisine1", "cuisine2"],
  "price_tier": "$" | "$$" | "$$$" | "$$$$",
  "guy_quote": "quote text" or null,
  "dishes": [
    {
      "name": "dish name",
      "description": "brief description" or null,
      "guy_reaction": "what Guy said" or null,
      "is_signature_dish": true or false
    }
  ],
  "segment_notes": "what happened during the segment" or null,
  "status": "open" | "closed" | "unknown",
  "closed_date": "YYYY-MM-DD" or null,
  "address": "full street address" or null,
  "phone": "phone number" or null,
  "website": "website URL" or null
}`;

export class RestaurantEnrichmentService {
  constructor(private tokenTracker: TokenTracker) {}

  async enrichRestaurant(
    restaurantId: string,
    name: string,
    city: string,
    state?: string,
    episodeTitle?: string,
    season?: number,
    episodeNumber?: number
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
          dishes: null,
          segment_notes: null,
          status: null,
          closed_date: null,
          address: null,
          phone: null,
          website: null,
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          success: true,
          error: 'No search results found',
        };
      }

      // Build context-aware prompt (use sanitized values)
      const episodeContext = safeEpisodeTitle && season && episodeNumber
        ? ` featured in episode "${safeEpisodeTitle}" (S${season}E${episodeNumber})`
        : safeEpisodeTitle
          ? ` featured in episode "${safeEpisodeTitle}"`
          : '';

      const prompt = `Analyze information about "${safeName}" in ${location}${episodeContext}.

SEARCH RESULTS:
${searchContext}

Based on the search results above, extract from THIS episode's visit:
- A compelling 2-3 sentence description of the restaurant
- The cuisine types (as an array)
- The price tier ($ to $$$$)
- Dishes Guy tried during this episode visit (with names, descriptions, and his reactions)
- What happened during the segment/visit in this episode
- Contact information found in search results (address, phone, website)
- Any memorable quote from Guy Fieri during this visit (or null)

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
          dishes: null,
          segment_notes: null,
          status: null,
          closed_date: null,
          address: null,
          phone: null,
          website: null,
          tokensUsed: result.usage,
          success: false,
          error: result.error,
        };
      }

      console.log(`      ✅ Enriched (${result.data.cuisines.join(', ')}, ${result.data.price_tier}, ${result.data.dishes?.length || 0} dishes, ${result.data.status})`);

      return {
        restaurantId,
        description: result.data.description,
        cuisines: result.data.cuisines,
        price_tier: result.data.price_tier,
        guy_quote: result.data.guy_quote,
        dishes: result.data.dishes,
        segment_notes: result.data.segment_notes,
        status: result.data.status,
        closed_date: result.data.closed_date,
        address: result.data.address,
        phone: result.data.phone,
        website: result.data.website,
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
        dishes: null,
        segment_notes: null,
        status: null,
        closed_date: null,
        address: null,
        phone: null,
        website: null,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        success: false,
        error: msg,
      };
    }
  }
}
