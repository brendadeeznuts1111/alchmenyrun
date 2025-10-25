import alchemy from "alchemy";
import { BunSPA, D1Database, R2Bucket, Queue, KVNamespace, DurableObjectNamespace, Workflow, Worker } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

// Initialize the app with Cloudflare state store and encryption password
// Password is required when using alchemy.secret()
const app = await alchemy("cloudflare-demo", {
  password: process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// Create D1 Database for user and file storage
const db = await D1Database("db", {
  name: "alchemy-demo-db",
  adopt: true, // Adopt existing database if it exists
});

// Create R2 Bucket for file storage
const storage = await R2Bucket("storage", {
  name: "alchemy-demo-storage",
  adopt: true,
});

// Create Queue for async job processing
const jobs = await Queue("jobs", {
  name: "alchemy-demo-jobs",
  adopt: true,
});

// Create KV Namespace for caching
const cache = await KVNamespace("cache", {
  name: "alchemy-demo-cache",
  adopt: true,
});

// Create KV Namespace for MCP server (rate limiting & feature flags)
const mcpKv = await KVNamespace("mcp-kv", {
  name: "alchemy-demo-mcp-kv",
  adopt: true,
});

// Define Durable Object class for real-time chat
// TEMPORARILY DISABLED: Investigating export requirements
// Note: Durable Objects may require a separate Worker script
// const ChatDurableObject = await DurableObjectNamespace("ChatDO", {
//   name: "ChatDO",
//   className: "ChatRoom",
//   scriptPath: "./src/backend/durable-object.ts",
//   dev: {
//     remote: true,  // Enable for production
//   },
// });

// Define Workflow for multi-step orchestration
const OnboardingWorkflow = await Workflow("OnboardingWorkflow", {
  name: "OnboardingWorkflow",
  className: "OnboardingWorkflow",
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
    // CHAT: ChatDurableObject,  // Temporarily disabled
    // WORKFLOW: OnboardingWorkflow,  // Temporarily disabled
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

// -------------  PREVIEW COMMENT  -------------
// Automatically post preview URLs to PR comments
if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "brendadeeznuts1111",          // Your GitHub username
    repository: "alchmenyrun",            // Your repo name
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
