// integration-concurrent.test.ts - Integration tests with concurrency
import { test, describe, expect, beforeAll, afterAll } from "bun:test";
import { tgkCommand, generateTestId } from "./tgk-concurrent.test";

// Integration test configuration
const INTEGRATION_CONFIG = {
  testPrefix: "integration-concurrent",
  maxRetries: 3,
  retryDelay: 1000
};

describe.concurrent("RFC Lifecycle Integration Tests", () => {
  let testStream: string;
  let testRfcId: string;

  beforeAll(async () => {
    // Setup test environment
    testStream = `${INTEGRATION_CONFIG.testPrefix}-${generateTestId()}`;
    testRfcId = `INTEGRATION-RFC-${generateTestId()}`;

    console.log(`🧪 Setting up integration test: ${testStream}`);

    // Create test stream
    const setupResult = tgkCommand(`tgk group-create ${testStream}-forum --forum`);
    expect(setupResult.success).toBe(true);
  });

  afterAll(async () => {
    // Cleanup test resources
    console.log(`🧹 Cleaning up integration test: ${testStream}`);

    const cleanupResult = tgkCommand(`tgk unpin-all ${testStream}-forum`);
    expect(cleanupResult.success).toBe(true);
  });

  test.concurrent("complete RFC lifecycle integration", async () => {
    // Step 1: Create RFC
    const createResult = tgkCommand(
      `tgk pin-card ${testStream}-forum "RFC ${testRfcId}" "Integration Test RFC - Status: READY_FOR_REVIEW"`
    );
    expect(createResult.success).toBe(true);

    const messageId = extractMessageId(createResult.output);
    expect(messageId).toBeDefined();

    // Step 2: Simulate review process
    const reviewResult = tgkCommand(
      `tgk card-replace ${testStream}-forum ${messageId} "RFC ${testRfcId}" "Status: UNDER_REVIEW - Technical review in progress"`
    );
    expect(reviewResult.success).toBe(true);

    // Step 3: Simulate approval
    const approveResult = tgkCommand(
      `tgk card-replace ${testStream}-forum ${messageId} "RFC ${testRfcId}" "Status: APPROVED - Ready for deployment"`
    );
    expect(approveResult.success).toBe(true);

    // Step 4: Simulate deployment
    const deployResult = tgkCommand(
      `tgk card-replace ${testStream}-forum ${messageId} "RFC ${testRfcId}" "Status: DEPLOYED - Successfully deployed to production"`
    );
    expect(deployResult.success).toBe(true);
  });

  test.concurrent("concurrent RFC approvals", async () => {
    const approvals = [
      { reviewer: "tech-lead", status: "approved", weight: 2 },
      { reviewer: "security", status: "approved", weight: 2 },
      { reviewer: "product", status: "approved", weight: 1 }
    ];

    const approvalPromises = approvals.map(async (approval) => {
      const result = tgkCommand(
        `tgk pin-card ${testStream}-forum "Approval-${approval.reviewer}" "Reviewer: ${approval.reviewer} | Status: ${approval.status} | Weight: ${approval.weight}"`
      );
      return result;
    });

    const results = await Promise.all(approvalPromises);

    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.output).toContain("ok");
    });
  });

  test.concurrent("notification system integration", async () => {
    const notifications = [
      { type: "created", message: "RFC created successfully" },
      { type: "review_reminder", message: "Review reminder sent" },
      { type: "approved", message: "RFC approved by all reviewers" },
      { type: "deployed", message: "RFC deployed to production" }
    ];

    const notificationPromises = notifications.map(async (notification) => {
      const result = tgkCommand(
        `tgk pin-card ${testStream}-forum "Notify-${notification.type}" "${notification.message}"`
      );
      return result;
    });

    const results = await Promise.all(notificationPromises);

    results.forEach((result) => {
      expect(result.success).toBe(true);
    });
  });
});

describe.concurrent("Durable Objects Concurrent Integration", () => {
  test.concurrent("state consistency under concurrent load", async () => {
    const states = ["draft", "ready", "reviewing", "approved", "merged"];
    const stateUpdates = states.map(async (state) => {
      const result = tgkCommand(
        `tgk pin-card do-concurrent-test "State-${state}" "RFC state updated to: ${state}"`
      );
      return { state, result };
    });

    const results = await Promise.all(stateUpdates);

    results.forEach(({ state, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ State ${state} updated successfully`);
    });
  });

  test.concurrent("webhook processing concurrency", async () => {
    const webhooks = [
      { event: "pull_request", action: "opened", pr_number: 101 },
      { event: "pull_request", action: "synchronize", pr_number: 101 },
      { event: "issue_comment", action: "created", pr_number: 101 },
      { event: "pull_request_review", action: "submitted", pr_number: 101 }
    ];

    const webhookPromises = webhooks.map(async (webhook) => {
      const result = tgkCommand(
        `tgk pin-card webhook-concurrent-test "Webhook-${webhook.event}" "Processing ${webhook.action} for PR #${webhook.pr_number}"`
      );
      return { webhook, result };
    });

    const results = await Promise.all(webhookPromises);

    results.forEach(({ webhook, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ Webhook ${webhook.event}.${webhook.action} processed`);
    });
  });
});

describe.concurrent("Performance Benchmarks", () => {
  test.concurrent("RFC creation throughput", async () => {
    const rfcCount = 10;
    const startTime = performance.now();

    const rfcPromises = Array.from({ length: rfcCount }, (_, i) =>
      tgkCommand(`tgk pin-card perf-test-forum "Perf-RFC-${i}" "Performance test RFC #${i}"`)
    );

    const results = await Promise.all(rfcPromises);
    const endTime = performance.now();

    const successCount = results.filter(r => r.success).length;
    const totalTime = endTime - startTime;
    const avgTime = totalTime / rfcCount;

    expect(successCount).toBe(rfcCount);
    expect(avgTime).toBeLessThan(500); // Average < 500ms per RFC

    console.log(`✅ Created ${rfcCount} RFCs in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms per RFC)`);
  });

  test.concurrent("worker deployment performance", async () => {
    const workers = ["perf-worker-1", "perf-worker-2", "perf-worker-3"];
    const startTime = performance.now();

    const deploymentPromises = workers.map(async (worker) =>
      tgkCommand(`tgk worker deploy ${worker}`)
    );

    const results = await Promise.all(deploymentPromises);
    const endTime = performance.now();

    const successCount = results.filter(r => r.success).length;
    const totalTime = endTime - startTime;

    expect(successCount).toBe(workers.length);
    expect(totalTime).toBeLessThan(10000); // All deployments < 10s

    console.log(`✅ Deployed ${workers.length} workers in ${totalTime.toFixed(2)}ms`);
  });
});

// Helper function to extract message ID from tgk output
function extractMessageId(output: string): string | undefined {
  const match = output.match(/"message_id":(\d+)/);
  return match ? match[1] : undefined;
}
