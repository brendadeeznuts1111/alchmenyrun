# Production MCP Worker Deployment Guide

**Production-grade Worker-based MCP server for Cloudflare infrastructure management**

## Overview

The MCP Worker is a production-ready Cloudflare Worker that exposes Alchemy infrastructure operations as Model Context Protocol (MCP) tools with:

- ✅ JWT & Shared Secret Authentication
- ✅ Rate Limiting (100 req/min in prod)
- ✅ Dark Launch Support (0-100% rollout)
- ✅ 28+ Test Suite
- ✅ Full CI/CD Pipeline
- ✅ Custom Domain Support

## Architecture

```
┌──────────────┐
│ AI Assistant │ (Claude, Cursor, etc.)
│  MCP Client  │
└──────┬───────┘
       │ HTTPS + Auth
       │
┌──────▼───────┐
│   mcp.       │
│ example.com  │  Cloudflare Worker
└──────┬───────┘
       │
       ├─ Authentication (JWT/Secret)
       ├─ Rate Limiting (KV)
       ├─ Dark Launch (Feature Flags)
       └─ MCP Tools (8 operations)
```

## Prerequisites

### 1. GitHub Secrets

Add these to your GitHub repository secrets:

```
MCP_SHARED_SECRET    # Simple auth token (e.g., openssl rand -hex 32)
MCP_JWT_SECRET       # JWT signing secret (e.g., openssl rand -hex 64)
```

### 2. Environment Variables

For local development, create `.env`:

```bash
# MCP Authentication
MCP_SHARED_SECRET=your-secret-here
MCP_JWT_SECRET=your-jwt-secret-here

# Environment
ENVIRONMENT=development  # or production, staging
```

### 3. Custom Domain (Optional)

Configure in Cloudflare Dashboard:
1. Add domain to Cloudflare
2. Update `alchemy.run.ts` with your domain:
   ```typescript
   routes: [{
     pattern: "mcp.yourdomain.com/*",
     customDomain: true
   }]
   ```

## Deployment

### Automatic (CI/CD)

Push to main branch:

```bash
git add .
git commit -m "Deploy MCP worker"
git push origin main
```

GitHub Actions will:
1. Run tests (including MCP tests)
2. Deploy to production
3. Output worker URL

### Manual Deployment

```bash
# Deploy to production
bun alchemy deploy --stage prod

# Deploy to staging
bun alchemy deploy --stage staging
```

## Dark Launch Configuration

Control traffic rollout with feature flags stored in KV:

### Set Dark Launch Percentage

```bash
# Via wrangler CLI
wrangler kv:key put --binding=MCP_KV "feature:dark-launch-percentage" "0"

# Start with 0%, gradually increase:
# 0%   → No traffic (testing)
# 10%  → 10% of requests
# 50%  → Half traffic
# 100% → Full rollout
```

### Using the API

```bash
# Get current percentage
curl https://mcp.example.com/health

# Update via admin endpoint (if implemented)
curl -X PUT https://mcp.example.com/admin/dark-launch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"percentage": 25}'
```

## Authentication

### Option 1: Shared Secret (Simplest)

```bash
# Make requests with X-MCP-Secret header
curl https://mcp.example.com/mcp \
  -H "X-MCP-Secret: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize"
  }'
```

### Option 2: JWT Token (Recommended)

```bash
# Generate JWT token
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'user-123', client_id: 'my-client' },
  process.env.MCP_JWT_SECRET,
  { expiresIn: '1h' }
);
console.log(token);
"

# Use token in requests
curl https://mcp.example.com/mcp \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Rate Limits

### Default Limits

| Environment | Requests | Window |
|-------------|----------|--------|
| Production  | 100      | 1 min  |
| Staging     | 500      | 1 min  |
| Development | 1000     | 1 min  |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Retry after 45 seconds",
  "retryAfter": 45
}
```

## Available MCP Tools

### 1. get_resource_status
Get status of all deployed resources

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_resource_status",
    "arguments": { "stage": "prod" }
  }
}
```

### 2. deploy_infrastructure
Deploy to a specific stage

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "deploy_infrastructure",
    "arguments": { 
      "stage": "staging",
      "dryRun": true
    }
  }
}
```

