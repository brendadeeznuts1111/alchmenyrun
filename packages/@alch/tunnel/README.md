# @alch/tunnel

> Cloudflare Tunnel resource for Alchemy with metrics, graceful shutdown, and zero-downtime reload.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)
[![Alchemy](https://img.shields.io/badge/alchemy-%5E0.76.1-green.svg)](https://www.npmjs.com/package/alchemy)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## Features

- **Automatic Tunnel Management** - Create, update, and delete Cloudflare Tunnels
- **DNS Automation** - Automatically create CNAME records for ingress hostnames
- **Tunnel Adoption** - Adopt existing tunnels to prevent conflicts
- **Prometheus Metrics** - Comprehensive metrics export for monitoring
- **Graceful Shutdown** - Clean termination with configurable grace periods
- **Zero-Downtime Reload** - Seamless configuration updates

## Installation

```bash
bun add @alch/tunnel
```

## Quick Start

### Basic Tunnel

```typescript
import { Tunnel } from "@alch/tunnel";
import alchemy from "alchemy";

const app = await alchemy("my-app");

const tunnel = await Tunnel("my-tunnel", {
  name: "my-app-tunnel"
});

console.log("Tunnel created:", tunnel.tunnelId);
console.log("Run with: cloudflared tunnel run --token", tunnel.token.unencrypted);

await app.finalize();
```

### Web Application with DNS

```typescript
const tunnel = await Tunnel("web-app", {
  name: "web-app-tunnel",
  ingress: [
    {
      hostname: "app.example.com",  // DNS record auto-created
      service: "http://localhost:3000"
    },
    {
      hostname: "api.example.com",  // DNS record auto-created
      service: "http://localhost:8080"
    },
    {
      service: "http_status:404"  // catch-all rule
    }
  ]
});

// DNS records automatically created:
// app.example.com → {tunnelId}.cfargotunnel.com
// api.example.com → {tunnelId}.cfargotunnel.com
```

## Advanced Usage

### Path-Based Routing

```typescript
const tunnel = await Tunnel("api", {
  name: "api-tunnel",
  ingress: [
    {
      hostname: "api.example.com",
      path: "/v1/*",
      service: "http://localhost:8080"
    },
    {
      hostname: "api.example.com",
      path: "/v2/*",
      service: "http://localhost:8081"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Origin Configuration

```typescript
const tunnel = await Tunnel("secure", {
  name: "secure-tunnel",
  originRequest: {
    connectTimeout: 30,
    tlsTimeout: 10,
    httpHostHeader: "internal.service",
    http2Origin: true,
    noTLSVerify: false,
    keepAliveConnections: 100
  },
  ingress: [
    {
      hostname: "secure.example.com",
      service: "https://localhost:8443"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Development with Adoption

```typescript
const tunnel = await Tunnel("dev", {
  name: "development-tunnel",
  adopt: true,        // Adopt existing tunnel if it exists
  delete: false,      // Keep tunnel when resource is deleted
  ingress: [
    {
      hostname: "dev.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

## Configuration Reference

### TunnelProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | auto-generated | Tunnel name (immutable) |
| `configSrc` | `"cloudflare" \| "local"` | `"cloudflare"` | Configuration management |
| `tunnelSecret` | `Secret<string>` | auto-generated | Custom tunnel secret |
| `metadata` | `Record<string, any>` | `undefined` | Custom metadata |
| `ingress` | `IngressRule[]` | `undefined` | Traffic routing rules |
| `warpRouting` | `{ enabled?: boolean }` | `undefined` | WARP routing config |
| `originRequest` | `OriginRequestConfig` | `undefined` | Origin connection config |
| `adopt` | `boolean` | `false` | Adopt existing tunnel |
| `delete` | `boolean` | `true` | Delete tunnel on cleanup |

### IngressRule

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `hostname` | `string` | No | Hostname to match |
| `path` | `string` | No | Path pattern to match |
| `service` | `string` | Yes | Target service URL |
| `originRequest` | `OriginRequestConfig` | No | Per-rule origin config |

### OriginRequestConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `connectTimeout` | `number` | 30 | Connection timeout (seconds) |
| `tlsTimeout` | `number` | 10 | TLS handshake timeout (seconds) |
| `httpHostHeader` | `string` | - | Custom Host header |
| `http2Origin` | `boolean` | false | Enable HTTP/2 to origin |
| `noTLSVerify` | `boolean` | false | Disable TLS verification |
| `keepAliveConnections` | `number` | 100 | Keep-alive connection pool |

## Output Interface

```typescript
interface Tunnel {
  tunnelId: string;           // Cloudflare tunnel ID
  accountTag: string;         // Account ID
  name: string;               // Tunnel name
  createdAt: string;          // Creation timestamp
  deletedAt: string | null;   // Deletion timestamp
  credentials: {              // Connection credentials
    accountTag: string;
    tunnelId: string;
    tunnelName: string;
    tunnelSecret: Secret<string>;
  };
  token: Secret<string>;      // Run token for cloudflared
  dnsRecords?: Record<string, string>;  // DNS record mappings
}
```

## Running the Tunnel

After creating a tunnel, use the provided token with cloudflared:

```bash
# Install cloudflared
brew install cloudflared  # macOS
# Or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Run the tunnel
cloudflared tunnel run --token <tunnel.token.unencrypted>
```

## 🆕 Phase 3 Enterprise Features

### Prometheus Metrics

Monitor your tunnels with comprehensive Prometheus-compatible metrics:

```typescript
import { metricsCollector } from "@alch/tunnel";

// Start metrics collection
const tunnels = [tunnel1, tunnel2, tunnel3];
metricsCollector.startCollection(tunnels);

// Get Prometheus metrics
const prometheusMetrics = metricsCollector.exportPrometheusMetrics();
console.log(prometheusMetrics);

// Get metrics summary
const summary = metricsCollector.getMetricsSummary();
console.log(`Total tunnels: ${summary.totalTunnels}`);
console.log(`Healthy tunnels: ${summary.healthyTunnels}`);
console.log(`Total connections: ${summary.totalConnections}`);

// Stop metrics collection
metricsCollector.stopCollection();
```

**Available Metrics:**
- `tunnel_active_connections` - Current active connections
- `tunnel_total_connections` - Total connections since start
- `tunnel_bytes_transferred` - Total bytes transferred
- `tunnel_requests_per_second` - Current requests per second
- `tunnel_error_rate` - Error rate (0-1)
- `tunnel_average_response_time` - Average response time in milliseconds
- `tunnel_health_status` - Health status (1=healthy, 0.5=degraded, 0=unhealthy)

### Graceful Shutdown

Ensure clean termination of tunnel operations:

```typescript
import { shutdownManager, TunnelShutdownManager } from "@alch/tunnel";

// Use the global instance (automatically handles SIGTERM, SIGINT, SIGUSR2)
await shutdownManager.initiateShutdown();

// Check shutdown status
const status = shutdownManager.getStatus();
console.log("Shutdown phase:", status.phase);
console.log("Tunnels processed:", status.tunnelsProcessed);

// Force immediate shutdown (emergency)
await shutdownManager.forceShutdown();

// Or create a custom shutdown manager with specific configuration
const customManager = new TunnelShutdownManager({
  gracePeriodMs: 30000,
  waitForActiveConnections: true,
  connectionTimeoutMs: 10000,
  exportFinalMetrics: true,
  deleteTunnelsOnShutdown: false,
});
```

### Zero-Downtime Configuration Reload

Update tunnel configurations without interrupting active connections:

```typescript
import { configReloader, TunnelConfigReloader } from "@alch/tunnel";

// Prepare new configurations
const newConfigs = new Map();
newConfigs.set("tunnel-1-id", {
  ingress: [
    {
      hostname: "new.example.com",
      service: "http://localhost:3000",
    },
  ],
});

// Use the global instance
await configReloader.reloadConfig(tunnels, newConfigs);

// Check reload status
const status = configReloader.getStatus();
console.log("Reload phase:", status.phase);
console.log("Tunnels processed:", status.tunnelsProcessed);
console.log("Config changes:", status.configChanges);

// Get available backups for rollback
const backups = configReloader.getBackups();
console.log(`Available backups: ${backups.size}`);

// Clear old backups
configReloader.clearBackups(24 * 60 * 60 * 1000);

// Or create a custom reloader with specific configuration
const customReloader = new TunnelConfigReloader({
  validateBeforeApply: true,
  backupCurrentConfig: true,
  rollingUpdate: true,
  rollingUpdateDelayMs: 5000,
  healthCheckAfterUpdate: true,
});
```

### Advanced Usage Example

Combine all Phase 3 features for production-ready tunnel management:

```typescript
import {
  Tunnel,
  metricsCollector,
  shutdownManager,
  configReloader,
  TunnelShutdownManager,
  TunnelConfigReloader,
} from "@alch/tunnel";

// Create tunnels
const tunnel1 = await Tunnel("prod-api", { /* config */ });
const tunnel2 = await Tunnel("prod-web", { /* config */ });

// Start metrics collection
metricsCollector.startCollection([tunnel1, tunnel2]);

// Setup graceful shutdown (global instance auto-registers signal handlers)
// Or create custom instance:
const customShutdown = new TunnelShutdownManager({
  gracePeriodMs: 60000,
  exportFinalMetrics: true,
});

// Setup configuration reload monitoring
const customReloader = new TunnelConfigReloader({
  validateBeforeApply: true,
  rollingUpdate: true,
  healthCheckAfterUpdate: true,
});

// Example: Update configuration based on external trigger
process.on("SIGUSR2", async () => {
  const newConfigs = await loadNewConfigsFromConfigService();
  await customReloader.reloadConfig([tunnel1, tunnel2], newConfigs);
});

// Your application logic here...

// Graceful shutdown will be handled automatically by shutdownManager
```

## Development

### Building

```bash
bun run build
```

### Testing

```bash
bun run test
bun run test:watch
```

### Type Checking

```bash
bun run type-check
```

## Examples

See the [examples](./examples/) directory for complete usage examples:

- [Basic Usage](./examples/basic.ts) - Simple tunnel creation and configuration
- [Templates](./templates/) - Ready-to-use tunnel templates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Make your changes and add tests
4. Run tests: `bun run test`
5. Submit a pull request

## License

MIT

## Related Documentation

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Alchemy Documentation](https://alchemy.run/docs)
- [Tunnel Resource Guide](../../../docs/TUNNEL_RESOURCE.md)
- [Cloudflare Tunnel Usage Guide](../../../docs/CLOUDFLARE_TUNNEL.md)
