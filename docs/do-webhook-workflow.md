# 🔄 DO-Backed Webhook Workflow

**Version:** 1.0
**Last Updated:** 2025-10-27
**Status:** Implementation Ready

---

## 📋 Quick Reference

Complete workflow to deploy Durable Object-backed GitHub webhooks using `./tgk` wrapper.
Zero downtime, thread-safe, forum-topic-separated.

### Prerequisites
```bash
export TELEGRAM_COUNCIL_ID="-10014..."          # super-group id
export TELEGRAM_TOPIC_MOBILE="25781"            # "mobile-app" topic
export TELEGRAM_TOPIC_FORUM="25782"             # "forum-polish" topic
```

### Core Flow
```bash
# 1. Create feature branch & stage
./tgk stage create micro-rfc-003-webhook-do

# 2. Write DO class, worker, IaC
# (see artefacts below)

# 3. Deploy with wrapper
./tgk deploy

# 4. Test concurrency
./tgk hook simulate mobile-app --pr 42 --action review

# 5. Promote to prod
./tgk stage promote pr-003 prod
```

---

## 📋 Artefacts

### 1. DO Class (`src/do/github-agent.ts`)

```typescript
import { DurableObject } from "cloudflare:workers";

export class GithubAgent {
  constructor(private ctx: DurableObjectState) {}

  async fetch(req: Request): Promise<Response> {
    const body: any = await req.json();
    const oldId = (await this.ctx.storage.get<number>("pinnedMsgId")) || 0;
    const tgToken = req.headers.get("X-Telegram-Bot-Token") as string;
    const topic   = req.headers.get("X-Telegram-Topic") as string;

    // 1. unpin old
    if (oldId) await tg("unpinChatMessage", { message_id: oldId }, tgToken, topic);

    // 2. send new card
    const send = await tg("sendMessage", {
      text: fmtCard(body),          // your existing formatter
      parse_mode: "MarkdownV2",
    }, tgToken, topic);

    // 3. pin new
    await tg("pinChatMessage", { message_id: send.result.message_id }, tgToken, topic);

    // 4. save state
    await this.ctx.storage.put("pinnedMsgId", send.result.message_id);
    return new Response("ok");
  }
}

// helpers
async function tg(method: string, p: any, token: string, topic: string) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...p, chat_id: env.COUNCIL_ID, message_thread_id: topic }),
  }).then(r => r.json<any>());
}
const fmtCard = (b: any) => `*${b.action}* \\#${b.number} – ${b.repo}`;
```

### 2. Worker Entry (`workers/github-webhook/index.ts`)

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const stream = url.pathname.split("/")[2] || "forum-polish"; // default
    const id = env.GITHUB_DO.idFromName(`gh_agent_${stream}`);
    return env.GITHUB_DO.get(id).fetch(req.clone(), {
      headers: {
        "X-Telegram-Bot-Token": env.TG_TOKEN,
        "X-Telegram-Topic": stream === "mobile-app" ? env.TOPIC_MOBILE : env.TOPIC_FORUM,
      },
    });
  },
};

export { GithubAgent } from "../../src/do/github-agent";
```

### 3. Alchemy IaC Patch (`alchemy.run.ts`)

```typescript
import { DurableObject, Worker } from "@alchemy/cloudflare";
import { GithubAgent } from "./src/do/github-agent";

const ghDO = await DurableObject("GithubAgent", { class: GithubAgent });

await Worker("github-webhook", {
  entrypoint: "./workers/github-webhook/index.ts",
  bindings: {
    GITHUB_DO: ghDO,
    TG_TOKEN: $env("TG_TOKEN"),
    COUNCIL_ID: $env("TELEGRAM_COUNCIL_ID"),
    TOPIC_MOBILE: $env("TELEGRAM_TOPIC_MOBILE"),
    TOPIC_FORUM:  $env("TELEGRAM_TOPIC_FORUM"),
  },
  // keep your existing stage/profile/scope mechanics
  profile: "ci",
  stage: $env("STAGE"),
});
```

---

## 📋 Step-by-Step Workflow

### 0. One-Time Prep

```bash
# Forum exists → copy topic IDs
export TELEGRAM_COUNCIL_ID="-10014..."          # super-group id
export TELEGRAM_TOPIC_MOBILE="25781"            # "mobile-app" topic
export TELEGRAM_TOPIC_FORUM="25782"             # "forum-polish" topic

# GitHub → Settings → Hooks → add webhook
# Payload URL: https://github-webhook.<your-worker>.workers.dev
# Content type: application/json
# Events: Pull requests, Reviews, Pushes
```

### 1. Create Feature Branch & Stage

```bash
# Use tgk wrapper (wraps git + alchemy stage creation)
./tgk stage create micro-rfc-003-webhook-do
# Exported: STAGE=pr-003 (short slug)
```

### 2. Write Artefacts

Create the three files shown above:
- `src/do/github-agent.ts` (DO class)
- `workers/github-webhook/index.ts` (worker entry)
- Append to `alchemy.run.ts` (IaC bindings)

### 3. Deploy with Wrapper

```bash
./tgk deploy
# Under the hood: alchemy deploy --profile ci --stage pr-003
# Worker + DO class pushed in one atomic transaction
```

### 4. Test Concurrency

```bash
# Open two terminals, fire concurrent hooks
./tgk hook simulate mobile-app --pr 42 --action review
./tgk hook simulate mobile-app --pr 42 --action push
# Expected: only second payload survives as pinned message
```

### 5. Promote to Prod

```bash
./tgk stage promote pr-003 prod
# Switches DO ID to gh_agent_<stream> in prod namespace
# Old stateless worker replaced; zero downtime
```

### 6. Observability

```bash
./tgk logs worker github-webhook --stage prod --follow
# DO messages tagged alc.do.id=gh_agent_<stream>
```

### 7. Rollback (if needed)

```bash
git revert <merge-commit>
./tgk deploy --stage prod
# DO class removed → worker falls back to stateless mode instantly
```

---

## 🎯 Key Benefits

1. **Thread-Safe** – DO guarantees single-threaded execution
2. **Stateful** – Pinned message ID persists across requests
3. **Topic-Separated** – Different streams use different DO instances
4. **Zero Downtime** – Atomic deployments via stage promotion
5. **CLI-Wrapped** – Never touch raw wrangler/cf commands
6. **Stage/Profile/Scope** – Uses ratified Alchemy mechanics

---

## 📚 Related Documentation

- [Alchemy Workflow Primer](../alchemy-workflow-primer.md) - Stage concepts
- [Alchemy CLI Reference](../alchemy-cli-reference.md) - tgk commands
- [Alchemy Profile System](../guides/alchemy-profiles.md) - Authentication
- [Alchemy Scope System](../guides/alchemy-scopes.md) - Resource isolation

---

## 🚀 Implementation Status

This workflow builds on:
- ✅ **telegram-worker-clean** branch (merged to main)
- ✅ **Existing webhook template** (`templates/worker/github-webhook/`)
- ✅ **Existing tgk commands** (`scripts/tgk`)
- ✅ **Existing bootstrap script** (`scripts/bootstrap-stream.sh`)

**Ready to implement using existing Alchemy stage/profile/scope mechanics!**
