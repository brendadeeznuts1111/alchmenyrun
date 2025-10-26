# Alchemy Worker – Production Features Demo

Spin up a full-production Worker in **60 seconds** and **see** every new flag we ship.

## 1. Bootstrap
```bash
npm create alchemy@latest worker-prod-demo -- --template typescript
cd worker-prod-demo
alchemy configure --profile prod   # multi-account ready
```

## 2. Deploy with **all** production flags
```bash
alchemy deploy --stage preview
```
What you just enabled:
| Flag | Value | Why |
|------|-------|-----|
| `observability = true` | Auto-scraped Prometheus metrics | Track performance & errors |
| `smart_placement = true` | Respect cf.colo, reduce latency | Global performance optimization |
| `cron = "*/5 * * * *"` | Health-check every 5 min | Automated maintenance |
| `cpu_ms = 50000` | 50 second CPU limit | Prevent runaway processes |
| `distributed_tracing` | 10% trace sampling | Performance monitoring |

## 3. Watch the metrics
Open your deployed Worker URL and see the features in action:

- **Smart Placement**: Check `X-Colo` header shows your location
- **Cron Triggers**: Health endpoint called automatically every 5 min
- **Observability**: Metrics auto-logged for performance monitoring
- **CPU Limits**: Protected against long-running requests

## 4. Test the endpoints
```bash
# Health check (called by cron)
curl https://your-worker.workers.dev/health

# Image processing with metrics
curl https://your-worker.workers.dev/ -o resized.jpg

# Check headers for smart placement
curl -I https://your-worker.workers.dev/
# Look for: X-Colo header
```

## 5. Promote to prod
```bash
alchemy deploy --stage prod
```
Same artefact SHA → zero-downtime rollout.

## 6. Clean up
```bash
alchemy destroy --stage preview
alchemy destroy --stage prod
```

## Features Demonstrated

✅ **Observability** - Auto-injected metrics and tracing
✅ **Smart Placement** - Geographic optimization via cf.colo
✅ **Cron Triggers** - Scheduled tasks every 5 minutes
✅ **CPU Limits** - Resource protection (50s timeout)
✅ **Production Config** - Enterprise-grade Worker setup

**No prose, just commands.** Deploy and see every production flag working live.
