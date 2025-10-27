#!/usr/bin/env node

/**
 * tgk ai - Centralized AI Module for Intelligent Workflow Orchestration
 * Commands: suggest labels, suggest release-type, analyze impact
 */

import { Octokit } from '@octokit/rest';

// Initialize GitHub client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// AI suggestion interfaces
export interface LabelSuggestion {
  labels: string[];
  confidence: number;
  reasoning: string;
}

export interface ReleaseTypeSuggestion {
  type: 'patch' | 'minor' | 'major';
  confidence: number;
  reasoning: string;
  commit_analysis: {
    features: number;
    fixes: number;
    breaking: number;
    total: number;
  };
}

export interface ImpactAnalysis {
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  affected_areas: string[];
  risk_score: number;
  reasoning: string;
}

/**
 * AI-powered label suggestion for issues and PRs
 */
export async function suggestLabels(issueId: string, repoOwner: string = 'brendadeeznuts1111', repoName: string = 'alchmenyrun'): Promise<LabelSuggestion> {
  console.log(`🤖 Analyzing issue #${issueId} for label suggestions...`);

  try {
    // Get issue details
    const { data: issue } = await octokit.issues.get({
      owner: repoOwner,
      repo: repoName,
      issue_number: parseInt(issueId)
    });

    // Get PR details if it's a pull request
    let prFiles: any[] = [];
    try {
      if (issue.pull_request) {
        const prNumber = issue.pull_request.url.split('/').pop();
        const { data: pr } = await octokit.pulls.get({
          owner: repoOwner,
          repo: repoName,
          pull_number: parseInt(prNumber)
        });
        
        const { data: files } = await octokit.pulls.listFiles({
          owner: repoOwner,
          repo: repoName,
          pull_number: parseInt(prNumber)
        });
        prFiles = files;
      }
    } catch (e) {
      // Not a PR or error fetching PR details
    }

    // Enhanced AI analysis
    const content = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const fileContent = prFiles.map(f => f.filename).join(' ').toLowerCase();
    const fullContent = `${content} ${fileContent}`;

    // Label taxonomy
    let group = 'internal';
    let topic = 'governance';
    let impact = 'low';
    let confidence = 0.85;
    let reasoning = '';

    // Group classification
    if (fullContent.includes('customer') || fullContent.includes('user') || fullContent.includes('login') || 
        fullContent.includes('external') || fullContent.includes('client')) {
      group = 'customer';
      reasoning += 'Customer-facing issue detected. ';
    } else {
      reasoning += 'Internal issue detected. ';
    }

    // Topic classification with enhanced patterns
    if (fullContent.includes('pin') || fullContent.includes('state') || fullContent.includes('concurrent') || 
        fullContent.includes('lock') || fullContent.includes('atomic') || fullContent.includes('scope')) {
      topic = 'state-pinning';
      reasoning += 'Related to state management, concurrency, or scope system. ';
    } else if (fullContent.includes('metrics') || fullContent.includes('monitor') || fullContent.includes('observability') || 
               fullContent.includes('dashboard') || fullContent.includes('alert')) {
      topic = 'observability';
      reasoning += 'Observability and monitoring related. ';
    } else if (fullContent.includes('security') || fullContent.includes('auth') || fullContent.includes('vulnerability') || 
               fullContent.includes('permission')) {
      topic = 'security';
      reasoning += 'Security-related issue. ';
    } else if (fullContent.includes('performance') || fullContent.includes('slow') || fullContent.includes('optimize') || 
               fullContent.includes('speed')) {
      topic = 'performance';
      reasoning += 'Performance optimization needed. ';
    } else if (fullContent.includes('ux') || fullContent.includes('ui') || fullContent.includes('interface') || 
               fullContent.includes('experience')) {
      topic = 'ux';
      reasoning += 'User experience improvement. ';
    } else {
      reasoning += 'General governance issue. ';
    }

    // Impact assessment with severity indicators
    if (fullContent.includes('critical') || fullContent.includes('crash') || fullContent.includes('broken') || 
        fullContent.includes('security') || fullContent.includes('data loss')) {
      impact = 'critical';
      confidence = 0.95;
      reasoning += 'High impact - critical system affected. ';
    } else if (fullContent.includes('high') || fullContent.includes('urgent') || fullContent.includes('blocker') || 
               fullContent.includes('production')) {
      impact = 'high';
      confidence = 0.90;
      reasoning += 'High impact - production system affected. ';
    } else if (fullContent.includes('medium') || fullContent.includes('important') || fullContent.includes('feature')) {
      impact = 'medium';
      confidence = 0.85;
      reasoning += 'Medium impact - feature-level issue. ';
    } else {
      reasoning += 'Low impact - minor improvement or fix. ';
    }

    // Adjust confidence based on content clarity
    if (fullContent.length < 50) {
      confidence -= 0.1;
      reasoning += 'Low confidence due to limited content. ';
    }

    // Adjust confidence based on PR complexity
    if (prFiles.length > 20) {
      confidence -= 0.05;
      reasoning += 'Slightly reduced confidence due to large PR size. ';
    } else if (prFiles.length > 0 && prFiles.length <= 5) {
      confidence += 0.05;
      reasoning += 'Higher confidence due to focused PR scope. ';
    }

    const labels = [
      `group/${group}`,
      `topic/${topic}`,
      `impact/${impact}`
    ];

    return { 
      labels, 
      confidence: Math.max(confidence, 0.5), 
      reasoning: reasoning.trim()
    };

  } catch (error) {
    console.error('❌ Failed to suggest labels:', error.message);
    throw error;
  }
}

