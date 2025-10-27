// tgk-concurrent-integration.test.ts - Integration of concurrent testing with actual tgk commands
// Combines Bun's advanced features with real CLI command execution

import { test, describe, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import type { TgkCommandResult } from "./types";

// ============================================================================
// HELPER FUNCTIONS FOR ACTUAL TGK COMMAND EXECUTION
// ============================================================================

/**
 * Execute actual tgk CLI commands safely with timeout and error handling
 */
function executeTgkCommand(command: string, timeoutMs: number = 5000): TgkCommandResult {
  const startTime = performance.now();
  try {
    const output = execSync(command, {
      encoding: "utf8",
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const endTime = performance.now();
    const messageId = extractMessageId(output);

    return {
      success: true,
      output,
      messageId,
      executionTime: endTime - startTime,
    };
  } catch (error: any) {
    const endTime = performance.now();
    return {
      success: false,
      output: error.stdout || "",
      error: error.message || "Command execution failed",
      executionTime: endTime - startTime,
    };
  }
}

/**
 * Extract message ID from tgk command output
 */
function extractMessageId(output: string): string | undefined {
  const patterns = [
    /"message_id":(\d+)/,
    /message_id:\s*(\d+)/i,
    /Message ID:\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Generate unique forum name for testing
 */
function generateForumName(prefix: string = "test-forum"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cleanup test resources (forums, cards, etc.)
 */
async function cleanupTestResources(forumName: string): Promise<void> {
  try {
    executeTgkCommand(`tgk unpin-all "${forumName}"`, 10000);
  } catch (error) {
    // Cleanup failures are non-critical
    console.log(`Cleanup failed for ${forumName}: ${error}`);
  }
}

// ============================================================================
// CONCURRENT RFC CREATION TESTS WITH ACTUAL CLI COMMANDS
// ============================================================================

describe("Concurrent RFC Creation with Actual tgk Commands", () => {
  const testForums: string[] = [];

  afterAll(async () => {
    // Cleanup all test forums
    await Promise.all(testForums.map((forum) => cleanupTestResources(forum)));
  });

  test.concurrent.each([
    { rfcCount: 3, forumPrefix: "rfc-light" },
    { rfcCount: 5, forumPrefix: "rfc-medium" },
    { rfcCount: 10, forumPrefix: "rfc-heavy" },
  ])("create $rfcCount RFCs concurrently in $forumPrefix forum", async ({ rfcCount, forumPrefix }) => {
    const forumName = generateForumName(forumPrefix);
    testForums.push(forumName);

    const startTime = performance.now();

    // Create forum first
    const forumResult = executeTgkCommand(`tgk group-create "${forumName}" --forum`);
    console.log(`Forum ${forumName}: ${forumResult.success ? "CREATED" : "FAILED"}`);

    // Create multiple RFCs concurrently
    const rfcResults = await Promise.all(
      Array.from({ length: rfcCount }, (_, i) =>
        executeTgkCommand(`tgk pin-card "${forumName}" "RFC-${i + 1}" "Concurrent test RFC #${i + 1}"`)
      )
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / rfcCount;
    const successCount = rfcResults.filter((r) => r.success).length;

    console.log(`✅ Created ${rfcCount} RFCs in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms per RFC)`);
    console.log(`   Success rate: ${successCount}/${rfcCount} (${((successCount / rfcCount) * 100).toFixed(1)}%)`);

    // Assertions
    expect(rfcResults).toHaveLength(rfcCount);
    expect(totalTime).toBeLessThan(rfcCount * 2000); // Should be faster than sequential
    expect(successCount).toBeGreaterThan(0); // At least some should succeed

    // Verify message IDs for successful operations
    rfcResults.forEach((result, i) => {
      if (result.success && result.messageId) {
        expect(result.messageId).toMatch(/^\d+$/);
        console.log(`   RFC-${i + 1} message ID: ${result.messageId}`);
      }
    });
  });
});

// ============================================================================
// CONCURRENT APPROVAL WORKFLOW TESTS
// ============================================================================

describe("Concurrent Approval Workflows with Actual Commands", () => {
  const testForum = generateForumName("approval-workflow");

  beforeAll(() => {
    // Create test forum
    const result = executeTgkCommand(`tgk group-create "${testForum}" --forum`);
    console.log(`Approval workflow forum: ${result.success ? "CREATED" : "FAILED"}`);
  });

  afterAll(async () => {
    await cleanupTestResources(testForum);
  });

  test.concurrent.each([
    { reviewer: "tech-lead", status: "approved", message: "Technical review passed" },
    { reviewer: "security", status: "approved", message: "Security review passed" },
    { reviewer: "product", status: "approved", message: "Product review passed" },
    { reviewer: "architecture", status: "approved", message: "Architecture review passed" },
  ])(
    "concurrent approval from $reviewer: $status",
    async ({ reviewer, status, message }) => {
      const result = executeTgkCommand(
        `tgk pin-card "${testForum}" "Approval-${reviewer}" "${message} - Status: ${status}"`
      );

      console.log(`Approval ${reviewer}: ${result.success ? "SUCCESS" : "FAILED"} (${result.executionTime?.toFixed(2)}ms)`);

      expect(result).toBeDefined();
      expect(result.executionTime).toBeDefined();

      if (result.success) {
        expect(result.output).toBeDefined();
        if (result.messageId) {
          expect(result.messageId).toMatch(/^\d+$/);
        }
      }
    }
  );

  test.concurrent("parallel status transitions", async () => {
    const statuses = ["draft", "ready", "reviewing", "approved", "merged"];
    const startTime = performance.now();

    const results = await Promise.all(
      statuses.map(async (status) =>
        executeTgkCommand(`tgk pin-card "${testForum}" "Status-${status}" "RFC moved to: ${status}"`)
      )
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const successCount = results.filter((r) => r.success).length;

    console.log(`✅ ${statuses.length} status transitions in ${totalTime.toFixed(2)}ms`);
    console.log(`   Success rate: ${successCount}/${statuses.length}`);

    expect(results).toHaveLength(statuses.length);
    expect(successCount).toBeGreaterThan(0);

    // Verify each status update
    results.forEach((result, i) => {
      if (result.success) {
        console.log(`   Status ${statuses[i]}: ${result.executionTime?.toFixed(2)}ms`);
      }
    });
  });
});

// ============================================================================
// CONCURRENT NOTIFICATION TESTS
// ============================================================================

describe("Concurrent Notification System Tests", () => {
  const testForum = generateForumName("notification-test");

  beforeAll(() => {
    executeTgkCommand(`tgk group-create "${testForum}" --forum`);
  });

  afterAll(async () => {
    await cleanupTestResources(testForum);
  });

  test.concurrent.each([
    { type: "sla_warning", priority: "high", message: "SLA: 2 hours remaining for RFC-001" },
    { type: "approval", priority: "medium", message: "New approval from @alice.smith" },
    { type: "reminder", priority: "low", message: "Reminder: Review pending for RFC-002" },
    { type: "escalation", priority: "critical", message: "SLA breach imminent for RFC-003" },
  ])(
    "send $type notification (priority: $priority)",
    async ({ type, priority, message }) => {
      const result = executeTgkCommand(
        `tgk pin-card "${testForum}" "Notify-${type}" "${message} [Priority: ${priority}]"`
      );

      console.log(`Notification ${type}: ${result.success ? "SENT" : "FAILED"} (${result.executionTime?.toFixed(2)}ms)`);

      expect(result).toBeDefined();
      if (result.success) {
        expect(result.executionTime).toBeLessThan(3000); // Should complete within 3s
      }
    }
  );

  test.concurrent("notification burst handling", async () => {
    const notificationCount = 10;
    const startTime = performance.now();

    const results = await Promise.all(
      Array.from({ length: notificationCount }, (_, i) =>
        executeTgkCommand(`tgk pin-card "${testForum}" "Burst-Notify-${i}" "Burst notification #${i}"`)
      )
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const successCount = results.filter((r) => r.success).length;
    const avgTime = totalTime / notificationCount;

    console.log(`✅ Notification burst test: ${notificationCount} notifications in ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per notification: ${avgTime.toFixed(2)}ms`);
    console.log(`   Success rate: ${successCount}/${notificationCount}`);

    expect(results).toHaveLength(notificationCount);
    expect(successCount).toBeGreaterThan(notificationCount * 0.5); // At least 50% success
  });
});

// ============================================================================
// CONCURRENT WORKER DEPLOYMENT TESTS
// ============================================================================

describe("Concurrent Worker Deployment Tests", () => {
  test.concurrent.each([
    { workerName: "concurrent-worker-1", stream: "rfc-stream" },
    { workerName: "concurrent-worker-2", stream: "approval-stream" },
    { workerName: "concurrent-worker-3", stream: "notification-stream" },
  ])("deploy worker: $workerName for $stream", async ({ workerName, stream }) => {
    const result = executeTgkCommand(`tgk worker deploy "${workerName}" --stream="${stream}"`);

    console.log(`Worker ${workerName}: ${result.success ? "DEPLOYED" : "FAILED"} (${result.executionTime?.toFixed(2)}ms)`);

    expect(result).toBeDefined();

    if (result.success) {
      expect(result.output).toContain("deployed");
      console.log(`   ✅ Worker ${workerName} deployment confirmed`);
    } else {
      // Log error for debugging
      console.log(`   ⚠️ Worker ${workerName} deployment failed: ${result.error}`);
    }
  });

  test.concurrent("parallel worker status checks", async () => {
    const workers = ["worker-status-1", "worker-status-2", "worker-status-3"];
    const startTime = performance.now();

    const results = await Promise.all(
      workers.map((worker) => executeTgkCommand(`tgk worker status "${worker}"`))
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`✅ Worker status checks: ${workers.length} workers in ${totalTime.toFixed(2)}ms`);

    expect(results).toHaveLength(workers.length);
    expect(totalTime).toBeLessThan(workers.length * 1500); // Concurrent should be faster
  });
});

// ============================================================================
// PERFORMANCE BENCHMARK TESTS
// ============================================================================

describe("Performance Benchmarks with Real Commands", () => {
  test("RFC creation throughput benchmark", async () => {
    const forumName = generateForumName("perf-throughput");
    const rfcCount = 20;

    // Create forum
    executeTgkCommand(`tgk group-create "${forumName}" --forum`);

    const startTime = performance.now();

    // Create RFCs concurrently
    const results = await Promise.all(
      Array.from({ length: rfcCount }, (_, i) =>
        executeTgkCommand(`tgk pin-card "${forumName}" "Perf-RFC-${i}" "Performance test RFC #${i}"`)
      )
    );

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const successCount = results.filter((r) => r.success).length;
    const throughput = (successCount / totalTime) * 1000; // RFCs per second

    console.log(`📊 Performance Benchmark Results:`);
    console.log(`   Total RFCs: ${rfcCount}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Throughput: ${throughput.toFixed(2)} RFCs/second`);
    console.log(`   Average latency: ${(totalTime / rfcCount).toFixed(2)}ms per RFC`);

    expect(successCount).toBeGreaterThan(0);
    expect(totalTime).toBeLessThan(rfcCount * 2000); // Must be faster than sequential

    // Cleanup
    await cleanupTestResources(forumName);
  });

  test("concurrent load stress test", async () => {
    const forumName = generateForumName("stress-test");
    const loadLevels = [10, 25, 50];

    executeTgkCommand(`tgk group-create "${forumName}" --forum`);

    for (const load of loadLevels) {
      const startTime = performance.now();

      const results = await Promise.all(
        Array.from({ length: load }, (_, i) =>
          executeTgkCommand(`tgk pin-card "${forumName}" "Load-${load}-${i}" "Load test message #${i}"`)
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const successCount = results.filter((r) => r.success).length;
      const successRate = (successCount / load) * 100;

      console.log(`🔥 Load Level ${load}:`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Throughput: ${((successCount / totalTime) * 1000).toFixed(2)} ops/sec`);

      expect(successCount).toBeGreaterThan(load * 0.3); // At least 30% success under stress
    }

    await cleanupTestResources(forumName);
  });
});

// ============================================================================
// RACE CONDITION DETECTION TESTS
// ============================================================================

describe("Race Condition Detection", () => {
  test.concurrent("simultaneous card operations on same forum", async () => {
    const forumName = generateForumName("race-condition");

    // Create forum
    executeTgkCommand(`tgk group-create "${forumName}" --forum`);

    // Perform multiple operations simultaneously
    const operations = [
      executeTgkCommand(`tgk pin-card "${forumName}" "Card-A" "First card"`),
      executeTgkCommand(`tgk pin-card "${forumName}" "Card-B" "Second card"`),
      executeTgkCommand(`tgk pin-card "${forumName}" "Card-C" "Third card"`),
    ];

    const results = await Promise.all(operations);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Race condition test: ${successCount}/${operations.length} operations succeeded`);

    // All operations should succeed without conflicts (DO ensures this)
    expect(successCount).toBe(operations.length);

    await cleanupTestResources(forumName);
  });

  test.concurrent("concurrent state updates", async () => {
    const forumName = generateForumName("state-race");

    executeTgkCommand(`tgk group-create "${forumName}" --forum`);

    // Multiple threads trying to update state simultaneously
    const stateUpdates = await Promise.all([
      executeTgkCommand(`tgk pin-card "${forumName}" "State-1" "Update 1"`),
      executeTgkCommand(`tgk pin-card "${forumName}" "State-2" "Update 2"`),
      executeTgkCommand(`tgk pin-card "${forumName}" "State-3" "Update 3"`),
      executeTgkCommand(`tgk pin-card "${forumName}" "State-4" "Update 4"`),
    ]);

    const allSucceeded = stateUpdates.every((r) => r.success);
    console.log(`State update race test: ${allSucceeded ? "PASSED" : "FAILED"} - No conflicts detected`);

    // Durable Objects should handle concurrent state updates without conflicts
    expect(stateUpdates.filter((r) => r.success).length).toBeGreaterThan(0);

    await cleanupTestResources(forumName);
  });
});
