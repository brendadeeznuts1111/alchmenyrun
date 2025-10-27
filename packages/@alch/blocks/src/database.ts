/**
 * Database building block with automatic stage suffixing
 *
 * This wrapper automatically appends the stage name to D1 databases
 * to prevent name collisions between preview, prod, and PR environments.
 */

import { D1Database } from "alchemy/cloudflare";

/**
 * Create a D1 database with automatic stage suffixing
 *
 * @example
 * ```ts
 * // Before: manual stage suffixing
 * const db = await D1Database("db", {
 *   name: `alchemy-demo-db-${app.stage}`,
 * });
 *
 * // After: automatic stage suffixing
 * const db = await Database("alchemy-demo-db");
 * // Results in: alchemy-demo-db-preview, alchemy-demo-db-prod, etc.
 * ```
 */
export function Database(name: string, opts: any = {}) {
  // Get the current stage from the app context
  // Note: This assumes we're in an alchemy.run context
  const stage = process.env.STAGE || "dev";

  return D1Database(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}
