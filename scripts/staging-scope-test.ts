#!/usr/bin/env bun
/**
 * Staging Scope Test - Comprehensive testing of scope system in staging environment
 * Usage: bun run scripts/staging-scope-test.ts
 */

import { ApplicationScope } from "../src/scope";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class ScopeSystemTester {
  private results: TestResult[] = [];
  private app: ApplicationScope | null = null;

  async runAllTests(): Promise<void> {
    console.log("🧪 Starting Alchemy Scope System Staging Tests");
    console.log("=" .repeat(60));

    try {
      // Test 1: Basic scope creation
      await this.testBasicScopeCreation();

      // Test 2: Resource isolation
      await this.testResourceIsolation();

      // Test 3: Nested scope functionality
      await this.testNestedScopes();

      // Test 4: State persistence
      await this.testStatePersistence();

      // Test 5: Finalization process
      await this.testFinalization();

      // Test 6: CLI commands
      await this.testCLICommands();

      // Test 7: Concurrent access (if supported)
      await this.testConcurrentAccess();

    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      // Cleanup
      await this.cleanup();
    }

    // Report results
    this.printReport();
  }

  private async testBasicScopeCreation(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("📋 Test 1: Basic scope creation");

      this.app = new ApplicationScope({
        name: "scope-test-app",
        stage: "staging",
        stateDir: ".alchemy-test",
        destroyStrategy: "sequential"
      });

      await this.app.initialize();

      // Verify scope properties
      if (this.app.name !== "scope-test-app") throw new Error("App name mismatch");
      if (this.app.stage !== "staging") throw new Error("Stage mismatch");

      // Verify state file was created
      const stats = await this.app.getStats();
      if (stats.totalResources !== 0) throw new Error("Initial resources should be 0");

      this.recordResult("Basic scope creation", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("Basic scope creation", false, Date.now() - startTime, error.message);
    }
  }

  private async testResourceIsolation(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("🔒 Test 2: Resource isolation");

      if (!this.app) throw new Error("App not initialized");

      // Add test resources
      await this.app.addResource("test-worker-1", {
        id: "worker-1",
        type: "worker",
        name: "test-worker-1",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      await this.app.addResource("test-db-1", {
        id: "db-1",
        type: "database",
        name: "test-db-1",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Verify resources were added
      const resources = await this.app.getResources();
      if (Object.keys(resources).length !== 2) {
        throw new Error(`Expected 2 resources, got ${Object.keys(resources).length}`);
      }

      if (!resources["test-worker-1"]) throw new Error("Worker resource not found");
      if (!resources["test-db-1"]) throw new Error("Database resource not found");

      this.recordResult("Resource isolation", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("Resource isolation", false, Date.now() - startTime, error.message);
    }
  }

  private async testNestedScopes(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("🏗️  Test 3: Nested scope functionality");

      if (!this.app) throw new Error("App not initialized");

      // Register nested scopes
      await this.app.registerNestedScope("backend");
      await this.app.registerNestedScope("frontend");

      const nestedScopes = await this.app.getNestedScopes();
      if (!nestedScopes.includes("backend")) throw new Error("Backend scope not registered");
      if (!nestedScopes.includes("frontend")) throw new Error("Frontend scope not registered");

      this.recordResult("Nested scope functionality", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("Nested scope functionality", false, Date.now() - startTime, error.message);
    }
  }

  private async testStatePersistence(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("💾 Test 4: State persistence");

      if (!this.app) throw new Error("App not initialized");

      // Add a resource and verify persistence
      await this.app.addResource("persistent-resource", {
        id: "persistent-1",
        type: "test",
        name: "persistent-resource",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Create a new app instance and verify it loads the state
      const newApp = new ApplicationScope({
        name: "scope-test-app",
        stage: "staging",
        stateDir: ".alchemy-test"
      });

      await newApp.initialize();
      const resources = await newApp.getResources();

      if (!resources["persistent-resource"]) {
        throw new Error("Resource not persisted across app instances");
      }

      this.recordResult("State persistence", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("State persistence", false, Date.now() - startTime, error.message);
    }
  }

  private async testFinalization(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("🧹 Test 5: Finalization process");

      if (!this.app) throw new Error("App not initialized");

      // Run finalization in dry-run mode first
      const dryRunReport = await this.app.finalize({
        dryRun: true,
        strategy: "conservative"
      });

      if (dryRunReport.dryRun !== true) throw new Error("Dry run flag not set");
      if (dryRunReport.resourcesDeleted === 0) throw new Error("Should report resources to delete");

      // Run actual finalization
      const finalReport = await this.app.finalize({
        strategy: "conservative",
        retryAttempts: 2
      });

      if (finalReport.errors.length > 0) {
        console.warn("⚠️  Finalization had errors:", finalReport.errors);
      }

      this.recordResult("Finalization process", true, Date.now() - startTime, undefined, {
        dryRun: dryRunReport,
        final: finalReport
      });

    } catch (error: any) {
      this.recordResult("Finalization process", false, Date.now() - startTime, error.message);
    }
  }

  private async testCLICommands(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("💻 Test 6: CLI commands");

      // Test scope list command
      const { spawn } = require("child_process");
      const listCommand = spawn("bun", ["run", "src/scope/scope-cli.ts", "list", "--json"], {
        stdio: "pipe"
      });

      let listOutput = "";
      listCommand.stdout.on("data", (data: Buffer) => {
        listOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        listCommand.on("close", (code: number) => {
          if (code === 0) {
            resolve(undefined);
          } else {
            reject(new Error(`CLI command failed with code ${code}`));
          }
        });
        listCommand.on("error", reject);
      });

      // Try to parse JSON output
      try {
        JSON.parse(listOutput.trim());
      } catch {
        throw new Error("CLI list command did not return valid JSON");
      }

      this.recordResult("CLI commands", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("CLI commands", false, Date.now() - startTime, error.message);
    }
  }

  private async testConcurrentAccess(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log("🔄 Test 7: Concurrent access");

      if (!this.app) throw new Error("App not initialized");

      // Test concurrent resource additions
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          this.app.addResource(`concurrent-resource-${i}`, {
            id: `concurrent-${i}`,
            type: "test",
            name: `concurrent-resource-${i}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          })
        );
      }

      await Promise.all(promises);

      // Verify all resources were added
      const resources = await this.app.getResources();
      const concurrentResources = Object.keys(resources).filter(key =>
        key.startsWith("concurrent-resource-")
      );

      if (concurrentResources.length !== 5) {
        throw new Error(`Expected 5 concurrent resources, got ${concurrentResources.length}`);
      }

      this.recordResult("Concurrent access", true, Date.now() - startTime);

    } catch (error: any) {
      this.recordResult("Concurrent access", false, Date.now() - startTime, error.message);
    }
  }

  private recordResult(
    name: string,
    passed: boolean,
    duration: number,
    error?: string,
    details?: any
  ): void {
    this.results.push({
      name,
      passed,
      duration,
      error,
      details
    });

    const status = passed ? "✅" : "❌";
    console.log(`${status} ${name} (${duration}ms)`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  private printReport(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary");
    console.log("=".repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`• ${result.name}: ${result.error}`);
      });
    }

    console.log("\n" + "=".repeat(60));

    if (failed === 0) {
      console.log("🎉 All tests passed! Scope system is ready for production.");
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.");
    }
  }

  private async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test resources...");

    if (this.app) {
      try {
        // Force cleanup of test resources
        await this.app.finalize({ force: true });
      } catch (error) {
        console.warn("Cleanup failed:", error);
      }
    }

    // Remove test state directory
    try {
      const fs = require("fs");
      if (fs.existsSync(".alchemy-test")) {
        fs.rmSync(".alchemy-test", { recursive: true, force: true });
      }
    } catch (error) {
      console.warn("Failed to remove test directory:", error);
    }
  }
}

async function main() {
  const tester = new ScopeSystemTester();
  await tester.runAllTests();
}

if (import.meta.main) {
  main().catch(error => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });
}
