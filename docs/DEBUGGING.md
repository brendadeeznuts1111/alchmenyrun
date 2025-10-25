# Debugging Guide

Complete guide to debugging your Alchemy Cloudflare project with VSCode, breakpoints, and inspector tools. Based on the [official Alchemy debugging guide](https://alchemy.run/guides/debugging.md).

## 🎯 Overview

This project supports multiple debugging approaches:
- **VSCode Debugging** - Breakpoints and step-through debugging (official Alchemy method)
- **Console Logging** - Traditional logging approach
- **Cloudflare Dashboard** - Production debugging
- **Local Development** - Miniflare emulation debugging

## 🔧 Official VSCode Debugging Setup

### 1. Install Required VSCode Extensions

Install these essential extensions for debugging:

```bash
# Required Extensions
- bun extension for VSCode (https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
- Command Variable extension (https://marketplace.visualstudio.com/items?itemName=rioj7.command-variable)
- TypeScript and JavaScript Language Features
```

> **Tip**: Even if debugging node projects, you should use the bun extension. This is because the bun extension allows for more flexibility in how debuggers are connected.

### 2. Configure VSCode Tasks

Create `.vscode/tasks.json` with the official Alchemy configuration:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "alchemy-dev",
      "type": "shell",
      "command": "bun",
      "args": ["alchemy", "dev", "--inspect-wait"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": ".*",
          "endsPattern": "Waiting for inspector to connect.*"
        }
      }
    },
    {
      "label": "alchemy-run-debug",
      "type": "shell",
      "command": "bun",
      "args": ["run", "./alchemy.run.ts", "--dev", "--inspect-wait"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": ".*",
          "endsPattern": "Waiting for inspector to connect.*"
        }
      }
    },
    {
      "label": "alchemy-deploy-debug",
      "type": "shell",
      "command": "bun",
      "args": ["run", "./alchemy.run.ts", "--inspect-wait"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": ".*",
          "endsPattern": "Waiting for inspector to connect.*"
        }
      }
    }
  ]
}
```

### 3. Configure VSCode Launch

Create `.vscode/launch.json` with the official Alchemy configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Alchemy Dev",
      "type": "bun",
      "request": "attach",
      "url": "${input:debugUrl}",
      "stopOnEntry": false,
      "preLaunchTask": "alchemy-dev"
    },
    {
      "name": "Debug Alchemy Run",
      "type": "bun",
      "request": "attach",
      "url": "${input:debugUrl}",
      "stopOnEntry": false,
      "preLaunchTask": "alchemy-run-debug"
    },
    {
      "name": "Debug Alchemy Deploy",
      "type": "bun",
      "request": "attach",
      "url": "${input:debugUrl}",
      "stopOnEntry": false,
      "preLaunchTask": "alchemy-deploy-debug"
    }
  ],
  "inputs": [
    {
      "id": "debugUrl",
      "type": "command",
      "command": "extension.commandvariable.file.content",
      "args": {
        "fileName": "${workspaceFolder}/.alchemy/.debugger-urls",
        "key": "alchemy.run.ts"
      }
    }
  ]
}
```

## 🔍 Debugging Flags

Alchemy supports multiple debugging flags on `alchemy dev`, `alchemy deploy`, and `alchemy destroy`:

### `--inspect`
- Starts the debugger and immediately begins execution
- Use when you want to debug from the start

### `--inspect-wait` (Recommended)
- Starts the debugger and waits for VSCode to attach
- Best for debugging specific parts of your code

### `--inspect-brk`
- Starts the debugger and breaks on the first line
- Useful for stepping through initialization code

## 🚀 Using the Debugger

### 1. Start Debugging

1. Open your `alchemy.run.ts` file
2. Set breakpoints by clicking in the gutter (or press F9)
3. Press `F5` or go to "Run and Debug" panel
4. Select "Debug Alchemy Dev"
5. The debugger will attach and stop at your breakpoints

### 2. Example Debugging Session

```typescript
// alchemy.run.ts
import alchemy from "alchemy";

const app = await alchemy("cloudflare-demo");

// Set breakpoint here to inspect resource creation
const db = await D1Database("demo-db", {
  name: "demo-database",
});

// Set breakpoint here to inspect worker configuration
const worker = await Worker("demo-worker", {
  name: "demo-worker",
  script: "./src/backend/server.ts",
  bindings: {
    DB: db,
    // ... other bindings
  },
});

// Set breakpoint here to inspect finalization
await app.finalize();
```

### 3. Debugging Resource Creation

When debugging resource creation, you can inspect:

```typescript
// Debug resource properties
const db = await D1Database("demo-db", {
  name: "demo-database",
  // Set breakpoint to inspect:
  // - Resource configuration
  // - Environment variables
  // - Binding setup
});

console.log('Database resource created:', {
  name: db.name,
  type: db.type,
  bindings: db.bindings
});
```

