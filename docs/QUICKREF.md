# Quick Reference - CLI Commands

## 🚀 Common Commands

### Development
```bash
bun run alchemy:dev      # Hot-reload local dev
bun run dev              # Dev with CSS build
```

### Deployment
```bash
bun run deploy                        # Deploy to personal stage
bun run deploy:prod                   # Deploy to production
bun run deploy -- --stage staging    # Deploy to staging
bun run deploy -- --stage $USER      # Deploy to your stage
```

### Cleanup
```bash
bun run destroy                    # Destroy current stage
bun run destroy -- --stage pr-123  # Destroy PR stage
```

### Testing
```bash
bun run test                                     # Run all tests
bun run test:webhook https://your-url/webhook   # Test webhook
```

### Database
```bash
bun run db:generate    # Generate migrations
bun run db:migrate     # Run migrations
```

## 🎯 Stage Examples

| Command | Stage | Usage |
|---------|-------|-------|
| `bun run deploy` | `$USER` | Personal development |
| `bun run deploy:prod` | `prod` | Production |
| `bun run deploy -- --stage staging` | `staging` | Staging environment |
| `bun run deploy -- --stage pr-42` | `pr-42` | PR preview |

## 🔧 Useful Flags

```bash
--stage {name}    # Specify deployment stage
--adopt           # Adopt existing resources (no recreate)
--destroy         # Destroy resources
--dev             # Enable local development mode
```

## 📦 Full Command Reference

### alchemy:dev
Hot-reload local infrastructure development
```bash
bun run alchemy:dev
```

### dev
Build CSS and start development server
```bash
bun run dev
```

### deploy
Deploy to Cloudflare (default: personal stage)
```bash
bun run deploy
bun run deploy -- --stage prod
bun run deploy -- --stage staging --adopt
```

### deploy:prod
Deploy to production stage
```bash
bun run deploy:prod
```

### destroy
Destroy deployed resources
```bash
bun run destroy
bun run destroy -- --stage pr-123
```

### build:css
Build Tailwind CSS
```bash
bun run build:css
```

### test
Run Vitest test suite
```bash
bun run test
bun run test -- --watch
```

### test:integration
Run integration tests
```bash
bun run test:integration
```

### test:webhook
Test GitHub webhook endpoint
```bash
bun run test:webhook https://website-prod.workers.dev/api/github/webhook
```

### db:generate
Generate Drizzle ORM migrations
```bash
bun run db:generate
```

### db:migrate
Run database migrations
```bash
bun run db:migrate
```

## 🌐 URL Patterns

```
Personal:     https://website-{username}.{account}.workers.dev
Staging:      https://website-staging.{account}.workers.dev
Production:   https://website-prod.{account}.workers.dev
PR Preview:   https://website-pr-{number}.{account}.workers.dev
```

## 🔐 Environment Variables

### Required
```bash
ALCHEMY_PASSWORD          # Encryption password
CLOUDFLARE_API_TOKEN      # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID     # Your Cloudflare account ID
```

### Optional
```bash
GITHUB_TOKEN              # GitHub integration (optional)
GITHUB_WEBHOOK_SECRET     # Webhook secret (optional)
MCP_SHARED_SECRET         # MCP authentication (optional)
MCP_JWT_SECRET            # MCP JWT signing (optional)
```

## 📊 GitHub Actions

### Automatic Triggers

| Event | Stage | Action |
|-------|-------|--------|
| Push to `main` | `prod` | Deploy to production |
| Open PR | `pr-{number}` | Create preview |
| Update PR | `pr-{number}` | Update preview |
| Close PR | - | Auto-cleanup |

### Manual Workflow

```bash
# Trigger from GitHub UI
Actions → Alchemy → Run workflow
```

## 🐛 Troubleshooting

### Issue: Hot reload not working
```bash
# Check Bun version
bun --version  # Should be >= 1.0.0
bun upgrade
```

### Issue: Deployment fails
```bash
# Check secrets are set
echo $CLOUDFLARE_API_TOKEN
echo $ALCHEMY_PASSWORD

# Try with verbose logging
DEBUG=* bun run deploy
```

### Issue: Stage cleanup
```bash
# List active stages (check Cloudflare dashboard)
# Manually destroy old stages
bun run destroy -- --stage old-pr-123
```

## 📚 Resources

- **Full Guide**: [CLI_CI_SETUP.md](./CLI_CI_SETUP.md)
- **Main Docs**: [README.md](./README.md)
- **Alchemy Docs**: https://alchemy.run
- **GitHub Repo**: https://github.com/brendadeeznuts1111/alchmenyrun

