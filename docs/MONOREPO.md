# Monorepo Guide

Guide for scaling this project into a monorepo with multiple interconnected applications using Alchemy and Turborepo.

Based on the [official Alchemy Turborepo guide](https://alchemy.run/guides/turborepo/).

## Overview

This guide shows how to:
1. Restructure the current single-app project into a monorepo
2. Create separate `backend` and `frontend` applications
3. Set up Turborepo for task orchestration
4. Import and bind applications together
5. Deploy, develop, and destroy in dependency order

## Why Monorepo?

**Benefits:**
- **Separation of Concerns**: Frontend and backend as independent apps
- **Shared Code**: Share types, utilities, and configurations
- **Dependency Management**: Automatic build ordering
- **Independent Deployment**: Deploy frontend/backend separately
- **Better Scalability**: Add more apps (admin, mobile API, etc.)

## Project Structure

Transform the current structure into a monorepo:

```
my-monorepo/
├── apps/
│   ├── backend/              # API backend
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── workflow.ts
│   │   │   └── durable-object.ts
│   │   ├── alchemy.run.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/             # React frontend
│       ├── src/
│       │   ├── index.html
│       │   ├── main.tsx
│       │   └── components/
│       ├── alchemy.run.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/               # Shared types & utils
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── database/             # Database schema
│       ├── src/
│       │   ├── schema.ts
│       │   └── migrations/
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json               # Turborepo configuration
├── package.json             # Root package.json
├── bun.lock
└── README.md
```

## Step-by-Step Setup

### 1. Initialize Turborepo

```bash
# Install Turborepo
bun add -D turbo

# Create workspace structure
mkdir -p apps/backend apps/frontend packages/shared packages/database
```

### 2. Configure Root Package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "deploy": "turbo deploy",
    "destroy": "turbo destroy",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "bun@1.1.0"
}
```

### 3. Configure Turborepo

Create `turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["lib/**", "dist/**"]
    },
    "deploy": {
      "dependsOn": ["^deploy"],
      "cache": false
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "backend#destroy": {
      "dependsOn": ["frontend#destroy"],
      "cache": false
    },
    "frontend#destroy": {
      "cache": false
    }
  }
}
```

**Key Points:**
- ⚠️ **`cache: false`** for `deploy` and `destroy` (prevents incorrect caching)
- ⚠️ **Reverse order** for destroy: `frontend → backend`
- ✅ **Dependency order** for deploy: `backend → frontend`
- ✅ **Persistent dev** tasks for long-running processes

### 4. Backend App Setup

**apps/backend/package.json:**

```json
{
  "name": "backend",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b",
    "dev": "alchemy dev --app backend",
    "deploy": "alchemy deploy --app backend",
    "destroy": "alchemy destroy --app backend"
  },
  "exports": {
    ".": {
      "bun": "./src/index.ts",
      "import": "./lib/src/index.js"
    },
    "./alchemy": {
      "bun": "./alchemy.run.ts",
      "import": "./lib/alchemy.run.js",
      "types": "./alchemy.run.ts"
    }
  },
  "dependencies": {
    "alchemy": "catalog:",
    "drizzle-orm": "^0.29.0",
    "database": "workspace:*"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241218.0",
    "typescript": "^5.3.0"
  }
}
```

**apps/backend/alchemy.run.ts:**

```typescript
import alchemy from "alchemy";
import { Worker, D1Database, R2Bucket, Queue, KVNamespace } from "alchemy/cloudflare";
import path from "node:path";

const app = await alchemy("backend");

// Resources
const db = await D1Database("db", { name: "backend-db" });
const storage = await R2Bucket("storage", { name: "backend-storage" });
const jobs = await Queue("jobs", { name: "backend-jobs" });
const cache = await KVNamespace("cache", { name: "backend-cache" });

