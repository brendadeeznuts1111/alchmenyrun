# Cursor Kinja Integration Setup

**Transform your code editor into a Kinja-powered email orchestration console!**

## 🚀 Quick Setup

### 1. Add MCP Configuration

**Cursor → Settings → Cursor MCP → Edit JSON**

Add this to your MCP configuration array:

#### For Production (Remote Worker)
```json
{
  "name": "kinja-email-orchestrator",
  "description": "Kinja-enhanced Phase-6 e-mail orchestration (remote Worker)",
  "command": "npx",
  "args": ["wrangler", "dev", "--remote", "--config=.github/rfc006/phase-6-deployment.yml", "--", "--port", "0"],
  "env": {
    "WRANGLER_SEND_METRICS": "false",
    "CLOUDFLARE_ACCOUNT_ID": "7a470541a704caaf91e71efccc78fd36",
    "CLOUDFLARE_API_TOKEN": "mAOAD303u2Y3hm3wmYyxnWWz8_Y0kl_-2mJzd5So"
  },
  "rules": [
    {
      "name": "kinja:analyze",
      "description": "Send subject+body to Kinja and return priority, confidence, ETA",
      "prompt": "kinja:analyze\n$SUBJECT\n$BODY",
      "handler": "http-post",
      "url": "https://tgk-email-orchestrator.utahj4754.workers.dev/kinja/analyze",
      "headers": { "Content-Type": "application/json" },
      "body": {
        "subject": "{{SUBJECT}}",
        "body": "{{BODY}}"
      }
    },
    {
      "name": "kinja:test",
      "description": "Run a quick smoke test against the remote Worker",
      "prompt": "kinja:test",
      "handler": "http-get",
      "url": "https://tgk-email-orchestrator.utahj4754.workers.dev/kinja/health"
    },
    {
      "name": "kinja:metrics",
      "description": "Pull live Prometheus metrics from the Worker",
      "prompt": "kinja:metrics [$METRIC]",
      "handler": "http-get",
      "url": "https://tgk-email-orchestrator.utahj4754.workers.dev/metrics",
      "params": { "name": "{{METRIC}}" }
    }
  ]
}
```

#### For Local Development
```json
{
  "name": "kinja-email-orchestrator-local",
  "description": "Kinja-enhanced Phase-6 e-mail orchestration (local development)",
  "command": "bun",
  "args": ["run", "wrangler", "dev", "--local", "--port=8787"],
  "env": {
    "WRANGLER_SEND_METRICS": "false"
  },
  "rules": [
    {
      "name": "kinja:analyze",
      "description": "Send subject+body to Kinja and return priority, confidence, ETA",
      "prompt": "kinja:analyze\n$SUBJECT\n$BODY",
      "handler": "http-post",
      "url": "http://localhost:8787/kinja/analyze",
      "headers": { "Content-Type": "application/json" },
      "body": {
        "subject": "{{SUBJECT}}",
        "body": "{{BODY}}"
      }
    },
    {
      "name": "kinja:test",
      "description": "Run a quick smoke test against the local Worker",
      "prompt": "kinja:test",
      "handler": "http-get",
      "url": "http://localhost:8787/kinja/health"
    },
    {
      "name": "kinja:metrics",
      "description": "Pull local metrics from the Worker",
      "prompt": "kinja:metrics [$METRIC]",
      "handler": "http-get",
      "url": "http://localhost:8787/metrics",
      "params": { "name": "{{METRIC}}" }
    }
  ]
}
```

### 2. Reload Cursor

**Cursor → Developer → Reload Window**

### 3. Test the Integration

**Open command palette** (`Cmd-Shift-P` on Mac, `Ctrl-Shift-P` on Windows/Linux)

Type `kinja:` and you should see:
- `kinja:analyze` - Analyze email content with Kinja
- `kinja:test` - Test Worker connectivity
- `kinja:metrics` - View metrics

## 🎯 Usage Examples

### Analyze Email Content
```
Command: kinja:analyze
Subject: Database latency spike to 800ms
Body: p99 jumped significantly, affecting user experience. Need immediate investigation.

Response:
🔴 **INFRA.LEAD** | Alert | ☁️
• Time to Answer: 1h (Urgent)
• Correctness Score: 92% (Excellent)
• Priority: p0 (Critical infrastructure issue)
• Confidence: 0.89
• Actions: [page-oncall, create-incident, assess-impact]
```

### Quick Health Check
```
Command: kinja:test
Response: ✅ Kinja Email Orchestrator - All systems operational
```

### View Metrics
```
Command: kinja:metrics tgk_kinja_email_routing_total
Response: Current routing metrics and performance data
```

## 🔧 Configuration Files

### Pre-configured Files
- `.cursor-mcp-kinja.json` - Production remote configuration
- `.cursor-mcp-kinja-local.json` - Local development configuration

### Manual Setup
If you prefer manual configuration, copy the JSON blocks above into your Cursor MCP settings.

## 🚨 Troubleshooting

### Commands not appearing?
1. Check that JSON is valid (no trailing commas)
2. Reload Cursor window completely
3. Verify Worker URLs are accessible

### Connection errors?
1. For remote: Check Cloudflare Worker is deployed
2. For local: Ensure `wrangler dev` is running on port 8787
3. Verify CORS settings allow your domain

### Authentication issues?
1. Check CLOUDFLARE_API_TOKEN is valid
2. Ensure account has Worker deployment permissions
3. Verify zone access for email routing

## 📊 What You Get

- **Instant email analysis** without leaving your editor
- **Real-time priority assessment** with AI confidence scores
- **Actionable recommendations** based on content analysis
- **Live metrics monitoring** from your development environment
- **Seamless integration** with existing Kinja infrastructure

**Your code editor just became an intelligent email orchestration console! 🎉**

---

**Pro tip:** Use the Kinja grammar rules in `.cursorrules` to ensure consistent email address generation across your codebase.
