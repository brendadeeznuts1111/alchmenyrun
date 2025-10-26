/**
 * Rate Limiting Module
 *
 * KV-based rate limiting with sliding window algorithm
 * 
 * @see {@link https://developers.cloudflare.com/workers/runtime-apis/kv/ | Cloudflare KV Documentation}
 * @taxonomy [BUN/CLOUDFLARE/SPORTSBETTING]<TEST-STANDARDS:AGENT>[SECURITY]{#FANTASY402}@v2
 */

import type { Env } from "./index";
import { logger } from "alchemy";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Rate limit configurations by environment
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  production: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  },
  staging: {
    maxRequests: 500,
    windowSeconds: 60, // More lenient for testing
  },
  development: {
    maxRequests: 1000,
    windowSeconds: 60, // Very lenient for development
  },
};

/**
 * Check if request is within rate limits
 */
export async function checkRateLimit(
  request: Request,
  env: Env,
  clientId?: string,
): Promise<RateLimitResult> {
  // Determine rate limit config
  const environment = env.ENVIRONMENT || "production";
  const config = RATE_LIMITS[environment] || RATE_LIMITS.production;

  // Generate rate limit key
  const identifier = clientId || getClientIdentifier(request);
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / config.windowSeconds);
  const key = `ratelimit:${identifier}:${windowStart}`;

  try {
    // Get current count from KV
    const currentCountStr = await env.MCP_KV?.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    // Calculate remaining and reset time
    const resetAt = (windowStart + 1) * config.windowSeconds;
    const remaining = Math.max(0, config.maxRequests - currentCount - 1);

    // Check if limit exceeded
    if (currentCount >= config.maxRequests) {
      const retryAfter = resetAt - Math.floor(now / 1000);
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Increment count
    const newCount = currentCount + 1;
    const expirationTtl = config.windowSeconds * 2; // Double window for safety
    await env.MCP_KV?.put(key, String(newCount), { expirationTtl });

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    // Use structured logging without sensitive data
    logger.error("Rate limit check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
      environment: env.ENVIRONMENT || "unknown"
    });

    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: Math.floor(now / 1000) + config.windowSeconds,
    };
  }
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get client IP
  const cfConnectingIp = request.headers.get("CF-Connecting-IP");
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  // Fallback to other headers
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",");
    return `ip:${ips[0].trim()}`;
  }

  // Last resort - use a generic identifier
  return "anonymous";
}

/**
 * Reset rate limit for a client (admin function)
 */
export async function resetRateLimit(
  env: Env,
  clientId: string,
): Promise<void> {
  const config =
    RATE_LIMITS[env.ENVIRONMENT || "production"] || RATE_LIMITS.production;
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / config.windowSeconds);
  const key = `ratelimit:${clientId}:${windowStart}`;

  await env.MCP_KV?.delete(key);
}
