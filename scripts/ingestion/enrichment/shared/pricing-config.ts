/**
 * Centralized pricing configuration for LLM models
 * Using Flex tier pricing for 75% discount on cached inputs
 */
export const MODEL_PRICING = {
  'gpt-4o-mini': { input: 0.075, output: 0.30 }, // Flex tier (50% savings)
  'gpt-4.1-mini': { input: 0.10, output: 0.40 }, // Flex tier (75% off cached, base $0.40/$1.60)
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
