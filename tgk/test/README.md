# tgk RFC Lifecycle Comprehensive Test Suite

This test suite provides comprehensive validation of the `tgk` RFC Lifecycle Orchestration system, including DO-backed forum state, templates, notifications, approvals, state management, cleanup, and resource limiting.

## 🎯 Test Coverage

### 1. Core State Management & DO Thread-Safety
- **Concurrent Webhooks**: Validates DO serialization under concurrent load
- **State Persistence**: Ensures DO state survives worker restarts/deploys
- **Thread Safety**: Verifies only one message is pinned under concurrent access

### 2. RFC Lifecycle & Templating
- **Full RFC Lifecycle**: End-to-end testing from creation to merge
- **Template Rendering**: Jinja2 template processing with custom filters
- **Multilingual Support**: Language-specific template rendering
- **Interactive Approvals**: Button-based approval workflow testing

### 3. Notifications & Rate Limiting
- **SLA Management**: Breach detection and notification testing
- **Rate Limiting**: Enforcement of notification frequency limits
- **Escalation**: Nudge and escalation workflow validation
- **OPA Integration**: Policy-based access control testing

### 4. Observability & Auditing
- **Audit Trail**: Complete logging of all system actions
- **Metrics Collection**: Prometheus/Grafana integration testing
- **Dashboard Integration**: Health monitoring and alerting
- **Telemetry**: DO invocation and performance tracking

### 5. Resource Usage & Cost Attribution
- **DO Resource Monitoring**: Storage and invocation metrics
- **Cost Tracking**: Cloudflare billing integration
- **Performance Testing**: Latency and scaling validation
- **Resource Limits**: Boundary testing and threshold enforcement

### 6. Garbage Collection & Cleanup
- **Automated Cleanup**: Stale data removal testing
- **Storage Optimization**: DO storage cleanup validation
- **Cron Scheduling**: Automated cleanup job testing
- **Retention Policies**: Data lifecycle management

## 🚀 Quick Start

### Prerequisites

```bash
# Install tgk CLI
curl -sSL https://install.tgk.dev | bash
echo "$HOME/.tgk/bin" >> $PATH

# Set required environment variables
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_COUNCIL_ID=your_council_id
export GITHUB_TOKEN=your_github_token
export CLOUDFLARE_API_TOKEN=your_cloudflare_token
export LOKI_URL=your_loki_url
```

### Running Tests

#### Run All Tests
```bash
cd tgk/test
./run-all-tests.sh
```

#### Run Specific Test Categories
```bash
# DO Thread Safety tests
./run-do-tests.sh

# RFC Lifecycle tests
./run-rfc-lifecycle-tests.sh

# Notification tests
./run-notification-tests.sh

# Observability tests
./run-observability-tests.sh

# Resource tests
./run-resource-tests.sh

# Cleanup tests
./run-cleanup-tests.sh
```

#### Using the Node.js Test Runner
```bash
# Run all tests
node test-runner.js

# List available scenarios
node test-runner.js --list

# Run specific scenario
node test-runner.js --scenario "DO Thread Safety & State Persistence"

# Run in different environment
node test-runner.js --env staging
```

### Environment Configuration

Tests support multiple environments via `test-config.json`:

- **test-do-006**: Default test environment for micro-rfc-006
- **staging**: Staging environment for pre-production testing
- **production**: Production environment (use with caution)

## 📊 Test Results

### Report Formats

The test suite generates multiple report formats:

1. **JSON Report**: Detailed machine-readable results
2. **Markdown Report**: Human-readable summary for GitHub
3. **Console Output**: Real-time test execution feedback

### Example Test Output

```
🧪 Starting Comprehensive tgk Test Suite
📊 Stage: test-do-006, Profile: ci
==================================

🔬 Running: DO Thread Safety & State Persistence
----------------------------------------
✅ PASSED: DO Thread Safety & State Persistence (15432ms)

🔬 Running: RFC Lifecycle & Templating
----------------------------------------
✅ PASSED: RFC Lifecycle & Templating (23456ms)

==================================
🏁 Test Suite Complete
📊 Results: 6/6 passed, 0 failed
🎉 All tests passed! System is production ready.
```

## 🔧 Configuration

### Test Configuration (`test-config.json`)

