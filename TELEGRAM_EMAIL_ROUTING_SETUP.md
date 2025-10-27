# 🚀 Telegram Email Routing Setup for CODEOWNERS

## Overview

This system automatically routes GitHub CODEOWNERS notifications to the correct Telegram threads using structured email addresses and Cloudflare Email Workers.

## 📧 Structured Email Format

```
[DOMAIN].[SCOPE].[TYPE].[HIERARCHY].[META]@cloudflare.com
```

### Token Definitions

| Position | Token | Values | Purpose |
|----------|-------|--------|---------|
| 1 | DOMAIN | `infra`, `docs`, `qa`, `integrations`, `exec` | Team subdomain |
| 2 | SCOPE | `lead`, `senior`, `junior`, `bot`, `alert` | Role level |
| 3 | TYPE | `pr`, `issue`, `deploy`, `alert`, `review` | Event type |
| 4 | HIERARCHY | `p0`, `p1`, `p2`, `p3`, `blk` | Priority level |
| 5 | META | `gh`, `tg`, `cf`, `24h` | Source system |

### Example Addresses

```
infra.lead.pr.p0.gh@cloudflare.com        → Infra lead PR review, P0 priority, GitHub
docs.senior.issue.p2.tg@cloudflare.com    → Docs senior issue, P2 priority, Telegram
qa.bot.alert.blk.24h@cloudflare.com       → QA bot alert, blocker, 24h SLA
exec.lead.deploy.p0.cf@cloudflare.com     → Exec deploy approval, P0, Cloudflare
```

## 🛠️ Setup Instructions

### Step 1: Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow prompts to create your bot
4. Save the **bot token** (starts with `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Step 2: Create Telegram Channels/Groups

Create private channels for each team:

```
#alchemy-infra       → Infrastructure Team (-1001234567890)
#alchemy-docs         → Documentation Team (-1001234567891)
#alchemy-qa           → Quality Team (-1001234567892)
#alchemy-integrations → Provider Team (-1001234567893)
#alchemy-exec         → Executive Team (-1001234567894)
```

**Important:** Add your bot as an administrator to each channel.

### Step 3: Deploy Email Worker

1. Go to [Cloudflare Workers](https://workers.cloudflare.com)
2. Create new Worker with `workers/email-router.js`
3. Set environment variables:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Chat IDs (get from @userinfobot or channel links)
INFRA_CHAT_ID=-1001234567890
DOCS_CHAT_ID=-1001234567891
QA_CHAT_ID=-1001234567892
INTEGRATIONS_CHAT_ID=-1001234567893
EXEC_CHAT_ID=-1001234567894

# Optional: Admin notifications
ADMIN_CHAT_ID=-1001234567899
```

### Step 4: Configure Email Routing

1. Go to [Cloudflare Email Routing](https://dash.cloudflare.com/7a470541a704caaf91e71efccc78fd36/misson-control.com/email/routing/overview)
2. Create catch-all rule:

```
Pattern: *.*.*.*.*@cloudflare.com
Action: Send to Worker
Worker: email-router
```

3. Add reject rule for bare domain:

```
Pattern: *@cloudflare.com
Action: Reject (block)
```

### Step 5: Test the System

Send test emails to verify routing:

```bash
# Test infrastructure notifications
echo "Test PR review" | mail -s "PR #123 Ready for Review" infra.lead.pr.p0.gh@cloudflare.com

# Test documentation notifications
echo "Doc update needed" | mail -s "Update API docs" docs.senior.issue.p2.gh@cloudflare.com

# Test QA alerts
echo "Pipeline failed" | mail -s "CI/CD Pipeline Broken" qa.bot.alert.blk.24h@cloudflare.com
```

## 📊 Message Format

Each email generates a Telegram message like:

```
🔴 **INFRA.LEAD** | Pull Request | 🐙

👤 **From:** notifications@github.com
📝 **Subject:** PR #123 Ready for Review
🏷️ **Priority:** P0
🔗 **Source:** GITHUB

🆔 **Message ID:** <123456@github.com>
```

## 🎯 CODEOWNERS Integration

Update your CODEOWNERS file to use structured addresses:

```codeowners
# Instead of @alice.smith
src/scope/* @alice.smith infra.lead.pr.p0.gh@cloudflare.com

# Instead of @frank.taylor
docs/* @frank.taylor docs.lead.pr.p2.gh@cloudflare.com

# Instead of @diana.prince
.github/workflows/* @diana.prince qa.lead.pr.p1.gh@cloudflare.com
```

## 🔧 Advanced Configuration

### Custom Priority Emojis

Modify `workers/email-router.js` to customize priority indicators:

```javascript
const priorityEmoji = {
  'p0': '🔴',    // Critical
  'p1': '🟠',    // High
  'p2': '🟡',    // Medium
  'p3': '🟢',    // Low
  'blk': '🚨'    // Blocker
};
```

### Source Indicators

```javascript
const sourceEmoji = {
  'gh': '🐙',    // GitHub
  'tg': '💬',    // Telegram
  'cf': '☁️',    // Cloudflare
  '24h': '⏰'    // SLA indicator
};
```

### Thread Organization

Messages automatically go to the correct team channel based on the DOMAIN token:
- `infra.*` → Infrastructure channel
- `docs.*` → Documentation channel
- `qa.*` → Quality channel
- `integrations.*` → Provider channel
- `exec.*` → Executive channel

## 📈 Monitoring & Maintenance

### Health Checks

Monitor system health by checking:
1. Worker error logs in Cloudflare dashboard
2. Telegram bot responsiveness (`/start` command)
3. Email delivery success rates

### Maintenance Tasks

- Regularly rotate bot tokens
- Update chat IDs if channels are recreated
- Monitor for bounced emails
- Review message formatting periodically

### Troubleshooting

**Emails not arriving:**
- Check Worker logs in Cloudflare dashboard
- Verify bot token is valid
- Ensure bot is administrator in target channels

**Wrong channel routing:**
- Double-check chat IDs in environment variables
- Verify email address format matches DOMAIN token

**Formatting issues:**
- Check that emails have proper subject lines
- Verify message parsing in Worker code

## 🚀 Benefits

✅ **Zero Configuration** - Email address structure contains all routing info
✅ **Automatic Threading** - Messages go to correct team channels
✅ **Priority Indicators** - Visual priority cues in Telegram
✅ **Source Tracking** - Know where notifications originate
✅ **Scalable** - Add new teams without code changes
✅ **Reliable** - Cloudflare's email infrastructure
✅ **Fast** - Near-instant delivery to Telegram

## 📞 Support

For issues with this system:
1. Check Cloudflare Worker logs
2. Verify Telegram bot permissions
3. Test email routing rules
4. Contact infrastructure team

---

**🎉 Your CODEOWNERS notifications now automatically route to the correct Telegram threads with full context and priority indicators!**
