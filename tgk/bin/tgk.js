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

// Release orchestration commands
program
  .command('release-plan')
  .description('AI-generated release planning and council approval')
  .option('--type <type>', 'Release type (patch, minor, major)', 'minor')
  .action(async (options) => {
    try {
      console.log('DEBUG: options.type:', options.type);
      const { planRelease } = await import(path.resolve(__dirname, '../commands/release.ts'));
      await planRelease({ type: options.type });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('release approve <release-id>')
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
  .command('release deploy <release-id>')
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
  .command('github repo <action>')
  .description('GitHub repository management')
  .option('--detailed', 'Show detailed information')
  .action(async (action, options) => {
    try {
      const { repositoryInfo } = await import('../commands/github.ts');

      if (action === 'info') {
        await repositoryInfo(options);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('github labels <action>')
  .description('GitHub label management')
  .option('--color <color>', 'Label color (hex without #)')
  .option('--description <desc>', 'Label description')
  .option('--issue <number>', 'Issue number to apply label to')
  .action(async (action, options) => {
    try {
      const { manageLabels } = await import('../commands/github.ts');
      const labelName = options._[1];
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
      const { metadataManagement } = await import('../commands/github.ts');
      await metadataManagement(action, options.key, options.value, options);
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
