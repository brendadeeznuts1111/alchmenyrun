# Email PR Telegram Integration

## Overview

This integration wires the new Telegram-PR commands into the existing Phase-6 email orchestration layer, enabling:

- **Automatic PR rich cards** in Telegram when emails are sent to PR-specific addresses
- **Interactive buttons** for approve, request changes, comment, and merge actions
- **Bidirectional sync** between Telegram actions and GitHub
- **Optional email replies** back to the original sender
- **Feature-flagged deployment** for safe rollout

## Architecture

```
Email → Worker → D1 Lookup → Telegram Rich Card → User Click → Callback → GitHub Action → Email Reply
```

### Flow Diagram

```
┌─────────────┐    ┌──────────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────────┐
│   Email     │───▶│   Worker     │───▶│   D1    │───▶│  Telegram   │───▶│   GitHub    │
│ pr51@...    │    │ Parser       │    │ Lookup  │    │ Rich Card   │    │   Action    │
└─────────────┘    └──────────────┘    └─────────┘    └─────────────┘    └─────────────┘
                           │                     │              │                   │
                           ▼                     ▼              ▼                   ▼
                    ┌─────────────┐    ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
                    │ AI Analysis │    │   Callback       │ │ Confirmation│ │ Email Reply │
                    │   (Kinja)   │    │   Handler        │ │   Message   │ │ (Optional)  │
                    └─────────────┘    └─────────────────┘ └─────────────┘ └─────────────┘
```

## Configuration

### Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `EMAIL_PR_TELEGRAM` | `"1"` | Enable PR Telegram integration |
| `SEND_EMAIL_REPLY` | `undefined` | Enable email replies for PR actions |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_FROM` | Yes | From address for email replies (e.g., `noreply@tgk.dev`) |
| `SENDGRID_API_KEY` | Optional | SendGrid API key for email replies |

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS email_tg_map (
  state_id TEXT PRIMARY KEY,      -- pr123
  chat_id  TEXT NOT NULL,
  email_from TEXT,                -- for reply
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### 1. Send Email to PR Address

```
To: infra.sre.review.p0.gh.pr51@cloudflare.com
Subject: DB latency spike – please approve hot-fix
Body: p99 is 800 ms, we need to merge PR #51 ASAP
```

### 2. Automatic Telegram Rich Card

The worker will:
1. Parse `pr51` from the email address
2. Look up the corresponding `chat_id` in D1
3. Fetch PR details from GitHub
4. Generate AI analysis of the email content
5. Send a rich card to Telegram with:
   - PR title, author, topic
   - Status, checks, reviews
   - AI analysis (risk, coverage, breaking changes)
   - Email context (sender, subject, urgency)
   - Interactive buttons

### 3. Interactive Actions

Users can click buttons in Telegram:
- **✅ Approve** - Approve the PR
- **🔄 Request Changes** - Request changes with a message
- **💬 Comment** - Add a comment to the PR
- **🔀 Merge** - Merge the PR (if checks pass)
- **🤖 Auto-merge** - Enable auto-merge (if checks pass)

### 4. Callback Processing

Button clicks trigger callbacks to `/callback`:
```json
{
  "action": "pr:approve",
  "prId": "51",
  "message": "Looks good!"
}
```

The worker:
1. Parses the `pr:` prefix to identify PR actions
2. Executes the corresponding GitHub action
3. Posts confirmation to Telegram
4. Sends email reply (if enabled)

## Deployment

### 1. Apply Database Migration

```bash
npx wrangler d1 execute tgk_email_metadata \
  --file=.github/rfc006/migrations/003-email-tg-pr.sql
```

### 2. Deploy Worker

```bash
cd workers/tgk-email-orchestrator
npx wrangler deploy
```

### 3. Set Up Email Mappings

```sql
INSERT INTO email_tg_map (state_id, chat_id, email_from) 
VALUES 
  ('pr51', '@general', 'dev@company.com'),
  ('pr52', '@sre_team', 'alerts@company.com');
