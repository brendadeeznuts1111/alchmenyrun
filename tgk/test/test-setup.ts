// test-setup.ts - Setup file for Bun concurrent tests
import { beforeAll, afterAll } from "bun:test";

// Global test configuration
globalThis.TEST_CONFIG = {
  stage: process.env.TGK_STAGE || "test-do-006",
  profile: process.env.TGK_PROFILE || "ci",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  concurrent: process.env.BUN_TEST_CONCURRENT === "true",
  maxConcurrency: 15,
  randomize: true
};

// Setup before all tests
beforeAll(() => {
  console.log("🧪 Setting up tgk concurrent test environment");
  console.log(`📊 Stage: ${globalThis.TEST_CONFIG.stage}`);
  console.log(`👥 Profile: ${globalThis.TEST_CONFIG.profile}`);
  console.log(`🔄 Concurrent: ${globalThis.TEST_CONFIG.concurrent}`);
  console.log(`⚡ Max Concurrency: ${globalThis.TEST_CONFIG.maxConcurrency}`);
  console.log(`🎲 Randomize: ${globalThis.TEST_CONFIG.randomize}`);

  if (!globalThis.TEST_CONFIG.telegramToken) {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN not set - some tests may be skipped");
  }

  // Set up global error handlers for tests
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });
});

// Cleanup after all tests
afterAll(() => {
  console.log("🧹 Cleaning up tgk concurrent test environment");

  // Any global cleanup can go here
  // Note: Individual test cleanup is handled in afterAll blocks
});

// Helper functions for tests
globalThis.generateTestId = () => {
  return Math.random().toString(36).substring(2, 15);
};

globalThis.sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

globalThis.retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts) throw error;
      await globalThis.sleep(delay);
    }
  }
  throw new Error('Retry function should not reach here');
};

// Export types for TypeScript
declare global {
  var TEST_CONFIG: {
    stage: string;
    profile: string;
    telegramToken?: string;
    concurrent: boolean;
    maxConcurrency: number;
    randomize: boolean;
  };

  function generateTestId(): string;
  function sleep(ms: number): Promise<void>;
  function retry<T>(
    fn: () => Promise<T>,
    attempts?: number,
    delay?: number
  ): Promise<T>;
}
