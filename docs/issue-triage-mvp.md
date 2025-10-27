# Issue Triage MVP Documentation

## Overview
AI-powered issue triage that automatically labels GitHub issues based on content analysis using simple but effective keyword matching and pattern recognition.

## Quick Start

### Installation
```bash
cd tgk
npm install
npm run build
```

### Basic Usage
```bash
# Set your GitHub token
export GITHUB_TOKEN="your_github_token_here"

# Triage an issue (dry run first)
./cli.ts issue triage 123 --dry-run

# Triage with custom confidence threshold
./cli.ts issue triage 123 --confidence-threshold 0.8

# Analyze without applying labels
./cli.ts issue analyze 123
```

## How It Works

### Analysis Pipeline
1. **Content Analysis**: Analyzes title and body for keywords and patterns
2. **Audience Detection**: Determines customer vs internal context
3. **Topic Classification**: Identifies technical areas (state-pinning, telegram, deployment)
4. **Impact Assessment**: Evaluates severity and urgency levels
5. **Type Classification**: Distinguishes bugs, features, questions
6. **Confidence Scoring**: Provides confidence level for each decision

### Label Categories

#### Audience
- **`customer`** - Customer-facing issues
- **`internal`** - Internal team issues

#### Topic
- **`topic/state-pinning`** - Concurrency and state management issues
- **`topic/telegram-integration`** - Telegram-related functionality
- **`topic/deployment`** - Worker and deployment issues

#### Impact
- **`impact/critical`** - Critical/urgent issues requiring immediate attention
- **`impact/high`** - High priority issues with significant impact
- **`impact/low`** - Low priority issues with minimal impact

#### Type
- **`type/bug`** - Bug reports and error conditions
- **`type/feature`** - Feature requests and enhancements
- **`type/question`** - Questions and inquiries

## Commands

### `issue triage <issue-number>`
Auto-label a GitHub issue based on AI analysis.

**Options:**
- `--dry-run` - Show what would be applied without making changes
- `--confidence-threshold <threshold>` - Minimum confidence for auto-labeling (default: 0.7)
- `--token <token>` - GitHub token (or set GITHUB_TOKEN env var)
- `--repo <repo>` - Repository name (owner/repo, default: brendadeeznuts1111/alchmenyrun)

**Examples:**
```bash
# Safe triage with dry run
tgk-triage issue triage 123 --dry-run

# Triage with high confidence requirement
tgk-triage issue triage 123 --confidence-threshold 0.9

# Triage issue in different repo
tgk-triage issue triage 456 --repo myorg/myrepo
```

### `issue analyze <issue-number>`
Analyze issue content and show detailed breakdown without applying labels.

**Options:**
- `--token <token>` - GitHub token (or set GITHUB_TOKEN env var)
- `--repo <repo>` - Repository name (owner/repo, default: brendadeeznuts1111/alchmenyrun)

**Example:**
```bash
tgk-triage issue analyze 123
```

## Configuration

### Environment Variables
- `GITHUB_TOKEN` - GitHub personal access token with repo scope

### Confidence Thresholds
- **0.9+**: Very high confidence, apply labels automatically
- **0.7-0.9**: High confidence, apply with caution
- **0.5-0.7**: Medium confidence, manual review recommended
- **<0.5**: Low confidence, requires manual triage

## Testing

### Unit Tests
```bash
cd tgk
npm test
```

### Integration Tests
```bash
cd tgk
./test-triage.sh
```

### Manual Testing
```bash
# Test with a real GitHub issue
export GITHUB_TOKEN="your_token"
tgk-triage issue analyze 123
```

## Architecture

### Components
- **`GitHubTriageClient`** - GitHub API integration
- **`performTriageAnalysis()`** - Core analysis logic
- **`createIssueTriageCommands()`** - CLI command definitions

### Dependencies
- `@octokit/rest` - GitHub API client
- `commander` - CLI framework
- `jest` - Testing framework

## Best Practices

### Safe Usage
1. **Always test with `--dry-run` first**
2. **Start with higher confidence thresholds** (0.8-0.9)
3. **Monitor applied labels** and adjust logic as needed
4. **Use analyze command** to understand decision reasoning

### Label Management
1. **Create labels in advance** in your GitHub repository
2. **Use consistent naming** conventions
3. **Regularly review** auto-applied labels for accuracy
4. **Adjust analysis logic** based on false positives/negatives

### Performance
1. **Batch processing** for multiple issues
2. **Cache API responses** when possible
3. **Use webhooks** for real-time triage instead of polling

## Future Enhancements

### Planned Features
- **Machine Learning**: Replace keyword matching with ML models
- **Custom Rules**: Repository-specific triage rules
- **Webhook Integration**: Automatic triage on issue creation
- **Bulk Operations**: Triage multiple issues at once
- **Analytics**: Track triage accuracy and performance metrics

### Integration Points
- **Telegram Notifications**: Send triage results to Telegram
- **Email Routing**: Route issues based on triage results
- **Project Boards**: Auto-assign to project boards
- **Assignee Assignment**: Suggest appropriate assignees

## Troubleshooting

### Common Issues

**"GitHub token required"**
- Set `GITHUB_TOKEN` environment variable
- Or use `--token` option

**"Repository not found"**
- Check repository name format: `owner/repo`
- Verify token has access to the repository

**Low confidence scores**
- Issues may need manual triage
- Consider adjusting analysis logic
- Check for unusual issue content

**API rate limits**
- GitHub API has rate limits
- Consider using GitHub App authentication for higher limits
- Implement request caching

## Contributing

### Adding New Analysis Rules
1. Update `performTriageAnalysis()` function
2. Add corresponding test cases
3. Update documentation
4. Test with real issues

### Improving Confidence Scoring
1. Analyze false positives/negatives
2. Adjust keyword matching patterns
3. Consider issue metadata (author, labels, etc.)
4. Test with larger issue datasets
