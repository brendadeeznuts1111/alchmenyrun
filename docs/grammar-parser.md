# Grammar Parser Documentation

## Overview
The Grammar Parser provides robust email grammar parsing for the `[DOMAIN].[SCOPE].[TYPE].[HIERARCHY].[META].[STATE_ID_OPTIONAL]` format used in the TGK orchestration system.

## Grammar Format

### Structure
```
[DOMAIN].[SCOPE].[TYPE].[HIERARCHY].[META].[STATE_ID_OPTIONAL]@cloudflare.com
```

### Components

#### **Domain** (Required)
- `support` - Customer support issues
- `ops` - Operations and infrastructure
- `dev` - Development and engineering
- `security` - Security incidents and alerts
- `customer` - Customer-specific communications
- `partner` - Partner-related issues
- `vendor` - Vendor communications

#### **Scope** (Required)
- `internal` - Internal team communications
- `customer` - Customer-facing communications
- `partner` - Partner-specific communications
- `vendor` - Vendor-specific communications
- `public` - Public communications
- `private` - Private/sensitive communications

#### **Type** (Required)
- `issue` - Issue reports and tracking
- `request` - Service requests
- `alert` - System alerts and notifications
- `incident` - Incident reports
- `question` - Questions and inquiries
- `update` - Status updates
- `notification` - General notifications

#### **Hierarchy** (Optional, defaults to `general`)
- `critical` - Critical priority items
- `urgent` - Urgent items requiring immediate attention
- `high` - High priority items
- `normal` - Normal priority items
- `low` - Low priority items
- `info` - Informational items
- `general` - General items (default)

#### **Meta** (Optional, defaults to `normal`)
- `p0`, `p1`, `p2`, `p3` - Priority levels (p0 = highest)
- `urgent` - Urgent flag
- `normal` - Normal processing
- `batch` - Batch processing
- `immediate` - Immediate processing required

#### **State ID** (Optional)
- Custom identifier for tracking specific states or conversations
- Can contain alphanumeric characters and hyphens

## Usage Examples

### Basic Parsing
```bash
# Parse a complete email address
tgk grammar parse "support.customer.issue.p2.web@cloudflare.com"

# Output:
# ✅ Grammar parsed successfully:
#    Domain: support
#    Scope: customer
#    Type: issue
#    Hierarchy: p2
#    Meta: web
#    State ID: 
#    Priority: medium
#    Severity: medium
```

### Email Generation
```bash
# Generate a basic email
tgk grammar generate --domain support --scope customer --type issue

# Generate with all components
tgk grammar generate \
  --domain ops \
  --scope internal \
  --type incident \
  --hierarchy critical \
  --meta p0 \
  --state-id abc123

# Output:
# ✅ Generated email: ops.internal.incident.critical.p0.abc123@cloudflare.com
```

### Component Validation
```bash
# Validate individual components
tgk grammar validate --domain support --scope customer --type issue

# Validate with errors (will show suggestions)
tgk grammar validate --domain invalid --scope wrong --type bad
```

### View Grammar Rules
```bash
# Show all available grammar rules
tgk grammar rules

# Output:
# 📋 Grammar Rules:
# 
# Domains: support, ops, dev, security, customer, partner, vendor
# Scopes: internal, customer, partner, vendor, public, private
# Types: issue, request, alert, incident, question, update, notification
# Hierarchies: critical, urgent, high, normal, low, info, general
# Meta Patterns: p0, p1, p2, p3, urgent, normal, batch, immediate
```

## API Usage

### Parsing Email Addresses
```typescript
import { parseEmailGrammar } from './core/grammar-parser';

const result = parseEmailGrammar('support.customer.issue.p2.web@cloudflare.com');

if (result.valid) {
  console.log(`Domain: ${result.domain}`);
  console.log(`Priority: ${result.priority}`);
  console.log(`Severity: ${result.severity}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Generating Email Addresses
