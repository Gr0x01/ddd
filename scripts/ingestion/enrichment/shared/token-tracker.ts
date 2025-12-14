export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export class TokenTracker {
  private static instance: TokenTracker;
  private totalUsage: TokenUsage;

  private constructor() {
    this.totalUsage = { prompt: 0, completion: 0, total: 0 };
  }

  static getInstance(): TokenTracker {
    if (!TokenTracker.instance) {
      TokenTracker.instance = new TokenTracker();
    }
    return TokenTracker.instance;
  }

  trackUsage(usage: TokenUsage): void {
    this.totalUsage.prompt += usage.prompt;
    this.totalUsage.completion += usage.completion;
    this.totalUsage.total += usage.total;
  }

  getTotalUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  estimateCost(model: string = 'gpt-4o-mini'): number {
    // Import centralized pricing to avoid duplication
    const { getModelPricing } = require('./pricing-config');
    const pricing = getModelPricing(model);

    const inputCost = (this.totalUsage.prompt / 1_000_000) * pricing.input;
    const outputCost = (this.totalUsage.completion / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  reset(): void {
    this.totalUsage = { prompt: 0, completion: 0, total: 0 };
  }
}