## 🐛 Additional Debugging Techniques

### 1. Console Logging

Use structured logging for better debugging:

```typescript
// Create a debug utility
const debug = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  }
};

// Usage in alchemy.run.ts
debug.log('Creating D1 database', { name: "demo-db" });
debug.log('Creating Worker', { script: "./src/backend/server.ts" });
```

### 2. Environment-Specific Debugging

```typescript
// alchemy.run.ts
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log('Development mode - enabling verbose logging');
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    ALCHEMY_PROFILE: process.env.ALCHEMY_PROFILE,
  });
}
```

### 3. Resource State Debugging

```typescript
// Debug resource state during creation
const worker = await Worker("demo-worker", {
  name: "demo-worker",
  script: "./src/backend/server.ts",
  bindings: {
    DB: db,
    STORAGE: storage,
  },
});

// Debug the created resource
console.log('Worker created:', {
  name: worker.name,
  scriptPath: worker.script,
  bindings: Object.keys(worker.bindings || {}),
});
```

## 🔍 Application-Level Debugging

### 1. Worker Request Debugging

```typescript
// src/backend/server.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Debug incoming requests
    console.log('Request received:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
    
    // Debug specific routes
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/users')) {
      console.log('Users API called - debugging user operations');
      // Set breakpoint here in VSCode
    }
    
    // ... rest of handler
  }
};
```

### 2. Database Operation Debugging

```typescript
// Debug D1 operations
async function debugUserCreation(db: D1Database, userData: any) {
  console.log('Creating user:', userData);
  
  try {
    const start = Date.now();
    const result = await db.prepare(`
      INSERT INTO users (email, name, created_at) 
      VALUES (?, ?, ?)
    `).bind(userData.email, userData.name, new Date().toISOString()).run();
    
    const duration = Date.now() - start;
    console.log('User created successfully:', {
      success: result.success,
      meta: result.meta,
      duration: `${duration}ms`
    });
    
    return result;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}
```

### 3. Resource Binding Debugging

```typescript
// Debug resource bindings in your worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Debug available bindings
    console.log('Available environment bindings:', {
      hasDB: !!env.DB,
      hasStorage: !!env.STORAGE,
      hasQueue: !!env.JOBS,
      hasKV: !!env.CACHE,
      dbType: env.DB?.constructor?.name,
      storageType: env.STORAGE?.constructor?.name,
    });
    
    // ... rest of handler
  }
};
```

## 🧪 Testing and Debugging

### 1. Unit Test Debugging

```typescript
// src/tests/debug.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Alchemy Debugging Tests', () => {
  it('should debug resource creation', async () => {
    // Set breakpoint here to debug test setup
    console.log('Starting resource creation test');
    
    // Mock environment for testing
    const mockEnv = {
      DB: mockD1Database(),
      STORAGE: mockR2Bucket(),
    };
    
    // Test your functions with debugging
    const result = await createUser({ email: 'test@example.com' }, mockEnv);
    
    // Set breakpoint to inspect results
    console.log('Test result:', result);
    expect(result).toBeDefined();
  });
});
```

### 2. Integration Test Debugging

```typescript
// src/tests/integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Integration Debugging', () => {
  let worker: Worker;
  
  beforeAll(async () => {
    // Start worker with debugging enabled
    worker = await workerFactory();
    console.log('Worker started for integration testing');
  });
  
  it('should debug API endpoints', async () => {
    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', name: 'Test' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Debug the request/response cycle
    console.log('Sending test request:', {
      method: request.method,
      url: request.url,
      body: await request.text()
    });
    
    const response = await worker.fetch(request);
    const result = await response.json();
    
    console.log('API response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: result
    });
    
    expect(response.status).toBe(200);
  });
});
```

## 🌐 Production Debugging

### 1. Cloudflare Dashboard

Access real-time logs and metrics:

1. **Workers Dashboard**: https://dash.cloudflare.com/workers
2. **Real-time Logs**: View live request logs
3. **Analytics**: Monitor performance and errors
4. **Tail Workers**: `wrangler tail [worker-name]`

### 2. Production Logging

```typescript
// Production-ready logging
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

function createLogger(env: Env) {
  return {
    info: (message: string, context?: Record<string, any>) => {
      const log: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        context,
        requestId: env.REQUEST_ID
      };
      
      console.log(JSON.stringify(log));
    },
    
    error: (message: string, error?: Error, context?: Record<string, any>) => {
      const log: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        context: {
          ...context,
          error: error?.message,
          stack: error?.stack
        },
        requestId: env.REQUEST_ID
      };
      
      console.error(JSON.stringify(log));
    }
  };
}
```

