/// <reference types="node" />
import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";

// Cloudflare API token for operations (optional when using OAuth profile)
const cfToken = process.env.CLOUDFLARE_API_TOKEN;

// ========================================
// APPLICATION SCOPE
// ========================================
const app = await alchemy("demo-app", {
  phase: (process.env.PHASE as "up" | "destroy" | "read") || "up",
  password:
    process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
  profile: process.env.ALCHEMY_PROFILE || "default",
});

// ========================================
// PRODUCT PAGE WORKER
// ========================================
export const productPage = await Worker("product-page", {
  name: "alchemy-tunnel-product-page",
  entrypoint: "./src/api.ts",
  adopt: true,
  apiToken: cfToken ? alchemy.secret(cfToken) : undefined,
});

console.log({
  productPageUrl: productPage.url,
});

// -------------  PREVIEW COMMENT  -------------
// Automatically post preview URLs to PR comments
if (process.env.PULL_REQUEST) {
  const { GitHubComment } = await import("alchemy/github");
  await GitHubComment("preview-comment", {
    owner: "brendadeeznuts1111",
    repository: "alchmenyrun",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Product Page Preview Deployed

Your Alchemy Cloudflare Tunnel product page has been deployed:

**🌐 Product Page:** ${productPage.url}

Built from commit \`${process.env.GITHUB_SHA?.slice(0, 7)}\`

---
<sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

// Finalize the app (triggers deletion of orphaned resources)
await app.finalize();
