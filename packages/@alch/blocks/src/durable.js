/**
 * Durable Object and Workflow building blocks with automatic stage suffixing
 *
 * These wrappers automatically append the stage name to Durable Object namespaces
 * and Workflows to prevent name collisions between preview, prod, and PR environments.
 */
import { DurableObjectNamespace, Workflow } from "alchemy/cloudflare";
/**
 * Create a Durable Object namespace with automatic stage suffixing
 *
 * @example
 * ```ts
 * const chatNamespace = await DurableObject("chat-room");
 * // Results in: chat-room-preview, chat-room-prod, etc.
 * ```
 */
export function DurableObject(name, opts = {}) {
  const stage = process.env.STAGE || "dev";
  return DurableObjectNamespace(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}
/**
 * Create a Workflow with automatic stage suffixing
 *
 * @example
 * ```ts
 * const onboardingWorkflow = await Workflow("onboarding");
 * // Results in: onboarding-preview, onboarding-prod, etc.
 * ```
 */
export function AlchemyWorkflow(name, opts = {}) {
  const stage = process.env.STAGE || "dev";
  return Workflow(name, {
    ...opts,
    // Auto-append stage to guarantee uniqueness per environment
    name: opts.name ? `${opts.name}-${stage}` : `${name}-${stage}`,
  });
}
