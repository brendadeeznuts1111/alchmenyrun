/**
 * Storage building blocks with automatic stage suffixing
 *
 * These wrappers automatically append the stage name to storage resources
 * to prevent name collisions between preview, prod, and PR environments.
 */

import { R2Bucket, KVNamespace } from "alchemy/cloudflare";

/**
 * Create an R2 bucket with automatic stage suffixing
 *
 * @example
 * ```ts
 * const bucket = await Bucket("user-files");
 * // Results in: user-files-preview, user-files-prod, etc.
 * ```
 */
export function Bucket(name: string, opts: any = {}) {
  const stage = process.env.STAGE || "dev";

  return R2Bucket(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}

/**
 * Create a KV namespace with automatic stage suffixing
 *
 * @example
 * ```ts
 * const kv = await KV("cache");
 * // Results in: cache-preview, cache-prod, etc.
 * ```
 */
export function KV(name: string, opts: any = {}) {
  const stage = process.env.STAGE || "dev";

  return KVNamespace(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}

/**
 * Create a Queue with automatic stage suffixing
 *
 * @example
 * ```ts
 * const queue = await Queue("email-jobs");
 * // Results in: email-jobs-preview, email-jobs-prod, etc.
 * ```
 */
export function Queue(name: string, opts: any = {}) {
  const stage = process.env.STAGE || "dev";

  return Queue(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}
