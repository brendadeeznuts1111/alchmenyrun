/// <reference types="node" />
import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { Database } from "./packages/@alch/blocks/src/database";
import {
  Bucket,
  KV,
  Queue as StageQueue,
} from "./packages/@alch/blocks/src/storage";
import {
  DurableObject,
  AlchemyWorkflow,
} from "./packages/@alch/blocks/src/durable";
import { GithubAgent } from "./src/do/github-agent";
// Cloudflare API token for other operations (optional when using OAuth profile)
const cfToken = process.env.CLOUDFLARE_API_TOKEN;
// ========================================
// APPLICATION SCOPE
// ========================================
// Root scope: cloudflare-demo
// State directory: .alchemy/cloudflare-demo/
const app = await alchemy("cloudflare-demo", {
  phase: process.env.PHASE || "up",
  password:
    process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
  stateStore: (scope) => new CloudflareStateStore(scope),
  profile: process.env.ALCHEMY_PROFILE || "default",
});
// Note: API token is passed directly to each resource via apiToken parameter
// ========================================
// RESOURCE SHARING
// ========================================
// Shared resources object to pass between scopes
const resources = {};
// ========================================
// NESTED SCOPES
// ========================================
// Database scope - Organizes all data storage resources
await alchemy.run("database", async () => {
  try {
    // D1 Database for user and file storage
    const db = await Database("alchemy-demo-db", {
      adopt: true, // Adopt existing database if it exists
      apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
    });
    // Share with other scopes
    resources.db = db;
  } catch (error) {
    // If D1 creation fails, it's likely due to OAuth profile authentication
    // Provide helpful error message with API token setup instructions
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("API token") ||
      errorMessage.includes("authentication")
    ) {
      throw new Error(`
🚨 D1 DATABASE CREATION FAILED

The error occurred because D1 database creation requires API token authentication.
OAuth profiles from 'wrangler login' don't support D1 operations.

🔧 SOLUTION:

1. Create a Cloudflare API token with D1 permissions:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions: Zone:Zone:Read, Account:Cloudflare D1:Edit, Account:Account Settings:Read

2. Set the environment variable:
   export CLOUDFLARE_API_TOKEN="your_api_token_here"

3. Or create a .env file:
   echo "CLOUDFLARE_API_TOKEN=your_api_token_here" >> .env

4. Then retry deployment:
   bun run deploy --stage $USER

Original error: ${errorMessage}
      `);
    }
    throw error;
  }
});
// Storage scope - Organizes file and object storage
await alchemy.run("file-storage", async () => {
  // R2 Bucket for file storage (stage-unique)
  const storage = await Bucket("alchemy-demo-storage", {
    adopt: true,
    apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
  });
  // KV Namespace for caching (stage-unique)
  const cache = await KV("alchemy-demo-cache", {
    adopt: true,
    apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
  });
  // KV Namespace for MCP server (stage-unique)
  const mcpKv = await KV("alchemy-demo-mcp", {
    adopt: true,
    apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
  });
  // Share with other scopes
  resources.storage = storage;
  resources.cache = cache;
  resources.mcpKv = mcpKv;
});
// Compute scope - Organizes processing and workflow resources
await alchemy.run("compute", async () => {
  // Queue for async job processing (stage-unique)
  const jobs = await StageQueue("alchemy-demo-jobs", {
    adopt: true,
    apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
  });
  // Share with other scopes
  resources.jobs = jobs;
});
// ========================================
// APPLICATION RESOURCES
// ========================================
// ========================================
// PHASE 1: Create worker WITHOUT Durable Object bindings
// ========================================
// The worker exports ChatRoom and OnboardingWorkflow classes,
// but we can't bind them yet because the namespaces don't exist.
export const website = await Worker("website", {
  entrypoint: "src/backend/server.ts",
  adopt: true,
  apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
  bindings: {
    // Database bindings
    DB: resources.db,
    // Storage bindings
    STORAGE: resources.storage,
    CACHE: resources.cache,
    // Compute bindings
    JOBS: resources.jobs,
    // Note: CHAT and WORKFLOW bindings added in Phase 2
    // Secret binding
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"),
  },
  // Production-ready Worker features
  crons: [
    "0 2 * * *", // Daily cleanup at 2 AM UTC
  ],
  placement: {
    mode: "smart", // Enable smart placement for better performance
  },
  observability: {
    enabled: true,
    logs: {
      enabled: true,
      headSamplingRate: 1.0, // Log all requests in production
    },
    traces: {
      enabled: true,
      headSamplingRate: 0.1, // Sample 10% of traces for performance
    },
  },
  limits: {
    cpu_ms: 50000, // 50 second CPU limit
  },
  // Custom domains for production (uncomment when domain is available)
  // domains: [
  //   process.env.CUSTOM_DOMAIN || "your-app.com"
  // ],
  // Routes for production deployment (only when zone ID is configured)
  ...(process.env.CLOUDFLARE_ZONE_ID
    ? {
        routes: [
          // API routes
          { pattern: "/api/*", zoneId: process.env.CLOUDFLARE_ZONE_ID },
          // Catch-all for SPA routing
          { pattern: "/*", zoneId: process.env.CLOUDFLARE_ZONE_ID },
        ],
      }
    : {}),
});
// ========================================
// PHASE 2: Create Durable Object namespaces and update worker
// ========================================
// Now that the worker exists, we can create namespaces that reference it
const chatNamespace = await DurableObject("chat", {
  className: "ChatRoom",
  scriptName: "website", // References the worker created above
});
const workflowNamespace = await AlchemyWorkflow("onboarding", {
  className: "OnboardingWorkflow",
  scriptName: "website", // References the worker created above
});
// Update the worker with Durable Object bindings
// Note: BunSPA doesn't support updates, so we document this limitation
// The bindings will be available after manual configuration or next deployment
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

Built from commit \`${process.env.GITHUB_SHA?.slice(0, 7)}\`

---
<sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}
// ========================================
// MICRO-RFC-005: DO-Backed GitHub Webhooks
// ========================================
const ghAgentDO = await DurableObject("GithubAgent", { class: GithubAgent });
await Worker("github-webhook", {
  entrypoint: "./workers/github-webhook/index.ts",
  bindings: {
    GITHUB_DO: ghAgentDO,
    TG_TOKEN: alchemy.secret(process.env.TG_TOKEN || ""),
    COUNCIL_ID: process.env.TELEGRAM_COUNCIL_ID || "",
    TOPIC_MOBILE: process.env.TELEGRAM_TOPIC_MOBILE || "",
    TOPIC_FORUM: process.env.TELEGRAM_TOPIC_FORUM || "",
  },
  profile: "ci",
});
// Finalize the app (triggers deletion of orphaned resources)
await app.finalize();
