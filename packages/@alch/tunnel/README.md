# @alch/tunnel

Cloudflare Tunnel resource for Alchemy - provides secure connectivity between your origin services and Cloudflare's edge network with real API integration.

## Features

- ✅ **Real Cloudflare API Integration** - Direct integration with Cloudflare's API for tunnel management
- ✅ **Automatic Tunnel Management** - Create, update, and delete Cloudflare Tunnels via real API calls
- ✅ **DNS Automation** - Automatically create CNAME records for ingress hostnames
- ✅ **Tunnel Adoption** - Adopt existing tunnels to prevent conflicts
- ✅ **Advanced Configuration** - Support for ingress rules, origin configuration, and WARP routing
- ✅ **Type Safety** - Full TypeScript support with comprehensive interfaces
- ✅ **Error Handling** - Robust error handling and retry mechanisms
- ✅ **Secret Redaction** - Automatic redaction of sensitive information in logs
- ✅ **Integration Testing** - Real API testing with Cloudflare test accounts

## Installation

```bash
bun add @alch/tunnel
```

## Quick Start

### Prerequisites

You'll need a Cloudflare API token and account ID:

```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
```

### Basic Usage

```typescript
import { Tunnel } from "@alch/tunnel";
import alchemy from "alchemy";

const app = await alchemy("my-app");

// Create a basic tunnel with real Cloudflare API
const tunnel = await Tunnel("my-tunnel", {
  name: `${app.name}-tunnel`,
});

console.log(`Tunnel ID: ${tunnel.tunnelId}`);
console.log(`Run: cloudflared tunnel run --token ${tunnel.token.unencrypted}`);
```

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

- [Basic Usage](./examples/basic.ts) - Simple tunnel creation
- [Web Application](./examples/basic.ts) - DNS automation
- [API Routing](./examples/basic.ts) - Path-based routing
- [Security](./examples/basic.ts) - Origin configuration
- [Development](./examples/basic.ts) - Tunnel adoption

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
- [Tunnel Resource Guide](../../docs/TUNNEL_RESOURCE.md)
- [Cloudflare Tunnel Usage Guide](../../docs/CLOUDFLARE_TUNNEL.md)
