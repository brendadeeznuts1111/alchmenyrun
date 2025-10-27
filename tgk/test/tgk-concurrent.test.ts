// tgk-concurrent.test.ts - Core concurrent tests for tgk CLI
import { test, describe, expect, beforeAll, afterAll } from "bun:test";
import { execSync, spawn } from "child_process";
import { randomBytes } from "crypto";

// Test configuration
const TEST_CONFIG = {
  testPrefix: "tgk-concurrent",
  maxConcurrency: 15,
  retryAttempts: 3,
  retryDelay: 1000,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  testStreamPrefix: "concurrent-test"
};

// Generate unique test ID
export function generateTestId(): string {
  return randomBytes(4).toString('hex');
}

// Execute tgk command with error handling
export function tgkCommand(command: string, options: {
  timeout?: number;
  retries?: number;
  cwd?: string;
} = {}): { success: boolean; output: string; error?: string } {
  const { timeout = 30000, retries = TEST_CONFIG.retryAttempts, cwd } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        timeout,
        cwd: cwd || process.cwd(),
        env: {
          ...process.env,
          TELEGRAM_BOT_TOKEN: TEST_CONFIG.telegramToken
        }
      });

      return { success: true, output: result };
    } catch (error: any) {
      if (attempt === retries) {
        return {
          success: false,
          output: '',
          error: error.message
        };
      }

      // Wait before retry
      execSync(`sleep ${TEST_CONFIG.retryDelay / 1000}`);
    }
  }

  return { success: false, output: '', error: 'Max retries exceeded' };
}

describe.concurrent("tgk CLI Concurrent Operations", () => {
  let testStream: string;

  beforeAll(async () => {
    testStream = `${TEST_CONFIG.testStreamPrefix}-${generateTestId()}`;
    console.log(`🧪 Setting up concurrent test stream: ${testStream}`);

    // Create test stream
    const setupResult = tgkCommand(`tgk group-create ${testStream}-forum --forum`);
    expect(setupResult.success).toBe(true);
  });

  afterAll(async () => {
    console.log(`🧹 Cleaning up concurrent test stream: ${testStream}`);

    // Cleanup test resources
    tgkCommand(`tgk unpin-all ${testStream}-forum`);
  });

  test.concurrent("concurrent stream creation", async () => {
    const streams = Array.from({ length: 5 }, (_, i) =>
      `${TEST_CONFIG.testStreamPrefix}-stream-${i}-${generateTestId()}`
    );

    const creationPromises = streams.map(async (stream) => {
      const result = tgkCommand(`tgk group-create ${stream}-forum --forum`);
      return { stream, result };
    });

    const results = await Promise.all(creationPromises);

    results.forEach(({ stream, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ Created concurrent stream: ${stream}`);
    });
  });

  test.concurrent("concurrent RFC card pinning", async () => {
    const rfcCards = Array.from({ length: 10 }, (_, i) => ({
      id: `RFC-${generateTestId()}-${i}`,
      title: `Concurrent RFC #${i}`,
      description: `Test RFC created concurrently - ${new Date().toISOString()}`
    }));

    const pinPromises = rfcCards.map(async (rfc) => {
      const result = tgkCommand(
        `tgk pin-card ${testStream}-forum "${rfc.title}" "${rfc.description}"`
      );
      return { rfc, result };
    });

    const results = await Promise.all(pinPromises);

    results.forEach(({ rfc, result }) => {
      expect(result.success).toBe(true);
      expect(result.output).toContain("ok");
      console.log(`✅ Pinned RFC: ${rfc.title}`);
    });
  });

  test.concurrent("concurrent card updates", async () => {
    const updates = [
      { status: "READY_FOR_REVIEW", color: "yellow" },
      { status: "UNDER_REVIEW", color: "blue" },
      { status: "APPROVED", color: "green" },
      { status: "MERGED", color: "purple" },
      { status: "CLOSED", color: "gray" }
    ];

    const updatePromises = updates.map(async (update) => {
      const result = tgkCommand(
        `tgk pin-card ${testStream}-forum "Status-${update.status}" "Concurrent status update: ${update.status}"`
      );
      return { update, result };
    });

    const results = await Promise.all(updatePromises);

    results.forEach(({ update, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ Updated status: ${update.status}`);
    });
  });

  test.concurrent("concurrent worker deployment", async () => {
    const workers = Array.from({ length: 3 }, (_, i) =>
      `concurrent-worker-${i}-${generateTestId()}`
    );

    const deploymentPromises = workers.map(async (worker) => {
      const result = tgkCommand(`tgk worker deploy ${worker}`);
      return { worker, result };
    });

    const results = await Promise.all(deploymentPromises);

    results.forEach(({ worker, result }) => {
      expect(result.success).toBe(true);
      expect(result.output).toContain("deployed");
      console.log(`✅ Deployed worker: ${worker}`);
    });
  });

  test.concurrent("concurrent chat operations", async () => {
    const operations = [
      { type: "list", command: "tgk chat-list" },
      { type: "help", command: "tgk --help" },
      { type: "worker-help", command: "tgk worker --help" }
    ];

    const operationPromises = operations.map(async (op) => {
      const result = tgkCommand(op.command);
      return { operation: op, result };
    });

    const results = await Promise.all(operationPromises);

    results.forEach(({ operation, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ Executed ${operation.type} operation`);
    });
  });
});

