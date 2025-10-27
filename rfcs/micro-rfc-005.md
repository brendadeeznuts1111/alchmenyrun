micro-rfc–005  Thread-Safe Forum State with Durable Objects
-----------------------------------------------------------

Status  `implemented`
Target  `alchmenyrun/tgk`  (v0.5.0)
Files   `workers/github-webhook/*`  +  `src/do/github-agent.ts`  +  `alchemy.run.ts`
Author  `@brendadeeznuts1111`

1.  Goal
    Guarantee that two concurrent GitHub events can never overwrite each other's pinned Telegram status card inside the same forum topic, while keeping the existing `tgk` CLI, stage, profile and scope mechanics untouched.

2.  Design (40-line diff)
    a. **One Durable Object class per forum topic**
       DO id = `gh_agent_<stream>`  (stream = forum topic slug).
    b. **DO state** (single key-value pair)
       `pinnedMsgId?: number`
    c. **Worker forwards** every webhook to the correct DO stub:
       `await env.GITHUB_DO.get(id).fetch(req.clone(), headers)`
    d. **DO executes atomically** (single-threaded):
       1. read old `pinnedMsgId`
       2. `unpinChatMessage` (if exists)
       3. `sendMessage` → new card
       4. `pinChatMessage`
       5. `storage.put('pinnedMsgId', new_msg_id)`
    e. **Telegram calls** include `message_thread_id` taken from `ENV.TOPIC_*`.

3.  Alchemy resources (append to `alchemy.run.ts`)
```ts
const ghAgentDO = await DurableObject("GithubAgent", {
  class: GithubAgent,               // src/do/github-agent.ts
});

await Worker("github-webhook", {
  entrypoint: "./workers/github-webhook/index.ts",
  bindings: {
    GITHUB_DO: ghAgentDO,
    TG_TOKEN: $env("TG_TOKEN"),
    COUNCIL_ID: $env("TELEGRAM_COUNCIL_ID"),
    TOPIC_MOBILE: $env("TELEGRAM_TOPIC_MOBILE"),
    TOPIC_FORUM: $env("TELEGRAM_TOPIC_FORUM"),
  },
  profile: "ci",
  stage: $env("STAGE"),
});
```

4.  Telegram API deltas
   `sendMessage`, `pinChatMessage`, `unpinChatMessage` now **must** include
   `message_thread_id` from `ENV.TOPIC_*`.

5.  Roll-out checklist
- [ ] land `src/do/github-agent.ts` (≤80 LOC)
- [ ] add DO binding + Worker deploy
- [ ] insert `await env.GITHUB_DO.get(...).fetch(req)` in webhook worker
- [ ] confirm forum topic slugs match DO ids (`mobile-app`, `forum-polish`, …)
- [ ] destroy old stateless worker (no longer needed)

6.  Back-compat
   Zero breaking changes; old `STREAM_TOPIC_ID` env var is reused.

7.  Security & cost
   - DOs are billed only when active (≤1 s per webhook).
   - DO storage < 50 bytes per topic → free tier covers 100 k topics.

8.  Rejection pointers
   If we ever migrate away from Telegram forums we can drop the DO layer
   without touching the rest of the webhook logic.
