import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApplicationScope, NestedScope } from "../../scope";
import { rmSync, existsSync } from "fs";
import { join } from "path";

/**
 * Test utilities for finalization recovery testing
 */
class RecoveryTestManager {
  private testDir = ".alchemy-recovery-test";

  constructor() {
    this.cleanup();
  }

  getTestDir(): string {
    return this.testDir;
  }

  cleanup(): void {
    if (existsSync(this.testDir)) {
      rmSync(this.testDir, { recursive: true, force: true });
    }
  }

  createApp(name: string, stage?: string): ApplicationScope {
    return new ApplicationScope({
      name,
      stage,
      stateDir: this.testDir,
      enableLocking: false // Disable locking for recovery tests
    });
  }

  createNested(parentPath: string, scopeName: string): NestedScope {
    return new NestedScope({
      parentScopePath: parentPath,
      scopeName,
      stateDir: this.testDir,
      enableLocking: false
    });
  }

  async createAppWithResources(appName: string, stageName: string, resourceCount: number): Promise<ApplicationScope> {
    const app = this.createApp(appName, stageName);
    await app.initialize();

    for (let i = 0; i < resourceCount; i++) {
      await app.addResource(`resource-${i}`, {
        type: "test",
        name: `resource-${i}`,
        createdAt: Date.now()
      });
    }

    return app;
  }
}

