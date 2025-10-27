# PR Checklist: Email PR Telegram Integration

## ✅ Feature Flags
- [ ] `EMAIL_PR_TELEGRAM=1` configured in wrangler.toml
- [ ] `SEND_EMAIL_REPLY` flag documented (optional)
- [ ] Feature flag tested in both enabled/disabled states

## ✅ Integration Points
- [ ] Re-uses existing `/callback` route – no new Worker code-path
- [ ] PR Telegram module imported correctly (`kinja-pr-telegram.ts`)
- [ ] D1 database binding configured in wrangler.toml
- [ ] Email parsing logic handles `pr123` format correctly
- [ ] Fallback to normal flow when no mapping found

## ✅ Database & Migration
- [ ] D1 migration created: `.github/rfc006/migrations/003-email-tg-pr.sql`
- [ ] Migration tested locally with `wrangler d1 execute --local`
- [ ] Migration applied to production database
- [ ] `email_tg_map` table created with correct schema
- [ ] Test data inserted for validation

## ✅ Worker Configuration
- [ ] Environment variables added to `wrangler.toml`:
  - [ ] `EMAIL_PR_TELEGRAM="1"`
  - [ ] `EMAIL_FROM="noreply@tgk.dev"`
- [ ] Secrets configured:
  - [ ] `SENDGRID_API_KEY` (if email replies enabled)
- [ ] D1 database binding confirmed
- [ ] Worker deploys successfully

## ✅ Telegram Integration
- [ ] Rich PR card template implemented
- [ ] Interactive keyboard with PR actions:
  - [ ] Approve (`pr:approve`)
  - [ ] Request Changes (`pr:request-changes`)
  - [ ] Comment (`pr:comment`)
  - [ ] Merge (`pr:merge`)
  - [ ] Auto-merge (`pr:automate`)
- [ ] Callback data uses `pr:` prefix for routing
- [ ] Confirmation messages posted after actions
- [ ] Error handling for Telegram API failures

## ✅ GitHub Integration
- [ ] GitHub API calls wrapped in error handling
- [ ] PR actions execute correctly:
  - [ ] `approvePullRequest`
  - [ ] `requestChangesOnPullRequest`
  - [ ] `commentOnPullRequest`
  - [ ] `mergePullRequest`
  - [ ] `enableAutoMerge`
- [ ] Topic extraction from PR body
- [ ] PR status fetching with AI analysis

## ✅ Email Reply System
- [ ] Optional email reply functionality implemented
- [ ] SendGrid integration configured
- [ ] Original email sender retrieved from D1
- [ ] Reply email template with action details
- [ ] Error handling doesn't break PR actions

## ✅ End-to-End Testing
- [ ] **E2E Test 1**: Email sent to `infra.sre.review.p0.gh.pr51@cloudflare.com`
  - [ ] Email parsed correctly
  - [ ] PR #51 extracted from address
  - [ ] D1 lookup finds chat mapping
  - [ ] Rich card appears in Telegram
  - [ ] All buttons displayed correctly

- [ ] **E2E Test 2**: Telegram button interaction
  - [ ] Approve button clicked → PR #51 approved
  - [ ] Request Changes button → comment added
  - [ ] Merge button → PR merged (if checks pass)
  - [ ] Confirmation message posted

- [ ] **E2E Test 3**: Email reply (if enabled)
  - [ ] Action in Telegram triggers email reply
  - [ ] Reply sent to original sender
  - [ ] Reply includes action details and PR link

## ✅ Callback Testing
- [ ] Manual callback test:
  ```bash
  curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \
    -H 'Content-Type: application/json' \
    -d '{"action":"pr:approve","prId":"51","message":"Looks good!"}'
  ```
- [ ] Response: `PR action executed & email reply queued`
- [ ] GitHub action verified
- [ ] Telegram confirmation posted

## ✅ Error Handling & Edge Cases
- [ ] No D1 mapping → falls back to normal email flow
- [ ] Invalid PR format → ignored by PR branch
- [ ] GitHub API failures → logged, don't crash worker
- [ ] Telegram API failures → logged, continue with GitHub action
- [ ] Email reply failures → logged, don't break PR action
- [ ] Feature flag disabled → normal email flow preserved

## ✅ Security & Validation
- [ ] Email address parsing validates grammar
- [ ] PR number validation with regex `/^pr(\d+)$/i`
- [ ] Callback data validation before processing
- [ ] No sensitive data in Telegram messages
- [ ] Rate limiting considerations documented

## ✅ Documentation
- [ ] Integration documentation created
- [ ] Deployment scripts provided
- [ ] Test scripts included
- [ ] Troubleshooting guide written
- [ ] Security considerations documented

## ✅ Deployment
- [ ] Deployment script created: `scripts/deploy-email-pr-telegram.sh`
- [ ] Test script created: `scripts/test-email-pr-telegram.sh`
- [ ] Production deployment tested
- [ ] Rollback procedure documented
- [ ] Monitoring and logging verified

## ✅ Performance & Monitoring
- [ ] Worker execution time under limits
- [ ] D1 query performance tested
- [ ] Memory usage within bounds
- [ ] Logging implemented for debugging
- [ ] Metrics collection configured

## 🧪 Final Validation

**Test Command:**
```bash
./scripts/test-email-pr-telegram.sh
```

**Expected Result:**
- ✅ D1 migration applied
- ✅ Test mapping inserted
- ✅ Local worker can parse PR emails
- ✅ Rich cards generated correctly
- ✅ Callbacks processed successfully

**Production Test:**
Send email to: `infra.sre.review.p0.gh.pr51@cloudflare.com`

**Expected Behavior:**
1. Email arrives → Worker parses PR #51
2. D1 lookup finds `@general` chat ID
3. Rich PR card appears in Telegram with Approve button
4. Click Approve → PR #51 approved on GitHub
5. Email reply sent to original sender (if enabled)

---

## 🚀 Ready to Merge

When all checkboxes are complete:
1. Merge PR
2. Run deployment script: `./scripts/deploy-email-pr-telegram.sh`
3. Enable feature flag: `EMAIL_PR_TELEGRAM=1` (already in config)
4. Monitor first few emails for proper routing
5. Optionally enable email replies: `SEND_EMAIL_REPLY=1`

**Rollback:** Set `EMAIL_PR_TELEGRAM=0` via wrangler secret to disable instantly.
