import { z } from 'zod';
import { TokenTracker, TokenUsage } from '../shared/token-tracker';
import { searchRestaurant, combineSearchResultsCompact } from '../shared/search-client';
import { synthesize, configure } from '../shared/synthesis-client';
import { sanitizeRestaurantName, sanitizeLocation } from '../shared/input-sanitizer';

// Configure synthesis client to use gpt-4.1-mini for long-form content
configure({ accuracyModel: 'gpt-4.1-mini' });

/**
 * Long-form content schema for SEO-optimized restaurant pages
 * Target: ~700 words total across all sections
 */
const LongFormContentSchema = z.object({
  about_story: z.string().describe('2-3 paragraphs about the restaurant: origin story, unique character, what makes it special. Include specific details like founding year, family history, neighborhood significance. ~200 words'),
  culinary_philosophy: z.string().describe('Their cooking philosophy, ingredient sourcing, signature techniques, what drives their food. How they approach quality and authenticity. ~150 words'),
  history_highlights: z.string().describe('Key milestones: founding story, expansion, awards, Guy Fieri visit impact, memorable moments, how they survived challenges. ~150 words'),
  why_visit: z.string().describe('Compelling reasons for food lovers to visit. The experience, atmosphere, what you will feel when eating there. What makes it worth the trip. ~100 words'),
  city_context: z.string().describe('How this restaurant fits into the city food scene. What makes this city/neighborhood special for food lovers. Local favorites, nearby attractions. ~100 words'),
});

export type LongFormContent = z.infer<typeof LongFormContentSchema>;

export interface LongFormEnrichmentResult {
  restaurantId: string;
  about_story: string | null;
  culinary_philosophy: string | null;
  history_highlights: string | null;
  why_visit: string | null;
  city_context: string | null;
  tokensUsed: TokenUsage;
  success: boolean;
  error?: string;
}

/**
 * System prompt for generating long-form SEO content
 * Focuses on storytelling, emotional language, and specific details
 */
const LONG_FORM_SYSTEM_PROMPT = `You are an expert food writer creating engaging, SEO-optimized content for restaurant pages.

Your goal is to write compelling, authentic content that:
1. Tells the restaurant's story with specific details (names, dates, founding story)
2. Captures the emotional experience of eating there
3. Integrates Guy Fieri's visit naturally without being repetitive
4. Uses vivid, sensory language about the food
5. Provides genuine reasons why food lovers should visit
6. Connects the restaurant to its city/neighborhood context

Guidelines:
- Write in a warm, enthusiastic but professional tone
- Include specific details from the search results (owner names, founding year, signature dishes)
- Don't repeat the same information across sections
- Each section should add unique value
- Avoid generic phrases like "must-try" or "hidden gem" - be specific
- If a restaurant is closed, still write positively about its legacy and impact
- Reference Guy Fieri's visit and quotes naturally when relevant

Word count targets:
- about_story: ~200 words (2-3 paragraphs)
- culinary_philosophy: ~150 words
- history_highlights: ~150 words
- why_visit: ~100 words
- city_context: ~100 words

CRITICAL: Respond with ONLY valid JSON. No explanatory text.

Response format:
{
  "about_story": "Multi-paragraph story about the restaurant...",
  "culinary_philosophy": "Their approach to food and cooking...",
  "history_highlights": "Key milestones and memorable moments...",
  "why_visit": "Why food lovers should visit...",
  "city_context": "The restaurant's place in the local food scene..."
}`;

export class LongFormService {
  constructor(private tokenTracker: TokenTracker) {}

