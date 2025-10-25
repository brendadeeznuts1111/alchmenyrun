import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Timeout for integration tests that deploy infrastructure
    testTimeout: 120000, // 2 minutes
    // Retry failed tests (infrastructure can be flaky)
    retry: 2,
  },
  // Resolve imports from src directory
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
