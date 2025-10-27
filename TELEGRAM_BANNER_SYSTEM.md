# Telegram Banner Management System

## Overview

The Telegram Banner Management System provides comprehensive functionality for managing banner topics in Telegram supergroups. This system integrates with the TGK AI Orchestration platform to provide automated banner updates for council members, departments, and system-wide announcements.

## Features

### 🎯 Council Member Banners
- Individual banner topics for each council member
- Personal activity topics for council members
- Automated banner formatting with role information
- Priority-based messaging system

### 🏢 Department Banners
- Dedicated banner topics for each department
- Separate update and alert topics
- Department-specific color coding and formatting
- Bulk update capabilities

### 🌐 System-Wide Banners
- Main system announcements
- Release planning status
- Health monitoring updates
- Incident response coordination

## Architecture

### Core Components

1. **RPC Client** (`tgk/core/rpc.ts`)
   - Telegram API integration using `telegram` package
   - Session management and authentication
   - Support for `sendMessage`, `editForumTopic`, `createForumTopic`, and `getForumTopics`

2. **Banner Integration** (`tgk/integrations/telegram-banner.ts`)
   - Banner topic management logic
   - Message formatting and templating
   - Council member and department configurations

3. **CLI Commands** (`tgk/commands/banner.ts`)
   - Command-line interface for banner management
   - Interactive topic listing and updates
   - Test functionality for validation

4. **Macro Color System** (`tgk/core/macro-colors.ts`)
   - Compile-time color stripping for Telegram compatibility
   - Environment-aware formatting
   - Council member and department color schemes

## Installation and Setup

### Dependencies

```bash
bun add telegram
```

### Environment Variables

Required for Telegram API integration:

```bash
# Telegram API Credentials
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=your_session_string

# Telegram Supergroup Configuration
TELEGRAM_COUNCIL_ID=@your_council_supergroup

# Macro Configuration (Optional)
TELEGRAM_CLIENT=true  # Enable Telegram client mode
NODE_ENV=production   # Enable production mode
```

### Telegram Bot Setup

1. Create a Telegram bot via @BotFather
2. Obtain API credentials from Telegram
3. Add the bot to your supergroup as an administrator
4. Enable forum topics for the supergroup
5. Configure the bot with necessary permissions:
   - Send messages
   - Edit messages
   - Manage topics
   - Pin messages

## Usage

### CLI Commands

#### List Available Topics
```bash
# List all banner topics
bun tgk/commands/banner.ts list

# Filter by type
bun tgk/commands/banner.ts list --type council
bun tgk/commands/banner.ts list --type department
bun tgk/commands/banner.ts list --type system
```

#### Update Council Member Banner
```bash
# Update specific council member
bun tgk/commands/banner.ts council alice "Reviewing Micro-PR 1 implementation"

# With priority level
bun tgk/commands/banner.ts council charlie "Security audit in progress" --priority high
```

#### Update Department Banner
```bash
# Update specific department
bun tgk/commands/banner.ts department tech "Deploying infrastructure updates"

# With priority level
bun tgk/commands/banner.ts department security "Security patch deployment" --priority critical
```

#### Update System Banner
```bash
# Update system-wide banner
bun tgk/commands/banner.ts system main "System maintenance scheduled"

# With priority level
bun tgk/commands/banner.ts system incidents "Investigating service degradation" --priority critical
```

#### Bulk Updates
```bash
# Update all council members
bun tgk/commands/banner.ts all-council "Council meeting at 3 PM EST"

# Update all departments
bun tgk/commands/banner.ts all-departments "Quarterly review deadline approaching"
```

#### Test Functionality
```bash
# Test council banner updates
bun tgk/commands/banner.ts test --type council

# Test department banner updates
bun tgk/commands/banner.ts test --type department

# Test system banner updates
bun tgk/commands/banner.ts test --type system
```

### Programmatic Usage

