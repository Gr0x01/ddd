import PQueue from 'p-queue';

/**
 * Rate limiter for external API calls
 * Uses p-queue for concurrency control
 */

// Tavily: 1,000 requests/minute, use 90% capacity = 900/min
const tavilyQueue = new PQueue({
  interval: 60000, // 1 minute
  intervalCap: 900, // 900 requests per minute
  concurrency: 50, // Allow 50 concurrent requests
});

// OpenAI Tier 5: 10,000 RPM = 166/second, conservative 50/second
const openaiQueue = new PQueue({
  interval: 1000, // 1 second
  intervalCap: 50, // 50 requests per interval
  concurrency: 10,
});

export const rateLimiters = {
  tavily: tavilyQueue,
  openai: openaiQueue,
};

export function getTavilyLimiter(): PQueue {
  return tavilyQueue;
}

export function getOpenAILimiter(): PQueue {
  return openaiQueue;
}