```typescript
import { generateEmailGrammar } from './core/grammar-parser';

const email = generateEmailGrammar({
  domain: 'support',
  scope: 'customer',
  type: 'issue',
  hierarchy: 'high',
  meta: 'p1',
  stateId: 'ticket-123'
});

console.log(email); // support.customer.issue.high.p1.ticket-123@cloudflare.com
```

### Validating Components
```typescript
import { validateGrammarComponents } from './core/grammar-parser';

const result = validateGrammarComponents({
  domain: 'support',
  scope: 'customer',
  type: 'issue'
});

if (result.valid) {
  console.log('All components are valid');
} else {
  console.log('Errors:', result.errors);
  console.log('Suggestions:', result.suggestions);
}
```

## Priority and Severity Mapping

### Priority Extraction (from Meta)
- `p0`, `critical`, `urgent` → `critical`
- `p1`, `high` → `high`
- `p2`, `normal` → `medium`
- `p3`, `low` → `medium` (default)

### Severity Extraction (from Hierarchy)
- `critical` → `critical`
- `urgent`, `high` → `high`
- `normal` → `medium`
- `low`, `info` → `low`
- `general` → `medium` (default)

## Error Handling

### Common Errors
1. **Invalid email format** - Email doesn't match basic pattern
2. **Insufficient grammar parts** - Less than 3 components provided
3. **Invalid domain/scope/type** - Component not in allowed list
4. **Invalid hierarchy/meta** - Component doesn't match expected patterns

### Validation with Suggestions
The parser provides intelligent suggestions for misspelled components using Levenshtein distance:

```bash
# Input: "suport.customer.issue.p2.web@cloudflare.com"
# Output: "Did you mean: support?"
```

## Integration with TGK

### Email Routing
The grammar parser integrates with the TGK email routing system to:
- Automatically categorize incoming emails
- Determine appropriate routing destinations
- Extract priority and severity for processing
- Enable stateful conversation tracking

### Workflow Automation
- Trigger specific workflows based on email grammar
- Auto-assign issues to appropriate teams
- Set priority levels in issue tracking systems
- Generate automated responses based on type

### Monitoring and Metrics
- Track email volumes by grammar components
- Monitor response times by priority/severity
- Generate reports on communication patterns
- Alert on unusual grammar patterns

## Testing

### Unit Tests
Comprehensive unit tests cover:
- Valid email parsing
- Invalid email handling
- Component validation
- Priority/severity extraction
- Edge cases and error conditions

### Integration Tests
- CLI command functionality
- API integration
- Email routing workflows
- End-to-end processing

### Running Tests
```bash
# Run unit tests
npm test -- grammar-parser

# Run integration tests
./tgk/test-grammar.sh

# Run all tests
npm test
```

## Best Practices

### Email Address Design
1. **Use descriptive domains** that clearly indicate the responsible team
2. **Choose appropriate scopes** for audience targeting
3. **Select specific types** that accurately represent the communication purpose
4. **Set meaningful hierarchies** to indicate urgency
5. **Use priority meta tags** for processing order

### Error Prevention
1. **Validate components** before generating emails
2. **Use the CLI commands** for testing grammar patterns
3. **Implement fallback handling** for unrecognized patterns
4. **Log parsing errors** for monitoring and improvement

### Performance Considerations
1. **Cache parsing results** for frequently used patterns
2. **Batch process** emails when possible
3. **Use async processing** for high-volume scenarios
4. **Monitor parsing performance** and optimize as needed

## Future Enhancements

### Planned Features
- **Custom grammar rules** per organization
- **Dynamic component validation** based on context
- **Advanced pattern matching** with regex support
- **Machine learning** for grammar suggestions
- **Multi-language support** for international domains

### Extension Points
- **Custom validators** for domain-specific rules
- **Plugin architecture** for additional grammar components
- **Webhook integration** for real-time grammar updates
- **API endpoints** for external system integration