```typescript
import { 
  updateCouncilMemberBanner,
  updateDepartmentBanner,
  updateSystemBanner,
  updateAllCouncilBanners,
  updateAllDepartmentBanners,
  listAllTopics,
  getCouncilMember,
  getDepartment
} from './tgk/integrations/telegram-banner.js';

// Update council member banner
await updateCouncilMemberBanner('alice.smith', {
  message: 'Working on infrastructure improvements',
  priority: 'medium'
});

// Update department banner
await updateDepartmentBanner('tech', {
  message: 'Deploying new features to production',
  priority: 'high'
});

// Update system banner
await updateSystemBanner('main', {
  message: 'System maintenance complete',
  priority: 'low'
});

// List all topics
const topics = await listAllTopics();
console.log(`Found ${topics.length} topics`);
```

## Configuration

### Council Members

Council member configurations are defined in `COUNCIL_MEMBERS`:

```typescript
const COUNCIL_MEMBERS = {
  'alice.smith': {
    name: 'Alice Smith',
    emoji: '🔴',
    role: 'tech-lead',
    bannerTopic: 'council-alice-updates',
    personalTopic: 'alice-smith-activities',
    color: '#FF6B6B'
  },
  // ... other members
};
```

### Departments

Department configurations are defined in `DEPARTMENT_TOPICS`:

```typescript
const DEPARTMENT_TOPICS = {
  'tech': {
    name: 'Tech Department',
    emoji: '💙',
    bannerTopic: 'tech-department-banner',
    updatesTopic: 'tech-updates',
    alertsTopic: 'tech-alerts',
    color: '#00BFFF'
  },
  // ... other departments
};
```

### System Topics

System-wide topics are defined in `SYSTEM_TOPICS`:

```typescript
const SYSTEM_TOPICS = {
  'main': {
    name: 'Main Banner',
    topic: 'main-banner',
    description: 'Primary system status and announcements'
  },
  // ... other system topics
};
```

## Message Formatting

### Priority Levels

- `low`: ℹ️ - Informational messages
- `medium`: 📋 - Standard updates
- `high`: ⚠️ - Important announcements
- `critical`: 🚨 - Urgent alerts

### Banner Structure

Each banner message includes:
- Council member/department emoji and name
- Priority indicator
- Status update message
- Role or department information
- Timestamp
- System attribution

### Color System

The system uses a macro-based color system that:
- Strips ANSI colors in Telegram client mode
- Preserves colors in development mode
- Provides compile-time color optimization
- Supports council member and department color schemes

## Testing

### Unit Tests

```bash
# Run banner system tests
bun test-telegram-banner.mjs

# Run RPC integration tests
bun test-telegram-banner-rpc.mjs
```

### Test Coverage

The test suite validates:
- Banner topic listing and configuration
- Council member and department lookups
- Message formatting and structure
- Priority level handling
- RPC integration (with mock credentials)
- CLI command functionality

## Troubleshooting

### Common Issues

1. **Missing Telegram Credentials**
   ```
   Error: TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables are required
   ```
   Solution: Set up proper environment variables with Telegram API credentials.

2. **Bot Permissions**
   ```
   Error: CHAT_ADMIN_REQUIRED
   ```
   Solution: Ensure the bot has administrator privileges in the supergroup.

3. **Forum Topics Not Enabled**
   ```
   Error: FORUM_REQUIRED
   ```
   Solution: Enable forum topics in your Telegram supergroup settings.

4. **Invalid Topic ID**
   ```
   Error: INVALID_TOPIC_ID
   ```
   Solution: Verify the topic exists and the bot has access to it.

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=telegram:* bun tgk/commands/banner.ts test
```

## Integration with AI Orchestration

The banner system integrates with the TGK AI Orchestration platform to provide:

- Automated banner updates based on system events
- AI-generated status messages
- Integration with release planning workflows
- Coordination with incident response systems
- Synchronization with CODEOWNERS and review processes

## Security Considerations

- Store Telegram API credentials securely
- Use environment variables for sensitive configuration
- Implement proper access controls for CLI commands
- Validate all user inputs before processing
- Monitor for unauthorized API usage

## Future Enhancements

Planned improvements include:
- Scheduled banner updates
- Template-based message customization
- Integration with monitoring systems
- Multi-supergroup support
- Advanced analytics and reporting
- Webhook-based real-time updates

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the test suite for examples
3. Consult the TGK documentation
4. Create an issue in the repository

---

*This system is part of the TGK AI Orchestration platform and follows the established patterns for RPC integration, macro-based optimization, and CLI command structure.*
