# Feature Development Roadmap

This document tracks the planned features and their implementation status.

## ✅ Completed

### PR #0: Setup Profiles (MERGED)
**Branch:** `feat/setup-profiles`  
**Status:** ✅ Complete  
**PR:** #4

**What it does:**
- Configures `default`, `prod`, and `ci` profiles
- Removes direct API token usage
- Updates GitHub Actions to use `ci` profile
- Better environment separation

---

## 🚀 Phase 1: Enable Existing Features (Quick Wins)

### PR #1: Enable Durable Objects
**Branch:** `feat/enable-durable-objects`  
**Status:** ⏳ Next  
**Effort:** 🟢 Low (2-3 hours)

**What it does:**
- Uncomment Durable Objects in `alchemy.run.ts`
- Enable WebSocket chat functionality
- Add `CHAT` binding to website
- Test real-time connections

**Files to change:**
- `alchemy.run.ts` (uncomment lines 90-96, 123)
- `src/env.d.ts` (add CHAT binding)
- `src/tests/durable-objects.test.ts` (new)
- `docs/DURABLE_OBJECTS.md` (new)

---

### PR #2: Enable Workflows
**Branch:** `feat/enable-workflows`  
**Status:** ⏸️ Pending  
**Effort:** 🟢 Low (2-3 hours)

**What it does:**
- Uncomment Workflow in `alchemy.run.ts`
- Enable multi-step orchestration
- Add workflow trigger endpoint
- Test workflow execution

**Files to change:**
- `alchemy.run.ts` (uncomment lines 101, 124)
- `src/backend/server.ts` (add workflow trigger)
- `src/env.d.ts` (add WORKFLOW binding)
- `src/tests/workflows.test.ts` (new)
- `docs/WORKFLOWS.md` (new)

---

### PR #3: Enable MCP Worker
**Branch:** `feat/enable-mcp-worker`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (4-6 hours)

**What it does:**
- Uncomment MCP Worker in `alchemy.run.ts`
- Enable AI assistant integration
- Configure custom domain or workers.dev
- Test MCP endpoints

**Files to change:**
- `alchemy.run.ts` (uncomment lines 132-155)
- `src/env.d.ts` (add MCP bindings)
- `src/tests/mcp.test.ts` (new)
- `docs/MCP_INTEGRATION.md` (update)

---

## 🔨 Phase 2: Build New Features

### PR #4: Queue Consumer
**Branch:** `feat/queue-consumer`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (4-6 hours)

**What it does:**
- Create queue consumer worker
- Implement job handlers (user_created, file_uploaded)
- Add retry logic and dead letter queue
- Test background job processing

**Files to create:**
- `src/backend/queue-consumer.ts` (new)
- `alchemy.run.ts` (add Queue consumer)
- `src/tests/queue-consumer.test.ts` (new)
- `docs/QUEUE_CONSUMER.md` (new)

---

### PR #5: Custom Domain
**Branch:** `feat/custom-domain`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (3-4 hours)

**What it does:**
- Add CustomDomain resource
- Configure DNS records
- Test SSL certificate provisioning
- Document domain setup

**Files to change:**
- `alchemy.run.ts` (add CustomDomain)
- `docs/CUSTOM_DOMAIN.md` (new)
- `README.md` (update)

---

### PR #6: Cron Triggers
**Branch:** `feat/cron-triggers`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (3-4 hours)

**What it does:**
- Add CronTrigger resources
- Implement scheduled jobs (cleanup, reports)
- Add cron handler endpoints
- Test scheduled execution

**Files to create:**
- `src/backend/cron-handlers.ts` (new)
- `alchemy.run.ts` (add CronTriggers)
- `src/tests/cron.test.ts` (new)
- `docs/CRON_TRIGGERS.md` (new)

---

## 🚀 Phase 3: Advanced Features

### PR #7: Analytics Engine
**Branch:** `feat/analytics-engine`  
**Status:** ⏸️ Pending  
**Effort:** 🟠 High (6-8 hours)

**What it does:**
- Add AnalyticsEngine resource
- Implement event tracking
- Create analytics dashboard
- Add visualization component

---

### PR #8: Vectorize (Semantic Search)
**Branch:** `feat/vectorize`  
**Status:** ⏸️ Pending  
**Effort:** 🟠 High (8-10 hours)

**What it does:**
- Add Vectorize resource
- Implement embedding generation
- Create semantic search endpoint
- Add search UI component

---

### PR #9: Hyperdrive (External DB)
**Branch:** `feat/hyperdrive`  
**Status:** ⏸️ Pending  
**Effort:** 🟠 High (6-8 hours)

**What it does:**
- Add Hyperdrive resource
- Configure external database connection
- Implement connection pooling
- Add database proxy endpoints

---

## 🎯 Phase 4: Production Hardening

### PR #10: Monitoring & Observability
**Branch:** `feat/monitoring`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (4-6 hours)

**What it does:**
- Add Sentry error tracking
- Add Axiom log aggregation
- Create health check dashboard
- Configure alerts

---

### PR #11: Load Testing
**Branch:** `feat/load-testing`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (4-6 hours)

**What it does:**
- Add k6 load tests
- Create performance benchmarks
- Add CI performance tests
- Document performance baselines

---

### PR #12: API Documentation
**Branch:** `feat/api-docs`  
**Status:** ⏸️ Pending  
**Effort:** 🟡 Medium (4-6 hours)

**What it does:**
- Generate OpenAPI spec
- Add Swagger UI
- Document all endpoints
- Add request/response examples

---

## 📊 Progress Tracker

| Phase | PRs | Completed | In Progress | Pending |
|-------|-----|-----------|-------------|---------|
| **Phase 0: Foundation** | 1 | 1 | 0 | 0 |
| **Phase 1: Quick Wins** | 3 | 0 | 0 | 3 |
| **Phase 2: Core Features** | 3 | 0 | 0 | 3 |
| **Phase 3: Advanced** | 3 | 0 | 0 | 3 |
| **Phase 4: Production** | 3 | 0 | 0 | 3 |
| **Total** | **13** | **1** | **0** | **12** |

---

## 🎯 Next Up

**PR #1: Enable Durable Objects** - Ready to start after PR #4 is merged!

---

## 📝 Notes

- Each PR should be small, focused, and independently testable
- Preview deployments test each feature in isolation
- Documentation is required for each feature
- Tests are required for each feature
- One PR per feature for easy review and rollback
