/**
 * Centralized pricing configuration for LLM models
 * gpt-4o-mini uses Flex tier pricing (50% savings)
 */
export const MODEL_PRICING = {
  'gpt-4o-mini': { input: 0.075, output: 0.30 }, // Flex tier (50% savings)
  'gpt-4.1-mini': { input: 0.20, output: 0.80 },
  'qwen3-8b': { input: 0, output: 0 },
} as const;

export type ModelName = keyof typeof MODEL_PRICING;

export function getModelPricing(model: string) {
  return MODEL_PRICING[model as ModelName] || { input: 0, output: 0 };
}

export function estimateTokenCost(tokens: { prompt: number; completion: number }, model: string): number {
  const pricing = getModelPricing(model);
  return (tokens.prompt / 1_000_000) * pricing.input + (tokens.completion / 1_000_000) * pricing.output;
}
