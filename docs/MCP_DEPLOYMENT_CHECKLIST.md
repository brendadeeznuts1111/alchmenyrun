# MCP Worker Deployment Checklist

**Ready to deploy your production MCP Worker? Follow this checklist.**

## Pre-Deployment

### 1. GitHub Secrets Configuration ✅

```bash
# Generate secrets
export MCP_SHARED_SECRET=$(openssl rand -hex 32)
export MCP_JWT_SECRET=$(openssl rand -hex 64)

# Add to GitHub
gh secret set MCP_SHARED_SECRET -b"$MCP_SHARED_SECRET"
gh secret set MCP_JWT_SECRET -b"$MCP_JWT_SECRET"
```

- [ ] `MCP_SHARED_SECRET` set in GitHub
- [ ] `MCP_JWT_SECRET` set in GitHub
- [ ] Secrets securely stored locally (password manager)

### 2. Environment Variables ✅

```bash
# Local .env file
echo "MCP_SHARED_SECRET=$MCP_SHARED_SECRET" >> .env
echo "MCP_JWT_SECRET=$MCP_JWT_SECRET" >> .env
echo "ENVIRONMENT=production" >> .env
```

- [ ] `.env` file created
- [ ] Secrets added to `.env`
- [ ] `.env` in `.gitignore`

### 3. Custom Domain (Optional) ✅

If using custom domain:

```typescript
// alchemy.run.ts
routes: [{
  pattern: "mcp.yourdomain.com/*",  // Update this
  customDomain: true
}]
```

- [ ] Domain added to Cloudflare
- [ ] DNS configured
- [ ] Pattern updated in `alchemy.run.ts`

### 4. Tests Passing ✅

```bash
# Run all tests
bun test src/mcp/*.test.ts
```

- [ ] All 28+ tests passing
- [ ] No linting errors
- [ ] TypeScript compiles

## Deployment

### 5. Initial Dark Launch ✅

Start with 0% traffic for safety:

```bash
wrangler kv:key put --binding=MCP_KV \
  "feature:dark-launch-percentage" "0"
```

- [ ] Dark launch set to 0%
- [ ] KV binding configured
- [ ] Ready for gradual rollout

### 6. Deploy to Production ✅

```bash
# Deploy
bun alchemy deploy --stage prod

# Verify deployment
curl https://mcp.example.com/health
```

- [ ] Deployment successful
- [ ] Health check returns 200
- [ ] Worker URL accessible

### 7. Test Authentication ✅

```bash
# Test with shared secret
curl https://mcp.example.com/mcp \
  -H "X-MCP-Secret: $MCP_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize"
  }'
```

- [ ] Shared secret auth works
- [ ] Returns valid initialize response
- [ ] JWT auth tested (if using)

### 8. Test MCP Protocol ✅

```bash
# Test tools/list
curl https://mcp.example.com/mcp \
  -H "X-MCP-Secret: $MCP_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

- [ ] tools/list returns 8 tools
- [ ] JSON-RPC format correct
- [ ] Response includes tool schemas

### 9. Test Rate Limiting ✅

```bash
# Make multiple requests
for i in {1..5}; do
  curl -s -D - https://mcp.example.com/mcp \
    -H "X-MCP-Secret: $MCP_SHARED_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":'$i',"method":"initialize"}' \
    | grep "X-RateLimit"
done
```

- [ ] Rate limit headers present
- [ ] X-RateLimit-Remaining decrements
- [ ] X-RateLimit-Reset correct

## Post-Deployment

### 10. Gradual Rollout ✅

Increase traffic gradually:

```bash
# 10% traffic
wrangler kv:key put --binding=MCP_KV \
  "feature:dark-launch-percentage" "10"

# Wait 1 hour, monitor
# If stable, increase to 25%

# 25% traffic
wrangler kv:key put --binding=MCP_KV \
  "feature:dark-launch-percentage" "25"