/**
 * AI-powered release type suggestion based on commit analysis
 */
export async function suggestReleaseType(repoOwner: string = 'brendadeeznuts1111', repoName: string = 'alchmenyrun'): Promise<ReleaseTypeSuggestion> {
  console.log('🤖 Analyzing commit history for release type suggestion...');

  try {
    // Get recent commits since last release
    const { data: releases } = await octokit.repos.listReleases({
      owner: repoOwner,
      repo: repoName,
      per_page: 1
    });

    const lastRelease = releases[0];
    const since = lastRelease?.published_at;

    // Get commits since last release
    const { data: commits } = await octokit.repos.listCommits({
      owner: repoOwner,
      repo: repoName,
      since,
      per_page: 100
    });

    // Analyze commit messages
    let features = 0;
    let fixes = 0;
    let breaking = 0;

    commits.forEach(commit => {
      const message = commit.commit.message.toLowerCase();
      
      if (message.includes('feat') || message.includes('feature')) {
        features++;
      }
      if (message.includes('fix') || message.includes('bugfix')) {
        fixes++;
      }
      if (message.includes('breaking') || message.includes('major') || 
          message.includes('!') || message.includes('BREAKING CHANGE')) {
        breaking++;
      }
    });

    // Get linked PRs for additional context
    const linkedPRs = await getLinkedPullRequests(commits, repoOwner, repoName);
    
    // Analyze PR types and impact
    const prAnalysis = await analyzePullRequests(linkedPRs);

    // Combine analysis
    const totalAnalysis = {
      features: features + prAnalysis.features,
      fixes: fixes + prAnalysis.fixes,
      breaking: breaking + prAnalysis.breaking,
      total: commits.length
    };

    // Determine release type
    let suggestedType: 'patch' | 'minor' | 'major';
    let confidence: number;
    let reasoning: string;

    if (totalAnalysis.breaking > 0) {
      suggestedType = 'major';
      confidence = 0.95;
      reasoning = `Breaking changes detected (${totalAnalysis.breaking}). Major version bump required.`;
    } else if (totalAnalysis.features > 0) {
      suggestedType = 'minor';
      confidence = 0.85;
      reasoning = `New features detected (${totalAnalysis.features}). Minor version bump recommended.`;
    } else if (totalAnalysis.fixes > 0) {
      suggestedType = 'patch';
      confidence = 0.90;
      reasoning = `Only bug fixes detected (${totalAnalysis.fixes}). Patch version bump appropriate.`;
    } else {
      suggestedType = 'patch';
      confidence = 0.70;
      reasoning = 'No significant changes detected. Patch version bump suggested.';
    }

    // Adjust confidence based on commit volume
    if (totalAnalysis.total < 3) {
      confidence -= 0.1;
      reasoning += ' Low confidence due to limited commit history.';
    } else if (totalAnalysis.total > 50) {
      confidence -= 0.05;
      reasoning += ' Slightly reduced confidence due to high commit volume.';
    }

    return {
      type: suggestedType,
      confidence: Math.max(confidence, 0.5),
      reasoning,
      commit_analysis: totalAnalysis
    };

  } catch (error) {
    console.error('❌ Failed to suggest release type:', error.message);
    throw error;
  }
}

/**
 * AI-powered impact analysis for releases and changes
 */
