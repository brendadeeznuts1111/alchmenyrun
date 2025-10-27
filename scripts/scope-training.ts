#!/usr/bin/env bun
/**
 * Scope System Training Guide
 * Interactive training for team adoption
 * Usage: bun run scripts/scope-training.ts
 *
 * CODEOWNERS TEST: This file should trigger @alice.smith and @infra_dev1 for review
 */

import { ApplicationScope } from "../src/scope";

class ScopeTrainingGuide {
  private currentStep = 0;
  private app: ApplicationScope | null = null;

  async startTraining(): Promise<void> {
    console.log("🎓 Welcome to Alchemy Scope System Training!");
    console.log("This interactive guide will teach you how to use scopes effectively.");
    console.log("=" .repeat(80));
    console.log("");

    const steps = [
      { name: "Introduction to Scopes", method: this.stepIntroduction },
      { name: "Creating Your First Scope", method: this.stepCreateScope },
      { name: "Understanding Scope Hierarchy", method: this.stepHierarchy },
      { name: "Resource Management", method: this.stepResources },
      { name: "Nested Scopes", method: this.stepNestedScopes },
      { name: "Finalization & Cleanup", method: this.stepFinalization },
      { name: "CLI Tools", method: this.stepCLI },
      { name: "Best Practices", method: this.stepBestPractices },
      { name: "Troubleshooting", method: this.stepTroubleshooting },
      { name: "Advanced Features", method: this.stepAdvanced }
    ];

    for (let i = 0; i < steps.length; i++) {
      this.currentStep = i + 1;
      console.log(`\n📚 Step ${this.currentStep}/${steps.length}: ${steps[i].name}`);
      console.log("-".repeat(60));

      try {
        await steps[i].method.call(this);
        console.log(`✅ Step ${this.currentStep} completed successfully!`);

        if (i < steps.length - 1) {
          await this.waitForContinue();
        }
      } catch (error) {
        console.error(`❌ Step ${this.currentStep} failed:`, error);
        break;
      }
    }

    console.log("\n🎉 Training completed! You now know how to use the Alchemy Scope System.");
    console.log("📖 For more details, see: docs/guides/alchemy-scopes.md");

    // Cleanup
    await this.cleanup();
  }

  private async stepIntroduction(): Promise<void> {
    console.log(`
🔍 What are Scopes?

Scopes are Alchemy's hierarchical containers that provide:

1. **Naming Isolation** - Every resource gets a unique path
2. **State Isolation** - Each scope owns its own state file
3. **Cleanup Isolation** - Destroy scopes without affecting siblings

Think of scopes like directories in a filesystem:
- Application scope = root directory (e.g., "my-app/")
- Stage scope = environment (e.g., "my-app/prod/")
- Nested scope = service layer (e.g., "my-app/prod/backend/")
- Resource scope = individual resources (e.g., "my-app/prod/backend/api-worker")

Benefits:
✅ Zero cross-environment interference
✅ Reliable resource cleanup
✅ Cost-effective CI/CD pipelines
✅ Enterprise-grade lifecycle management
    `);
  }

  private async stepCreateScope(): Promise<void> {
    console.log(`
🏗️ Creating Your First Scope

Let's create a scope for training purposes:
    `);

    this.app = new ApplicationScope({
      name: "training-app",
      stage: "demo",
      stateDir: ".alchemy-training",
      destroyStrategy: "sequential"
    });

    await this.app.initialize();

    console.log("✅ Created training scope: training-app/demo");
    console.log("📁 State directory: .alchemy-training/training-app/demo/");

    // Show current state
    const stats = await this.app.getStats();
    console.log(`📊 Current stats: ${stats.totalResources} resources, ${stats.nestedScopes} nested scopes`);
  }

  private async stepHierarchy(): Promise<void> {
    console.log(`
🏢 Understanding Scope Hierarchy

Scope paths follow this pattern:
[application]/[stage]/[nested]/[resource]

Examples:
• training-app/demo (application + stage)
• training-app/demo/backend (with nested scope)
• training-app/demo/backend/api-worker (with resource)

Each level provides isolation:
- **Application**: Project-wide container
- **Stage**: Environment isolation (dev/staging/prod/pr-*)
- **Nested**: Service/component grouping
- **Resource**: Individual cloud resources
    `);

    if (this.app) {
      console.log(`Your current scope path: ${this.app.scopePath}`);
      console.log(`Application: ${this.app.name}`);
      console.log(`Stage: ${this.app.stage}`);
    }
  }

