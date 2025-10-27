import { Scope } from "./src/scope/interfaces.ts";

console.log("Scope imported successfully:", typeof Scope);

// Test creating a simple object that implements Scope
const testScope: Scope = {
  id: "test",
  name: "test",
  path: "test",
  parent: null,
  children: new Map(),
  type: "test",
  createdAt: Date.now(),
  stateManager: {},
  addChild: () => {},
  removeChild: () => {},
  getChild: () => undefined,
  hasChild: () => false,
  getDescendants: () => [],
  finalize: async () => ({ scope: testScope, created: [], updated: [], destroyed: [], errors: [], duration: 0, success: true }),
  getMetadata: () => ({ id: "test", name: "test", path: "test", type: "test", createdAt: Date.now(), childrenCount: 0, resourceCount: 0, statePath: "" })
};

console.log("Test scope created successfully");
