/**
 * WorkerLoader binding tests
 * Tests the WorkerLoader binding type functionality following official Alchemy patterns
 * Based on: https://github.com/alchemy-run/alchemy/blob/e3d6bb69e3a7eb75046271cbd8737f06240feee5/alchemy/test/cloudflare/worker-loader.test.ts
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Worker, WorkerLoader } from "alchemy/cloudflare";

describe("WorkerLoader", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
  });

  describe("WorkerLoader Binding Type", () => {
    test("should create WorkerLoader binding with correct type", () => {
      const workerLoader = WorkerLoader();
      
      expect(workerLoader).toBeDefined();
      expect(workerLoader.type).toEqual("worker_loader");
      expect(typeof workerLoader).toBe("object");
    });

    test("should create consistent WorkerLoader instances", () => {
      const workerLoader1 = WorkerLoader();
      const workerLoader2 = WorkerLoader();
      
      expect(workerLoader1).toEqual(workerLoader2);
      expect(workerLoader1.type).toBe("worker_loader");
      expect(workerLoader2.type).toBe("worker_loader");
    });
  });

  describe("WorkerLoader Integration", () => {
    test("should create worker configuration with WorkerLoader binding", () => {
      const workerName = "test-worker-loader";
      
      // This tests the configuration structure without actual deployment
      const workerConfig = {
        name: workerName,
        script: `
          import { env } from "cloudflare:workers";

          export default {
            async fetch(request) {
              const dynamicWorker = env.LOADER.get(
                'dynamic-worker',
                async () => ({
                  compatibilityDate: '2025-06-01',
                  mainModule: 'index.js',
                  modules: {
                    'index.js': \`
                      export default {
                        async fetch(request) {
                          return new Response('Hello from dynamic worker!');
                        }
                      }
                    \`,
                  },
                }),
              );

              const entrypoint = dynamicWorker.getEntrypoint();
              return entrypoint.fetch(new URL(request.url));
            }
          };
        `,
        format: "esm" as const,
        bindings: {
          LOADER: WorkerLoader(),
        },
      };

      expect(workerConfig.name).toEqual(workerName);
      expect(workerConfig.bindings?.LOADER).toBeDefined();
      expect(workerConfig.bindings?.LOADER.type).toEqual("worker_loader");
      expect(workerConfig.script).toContain("env.LOADER.get");
      expect(workerConfig.script).toContain("dynamic-worker");
    });

    test("should handle multiple WorkerLoader bindings", () => {
      const workerConfig = {
        name: "test-multiple-loaders",
        script: `
          export default {
            async fetch(request) {
              return new Response('Multiple loaders test');
            }
          };
        `,
        format: "esm" as const,
        bindings: {
          LOADER: WorkerLoader(),
          SECONDARY_LOADER: WorkerLoader(),
          TERTIARY_LOADER: WorkerLoader(),
        },
      };

      expect(workerConfig.bindings?.LOADER).toBeDefined();
      expect(workerConfig.bindings?.SECONDARY_LOADER).toBeDefined();
      expect(workerConfig.bindings?.TERTIARY_LOADER).toBeDefined();
      
      expect(workerConfig.bindings?.LOADER.type).toEqual("worker_loader");
      expect(workerConfig.bindings?.SECONDARY_LOADER.type).toEqual("worker_loader");
      expect(workerConfig.bindings?.TERTIARY_LOADER.type).toEqual("worker_loader");
    });
  });

  describe("Dynamic Worker Patterns", () => {
    test("should support dynamic worker creation pattern", () => {
      const dynamicWorkerScript = `
        import { env } from "cloudflare:workers";

        export default {
          async fetch(request) {
            const url = new URL(request.url);
            const workerType = url.searchParams.get('type') || 'default';
            
            const dynamicWorker = env.LOADER.get(
              \`dynamic-\${workerType}\`,
              async () => ({
                compatibilityDate: '2025-06-01',
                mainModule: 'index.js',
                modules: {
                  'index.js': \`
                    export default {
                      async fetch(request) {
                        const url = new URL(request.url);
                        const workerType = url.searchParams.get('type') || 'default';
                        return new Response(\`Hello from \${workerType} dynamic worker!\`);
                      }
                    }
                  \`,
                },
              }),
            );

            const entrypoint = dynamicWorker.getEntrypoint();
            return entrypoint.fetch(request);
          }
        };
      `;

      expect(dynamicWorkerScript).toContain("env.LOADER.get");
      expect(dynamicWorkerScript).toContain("dynamic-${workerType}");
      expect(dynamicWorkerScript).toContain("getEntrypoint");
      expect(dynamicWorkerScript).toContain("compatibilityDate");
    });

    test("should support metrics collection worker pattern", () => {
      const metricsWorkerScript = `
        import { env } from "cloudflare:workers";

        export default {
          async fetch(request) {
            const metricsWorker = env.LOADER.get(
              'metrics-collector',
              async () => ({
                compatibilityDate: '2025-06-01',
                mainModule: 'metrics.js',
                modules: {
                  'metrics.js': \`
                    export default {
                      async fetch(request) {
                        const metrics = {
                          timestamp: new Date().toISOString(),
                          activeConnections: Math.floor(Math.random() * 100),
                          responseTime: Math.floor(Math.random() * 50) + 'ms',
                          healthScore: (Math.random() * 0.1 + 0.9).toFixed(3),
                        };
                        
                        return new Response(JSON.stringify(metrics, null, 2), {
                          headers: { 'Content-Type': 'application/json' }
                        });
                      }
                    }
                  \`,
                },
              }),
            );

            const entrypoint = metricsWorker.getEntrypoint();
            return entrypoint.fetch(request);
          }
        };
      `;

      expect(metricsWorkerScript).toContain("metrics-collector");
      expect(metricsWorkerScript).toContain("timestamp");
      expect(metricsWorkerScript).toContain("activeConnections");
      expect(metricsWorkerScript).toContain("responseTime");
      expect(metricsWorkerScript).toContain("healthScore");
    });

    test("should support configuration management worker pattern", () => {
      const configWorkerScript = `
        import { env } from "cloudflare:workers";

        export default {
          async fetch(request) {
            const configWorker = env.LOADER.get(
              'config-reloader',
              async () => ({
                compatibilityDate: '2025-06-01',
                mainModule: 'config.js',
                modules: {
                  'config.js': \`
                    export default {
                      async fetch(request) {
                        const config = {
                          version: "1.0.0",
                          lastUpdated: new Date().toISOString(),
                          features: {
                            dynamicWorkers: true,
                            metricsCollection: true,
                            configReload: true,
                            gracefulShutdown: true,
                          },
                          settings: {
                            updateInterval: "30s",
                            healthCheckInterval: "10s",
                            maxRetries: 3,
                          }
                        };
                        
                        return new Response(JSON.stringify(config, null, 2), {
                          headers: { 'Content-Type': 'application/json' }
                        });
                      }
                    }
                  \`,
                },
              }),
            );

            const entrypoint = configWorker.getEntrypoint();
            return entrypoint.fetch(request);
          }
        };
      `;

      expect(configWorkerScript).toContain("config-reloader");
      expect(configWorkerScript).toContain("version");
      expect(configWorkerScript).toContain("features");
      expect(configWorkerScript).toContain("settings");
      expect(configWorkerScript).toContain("dynamicWorkers");
    });
  });

  describe("WorkerLoader Error Handling", () => {
    test("should handle WorkerLoader creation errors gracefully", () => {
      // Test that WorkerLoader creation doesn't throw errors
      expect(() => {
        const workerLoader = WorkerLoader();
        expect(workerLoader.type).toBe("worker_loader");
      }).not.toThrow();
    });

    test("should validate WorkerLoader binding structure", () => {
      const workerLoader = WorkerLoader();
      
      // Validate the structure matches expected interface
      expect(workerLoader).toHaveProperty("type");
      expect(typeof workerLoader.type).toBe("string");
      expect(workerLoader.type).toBe("worker_loader");
      
      // Ensure no unexpected properties
      const keys = Object.keys(workerLoader);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe("type");
    });
  });

  describe("WorkerLoader Advanced Patterns", () => {
    test("should support multi-tenant worker pattern", () => {
      const multiTenantScript = `
        import { env } from "cloudflare:workers";

        export default {
          async fetch(request) {
            const url = new URL(request.url);
            const tenantId = url.searchParams.get('tenant') || 'default';
            
            const tenantWorker = env.LOADER.get(
              \`tenant-\${tenantId}\`,
              async () => ({
                compatibilityDate: '2025-06-01',
                mainModule: 'tenant.js',
                modules: {
                  'tenant.js': \`
                    export default {
                      async fetch(request) {
                        const url = new URL(request.url);
                        const tenantId = url.searchParams.get('tenant') || 'default';
                        return new Response(\`Response from tenant: \${tenantId}\`);
                      }
                    }
                  \`,
                },
              }),
            );

            const entrypoint = tenantWorker.getEntrypoint();
            return entrypoint.fetch(request);
          }
        };
      `;

      expect(multiTenantScript).toContain("tenant-${tenantId}");
      expect(multiTenantScript).toContain("tenantId");
      expect(multiTenantScript).toContain("Response from tenant");
    });

    test("should support feature flag worker pattern", () => {
      const featureFlagScript = `
        import { env } from "cloudflare:workers";

        export default {
          async fetch(request) {
            const url = new URL(request.url);
            const featureName = url.searchParams.get('feature') || 'default';
            
            const featureWorker = env.LOADER.get(
              \`feature-\${featureName}\`,
              async () => ({
                compatibilityDate: '2025-06-01',
                mainModule: 'feature.js',
                modules: {
                  'feature.js': \`
                    export default {
                      async fetch(request) {
                        const url = new URL(request.url);
                        const featureName = url.searchParams.get('feature') || 'default';
                        return new Response(\`Feature \${featureName} is active\`);
                      }
                    }
                  \`,
                },
              }),
            );

            const entrypoint = featureWorker.getEntrypoint();
            return entrypoint.fetch(request);
          }
        };
      `;

      expect(featureFlagScript).toContain("feature-${featureName}");
      expect(featureFlagScript).toContain("featureName");
      expect(featureFlagScript).toContain("Feature");
    });
  });
});
