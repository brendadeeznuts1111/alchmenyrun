import alchemy from "alchemy";
import { BunSPA, D1Database, R2Bucket, Queue, KVNamespace, DurableObjectNamespace, Workflow, Worker } from "alchemy/cloudflare";

// Initialize the app with default state store and encryption password
// Password is required when using alchemy.secret()
const app = await alchemy("cloudflare-demo", {
  password: process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
});

// Create D1 Database for user and file storage
const db = await D1Database("db", {
  name: "cloudflare-demo-db",
});

// Create R2 Bucket for file storage
const storage = await R2Bucket("storage", {
  name: "cloudflare-demo-storage",
});

// Create Queue for async job processing
const jobs = await Queue("jobs", {
  name: "cloudflare-demo-jobs",
});

// Create KV Namespace for caching
const cache = await KVNamespace("cache", {
  name: "cloudflare-demo-cache",
});

// Create KV Namespace for MCP server (rate limiting & feature flags)
const mcpKv = await KVNamespace("mcp-kv", {
  name: "cloudflare-demo-mcp-kv",
});

// Define Durable Object class for real-time chat
// Note: Durable Objects require remote binding in dev (no local emulation)
// Temporarily disabled for dev mode
const ChatDurableObject = await DurableObjectNamespace("ChatDO", {
  name: "ChatDO",
  className: "ChatRoom",
  scriptPath: "./src/backend/durable-object.ts",
  dev: {
    remote: false,  // Disable for now
  },
});

// Define Workflow for multi-step orchestration
// Temporarily disabled for dev mode
const OnboardingWorkflow = await Workflow("OnboardingWorkflow", {
  name: "OnboardingWorkflow",
  scriptPath: "./src/backend/workflow.ts",
});

// Create BunSPA for full-stack frontend + backend
export const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  bindings: {
    DB: db,
    STORAGE: storage,
    JOBS: jobs,
    CACHE: cache,
    // Temporarily disabled for dev
    // CHAT: ChatDurableObject,
    // WORKFLOW: OnboardingWorkflow,
    // Secrets example
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

// Finalize the app (triggers deletion of orphaned resources)
await app.finalize();

