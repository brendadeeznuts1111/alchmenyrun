micro-rfc–006  AI-Driven Customer & Release Orchestration  
--------------------------------------------------------

Status  proposed → ready  
Target  alchmenyrun/tgk  (v5.0.0)  
Files   `tgk/commands/*`  +  `.github/workflows/*`  +  `docs/rfcs/*`  
Author  `@brendadeeznuts1111` 

1.  Goal  
    Turn the static customer-facing taxonomy into an **active, policy-gated orchestration layer** inside `tgk`, so every customer issue, release, and notification is **AI-labelled**, **council-approved**, and **automatically announced**—without leaving the CLI.

2.  Design (40-line diff)  
    a.  **New commands** (reuse existing `tgk` dispatch)
    ```ts
    tgk issue new                   // AI wizard → auto-labels
    tgk issue triage <id>           // AI suggests → applies labels
    tgk release plan --type minor   // AI drafts → council approves
    tgk release approve <id>        // Telegram button → OPA gate
    tgk release deploy <id>         // policy pass → CI trigger
    tgk customer notify <id>        // AI drafts → D12 sends
    ```
    b.  **AI labelling** (single prompt, 20 ms)
    ```ts
    const labels = await ai.labelIssue(title, body, changedFiles);
    // returns {group, topic, impact, confidence}
    if (confidence > 0.8) gh.addLabels(labels);
    else postToTelegram("@alchemist_infra_team", labels);
    ```
    c.  **Policy gate** (OPA via `tgk policy check`)
    ```rego
    deny["major needs council approval"] {
      input.release.type == "major"
      input.approvers != ["@alchemist/core"]
    }
    ```
    d.  **Metrics** (auto-pushed to Prometheus)
    ```
    alchemist_issue_auto_labeled_total{group, topic, impact}
    alchemist_release_plan_approval_time_seconds{type}
    alchemist_customer_notification_total{customer_id, template}
    ```

3.  Alchemy resources (append to `alchemy.run.ts`)
    ```ts
    await Worker("tgk-orchestrator", {
      entrypoint: "./workers/tgk-orchestrator/index.ts",
      bindings: {
        AI: env.AI,               // Cloudflare AI gateway
        OPA: env.OPA,             // OPA evaluation endpoint
        D12: env.D12,             // customer notification API
      },
      secrets: {
        OPENAI_API_KEY: env.OPENAI_API_KEY,
        D12_TOKEN: env.D12_TOKEN,
      },
    });
    ```

4.  Roll-out checklist
    - [ ] land `tgk/commands/issue.ts`, `release.ts`, `customer.ts` 
    - [ ] land OPA policies in `infra/telegram/policies/` 
    - [ ] land worker `tgk-orchestrator` (≤80 LOC)
    - [ ] land workflows `.github/workflows/issue-triage.yml`, `release.yml` 
    - [ ] land metrics in `infra/observability/prometheus.yml` 
    - [ ] test **10** auto-labelled issues → ≥80 % accuracy
    - [ ] test **1** full release cycle (plan → approve → deploy → announce)
    - [ ] test **1** customer notification via D12

5.  Back-compat
    Zero breaking changes; old `tgk` commands remain untouched.

6.  Cost & perf
    - AI calls: ~20 ms, billed per request (≤1 s total).
    - Metrics: pushed to **existing** Prometheus; no new infra.

7.  Rejection pointers
    If AI gateway is disabled, commands fall back to **manual** mode (no labels, no drafts).