// Backend Worker
export const backend = await Worker("api", {
  // ⚠️ IMPORTANT: Use import.meta.dirname for monorepo compatibility
  entrypoint: path.join(import.meta.dirname, "src", "server.ts"),
  bindings: {
    DB: db,
    STORAGE: storage,
    JOBS: jobs,
    CACHE: cache,
    API_KEY: alchemy.secret(process.env.API_KEY),
  },
});

console.log({ backendUrl: backend.url });

await app.finalize();
```

**Key Point:** Use `import.meta.dirname` to make entrypoint work from any directory.

### 5. Frontend App Setup

**apps/frontend/package.json:**

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -b",
    "dev": "alchemy dev --app frontend",
    "deploy": "alchemy deploy --app frontend",
    "destroy": "alchemy destroy --app frontend"
  },
  "dependencies": {
    "alchemy": "catalog:",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "backend": "workspace:*",
    "shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

**apps/frontend/alchemy.run.ts:**

```typescript
import alchemy from "alchemy";
import { BunSPA } from "alchemy/cloudflare";
import { backend } from "backend/alchemy";

const app = await alchemy("frontend");

export const frontend = await BunSPA("website", {
  frontend: "src/index.html",
  entrypoint: "src/server.ts",
  bindings: {
    // Bind to backend Worker for RPC calls
    BACKEND: backend,
  },
});

console.log({
  frontendUrl: frontend.url,
  apiUrl: frontend.apiUrl,
});

