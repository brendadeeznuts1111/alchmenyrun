/**
 * Production-Grade Worker-Based MCP Server
 *
 * Cloudflare Worker that exposes Alchemy operations as MCP tools
 * with JWT/shared-secret auth, rate limiting, and dark launch support.
 */

import { authenticateRequest } from "./auth";
import { checkRateLimit } from "./rate-limit";
import { handleMCPRequest } from "./handler";
import { getDarkLaunchPercentage } from "./feature-flags";

export interface Env {
  // MCP Configuration
  MCP_SHARED_SECRET: string;
  MCP_JWT_SECRET: string;
  ENVIRONMENT: string;

  // Infrastructure bindings
  DB: D1Database;
  STORAGE: R2Bucket;
  JOBS: Queue;
  CACHE: KVNamespace;
  CHAT: DurableObjectNamespace;
  WORKFLOW: WorkflowNamespace;

  // MCP-specific KV for rate limiting and dark launch
  MCP_KV: KVNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for browser-based clients
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-MCP-Secret",
      "Access-Control-Max-Age": "86400",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return Response.json(
        {
          status: "ok",
          service: "mcp-worker",
          environment: env.ENVIRONMENT || "production",
          timestamp: new Date().toISOString(),
        },
        { headers: corsHeaders },
      );
    }

    // Dark launch check - gradual rollout
    const darkLaunchPercentage = await getDarkLaunchPercentage(env);
    const randomValue = Math.random() * 100;

    if (randomValue > darkLaunchPercentage) {
      return Response.json(
        {
          error: "Service temporarily unavailable",
          message: "MCP server is currently in limited availability mode",
        },
        {
          status: 503,
          headers: corsHeaders,
        },
      );
    }

    // Authenticate request
    const authResult = await authenticateRequest(request, env);
    if (!authResult.success) {
      return Response.json(
        {
          error: "Unauthorized",
          message: authResult.error || "Invalid authentication credentials",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      env,
      authResult.clientId,
    );
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests. Retry after ${rateLimitResult.retryAfter} seconds`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          },
        },
      );
    }

    // Route MCP requests
    if (url.pathname === "/mcp" || url.pathname === "/mcp/") {
      try {
        const response = await handleMCPRequest(request, env, authResult);

        // Add rate limit headers to successful responses
        return new Response(response.body, {
          status: response.status,
          headers: {
            ...corsHeaders,
            ...Object.fromEntries(response.headers.entries()),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining - 1),
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          },
        });
      } catch (error) {
        console.error("MCP request error:", error);
        return Response.json(
          {
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }
    }

    // 404 for unknown routes
    return Response.json(
      {
        error: "Not found",
        message: "MCP endpoint not found",
        availableEndpoints: ["/health", "/mcp"],
      },
      {
        status: 404,
        headers: corsHeaders,
      },
    );
  },
};
