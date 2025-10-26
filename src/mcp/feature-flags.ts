/**
 * Feature Flags Module
 *
 * KV-based feature flag management with dark launch support
 * 
 * @see {@link https://developers.cloudflare.com/workers/runtime-apis/kv/ | Cloudflare KV Documentation}
 * @taxonomy [BUN/CLOUDFLARE/SPORTSBETTING]<TEST-STANDARDS:AGENT>[SECURITY]{#FANTASY402}@v2
 */

import type { Env } from "./index";
import { logger } from "alchemy";

/**
 * Get the current dark launch percentage (0-100)
 */
export async function getDarkLaunchPercentage(env: Env): Promise<number> {
  try {
    const valueStr = await env.MCP_KV?.get("feature:dark-launch-percentage");
    if (!valueStr) {
      // Default to 100% enabled in production, 0% otherwise
      return env.ENVIRONMENT === "production" ? 100 : 0;
    }

    const percentage = parseInt(valueStr, 10);
    return Math.max(0, Math.min(100, percentage)); // Clamp to 0-100
  } catch (error) {
    logger.error("Failed to get dark launch percentage", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
      environment: env.ENVIRONMENT || "unknown"
    });
    // Fail safe - allow traffic in case of errors
    return 100;
  }
}

/**
 * Set the dark launch percentage (admin function)
 */
export async function setDarkLaunchPercentage(
  env: Env,
  percentage: number,
): Promise<void> {
  const clamped = Math.max(0, Math.min(100, percentage));
  await env.MCP_KV?.put("feature:dark-launch-percentage", String(clamped));
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(
  env: Env,
  featureName: string,
): Promise<boolean> {
  try {
    const value = await env.MCP_KV?.get(`feature:${featureName}`);
    return value === "true" || value === "1";
  } catch (error) {
    logger.error(`Failed to check feature ${featureName}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      featureName,
      timestamp: Date.now(),
      environment: env.ENVIRONMENT || "unknown"
    });
    // Fail safe - disable unknown features
    return false;
  }
}

/**
 * Set feature flag (admin function)
 */
export async function setFeatureFlag(
  env: Env,
  featureName: string,
  enabled: boolean,
): Promise<void> {
  await env.MCP_KV?.put(`feature:${featureName}`, enabled ? "true" : "false");
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(
  env: Env,
): Promise<Record<string, boolean>> {
  try {
    const list = await env.MCP_KV?.list({ prefix: "feature:" });
    const flags: Record<string, boolean> = {};

    if (list?.keys) {
      for (const key of list.keys) {
        const value = await env.MCP_KV?.get(key.name);
        const flagName = key.name.replace("feature:", "");
        flags[flagName] = value === "true" || value === "1";
      }
    }

    return flags;
  } catch (error) {
    logger.error("Failed to get feature flags", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
      environment: env.ENVIRONMENT || "unknown"
    });
    return {};
  }
}
