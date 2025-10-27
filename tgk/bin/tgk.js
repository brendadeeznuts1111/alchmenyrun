#!/usr/bin/env node

/**
 * tgk CLI Entry Point
 * AI-Driven Customer & Release Orchestration
 */

const { Command } = require('commander');
const path = require('path');

// Import commands

const program = new Command();

program
  .name('tgk')
  .description('tgk - AI-Driven Customer & Release Orchestration CLI')
  .version('5.0.0');

// Issue management commands
program
  .command('issue-new')
  .description('Create a new issue with AI wizard and auto-labeling')
  .action(async () => {
    try {
      const { createIssue } = await import(path.resolve(__dirname, '../commands/issue.ts'));
      await createIssue();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('issue-triage <issue-number>')
  .description('AI-powered issue triage and labeling')
  .action(async (issueNumber) => {
    try {
      const { triageIssue } = await import(path.resolve(__dirname, '../commands/issue.ts'));
      await triageIssue(issueNumber);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('issue-follow <issue-number>')
  .description('Set up auto-notifications for key issue status changes')
  .option('--telegram <chat-id>', 'Telegram chat ID for notifications')
  .option('--email <address>', 'Email address for notifications')
  .action(async (issueNumber, options) => {
    try {
      const { followIssue } = await import(path.resolve(__dirname, '../commands/issue.ts'));
      await followIssue(issueNumber, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('issue-status <issue-number>')
  .description('Get detailed issue status, linked PRs, SLA, and AI-suggested next steps')
  .option('--detailed', 'Show comprehensive status including AI analysis')
  .action(async (issueNumber, options) => {
    try {
      const { getIssueStatus } = await import(path.resolve(__dirname, '../commands/issue.ts'));
      await getIssueStatus(issueNumber, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Release orchestration commands
program
  .command('release-plan')
  .description('AI-generated release planning and council approval')
  .option('--type <type>', 'Release type (patch, minor, major, ai-suggest)', 'minor')
  .action(async (options) => {
    try {
      const { planRelease } = await import(path.resolve(__dirname, '../commands/release.ts'));
      await planRelease({ type: options.type });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('release-approve <release-id>')
  .description('Approve release plan (OPA policy gated)')
  .option('--reviewer <username>', 'Specify reviewer username')
  .action(async (releaseId, options) => {
    try {
      const { approveRelease } = await import('../commands/release.ts');
      const reviewer = options.reviewer || process.env.TGK_USER || process.env.USER || 'unknown';
      await approveRelease(releaseId, reviewer);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('release-deploy <release-id>')
  .description('Deploy approved release (policy pass → CI trigger)')
  .action(async (releaseId) => {
    try {
      const { deployRelease } = await import('../commands/release.ts');
      await deployRelease(releaseId);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('release-monitor <release-id>')
  .description('Activate post-release SLO/SLI monitoring & anomaly detection')
  .option('--duration <hours>', 'Monitoring duration in hours', '24')
  .option('--sensitivity <level>', 'Anomaly detection sensitivity (low|medium|high)', 'medium')
  .action(async (releaseId, options) => {
    try {
      const { monitorRelease } = await import(path.resolve(__dirname, '../commands/release.ts'));
      await monitorRelease(releaseId, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Customer communication commands
program
  .command('customer notify <customer-id>')
  .description('Send AI-drafted customer notification via D12')
  .option('--type <type>', 'Notification type (release, incident, feature, maintenance)', 'feature')
  .option('--message <message>', 'Custom message content')
  .action(async (customerId, options) => {
    try {
      const { notifyCustomer } = await import('../commands/customer.ts');
      await notifyCustomer(customerId, {
        type: options.type,
        message: options.message
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// GitHub integration commands
program
  .command('github pr <action>')
  .description('GitHub pull request management')
  .option('--method <method>', 'Merge method (merge, squash, rebase)', 'squash')
  .option('--body <body>', 'PR body/description')
  .option('--head <head>', 'Head branch')
  .option('--base <base>', 'Base branch', 'main')
  .option('--draft', 'Create as draft PR')
  .option('--label <label>', 'Add label to PR')
  .action(async (action, options) => {
    try {
      const { createPullRequest, managePullRequest } = await import('../commands/github.ts');

      if (action === 'create') {
        const title = options._[1]; // Get title from args
        await createPullRequest(title, options);
      } else {
        const prNumber = options._[1];
        await managePullRequest(prNumber, action, options);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github repo <action> [repo-name]')
  .description('GitHub repository management')
  .option('--detailed', 'Show detailed information')
  .action(async (action, repoName, options) => {
    try {
      const { repositoryInfo } = await import('../commands/github.ts');

      if (action === 'info') {
        await repositoryInfo(repoName, options);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github labels <action> [repo-name]')
  .description('GitHub label management')
  .option('--color <color>', 'Label color (hex without #)')
  .option('--description <desc>', 'Label description')
  .option('--issue <number>', 'Issue number to apply label to')
  .option('--labels <labels>', 'Comma-separated labels to apply')
  .action(async (action, repoName, options) => {
    try {
      const { manageLabels } = await import('../commands/github.ts');
      
      // Set repo in options for the manageLabels function
      options.repo = repoName;
      
      // For apply action, use labels option instead of positional argument
      const labelName = action === 'apply' ? options.labels : options._[1];
      await manageLabels(action, labelName, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github workflow <action>')
  .description('GitHub workflow management')
  .option('--status <status>', 'Filter by status (completed, in_progress, etc.)')
  .action(async (action, options) => {
    try {
      const { workflowManagement } = await import('../commands/github.ts');
      const workflowName = options._[1];
      await workflowManagement(action, workflowName, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github security')
  .description('GitHub security scanning')
  .option('--details', 'Show detailed alert information')
  .action(async (options) => {
    try {
      const { securityScan } = await import('../commands/github.ts');
      await securityScan(options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github deps <action>')
  .description('Dependency management')
  .action(async (action, options) => {
    try {
      const { dependencyManagement } = await import('../commands/github.ts');
      await dependencyManagement(action, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github metadata <action>')
  .description('Repository metadata management')
  .option('--key <key>', 'Metadata key (description, topics, homepage)')
  .option('--value <value>', 'Metadata value')
  .action(async (action, options) => {
    try {
      const { metadataManagement } = await import(path.resolve(__dirname, '../commands/github.ts'));
      await metadataManagement(action, options.key, options.value, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github issue create <repo-name>')
  .description('Create GitHub issue with AI-drafted body')
  .option('--title <title>', 'Issue title', '')
  .option('--body <body>', 'Issue body', '')
  .option('--labels <labels>', 'Comma-separated labels', '')
  .action(async (repoName, options) => {
    try {
      const { createGitHubIssue } = await import(path.resolve(__dirname, '../commands/github.ts'));
      await createGitHubIssue(repoName, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github pr review <pr-id>')
  .description('Provide GitHub PR review from Telegram')
  .option('--action <action>', 'Review action (approve|comment)', 'comment')
  .option('--message <message>', 'Review message', '')
  .action(async (prId, options) => {
    try {
      const { reviewGitHubPR } = await import(path.resolve(__dirname, '../commands/github.ts'));
      await reviewGitHubPR(prId, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github pr status <pr-id>')
  .description('Get detailed PR status, CI checks, CODEOWNERS approval, and AI-suggested actions')
  .option('--detailed', 'Show comprehensive PR analysis')
  .action(async (prId, options) => {
    try {
      const { getGitHubPRStatus } = await import(path.resolve(__dirname, '../commands/github.ts'));
      await getGitHubPRStatus(prId, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// AI commands
program
  .command('ai labels <issue-id>')
  .description('AI-powered label suggestion for issues and PRs')
  .option('--repo <repo>', 'Repository name (owner/repo or repo)', 'alchmenyrun')
  .action(async (issueId, options) => {
    try {
      const { suggestLabels } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const [owner, repo] = options.repo.includes('/') ? options.repo.split('/') : ['brendadeeznuts1111', options.repo];
      const labels = await suggestLabels(issueId, owner, repo);
      console.log('\n🏷️ **AI Label Suggestion:**');
      console.log(`Labels: ${labels.labels.join(', ')}`);
      console.log(`Confidence: ${(labels.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${labels.reasoning}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('ai release-type')
  .description('AI-powered release type suggestion based on commit analysis')
  .option('--repo <repo>', 'Repository name (owner/repo or repo)', 'alchmenyrun')
  .action(async (options) => {
    try {
      const { suggestReleaseType } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const [owner, repo] = options.repo.includes('/') ? options.repo.split('/') : ['brendadeeznuts1111', options.repo];
      const releaseType = await suggestReleaseType(owner, repo);
      console.log('\n🚀 **AI Release Type Suggestion:**');
      console.log(`Type: ${releaseType.type}`);
      console.log(`Confidence: ${(releaseType.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${releaseType.reasoning}`);
      console.log(`Analysis: ${releaseType.commit_analysis.features} features, ${releaseType.commit_analysis.fixes} fixes, ${releaseType.commit_analysis.breaking} breaking changes`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('ai impact <changes...>')
  .description('AI-powered impact analysis for changes')
  .option('--repo <repo>', 'Repository name (owner/repo or repo)', 'alchmenyrun')
  .action(async (changes, options) => {
    try {
      const { analyzeImpact } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const [owner, repo] = options.repo.includes('/') ? options.repo.split('/') : ['brendadeeznuts1111', options.repo];
      const impact = await analyzeImpact(changes, owner, repo);
      console.log('\n💥 **AI Impact Analysis:**');
      console.log(`Impact: ${impact.impact}`);
      console.log(`Confidence: ${(impact.confidence * 100).toFixed(1)}%`);
      console.log(`Risk Score: ${impact.risk_score}/100`);
      console.log(`Affected Areas: ${impact.affected_areas.join(', ') || 'None'}`);
      console.log(`Reasoning: ${impact.reasoning}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error('❌ Invalid command: %s', program.args.join(' '));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse and execute
program.parse();
