# Reliability Layer Integration for Email PR Telegram

## Overview

This document describes the reliability layer integration for the Email PR Telegram system, providing enterprise-grade robustness with retry logic, circuit breakers, golden path workflows, and comprehensive message tracking.

## Architecture

### Core Components

1. **MessageTracker** - Tracks email-to-Telegram-to-GitHub message flow
2. **Reliability Layer** - Provides retry logic and circuit breakers
3. **Golden Path Executor** - Orchestrates workflows with reliability patterns
4. **Circuit Breakers** - Prevents cascading failures
5. **Retry Handler** - Implements exponential backoff retry logic

### Golden Path Workflows

#### Email → Telegram → GitHub → Email Reply

1. **Email Processing**
   - Parse email tokens and extract PR context
   - Track message receipt in database
   - Validate email structure and content

2. **Chat Resolution**
   - Resolve Telegram chat ID from D1 database
   - Handle missing mappings with fallback
   - Cache chat mappings for performance

3. **Telegram Integration**
   - Build rich PR card with AI analysis
   - Send interactive message to Telegram
   - Store mapping for callback handling

4. **Callback Processing**
   - Receive and validate Telegram callbacks
   - Execute GitHub actions (approve, comment, merge)
   - Send confirmation messages

5. **Email Reply (Optional)**
   - Send email reply to original sender
   - Include action results and context
   - Handle email delivery failures

## Message Tracking

### Database Schema

```sql
CREATE TABLE message_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  email_from TEXT NOT NULL,
  email_to TEXT NOT NULL,
  pr_id TEXT,
  telegram_chat_id TEXT,
  telegram_message_id TEXT,
  github_action TEXT,
  status TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tracking States

- `received` - Email received by worker
- `processed` - Email parsed and validated
- `sent_to_telegram` - Message sent to Telegram
- `callback_received` - Telegram callback received
- `github_action_executed` - GitHub action completed
- `email_reply_sent` - Email reply sent
- `failed` - Any step failed with error

### Metrics and Observability

```javascript
// Get tracking metrics for last 24 hours
const metrics = await messageTracker.getTrackingMetrics(24);
console.log(`Success rate: ${metrics.telegramSuccessRate}%`);
console.log(`Average processing time: ${metrics.averageProcessingTime}ms`);

// Get failed messages for debugging
const failures = await messageTracker.getFailedMessages(10);
```

## Reliability Patterns

### Retry Logic

```javascript
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error', 'Timeout']
};
```

### Circuit Breakers

```javascript
const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
};
```

### Golden Path Configuration

```javascript
const DEFAULT_GOLDEN_PATH_CONFIG = {
  enableRetry: true,
  enableCircuitBreaker: true,
  enableFallback: true,
  timeoutMs: 30000
};
```

## Implementation Details

### Worker Integration

The email orchestrator worker is enhanced with:

1. **Message ID Generation** - Unique IDs for tracking
2. **Reliability Layer Initialization** - Configured for all operations
3. **Golden Path Execution** - For PR emails and callbacks
4. **Error Tracking** - Comprehensive error logging and recovery

### Key Features

#### Automatic Retry
- Transient network failures are retried with exponential backoff
- Configurable retry attempts and delays
- Specific error types are marked as retryable

#### Circuit Breaking
- Prevents cascading failures when external services are down
- Automatic reset after timeout period
- Per-operation circuit breakers for granular control

#### Fallback Paths
- When golden path fails, basic email notification is sent
- Ensures critical messages are never lost
- Graceful degradation of functionality

#### Message Tracking
- Complete audit trail of message processing
- Performance metrics and success rates
- Failed message analysis and debugging

## Configuration

### Environment Variables

```bash
# Feature Flags
EMAIL_PR_TELEGRAM=1          # Enable PR Telegram integration
SEND_EMAIL_REPLY=1           # Enable email replies for PR actions

# Email Configuration
EMAIL_FROM=noreply@example.com
SENDGRID_API_KEY=your_sendgrid_key