  private async stepResources(): Promise<void> {
    console.log(`
📦 Resource Management

Scopes automatically track all resources created within them.
Let's add some test resources:
    `);

    if (!this.app) throw new Error("App not initialized");

    // Add some example resources
    await this.app.addResource("demo-worker", {
      id: "demo-worker-1",
      type: "worker",
      name: "demo-api-worker",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      url: "https://demo-worker.alchemy.run"
    });

    await this.app.addResource("demo-database", {
      id: "demo-db-1",
      type: "d1",
      name: "demo-database",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: "100MB"
    });

    const resources = await this.app.getResources();
    console.log(`✅ Added ${Object.keys(resources).length} resources:`);

    for (const [id, resource] of Object.entries(resources)) {
      console.log(`   • ${resource.type}: ${resource.name} (${id})`);
    }

    console.log(`
💡 Key Points:
• Resources are automatically tracked
• Each resource gets a unique ID within the scope
• State persists across deployments
• Resources can be inspected and managed via CLI
    `);
  }

  private async stepNestedScopes(): Promise<void> {
    console.log(`
🏗️ Nested Scopes

Nested scopes help organize related resources by service layer.
Let's create nested scopes for different parts of our application:
    `);

    if (!this.app) throw new Error("App not initialized");

    // Register nested scopes
    await this.app.registerNestedScope("backend");
    await this.app.registerNestedScope("frontend");
    await this.app.registerNestedScope("monitoring");

    const nestedScopes = await this.app.getNestedScopes();
    console.log(`✅ Created ${nestedScopes.length} nested scopes: ${nestedScopes.join(", ")}`);

    console.log(`
💡 When to use nested scopes:
• Backend services (API, workers, databases)
• Frontend services (CDN, static hosting)
• Monitoring & logging infrastructure
• Third-party integrations
• Team-specific resources

Benefits:
• Logical grouping of related resources
• Independent cleanup of service layers
• Better organization for large applications
• Easier debugging and maintenance
    `);
  }

  private async stepFinalization(): Promise<void> {
    console.log(`
🧹 Finalization & Cleanup

Finalization compares your current code with scope state and cleans up orphaned resources.

Let's see how it works:
    `);

    if (!this.app) throw new Error("App not initialized");

    // First, show dry-run
    console.log("🔍 Running dry-run finalization (safe preview):");
    const dryRunReport = await this.app.finalize({
      dryRun: true,
      strategy: "conservative"
    });

    console.log(`   Would delete: ${dryRunReport.resourcesDeleted} resources`);
    console.log(`   Would process: ${dryRunReport.nestedScopesProcessed} nested scopes`);
    console.log(`   Duration: ${dryRunReport.duration}ms`);

    if (dryRunReport.resourcesDeleted > 0) {
      console.log(`
💡 Dry-run shows what WOULD be cleaned up.
In a real scenario, this would remove resources no longer defined in your code.
      `);
    }

    console.log(`
🎯 Finalization Strategies:

• **Conservative** (default): Stops on first error, safest for production
• **Aggressive**: Continues despite errors, faster for CI/CD cleanup

🔧 When Finalization Runs:
• Manual: await app.finalize()
• Automatic: End of nested scope blocks
• CLI: alchemy finalize --stage <stage>
• CI/CD: Automatic cleanup workflows
    `);
  }

  private async stepCLI(): Promise<void> {
    console.log(`
💻 CLI Tools

The scope system comes with powerful CLI tools for inspection and management:
    `);

    const commands = [
      { cmd: "bun run scope:list", desc: "List all scopes in your project" },
      { cmd: "bun run scope:inspect training-app demo", desc: "Detailed scope information" },
      { cmd: "bun run scope:stats", desc: "Scope system statistics" },
      { cmd: "bun run src/commands/finalize.ts --app training-app --stage demo --dry-run", desc: "Preview cleanup" }
    ];

    for (const { cmd, desc } of commands) {
      console.log(`   ${cmd}`);
      console.log(`   └─ ${desc}`);
      console.log("");
    }

    console.log(`
📊 Try these commands after training:

1. List all scopes:
   bun run scope:list

2. Inspect your training scope:
   bun run scope:inspect training-app demo

3. Check system stats:
   bun run scope:stats

4. Preview cleanup:
   bun run src/commands/finalize.ts --app training-app --stage demo --dry-run
    `);
  }

