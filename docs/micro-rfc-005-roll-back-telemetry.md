# micro-rfc-005 Roll-back & Telemetry Documentation

## 📊 Telemetry Implementation

### **Telemetry Tag**
```typescript
// workers/github-webhook/index.ts - Line 5
const id = env.GITHUB_DO.idFromName(`gh_agent_${stream}`);
```

**Emits in Logpush:**
- `alc.do.id = gh_agent_forum-polish` (for forum-polish stream)
- `alc.do.id = gh_agent_mobile-app` (for mobile-app stream)

**Purpose:**
- Track which Durable Object instance handles each webhook
- Monitor performance per stream/topic
- Enable debugging of DO instance distribution

## 🔄 Roll-back Trigger

### **Automatic Roll-back Condition**
```
Roll-back trigger: >500 ms p99 latency for 24 h
```

**Implementation:**
- Monitor p99 latency for `github-webhook` worker
- Trigger automatic roll-back if p99 > 500ms for 24 consecutive hours
- Roll-back to previous worker version (pre-micro-rfc-005)

**Monitoring:**
- Cloudflare Analytics provides latency metrics
- Logpush telemetry includes `alc.do.id` for per-DO tracking
- Alerting configured for p99 latency threshold

### **Manual Roll-back Commands**
```bash
# Emergency roll-back to previous version
./tgk rollback github-webhook --stage prod --profile prod

# Verify roll-back completed
./tgk stage list --stage prod
```

## 📈 Performance Monitoring

### **Key Metrics**
- **p99 Latency:** Target < 500ms
- **DO Instance Count:** `gh_agent_forum-polish`, `gh_agent_mobile-app`
- **Error Rate:** Target < 0.1%
- **Throughput:** Webhooks per minute

### **Dashboard Queries**
```sql
-- Monitor DO performance
SELECT 
  alc.do.id,
  percentile(duration, 99) as p99_latency,
  count(*) as request_count
FROM logs
WHERE worker = "github-webhook"
GROUP BY alc.do.id
```

## 🚨 Alert Configuration

### **Latency Alert**
```
Trigger: p99_latency > 500ms for 24h
Action: Automatic roll-back + notification
```

### **Error Alert**
```
Trigger: error_rate > 0.1% for 1h
Action: Manual investigation + notification
```
