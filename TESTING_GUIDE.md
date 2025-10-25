# Testing Guide for GitHub Integration

This guide explains how to test the GitHub integration functionality.

## Prerequisites

Before testing, ensure you have:
1. Deployed the infrastructure with `bun run deploy`
2. Configured `GITHUB_TOKEN` in your `.env` file
3. The worker URL from the deployment output

## Manual Testing

### 1. Verify Repository Creation

After deployment with a valid `GITHUB_TOKEN`, check that the repository was created:

```bash
# Visit your GitHub account
# Look for a repository named "alchemy-cloudflare-demo"
```

Or use the GitHub CLI:

```bash
gh repo view alchemy-cloudflare-demo
```

### 2. Verify Webhook Registration

Check that the webhook was registered:

```bash
# Visit: https://github.com/YOUR_USERNAME/alchemy-cloudflare-demo/settings/hooks
# You should see a webhook pointing to your Worker URL
```

Or use the GitHub CLI:

```bash
gh api repos/YOUR_USERNAME/alchemy-cloudflare-demo/hooks
```

### 3. Test Webhook Endpoint

Use the provided test script:

```bash
./scripts/test-github-webhook.sh https://website-prod.YOUR_ACCOUNT.workers.dev/api/github/webhook
```

Expected output:
```
Testing GitHub webhook endpoint: https://...

1. Testing push event...
Response code: 200
Response body: {"received":true,"event":"push","delivery":"test-push-..."}
✅ Push event test passed

2. Testing pull_request event...
Response code: 200
Response body: {"received":true,"event":"pull_request","delivery":"test-pr-..."}
✅ Pull request event test passed

=== Test Summary ===
✅ All webhook tests passed!
```

### 4. Test Real GitHub Events

Trigger real events from GitHub:

**Push Event:**
```bash
# Clone the repository
gh repo clone alchemy-cloudflare-demo
cd alchemy-cloudflare-demo

# Make a change and push
echo "# Test" >> README.md
git add README.md
git commit -m "Test webhook"
git push origin main
```

**Pull Request Event:**
```bash
# Create a new branch
git checkout -b test-webhook
echo "# Test PR" >> test.md
git add test.md
git commit -m "Test PR webhook"
git push origin test-webhook

# Create PR via GitHub CLI
gh pr create --title "Test webhook" --body "Testing webhook integration"
```

### 5. View Worker Logs

Check the Cloudflare dashboard to see webhook events being received:

```bash
# Using wrangler
wrangler tail website-prod

# Or visit: https://dash.cloudflare.com/
# Navigate to Workers & Pages > website-prod > Logs
```

## Automated Testing

### Unit Tests

Test the webhook handler logic:

```typescript
// src/tests/github-webhook.test.ts
import { describe, expect, it } from "vitest";

describe("GitHub Webhook Handler", () => {
  it("should handle push events", async () => {
    const request = new Request("http://localhost/api/github/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "push",
        "X-GitHub-Delivery": "test-123",
      },
      body: JSON.stringify({
        ref: "refs/heads/main",
        repository: { full_name: "test/repo" },
        head_commit: { id: "abc123" },
      }),
    });

    // Test your handler
    // const response = await handler(request);
    // expect(response.status).toBe(200);
  });

  it("should handle pull_request events", async () => {
    const request = new Request("http://localhost/api/github/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "pull_request",
        "X-GitHub-Delivery": "test-456",
      },
      body: JSON.stringify({
        action: "opened",
        pull_request: { number: 42, head: { ref: "feature" } },
        repository: { full_name: "test/repo" },
      }),
    });

    // Test your handler
    // const response = await handler(request);
    // expect(response.status).toBe(200);
  });
});
```

Run the tests:

```bash
bun test src/tests/github-webhook.test.ts
```

### Integration Tests

Test the full flow from GitHub to your Worker:

```bash
# 1. Deploy to a test stage
bun alchemy deploy --stage test

# 2. Run the webhook test script
./scripts/test-github-webhook.sh https://website-test.YOUR_ACCOUNT.workers.dev/api/github/webhook

# 3. Trigger real events
gh repo clone alchemy-cloudflare-demo
cd alchemy-cloudflare-demo
echo "test" > test.txt
git add test.txt
git commit -m "Integration test"
git push origin main

# 4. Check worker logs
wrangler tail website-test

# 5. Clean up test stage
bun alchemy destroy --stage test
```

## Troubleshooting

### Webhook Returns 404

**Problem:** Webhook endpoint not found

**Solutions:**
1. Verify the worker is deployed: `bun alchemy deploy`
2. Check the URL matches your worker URL
3. Ensure the path is `/api/github/webhook`

### Webhook Returns 500

**Problem:** Internal server error

**Solutions:**
1. Check worker logs: `wrangler tail website-prod`
2. Verify environment bindings are correct
3. Check for syntax errors in webhook handler

### No Events Received

**Problem:** Webhook is registered but no events are received

**Solutions:**
1. Check webhook is active in GitHub settings
2. Verify webhook URL is publicly accessible
3. Check recent deliveries in GitHub webhook settings
4. Look for error responses in GitHub delivery logs

### Authentication Errors

**Problem:** GitHub API returns 401 or 403

**Solutions:**
1. Verify `GITHUB_TOKEN` is valid
2. Check token has required scopes
3. Ensure token hasn't expired
4. Verify token has access to the repository

## Test Checklist

Before considering the integration complete, verify:

- [ ] Repository created successfully on GitHub
- [ ] Webhook registered in repository settings
- [ ] Webhook endpoint returns 200 for test requests
- [ ] Push events are received and logged
- [ ] Pull request events are received and logged
- [ ] Real GitHub events trigger the webhook
- [ ] Worker logs show event details
- [ ] Workflow integration works (if enabled)
- [ ] Cleanup works: `bun run destroy` removes webhook and repository

## Performance Testing

### Load Testing the Webhook Endpoint

Test webhook endpoint performance:

```bash
# Using Apache Bench
ab -n 1000 -c 10 -p payload.json -T application/json \
  https://website-prod.YOUR_ACCOUNT.workers.dev/api/github/webhook

# Using wrk
wrk -t 4 -c 100 -d 30s --timeout 10s \
  -s scripts/webhook-load-test.lua \
  https://website-prod.YOUR_ACCOUNT.workers.dev/api/github/webhook
```

Expected results:
- Latency: < 100ms p99
- Throughput: > 1000 req/s
- Error rate: < 0.1%

## Security Testing

### Test Webhook Signature Verification

Verify webhook signatures are checked:

```bash
# Send request without signature
curl -X POST https://website-prod.YOUR_ACCOUNT.workers.dev/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main"}'

# Should return 401 or 403 if signature verification is implemented
```

### Test Rate Limiting

Verify rate limiting works:

```bash
# Send many requests quickly
for i in {1..100}; do
  curl -X POST https://website-prod.YOUR_ACCOUNT.workers.dev/api/github/webhook \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Event: push" \
    -d '{"ref":"refs/heads/main"}' &
done
wait
```

## Continuous Testing

### GitHub Actions Workflow

Create `.github/workflows/test-webhook.yml`:

```yaml
name: Test Webhook

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test-webhook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Deploy to test stage
        run: bun alchemy deploy --stage test
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          
      - name: Test webhook
        run: ./scripts/test-github-webhook.sh ${{ steps.deploy.outputs.url }}/api/github/webhook
        
      - name: Cleanup
        if: always()
        run: bun alchemy destroy --stage test
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
- [Vitest Documentation](https://vitest.dev/)
- [curl Documentation](https://curl.se/docs/)

