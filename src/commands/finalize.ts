#!/usr/bin/env bun
/**
 * finalize - Clean up orphaned resources in scopes
 *
 * Usage:
 *   alchemy finalize [options]
 *   alchemy finalize --stage prod
 *   alchemy finalize --app my-app --dry-run
 *   alchemy finalize --all --strategy aggressive
 */

import { ApplicationScope, StageScope } from "../scope";

/**
 * CLI command options
 */
interface FinalizeOptions {
  app?: string;
  stage?: string;
  all?: boolean;
  dryRun?: boolean;
  strategy?: 'conservative' | 'aggressive';
  retryAttempts?: number;
  force?: boolean;
}

/**
 * CLI command to finalize (clean up) scopes
 */
export async function finalize(options: FinalizeOptions = {}): Promise<void> {
  const {
    app,
    stage,
    all = false,
    dryRun = false,
    strategy = 'conservative',
    retryAttempts = 3,
    force = false
  } = options;

  try {
    // Determine what to finalize
    if (all) {
      await finalizeAllApplications({ dryRun, strategy, retryAttempts, force });
    } else if (app && stage) {
      await finalizeStage(app, stage, { dryRun, strategy, retryAttempts, force });
    } else if (app) {
      await finalizeApplication(app, { dryRun, strategy, retryAttempts, force });
    } else if (stage) {
      // Try to detect app name and finalize specific stage
      const detectedApp = await detectAppName();
      if (detectedApp) {
        await finalizeStage(detectedApp, stage, { dryRun, strategy, retryAttempts, force });
      } else {
        console.error("❌ Could not detect application name. Please specify:");
        console.error("   alchemy finalize --app <app-name> --stage <stage>");
        process.exit(1);
      }
    } else {
      // Finalize current app's current stage
      const detectedApp = await detectAppName();
      const currentStage = process.env.USER || 'default';

      if (detectedApp) {
        await finalizeStage(detectedApp, currentStage, { dryRun, strategy, retryAttempts, force });
      } else {
        console.error("❌ Could not detect application. Please specify:");
        console.error("   alchemy finalize --app <app-name> --stage <stage>");
        console.error("   alchemy finalize --all");
        process.exit(1);
      }
    }

  } catch (error) {
    console.error("❌ Finalization failed:", error);
    process.exit(1);
  }
}

/**
 * Finalize all applications
 */
async function finalizeAllApplications(options: {
  dryRun: boolean;
  strategy: 'conservative' | 'aggressive';
  retryAttempts: number;
  force: boolean;
}): Promise<void> {
  console.log("🧹 Finalizing ALL applications...");
  if (options.dryRun) {
    console.log("📋 DRY RUN - No changes will be made");
  }
  console.log("");

  // This is a placeholder - in a real implementation, we'd scan all .alchemy directories
  console.log("⚠️  Finalizing all applications is not yet implemented.");
  console.log("   Please specify an application: alchemy finalize --app <app-name>");
}

/**
 * Finalize a specific application (all its stages)
 */
async function finalizeApplication(
  appName: string,
  options: {
    dryRun: boolean;
    strategy: 'conservative' | 'aggressive';
    retryAttempts: number;
    force: boolean;
  }
): Promise<void> {
  console.log(`🧹 Finalizing application: ${appName}`);
  if (options.dryRun) {
    console.log("📋 DRY RUN - No changes will be made");
  }
  console.log("");

  try {
    // Get all stages for the application
    const stages = await StageScope.listStages(appName);

    if (stages.length === 0) {
      console.log(`ℹ️  No stages found for application ${appName}`);
      return;
    }

    console.log(`📦 Found ${stages.length} stages: ${stages.join(', ')}`);
    console.log("");

    let totalDeleted = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    for (const stageName of stages) {
      try {
        console.log(`🏗️  Finalizing stage: ${stageName}`);
        const report = await finalizeStage(appName, stageName, options);

        totalDeleted += report.resourcesDeleted;
        totalFailed += report.resourcesFailed;
        totalProcessed += report.nestedScopesProcessed;

        console.log(`   ✅ ${report.resourcesDeleted} resources deleted, ${report.resourcesFailed} failed`);
        console.log(`   ⏱️  Completed in ${report.duration}ms`);
        console.log("");

      } catch (error) {
        console.error(`❌ Failed to finalize stage ${stageName}:`, error);
        console.log("");
      }
    }

    // Summary
    console.log("📊 Finalization Summary:");
    console.log("─".repeat(40));
    console.log(`Stages processed: ${stages.length}`);
    console.log(`Resources deleted: ${totalDeleted}`);
    console.log(`Resources failed: ${totalFailed}`);
    console.log(`Nested scopes: ${totalProcessed}`);

    if (totalFailed > 0) {
      console.log("");
      console.log("⚠️  Some resources failed to delete. Check the logs above.");
      console.log("   You may need to:");
      console.log("   • Check API credentials");
      console.log("   • Verify resource still exists");
      console.log("   • Run with --force flag for aggressive cleanup");
    }

  } catch (error) {
    console.error(`❌ Failed to finalize application ${appName}:`, error);
    throw error;
  }
}

