/// <reference types="node" />
import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { DurableObject } from "./packages/@alch/blocks/src/durable";
import { GithubAgent } from "./src/do/github-agent";

const app = alchemy({
  name: "cloudflare-demo",
  stage: process.env.STAGE || "micro-rfc-005-clean",
  profile: process.env.PROFILE || "ci",
});

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

// Finalize the app
await app.finalize();