### 3. destroy_infrastructure
Destroy stage resources (requires confirmation)

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "destroy_infrastructure",
    "arguments": { 
      "stage": "preview-123",
      "confirm": true
    }
  }
}
```

### 4. query_database
Execute SQL queries (SELECT only)

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": { 
      "query": "SELECT * FROM users LIMIT 10",
      "stage": "prod"
    }
  }
}
```

### 5. list_bucket_objects
List R2 objects

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "list_bucket_objects",
    "arguments": { 
      "prefix": "uploads/",
      "limit": 50
    }
  }
}
```

### 6. trigger_workflow
Start Cloudflare Workflow

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "trigger_workflow",
    "arguments": { 
      "workflowName": "OnboardingWorkflow",
      "params": { "userId": "user-123" }
    }
  }
}
```

### 7. get_cache_stats
Get KV statistics

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_cache_stats",
    "arguments": { "stage": "prod" }
  }
}
```

### 8. send_durable_object_message
Send message to Durable Object

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "send_durable_object_message",
    "arguments": { 
      "objectName": "ChatDO",
      "message": "Hello from MCP"
    }
  }
}
```

## Monitoring

### Health Check

```bash
curl https://mcp.example.com/health
```

Response:
```json
{
  "status": "ok",
  "service": "mcp-worker",
  "environment": "production",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Cloudflare Dashboard

Monitor in Cloudflare dashboard:
- **Workers & Pages** → **mcp-server**
- View logs, metrics, and analytics
- Check CPU usage and request rates

### Logs

View real-time logs:

```bash
wrangler tail mcp-server
```

Filter for errors:

```bash
wrangler tail mcp-server | grep ERROR
```

## Security Best Practices

### 1. Rotate Secrets Regularly

```bash
# Generate new secrets
export NEW_SECRET=$(openssl rand -hex 32)

# Update GitHub secrets
gh secret set MCP_SHARED_SECRET -b"$NEW_SECRET"

# Redeploy
bun alchemy deploy --stage prod
```

### 2. Use JWT for Production

Shared secrets are easier but JWT provides:
- Expiration times
- Revocation capability
- Per-client tracking
- Fine-grained permissions

### 3. Monitor Rate Limits

Set up alerts for:
- Repeated 429 responses
- Unusual traffic patterns
- Authentication failures

### 4. Production Safeguards

The worker includes safety checks:
- Cannot destroy production without extra steps
- Only SELECT queries allowed
- Confirmation required for destructive operations
- Stage isolation

## Troubleshooting

### 401 Unauthorized

```
✗ Check MCP_SHARED_SECRET or JWT_SECRET
✗ Verify authentication header format
✗ Check JWT expiration
```

### 429 Rate Limit

```
✗ Wait for rate limit reset
✗ Check X-RateLimit-Reset header
✗ Consider requesting higher limits
```

### 503 Service Unavailable

```
✗ Check dark launch percentage
✗ Increase rollout percentage
✗ Verify worker is deployed
```

### Tool Execution Errors

```
✗ Check tool parameters
✗ Verify resource bindings
✗ Review worker logs
```

## Testing

### Run All Tests

```bash
bun test src/mcp/*.test.ts
```

### Run Specific Test Suite

```bash
bun test src/mcp/index.test.ts
```

### Test Coverage

28+ tests covering:
- Authentication (JWT & shared secret)
- Rate limiting
- MCP protocol compliance
- All 8 tools
- Error handling
- CORS
- 404 routes

## Rollback Procedure

If issues occur:

### 1. Immediate Rollback

```bash
# Set dark launch to 0%
wrangler kv:key put --binding=MCP_KV \
  "feature:dark-launch-percentage" "0"
```

### 2. Deploy Previous Version

```bash
# Checkout previous version
git checkout HEAD~1

# Redeploy
bun alchemy deploy --stage prod
```

### 3. Revert Git

```bash
git revert HEAD
git push origin main
```

## Production Checklist

Before deploying to production:

- [ ] Secrets configured in GitHub
- [ ] Tests passing (28+ tests)
- [ ] Dark launch set to 0%
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Rate limits appropriate
- [ ] Documentation reviewed
- [ ] Rollback plan ready

## Support

- **Repository Issues**: https://github.com/your-org/your-repo/issues
- **Alchemy Docs**: https://alchemy.run
- **MCP Spec**: https://modelcontextprotocol.io
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

**Status**: Production-ready with 28+ test coverage and dark launch support
**Version**: 1.0.0
**Last Updated**: October 25, 2025