# Continue: 50% → 75% → 100%
```

- [ ] Started at 10%
- [ ] Monitored for 1 hour
- [ ] Increased to 25%
- [ ] Increased to 50%
- [ ] Increased to 75%
- [ ] Increased to 100%

### 11. Monitoring Setup ✅

```bash
# Set up log tailing
wrangler tail mcp-server

# In another terminal, watch for errors
wrangler tail mcp-server | grep ERROR
```

- [ ] Logs accessible
- [ ] No unexpected errors
- [ ] Performance acceptable

### 12. Test All Tools ✅

Test each of the 8 tools:

```bash
# 1. get_resource_status
# 2. deploy_infrastructure (dryRun)
# 3. destroy_infrastructure (staging only)
# 4. query_database (SELECT only)
# 5. list_bucket_objects
# 6. trigger_workflow
# 7. get_cache_stats
# 8. send_durable_object_message
```

- [ ] All tools execute successfully
- [ ] Safety checks work (no prod destroy, etc.)
- [ ] Response format correct

## Verification

### 13. Final Checks ✅

```bash
# Health check
curl https://mcp.example.com/health

# Authentication working
curl https://mcp.example.com/mcp \
  -H "X-MCP-Secret: wrong-secret" | grep 401

# Rate limiting active
# (make 101+ requests in 1 minute, expect 429)

# CORS enabled
curl -i https://mcp.example.com/mcp -X OPTIONS
```

- [ ] Health check 200 OK
- [ ] Auth rejection works (401)
- [ ] Rate limiting works (429)
- [ ] CORS headers present

### 14. Documentation ✅

- [ ] [MCP_WORKER_PRODUCTION.md](./MCP_WORKER_PRODUCTION.md) reviewed
- [ ] [MCP_WORKER_COMPLETE.md](./MCP_WORKER_COMPLETE.md) checked
- [ ] Team briefed on deployment
- [ ] Rollback procedure understood

### 15. Monitoring & Alerts ✅

- [ ] Cloudflare dashboard checked
- [ ] Metrics baseline established
- [ ] Alert thresholds set (optional)
- [ ] On-call rotation defined (if applicable)

## Rollback Plan

### If Issues Occur:

**Option 1: Dark Launch to 0%**
```bash
wrangler kv:key put --binding=MCP_KV \
  "feature:dark-launch-percentage" "0"
```

**Option 2: Revert Deployment**
```bash
git checkout HEAD~1
bun alchemy deploy --stage prod
```

**Option 3: Emergency Disable**
```bash
# Delete worker
wrangler delete mcp-server
```

- [ ] Rollback procedure tested
- [ ] Team knows rollback steps
- [ ] Backup deployment ready

## Success Criteria

All checks must pass:

- ✅ Secrets configured
- ✅ Tests passing
- ✅ Deployed successfully
- ✅ Health check works
- ✅ Authentication works
- ✅ Rate limiting works
- ✅ All 8 tools work
- ✅ Dark launch configured
- ✅ Monitoring active
- ✅ Documentation complete

## Timeline

**Recommended deployment timeline:**

- **T+0**: Deploy with 0% (dark launch)
- **T+1h**: Test thoroughly
- **T+2h**: Increase to 10%
- **T+3h**: Monitor
- **T+4h**: Increase to 25%
- **T+6h**: Monitor
- **T+8h**: Increase to 50%
- **T+12h**: Monitor
- **T+24h**: Increase to 75%
- **T+48h**: Monitor
- **T+72h**: Increase to 100%

Adjust timeline based on traffic and confidence level.

## Emergency Contacts

- **Repository**: https://github.com/your-org/your-repo
- **Alchemy Docs**: https://alchemy.run
- **Cloudflare Support**: https://dash.cloudflare.com/support
- **Team Lead**: [Your contact]
- **On-call**: [Your contact]

## Sign-off

- [ ] Deployment lead: _______________
- [ ] Technical review: _______________
- [ ] Date deployed: _______________
- [ ] Production URL: _______________

---

**Status**: Ready for production deployment 🚀

Use this checklist for every production deployment to ensure consistency and safety.

