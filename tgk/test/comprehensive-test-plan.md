# Comprehensive Test Plan: `tgk` RFC Lifecycle Orchestration

**Goal:** Verify the `micro-rfc-006` (DO-backed forum state) and `tgk` Phase 4/5 integrations (templates, notifications, approvals, state management) function as a cohesive, resilient, and performant system, including cleanup and resource limiting.

**Environment:** Staging/Test environment (`--stage test-do-006`, `--profile ci`)
**Test Lead:** @diana.prince (Quality Gate Lead)
**Owner:** @alice.smith (Core Infra Lead)

---

## 0. Pre-requisites & Setup

*   `tgk` v5.0.0+ installed on CI runners.
*   `TELEGRAM_BOT_TOKEN`, `COUNCIL_ID` (and other chat IDs) set as CI secrets/vars.
*   Cloudflare API token with R2, Workers, and Durable Object permissions.
*   A test GitHub repository webhook configured to hit `github-webhook.<your-worker>.workers.dev/forum-test-stream`.
*   Jinja2 templates for RFC status card and notification messages are committed (`tgk/templates/...`).
*   OPA policies for RFC approval, rate limits, and DO access are active.

---

## 1. Core State Management & DO Thread-Safety

### Scenario 1.1: Concurrent Webhooks (DO Thread Safety)
**Action:**
1.  Create a test RFC stream: `tgk stream create do-test-concurrency --type sre --owner @alice` 
2.  Post an initial RFC status card to it.
3.  Trigger **two identical GitHub webhook events (e.g., PR opened)** to `github-webhook.<your-worker>.workers.dev/do-test-concurrency` within 500ms of each other.

**Expected:**
*   Only **one** Telegram message is pinned in the `do-test-concurrency` topic.
*   The content of the pinned message reflects the *second* webhook event, or a properly serialized state.
*   `./tgk logs worker github-webhook --stage test-do-006 --follow` shows DO invocation for each webhook, confirming serialization.

**Failure Check:** If two distinct messages are pinned, or the pinned message reflects a corrupted state.

### Scenario 1.2: DO State Persistence (Across Worker Restarts/Deploys)
**Action:**
1.  Perform Scenario 1.1 successfully, ensuring a pinned message exists.
2.  Redeploy the `github-webhook` worker: `./tgk cf worker deploy github-webhook --stage test-do-006 --reason "DO_state_test"` 
3.  After deploy, trigger *one* GitHub webhook event (different content) to the same stream (`do-test-concurrency`).

**Expected:**
*   The `tgk cf worker deploy` command completes successfully.
*   After the webhook, the *new* message content is correctly pinned.
*   The previously pinned message is unpinned.
*   The DO's state (e.g., `pinnedMsgId`) was successfully retrieved from storage after redeploy.

**Failure Check:** If the old message remains pinned after the new webhook, or if the DO fails to retrieve state.

---

## 2. RFC Lifecycle & Templating

### Scenario 2.1: Full RFC Lifecycle (Templates, State, Approvals)
**Action:**
1.  Create a test RFC stream: `tgk stream create do-test-rfc --type product --owner @brendadeeznuts1111` 
2.  Initiate a new RFC via `tgk rfc new --template product --title "DO Integration Test"`. This should open a GitHub PR.
3.  Simulate opening the PR in GitHub. The CI should post the initial RFC status card to the `do-test-rfc` topic.
4.  Simulate an approval: `tgk rfc approve <rfc-id> --user @alice.smith` (or click Telegram button). Repeat for required approvals.
5.  Once approved, `tgk rfc submit <rfc-id>` should trigger merge of the PR.

**Expected:**
*   Initial RFC card posts to `do-test-rfc` topic using the Jinja2 template.
*   Card contains: `RFC ID`, `Title`, `Status: READY_FOR_REVIEW`, `Approvals Needed`, `Deep-link`, `PR Link`, interactive buttons.
*   As approvals are given, the *pinned message in Telegram updates in place* to reflect `Approvals Received`.
*   `tgk rfc approve` commands are audited (`tgk audit log`).
*   `tgk rfc submit` successfully merges the PR.
*   Post-merge, the pinned message reflects `Status: MERGED`.

**Failure Check:** If the card doesn't post/update, template variables are missing, approvals don't register, or PR doesn't merge.

### Scenario 2.2: Template Rendering & Multilingual Support
**Action:**
1.  Trigger `tgk pin preview do-test-rfc --user @alice.smith --lang fr` 
2.  Trigger `tgk pin preview do-test-rfc --user @brendadeeznuts1111` (assumed EN)

**Expected:**
*   `tgk pin preview` outputs rendered markdown.
*   French version shows French labels/text in specific template sections.
*   English version shows English.
*   Personalized content (e.g., "Your Pending RFCs") is correctly rendered based on the simulated user's context.