export async function analyzeImpact(changes: string[], repoOwner: string = 'brendadeeznuts1111', repoName: string = 'alchmenyrun'): Promise<ImpactAnalysis> {
  console.log('🤖 Analyzing impact of proposed changes...');

  try {
    const content = changes.join(' ').toLowerCase();
    
    let impact: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let confidence = 0.80;
    let affectedAreas: string[] = [];
    let riskScore = 0;
    let reasoning = '';

    // Analyze affected areas
    if (content.includes('auth') || content.includes('security') || content.includes('permission')) {
      affectedAreas.push('Security');
      riskScore += 30;
    }
    if (content.includes('database') || content.includes('migration') || content.includes('data')) {
      affectedAreas.push('Data Layer');
      riskScore += 25;
    }
    if (content.includes('api') || content.includes('endpoint') || content.includes('service')) {
      affectedAreas.push('API Layer');
      riskScore += 20;
    }
    if (content.includes('ui') || content.includes('frontend') || content.includes('ux')) {
      affectedAreas.push('User Interface');
      riskScore += 15;
    }
    if (content.includes('performance') || content.includes('cache') || content.includes('optimization')) {
      affectedAreas.push('Performance');
      riskScore += 20;
    }

    // Determine impact level based on risk score
    if (riskScore >= 60) {
      impact = 'critical';
      confidence = 0.95;
      reasoning = 'Critical impact - affects core system components and security.';
    } else if (riskScore >= 40) {
      impact = 'high';
      confidence = 0.90;
      reasoning = 'High impact - affects major system components.';
    } else if (riskScore >= 20) {
      impact = 'medium';
      confidence = 0.85;
      reasoning = 'Medium impact - affects significant system areas.';
    } else {
      impact = 'low';
      confidence = 0.80;
      reasoning = 'Low impact - minor changes with limited system effects.';
    }

    // Adjust for deployment scope
    if (content.includes('production') || content.includes('prod')) {
      riskScore += 10;
      reasoning += ' Production deployment increases risk.';
    }

    return {
      impact,
      confidence,
      affected_areas: affectedAreas,
      risk_score: Math.min(riskScore, 100),
      reasoning
    };

  } catch (error) {
    console.error('❌ Failed to analyze impact:', error.message);
    throw error;
  }
}

// Helper functions
async function getLinkedPullRequests(commits: any[], owner: string, repo: string): Promise<any[]> {
  const prNumbers = new Set<string>();
  
  commits.forEach(commit => {
    const match = commit.commit.message.match(/#\d+/);
    if (match) {
      prNumbers.add(match[0].substring(1));
    }
  });

  const prs = [];
  for (const prNumber of prNumbers) {
    try {
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: parseInt(prNumber)
      });
      prs.push(pr);
    } catch (e) {
      // PR might not exist or be inaccessible
    }
  }

  return prs;
}

async function analyzePullRequests(prs: any[]): Promise<{ features: number; fixes: number; breaking: number }> {
  let features = 0;
  let fixes = 0;
  let breaking = 0;

  prs.forEach(pr => {
    const labels = pr.labels.map((l: any) => l.name.toLowerCase());
    
    if (labels.includes('feature') || labels.includes('enhancement')) {
      features++;
    }
    if (labels.includes('bug') || labels.includes('fix')) {
      fixes++;
    }
    if (labels.includes('breaking') || labels.includes('major')) {
      breaking++;
    }
  });

  return { features, fixes, breaking };
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'labels':
        const issueId = args[2];
        if (!issueId) {
          console.error('Usage: tgk ai labels <issue-id>');
          process.exit(1);
        }
        const labels = await suggestLabels(issueId);
        console.log('\n🏷️ **AI Label Suggestion:**');
        console.log(`Labels: ${labels.labels.join(', ')}`);
        console.log(`Confidence: ${(labels.confidence * 100).toFixed(1)}%`);
        console.log(`Reasoning: ${labels.reasoning}`);
        break;

      case 'release-type':
        const releaseType = await suggestReleaseType();
        console.log('\n🚀 **AI Release Type Suggestion:**');
        console.log(`Type: ${releaseType.type}`);
        console.log(`Confidence: ${(releaseType.confidence * 100).toFixed(1)}%`);
        console.log(`Reasoning: ${releaseType.reasoning}`);
        console.log(`Analysis: ${releaseType.commit_analysis.features} features, ${releaseType.commit_analysis.fixes} fixes, ${releaseType.commit_analysis.breaking} breaking changes`);
        break;

      case 'impact':
        const changes = args.slice(2);
        if (changes.length === 0) {
          console.error('Usage: tgk ai impact <change1> <change2> ...');
          process.exit(1);
        }
        const impact = await analyzeImpact(changes);
        console.log('\n💥 **AI Impact Analysis:**');
        console.log(`Impact: ${impact.impact}`);
        console.log(`Confidence: ${(impact.confidence * 100).toFixed(1)}%`);
        console.log(`Risk Score: ${impact.risk_score}/100`);
        console.log(`Affected Areas: ${impact.affected_areas.join(', ') || 'None'}`);
        console.log(`Reasoning: ${impact.reasoning}`);
        break;

      default:
        console.log('Available AI commands:');
        console.log('  tgk ai labels <issue-id>        - Suggest labels for an issue');
        console.log('  tgk ai release-type              - Suggest release type based on commits');
        console.log('  tgk ai impact <changes>           - Analyze impact of changes');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ AI command failed:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
