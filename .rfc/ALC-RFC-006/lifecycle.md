# ALC-RFC-006 Lifecycle Dashboard

| Stage | Owner | State | Evidence |
|-------|-------|-------|----------|
| Bootstrap | Infra | ✅ | `.rfc/ALC-RFC-006/metadata.yml` exists |
| Basic Routing | Infra | ⏳ | PR #<num> merged, Worker logs `routing_total` > 0 |
| AI Analysis | Quality | ⏳ | Dashboard `ai_sentiment_score` visible |
| Dynamic Chat-ID | Integrations | 🔒 | Blocked: on-call API key |
| Bidirectional Reply | Integrations | 🔒 | Blocked: SendGrid domain auth |
| OPA Policies | Security | ⏳ | PR #<num> under review |
| Observability | Infra | ⏳ | Grafana dashboard provisioned |
| Security Sign-off | Council | 🔒 | Waiting for SEC-ALC-2025-11-01 |
| Go-Live | Council | 🔒 | Needs +3 Council votes |

Rollback: `wrangler delete tgk-email-orchestrator && wrangler d1 delete tgk_email_metadata -y`
