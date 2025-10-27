# Release Planning Core Documentation

## Overview
AI-powered release planning with OPA policy gates for safe, governed deployments.

## Usage
```bash
# Generate release plan
tgk release plan --type minor --components core,ui

# Generate release plan with dry run (no approval process)
tgk release plan --type patch --components core --dry-run

# Check release status
tgk release status RELEASE-123

# Approve release (via Telegram)
# Click approval buttons in Telegram message
```

## How It Works
1. **AI Planning**: Generates comprehensive release steps based on type/components
2. **Policy Check**: OPA validates approvals and compliance
3. **Telegram Approval**: Council members approve via Telegram buttons
4. **Automated Deployment**: Approved releases deploy automatically

## Release Types
- **Patch**: Bug fixes, small changes (1 approval)
  - Estimated duration: 30m
  - Risk level: Low
  - Required approvals: Tech Lead (1)
  
- **Minor**: New features, medium changes (2 approvals) 
  - Estimated duration: 2h
  - Risk level: Medium
  - Required approvals: Tech Lead (1), Security (1)
  
- **Major**: Breaking changes, large features (4+ approvals)
  - Estimated duration: 4h
  - Risk level: High
  - Required approvals: Tech Lead (2), Security (1), Product (1)

## Policy Requirements
- Tech Lead approval required for all releases
- Security approval for minor/major releases
- Product approval for major releases
- High-risk releases need additional approvals
- Critical major releases have special requirements

## Component-Specific Steps
- **Workers**: Includes Cloudflare Workers deployment
- **Database**: Includes database migration steps
- **Core**: Includes additional validation steps

## Risk Assessment
Risk is calculated based on:
- Release type (patch=1, minor=2, major=3 points)
- Urgency level (normal=1, high=2, critical=3 points)
- Components (database=2, core=1 points)

**Risk Levels:**
- **Low**: < 4 points
- **Medium**: 4-5 points  
- **High**: 6+ points

## Telegram Integration
Release approvals are handled through Telegram with the following workflow:

1. **Release Plan Generated**: System sends approval request to Telegram council
2. **Council Review**: Members review plan details and risk assessment
3. **Approval Buttons**: Click role-specific approval buttons:
   - ✅ Approve (Tech Lead)
   - ✅ Approve (Security)
   - ✅ Approve (Product)
   - 🚧 Request Changes
   - ❌ Reject
   - 📊 View Details
4. **Automatic Deployment**: Once all required approvals are received

## Environment Variables
```bash
# Required for Telegram integration
TELEGRAM_COUNCIL_ID=your_telegram_group_id

# Optional for custom deployment
DEPLOYMENT_WEBHOOK_URL=your_deployment_webhook
```

## Examples

### Basic Patch Release
```bash
tgk release plan --type patch --components core --dry-run
```
Output:
```
🚀 Generating patch release plan...

📋 Release Plan Generated:
────────────────────────────────────────────────────────────
Type: patch
Components: core
Estimated Duration: 30m
Risk Level: low
Steps: 6

📝 Plan Steps:
1. Run comprehensive test suite
2. Build and package components
3. Deploy to staging environment
4. Run smoke tests
5. Deploy to production
6. Monitor for 30 minutes

🔄 Rollback Plan: git revert HEAD && wrangler deploy --env production
────────────────────────────────────────────────────────────

ℹ️  Dry run - no approval process initiated
```

### Major Release with Multiple Components
```bash
tgk release plan --type major --components core,ui,workers,database --urgency high
```

This will:
- Generate comprehensive release plan with 10+ steps
- Assess as high risk
- Require 4 approvals (2 Tech Lead, 1 Security, 1 Product)
- Send to Telegram for council approval
- Auto-deploy once all approvals received

## Testing
Run the test suite to verify functionality:
```bash
# Run all tests
bun test tgk/commands/__tests__/release-plan.test.ts

# Run integration test script
./scripts/test-release-planning.sh
```

## Troubleshooting

### Common Issues
1. **Policy Check Failed**: Check OPA policy configuration and required approvals
2. **Telegram Not Sending**: Verify TELEGRAM_COUNCIL_ID environment variable
3. **Deployment Not Triggered**: Check that all required approvals are received

### Debug Mode
Enable debug logging:
```bash
DEBUG=tgk:* tgk release plan --type patch --components core --dry-run
```

## Architecture
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   CLI Command   │───▶│  AI Planner  │───▶│  OPA Policy     │
│   release plan  │    │              │    │  Evaluation     │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                │                    │
                                ▼                    ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │ Release Plan │    │ Policy Result   │
                       │   Object     │    │                 │
                       └──────────────┘    └─────────────────┘
                                │                    │
                                └─────────┬──────────┘
                                          ▼
                                ┌─────────────────┐
                                │   Telegram      │
                                │   Integration   │
                                └─────────────────┘
                                          │
                                          ▼
                                ┌─────────────────┐
                                │   Deployment    │
                                │   Pipeline      │
                                └─────────────────┘
```

## Future Enhancements
- AI-powered risk assessment
- Integration with GitHub pull requests
- Rollback automation
- Release metrics and analytics
- Slack integration alternative
- Custom approval workflows
