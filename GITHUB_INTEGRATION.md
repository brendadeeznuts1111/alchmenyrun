# GitHub Integration Guide

> **Status**: 🚧 **Framework Scaffold** - This integration is prepared but requires API discovery to complete.
>
> Alchemy includes a native GitHub provider, but the exact resource API needs to be discovered from the documentation. This guide provides the complete infrastructure scaffold, webhook handler, and testing tools ready for implementation once the API is confirmed.

This guide explains how to use Alchemy's GitHub provider to manage repositories and webhooks for CI/CD automation with Cloudflare Workers.

## Current Implementation Status

✅ **Completed:**
- Webhook endpoint handler (`/api/github/webhook`)
- Push and pull_request event processing
- Workflow integration examples
- Environment configuration (`.env.example`)
- Comprehensive documentation
- Test scripts and testing guide

🚧 **Requires API Discovery:**
- GitHub resource imports and initialization
- Repository creation code
- Webhook registration code

The webhook handler is fully functional and can receive GitHub events right now. You just need to manually create the repository and webhook, or complete the Alchemy GitHub resource integration.

## Quick Start (Manual Setup)

Until the Alchemy GitHub API is discovered, you can manually set up webhooks:

1. Create a repository on GitHub
2. Go to repository Settings > Webhooks > Add webhook
3. Set URL to: `https://your-worker.workers.dev/api/github/webhook`
4. Set Content type: `application/json`
5. Select events: `push`, `pull_request`
6. Add the webhook

Your Worker will now receive GitHub events and can trigger Cloudflare Workflows!

## Overview

The GitHub integration demonstrates how to:
- Create and manage GitHub repositories as infrastructure code
- Register webhooks to receive GitHub events
- Process webhook events in Cloudflare Workers
- Trigger automated deployments and workflows

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Alchemy Cloudflare Demo")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `admin:repo_hook` (Full control of repository hooks)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_personal_access_token_here

# Optional: Custom webhook secret (auto-generated if not provided)
GITHUB_WEBHOOK_SECRET=your_secure_random_string
```

If you don't provide a `GITHUB_WEBHOOK_SECRET`, Alchemy will automatically generate one for you.

### 3. Deploy the Infrastructure

With the GitHub token configured, deploy your infrastructure:

```bash
bun run deploy
```

This will:
1. Create a GitHub repository (if it doesn't exist)
2. Register a webhook pointing to your Cloudflare Worker
3. Configure the webhook to receive push and pull_request events

## Architecture

### Resource Definition (`alchemy.run.ts`)

```typescript
import { GitHub, RepositoryWebhook } from "alchemy/github";

// Create a GitHub repository
const githubRepo = await GitHub("demo-repo", {
  name: "alchemy-cloudflare-demo",
  description: "Demo repository managed by Alchemy",
  private: false,
  hasIssues: true,
  hasWiki: false,
  autoInit: true,
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});