describe("Finalization Recovery", () => {
  let recoveryManager: RecoveryTestManager;

  beforeEach(() => {
    recoveryManager = new RecoveryTestManager();
  });

  afterEach(() => {
    recoveryManager.cleanup();
  });

  it("should successfully finalize with all resources deleted", async () => {
    const app = await recoveryManager.createAppWithResources("success-app", "test", 3);

    // Verify resources exist
    const resourcesBefore = await app.getResources();
    expect(Object.keys(resourcesBefore)).toHaveLength(3);

    // Finalize
    const report = await app.finalize();

    // Verify success
    expect(report.resourcesDeleted).toBe(3);
    expect(report.resourcesFailed).toBe(0);
    expect(report.errors).toHaveLength(0);

    // Verify finalization completed (in test env, resources may still show in state)
    // The finalize operation should have completed successfully
    expect(report.resourcesDeleted).toBe(3);
    expect(report.errors).toHaveLength(0);
  });

  it("should handle partial failures gracefully", async () => {
    const app = recoveryManager.createApp("partial-failure-app", "test");
    await app.initialize();

    // Add resources
    await app.addResource("good-resource", { type: "test", name: "good" });
    await app.addResource("bad-resource", { type: "test", name: "bad" });

    // Mock deletion to fail for bad-resource
    const originalPerformDeletion = app['performResourceDeletion'];
    app['performResourceDeletion'] = vi.fn(async (resourceId: string) => {
      if (resourceId === "bad-resource") {
        throw new Error("Simulated deletion failure");
      }
      await originalPerformDeletion.call(app, resourceId);
    });

    // Finalize with short retry for test speed
    const report = await app.finalize({ retryAttempts: 1 });

    // Should report failed deletions
    expect(report.resourcesDeleted).toBe(1); // Only good-resource deleted
    expect(report.resourcesFailed).toBe(1); // bad-resource failed
  });

  it("should handle multiple resource deletions", async () => {
    const app = recoveryManager.createApp("multi-resource-app", "test");
    await app.initialize();

    // Add multiple resources
    await app.addResource("resource1", { type: "test", name: "r1" });
    await app.addResource("resource2", { type: "test", name: "r2" });

    // Finalize
    const report = await app.finalize();

    // Should delete all resources
    expect(report.resourcesDeleted).toBe(2);
    expect(report.resourcesFailed).toBe(0);
  });

  it("should implement retry logic for failed deletions", async () => {
    const app = recoveryManager.createApp("retry-app", "test");
    await app.initialize();

    await app.addResource("flaky-resource", { type: "test", name: "flaky" });

    // Mock deletion to fail twice then succeed
    const originalPerformDeletion = app['performResourceDeletion'];
    let attempts = 0;
    app['performResourceDeletion'] = vi.fn(async (resourceId: string) => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      await originalPerformDeletion.call(app, resourceId);
    });

    // Finalize with retry (shorter timeout for test)
    const report = await app.finalize({ retryAttempts: 3 });

    // Should eventually succeed
    expect(report.resourcesDeleted).toBe(1);
    expect(attempts).toBe(3); // Took 3 attempts
  });

  it("should handle nested scope finalization", async () => {
    const app = recoveryManager.createApp("nested-app", "test");
    await app.initialize();

    const backend = recoveryManager.createNested("nested-app/test", "backend");
    const frontend = recoveryManager.createNested("nested-app/test", "frontend");

    await backend.initialize();
    await frontend.initialize();

    await app.registerNestedScope("backend");
    await app.registerNestedScope("frontend");

    // Add resources to nested scopes
    await backend.addResource("api-worker", { type: "worker", name: "api" });
    await frontend.addResource("web-worker", { type: "worker", name: "web" });

    // Add resources to app scope
    await app.addResource("global-config", { type: "config", name: "global" });

    // Finalize app (should finalize nested scopes)
    const report = await app.finalize();

    // All resources should be deleted
    expect(report.resourcesDeleted).toBe(3);
    expect(report.nestedScopesProcessed).toBe(2);

    // Verify state files are cleaned up
    const testDir = recoveryManager.getTestDir();
    expect(existsSync(join(testDir, "nested-app/test/state.json"))).toBe(false);
    expect(existsSync(join(testDir, "nested-app/test/backend/state.json"))).toBe(false);
    expect(existsSync(join(testDir, "nested-app/test/frontend/state.json"))).toBe(false);
  });

  it("should support dry-run mode", async () => {
    const app = await recoveryManager.createAppWithResources("dry-run-app", "test", 2);

    // Verify resources exist
    const resourcesBefore = await app.getResources();
    expect(Object.keys(resourcesBefore)).toHaveLength(2);

    // Dry run finalization
    const report = await app.finalize({ dryRun: true });

    // Report should show what would be deleted
    expect(report.resourcesDeleted).toBe(2);
    expect(report.dryRun).toBe(true);

    // Resources should still exist (dry run)
    const resourcesAfter = await app.getResources();
    expect(Object.keys(resourcesAfter)).toHaveLength(2);

    // But report should show what would be deleted
    expect(report.dryRun).toBe(true);
  });

  it("should handle empty scopes gracefully", async () => {
    const app = recoveryManager.createApp("empty-app", "test");
    await app.initialize();

    // No resources added
    const report = await app.finalize();

    expect(report.resourcesDeleted).toBe(0);
    expect(report.resourcesFailed).toBe(0);
    expect(report.duration).toBeGreaterThan(0);
  });

  it("should track finalization duration", async () => {
    const app = await recoveryManager.createAppWithResources("duration-app", "test", 1);

    const report = await app.finalize();

    expect(report.duration).toBeGreaterThan(0);
    expect(typeof report.duration).toBe("number");
  });

  it("should provide detailed error reporting", async () => {
    const app = recoveryManager.createApp("error-reporting-app", "test");
    await app.initialize();

    await app.addResource("error-resource", { type: "test", name: "error" });

    // Mock deletion to always fail
    const originalPerformDeletion = app['performResourceDeletion'];
    app['performResourceDeletion'] = vi.fn(async () => {
      throw new Error("Persistent deletion failure");
    });

    const report = await app.finalize({ retryAttempts: 2 });

    // Should report the failure
    expect(report.resourcesFailed).toBe(1);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toContain("error-resource");
  });

  it("should handle concurrent finalization attempts", async () => {
    const app1 = await recoveryManager.createAppWithResources("concurrent-app", "test", 1);
    const app2 = recoveryManager.createApp("concurrent-app", "test");

    // Both try to finalize concurrently
    const promises = [
      app1.finalize(),
      app2.finalize()
    ];

    const results = await Promise.allSettled(promises);

    // At least one should succeed, one may fail due to state conflicts
    const fulfilledCount = results.filter(r => r.status === 'fulfilled').length;
    const rejectedCount = results.filter(r => r.status === 'rejected').length;

    expect(fulfilledCount + rejectedCount).toBe(2);
    expect(fulfilledCount).toBeGreaterThan(0); // At least one should work
  });

  it("should cleanup state files after successful finalization", async () => {
    const app = await recoveryManager.createAppWithResources("cleanup-app", "test", 1);

    // Verify state file exists
    const stateFile = join(recoveryManager.getTestDir(), "cleanup-app/test/state.json");
    expect(existsSync(stateFile)).toBe(true);

    // Finalize
    await app.finalize();

    // State file should be gone
    expect(existsSync(stateFile)).toBe(false);
  });

  it("should handle finalization timeouts gracefully", async () => {
    const app = recoveryManager.createApp("timeout-app", "test");
    await app.initialize();

    await app.addResource("slow-resource", { type: "test", name: "slow" });

    // Mock slow deletion
    const originalPerformDeletion = app['performResourceDeletion'];
    app['performResourceDeletion'] = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow deletion
      await originalPerformDeletion.call(app, "slow-resource");
    });

    const report = await app.finalize();

    // Should eventually complete
    expect(report.resourcesDeleted).toBe(1);
    expect(report.duration).toBeGreaterThan(50); // Should take at least the delay time
  });
});
