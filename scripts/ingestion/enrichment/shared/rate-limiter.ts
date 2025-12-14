import PQueue from 'p-queue';

/**
 * Rate limiter for external API calls
 * Uses p-queue for concurrency control
 */

// Tavily: 1,000 requests/month = ~33/day, conservative 1 req/2s
const tavilyQueue = new PQueue({
  interval: 2000, // 2 seconds
  intervalCap: 1, // 1 request per interval
  concurrency: 1,
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
