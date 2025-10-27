# ALC-RFC-006 Lifecycle Dashboard

| Stage | Owner | State | Evidence |
|-------|-------|-------|----------|
| Bootstrap | Infra | ✅ | D1 database, Worker deployed, secrets set, metadata created |
| Basic Routing | Infra | ⏳ | Ready for email routing rule in Cloudflare dashboard |
| AI Analysis | Quality | ⏳ | Dashboard `ai_sentiment_score` visible |
| Dynamic Chat-ID | Integrations | 🔒 | Blocked: on-call API key |
| Bidirectional Reply | Integrations | 🔒 | Blocked: SendGrid domain auth |
| OPA Policies | Security | ⏳ | PR #<num> under review |
| Observability | Infra | ⏳ | Grafana dashboard provisioned |
| Security Sign-off | Council | 🔒 | Waiting for SEC-ALC-2025-11-01 |
| Go-Live | Council | 🔒 | Needs +3 Council votes |

Rollback: `wrangler delete tgk-email-orchestrator && wrangler d1 delete tgk_email_metadata -y`
