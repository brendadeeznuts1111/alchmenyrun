// Test utilities for Alchemy integration tests

// Generate a unique prefix for test resources to avoid conflicts
// Uses branch name or timestamp for isolation
export const BRANCH_PREFIX = process.env.GITHUB_HEAD_REF?.replace(/[^a-zA-Z0-9]/g, '-') ||
                           process.env.BRANCH_NAME?.replace(/[^a-zA-Z0-9]/g, '-') ||
                           `test-${Date.now()}`;

// Helper function to wait for a condition with timeout
export async function waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000, interval = 100): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// Helper to generate unique test IDs
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
