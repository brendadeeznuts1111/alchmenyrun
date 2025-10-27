#!/usr/bin/env bun
/**
 * scope-inspect - Inspect a specific stage and its resources
 *
 * Usage:
 *   alchemy scope-inspect <app-name> <stage>
 *   alchemy scope-inspect my-app prod
 *   alchemy scope-inspect my-app pr-123 --json
 */

import { StageScope, NestedScope } from "../scope";

/**
 * CLI command options
 */
interface InspectOptions {
  json?: boolean;
  showResources?: boolean;
  showNested?: boolean;
  depth?: number;
}

/**
 * CLI command to inspect a specific stage
 */
export async function scopeInspect(
  appName: string,
  stageName: string,
  options: InspectOptions = {}
): Promise<void> {
  try {
    const { json = false, showResources = true, showNested = true, depth = 2 } = options;

    console.log(`🔍 Inspecting scope: ${appName}/${stageName}`);
    console.log("");

    // Create stage scope instance
    const stage = new StageScope({
      appName,
      stageName,
      enableLocking: false // Read-only operation
    });

    // Check if stage exists
    const snapshot = await stage.getSnapshot();
    const metadata = await stage.getMetadata();

    if (json) {
      // JSON output mode
      const inspection = {
        stage: snapshot,
        metadata,
        resources: showResources ? await stage.getResources() : undefined,
        nestedScopes: showNested ? await getNestedScopesInspection(appName, stageName, depth) : undefined,
        orphanedResources: await stage.findOrphanedResources()
      };

      console.log(JSON.stringify(inspection, null, 2));
      return;
    }

    // Human-readable output
    console.log("📊 Stage Overview:");
    console.log("─".repeat(60));
    console.log(`Application:     ${snapshot.appName}`);
    console.log(`Stage:          ${snapshot.stageName}`);
    console.log(`Profile:        ${snapshot.profile}`);
    console.log(`Environment:    ${metadata.environment}`);
    console.log(`Ephemeral:      ${metadata.isEphemeral ? 'Yes' : 'No'}`);
    console.log(`Estimated Cost: ${metadata.estimatedCost}`);
    console.log(`Locked:         ${snapshot.isLocked ? 'Yes 🔒' : 'No 🔓'}`);
    console.log(`Resources:      ${snapshot.totalResources}`);
    console.log(`Nested Scopes:  ${snapshot.nestedScopes.length}`);
    console.log(`State Size:     ${formatBytes(snapshot.stateSize)}`);
    console.log(`Created:        ${new Date(snapshot.createdAt).toLocaleString()}`);
    console.log(`Last Updated:   ${new Date(snapshot.lastUpdated).toLocaleString()}`);
    console.log(`Last Activity:  ${new Date(metadata.lastActivity).toLocaleString()}`);
    console.log("");

    // Show resources
    if (showResources && snapshot.totalResources > 0) {
      console.log("📦 Resources:");
      console.log("─".repeat(60));

      const resources = await stage.getResources();
      for (const [resourceId, resource] of Object.entries(resources)) {
        const resourceType = resource.type || 'Unknown';
        const created = resource.createdAt ? new Date(resource.createdAt).toLocaleString() : 'Unknown';
        console.log(`${resourceType.padEnd(12)} ${resourceId.padEnd(30)} ${created}`);
      }
      console.log("");
    }

    // Show nested scopes
    if (showNested && snapshot.nestedScopes.length > 0) {
      console.log("🏗️  Nested Scopes:");
      console.log("─".repeat(60));

      const nestedInspection = await getNestedScopesInspection(appName, stageName, depth);

      for (const nested of nestedInspection) {
        console.log(`├── ${nested.scopeName}/ (${nested.resourceCount} resources)`);

        if (nested.resources && Object.keys(nested.resources).length > 0) {
          for (const [resourceId, resource] of Object.entries(nested.resources)) {
            console.log(`│   ├── ${resource.type || 'Unknown'}: ${resourceId}`);
          }
        }

        if (nested.nestedScopes && nested.nestedScopes.length > 0) {
          for (const childScope of nested.nestedScopes) {
            console.log(`│   └── ${childScope.scopeName}/ (${childScope.resourceCount} resources)`);
          }
        }
      }
      console.log("");
    }

    // Show orphaned resources warning
    const orphaned = await stage.findOrphanedResources();
    if (orphaned.length > 0) {
      console.log("⚠️  Orphaned Resources:");
      console.log("─".repeat(60));
      console.log(`Found ${orphaned.length} resources that may no longer be needed.`);
      console.log("Consider running: alchemy finalize --stage", stageName);
      console.log("");
    }

    // Show recommendations
    console.log("💡 Recommendations:");
    console.log("─".repeat(60));

    if (snapshot.isLocked) {
      console.log("• Stage is currently locked - another process may be working on it");
    }

    if (metadata.isEphemeral && snapshot.totalResources > 0) {
      console.log("• This appears to be an ephemeral stage - consider cleanup when done");
    }

    if (orphaned.length > 0) {
      console.log(`• ${orphaned.length} orphaned resources detected - run finalization`);
    }

    if (snapshot.totalResources === 0 && snapshot.nestedScopes.length === 0) {
      console.log("• Stage appears to be empty - safe to remove if no longer needed");
    }

    console.log("");

  } catch (error) {
    console.error("❌ Failed to inspect scope:", error);
    process.exit(1);
  }
}

