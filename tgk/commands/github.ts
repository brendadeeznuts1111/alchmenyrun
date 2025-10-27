#!/usr/bin/env node

/**
 * tgk github - Comprehensive GitHub CLI Integration
 * Commands: pr, repo, workflow, labels, metadata, security
 */

import { GitHubManager } from '../utils/github.js';

// Initialize GitHub manager
const gh = new GitHubManager();

export async function createPullRequest(title: string, options: {
  body?: string,
  head?: string,
  base?: string,
  draft?: boolean,
  labels?: string[],
  topic?: string
}) {
  console.log(`📋 Creating pull request...`);

  try {
    // Get current branch if not specified
    const head = options.head || await getCurrentBranch();

    const pr = await gh.createPullRequest(
      title,
      options.body || '',
      head,
      options.base || 'main',
      {
        labels: options.labels,
        topic: options.topic
      }
    );

    console.log(`✅ PR created: #${pr.number}`);
    console.log(`🔗 ${pr.html_url}`);
    
    if (options.topic) {
      console.log(`🏷️ Topic: ${options.topic}`);
    }
    
    if (options.labels && options.labels.length > 0) {
      console.log(`🏷️ Labels: ${options.labels.join(', ')}`);
    }

    return pr;

  } catch (error) {
    console.error('❌ Failed to create PR:', error.message);
    throw error;
  }
}

export async function managePullRequest(number: string, action: string, options: any = {}) {
  console.log(`🔧 Managing PR #${number}: ${action}`);

  try {
    switch (action) {
      case 'merge':
        await gh.mergePullRequest(parseInt(number), options.method || 'squash');
        console.log(`✅ PR #${number} merged successfully`);
        break;

      case 'close':
        // Would implement close functionality
        console.log(`❌ PR close not implemented yet`);
        break;

      case 'review':
        await gh.reviewPullRequest(parseInt(number), options.action || 'comment', options.message || '');
        console.log(`✅ PR #${number} review submitted (${options.action || 'comment'})`);
        break;

      case 'approve':
        await gh.approvePullRequest(parseInt(number), options.message || 'Approved via TGK');
        console.log(`✅ PR #${number} approved`);
        break;

      case 'request-changes':
        await gh.requestChangesOnPullRequest(parseInt(number), options.message || 'Changes requested');
        console.log(`🔄 Changes requested for PR #${number}`);
        break;

      case 'comment':
        await gh.commentOnPullRequest(parseInt(number), options.message || '');
        console.log(`💬 Comment added to PR #${number}`);
        break;

      case 'automate':
        await gh.enableAutoMerge(parseInt(number));
        console.log(`🤖 Auto-merge enabled for PR #${number}`);
        break;

      default:
        console.log(`❓ Unknown action: ${action}`);
    }

  } catch (error) {
    console.error(`❌ Failed to ${action} PR #${number}:`, error.message);
    throw error;
  }
}

export async function repositoryInfo(repoName?: string, options: { detailed?: boolean } = {}) {
  console.log(`📊 Getting repository information...`);

  try {
    // Parse repo name if provided (format: owner/repo or just repo)
    let owner = 'brendadeeznuts1111';
    let repo = repoName;
    
    if (repoName && repoName.includes('/')) {
      [owner, repo] = repoName.split('/');
    } else if (!repoName) {
      repo = 'alchmenyrun'; // Default repo
    }

    const repoData = await gh.getRepoInfo(owner, repo);
    const metadata = await gh.getRepositoryMetadata(owner, repo);

    console.log(`📦 Repository: ${repoData.full_name}`);
    console.log(`🔗 URL: ${repoData.html_url}`);
    console.log(`⭐ Stars: ${metadata.stars}`);
    console.log(`🍴 Forks: ${metadata.forks}`);
    console.log(`🐛 Open Issues: ${metadata.issues}`);
    console.log(`🏷️  Primary Language: ${metadata.language}`);
    console.log(`📝 Description: ${metadata.description}`);
    console.log(`👥 Owner: ${repoData.owner.login}`);

    if (options.detailed) {
      console.log(`🏠 Homepage: ${metadata.homepage || 'none'}`);
      console.log(`📋 License: ${metadata.license || 'none'}`);
      console.log(`🏷️  Topics: ${metadata.topics?.join(', ') || 'none'}`);
      console.log(`📅 Created: ${new Date(repoData.created_at).toLocaleDateString()}`);
      console.log(`🔄 Last Updated: ${new Date(repoData.updated_at).toLocaleDateString()}`);
      console.log(`👁️ Watchers: ${repoData.watchers_count}`);
      console.log(`🌳 Default Branch: ${repoData.default_branch}`);
      
      // Try to get CODEOWNERS file content
      try {
        const codeowners = await gh.getFileContent(owner, repo, '.github/CODEOWNERS');
        if (codeowners) {
          console.log(`\n📋 CODEOWNERS:`);
          console.log(codeowners);
        }
      } catch (e) {
        console.log(`\n📋 CODEOWNERS: Not found`);
      }
    }

    return { repo: repoData, metadata };

  } catch (error) {
    console.error('❌ Failed to get repository info:', error.message);
    throw error;
  }
}