## 🛠️ Common Debugging Scenarios

### 1. "Alchemy Dev Not Starting"

```bash
# Check if alchemy dev starts with debugging
bun alchemy dev --inspect-wait

# Check for syntax errors in alchemy.run.ts
bun --check alchemy.run.ts

# Verify dependencies
bun install
```

### 2. "Debugger Not Attaching"

1. Ensure VSCode extensions are installed
2. Check that `.vscode/tasks.json` and `.vscode/launch.json` exist
3. Verify the `.alchemy/.debugger-urls` file is created
4. Try restarting VSCode

### 3. "Breakpoints Not Working"

```typescript
// Add explicit debugger statement
const worker = await Worker("demo-worker", {
  name: "demo-worker",
  script: "./src/backend/server.ts",
  bindings: { DB: db },
});

debugger; // Force breakpoint
console.log('Worker created:', worker.name);
```

### 4. "Resource Creation Fails"

```typescript
// Debug resource creation step by step
try {
  console.log('Step 1: Creating database');
  const db = await D1Database("demo-db", { name: "demo-database" });
  console.log('Database created:', db.name);
  
  console.log('Step 2: Creating storage');
  const storage = await R2Bucket("demo-storage", { name: "demo-storage" });
  console.log('Storage created:', storage.name);
  
  console.log('Step 3: Creating worker');
  const worker = await Worker("demo-worker", {
    name: "demo-worker",
    script: "./src/backend/server.ts",
    bindings: { DB: db, STORAGE: storage },
  });
  console.log('Worker created:', worker.name);
  
} catch (error) {
  console.error('Resource creation failed:', error);
  throw error;
}
```

## 📊 Performance Debugging

### 1. Resource Creation Timing

```typescript
// Add timing to resource creation
const start = Date.now();

const db = await D1Database("demo-db", { name: "demo-database" });
const dbTime = Date.now() - start;

const storage = await R2Bucket("demo-storage", { name: "demo-storage" });
const storageTime = Date.now() - start - dbTime;

const worker = await Worker("demo-worker", {
  name: "demo-worker",
  script: "./src/backend/server.ts",
  bindings: { DB: db, STORAGE: storage },
});
const workerTime = Date.now() - start - dbTime - storageTime;

console.log('Resource creation timing:', {
  database: `${dbTime}ms`,
  storage: `${storageTime}ms`,
  worker: `${workerTime}ms`,
  total: `${Date.now() - start}ms`
});
```

### 2. Request Performance

```typescript
// Add performance monitoring to your worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const start = Date.now();
    
    try {
      // Your handler logic
      const response = await handleRequest(request, env);
      
      const duration = Date.now() - start;
      console.log(`Request completed in ${duration}ms:`, {
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Request failed in ${duration}ms:`, {
        method: request.method,
        path: new URL(request.url).pathname,
        error: error.message
      });
      
      throw error;
    }
  }
};
```

## 🔧 Debugging Commands

### Essential Commands

```bash
# Start development with debugging (recommended)
bun alchemy dev --inspect-wait

# Start debugging with immediate execution
bun alchemy dev --inspect

# Start debugging with break on first line
bun alchemy dev --inspect-brk

# Debug deployment
bun alchemy deploy --inspect-wait

# Debug destruction
bun alchemy destroy --inspect-wait

# Run alchemy.run.ts directly with debugging
bun run ./alchemy.run.ts --dev --inspect-wait

# Tail production logs
wrangler tail your-worker-name

# Check worker status
curl -I https://your-worker.workers.dev
```

### VSCode Shortcuts

- `F5` - Start debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+F5` - Restart debugging

## 📝 Debugging Checklist

### Before Debugging
- [ ] Install bun and Command Variable VSCode extensions
- [ ] Create `.vscode/tasks.json` with official configuration
- [ ] Create `.vscode/launch.json` with official configuration
- [ ] Ensure `.alchemy/.debugger-urls` will be created
- [ ] Set breakpoints in your code

### During Debugging
- [ ] Use `--inspect-wait` for best debugging experience
- [ ] Set meaningful breakpoints in `alchemy.run.ts`
- [ ] Use console.log for additional debugging
- [ ] Check the VSCode Debug Console for output
- [ ] Inspect variables in the debugger

### Production Debugging
- [ ] Check Cloudflare Dashboard logs
- [ ] Use `wrangler tail` for real-time logs
- [ ] Monitor error rates and performance
- [ ] Use structured logging in production
- [ ] Review deployment logs

---

**Official Documentation:**
- [Alchemy Debugging Guide](https://alchemy.run/guides/debugging.md) - Official debugging documentation
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local development setup
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing strategies
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [CHANGELOG.md](./CHANGELOG.md) - Project history and changes
