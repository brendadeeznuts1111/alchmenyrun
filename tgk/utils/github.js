/**
 * GitHub CLI Integration Utilities
 * Enhanced GitHub operations for tgk CLI
 */

const { Octokit } = require('@octokit/rest');
const { execSync } = require('node:child_process');

class GitHubManager {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPOSITORY || 'brendadeeznuts1111/alchmenyrun';
    this.owner = this.repo.split('/')[0];
    this.name = this.repo.split('/')[1];

    if (this.token) {
      this.octokit = new Octokit({ auth: this.token });
    }
  }

  // Check if in test mode (no real API calls)
  isTestMode() {
    return !this.token;
  }

  // Execute gh CLI command
  execGh(command) {
    try {
      const result = execSync(`gh ${command}`, {
        encoding: 'utf8',
        env: { ...process.env, GH_TOKEN: this.token }
      });
      return result.trim();
    } catch (error) {
      throw new Error(`GitHub CLI error: ${error.message}`);
    }
  }

  // Repository operations
  async getRepoInfo() {
    if (this.isTestMode()) {
      return {
        owner: 'brendadeeznuts1111',
        name: 'alchmenyrun',
        full_name: 'brendadeeznuts1111/alchmenyrun',
        default_branch: 'main'
      };
    }

    const { data } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.name
    });
    return data;
  }

  async createIssue(title, body, labels = [], assignees = []) {
    if (this.isTestMode()) {
      console.log(`🧪 Would create issue: "${title}"`);
      console.log(`🏷️  Labels: ${labels.join(', ') || 'none'}`);
      console.log(`👥 Assignees: ${assignees.join(', ') || 'none'}`);
      return { number: Math.floor(Math.random() * 1000) };
    }

    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.name,
      title,
      body,
      labels,
      assignees
    });
    return data;
  }

  async getIssue(number) {
    if (this.isTestMode()) {
      return {
        number,
        title: `Test Issue #${number}`,
        body: 'Test issue body',
        state: 'open',
        labels: [{ name: 'test' }]
      };
    }

    const { data } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.name,
      issue_number: number
    });
    return data;
  }

  async addLabels(number, labels) {
    if (this.isTestMode()) {
      console.log(`🏷️ Would add labels ${labels.join(', ')} to issue #${number}`);
      return;
    }

    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.name,
      issue_number: number,
      labels
    });
  }

  async createPullRequest(title, body, head, base = 'main', options = {}) {
    if (this.isTestMode()) {
      console.log(`🧪 Would create PR: "${title}"`);
      console.log(`📋 Head: ${head}, Base: ${base}`);
      if (options.topic) console.log(`🏷️ Topic: ${options.topic}`);
      if (options.labels) console.log(`🏷️ Labels: ${options.labels.join(', ')}`);
      return { number: Math.floor(Math.random() * 1000) };
    }

    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.name,
      title,
      body,
      head,
      base
    });

    // Add labels if provided
    if (options.labels && options.labels.length > 0) {
      await this.addLabels(data.number, options.labels);
    }

    // Add topic to PR body if provided
    if (options.topic) {
      const topicBody = `**Topic:** ${options.topic}\n\n${body}`;
      await this.octokit.pulls.update({
        owner: this.owner,
        repo: this.name,
        pull_number: data.number,
        body: topicBody
      });
    }

    return data;
  }

  async getPullRequest(number) {
    if (this.isTestMode()) {
      return {
        number,
        title: `Test PR #${number}`,
        body: 'Test PR body',
        state: 'open',
        head: { ref: 'feature/test' },
        base: { ref: 'main' }
      };
    }

    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.name,
      pull_number: number
    });
    return data;
  }

  async mergePullRequest(number, method = 'squash') {
    if (this.isTestMode()) {
      console.log(`🔀 Would merge PR #${number} with ${method} strategy`);
      return;
    }

    await this.octokit.pulls.merge({
      owner: this.owner,
      repo: this.name,
      pull_number: number,
      merge_method: method
    });
  }

  async reviewPullRequest(number, action, message = '') {
    if (this.isTestMode()) {
      console.log(`👁️ Would ${action} PR #${number}: ${message}`);
      return;
    }

    const reviewEvent = action === 'approve' ? 'APPROVE' : 
                       action === 'request_changes' ? 'REQUEST_CHANGES' : 
                       'COMMENT';

    await this.octokit.pulls.createReview({
      owner: this.owner,
      repo: this.name,
      pull_number: number,
      body: message,
      event: reviewEvent
    });
  }

  async approvePullRequest(number, message = 'Approved via TGK') {
    return await this.reviewPullRequest(number, 'approve', message);
  }

  async requestChangesOnPullRequest(number, message) {
    return await this.reviewPullRequest(number, 'request_changes', message);
  }

  async commentOnPullRequest(number, message) {
    return await this.reviewPullRequest(number, 'comment', message);
  }

  async getPRStatus(number, detailed = false) {
    if (this.isTestMode()) {
      const mockStatus = {
        number,
        title: `Test PR #${number}`,
        state: 'open',
        head: { ref: 'feature/test' },
        base: { ref: 'main' },
        mergeable: true,
        merged: false,
        draft: false,
        checks: { passing: 3, total: 3 },
        reviews: [{ state: 'APPROVED' }],
        labels: [{ name: 'ready' }]
      };

      if (detailed) {
        mockStatus.ai = {
          risk: 'low',
          coverage: '85%',
          breaking: false
        };
      }

      return mockStatus;
    }

    const { data: pr } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.name,
      pull_number: number
    });

    // Get combined status
    const { data: status } = await this.octokit.repos.getCombinedStatusForRef({
      owner: this.owner,
      repo: this.name,
      ref: pr.head.sha
    });

    // Get reviews
    const { data: reviews } = await this.octokit.pulls.listReviews({
      owner: this.owner,
      repo: this.name,
      pull_number: number
    });

    const result = {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      head: pr.head,
      base: pr.base,
      mergeable: pr.mergeable,
      merged: pr.merged,
      draft: pr.draft,
      checks: {
        passing: status.statuses.filter(s => s.state === 'success').length,
        total: status.statuses.length
      },
      reviews: reviews,
      labels: pr.labels
    };

    if (detailed) {
      // Mock AI analysis for now
      result.ai = {
        risk: Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        coverage: `${Math.floor(Math.random() * 40 + 60)}%`,
        breaking: Math.random() > 0.8
      };
    }

    return result;
  }

  async createRelease(tag, name, body, draft = false) {
    if (this.isTestMode()) {
      console.log(`🏷️ Would create release: ${tag}`);
      console.log(`📦 Name: ${name}`);
      return { html_url: `https://github.com/${this.owner}/${this.name}/releases/tag/${tag}` };
    }

    const { data } = await this.octokit.repos.createRelease({
      owner: this.owner,
      repo: this.name,
      tag_name: tag,
      name,
      body,
      draft
    });
    return data;
  }

  async getCommits(since = null, until = null) {
    if (this.isTestMode()) {
      return [
        { sha: 'abc123', commit: { message: 'feat: add new feature' } },
        { sha: 'def456', commit: { message: 'fix: resolve bug' } }
      ];
    }

    const params = {
      owner: this.owner,
      repo: this.name,
      per_page: 50
    };

    if (since) params.since = since;
    if (until) params.until = until;

    const { data } = await this.octokit.repos.listCommits(params);
    return data;
  }

  async triggerWorkflow(workflowName, inputs = {}) {
    if (this.isTestMode()) {
      console.log(`⚡ Would trigger workflow: ${workflowName}`);
      console.log(`📝 Inputs:`, inputs);
      return;
    }

    // Use gh CLI for workflow dispatch
    const inputsStr = Object.entries(inputs)
      .map(([key, value]) => `-f ${key}=${value}`)
      .join(' ');

    this.execGh(`workflow run ${workflowName} ${inputsStr}`);
  }

  async getWorkflowRuns(workflowName, status = null) {
    if (this.isTestMode()) {
      return {
        workflow_runs: [
          {
            id: 123,
            name: workflowName,
            status: 'completed',
            conclusion: 'success'
          }
        ]
      };
    }

    const params = {
      owner: this.owner,
      repo: this.name,
      per_page: 10
    };

    if (workflowName) {
      // Get workflow ID first
      const workflows = await this.octokit.actions.listRepoWorkflows({
        owner: this.owner,
        repo: this.name
      });

      const workflow = workflows.data.workflows.find(w =>
        w.name === workflowName || w.path.includes(workflowName)
      );

      if (workflow) {
        params.workflow_id = workflow.id;
      }
    }

    if (status) params.status = status;

    const { data } = await this.octokit.actions.listWorkflowRunsForRepo(params);
    return data;
  }

  // Branch operations
  async createBranch(name, sha) {
    if (this.isTestMode()) {
      console.log(`🌿 Would create branch: ${name} from ${sha}`);
      return;
    }

    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.name,
      ref: `refs/heads/${name}`,
      sha
    });
  }

  async deleteBranch(name) {
    if (this.isTestMode()) {
      console.log(`🗑️ Would delete branch: ${name}`);
      return;
    }

    await this.octokit.git.deleteRef({
      owner: this.owner,
      repo: this.name,
      ref: `refs/heads/${name}`
    });
  }

  // Label management
  async getLabels() {
    if (this.isTestMode()) {
      return [
        { name: 'bug', color: 'd73a4a' },
        { name: 'enhancement', color: '0e8a16' }
      ];
    }

    const { data } = await this.octokit.issues.listLabelsForRepo({
      owner: this.owner,
      repo: this.name
    });
    return data;
  }

  async createLabel(name, color, description = '') {
    if (this.isTestMode()) {
      console.log(`🏷️ Would create label: ${name} (${color})`);
      return;
    }

    const { data } = await this.octokit.issues.createLabel({
      owner: this.owner,
      repo: this.name,
      name,
      color,
      description
    });
    return data;
  }

  // Issue template operations
  async getIssueTemplates() {
    if (this.isTestMode()) {
      return ['bug_report.md', 'feature_request.md'];
    }

    // GitHub doesn't have an API for issue templates
    // Would need to read from .github/ISSUE_TEMPLATE/ directory
    return ['bug_report.md', 'feature_request.md'];
  }

  // Metadata operations
  async getRepositoryMetadata() {
    if (this.isTestMode()) {
      return {
        topics: ['cloudflare', 'infrastructure', 'typescript'],
        description: 'Modern Cloudflare Infrastructure with Alchemy',
        homepage: 'https://alchemy.run'
      };
    }

    const { data } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.name
    });

    return {
      topics: data.topics || [],
      description: data.description,
      homepage: data.homepage,
      language: data.language,
      license: data.license?.name,
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count
    };
  }

  async updateRepositoryMetadata(updates) {
    if (this.isTestMode()) {
      console.log(`📝 Would update repository metadata:`, updates);
      return;
    }

    await this.octokit.repos.update({
      owner: this.owner,
      repo: this.name,
      ...updates
    });
  }

  // Auto-merge operations
  async enableAutoMerge(number) {
    if (this.isTestMode()) {
      console.log(`🤖 Would enable auto-merge for PR #${number}`);
      return;
    }

    await this.octokit.pulls.update({
      owner: this.owner,
      repo: this.name,
      pull_number: number,
      auto_merge: {
        enabled_by: {
          login: 'github-actions[bot]'
        },
        merge_method: 'squash',
        commit_title: `Merge pull request #${number}`,
        commit_message: 'Automated merge'
      }
    });
  }

  // Dependency management
  async getDependabotConfig() {
    if (this.isTestMode()) {
      return {
        'version': 2,
        'updates': [
          {
            'package-ecosystem': 'npm',
            'directory': '/',
            'schedule': { 'interval': 'weekly' }
          }
        ]
      };
    }

    // Would read .github/dependabot.yml
    return {};
  }

  // Code scanning and security
  async getCodeScanningAlerts(state = 'open') {
    if (this.isTestMode()) {
      return [
        {
          number: 1,
          rule: { name: 'security-issue' },
          state: 'open',
          severity: 'high'
        }
      ];
    }

    const { data } = await this.octokit.codeScanning.listAlertsForRepo({
      owner: this.owner,
      repo: this.name,
      state
    });
    return data;
  }
}

module.exports = { GitHubManager };