  private async stepBestPractices(): Promise<void> {
    console.log(`
✨ Best Practices

🎯 Scope Naming:
• Use kebab-case: my-app, user-service, api-gateway
• Stage names: dev, staging, prod, pr-123
• Nested scopes: backend, frontend, monitoring, integrations

🏗️ Scope Organization:
• One application scope per project
• Use stage names that match your environments
• Group related resources in nested scopes
• Keep scope hierarchies shallow (max 3-4 levels)

🔒 Security:
• Use profiles for credential isolation
• Never commit scope state files (.alchemy/)
• Rotate API tokens regularly
• Audit scope access patterns

🧹 Cleanup:
• Run finalization regularly in CI/CD
• Use dry-run mode for safety
• Monitor for orphaned resources
• Set up automated cleanup workflows

📈 Scaling:
• Use parallel finalization for CI speed
• Enable state file versioning for critical apps
• Monitor scope system health
• Archive old scope state files
    `);
  }

  private async stepTroubleshooting(): Promise<void> {
    console.log(`
🔧 Troubleshooting Common Issues

❌ "State file locked by another process"
💡 Solution: Wait for other deployments to complete, or use emergency unlock
   bun run alchemy finalize --force --stage <stuck-stage>

❌ "Resource not found in scope"
💡 Solution: Check if resource was created in the correct scope
   bun run scope:inspect <app> <stage>

❌ "Too many resources in scope"
💡 Solution: Use nested scopes for better organization
   await alchemy.run("service-name", async () => { ... });

❌ "Finalization taking too long"
💡 Solution: Use parallel strategy for CI/CD
   await app.finalize({ strategy: "parallel" });

❌ "State file corrupted"
💡 Solution: Restore from backup (if versioning enabled)
   Or recreate scope: rm -rf .alchemy/<app>/<stage>/state.json

🔍 Debugging Commands:
• bun run scope:state <app> <stage>          # Raw state file
• bun run scope:monitor --once               # Health check
• bun run scope:list --json                  # Machine-readable output

📞 Getting Help:
• Check docs/guides/alchemy-scopes.md
• Run CLI commands with --help
• Check .alchemy/ directory structure
    `);
  }

  private async stepAdvanced(): Promise<void> {
    console.log(`
🚀 Advanced Features

🔄 State Backends:
• File system (default): Simple, local storage
• R2: Cloud storage for distributed teams
• S3: AWS integration for enterprise
• Composite: File + cloud for reliability

🔒 Distributed Locking:
• File-based locks (default)
• Cloud-based locks for distributed teams
• Composite locking for high availability

📦 Versioning & Backups:
• Automatic state file backups
• Point-in-time recovery
• Configurable retention policies
• Emergency rollback capabilities

📊 Monitoring & Alerting:
• Real-time health monitoring
• Automated alerts via Telegram/webhooks
• Performance metrics and trends
• Anomaly detection

🔧 Enterprise Features:
• Audit trails for all scope operations
• Multi-tenant scope isolation
• Compliance reporting
• Automated governance checks

💡 Advanced Configuration:

\`\`\`typescript
const app = new ApplicationScope({
  name: "enterprise-app",
  stage: "prod",
  destroyStrategy: "parallel",

  // Advanced state management
  stateDir: ".alchemy",
  enableLocking: true,

  // Versioning and backups
  enableVersioning: true,
  maxBackupVersions: 30,

  // Cloud storage
  backend: "composite", // file + r2
  r2Bucket: r2Bucket // Your R2 bucket
});
\`\`\`
    `);
  }

  private async waitForContinue(): Promise<void> {
    console.log("\n⏳ Press Enter to continue to the next step...");

    return new Promise((resolve) => {
      process.stdin.once("data", () => {
        resolve();
      });
    });
  }

  private async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up training resources...");

    if (this.app) {
      try {
        await this.app.finalize({ force: true });
      } catch (error) {
        console.warn("Training cleanup failed:", error);
      }
    }

    // Remove training state directory
    try {
      const fs = require("fs");
      if (fs.existsSync(".alchemy-training")) {
        fs.rmSync(".alchemy-training", { recursive: true, force: true });
      }
    } catch (error) {
      console.warn("Failed to remove training directory:", error);
    }
  }
}

async function main() {
  const guide = new ScopeTrainingGuide();
  await guide.startTraining();
}

if (import.meta.main) {
  main().catch(error => {
    console.error("Training failed:", error);
    process.exit(1);
  });
}
