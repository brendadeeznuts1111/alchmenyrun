/**
 * Rate Limiting Module
 *
 * KV-based rate limiting with sliding window algorithm
 */
/**
 * Rate limit configurations by environment
 */
const RATE_LIMITS = {
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
export async function checkRateLimit(request, env, clientId) {
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
    }
    catch (error) {
        console.error("Rate limit check error:", error);
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
function getClientIdentifier(request) {
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
export async function resetRateLimit(env, clientId) {
    const config = RATE_LIMITS[env.ENVIRONMENT || "production"] || RATE_LIMITS.production;
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / config.windowSeconds);
    const key = `ratelimit:${clientId}:${windowStart}`;
    await env.MCP_KV?.delete(key);
}
