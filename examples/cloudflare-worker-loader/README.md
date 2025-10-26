# 🚀 Cloudflare Worker Loader Example

This example demonstrates the **WorkerLoader** binding type in Alchemy, enabling dynamic worker creation at runtime.

## 🎯 What This Example Shows

### Dynamic Worker Creation
- Create workers on-demand without deployment
- Cache workers by key for performance
- Hot-reload workers without restart

### Use Cases Demonstrated
- **Dynamic Workers**: Create workers for specific tasks
- **Metrics Collection**: Dedicated workers for data collection
- **Configuration Management**: Workers for config handling
- **Multi-tenant Architecture**: Tenant-specific workers

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main Worker   │───▶│  WorkerLoader    │───▶│ Dynamic Workers │
│                 │    │   Binding        │    │                 │
│ - Routes        │    │                  │    │ - Metrics       │
│ - Logic         │    │ - get()          │    │ - Config        │
│ - Coordination  │    │ - Caching        │    │ - Custom Logic  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Run in Development
```bash
bun run dev
```

### 3. Deploy to Cloudflare
```bash
bun run deploy
```

## 📡 API Endpoints

### Home
```
GET /
```
Returns the demo homepage with all available endpoints.

### Dynamic Worker
```
GET /dynamic
```
Creates a new dynamic worker on each request. Demonstrates:
- Runtime worker creation
- Unique worker instances
- Dynamic code execution

### Metrics Worker
```
GET /metrics
```
Uses a cached metrics collection worker. Returns:
```json
{
  "timestamp": "2025-10-26T17:30:00.000Z",
  "activeConnections": 42,
  "responseTime": "23ms",
  "healthScore": "0.945"
}
```

### Config Worker
```
GET /config
```
Uses a cached configuration management worker. Returns:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-10-26T17:30:00.000Z",
  "features": {
    "dynamicWorkers": true,
    "metricsCollection": true,
    "configReload": true,
    "gracefulShutdown": true
  }
}
```

## 🔧 Implementation Details

### WorkerLoader Binding
```typescript
import { Worker, WorkerLoader } from "alchemy/cloudflare";

export const worker = await Worker("dynamic-loader", {
  entrypoint: "./src/worker.ts",
  bindings: {
    LOADER: WorkerLoader(), // Dynamic worker loader binding
  },
});
```

### Creating Dynamic Workers
```typescript
const dynamicWorker = env.LOADER.get(
  'worker-key',                    // Cache key
  async () => ({                   // Worker factory
    compatibilityDate: "2025-06-01",
    mainModule: "index.js",
    modules: {
      'index.js': `
        export default {
          async fetch(request) {
            return new Response('Hello from dynamic worker!');
          }
        }
      `,
    },
  }),
);

const entrypoint = dynamicWorker.getEntrypoint();
return entrypoint.fetch(request);
```

### Worker Caching
- Workers are cached by their key
- Same key returns cached worker
- Different keys create new workers
- Factory function called only for new workers

## 🎯 Advanced Patterns

### Multi-tenant Workers
```typescript
const tenantWorker = env.LOADER.get(
  `tenant-${tenantId}`,           // Tenant-specific key
  async () => ({
    // Tenant-specific configuration
    modules: {
      'index.js': generateTenantCode(tenantId),
    },
  }),
);
```

### Feature Flag Workers
```typescript
const featureWorker = env.LOADER.get(
  `feature-${featureName}`,        // Feature-specific key
  async () => ({
    // Feature-specific implementation
    modules: {
      'index.js': generateFeatureCode(featureName),
    },
  }),
);
```

### A/B Testing Workers
```typescript
const testWorker = env.LOADER.get(
  `test-${testVariant}`,           // Test variant key
  async () => ({
    // Test-specific implementation
    modules: {
      'index.js': generateTestCode(testVariant),
    },
  }),
);
```

## 🔍 Use Cases

### 1. Multi-tenant Applications
- Create tenant-specific workers
- Isolate tenant configurations
- Scale tenants independently

### 2. Plugin Systems
- Load plugins dynamically
- Hot-reload plugin code
- Isolate plugin execution

### 3. Feature Flags
- Deploy feature-specific workers
- A/B test implementations
- Rollback without deployment

### 4. Microservices
- Create service workers on-demand
- Service-specific configurations
- Independent scaling

### 5. Data Processing
- Create workers for specific jobs
- Parallel processing
- Resource isolation

## 📊 Performance Considerations

### Worker Caching
- Workers cached by key for performance
- Memory usage scales with unique workers
- Consider cache invalidation strategy

### Cold Starts
- First call to worker key creates worker
- Subsequent calls use cached worker
- Factory function overhead only on creation

### Resource Limits
- Each worker counts towards account limits
- Monitor worker creation patterns
- Implement cleanup strategies

## 🛠️ Best Practices

### 1. Key Strategy
- Use meaningful keys for caching
- Include version in keys for updates
- Consider tenant/user in keys for isolation

### 2. Error Handling
- Wrap worker creation in try/catch
- Handle worker factory failures
- Provide fallback implementations

### 3. Memory Management
- Monitor worker cache size
- Implement cleanup for unused workers
- Consider TTL for worker caching

### 4. Security
- Validate worker code before creation
- Sanitize dynamic code inputs
- Use sandboxed execution

## 🚀 Integration with @alch/tunnel

This WorkerLoader example can be integrated with our tunnel package:

```typescript
// Dynamic tunnel workers
const tunnelWorker = env.LOADER.get(
  `tunnel-${tunnelId}`,
  async () => ({
    modules: {
      'index.js': generateTunnelWorker(tunnelConfig),
    },
  }),
);

// Metrics collection workers
const metricsWorker = env.LOADER.get(
  `metrics-${tunnelId}`,
  async () => ({
    modules: {
      'index.js': generateMetricsWorker(tunnelId),
    },
  }),
);
```

## 📚 References

- [Cloudflare Dynamic Worker Loaders](https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/)
- [Alchemy Framework Documentation](https://alchemy.run)
- [Worker API Reference](https://developers.cloudflare.com/workers/runtime-apis/worker/)

---

**🎯 Next Steps**: Try integrating WorkerLoader with your own use cases! Consider multi-tenant architectures, plugin systems, or dynamic feature deployment.