**Failure Check:** If incorrect language is rendered, or personalization fails.

---

## 3. Notifications & Limiting

### Scenario 3.1: SLA Nudges & Escalations (Rate Limiting)
**Action:**
1.  Create an RFC (`tgk rfc new...`) in a test stream.
2.  Set its SLA to a very short time (e.g., 5 minutes for testing): `tgk sla extend <rfc-id> --hours 0.08 --reason "test"` (0.08 hours = ~5 min).
3.  Wait for SLA to breach.
4.  Trigger manual nudge: `tgk review nudge --id <rfc-id>`.

**Expected:**
*   Within ~5 minutes, `tgk` posts an "SLA Breach" message (or nudges reviewers) to the relevant Telegram group/topic.
*   `tgk review nudge` sends a message to the assigned reviewers.
*   `tgk_review_assignment_total` and `tgk_sla_breaches_total` metrics increment.
*   No more than 3 nudges are sent within 15 minutes to the same reviewer/topic if configured for rate limiting (verify OPA policy for `notification.rate_limit.rego`).

**Failure Check:** If nudges don't occur, occur too frequently, or metrics are not updated.

### Scenario 3.2: Garbage Collection (Cleanup of Stale Data)
**Action:**
1.  Create several test RFCs in `do-test-cleanup` stream, merging some, withdrawing others.
2.  Wait for a configured `tgk` cleanup cron job to run (e.g., daily/weekly).
3.  Manually run cleanup: `tgk orchestrate cleanup --scope rfc --status archived --older-than 30d` 

**Expected:**
*   Stale `message_thread_id` values related to old RFCs are removed from DO storage.
*   Archived RFC topics are either deleted or marked as read-only.
*   `tgk_storage_cleanup_total` metrics increment, `tgk_storage_bytes_gauge` shows reduction.

**Failure Check:** If stale data persists after cleanup, or cleanup job fails.

---

## 4. Observability & Auditing

### Scenario 4.1: End-to-End Audit Trail
**Action:** Perform a full RFC lifecycle (Scenario 2.1).

**Expected:**
*   Every `tgk` command (`stream create`, `rfc new`, `approve`, `submit`) is logged to Loki (`tgk audit log`).
*   `tgk audit log` shows `action_type`, `user_id`, `chat_id`, and `diff` for state changes.
*   DO invocation metrics (`alc.do.id`) show non-zero counts in Cloudflare dashboard.
*   Grafana "Alchemist Comms Health" and "AI Ops Insights" dashboards reflect all relevant metrics (e.g., `tgk_rfc_review_duration_seconds`, `tgk_orchestration_actions_total`).

**Failure Check:** Missing audit entries, incorrect metrics, or dashboards not updating.

---

## 5. Resource Limiting & Cost Attribution

### Scenario 5.1: DO Resource Usage & Cost Attribution
**Action:**
1.  Perform Scenario 1.1 (concurrent webhooks)
2.  Perform Scenario 2.1 (full RFC lifecycle)
3.  Trigger `tgk cf d1 query` on D12 (if customer data integrated).

**Expected:**
*   In Cloudflare dashboard, "Workers & Pages" -> `github-webhook` worker -> "Metrics" -> "Durable Object invocations" should show expected counts.
*   Telemetry `alc.do.id = gh_agent_<stream>` is present for all DO invocations in Trace/Logpush.
*   `tgk_storage_bytes_gauge` reflects DO storage usage.
*   Durable Object storage billed amount is minimal (expected <$1/month for current scale).

**Failure Check:** High DO invocation latency, unexpected storage costs, or missing cost attribution tags.

---

## Test Execution Commands

### Setup Commands
```bash
# Install tgk CLI
curl -sSL https://install.tgk.dev | bash
echo "$HOME/.tgk/bin" >> $GITHUB_PATH

# Set test environment
export TGK_STAGE=test-do-006
export TGK_PROFILE=ci
```

### Test Execution
```bash
# Run all test scenarios
./tgk/test/run-all-tests.sh

# Run specific test categories
./tgk/test/run-do-tests.sh
./tgk/test/run-rfc-lifecycle-tests.sh
./tgk/test/run-notification-tests.sh
./tgk/test/run-cleanup-tests.sh
./tgk/test/run-observability-tests.sh
```

### Cleanup
```bash
# Clean up test data
./tgk/test/cleanup-test-environment.sh --stage test-do-006
```

---

This comprehensive test plan provides the rigorous validation needed to ensure your `tgk` control plane, DO integration, and RFC lifecycle orchestration are truly resilient, efficient, and cost-effective. Executing these tests will prove the "sentient core" is production-ready.
