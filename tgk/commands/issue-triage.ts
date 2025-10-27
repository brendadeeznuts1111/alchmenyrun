import { Command } from 'commander';
import { GitHubTriageClient, GitHubIssue } from './github-client';

export function createIssueTriageCommands(): Command {
  const issue = new Command('issue')
    .description('AI-powered issue management commands');

  issue
    .command('triage')
    .description('AI-powered issue triage and labeling')
    .argument('<issue-number>', 'GitHub issue number to triage')
    .option('--dry-run', 'Show what would be applied without making changes')
    .option('--confidence-threshold <threshold>', 'Minimum confidence for auto-labeling', '0.7')
    .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
    .option('--repo <repo>', 'Repository name (owner/repo)', 'brendadeeznuts1111/alchmenyrun')
    .action(async (issueNumber: string, options) => {
      try {
        const token = options.token || process.env.GITHUB_TOKEN;
        if (!token) {
          console.error('❌ GitHub token required. Set GITHUB_TOKEN env var or use --token');
          process.exit(1);
        }

        const [owner, repo] = options.repo.split('/');
        const client = new GitHubTriageClient(token, owner, repo);

        console.log(`🔍 Triaging issue #${issueNumber}...`);

        // Get issue data from GitHub
        const issue = await client.getIssue(parseInt(issueNumber));
        console.log(`📋 Issue: "${issue.title}" by @${issue.user.login}`);

        // AI triage analysis (simple but effective)
        const triageResult = await performTriageAnalysis(issue);
        console.log(`🤖 AI Analysis complete (confidence: ${(triageResult.confidence * 100).toFixed(1)}%)`);

        // Display findings
        displayTriageResults(triageResult, options.dryRun);

        // Apply labels if confident enough and not dry-run
        if (!options.dryRun && triageResult.confidence >= parseFloat(options.confidenceThreshold)) {
          await client.addLabels(parseInt(issueNumber), triageResult.labels);
          console.log(`✅ Applied ${triageResult.labels.length} labels to issue #${issueNumber}`);
        } else if (options.dryRun) {
          console.log(`ℹ️  Dry run complete - no labels applied`);
        } else {
          console.log(`⚠️  Confidence too low (${(triageResult.confidence * 100).toFixed(1)}% < ${options.confidenceThreshold}%) - manual review needed`);
        }

      } catch (error: any) {
        console.error(`❌ Triage failed: ${error.message}`);
        process.exit(1);
      }
    });

  issue
    .command('analyze')
    .description('Analyze issue content without applying labels')
    .argument('<issue-number>', 'GitHub issue number to analyze')
    .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN env var)')
    .option('--repo <repo>', 'Repository name (owner/repo)', 'brendadeeznuts1111/alchmenyrun')
    .action(async (issueNumber: string, options) => {
      const token = options.token || process.env.GITHUB_TOKEN;
      if (!token) {
        console.error('❌ GitHub token required. Set GITHUB_TOKEN env var or use --token');
        process.exit(1);
      }

      const [owner, repo] = options.repo.split('/');
      const client = new GitHubTriageClient(token, owner, repo);

      const issue = await client.getIssue(parseInt(issueNumber));
      const analysis = await performTriageAnalysis(issue);
      displayDetailedAnalysis(analysis);
    });

  return issue;
}

// Simple but effective triage logic
async function performTriageAnalysis(issue: GitHubIssue): Promise<TriageResult> {
  const labels: string[] = [];
  let confidence = 0.5; // Base confidence
  const reasoning: string[] = [];

  // 1. Determine audience (customer vs internal)
  if (issue.repository?.full_name?.includes('customer') || issue.body?.includes('customer')) {
    labels.push('customer');
    confidence += 0.1;
    reasoning.push('Repository or content mentions customer context');
  } else {
    labels.push('internal');
    confidence += 0.1;
    reasoning.push('Internal repository and no customer mentions');
  }

  // 2. Determine topic from title/body analysis
  const titleLower = issue.title.toLowerCase();
  const bodyLower = issue.body?.toLowerCase() || '';
  const combinedText = `${titleLower} ${bodyLower}`;

  // Technical topics
  if (combinedText.includes('race') || combinedText.includes('concurrent') || combinedText.includes('pin')) {
    labels.push('topic/state-pinning');
    confidence += 0.2;
    reasoning.push('Content suggests state/concurrency issues');
  }

  if (combinedText.includes('telegram') || combinedText.includes('message')) {
    labels.push('topic/telegram-integration');
    confidence += 0.15;
    reasoning.push('Telegram-related content detected');
  }

  if (combinedText.includes('deploy') || combinedText.includes('worker')) {
    labels.push('topic/deployment');
    confidence += 0.15;
    reasoning.push('Deployment/worker-related content detected');
  }

  // 3. Determine impact level
  if (combinedText.includes('critical') || combinedText.includes('urgent') || combinedText.includes('breaking')) {
    labels.push('impact/critical');
    confidence += 0.2;
    reasoning.push('Critical/urgent language detected');
  } else if (combinedText.includes('important') || combinedText.includes('significant') || (issue.body?.length || 0) > 500) {
    labels.push('impact/high');
    confidence += 0.15;
    reasoning.push('Detailed description or important language detected');
  } else {
    labels.push('impact/low');
    confidence += 0.1;
    reasoning.push('Standard issue complexity');
  }

  // 4. Determine type
  if (combinedText.includes('bug') || combinedText.includes('error') || combinedText.includes('broken')) {
    labels.push('type/bug');
    confidence += 0.1;
    reasoning.push('Bug/error language detected');
  } else if (combinedText.includes('feature') || combinedText.includes('enhancement')) {
    labels.push('type/feature');
    confidence += 0.1;
    reasoning.push('Feature request language detected');
  } else {
    labels.push('type/question');
    confidence += 0.05;
    reasoning.push('General inquiry format');
  }

  // Normalize confidence (cap at 0.95)
  confidence = Math.min(confidence, 0.95);

  return {
    labels,
    confidence,
    reasoning: reasoning.join('; '),
    timestamp: new Date().toISOString()
  };
}

// Helper functions are now handled by GitHubTriageClient

function displayTriageResults(result: TriageResult, isDryRun: boolean): void {
  console.log('\n📊 Triage Results:');
  console.log('─'.repeat(50));
  console.log(`Labels to apply: ${result.labels.join(', ')}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  if (isDryRun) {
    console.log('\n📝 Dry run - no changes applied');
  }
  console.log('─'.repeat(50));
}

function displayDetailedAnalysis(analysis: TriageResult): void {
  console.log('\n🔍 Detailed Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
}

// Types
export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  user: { login: string };
  repository?: { full_name: string };
  labels: Array<{ name: string }>;
}

export interface TriageResult {
  labels: string[];
  confidence: number;
  reasoning: string;
  timestamp: string;
}
