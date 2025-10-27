import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ApplicationScope, StageScope, NestedScope } from "../../scope";
import { rmSync, existsSync } from "fs";
import { join } from "path";

/**
 * Test utilities for scope isolation
 */
class TestScopeManager {
  private testDir = ".alchemy-test";

  constructor() {
    // Clean up before each test
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
      enableLocking: true
    });
  }

  createStage(appName: string, stageName: string): StageScope {
    return new StageScope({
      appName,
      stageName,
      stateDir: this.testDir,
      enableLocking: true
    });
  }

  createNested(parentPath: string, scopeName: string): NestedScope {
    return new NestedScope({
      parentScopePath: parentPath,
      scopeName,
      stateDir: this.testDir,
      enableLocking: true
    });
  }
}

describe("Scope Isolation", () => {
  let scopeManager: TestScopeManager;

  beforeEach(() => {
    scopeManager = new TestScopeManager();
  });

  afterEach(() => {
    scopeManager.cleanup();
  });

  it("should isolate resources between different applications", async () => {
    const app1 = scopeManager.createApp("app1", "test");
    const app2 = scopeManager.createApp("app2", "test");

    await app1.initialize();
    await app2.initialize();

    // Add resources to each app
    await app1.addResource("resource1", { type: "test", name: "resource1" });
    await app2.addResource("resource2", { type: "test", name: "resource2" });

    // Verify isolation
    const app1Resources = await app1.getResources();
    const app2Resources = await app2.getResources();

    expect(Object.keys(app1Resources)).toContain("resource1");
    expect(Object.keys(app1Resources)).not.toContain("resource2");
    expect(Object.keys(app2Resources)).toContain("resource2");
    expect(Object.keys(app2Resources)).not.toContain("resource1");
  });

  it("should isolate resources between different stages", async () => {
    const stage1 = scopeManager.createStage("my-app", "dev");
    const stage2 = scopeManager.createStage("my-app", "prod");

    await stage1.initialize();
    await stage2.initialize();

    // Add resources to each stage
    await stage1.addResource("worker-dev", { type: "worker", name: "dev-worker" });
    await stage2.addResource("worker-prod", { type: "worker", name: "prod-worker" });

    // Verify isolation
    const stage1Resources = await stage1.getResources();
    const stage2Resources = await stage2.getResources();

    expect(Object.keys(stage1Resources)).toContain("worker-dev");
    expect(Object.keys(stage1Resources)).not.toContain("worker-prod");
    expect(Object.keys(stage2Resources)).toContain("worker-prod");
    expect(Object.keys(stage2Resources)).not.toContain("worker-dev");
  });

  it("should isolate nested scopes within the same stage", async () => {
    const stage = scopeManager.createStage("my-app", "test");
    await stage.initialize();

    const nested1 = scopeManager.createNested("my-app/test", "backend");
    const nested2 = scopeManager.createNested("my-app/test", "frontend");

    await nested1.initialize();
    await nested2.initialize();

    // Register nested scopes with parent
    await stage.registerNestedScope("backend");
    await stage.registerNestedScope("frontend");

    // Add resources to each nested scope
    await nested1.addResource("api", { type: "worker", name: "api-worker" });
    await nested2.addResource("web", { type: "worker", name: "web-worker" });

    // Verify isolation
    const nested1Resources = await nested1.getResources();
    const nested2Resources = await nested2.getResources();

    expect(Object.keys(nested1Resources)).toContain("api");
    expect(Object.keys(nested1Resources)).not.toContain("web");
    expect(Object.keys(nested2Resources)).toContain("web");
    expect(Object.keys(nested2Resources)).not.toContain("api");

    // Verify parent knows about nested scopes
    const nestedScopes = await stage.getNestedScopes();
    expect(nestedScopes).toContain("backend");
    expect(nestedScopes).toContain("frontend");
  });

  it("should maintain state file separation", async () => {
    const app1 = scopeManager.createApp("app1", "stage1");
    const app2 = scopeManager.createApp("app2", "stage1");
    const app1Stage2 = scopeManager.createApp("app1", "stage2");

    await app1.initialize();
    await app2.initialize();
    await app1Stage2.initialize();

    // Add resources
    await app1.addResource("r1", { type: "test" });
    await app2.addResource("r2", { type: "test" });
    await app1Stage2.addResource("r3", { type: "test" });

    // Verify state files exist separately
    const testDir = scopeManager.getTestDir();
    expect(existsSync(join(testDir, "app1/stage1/state.json"))).toBe(true);
    expect(existsSync(join(testDir, "app2/stage1/state.json"))).toBe(true);
    expect(existsSync(join(testDir, "app1/stage2/state.json"))).toBe(true);

    // Verify different directories
    expect(existsSync(join(testDir, "app1/stage1/state.json"))).toBe(true);
    expect(existsSync(join(testDir, "app1/stage2/state.json"))).toBe(true);
    expect(existsSync(join(testDir, "app2/stage1/state.json"))).toBe(true);
  });

  it("should prevent cross-scope resource access", async () => {
    const stage1 = scopeManager.createStage("my-app", "stage1");
    const stage2 = scopeManager.createStage("my-app", "stage2");

    await stage1.initialize();
    await stage2.initialize();

    // Add resource to stage1
    await stage1.addResource("shared-resource", { type: "test", name: "shared" });

    // Verify stage2 cannot see stage1's resources
    const stage2Resources = await stage2.getResources();
    expect(Object.keys(stage2Resources)).not.toContain("shared-resource");

    // Verify stage1 has the resource
    const stage1Resources = await stage1.getResources();
    expect(Object.keys(stage1Resources)).toContain("shared-resource");
  });

  it("should support nested scope hierarchies", async () => {
    const stage = scopeManager.createStage("my-app", "test");
    await stage.initialize();

    // Create nested scopes
    const backend = scopeManager.createNested("my-app/test", "backend");
    const api = scopeManager.createNested("my-app/test/backend", "api");
    const auth = scopeManager.createNested("my-app/test/backend", "auth");

    await backend.initialize();
    await api.initialize();
    await auth.initialize();

    // Register nested scopes
    await stage.registerNestedScope("backend");
    await backend.registerNestedScope("api");
    await backend.registerNestedScope("auth");

    // Add resources at different levels
    await stage.addResource("global", { type: "config" });
    await backend.addResource("database", { type: "d1" });
    await api.addResource("endpoint", { type: "worker" });
    await auth.addResource("token", { type: "kv" });

    // Verify hierarchy
    expect(Object.keys(await stage.getResources())).toContain("global");
    expect(Object.keys(await backend.getResources())).toContain("database");
    expect(Object.keys(await api.getResources())).toContain("endpoint");
    expect(Object.keys(await auth.getResources())).toContain("token");

    // Verify nested scope registration
    expect(await stage.getNestedScopes()).toContain("backend");
    expect(await backend.getNestedScopes()).toEqual(expect.arrayContaining(["api", "auth"]));
  });
});