await app.finalize();
```

**Key Feature:** Import `backend` from `backend/alchemy` and use as binding.

### 6. Shared Package Setup

**packages/shared/package.json:**

```json
{
  "name": "shared",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "bun": "./src/index.ts",
      "import": "./lib/index.js",
      "types": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc -b"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**packages/shared/src/types.ts:**

```typescript
// Shared types across frontend and backend
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
```

### 7. Database Package Setup

**packages/database/package.json:**

```json
{
  "name": "database",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "bun": "./src/index.ts",
      "import": "./lib/index.js",
      "types": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "generate": "drizzle-kit generate"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.3.0"
  }
}
```

Move `src/db/schema.ts` here for shared access.

## Development Workflow

### Starting Dev Servers

From the monorepo root:

```bash
# Start all dev servers in dependency order
bun dev
```

Turborepo TUI shows:
```
┌─ backend ─────────────────────┐
│ Backend API running...        │
│ URL: http://localhost:8787    │
└───────────────────────────────┘

┌─ frontend ────────────────────┐
│ Frontend running...           │
│ URL: http://localhost:3000    │
└───────────────────────────────┘
```

### Deploying Applications

```bash
# Deploy all apps in dependency order (backend → frontend)
bun run deploy
```

### Destroying Resources

```bash
# Destroy all apps in reverse order (frontend → backend)
bun run destroy
```

### Working on Single App

```bash
# Work on backend only
cd apps/backend
bun dev

# Work on frontend only
cd apps/frontend
bun dev
```

## Read Mode

When importing `backend/alchemy`, it runs in **Read Mode**:

- ✅ Resources are read from state
- ❌ Resources are not created/updated/deleted
- ✅ Perfect for getting URLs and bindings
- ✅ Prevents accidental duplicate deployments

**Enable Read Mode:**
```bash
alchemy dev --app frontend  # backend runs in read mode
alchemy deploy --app frontend  # backend runs in read mode
```

## Service Bindings

### Backend to Backend

```typescript
// apps/backend/alchemy.run.ts
export const api = await Worker("api", { ... });
export const processor = await Worker("processor", { ... });

// Bind processor to api
export const api = await Worker("api", {
  bindings: {
    PROCESSOR: processor,  // RPC calls
  },
});
```

### Frontend to Backend

```typescript
// apps/frontend/alchemy.run.ts
import { backend } from "backend/alchemy";

export const frontend = await BunSPA("website", {
  bindings: {
    BACKEND: backend,  // Service binding for RPC
  },
});
```

### Using Service Bindings

```typescript
// In your frontend Worker
export default {
  async fetch(request: Request, env: Env) {
    // RPC call to backend
    const response = await env.BACKEND.fetch(request);
    return response;
  },
};
```

## Catalog Dependencies

Use catalog for consistent versions across apps:

**Root package.json:**
```json
{
  "pnpm": {
    "catalog": {
      "alchemy": "^0.76.1",
      "react": "^18.2.0",
      "typescript": "^5.3.0"
    }
  }
}
```

**App package.json:**
```json
{
  "dependencies": {
    "alchemy": "catalog:",
    "react": "catalog:"
  }
}
```

## CI/CD for Monorepo

**Update `.github/workflows/deploy.yml`:**

```yaml
name: Deploy Monorepo

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Deploy all apps
        run: bun run deploy
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Advantages of Monorepo Structure

### 1. Independent Scaling
- Deploy backend without redeploying frontend
- Scale backend Workers independently
- Add new services (admin panel, mobile API)

### 2. Type Safety
- Shared types between frontend/backend
- Import types from packages
- No type duplication

### 3. Code Reuse
- Shared utilities in `packages/shared`
- Database schema in `packages/database`
- No code duplication

### 4. Better DX
- Single `bun install` for all apps
- Turborepo parallel execution
- TUI for monitoring multiple apps
- Fast incremental builds

### 5. Dependency Management
- Automatic build order
- Prevent circular dependencies
- Clear app boundaries

## Migration from Single App

### Step 1: Backup Current Project
```bash
cp -r . ../backup-single-app
```

### Step 2: Create Monorepo Structure
```bash
mkdir -p apps/backend apps/frontend packages/shared packages/database
```

### Step 3: Move Backend Code
```bash
mv src/backend apps/backend/src
mv src/db packages/database/src
mv alchemy.run.ts apps/backend/
```

### Step 4: Move Frontend Code
```bash
mv src/frontend apps/frontend/src
```

### Step 5: Set Up Packages
Create package.json files for each app and package.

### Step 6: Install Dependencies
```bash
bun install
```

### Step 7: Test
```bash
bun dev
bun run deploy
```

## Troubleshooting

### Backend Not Found

```bash
Error: Cannot find module 'backend/alchemy'
```

**Solution:** Ensure `backend/package.json` exports `./alchemy`:
```json
"exports": {
  "./alchemy": {
    "bun": "./alchemy.run.ts",
    "import": "./lib/alchemy.run.js"
  }
}
```

### Wrong Destruction Order

```bash
Error: Cannot destroy backend (frontend depends on it)
```

**Solution:** Configure reverse order in `turbo.json`:
```json
{
  "tasks": {
    "backend#destroy": {
      "dependsOn": ["frontend#destroy"]
    }
  }
}
```

### Entrypoint Not Found

```bash
Error: ENOENT: no such file or directory 'src/server.ts'
```

**Solution:** Use `import.meta.dirname`:
```typescript
entrypoint: path.join(import.meta.dirname, "src", "server.ts")
```

### Cache Issues

```bash
Warning: deploy task was cached
```

**Solution:** Set `cache: false` in turbo.json:
```json
{
  "tasks": {
    "deploy": {
      "cache": false
    }
  }
}
```

## Best Practices

1. **Use `--app` flag** for multi-app scenarios
2. **Export alchemy.run.ts** for imports
3. **Use `import.meta.dirname`** for paths
4. **Disable cache** for deploy/destroy
5. **Configure destroy order** (reverse of deploy)
6. **Share types** via packages
7. **Use service bindings** for inter-app communication
8. **Test locally** before deploying

## Resources

- [Official Alchemy Turborepo Guide](https://alchemy.run/guides/turborepo/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Alchemy Apps & Stages](https://alchemy.run/concepts/apps-stages/)
- [Workspace Packages](https://bun.sh/docs/install/workspaces)

---

**Next Steps:**
1. Set up monorepo structure
2. Configure Turborepo
3. Split into apps
4. Test dev/deploy/destroy
5. Add more services as needed

