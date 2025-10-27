// Core scope hierarchy exports
export { ApplicationScope } from "./application-scope";
export type { ApplicationScopeConfig, FinalizationReport } from "./application-scope";

export { StageScope } from "./stage-scope";
export { NestedScope } from "./nested-scope";

export { ResourceScope } from "./resource-scope";
export type { ResourceScopeOptions } from "./resource-scope";

// Re-export state manager
export { StateManager } from "./state-manager";
export type {
  StateManagerConfig,
  StateBackendType,
  ResourceState,
  ScopeState
} from "./state-manager";

// Re-export scope manager
export { ScopeManager, alchemy, scopeManager } from "./scope-manager";

/**
 * Scope system version
 */
export const SCOPE_SYSTEM_VERSION = "1.0.0";

/**
 * Default scope configuration
 */
export const DEFAULT_SCOPE_CONFIG = {
  enableLocking: true,
  destroyStrategy: "sequential" as const,
  baseDir: ".alchemy",
  lockTimeout: 30000
} as const;

/**
 * Utility function to create a standard scope path
 */
export function createScopePath(appName: string, stage?: string, nestedScope?: string): string {
  const parts = [appName];
  if (stage) parts.push(stage);
  if (nestedScope) parts.push(nestedScope);
  return parts.join('/');
}

/**
 * Utility function to parse a scope path
 */
export function parseScopePath(scopePath: string): {
  appName: string;
  stage?: string;
  nestedScope?: string;
  depth: number;
} {
  const parts = scopePath.split('/');
  const appName = parts[0];
  const stage = parts[1];
  const nestedScope = parts[2];
  const depth = parts.length - 1; // -1 for app name

  return {
    appName,
    stage: stage || undefined,
    nestedScope: nestedScope || undefined,
    depth
  };
}

/**
 * Validate scope path format
 */
export function isValidScopePath(scopePath: string): boolean {
  if (!scopePath || typeof scopePath !== 'string') return false;

  const parts = scopePath.split('/').filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return false;

  // Check for valid characters (alphanumeric, hyphen, underscore)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return parts.every(part => validPattern.test(part));
}