```

### 4. Test End-to-End

```bash
# Run the test script
./scripts/test-email-pr-telegram.sh

# Or test manually
curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \
  -H 'Content-Type: application/json' \
  -d '{"action":"pr:approve","prId":"51","message":"Looks good!"}'
```

## Testing

### Local Development

```bash
# Start local D1
npx wrangler d1 execute tgk_email_metadata --local

# Test worker locally
npx wrangler dev --local

# Run test script
./scripts/test-email-pr-telegram.sh
```

### Test Email Addresses

| PR | Email Address | Expected Chat |
|----|---------------|---------------|
| #51 | `infra.sre.review.p0.gh.pr51@cloudflare.com` | `@general` |
| #52 | `infra.sre.review.p0.gh.pr52@cloudflare.com` | `@sre_team` |

### Test Callbacks

```bash
# Approve PR
curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \
  -H 'Content-Type: application/json' \
  -d '{"action":"pr:approve","prId":"51","message":"Approved via Telegram"}'

# Request changes
curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \
  -H 'Content-Type: application/json' \
  -d '{"action":"pr:request-changes","prId":"51","message":"Need more tests"}'

# Merge PR
curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \
  -H 'Content-Type: application/json' \
  -d '{"action":"pr:merge","prId":"51"}'
```

## Monitoring

### Logs

```bash
# View worker logs
npx wrangler tail

# Filter for PR actions
npx wrangler tail --format=pretty | grep "PR Telegram"
```

### Metrics

The integration logs:
- Email routing success/failure
- PR action execution
- Telegram message delivery
- Email reply delivery

### Error Handling

- **No mapping found**: Falls back to normal email flow
- **GitHub API failure**: Logs error, sends Telegram notification
- **Telegram failure**: Logs error, continues with GitHub action
- **Email reply failure**: Logs error, doesn't break PR action

## Rollback

### Disable Feature Flag

```bash
wrangler secret put EMAIL_PR_TELEGRAM "0"
```

### Remove Mappings

```sql
DELETE FROM email_tg_map WHERE state_id LIKE 'pr%';
```

### Deploy Previous Version

```bash
git checkout previous-commit
cd workers/tgk-email-orchestrator
npx wrangler deploy
```

## Security

### Input Validation

- Email addresses are parsed using strict grammar
- PR numbers are validated with regex `/^pr(\d+)$/i`
- Callback data is validated before processing
- GitHub tokens are stored in secrets

### Rate Limiting

- Telegram API calls are rate-limited
- GitHub API calls respect rate limits
- Email processing is limited per sender

### Access Control

- Only configured chat IDs receive PR cards
- Callbacks only work for mapped PRs
- Email replies only go to original senders

## Troubleshooting

### Common Issues

1. **PR not appearing in Telegram**
   - Check `EMAIL_PR_TELEGRAM=1` is set
   - Verify D1 mapping exists for the PR
   - Check worker logs for parsing errors

2. **Buttons not working**
   - Verify webhook is configured to `/callback`
   - Check callback data format
   - Review GitHub token permissions

3. **Email replies not sending**
   - Check `SEND_EMAIL_REPLY=1` is set
   - Verify `SENDGRID_API_KEY` secret
   - Check `EMAIL_FROM` is configured

### Debug Commands

```bash
# Check D1 mappings
npx wrangler d1 execute tgk_email_metadata --command "SELECT * FROM email_tg_map"

# Test worker locally
npx wrangler dev --local

# View real-time logs
npx wrangler tail --format=pretty
```

## Future Enhancements

- **Multiple PR support**: Handle emails with multiple PR numbers
- **Custom templates**: Configurable Telegram message templates
- **SLA tracking**: Track PR approval times from email to action
- **Analytics**: Dashboard showing email-to-PR conversion metrics
- **Auto-routing**: Automatically determine chat ID from email content