/**
 * Get detailed inspection of nested scopes
 */
async function getNestedScopesInspection(
  appName: string,
  stageName: string,
  maxDepth: number,
  currentDepth = 0
): Promise<Array<{
  scopeName: string;
  scopePath: string;
  resourceCount: number;
  resources?: Record<string, any>;
  nestedScopes?: any[];
}>> {
  if (currentDepth >= maxDepth) return [];

  const parentScopePath = `${appName}/${stageName}`;

  try {
    const stage = new StageScope({
      appName,
      stageName,
      enableLocking: false
    });

    const nestedScopeNames = await stage.getNestedScopes();
    const inspections = [];

    for (const scopeName of nestedScopeNames) {
      const nestedScope = new NestedScope({
        parentScopePath,
        scopeName,
        enableLocking: false
      });

      const resources = await nestedScope.getResources();
      const nestedScopes = await getNestedScopesInspection(
        appName,
        `${stageName}/${scopeName}`,
        maxDepth,
        currentDepth + 1
      );

      inspections.push({
        scopeName,
        scopePath: `${parentScopePath}/${scopeName}`,
        resourceCount: Object.keys(resources).length,
        resources: Object.keys(resources).length > 0 ? resources : undefined,
        nestedScopes: nestedScopes.length > 0 ? nestedScopes : undefined
      });
    }

    return inspections;
  } catch (error) {
    console.warn(`Failed to inspect nested scopes for ${parentScopePath}:`, error);
    return [];
  }
}

/**
 * Format bytes for human-readable display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Main CLI entry point
 */
if (import.meta.main) {
  const args = process.argv.slice(2);
  const jsonFlag = args.includes('--json');
  const showResources = !args.includes('--no-resources');
  const showNested = !args.includes('--no-nested');

  // Remove flags from args
  const cleanArgs = args.filter(arg => !arg.startsWith('--'));

  if (cleanArgs.length < 2) {
    console.error("❌ Usage: alchemy scope-inspect <app-name> <stage> [options]");
    console.error("");
    console.error("Options:");
    console.error("  --json          Output as JSON");
    console.error("  --no-resources  Hide resource details");
    console.error("  --no-nested     Hide nested scope details");
    console.error("");
    console.error("Examples:");
    console.error("  alchemy scope-inspect my-app prod");
    console.error("  alchemy scope-inspect my-app pr-123 --json");
    process.exit(1);
  }

  const [appName, stageName] = cleanArgs;
  await scopeInspect(appName, stageName, {
    json: jsonFlag,
    showResources,
    showNested
  });
}