// Register a webhook
const githubWebhook = await RepositoryWebhook("deploy-webhook", {
  repository: githubRepo.fullName,
  events: ["push", "pull_request"],
  url: `${website.apiUrl}/api/github/webhook`,
  contentType: "json",
  secret: alchemy.secret(process.env.GITHUB_WEBHOOK_SECRET),
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});
```

### Webhook Handler (`src/backend/server.ts`)

The Worker includes a webhook endpoint that receives and processes GitHub events:

```typescript
// GitHub webhook endpoint
if (path === "/api/github/webhook" && request.method === "POST") {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const payload = await request.json();

  // Handle push events
  if (event === "push") {
    const branch = payload.ref?.replace("refs/heads/", "");
    if (branch === "main") {
      // Trigger deployment workflow
      await env.WORKFLOW.get(workflowId).start({
        event: "deploy",
        branch,
        commit: payload.head_commit?.id,
      });
    }
  }

  // Handle pull request events
  if (event === "pull_request") {
    const action = payload.action;
    const prNumber = payload.pull_request?.number;
    if (action === "opened" || action === "synchronize") {
      // Trigger preview deployment
      await env.WORKFLOW.get(workflowId).start({
        event: "preview",
        prNumber,
        branch: payload.pull_request?.head?.ref,
      });
    }
  }
}
```

## Use Cases

### 1. Automated Production Deployments

When code is pushed to the `main` branch:
1. GitHub sends a `push` event to your Worker
2. Worker triggers a Cloudflare Workflow
3. Workflow deploys the latest code to production
4. Deployment status is logged and tracked

### 2. Preview Environments for Pull Requests

When a pull request is opened or updated:
1. GitHub sends a `pull_request` event to your Worker
2. Worker creates a preview deployment with a unique URL
3. Preview environment is automatically updated on new commits
4. Preview is cleaned up when the PR is closed

### 3. CI/CD Pipeline Integration

Connect GitHub Actions with Cloudflare Workers:
1. GitHub Actions run tests and builds
2. On success, trigger your Worker's webhook
3. Worker deploys to appropriate stage (staging/production)
4. Worker updates deployment status back to GitHub

### 4. Repository Management as Code

Manage multiple repositories consistently:
```typescript
const repos = ["api", "frontend", "backend"].map(name => 
  GitHub(`${name}-repo`, {
    name: `my-project-${name}`,
    description: `${name} repository`,
    private: true,
    token: alchemy.secret(process.env.GITHUB_TOKEN),
  })
);
```

## Webhook Events

The integration currently handles these events:

- **push**: Code pushed to a branch
  - Use for: Automated deployments, running tests, updating documentation
  
- **pull_request**: PR opened, updated, or closed
  - Use for: Preview environments, running tests, code reviews

You can extend the webhook to handle additional events:
- `issues`: Issue opened, closed, or commented
- `release`: Release published
- `workflow_run`: GitHub Actions workflow completed
- `check_run`: Check run completed

## Security

### Webhook Signature Verification

The webhook endpoint includes signature verification:

```typescript
const signature = request.headers.get("x-hub-signature-256");
// TODO: Verify signature matches HMAC of payload with webhook secret
```

To implement full signature verification:

```typescript
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  
  const expectedSignature = `sha256=${Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;
  
  return signature === expectedSignature;
}
```

### Token Management

- Store tokens in environment variables, never in code
- Use `alchemy.secret()` to encrypt sensitive values
- Rotate tokens periodically
- Use fine-grained personal access tokens when possible

## Testing

### 1. Test Webhook Delivery

After deployment, test the webhook:

```bash
# Get your webhook URL from deployment output
curl -X POST https://your-worker.workers.dev/api/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-123" \
  -d '{"ref":"refs/heads/main","repository":{"full_name":"test/repo"}}'
```

### 2. View Webhook Deliveries

In your GitHub repository:
1. Go to Settings > Webhooks
2. Click on your webhook
3. View recent deliveries and responses

### 3. Test with Real Events

Push a commit to the repository to trigger a real webhook delivery.

## Cleanup

To remove the GitHub resources:

```bash
bun run destroy
```

This will:
1. Delete the webhook from GitHub
2. Delete the repository (if you want to keep it, comment out the GitHub resource before destroying)

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is accessible from internet
2. Verify webhook is active in GitHub repository settings
3. Check Cloudflare Worker logs for errors

### Authentication Errors

1. Verify `GITHUB_TOKEN` is valid and not expired
2. Check token has required scopes (`repo`, `workflow`, `admin:repo_hook`)
3. Ensure token has access to the target repository

### Repository Creation Fails

1. Verify you have permission to create repositories
2. Check if repository name is already taken
3. Ensure organization name is correct (if using)

## Advanced Configuration

### Custom Repository Settings

```typescript
const repo = await GitHub("advanced-repo", {
  name: "my-advanced-repo",
  description: "Advanced configuration example",
  private: true,
  hasIssues: true,
  hasProjects: true,
  hasWiki: true,
  hasDownloads: true,
  autoInit: true,
  gitignoreTemplate: "Node",
  licenseTemplate: "mit",
  allowSquashMerge: true,
  allowMergeCommit: false,
  allowRebaseMerge: true,
  deleteBranchOnMerge: true,
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});
```

### Multiple Webhooks

```typescript
// Deployment webhook
const deployWebhook = await RepositoryWebhook("deploy-webhook", {
  repository: repo.fullName,
  events: ["push"],
  url: `${website.apiUrl}/api/github/deploy`,
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});

// PR webhook
const prWebhook = await RepositoryWebhook("pr-webhook", {
  repository: repo.fullName,
  events: ["pull_request", "pull_request_review"],
  url: `${website.apiUrl}/api/github/pr`,
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});
```

## Resources

- [Alchemy GitHub Provider Documentation](https://alchemy.run/providers/github)
- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## Support

For issues or questions:
- [Alchemy Discord](https://discord.gg/alchemy)
- [GitHub Issues](https://github.com/alchemy-run/alchemy/issues)

