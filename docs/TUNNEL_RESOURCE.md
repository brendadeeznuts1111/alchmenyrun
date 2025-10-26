# Tunnel Resource Guide

Complete guide to the Cloudflare Tunnel resource in Alchemy.run for creating and managing secure tunnels.

---

## Table of Contents

- [Overview](#overview)
- [Resource Definition](#resource-definition)
- [Configuration Options](#configuration-options)
- [Ingress Rules](#ingress-rules)
- [Origin Request Configuration](#origin-request-configuration)
- [DNS Management](#dns-management)
- [Lifecycle Management](#lifecycle-management)
- [Advanced Features](#advanced-features)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

---

## Overview

The Tunnel resource in Alchemy provides a complete interface for creating and managing Cloudflare Tunnels. It handles:

- **Tunnel Creation** - Create new tunnels with automatic naming
- **Configuration Management** - Set up ingress rules and origin settings
- **DNS Automation** - Automatically create CNAME records for hostnames
- **Lifecycle Management** - Create, update, delete, and adopt existing tunnels
- **Security** - Manage tunnel secrets and tokens

### Key Features

✅ **Automatic DNS Management** - Creates CNAME records for ingress hostnames  
✅ **Tunnel Adoption** - Adopt existing tunnels instead of creating duplicates  
✅ **Configuration Updates** - Update ingress rules without recreating tunnels  
✅ **Secret Management** - Secure handling of tunnel secrets and tokens  
✅ **Zone Discovery** - Automatic zone detection for DNS records  
✅ **Pagination Support** - Handle large numbers of tunnels efficiently  

---

## Resource Definition

```typescript
import { Tunnel } from "alchemy/cloudflare";

const tunnel = await Tunnel("my-tunnel", {
  name: "my-app-tunnel",
  ingress: [
    {
      hostname: "app.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"  // catch-all rule
    }
  ]
});
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for the resource |
| `props` | `TunnelProps` | Tunnel configuration properties |

### Return Value

```typescript
interface Tunnel {
  tunnelId: string;           // Cloudflare tunnel ID
  accountTag: string;         // Account ID
  name: string;               // Tunnel name
  createdAt: string;          // Creation timestamp
  deletedAt: string | null;   // Deletion timestamp (null if active)
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

---

## Configuration Options

### Basic Configuration

```typescript
const tunnel = await Tunnel("basic", {
  name: "basic-tunnel",                    // Custom tunnel name
  configSrc: "cloudflare",                 // Configuration source
  adopt: false,                            // Don't adopt existing tunnels
  delete: true                             // Delete tunnel on resource deletion
});
```

### Advanced Configuration

```typescript
const tunnel = await Tunnel("advanced", {
  name: "advanced-tunnel",
  configSrc: "cloudflare",
  tunnelSecret: alchemy.secret("custom-secret"),  // Custom tunnel secret
  metadata: {                                   // Custom metadata
    environment: "production",
    team: "platform",
    version: "1.0.0"
  },
  adopt: true,                                 // Adopt existing tunnel
  delete: false                                // Keep tunnel when resource deleted
});
```

### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | auto-generated | Tunnel name (immutable) |
| `configSrc` | `"cloudflare" \| "local"` | `"cloudflare"` | Configuration management |
| `tunnelSecret` | `Secret<string>` | auto-generated | Custom tunnel secret |
| `metadata` | `Record<string, any>` | `undefined` | Custom metadata |
| `adopt` | `boolean` | `false` | Adopt existing tunnel |
| `delete` | `boolean` | `true` | Delete tunnel on resource deletion |

---

## Ingress Rules

Ingress rules define how traffic is routed through the tunnel.

### Basic Ingress

```typescript
const tunnel = await Tunnel("web-app", {
  name: "web-app-tunnel",
  ingress: [
    {
      hostname: "app.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"  // Required catch-all rule
    }
  ]
});
```

### Multiple Services

```typescript
const tunnel = await Tunnel("multi-service", {
  name: "multi-service-tunnel",
  ingress: [
    {
      hostname: "app.example.com",
      service: "http://localhost:3000"
    },
    {
      hostname: "api.example.com",
      service: "http://localhost:8080"
    },
    {
      hostname: "admin.example.com",
      service: "http://localhost:9000"
    },
    {
      service: "http_status:404"  // catch-all
    }
  ]
});
```

### Path-Based Routing

```typescript
const tunnel = await Tunnel("path-routing", {
  name: "path-routing-tunnel",
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
      hostname: "api.example.com",
      service: "http://localhost:8080"  // default for api.example.com
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Ingress Rule Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hostname` | `string` | No | Hostname to match |
| `path` | `string` | No | Path pattern to match |
| `service` | `string` | Yes | Target service URL |
| `originRequest` | `OriginRequestConfig` | No | Per-rule origin configuration |

### Service Types

| Service Type | Example | Use Case |
|--------------|---------|----------|
| HTTP | `http://localhost:3000` | Web applications |
| HTTPS | `https://localhost:8443` | Secure web services |
| TCP | `tcp://localhost:3306` | Database connections |
| Unix Socket | `unix:/var/run/app.sock` | Local socket services |
| HTTP Status | `http_status:404` | Catch-all rule |
| Hello World | `hello_world` | Testing |

---

## Origin Request Configuration

Configure how Cloudflare connects to your origin server.

### Global Origin Configuration

```typescript
const tunnel = await Tunnel("secure", {
  name: "secure-tunnel",
  originRequest: {
    connectTimeout: 30,           // Connection timeout (seconds)
    tlsTimeout: 10,               // TLS handshake timeout (seconds)
    httpHostHeader: "internal.service",  // Custom Host header
    noTLSVerify: false,           // Verify TLS certificates
    http2Origin: true,            // Enable HTTP/2 to origin
    keepAliveConnections: 100,    // Keep-alive connection pool
    keepAliveTimeout: 90          // Keep-alive timeout (seconds)
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

### Per-Rule Origin Configuration

```typescript
const tunnel = await Tunnel("per-rule", {
  name: "per-rule-tunnel",
  ingress: [
    {
      hostname: "fast.example.com",
      service: "http://localhost:3000",
      originRequest: {
        connectTimeout: 5,        // Fast timeout for fast service
        keepAliveConnections: 50
      }
    },
    {
      hostname: "slow.example.com",
      service: "http://localhost:4000",
      originRequest: {
        connectTimeout: 60,       // Longer timeout for slow service
        keepAliveConnections: 10
      }
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Origin Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `connectTimeout` | `number` | 30 | Connection timeout (seconds) |
| `tlsTimeout` | `number` | 10 | TLS handshake timeout (seconds) |
| `tcpKeepAlive` | `number` | 30 | TCP keep-alive (seconds) |
| `noHappyEyeballs` | `boolean` | false | Disable happy eyeballs |
| `keepAliveConnections` | `number` | 100 | Keep-alive connection pool |
| `keepAliveTimeout` | `number` | 90 | Keep-alive timeout (seconds) |
| `http2Origin` | `boolean` | false | Enable HTTP/2 to origin |
| `httpHostHeader` | `string` | - | Custom Host header |
| `caPool` | `string` | - | Custom CA pool |
| `noTLSVerify` | `boolean` | false | Disable TLS verification |
| `disableChunkedEncoding` | `boolean` | false | Disable chunked encoding |
| `bastionMode` | `boolean` | false | Rewrite Host header |
| `proxyProtocol` | `"off" \| "v1" \| "v2"` | `"off"` | Proxy protocol version |
| `proxyAddress` | `string` | - | Proxy server address |
| `proxyPort` | `number` | - | Proxy server port |
| `proxyType` | `string` | - | Proxy server type |

---

## DNS Management

The Tunnel resource automatically manages DNS records for ingress hostnames.

### Automatic DNS Creation

```typescript
const tunnel = await Tunnel("auto-dns", {
  name: "auto-dns-tunnel",
  ingress: [
    {
      hostname: "app.example.com",    // DNS record created automatically
      service: "http://localhost:3000"
    },
    {
      hostname: "api.example.com",    // DNS record created automatically
      service: "http://localhost:8080"
    },
    {
      service: "http_status:404"
    }
  ]
});

// DNS records created:
// app.example.com → {tunnelId}.cfargotunnel.com
// api.example.com → {tunnelId}.cfargotunnel.com
```

### DNS Record Details

```typescript
// Access DNS record information
console.log("DNS Records:", tunnel.dnsRecords);
// Output:
// {
//   "app.example.com": "dns-record-id-1",
//   "api.example.com": "dns-record-id-2"
// }
```

### Manual DNS Management

For advanced DNS control, omit hostnames from ingress rules:

```typescript
const tunnel = await Tunnel("manual-dns", {
  name: "manual-dns-tunnel",
  ingress: [
    {
      service: "http://localhost:3000"  // No hostname = no auto DNS
    },
    {
      service: "http://http_status:404"
    }
  ]
});

// Create DNS records separately with custom configuration
const dnsRecords = await DnsRecords("custom-dns", {
  zoneId: "your-zone-id",
  records: [
    {
      name: "app.example.com",
      type: "CNAME",
      content: `${tunnel.tunnelId}.cfargotunnel.com`,
      proxied: true,
      ttl: 300,  // Custom TTL
      comment: "Custom tunnel DNS"
    }
  ]
});
```

### DNS Features

✅ **Automatic Zone Discovery** - Finds the correct zone for each hostname  
✅ **Parallel DNS Creation** - Creates multiple DNS records simultaneously  
✅ **Record Cleanup** - Removes DNS records when hostnames are removed  
✅ **Wildcard Support** - Handles wildcard subdomains (manual setup required)  
✅ **Custom Comments** - Adds descriptive comments to DNS records  

---

## Lifecycle Management

### Creation

```typescript
// New tunnel creation
const tunnel = await Tunnel("new-tunnel", {
  name: "new-tunnel",
  ingress: [
    {
      hostname: "new.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"
    }
  ]
});

console.log("Tunnel created:", tunnel.tunnelId);
console.log("Token:", tunnel.token.unencrypted);
```

### Updates

```typescript
// Update existing tunnel configuration
const tunnel = await Tunnel("existing-tunnel", {
  name: "existing-tunnel",
  ingress: [
    {
      hostname: "updated.example.com",  // New hostname
      service: "http://localhost:4000"   // New service
    },
    {
      service: "http_status:404"
    }
  ]
});

// Only configuration is updated, tunnel ID remains the same
```

### Adoption

```typescript
// Adopt existing tunnel instead of creating new one
const tunnel = await Tunnel("adopt-existing", {
  name: "existing-tunnel-name",  // Name of existing tunnel
  adopt: true,                   // Enable adoption
  ingress: [
    {
      hostname: "adopted.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"
    }
  ]
});

// If tunnel exists, it's adopted and configured
// If not, new tunnel is created
```

### Deletion

```typescript
// Delete tunnel when resource is destroyed (default)
const tunnel = await Tunnel("temporary", {
  name: "temporary-tunnel",
  delete: true  // Delete tunnel on resource deletion
});

// Keep tunnel when resource is destroyed
const persistentTunnel = await Tunnel("persistent", {
  name: "persistent-tunnel",
  delete: false  // Keep tunnel
});
```

### Replacement

```typescript
// Tunnel names are immutable - changing name creates new tunnel
const tunnel1 = await Tunnel("tunnel", {
  name: "original-name"
});

// This will trigger replacement (new tunnel created)
const tunnel2 = await Tunnel("tunnel", {
  name: "new-name"  // Different name = replacement
});
```

---

## Advanced Features

### WARP Routing

Enable private network access through the tunnel:

```typescript
const tunnel = await Tunnel("warp-network", {
  name: "warp-network-tunnel",
  warpRouting: {
    enabled: true  // Enable WARP routing
  },
  ingress: [
    {
      service: "http_status:404"
    }
  ]
});
```

### Custom Metadata

Add metadata for organization and tracking:

```typescript
const tunnel = await Tunnel("metadata", {
  name: "metadata-tunnel",
  metadata: {
    environment: "production",
    team: "platform",
    cost_center: "engineering",
    version: "1.2.3",
    created_by: "automation",
    tags: ["web", "api", "production"]
  },
  ingress: [
    {
      hostname: "metadata.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Custom Tunnel Secret

Provide your own tunnel secret:

```typescript
const tunnel = await Tunnel("custom-secret", {
  name: "custom-secret-tunnel",
  tunnelSecret: alchemy.secret("your-custom-secret-here"),
  ingress: [
    {
      hostname: "custom.example.com",
      service: "http://localhost:3000"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### Local Configuration

Use local configuration management:

```typescript
const tunnel = await Tunnel("local-config", {
  name: "local-config-tunnel",
  configSrc: "local",  // Use local config files
  // Note: ingress, warpRouting, and originRequest are ignored
  // when configSrc is "local"
});
```

---

## Real-World Examples

### 1. Production Web Application

```typescript
// Production web application with multiple services
const webApp = await Tunnel("production-web", {
  name: "prod-web-app",
  metadata: {
    environment: "production",
    team: "web",
    version: "2.1.0"
  },
  originRequest: {
    connectTimeout: 30,
    tlsTimeout: 10,
    httpHostHeader: "internal.webapp",
    http2Origin: true,
    keepAliveConnections: 100
  },
  ingress: [
    {
      hostname: "app.example.com",
      service: "http://localhost:3000"
    },
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
      hostname: "admin.example.com",
      service: "http://localhost:9000",
      originRequest: {
        connectTimeout: 60,  // Longer timeout for admin
        noTLSVerify: false
      }
    },
    {
      service: "http_status:404"
    }
  ]
});

console.log("Production tunnel ready!");
console.log("Run with: cloudflared tunnel run --token", webApp.token.unencrypted);
```

### 2. Development Environment

```typescript
// Development tunnel with automatic adoption
const devTunnel = await Tunnel("development", {
  name: "dev-environment",
  adopt: true,  // Adopt if exists
  delete: false,  // Keep tunnel for next dev session
  ingress: [
    {
      hostname: "dev.example.com",
      service: "http://localhost:3000"
    },
    {
      hostname: "dev-api.example.com",
      service: "http://localhost:8080"
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### 3. Microservices Architecture

```typescript
// Tunnel for microservices with different origins
const microservices = await Tunnel("microservices", {
  name: "microservices-gateway",
  originRequest: {
    connectTimeout: 15,
    keepAliveConnections: 50
  },
  ingress: [
    // User service
    {
      hostname: "users.example.com",
      service: "http://localhost:3001",
      originRequest: {
        httpHostHeader: "user-service.internal"
      }
    },
    // Order service
    {
      hostname: "orders.example.com",
      service: "http://localhost:3002",
      originRequest: {
        httpHostHeader: "order-service.internal"
      }
    },
    // Payment service (HTTPS)
    {
      hostname: "payments.example.com",
      service: "https://localhost:3003",
      originRequest: {
        httpHostHeader: "payment-service.internal",
        noTLSVerify: false,
        tlsTimeout: 20
      }
    },
    // Catch-all
    {
      service: "http_status:404"
    }
  ]
});
```

### 4. Database Access Tunnel

```typescript
// Secure database access tunnel
const dbTunnel = await Tunnel("database-access", {
  name: "database-tunnel",
  metadata: {
    purpose: "database-access",
    restricted: true
  },
  ingress: [
    {
      hostname: "db-admin.example.com",
      service: "tcp://localhost:3306",  // MySQL
      originRequest: {
        connectTimeout: 60,
        tcpKeepAlive: 300
      }
    },
    {
      hostname: "redis.example.com",
      service: "tcp://localhost:6379",  // Redis
      originRequest: {
        connectTimeout: 30,
        tcpKeepAlive: 300
      }
    },
    {
      service: "http_status:404"
    }
  ]
});
```

### 5. Staging Environment with Adoption

```typescript
// Staging tunnel that adopts existing infrastructure
const stagingTunnel = await Tunnel("staging", {
  name: "staging-environment",
  adopt: true,  // Adopt existing tunnel
  metadata: {
    environment: "staging",
    auto_adopted: true
  },
  ingress: [
    {
      hostname: "staging.example.com",
      service: "http://localhost:3000"
    },
    {
      hostname: "staging-api.example.com",
      service: "http://localhost:8080"
    },
    {
      service: "http_status:404"
    }
  ]
});

// Check if tunnel was adopted
if (stagingTunnel.createdAt) {
  const age = Date.now() - new Date(stagingTunnel.createdAt).getTime();
  console.log(`Tunnel age: ${Math.round(age / (1000 * 60 * 60 * 24))} days`);
}
```

---

## Best Practices

### Naming Conventions

```typescript
// ✅ DO: Use descriptive names
const tunnel = await Tunnel("web-app", {
  name: "web-app-production"
});

// ✅ DO: Include environment
const tunnel = await Tunnel("api", {
  name: "api-staging"
});

// ❌ DON'T: Use generic names
const tunnel = await Tunnel("tunnel1", {
  name: "tunnel1"  // Not descriptive
});
```

### Security

```typescript
// ✅ DO: Use custom secrets for production
const tunnel = await Tunnel("secure", {
  name: "secure-production",
  tunnelSecret: alchemy.secret(process.env.TUNNEL_SECRET)
});

// ✅ DO: Enable TLS verification
const tunnel = await Tunnel("secure", {
  originRequest: {
    noTLSVerify: false,
    caPool: "/path/to/ca-bundle.crt"
  }
});

// ❌ DON'T: Disable TLS verification in production
const tunnel = await Tunnel("insecure", {
  originRequest: {
    noTLSVerify: true  // Dangerous in production
  }
});
```

### Performance

```typescript
// ✅ DO: Optimize connection pooling
const tunnel = await Tunnel("optimized", {
  originRequest: {
    keepAliveConnections: 100,
    keepAliveTimeout: 90,
    http2Origin: true
  }
});

// ✅ DO: Set appropriate timeouts
const tunnel = await Tunnel("responsive", {
  originRequest: {
    connectTimeout: 30,  // Reasonable timeout
    tlsTimeout: 10
  }
});

// ❌ DON'T: Use excessively long timeouts
const tunnel = await Tunnel("slow", {
  originRequest: {
    connectTimeout: 300  // Too long, users will timeout first
  }
});
```

### DNS Management

```typescript
// ✅ DO: Let Alchemy manage DNS automatically
const tunnel = await Tunnel("auto-dns", {
  ingress: [
    {
      hostname: "app.example.com",  // Auto-managed
      service: "http://localhost:3000"
    }
  ]
});

// ✅ DO: Use manual DNS for special cases
const tunnel = await Tunnel("special-dns", {
  ingress: [
    {
      service: "http://localhost:3000"  // No hostname = manual DNS
    }
  ]
});

// Then create DNS with custom settings
```

### Error Handling

```typescript
// ✅ DO: Use adoption for development
const tunnel = await Tunnel("dev", {
  name: "dev-environment",
  adopt: true,  // Avoid conflicts
  delete: false  // Preserve between sessions
});

// ✅ DO: Handle tunnel replacement
// Tunnel names are immutable - plan accordingly
```

### Monitoring and Observability

```typescript
// ✅ DO: Add metadata for tracking
const tunnel = await Tunnel("monitored", {
  name: "monitored-tunnel",
  metadata: {
    environment: "production",
    team: "platform",
    cost_center: "engineering",
    monitoring_enabled: true,
    alert_email: "team@example.com"
  }
});
```

---

## Integration Examples

### With Workers

```typescript
// Combine tunnel with Workers for complete setup
const tunnel = await Tunnel("worker-backend", {
  name: "worker-backend-tunnel",
  ingress: [
    {
      hostname: "api.example.com",
      service: "http://localhost:8080"  // Local development
    },
    {
      service: "http_status:404"
    }
  ]
});

const api = Worker("api", {
  entry: "./src/worker.ts",
  route: {
    pattern: "api.example.com/*"
  }
});

return { tunnel, api };
```

### With D1 Database

```typescript
// Tunnel for local D1 access during development
const db = D1("main-db");

const tunnel = await Tunnel("db-access", {
  name: "db-development-tunnel",
  ingress: [
    {
      hostname: "db-admin.example.com",
      service: "http://localhost:8080"  // Local admin interface
    }
  ]
});
```

### Multi-Environment Setup

```typescript
// Different tunnels for different environments
const environments = ["dev", "staging", "prod"];
const tunnels = {};

for (const env of environments) {
  tunnels[env] = await Tunnel(`${env}-tunnel`, {
    name: `${env}-environment`,
    metadata: { environment: env },
    ingress: [
      {
        hostname: `${env}.example.com`,
        service: `http://localhost:${3000 + environments.indexOf(env)}`
      },
      {
        service: "http_status:404"
      }
    ]
  });
}
```

---

## Next Steps

- [Cloudflare Tunnel Guide](./CLOUDFLARE_TUNNEL.md) - Using tunnels for development
- [DNS Records Guide](./DNS_RECORDS.md) - Advanced DNS management
- [Worker Configuration](./WORKER_CONFIGURATION.md) - Worker setup with tunnels
- [Security Best Practices](./SECURITY.md) - Security guidelines
- [Monitoring Guide](./MONITORING.md) - Tunnel monitoring and observability

---

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Ingress Rules Reference](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#ingress-rules)
- [Origin Request Configuration](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#origin-request-parameters)
- [WARP Routing](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/)