/**
 * Finalize a specific stage
 */
async function finalizeStage(
  appName: string,
  stageName: string,
  options: {
    dryRun: boolean;
    strategy: 'conservative' | 'aggressive';
    retryAttempts: number;
    force: boolean;
  }
): Promise<any> {
  const { dryRun, strategy, retryAttempts, force } = options;

  // Check if stage can be accessed with current profile
  const stage = new StageScope({
    appName,
    stageName,
    enableLocking: false // We'll handle locking in ApplicationScope
  });

  // For production stages, require explicit confirmation unless forced
  if (stageName === 'prod' && !force && !dryRun) {
    console.log("⚠️  You are about to finalize the PRODUCTION stage!");
    console.log("   This will delete all orphaned resources in production.");
    console.log("");

    // In a real CLI, we'd prompt for confirmation here
    // For now, we'll be conservative and require --force
    console.log("   Use --force to proceed with production finalization.");
    console.log("   Or use --dry-run to preview what would be deleted.");
    return {
      scopePath: `${appName}/${stageName}`,
      resourcesDeleted: 0,
      resourcesFailed: 0,
      nestedScopesProcessed: 0,
      duration: 0,
      errors: ['Production finalization requires --force flag']
    };
  }

  // Create application scope for finalization
  const app = new ApplicationScope({
    name: appName,
    stage: stageName,
    enableLocking: true
  });

  console.log(`🧹 Finalizing scope: ${appName}/${stageName}`);
  console.log(`   Strategy: ${strategy}`);
  console.log(`   Retry attempts: ${retryAttempts}`);
  if (dryRun) {
    console.log(`   Mode: DRY RUN (no changes)`);
  }
  console.log("");

  const startTime = Date.now();
  const report = await app.finalize({
    retryAttempts,
    strategy,
    dryRun
  });

  const duration = Date.now() - startTime;

  if (dryRun) {
    console.log("📋 DRY RUN Results:");
    console.log("─".repeat(40));
    console.log(`Would delete: ${report.resourcesDeleted} resources`);
    console.log(`Would process: ${report.nestedScopesProcessed} nested scopes`);
    if (report.errors.length > 0) {
      console.log(`Errors found: ${report.errors.length}`);
      report.errors.forEach(error => console.log(`   • ${error}`));
    }
  } else {
    console.log("✅ Finalization Complete:");
    console.log("─".repeat(40));
    console.log(`Resources deleted: ${report.resourcesDeleted}`);
    console.log(`Resources failed: ${report.resourcesFailed}`);
    console.log(`Nested scopes: ${report.nestedScopesProcessed}`);
    console.log(`Duration: ${duration}ms`);

    if (report.errors.length > 0) {
      console.log("");
      console.log("⚠️  Errors encountered:");
      report.errors.forEach(error => console.log(`   • ${error}`));
    }
  }

  return { ...report, duration };
}

/**
 * Detect application name from current directory
 */
async function detectAppName(): Promise<string | null> {
  try {
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

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Main CLI entry point
 */
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Parse arguments
  let app: string | undefined;
  let stage: string | undefined;
  let all = false;
  let dryRun = false;
  let strategy: 'conservative' | 'aggressive' = 'conservative';
  let retryAttempts = 3;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--app':
        app = args[++i];
        break;
      case '--stage':
        stage = args[++i];
        break;
      case '--all':
        all = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--strategy':
        const strat = args[++i];
        if (strat === 'conservative' || strat === 'aggressive') {
          strategy = strat;
        } else {
          console.error(`❌ Invalid strategy: ${strat}. Must be 'conservative' or 'aggressive'`);
          process.exit(1);
        }
        break;
      case '--retry':
        retryAttempts = parseInt(args[++i]);
        if (isNaN(retryAttempts) || retryAttempts < 1) {
          console.error(`❌ Invalid retry attempts: ${args[i]}`);
          process.exit(1);
        }
        break;
      case '--force':
        force = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        console.error(`❌ Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }

  await finalize({
    app,
    stage,
    all,
    dryRun,
    strategy,
    retryAttempts,
    force
  });
}

function showHelp(): void {
  console.log(`
🧹 Alchemy Finalize Command

Usage:
  alchemy finalize [options]

Options:
  --app <name>        Target application name
  --stage <name>      Target stage name
  --all               Finalize all applications
  --dry-run           Preview what would be deleted
  --strategy <type>   Cleanup strategy: conservative | aggressive (default: conservative)
  --retry <number>    Number of retry attempts (default: 3)
  --force             Force finalization (required for production)

Examples:
  alchemy finalize                                    # Finalize current app/stage
  alchemy finalize --stage prod                       # Finalize production stage
  alchemy finalize --app my-app --stage dev           # Finalize specific app/stage
  alchemy finalize --all --dry-run                    # Preview all finalizations
  alchemy finalize --stage prod --strategy aggressive # Aggressive prod cleanup
  alchemy finalize --stage prod --force               # Force prod finalization
`);
}
