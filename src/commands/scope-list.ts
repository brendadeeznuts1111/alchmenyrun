#!/usr/bin/env bun
/**
 * scope-list - List all stages and scopes in an application
 *
 * Usage:
 *   alchemy scope-list [app-name]
 *   alchemy scope-list my-app
 */

import { StageScope } from "../scope/stage-scope";
import { ApplicationScope } from "../scope/application-scope";

/**
 * CLI command to list all stages for an application
 */
export async function scopeList(appName?: string): Promise<void> {
  try {
    // Default to current directory's app if not specified
    const targetApp = appName || await detectAppName();

    if (!targetApp) {
      console.error("❌ Could not detect application name. Please specify:");
      console.error("   alchemy scope-list <app-name>");
      process.exit(1);
    }

    console.log(`📋 Listing scopes for application: ${targetApp}`);
    console.log("");

    // List all stages for the application
    const stages = await StageScope.listStages(targetApp);

    if (stages.length === 0) {
      console.log("ℹ️  No stages found for this application.");
      console.log("");
      console.log("💡 To create a stage, run:");
      console.log(`   alchemy deploy --stage ${process.env.USER || 'default'} --profile default`);
      return;
    }

    // Display stages with metadata
    console.log("🏗️  Stages:");
    console.log("─".repeat(80));

    for (const stageName of stages) {
      try {
        const stage = new StageScope({
          appName: targetApp,
          stageName,
          enableLocking: false // Read-only operation
        });

        const snapshot = await stage.getSnapshot();
        const metadata = await stage.getMetadata();

        // Stage type indicator
        const stageType = getStageTypeIndicator(stageName, metadata.environment);

        // Lock status
        const lockStatus = snapshot.isLocked ? "🔒" : "🔓";

        // Resource count
        const resourceCount = `${snapshot.totalResources} resources`;

        // Last activity
        const lastActivity = snapshot.lastUpdated > 0
          ? new Date(snapshot.lastUpdated).toLocaleString()
          : "Never";

        console.log(`${stageType} ${stageName.padEnd(15)} ${lockStatus} ${resourceCount.padEnd(15)} ${lastActivity}`);

        // Show nested scopes if any
        if (snapshot.nestedScopes.length > 0) {
          console.log(`    └─ Nested: ${snapshot.nestedScopes.join(', ')}`);
        }

      } catch (error) {
        console.log(`❌ ${stageName.padEnd(15)} Error loading stage: ${error}`);
      }
    }

    console.log("");
    console.log("💡 Commands:");
    console.log(`   alchemy scope-inspect ${targetApp} <stage>    # Inspect a specific stage`);
    console.log(`   alchemy finalize --stage <stage>             # Clean up orphaned resources`);

  } catch (error) {
    console.error("❌ Failed to list scopes:", error);
    process.exit(1);
  }
}

/**
 * Detect application name from current directory
 */
async function detectAppName(): Promise<string | null> {
  try {
    // Try to read from alchemy.config.ts or package.json
    const fs = await import("fs");
    const path = await import("path");

    // Check for alchemy.config.ts
    if (fs.existsSync("alchemy.config.ts")) {
      const config = await import(path.resolve("alchemy.config.ts"));
      if (config.app?.name) {
        return config.app.name;
      }
    }

    // Check for package.json
    if (fs.existsSync("package.json")) {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      if (pkg.name) {
        return pkg.name;
      }
    }

    // Check for .alchemy directory
    if (fs.existsSync(".alchemy")) {
      const entries = fs.readdirSync(".alchemy");
      if (entries.length > 0) {
        // Return first app directory found
        return entries[0];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get stage type indicator emoji
 */
function getStageTypeIndicator(stageName: string, environment: string): string {
  if (stageName === 'prod') {
    return "🏭"; // Production
  }

  if (stageName.startsWith('pr-')) {
    return "🔄"; // PR preview
  }

  if (stageName === process.env.USER) {
    return "👤"; // User dev environment
  }

  if (environment === 'development') {
    return "🔧"; // Development
  }

  return "📦"; // Other
}

/**
 * Main CLI entry point
 */
if (import.meta.main) {
  const appName = process.argv[2];
  await scopeList(appName);
}
