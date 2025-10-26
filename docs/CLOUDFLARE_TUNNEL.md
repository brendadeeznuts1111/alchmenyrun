# Cloudflare Tunnel Guide

Complete guide to using Cloudflare Tunnels in Alchemy.run for local development and remote binding access.

---

## Table of Contents

- [Overview](#overview)
- [Profile vs Phase vs Tunnel](#profile-vs-phase-vs-tunnel)
- [Local Development Tunnel](#local-development-tunnel)
- [Remote Binding Access](#remote-binding-access)
- [Tunnel Architecture](#tunnel-architecture)
- [Configuration Reference](#configuration-reference)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

Cloudflare Tunnels in Alchemy enable two critical workflows:

1. **Local Development Tunnel** - Access local resources without deploying
2. **Remote Binding Access** - Access deployed resources from your local machine

### When to Use Tunnels

| Use Case | Tunnel Type | Example |
|----------|-------------|---------|
| Local development | Local tunnel | Test Worker with local D1 |
| Production debugging | Remote tunnel | Query prod database safely |
| CI/CD testing | Remote tunnel | Test against staging |
| Multi-environment access | Remote tunnel | Compare dev/staging/prod |

---

## Profile vs Phase vs Tunnel

Understanding the relationship between profiles, phases, and tunnels is critical:

### The Triangle

| Dimension | Controls | Values | Example |
|-----------|----------|--------|---------|
| **Profile** | *target environment* | `dev`, `staging`, `prod` | `--profile prod` |
| **Phase** | *what Alchemy does* | `up`, `destroy`, `read` | `PHASE=read` |
| **Tunnel** | *how you reach it* | `localPort`, `authToken` | `tunnel(D1("db"), { profile: "prod" })` |

### Practical Rule

```typescript
// 1. Deploy the infrastructure (phase = up, profile = prod)
const prodDb = D1("main-db");

// 2. Later, access prod WITHOUT deploying (phase = read, profile = prod)
const remoteProd = remote(prodDb, {
  profile: "prod",     // ← WHICH environment
  tunnel: true         // ← HOW to reach it
});
```

### Security Rule

- **Local tunnel** → **NO profile** (always local)
- **Remote tunnel** → **MUST have profile** (targets environment)

### Command Cheat Sheet

```bash
# Local dev (no profile needed)
PHASE=read bun ./scripts/build-frontend.ts

# Access staging (profile required)
PHASE=read STAGE=staging bun ./scripts/build-frontend.ts

# Access prod (profile + limited token)
PHASE=read STAGE=prod READ_TOKEN=${{ secrets.PROD_READ }} bun ./scripts/build-frontend.ts
```

**Profile = target, Tunnel = transport, Phase = action** 🎯

---

## Local Development Tunnel

Access local resources during development without deploying to Cloudflare.

### Basic Setup

```typescript
import { Worker, D1 } from "@alchemy/astro";
import { tunnel } from "alchemy/tunnel";

export default alchemy({
  name: "my-app",
  async setup() {
    // Create local tunnel for development
    const isDev = process.env.NODE_ENV === "development";
    
    const db = isDev 
      ? await tunnel(D1("main-db"), {
          localPort: 8787
        })
      : D1("main-db");
    
    const api = Worker("api", {
      entry: "./src/worker.ts",
      bindings: { DB: db }
    });
    
    return { api };
  }
});
```

### How It Works

1. **Start local development server**
   ```bash
   alchemy dev
   ```

2. **Tunnel proxy is created**
   - Listens on `localhost:8787`
   - Proxies requests to local Worker
   - No deployment required

3. **Access resources locally**
   ```typescript
   // Worker runs locally, accesses local D1
   const result = await env.DB.prepare("SELECT * FROM users").all();
   ```

### Configuration Options

```typescript
const localDb = await tunnel(D1("main-db"), {
  localPort: 8787,              // Port for tunnel proxy
  authToken: "secret-token",    // Optional auth token
  timeout: 30000                // Connection timeout (ms)
});
```

### Development Workflow

```bash
# 1. Start development server with tunnel
alchemy dev

# 2. Worker runs locally
# Requests → localhost:8787 → tunnel proxy → local Worker

# 3. Make changes and test
# No deployment needed!
```

### Benefits

✅ **Fast iteration** - No deployment delays  
✅ **Local debugging** - Full access to debugger  
✅ **Cost savings** - No Cloudflare requests during dev  
✅ **Offline development** - Works without internet  

---

## Remote Binding Access

Access deployed resources from your local machine for debugging and testing.

### Basic Setup

```typescript
import { remote } from "alchemy/remote";
import { D1 } from "@alchemy/astro";

// Access production database from local machine
const prodDb = await remote(D1("main-db"), {
  profile: "prod",
  tunnel: true,
  authToken: process.env.PROD_READ_TOKEN
});

// Query production data safely
const users = await prodDb.prepare("SELECT COUNT(*) as count FROM users").first();
console.log(`Production has ${users.count} users`);
```

### How It Works

1. **Remote binding proxy is deployed**
   - Worker deployed to Cloudflare
   - Has access to target bindings
   - Proxies requests from local machine

2. **Local tunnel connects**
   - Establishes secure connection
   - Authenticates with token
   - Routes requests to proxy Worker

3. **Access remote resources**
   ```typescript
   // Local code → tunnel → proxy Worker → remote binding
   const result = await prodDb.prepare("SELECT * FROM users LIMIT 10").all();
   ```

### Multi-Environment Access

```typescript
// Access different environments
const environments = ["dev", "staging", "prod"];

for (const env of environments) {
  const db = await remote(D1("main-db"), {
    profile: env,
    tunnel: true
  });
  
  const health = await db.prepare("SELECT 1 as health").first();
  console.log(`✅ ${env} is healthy`);
}
```

### Security Considerations

#### ✅ DO: Use Read-Only Tokens

```typescript
const prodDb = await remote(D1("main-db"), {
  profile: "prod",
  authToken: process.env.READ_ONLY_TOKEN  // Limited scope
});
```

#### ❌ DON'T: Use Full-Access Tokens

```typescript
const prodDb = await remote(D1("main-db"), {
  profile: "prod",
  authToken: process.env.FULL_ACCESS_TOKEN  // Too broad!
});
```

#### ✅ DO: Limit Token Scope

```bash
# Create read-only token for production access
wrangler api-token create \
  --name "prod-read-only" \
  --permission "Workers:read" \
  --permission "D1:read"
```

### Production Debugging

```typescript
// scripts/debug-prod.ts
import { remote } from "alchemy/remote";
import { D1 } from "@alchemy/astro";

const prodDb = await remote(D1("main-db"), {
  profile: "prod",
  tunnel: true,
  authToken: process.env.PROD_READ_TOKEN
});

// Safely query production
const recentErrors = await prodDb.prepare(`
  SELECT * FROM error_logs 
  WHERE created_at > datetime('now', '-1 hour')
  ORDER BY created_at DESC
  LIMIT 100
`).all();

console.log("Recent errors:", recentErrors.results);
```

---

## Tunnel Architecture

### Tunnel Proxy Worker

The tunnel proxy Worker handles local development:

```typescript
// Simplified tunnel-proxy.ts
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    url.host = env.TUNNEL_HOST;
    
    const headers = new Headers(request.headers);
    headers.set("alchemy-worker-name", env.WORKER_NAME);
    
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });
    
    if (response.status === 530) {
      // Tunnel connection failed
      return renderTunnelError(env.WORKER_NAME);
    }
    
    return response;
  }
};
```

### Remote Binding Proxy Worker

The remote binding proxy handles remote access:

```typescript
// Simplified remote-binding-proxy.ts
export default {
  async fetch(request: Request, env: Env) {
    const bindingName = request.headers.get("MF-Binding");
    if (!bindingName) {
      throw new Error("Binding not specified");
    }
    
    const targetBinding = env[bindingName];
    if (!targetBinding) {
      throw new Error(`Binding "${bindingName}" not found`);
    }
    
    // Proxy request to target binding
    return targetBinding.fetch(request);
  }
};
```

### Security Model

```
┌─────────────┐
│ Local Code  │
└──────┬──────┘
       │ (1) Request with auth token
       ▼
┌─────────────┐
│   Tunnel    │
└──────┬──────┘
       │ (2) Authenticated connection
       ▼
┌─────────────┐
│ Proxy Worker│
└──────┬──────┘
       │ (3) Access binding
       ▼
┌─────────────┐
│   Binding   │
│ (D1/KV/R2)  │
└─────────────┘
```

---

## Configuration Reference

### Tunnel Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `localPort` | `number` | `8787` | Local port for tunnel |
| `authToken` | `string` | auto-generated | Tunnel authentication token |
| `timeout` | `number` | `30000` | Connection timeout (ms) |
| `bindAddress` | `string` | `"127.0.0.1"` | Bind address (localhost only) |

### Remote Access Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `profile` | `string` | required | Target profile (dev/staging/prod) |
| `tunnel` | `boolean` | `true` | Use tunnel vs direct access |
| `authToken` | `string` | from profile | Authentication token |
| `timeout` | `number` | `60000` | Request timeout (ms) |

### Environment Variables

```bash
# Tunnel configuration
ALCHEMY_TUNNEL_PORT=8788
ALCHEMY_TUNNEL_TOKEN=your-secret-token
ALCHEMY_TUNNEL_HOST=localhost

# Remote access
ALCHEMY_REMOTE_PROFILE=prod
ALCHEMY_REMOTE_TOKEN=your-remote-token
ALCHEMY_REMOTE_TIMEOUT=60000
```

---

## Best Practices

### Security Guidelines

#### ✅ DO: Use Auth Tokens

```typescript
const localDb = await tunnel(D1("main-db"), {
  authToken: process.env.TUNNEL_TOKEN
});
```

#### ❌ DON'T: Leave Tunnel Open Without Auth

```typescript
const localDb = await tunnel(D1("main-db")); // No auth!
```

#### ✅ DO: Restrict Tunnel to Localhost

```typescript
const localDb = await tunnel(D1("main-db"), {
  localPort: 8787,
  bindAddress: "127.0.0.1"  // Localhost only
});
```

#### ❌ DON'T: Bind to All Interfaces

```typescript
const localDb = await tunnel(D1("main-db"), {
  bindAddress: "0.0.0.0"  // Exposes to network!
});
```

### Performance Optimization

#### ✅ DO: Use Local Tunnel for Development

```typescript
const isDev = process.env.NODE_ENV === "development";
const db = isDev ? await tunnel(D1("main-db")) : D1("main-db");
```

#### ✅ DO: Set Appropriate Timeouts

```typescript
const remoteDb = await remote(D1("main-db"), {
  profile: "prod",
  timeout: 60000  // 60 second timeout for slow queries
});
```

#### ❌ DON'T: Use Remote Access in Production

```typescript
// Bad: Remote access in production code
const api = Worker("api", {
  bindings: {
    DB: await remote(D1("main-db"), { profile: "prod" })  // Don't do this!
  }
});
```

### Error Handling

#### ✅ DO: Handle Tunnel Errors

```typescript
try {
  const localDb = await tunnel(D1("main-db"), {
    localPort: 8787,
    timeout: 5000
  });
} catch (error) {
  if (error.message.includes("530")) {
    console.error("Tunnel connection failed. Is 'alchemy dev' running?");
  } else {
    console.error("Tunnel error:", error);
  }
}
```

#### ✅ DO: Add Retry Logic

```typescript
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tunnel(D1("main-db"), { localPort: 8787 });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Testing Strategies

#### Unit Tests with Local Tunnel

```typescript
import { describe, test, expect } from "vitest";
import { tunnel } from "alchemy/tunnel";
import { D1 } from "@alchemy/astro";

describe("API with local tunnel", () => {
  test("creates user", async () => {
    const localDb = await tunnel(D1("test-db"), { localPort: 9999 });
    
    await localDb.exec("INSERT INTO users (name) VALUES ('Test')");
    const result = await localDb.prepare("SELECT * FROM users").all();
    
    expect(result.results).toHaveLength(1);
  });
});
```

#### Integration Tests with Remote Access

```bash
# Test against deployed infrastructure
PHASE=read bun test

# Test specific environment
PHASE=read STAGE=staging bun ./scripts/test-api.ts
```

---

## Real-World Examples

### 1. Development Workflow

```typescript
// alchemy.run.ts
import { Worker, D1, KV } from "@alchemy/astro";
import { tunnel } from "alchemy/tunnel";

export default alchemy({
  name: "my-app",
  async setup() {
    const isDev = process.env.NODE_ENV === "development";
    
    // Use tunnel for local development
    const db = isDev 
      ? await tunnel(D1("main-db"), { localPort: 8787 })
      : D1("main-db");
    
    const cache = isDev
      ? await tunnel(KV("cache"), { localPort: 8788 })
      : KV("cache");
    
    const api = Worker("api", {
      entry: "./src/worker.ts",
      bindings: { 
        DB: db,
        CACHE: cache
      }
    });
    
    return { api };
  }
});
```

### 2. Production Debugging Script

```typescript
// scripts/debug-prod.ts
import { remote } from "alchemy/remote";
import { D1 } from "@alchemy/astro";

async function debugProduction() {
  const prodDb = await remote(D1("main-db"), {
    profile: "prod",
    tunnel: true,
    authToken: process.env.PROD_READ_TOKEN
  });
  
  // Check recent errors
  const errors = await prodDb.prepare(`
    SELECT * FROM error_logs 
    WHERE created_at > datetime('now', '-1 hour')
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  
  console.log(`Found ${errors.results.length} errors in the last hour`);
  
  // Check database health
  const stats = await prodDb.prepare(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as new_users
    FROM users
  `).first();
  
  console.log(`Total users: ${stats.total_users}`);
  console.log(`New users (24h): ${stats.new_users}`);
  
  // Check performance
  const slowQueries = await prodDb.prepare(`
    SELECT * FROM query_logs 
    WHERE duration_ms > 1000
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  console.log(`Slow queries: ${slowQueries.results.length}`);
}

debugProduction().catch(console.error);
```

### 3. Multi-Environment Testing

```typescript
// scripts/test-environments.ts
import { remote } from "alchemy/remote";
import { D1 } from "@alchemy/astro";

async function testAllEnvironments() {
  const environments = ["dev", "staging", "prod"];
  
  for (const env of environments) {
    console.log(`\nTesting ${env}...`);
    
    try {
      const db = await remote(D1("main-db"), {
        profile: env,
        tunnel: true,
        timeout: 10000
      });
      
      // Health check
      const health = await db.prepare("SELECT 1 as health").first();
      console.log(`✅ ${env} database is healthy`);
      
      // Check schema version
      const version = await db.prepare(
        "SELECT value FROM metadata WHERE key = 'schema_version'"
      ).first();
      console.log(`   Schema version: ${version?.value || 'unknown'}`);
      
      // Check record count
      const count = await db.prepare(
        "SELECT COUNT(*) as count FROM users"
      ).first();
      console.log(`   Total users: ${count.count}`);
      
    } catch (error) {
      console.error(`❌ ${env} failed:`, error.message);
    }
  }
}

testAllEnvironments().catch(console.error);
```

### 4. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Against Staging

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Test against staging
        env:
          STAGE: staging
          STAGING_READ_TOKEN: ${{ secrets.STAGING_READ_TOKEN }}
        run: |
          PHASE=read bun test
```

### 5. Local Development with Hot Reload

```typescript
// scripts/dev.ts
import { tunnel } from "alchemy/tunnel";
import { D1, KV } from "@alchemy/astro";
import { watch } from "fs";

async function startDev() {
  // Create tunnels
  const db = await tunnel(D1("main-db"), { localPort: 8787 });
  const cache = await tunnel(KV("cache"), { localPort: 8788 });
  
  console.log("✅ Tunnels ready");
  console.log("   DB: http://localhost:8787");
  console.log("   Cache: http://localhost:8788");
  
  // Watch for changes
  watch("./src", { recursive: true }, (event, filename) => {
    console.log(`File changed: ${filename}`);
    // Trigger rebuild/reload
  });
  
  console.log("\n🚀 Development server running");
  console.log("   Press Ctrl+C to stop");
}

startDev().catch(console.error);
```

---

## Troubleshooting

### Common Issues

#### Tunnel Connection Failed (530 Error)

**Symptoms:**
```
530: Tunnel Error
The worker "api" could not be reached.
```

**Solutions:**

1. **Check if `alchemy dev` is running**
   ```bash
   # Start development server
   alchemy dev
   ```

2. **Verify tunnel port**
   ```bash
   # Check if port is in use
   lsof -i :8787
   
   # Use different port if needed
   tunnel(D1("main-db"), { localPort: 8788 })
   ```

3. **Check auth token**
   ```bash
   echo $ALCHEMY_TUNNEL_TOKEN
   ```

#### Remote Access Denied

**Symptoms:**
```
Error: Authentication failed
```

**Solutions:**

1. **Verify profile exists**
   ```bash
   alchemy config list
   ```

2. **Check token permissions**
   ```bash
   wrangler api-token verify
   ```

3. **Test connection**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.cloudflare.com/client/v4/user/tokens/verify
   ```

#### Performance Issues

**Symptoms:**
- Slow queries
- Timeouts
- High latency

**Solutions:**

1. **Increase timeout**
   ```typescript
   const remoteDb = await remote(D1("main-db"), {
     profile: "prod",
     timeout: 120000  // 2 minutes
   });
   ```

2. **Use local tunnel for development**
   ```typescript
   const db = isDev ? await tunnel(D1("main-db")) : D1("main-db");
   ```

3. **Add connection pooling**
   ```typescript
   const dbPool = new Map();
   
   async function getDb(profile: string) {
     if (!dbPool.has(profile)) {
       dbPool.set(profile, await remote(D1("main-db"), { profile }));
     }
     return dbPool.get(profile);
   }
   ```

#### Port Already in Use

**Symptoms:**
```
Error: Address already in use
```

**Solutions:**

1. **Find process using port**
   ```bash
   lsof -i :8787
   ```

2. **Kill process**
   ```bash
   kill -9 <PID>
   ```

3. **Use different port**
   ```typescript
   tunnel(D1("main-db"), { localPort: 8788 })
   ```

---

## Performance Comparison

| Method | Latency | Security | Use Case |
|--------|---------|----------|----------|
| **Local Tunnel** | ~1ms | High | Development |
| **Remote Tunnel** | ~50ms | Medium | Debugging |
| **Direct Access** | ~200ms | Low | Production |
| **Local Only** | 0ms | Highest | Unit tests |

---

## Next Steps

- [Worker Configuration](./WORKER_CONFIGURATION.md) - Configure Workers with bindings
- [D1 Database Guide](./D1_DATABASE.md) - SQL database setup
- [KV Storage Guide](./KV_STORAGE.md) - Key-value storage patterns
- [Debugging Guide](./DEBUGGING.md) - Debug Alchemy applications
- [Testing Guide](./TESTING.md) - Test strategies and patterns

---

## Additional Resources

- [Official Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Alchemy Tunnel Provider](https://alchemy.run/providers/cloudflare/tunnel)
- [Alchemy Remote Bindings](https://alchemy.run/concepts/remote-bindings/)
- [Alchemy Profiles](https://alchemy.run/concepts/profiles/)
