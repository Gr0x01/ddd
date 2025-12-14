import { z } from 'zod';
import { TokenTracker, TokenUsage } from '../shared/token-tracker';
import { synthesize } from '../shared/synthesis-client';

const EpisodeDescriptionSchema = z.object({
  meta_description: z.string()
    .min(140)
    .max(160)
    .describe('SEO-optimized meta description between 155-160 characters'),
});

export interface EpisodeDescriptionResult {
  episodeId: string;
  meta_description: string | null;
  tokensUsed: TokenUsage;
  success: boolean;
  error?: string;
}

const EPISODE_DESCRIPTION_SYSTEM_PROMPT = `You are an SEO expert writing meta descriptions for Diners, Drive-Ins and Dives episodes.

Guidelines:
- Create compelling meta descriptions between 155-160 characters
- Include the episode number (e.g., "S12E5")
- Mention featured restaurants by name
- Use action words and engaging language
- Make it informative and clickable
- Focus on what makes the episode unique

CRITICAL: Respond with ONLY valid JSON. No explanatory text.

Response format:
{
  "meta_description": "155-160 character SEO-optimized description"
}`;

export class EpisodeDescriptionService {
  constructor(private tokenTracker: TokenTracker) {}

  async generateEpisodeDescription(
    episodeId: string,
    season: number,
    episodeNumber: number,
    title: string,
    restaurantNames: string[]
  ): Promise<EpisodeDescriptionResult> {
    console.log(`   ✍️  Generating description: S${season}E${episodeNumber} - ${title}`);

    try {
      const episodeCode = `S${season}E${episodeNumber}`;
      const restaurantList = restaurantNames.length > 0
        ? restaurantNames.join(', ')
        : 'featured restaurants';

      const prompt = `Create an SEO meta description for this Diners, Drive-Ins and Dives episode:

Episode: ${episodeCode} - "${title}"
Featured Restaurants: ${restaurantList}

Requirements:
- Exactly 155-160 characters
- Include episode code (${episodeCode})
- Mention restaurant names if space allows
- Make it engaging and clickable
- Focus on what viewers will discover

Return ONLY JSON.`;

      const result = await synthesize(
        'creative',
        EPISODE_DESCRIPTION_SYSTEM_PROMPT,
        prompt,
        EpisodeDescriptionSchema,
        {
          maxTokens: 500,
          temperature: 0.4,
        }
      );

      this.tokenTracker.trackUsage(result.usage);

      if (!result.success || !result.data) {
        return {
          episodeId,
          meta_description: null,
          tokensUsed: result.usage,
          success: false,
          error: result.error,
        };
      }

      // Validate character length
      const length = result.data.meta_description.length;
      if (length < 140 || length > 160) {
        console.log(`      ⚠️  Description length ${length} chars (expected 155-160)`);
      } else {
        console.log(`      ✅ Generated (${length} chars)`);
      }

      return {
        episodeId,
        meta_description: result.data.meta_description,
        tokensUsed: result.usage,
        success: true,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Description generation error for episode ${episodeId}: ${msg}`);

      return {
        episodeId,
        meta_description: null,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        success: false,
        error: msg,
      };
    }
  }
}