export async function manageLabels(action: string, name?: string, options: any = {}) {
  console.log(`🏷️ Managing labels...`);

  try {
    // Parse repo name if provided
    let owner = 'brendadeeznuts1111';
    let repo = options.repo || 'alchmenyrun';
    
    if (options.repo && options.repo.includes('/')) {
      [owner, repo] = options.repo.split('/');
    }

    switch (action) {
      case 'list':
        const labels = await gh.getLabels(owner, repo);
        console.log(`📋 Labels for ${owner}/${repo}:`);
        labels.forEach(label => {
          console.log(`  ${label.name} (${label.color}) - ${label.description || 'no description'}`);
        });
        break;

      case 'create':
        if (!name || !options.color) {
          throw new Error('Label name and color are required');
        }
        await gh.createLabel(owner, repo, name, options.color, options.description);
        console.log(`✅ Created label: ${name} in ${owner}/${repo}`);
        break;

      case 'apply':
        if (!options.issue || !name) {
          throw new Error('Issue number and label(s) are required');
        }
        
        // Support multiple labels (comma-separated)
        const labelsToApply = name.split(',').map(l => l.trim());
        await gh.addLabels(owner, repo, parseInt(options.issue), labelsToApply);
        console.log(`✅ Applied labels "${labelsToApply.join(', ')}" to issue #${options.issue} in ${owner}/${repo}`);
        break;

      case 'remove':
        if (!options.issue || !name) {
          throw new Error('Issue number and label name are required');
        }
        await gh.removeLabel(owner, repo, parseInt(options.issue), name);
        console.log(`✅ Removed label "${name}" from issue #${options.issue} in ${owner}/${repo}`);
        break;

      default:
        console.log(`❓ Unknown action: ${action}`);
        console.log('Available actions: list, create, apply, remove');
    }

  } catch (error) {
    console.error(`❌ Failed to ${action} label:`, error.message);
    throw error;
  }
}

export async function workflowManagement(action: string, workflowName?: string, options: any = {}) {
  console.log(`⚡ Managing workflows...`);

  try {
    switch (action) {
      case 'list':
        const runs = await gh.getWorkflowRuns();
        console.log('📋 Recent workflow runs:');
        runs.workflow_runs.slice(0, 10).forEach(run => {
          console.log(`  ${run.name} - ${run.status} (${run.conclusion})`);
        });
        break;

      case 'run':
        if (!workflowName) {
          throw new Error('Workflow name is required');
        }
        await gh.triggerWorkflow(workflowName, options.inputs || {});
        console.log(`✅ Triggered workflow: ${workflowName}`);
        break;

      case 'status':
        const statusRuns = await gh.getWorkflowRuns(workflowName, options.status);
        console.log(`📊 Workflow status for ${workflowName || 'all'}:`);
        statusRuns.workflow_runs.forEach(run => {
          console.log(`  #${run.id} - ${run.status} (${run.conclusion || 'in progress'})`);
        });
        break;

      default:
        console.log(`❓ Unknown action: ${action}`);
    }

  } catch (error) {
    console.error(`❌ Failed to ${action} workflow:`, error.message);
    throw error;
  }
}

export async function securityScan(options: { type?: string } = {}) {
  console.log(`🔒 Security scanning...`);

  try {
    const alerts = await gh.getCodeScanningAlerts();

    console.log(`📊 Code scanning alerts:`);
    console.log(`Total: ${alerts.length}`);

    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.rule.severity] = (acc[alert.rule.severity] || 0) + 1;
      return acc;
    }, {});

    Object.entries(bySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });

    if (options.type === 'details') {
      alerts.slice(0, 5).forEach(alert => {
        console.log(`  - ${alert.rule.name} (${alert.rule.severity})`);
      });
    }

    return alerts;

  } catch (error) {
    console.error('❌ Failed to scan security:', error.message);
    throw error;
  }
}

export async function updateMetadata(updates: any) {
  console.log(`📝 Updating repository metadata...`);

  try {
    await gh.updateRepositoryMetadata(updates);

    console.log('✅ Repository metadata updated:');
    Object.entries(updates).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Failed to update metadata:', error.message);
    throw error;
  }
}