  /**
   * Generate long-form SEO content for a restaurant
   * Uses existing search cache and restaurant data
   */
  async generateLongFormContent(
    restaurantId: string,
    name: string,
    city: string,
    state?: string,
    existingData?: {
      description?: string | null;
      guy_quote?: string | null;
      segment_notes?: string | null;
      cuisines?: string[];
      price_tier?: string | null;
      status?: string | null;
    }
  ): Promise<LongFormEnrichmentResult> {
    // Sanitize inputs
    const safeName = sanitizeRestaurantName(name);
    const safeCity = sanitizeLocation(city);
    const safeState = state ? sanitizeLocation(state) : undefined;

    const location = safeState ? `${safeCity}, ${safeState}` : safeCity;
    console.log(`   📝 Generating long-form content: ${safeName} (${location})`);

    try {
      // Get search results (will use cache if available - 90 day TTL)
      const searchResult = await searchRestaurant(name, city, state, restaurantId);
      const searchContext = combineSearchResultsCompact([searchResult], 8000);

      if (!searchContext || searchContext.length < 50) {
        console.log(`      ⚠️  No search results for ${safeName}`);
        return {
          restaurantId,
          about_story: null,
          culinary_philosophy: null,
          history_highlights: null,
          why_visit: null,
          city_context: null,
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          success: false,
          error: 'No search results found',
        };
      }

      // Build context from existing data
      const existingContext = buildExistingDataContext(existingData);

      const prompt = `Write long-form SEO content for "${safeName}" in ${location}.

EXISTING INFORMATION ABOUT THIS RESTAURANT:
${existingContext}

SEARCH RESULTS:
${searchContext}

Based on the information above, create engaging long-form content for each section.
Focus on storytelling, specific details, and emotional resonance.
Make each section unique - don't repeat information across sections.

Return ONLY JSON.`;

      const result = await synthesize(
        'creative',
        LONG_FORM_SYSTEM_PROMPT,
        prompt,
        LongFormContentSchema,
        {
          maxTokens: 2000,
          temperature: 0.7, // Higher temperature for more creative writing
        }
      );

      this.tokenTracker.trackUsage(result.usage);

      if (!result.success || !result.data) {
        console.log(`      ❌ LLM generation failed: ${result.error}`);
        return {
          restaurantId,
          about_story: null,
          culinary_philosophy: null,
          history_highlights: null,
          why_visit: null,
          city_context: null,
          tokensUsed: result.usage,
          success: false,
          error: result.error,
        };
      }

      // Count words for logging
      const totalWords = countWords(result.data);
      console.log(`      ✅ Generated ${totalWords} words of long-form content`);

      return {
        restaurantId,
        about_story: result.data.about_story,
        culinary_philosophy: result.data.culinary_philosophy,
        history_highlights: result.data.history_highlights,
        why_visit: result.data.why_visit,
        city_context: result.data.city_context,
        tokensUsed: result.usage,
        success: true,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Long-form generation error for "${name}": ${msg}`);

      return {
        restaurantId,
        about_story: null,
        culinary_philosophy: null,
        history_highlights: null,
        why_visit: null,
        city_context: null,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        success: false,
        error: msg,
      };
    }
  }
}

/**
 * Build context string from existing restaurant data
 */
function buildExistingDataContext(data?: {
  description?: string | null;
  guy_quote?: string | null;
  segment_notes?: string | null;
  cuisines?: string[];
  price_tier?: string | null;
  status?: string | null;
}): string {
  if (!data) return 'No existing data available.';

  const parts: string[] = [];

  if (data.description) {
    parts.push(`Description: ${data.description}`);
  }
  if (data.guy_quote) {
    parts.push(`Guy Fieri Quote: "${data.guy_quote}"`);
  }
  if (data.segment_notes) {
    parts.push(`Episode Segment Notes: ${data.segment_notes}`);
  }
  if (data.cuisines && data.cuisines.length > 0) {
    parts.push(`Cuisine Types: ${data.cuisines.join(', ')}`);
  }
  if (data.price_tier) {
    parts.push(`Price Tier: ${data.price_tier}`);
  }
  if (data.status) {
    parts.push(`Current Status: ${data.status}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No existing data available.';
}

/**
 * Count total words across all long-form content fields
 */
function countWords(content: LongFormContent): number {
  const allText = [
    content.about_story,
    content.culinary_philosophy,
    content.history_highlights,
    content.why_visit,
    content.city_context,
  ].join(' ');

  return allText.split(/\s+/).filter((word) => word.length > 0).length;
}
