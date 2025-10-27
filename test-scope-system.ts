#!/usr/bin/env bun
/**
 * Simple test script to demonstrate the Alchemy Scope System
 */

import { alchemy } from "./src/scope/scope-manager";

async function testScopeSystem() {
  console.log("🧪 Testing Alchemy Scope System...\n");

  try {
    // Create a simple application scope
    console.log("📦 Creating application scope...");
    const app = await alchemy("test-app");
    console.log(`✅ Created scope: ${app.path}, type: ${app.type}`);

    // Register some test resources
    app.registerResource("test-db");
    app.registerResource("test-worker");
    console.log(`✅ Registered resources: ${app.getCurrentResources().join(', ')}`);

    // Finalize to create state files
    console.log("\n🔄 Finalizing scope...");
    const report = await app.finalize();
    console.log("✅ Scope finalized");
    console.log(`   - Scope Path: ${report.scopePath}`);
    console.log(`   - Resources Deleted: ${report.resourcesDeleted}`);
    console.log(`   - Resources Failed: ${report.resourcesFailed}`);
    console.log(`   - Nested Scopes Processed: ${report.nestedScopesProcessed}`);
    console.log(`   - Duration: ${report.duration}ms`);
    console.log(`   - Errors: ${report.errors.length}`);

    console.log("\n🎉 Scope system test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test
testScopeSystem().catch(console.error);