# Database
DB=alchemy_db                # D1 database binding
```

### Wrangler Configuration

```toml
[vars]
EMAIL_PR_TELEGRAM = "1"
EMAIL_FROM = "noreply@example.com"

[[d1_databases]]
binding = "DB"
database_name = "alchemy-db"
database_id = "your-database-id"
```

## Deployment

### Migration

Apply the D1 migration to create tracking tables:

```bash
npx wrangler d1 execute alchemy-db --file=./.github/rfc006/migrations/003-email-tg-pr.sql
```

### Worker Deployment

```bash
npx wrangler deploy tgk-email-orchestrator
```

### Testing

Run the comprehensive test suite:

```bash
./scripts/test-reliability-integration.sh
```

## Monitoring

### Message Tracking Dashboard

Monitor message flow in real-time:

```sql
-- Get success rates by hour
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total,
  COUNT(CASE WHEN status != 'failed' THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN status != 'failed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM message_tracking 
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY hour
ORDER BY hour DESC;

-- Get failed messages by error type
SELECT 
  error,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM message_tracking 
WHERE status = 'failed' 
  AND timestamp > datetime('now', '-24 hours')
GROUP BY error
ORDER BY count DESC;
```

### Performance Metrics

Track processing times and bottlenecks:

```sql
-- Average processing time by status
SELECT 
  status,
  AVG(CASE WHEN status = 'github_action_executed' THEN 
    (julianday(updated_at) - julianday(timestamp)) * 24 * 60 * 60 
  END) as avg_processing_time_seconds,
  COUNT(*) as message_count
FROM message_tracking 
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY status;
```

## Troubleshooting

### Common Issues

1. **Circuit Breaker Open**
   - Check external service status
   - Monitor failure rates
   - Wait for automatic reset or manual intervention

2. **High Retry Rates**
   - Check network connectivity
   - Verify external service availability
   - Adjust retry configuration if needed

3. **Message Tracking Gaps**
   - Check database connectivity
   - Verify tracking initialization
   - Review error logs for tracking failures

### Debugging Tools

```javascript
// Get message lifecycle
const tracking = await messageTracker.getMessageTracking(messageId);
console.log('Message lifecycle:', tracking);

// Get system metrics
const metrics = await messageTracker.getTrackingMetrics(24);
console.log('System performance:', metrics);

// Get recent failures
const failures = await messageTracker.getFailedMessages(5);
console.log('Recent failures:', failures);
```

## Best Practices

### Reliability

1. **Always use golden path workflows** for critical operations
2. **Configure appropriate retry limits** to avoid infinite loops
3. **Monitor circuit breaker states** for early failure detection
4. **Implement proper fallback mechanisms** for graceful degradation

### Performance

1. **Track processing times** to identify bottlenecks
2. **Use message tracking** for observability
3. **Monitor database performance** with proper indexing
4. **Configure timeouts** appropriately for external services

### Security

1. **Sanitize all inputs** before processing
2. **Validate callback data** before execution
3. **Use secure email sending** with proper authentication
4. **Log security events** for audit trails

## Future Enhancements

### Planned Features

1. **Advanced Retry Strategies** - Custom retry policies per operation
2. **Dynamic Circuit Breaking** - Adaptive thresholds based on load
3. **Message Deduplication** - Prevent duplicate processing
4. **Performance Analytics** - Advanced metrics and dashboards
5. **Automated Recovery** - Self-healing mechanisms

### Scaling Considerations

1. **Horizontal Scaling** - Multiple worker instances
2. **Database Sharding** - Distribute tracking data
3. **Caching Layer** - Redis for frequently accessed data
4. **Load Balancing** - Distribute email processing load

## Conclusion

The reliability layer integration provides enterprise-grade robustness for the Email PR Telegram system. With comprehensive message tracking, retry logic, circuit breakers, and golden path workflows, the system can handle failures gracefully while maintaining high availability and performance.

The implementation ensures that critical email-to-Telegram workflows are reliable, observable, and maintainable, with proper error handling and fallback mechanisms to prevent message loss.
