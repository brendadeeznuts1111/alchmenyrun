/// <reference types="node" />
import alchemy from "alchemy";
import {
  BunSPA,
  D1Database,
  R2Bucket,
  Queue,
  KVNamespace,
  DurableObjectNamespace,
  Workflow,
  Worker,
} from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

// ========================================
// APPLICATION SCOPE
// ========================================
// Root scope: cloudflare-demo
// State directory: .alchemy/cloudflare-demo/
const app = await alchemy("cloudflare-demo", {
  phase: (process.env.PHASE as "up" | "destroy" | "read") || "up",
  password:
    process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
  stateStore: (scope) => new CloudflareStateStore(scope),
  // Profile selection (default, prod, staging, ci)
  // - Local dev: uses "default" profile (OAuth)
  // - CI/CD: uses "ci" profile (API token from GitHub secrets)
  // - Production: uses "prod" profile (API token)
  profile: process.env.ALCHEMY_PROFILE || "default",
});

// Note: Resources will use the profile's credentials automatically
// No need to pass apiToken to each resource when using profiles

// ========================================
// RESOURCE SHARING
// ========================================
// Shared resources object to pass between scopes
const resources = {} as any;

// ========================================
// NESTED SCOPES
// ========================================

// Database scope - Organizes all data storage resources
await alchemy.run("database", async () => {
  // D1 Database for user and file storage
  const db = await D1Database("db", {
    name: "alchemy-demo-db",
  });

  // Share with other scopes
  resources.db = db;
});

// Storage scope - Organizes file and object storage
await alchemy.run("file-storage", async () => {
  // R2 Bucket for file storage
  const storage = await R2Bucket("storage", {
    name: "alchemy-demo-storage",
    adopt: true,
  });

  // KV Namespace for caching
  const cache = await KVNamespace("cache", {
    adopt: true,
  });

  // KV Namespace for MCP server (rate limiting & feature flags)
  const mcpKv = await KVNamespace("mcp-kv", {
    adopt: true,
  });

  // Share with other scopes
  resources.storage = storage;
  resources.cache = cache;
  resources.mcpKv = mcpKv;
});

// Compute scope - Organizes processing and workflow resources
await alchemy.run("compute", async () => {
  // Queue for async job processing
  const jobs = await Queue("jobs", {
    name: "alchemy-demo-jobs",
    adopt: true,
  });

  // Define Durable Object class for real-time chat
  // Temporarily disabled for dev mode
  // const ChatDurableObject = await DurableObjectNamespace("ChatDO", {
  //   className: "ChatRoom",
  //   scriptName: "website", // Use the bound worker script
  // });

  // Share with other scopes
  resources.jobs = jobs;
  // resources.ChatDurableObject = ChatDurableObject;
  // resources.OnboardingWorkflow = OnboardingWorkflow;
});

// ========================================
// APPLICATION RESOURCES
// ========================================

// Main website application (uses resources from nested scopes)
export const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  bindings: {
    // Database bindings
    DB: resources.db,

    // Storage bindings
    STORAGE: resources.storage,
    CACHE: resources.cache,

    // Compute bindings
    JOBS: resources.jobs,
    // CHAT: resources.ChatDurableObject,
    // WORKFLOW: resources.OnboardingWorkflow,

    // Secret binding
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"),
  },
});

// Create Production MCP Worker
// Temporarily disabled for dev mode
// export const mcpWorker = await Worker("mcp-worker", {
//   name: "mcp-server",
//   entrypoint: "./src/mcp/index.ts",
//   bindings: {
//     DB: db,
//     STORAGE: storage,
//     JOBS: jobs,
//     CACHE: cache,
//     CHAT: ChatDurableObject,
//     WORKFLOW: OnboardingWorkflow,
//     MCP_KV: mcpKv,
//     // MCP Secrets
//     MCP_SHARED_SECRET: alchemy.secret(process.env.MCP_SHARED_SECRET || ""),
//     MCP_JWT_SECRET: alchemy.secret(process.env.MCP_JWT_SECRET || ""),
//     ENVIRONMENT: process.env.ENVIRONMENT || "production",
//   },
//   routes: [
//     {
//       pattern: "mcp.example.com/*",
//       customDomain: true
//     }
//   ]
// });

console.log({
  url: website.url,
  apiUrl: website.apiUrl,
  // mcpUrl: mcpWorker.url,
});

// -------------  PREVIEW COMMENT  -------------
// Automatically post preview URLs to PR comments
if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "brendadeeznuts1111", // Your GitHub username
    repository: "alchmenyrun", // Your repo name
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**🌐 Website:** ${website.url}  
**📡 API:** ${website.apiUrl}

Built from commit \`${process.env.GITHUB_SHA?.slice(0, 7)}\`

---
<sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

// Finalize the app (triggers deletion of orphaned resources)
await app.finalize();
