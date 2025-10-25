/**
 * Feature Flags Module
 *
 * Dark launch and feature flag management for gradual rollouts
 */

import type { Env } from "./index";

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
    console.error("Error getting dark launch percentage:", error);
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
    console.error(`Error checking feature ${featureName}:`, error);
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
    console.error("Error getting feature flags:", error);
    return {};
  }
}
