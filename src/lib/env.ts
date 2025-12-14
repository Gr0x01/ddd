/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at build time
 * using Zod for type-safe runtime validation
 */

import { z } from 'zod';

// Define schema for environment variables
const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Server-side only (not needed for Next.js app, required for migration scripts)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(), // Migration script validates separately

  // OpenAI (optional for now, required when enrichment is added)
  OPENAI_API_KEY: z.string().optional(),

  // Google APIs (optional for now, required for Phase 2)
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_CUSTOM_SEARCH_API_KEY: z.string().optional(),

  // Tavily (optional for now, required for enrichment)
  TAVILY_API_KEY: z.string().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
      GOOGLE_CUSTOM_SEARCH_API_KEY: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(
        `❌ Environment variable validation failed:\n\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.\n' +
        'See .env.example for reference.'
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment object
export type Env = z.infer<typeof envSchema>;