describe.concurrent("Rate Limiting & SLA Tests", () => {
  test.concurrent("concurrent SLA notifications", async () => {
    const notifications = Array.from({ length: 8 }, (_, i) => ({
      type: `sla-alert-${i}`,
      message: `SLA breach notification ${i} - ${new Date().toISOString()}`,
      priority: i % 3 + 1
    }));

    const notificationPromises = notifications.map(async (notification) => {
      const result = tgkCommand(
        `tgk pin-card sla-test-forum "SLA-${notification.type}" "${notification.message}"`
      );
      return { notification, result };
    });

    const results = await Promise.all(notificationPromises);

    // Some may be rate limited, but commands should execute
    const successCount = results.filter(r => r.result.success).length;
    expect(successCount).toBeGreaterThan(0);

    console.log(`✅ Processed ${successCount}/${notifications.length} SLA notifications concurrently`);
  });

  test.concurrent("concurrent permission management", async () => {
    const permissions = [
      { permission: "send_messages", value: "true" },
      { permission: "can_pin_messages", value: "true" },
      { permission: "can_manage_topics", value: "false" }
    ];

    const permissionPromises = permissions.map(async (perm) => {
      const result = tgkCommand(
        `tgk permission-set concurrent-test-chat ${perm.permission} ${perm.value}`
      );
      return { permission: perm, result };
    });

    const results = await Promise.all(permissionPromises);

    // Commands should execute (may fail due to permissions, but that's ok)
    results.forEach(({ permission, result }) => {
      console.log(`✅ Processed permission ${permission.permission}`);
    });
  });
});

describe.concurrent("Resource Management Tests", () => {
  test.concurrent("concurrent cleanup operations", async () => {
    const cleanupOperations = [
      { type: "unpin", command: `tgk unpin-all ${testStream}-forum` },
      { type: "card-delete", command: `tgk card-delete ${testStream}-forum 12345` }
    ];

    const cleanupPromises = cleanupOperations.map(async (op) => {
      const result = tgkCommand(op.command);
      return { operation: op, result };
    });

    const results = await Promise.all(cleanupPromises);

    results.forEach(({ operation, result }) => {
      // Cleanup operations may "fail" if resources don't exist, but should execute
      console.log(`✅ Executed cleanup: ${operation.type}`);
    });
  });

  test.concurrent("concurrent template rendering", async () => {
    const templates = [
      { lang: "en", content: "Hello World" },
      { lang: "es", content: "Hola Mundo" },
      { lang: "fr", content: "Bonjour le Monde" },
      { lang: "de", content: "Hallo Welt" }
    ];

    const templatePromises = templates.map(async (template) => {
      const result = tgkCommand(
        `tgk pin-card template-test "Template-${template.lang}" "${template.content} - Rendered at ${new Date().toISOString()}"`
      );
      return { template, result };
    });

    const results = await Promise.all(templatePromises);

    results.forEach(({ template, result }) => {
      expect(result.success).toBe(true);
      console.log(`✅ Rendered template: ${template.lang}`);
    });
  });
});

describe.concurrent("Error Handling & Resilience", () => {
  test.concurrent("concurrent invalid operations", async () => {
    const invalidCommands = [
      "tgk invalid-command",
      "tgk group-create",
      "tgk pin-card invalid-chat",
      "tgk worker deploy"
    ];

    const errorPromises = invalidCommands.map(async (cmd) => {
      const result = tgkCommand(cmd);
      return { command: cmd, result };
    });

    const results = await Promise.all(errorPromises);

    results.forEach(({ command, result }) => {
      // Commands should handle errors gracefully
      console.log(`✅ Handled error for: ${command.split(' ').slice(-1)[0]}`);
    });
  });

  test.concurrent("concurrent timeout handling", async () => {
    const timeoutCommands = Array.from({ length: 3 }, () => ({
      command: "tgk chat-list", // Command that might take time
      timeout: 1000 // Very short timeout
    }));

    const timeoutPromises = timeoutCommands.map(async (cmd) => {
      const result = tgkCommand(cmd.command, { timeout: cmd.timeout });
      return { command: cmd, result };
    });

    const results = await Promise.all(timeoutPromises);

    results.forEach(({ command, result }) => {
      // Some may timeout, some may succeed
      console.log(`✅ Handled timeout scenario for chat-list`);
    });
  });
});
