/**
 * Simple in-memory rate limiter using sliding window algorithm.
 *
 * For MVP use - resets on cold start. For production scale,
 * consider upgrading to Upstash Redis + @upstash/ratelimit.
 *
 * This file must only be used server-side.
 */

if (typeof window !== 'undefined') {
  throw new Error('rate-limiter.ts must only be used server-side');
}

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store - resets on cold start
const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const MAX_STORE_SIZE = 10000; // Hard cap to prevent memory issues
let lastCleanup = Date.now();
let isCleaningUp = false;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL || isCleaningUp) return;

  isCleaningUp = true;
  try {
    lastCleanup = now;
    const cutoff = now - windowMs;

    for (const [key, entry] of store.entries()) {
      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(ts => ts > cutoff);
      // Remove empty entries
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }

    // Hard limit: if store is too large, delete oldest entries
    if (store.size > MAX_STORE_SIZE) {
      const entriesToDelete = Array.from(store.entries())
        .sort(([, a], [, b]) => {
          const aOldest = Math.min(...a.timestamps);
          const bOldest = Math.min(...b.timestamps);
          return aOldest - bOldest;
        })
        .slice(0, Math.floor(MAX_STORE_SIZE * 0.2))
        .map(([key]) => key);

      entriesToDelete.forEach(key => store.delete(key));
    }
  } finally {
    isCleaningUp = false;
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Requests remaining in current window */
  remaining: number;
  /** Milliseconds until the window resets */
  resetIn: number;
}

/**
 * Check if a request should be rate limited.
 * Uses sliding window algorithm for smooth rate limiting.
 *
 * @param key - Unique identifier (typically IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Run cleanup occasionally
  cleanup(config.windowMs);

  // Get or create entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  // Check if under limit
  if (entry.timestamps.length < config.limit) {
    // Allow request, record timestamp
    entry.timestamps.push(now);
    return {
      success: true,
      remaining: config.limit - entry.timestamps.length,
      resetIn: config.windowMs,
    };
  }

  // Rate limited - calculate when oldest request expires
  // Defensive check: Math.min(...[]) returns Infinity, guard against empty array
  const oldestTimestamp = entry.timestamps.length > 0
    ? Math.min(...entry.timestamps)
    : now;
  const resetIn = oldestTimestamp + config.windowMs - now;

  return {
    success: false,
    remaining: 0,
    resetIn: Math.max(0, resetIn),
  };
}

/**
 * Get client IP from Next.js request.
 *
 * SECURITY: Only trust Vercel's x-vercel-forwarded-for header.
 * This header is injected server-side by Vercel and cannot be spoofed
 * by clients. Other headers like x-forwarded-for CAN be spoofed.
 *
 * If not on Vercel (local dev), falls back to 'anonymous' which means
 * all local requests share one rate limit bucket.
 */
export function getClientIP(request: Request): string {
  // Vercel injects this header server-side - cannot be spoofed by clients
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }

  // Local development fallback - all requests share one bucket
  // This is fine for dev but means rate limiting is less granular locally
  return 'anonymous';
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** 10 requests per minute - good for expensive API calls */
  roadtrip: { limit: 10, windowMs: 60 * 1000 },

  /** 30 requests per minute - good for search endpoints */
  search: { limit: 30, windowMs: 60 * 1000 },

  /** 100 requests per minute - good for general API access */
  general: { limit: 100, windowMs: 60 * 1000 },
} as const;