```json
{
  "test_environments": {
    "test-do-006": {
      "stage": "test-do-006",
      "profile": "ci",
      "webhook_base_url": "github-webhook.alchmenyrun.workers.dev"
    }
  },
  "thresholds": {
    "max_do_latency_ms": 1000,
    "max_monthly_cost_usd": 1.0,
    "max_nudges_per_15min": 3
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot token for message testing |
| `TELEGRAM_COUNCIL_ID` | Yes | Telegram council/group ID |
| `GITHUB_TOKEN` | Yes | GitHub token for PR/issue operations |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token for DO/Worker testing |
| `LOKI_URL` | Yes | Loki URL for log aggregation |

## 🔄 CI/CD Integration

### GitHub Actions

The test suite integrates with GitHub Actions via `.github/workflows/comprehensive-tests.yml`:

- **Push/PR**: Automatic test execution on code changes
- **Scheduled**: Daily comprehensive test runs
- **Manual**: On-demand test execution via workflow dispatch
- **Reporting**: Automatic PR comments with test results

### Test Gates

Tests can be configured as deployment gates:

```yaml
# Example deployment gate
- name: Run comprehensive tests
  run: |
    cd tgk/test
    node test-runner.js --env production
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    # ... other secrets
```

## 🧹 Cleanup

### Automatic Cleanup

Tests automatically clean up after execution:

```bash
# Clean up test environment
./cleanup-test-environment.sh --stage test-do-006
```

### Manual Cleanup

```bash
# Clean up specific test streams
tgk stream delete do-test-concurrency --force

# Clean up test RFCs
tgk rfc delete test-rfc-001 --force

# Clean up DO storage
tgk do delete --key test_data
```

## 📈 Monitoring

### Test Metrics

Tests track and validate:

- **DO Invocations**: `alc.do.id` telemetry
- **Storage Usage**: `tgk_storage_bytes_gauge`
- **Audit Events**: `tgk_audit_total`
- **Notification Rate**: `tgk_notification_rate`
- **Cost Attribution**: DO storage and invocation costs

### Health Checks

```bash
# Check system health
tgk dashboard get alchemist-comms-health

# Verify DO connectivity
tgk do health-check

# Test Telegram connectivity
tgk telegram test-connection
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   export TELEGRAM_BOT_TOKEN=your_token
   export TELEGRAM_COUNCIL_ID=your_council_id
   ```

2. **Permission Errors**
   ```bash
   chmod +x tgk/test/*.sh
   ```

3. **DO State Issues**
   ```bash
   # Reset DO state
   tgk do reset --stream test-stream --force
   ```

4. **Telegram Rate Limits**
   ```bash
   # Wait for rate limit to reset
   sleep 60
   ```

### Debug Mode

Enable debug logging:

```bash
export TGK_DEBUG=true
export TGK_LOG_LEVEL=debug

./run-all-tests.sh --stage test-do-006
```

### Test Isolation

Each test scenario uses isolated resources:

- **Streams**: Unique names per test category
- **RFCs**: Test-specific IDs and titles
- **Storage**: Isolated DO namespaces
- **Topics**: Separate Telegram topics

## 📚 Advanced Usage

### Custom Test Scenarios

Create custom test scenarios:

```bash
# Copy existing test script
cp run-do-tests.sh run-custom-tests.sh

# Modify for your specific needs
vim run-custom-tests.sh

# Run custom tests
./run-custom-tests.sh
```

### Performance Testing

Run performance benchmarks:

```bash
# Load testing
for i in {1..100}; do
  curl -X POST "https://github-webhook.alchmenyrun.workers.dev/test-stream" \
       -H "Content-Type: application/json" \
       -d '{"test": "load"}' &
done
wait

# Check metrics
tgk metrics get tgk_do_invocation_total
```

### Integration Testing

Test with external services:

```bash
# Test GitHub integration
tgk rfc new --template integration --title "GitHub Test"

# Test Cloudflare integration
tgk cf worker deploy test-worker --stage test

# Test monitoring integration
tgk alert test --type do_connectivity
```

## 🤝 Contributing

### Adding New Tests

1. Create test script in `tgk/test/`
2. Add to `test-config.json`
3. Update `run-all-tests.sh`
4. Add documentation

### Test Standards

- **Isolation**: Tests must not interfere with each other
- **Cleanup**: Tests must clean up their resources
- **Validation**: Tests must validate expected outcomes
- **Logging**: Tests must provide clear success/failure indicators

## 📄 License

This test suite is part of the tgk project and follows the same license terms.

---

**For questions or issues, please refer to the [main project documentation](../README.md) or open an issue in the repository.**