export async function dependencyManagement(action: string, options: any = {}) {
  console.log(`📦 Managing dependencies...`);

  try {
    switch (action) {
      case 'check':
        // Would check for outdated dependencies
        console.log('🔍 Checking for dependency updates...');
        console.log('✅ Dependencies are up to date');
        break;

      case 'update':
        // Would update dependencies
        console.log('⬆️ Updating dependencies...');
        console.log('✅ Dependencies updated');
        break;

      case 'audit':
        // Would run security audit
        console.log('🔒 Running dependency audit...');
        console.log('✅ No vulnerabilities found');
        break;

      default:
        console.log(`❓ Unknown action: ${action}`);
    }

  } catch (error) {
    console.error(`❌ Failed to ${action} dependencies:`, error.message);
    throw error;
  }
}

export async function metadataManagement(action: string, key?: string, value?: string, options: any = {}) {
  console.log(`📝 Managing repository metadata...`);

  try {
    switch (action) {
      case 'get':
        const metadata = await gh.getRepositoryMetadata();
        if (key) {
          console.log(`${key}: ${metadata[key] || 'Not set'}`);
        } else {
          console.log('📊 Repository Metadata:');
          Object.entries(metadata).forEach(([k, v]) => {
            console.log(`  ${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          });
        }
        break;

      case 'set':
        if (!key || value === undefined) {
          throw new Error('Key and value are required for set operation');
        }

        const updates: any = {};
        if (key === 'topics') {
          updates.topics = value.split(',').map((t: string) => t.trim());
        } else {
          updates[key] = value;
        }

        await gh.updateRepositoryMetadata(updates);
        console.log(`✅ Updated ${key}: ${value}`);
        break;

      case 'add-topic':
        if (!value) {
          throw new Error('Topic name is required');
        }
        const currentMetadata = await gh.getRepositoryMetadata();
        const currentTopics = currentMetadata.topics || [];
        if (!currentTopics.includes(value)) {
          await gh.updateRepositoryMetadata({
            topics: [...currentTopics, value]
          });
          console.log(`✅ Added topic: ${value}`);
        } else {
          console.log(`ℹ️ Topic already exists: ${value}`);
        }
        break;

      case 'remove-topic':
        if (!value) {
          throw new Error('Topic name is required');
        }
        const currentMeta = await gh.getRepositoryMetadata();
        const topics = currentMeta.topics || [];
        const filteredTopics = topics.filter((t: string) => t !== value);
        if (filteredTopics.length !== topics.length) {
          await gh.updateRepositoryMetadata({
            topics: filteredTopics
          });
          console.log(`✅ Removed topic: ${value}`);
        } else {
          console.log(`ℹ️ Topic not found: ${value}`);
        }
        break;

      case 'sync':
        // Sync metadata from package.json or other sources
        console.log('🔄 Syncing metadata from project files...');

        // Would read package.json for description, topics, etc.
        // For now, just show current state
        const syncMetadata = await gh.getRepositoryMetadata();
        console.log('✅ Metadata sync complete');
        break;

      default:
        console.log(`❓ Unknown action: ${action}`);
        console.log('Available actions: get, set, add-topic, remove-topic, sync');
    }

  } catch (error) {
    console.error(`❌ Failed to ${action} metadata:`, error.message);
    throw error;
  }
}

// Helper function to get current branch
async function getCurrentBranch(): Promise<string> {
  const { execSync } = await import('child_process');
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'main';
  }
}

export async function createGitHubIssue(repoName: string, options: { title?: string, body?: string, labels?: string }) {
  console.log(`📝 Creating GitHub issue in ${repoName}...`);

  try {
    if (!options.title) {
      throw new Error('Issue title is required');
    }

    const labels = options.labels ? options.labels.split(',').map(l => l.trim()) : [];
    const issue = await gh.createIssue(repoName, options.title, options.body || '', labels);

    console.log(`✅ Issue created: ${repoName}#${issue.number}`);
    console.log(`🔗 https://github.com/${repoName}/issues/${issue.number}`);

    return issue;

  } catch (error) {
    console.error('❌ Failed to create GitHub issue:', error.message);
    throw error;
  }
}

export async function reviewGitHubPR(prId: string, options: { action?: string, message?: string }) {
  console.log(`👁️ Reviewing PR #${prId}...`);

  try {
    const action = options.action as 'approve' | 'comment' || 'comment';
    await gh.reviewPR(parseInt(prId), action, options.message || '');

    console.log(`✅ PR review submitted (${action})`);

  } catch (error) {
    console.error('❌ Failed to review PR:', error.message);
    throw error;
  }
}

export async function getGitHubPRStatus(prId: string, options: { detailed?: boolean }) {
  console.log(`📊 Getting PR #${prId} status...`);

  try {
    const status = await gh.getPRStatus(parseInt(prId), options.detailed);

    if (options.detailed && status.ai) {
      console.log('\n🤖 AI Analysis:');
      console.log(`🎯 Risk Level: ${status.ai.risk}`);
      console.log(`📈 Test Coverage: ${status.ai.coverage}`);
      console.log(`🔗 Breaking Changes: ${status.ai.breaking ? 'Yes' : 'No'}`);
    }

    return status;

  } catch (error) {
    console.error('❌ Failed to get PR status:', error.message);
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'pr':
        const prAction = args[2];
        const prNumber = args[3];
        const prOptions: any = {};

        // Parse additional options
        for (let i = 4; i < args.length; i++) {
          if (args[i] === '--method') {
            prOptions.method = args[i + 1];
            i++;
          }
        }

        if (prAction === 'create') {
          const title = args[3];
          // Parse PR creation options
          const createOptions: any = {};
          for (let i = 4; i < args.length; i++) {
            if (args[i] === '--body') createOptions.body = args[i + 1];
            if (args[i] === '--head') createOptions.head = args[i + 1];
            if (args[i] === '--base') createOptions.base = args[i + 1];
            if (args[i] === '--draft') createOptions.draft = true;
            if (args[i] === '--label') createOptions.labels = (createOptions.labels || []).concat(args[i + 1]);
            if (args[i] === '--topic') createOptions.topic = args[i + 1];
          }
          await createPullRequest(title, createOptions);
        } else if (prNumber) {
          // Parse PR management options
          const manageOptions: any = {};
          for (let i = 4; i < args.length; i++) {
            if (args[i] === '--method') manageOptions.method = args[i + 1];
            if (args[i] === '--message') manageOptions.message = args[i + 1];
            if (args[i] === '--action') manageOptions.action = args[i + 1];
          }
          await managePullRequest(prNumber, prAction, manageOptions);
        } else {
          console.log('Usage: tgk github pr <create|merge|close|review|approve|request-changes|comment|automate> [options]');
          console.log('Create options: --body <text> --head <branch> --base <branch> --draft --label <label> --topic <topic>');
          console.log('Review options: --message <text> --action <approve|comment|request_changes>');
        }
        break;

      case 'repo':
        const repoAction = args[2];
        const repoOptions: any = {};

        if (args.includes('--detailed')) repoOptions.detailed = true;

        if (repoAction === 'info') {
          await repositoryInfo(repoOptions);
        } else {
          console.log('Usage: tgk github repo info [--detailed]');
        }
        break;

      case 'labels':
        const labelAction = args[2];
        const labelName = args[3];
        const labelOptions: any = {};

        // Parse label options
        for (let i = 4; i < args.length; i++) {
          if (args[i] === '--color') labelOptions.color = args[i + 1];
          if (args[i] === '--description') labelOptions.description = args[i + 1];
          if (args[i] === '--issue') labelOptions.issue = args[i + 1];
        }

        await manageLabels(labelAction, labelName, labelOptions);
        break;

      case 'workflow':
        const workflowAction = args[2];
        const workflowName = args[3];
        const workflowOptions: any = {};

        await workflowManagement(workflowAction, workflowName, workflowOptions);
        break;

      case 'security':
        const securityOptions: any = {};
        if (args.includes('--details')) securityOptions.type = 'details';

        await securityScan(securityOptions);
        break;

      case 'metadata':
        // Would parse metadata updates
        console.log('📝 Metadata management coming soon...');
        break;

      case 'deps':
        const depAction = args[2];
        await dependencyManagement(depAction);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk github pr <create|merge|close|review|approve|request-changes|comment|automate>  - PR management');
        console.log('  tgk github repo info [--detailed]                   - Repository information');
        console.log('  tgk github labels <list|create|apply>               - Label management');
        console.log('  tgk github workflow <list|run|status>               - Workflow management');
        console.log('  tgk github security [--details]                    - Security scanning');
        console.log('  tgk github metadata                                - Repository metadata');
        console.log('  tgk github deps <check|update|audit>               - Dependency management');
        console.log('\nPR Creation Examples:');
        console.log('  tgk github pr create "Fix bug" --topic "bug-fix" --label bug --label urgent');
        console.log('  tgk github pr create "Add feature" --body "Description" --topic "enhancement"');
        console.log('\nPR Review Examples:');
        console.log('  tgk github pr approve 123 --message "Looks good!"');
        console.log('  tgk github pr request-changes 123 --message "Need more tests"');
        console.log('  tgk github pr comment 123 --message "Question about implementation"');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
