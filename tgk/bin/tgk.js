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
const githubCmd = program
  .command('github')
  .description('GitHub integration commands');

githubCmd
  .command('pr <action> [pr-number]')
  .description('GitHub pull request management')
  .option('--method <method>', 'Merge method (merge, squash, rebase)', 'squash')
  .option('--body <body>', 'PR body/description')
  .option('--head <head>', 'Head branch')
  .option('--base <base>', 'Base branch', 'main')
  .option('--draft', 'Create as draft PR')
  .option('--label <label>', 'Add label to PR')
  .option('--topic <topic>', 'PR topic for categorization')
  .option('--message <message>', 'Review message')
  .option('--detailed', 'Show comprehensive PR analysis')
  .action(async (action, prNumber, options) => {
    try {
      const { createPullRequest, managePullRequest, getGitHubPRStatus } = await import('../commands/github.ts');

      if (action === 'create') {
        const title = prNumber; // For create, prNumber is actually the title
        await createPullRequest(title, options);
      } else if (action === 'status') {
        await getGitHubPRStatus(prNumber, options);
      } else if (action === 'review') {
        const { reviewGitHubPR } = await import('../commands/github.ts');
        await reviewGitHubPR(prNumber, options);
      } else {
        await managePullRequest(prNumber, action, options);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

githubCmd
  .command('repo <action> [repo-name]')
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

githubCmd
  .command('labels <action> [repo-name]')
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

githubCmd
  .command('workflow <action>')
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

githubCmd
  .command('security')
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

githubCmd
  .command('deps <action>')
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

githubCmd
  .command('metadata <action>')
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

githubCmd
  .command('issue create <repo-name>')
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

// Orchestrate commands
const orchestrateCmd = program
  .command('orchestrate')
  .description('Orchestration commands for automated workflows');

orchestrateCmd
  .command('auto-triage <issue-id>')
  .description('Proactively triggers tgk issue triage on new issues, posts initial report to relevant Telegram stream')
  .action(async (issueId) => {
    try {
      const { autoTriage } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await autoTriage(issueId);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('release-candidate <pr-id>')
  .description('Triggers full release candidate pipeline (staging deploy, E2E tests, auto-promotion if green)')
  .action(async (prId) => {
    try {
      const { releaseCandidate } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await releaseCandidate(prId);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('revert <component> <version>')
  .description('Policy-gated rollback of component (Worker, DB, config) to previous version')
  .option('--stage <stage>', 'Target stage (production, staging)', 'production')
  .action(async (component, version, options) => {
    try {
      const { revertComponent } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await revertComponent(component, version, options);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('audit-compliance <scope>')
  .description('Initiates a compliance audit, cross-referencing OPA policies vs. current state')
  .action(async (scope) => {
    try {
      const { auditCompliance } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await auditCompliance(scope);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('email-reply <message-id> <to-email>')
  .description('Send AI-drafted email reply from Telegram')
  .option('--subject <subject>', 'Email subject')
  .option('--body <body>', 'Email body')
  .option('--intent <intent>', 'Reply intent (acknowledge, investigating, resolved, escalate)', 'acknowledge')
  .option('--tone <tone>', 'Email tone (professional, casual, urgent)', 'professional')
  .action(async (messageId, toEmail, options) => {
    try {
      const { sendEmailReply } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await sendEmailReply(messageId, toEmail, options.subject || 'Re: Previous Message', options.body || 'Thank you for your message. We are looking into it.', {
        intent: options.intent,
        tone: options.tone
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('route-diagnostics <email>')
  .description('Diagnose email routing configuration and issues')
  .action(async (email) => {
    try {
      const { diagnoseRoute } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await diagnoseRoute(email);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('pr-telegram <pr-id>')
  .description('Send PR to Telegram for review and handle callbacks')
  .option('--chat-id <chatId>', 'Specific Telegram chat ID (uses default if not provided)')
  .option('--auto-approve', 'Auto-approve PR if checks pass')
  .option('--require-review', 'Require review before merge (default: true)')
  .action(async (prId, options) => {
    try {
      const { orchestratePRForTelegram } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await orchestratePRForTelegram(prId, {
        chatId: options.chatId,
        autoApprove: options.autoApprove,
        requireReview: options.requireReview !== false
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('pr-callback <callback-data>')
  .description('Handle Telegram PR callback (approve, request-changes, comment, merge)')
  .action(async (callbackData) => {
    try {
      const { handlePRTelegramCallback } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await handlePRTelegramCallback(callbackData);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

orchestrateCmd
  .command('pr-answer <pr-id> <question>')
  .description('Answer PR question via AI and post as comment')
  .action(async (prId, question) => {
    try {
      const { answerPRViaTelegram } = await import(path.resolve(__dirname, '../commands/orchestrate.ts'));
      await answerPRViaTelegram(prId, question);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// AI commands
const aiCmd = program
  .command('ai')
  .description('AI-powered analysis and suggestions');

aiCmd
  .command('labels <issue-id>')
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

aiCmd
  .command('release-type')
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

aiCmd
  .command('impact <changes...>')
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

aiCmd
  .command('analyze-email <subject> <body>')
  .description('AI-powered email content analysis for intelligent routing')
  .option('--state-id <stateId>', 'Optional state ID for context')
  .action(async (subject, body, options) => {
    try {
      const { analyzeEmailContent } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const analysis = await analyzeEmailContent(subject, body, options.stateId);
      console.log('\n🧠 **AI Email Content Analysis:**');
      console.log(`Sentiment: ${analysis.sentiment} (Score: ${analysis.score.toFixed(2)})`);
      console.log(`Urgency: ${analysis.urgency}`);
      console.log(`Summary: ${analysis.summary}`);
      console.log(`Keywords: ${analysis.keywords.join(', ') || 'None'}`);
      console.log(`Action Items: ${analysis.action_items.length} found`);
      console.log(`PII Risk: ${analysis.potential_pii ? '⚠️  Detected' : '✅ None'}`);
      console.log(`Phishing Risk: ${(analysis.phishing_risk * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${analysis.reasoning}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

aiCmd
  .command('suggest-routing <domain> <scope> <type> <hierarchy> <meta>')
  .description('AI-powered email routing suggestion')
  .option('--state-id <stateId>', 'Optional state ID for context')
  .option('--email-from <emailFrom>', 'Original sender email')
  .action(async (domain, scope, type, hierarchy, meta, options) => {
    try {
      const { suggestEmailRouting, analyzeEmailContent } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      
      // Perform basic content analysis for routing context
      const aiAnalysis = await analyzeEmailContent(
        `Test email for ${domain}.${scope}.${type}`,
        `This is a test email to validate routing for ${domain}.${scope}.${type}.${hierarchy}.${meta}`,
        options.stateId
      );
      
      const routing = await suggestEmailRouting(
        domain, scope, type, hierarchy, meta, options.stateId, aiAnalysis, options.emailFrom
      );
      
      console.log('\n🎯 **AI Email Routing Suggestion:**');
      console.log(`Chat ID: ${routing.chat_id || '❌ No route found'}`);
      console.log(`Confidence: ${(routing.routing_confidence * 100).toFixed(1)}%`);
      if (routing.suggested_priority_override) {
        console.log(`Priority Override: ${routing.suggested_priority_override}`);
      }
      if (routing.fallback_reason) {
        console.log(`Fallback Reason: ${routing.fallback_reason}`);
      }
      console.log(`Reasoning: ${routing.reasoning}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

aiCmd
  .command('draft-email <subject> <body> <from-email>')
  .description('AI-powered email reply drafting')
  .option('--intent <intent>', 'Reply intent (acknowledge, investigating, resolved, escalate)', 'acknowledge')
  .option('--tone <tone>', 'Email tone (professional, casual, urgent)', 'professional')
  .action(async (subject, body, fromEmail, options) => {
    try {
      const { draftEmailReply } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const draft = await draftEmailReply(subject, body, fromEmail, options.intent, options.tone);
      console.log('\n✍️ **AI Email Draft:**');
      console.log(`Subject: ${draft.subject}`);
      console.log(`Confidence: ${(draft.confidence * 100).toFixed(1)}%`);
      console.log('\nBody:');
      console.log('---');
      console.log(draft.body);
      console.log('---');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

aiCmd
  .command('predict-risk <component> <change>')
  .description('AI-powered risk assessment for changes')
  .action(async (component, change) => {
    try {
      const { predictRisk } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      await predictRisk(component, change);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

aiCmd
  .command('suggest-strategy <context>')
  .description('AI-powered strategy suggestions')
  .action(async (context) => {
    try {
      const { suggestStrategy } = await import(path.resolve(__dirname, '../commands/ai.ts'));
      const suggestion = await suggestStrategy(context, []);
      console.log('\n🎯 **Strategy Suggestion:**');
      console.log(`Strategy: ${suggestion.strategy}`);
      console.log(`Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${suggestion.reasoning}`);
      console.log(`Alternatives: ${suggestion.alternatives.join(', ')}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('pr-telegram <action>')
  .description('Telegram-based PR management')
  .action(async (action) => {
    try {
      const { sendPRToTelegram, handlePRCallback, answerPRQuestion } = await import(path.resolve(__dirname, '../commands/pr-telegram.ts'));
      
      const args = process.argv.slice(3);
      
      switch (action) {
        case 'send':
          const prId = args[1];
          const chatId = args[2];
          if (!prId) {
            console.log('Usage: tgk pr-telegram send <pr-id> [chat-id]');
            process.exit(1);
          }
          await sendPRToTelegram(prId, chatId);
          break;

        case 'answer':
          const answerPrId = args[1];
          const question = args.slice(2).join(' ');
          if (!answerPrId || !question) {
            console.log('Usage: tgk pr-telegram answer <pr-id> "<question>"');
            process.exit(1);
          }
          await answerPRQuestion(answerPrId, question);
          break;

        case 'callback':
          const callbackData = args[1];
          if (!callbackData) {
            console.log('Usage: tgk pr-telegram callback <callback-data>');
            process.exit(1);
          }
          await handlePRCallback(callbackData);
          break;

        default:
          console.log('Available commands:');
          console.log('  tgk pr-telegram send <pr-id> [chat-id]     - Send PR to Telegram for review');
          console.log('  tgk pr-telegram answer <pr-id> "<question>" - Answer PR question via AI');
          console.log('  tgk pr-telegram callback <data>           - Handle Telegram callback');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Insights commands
const insightsCmd = program
  .command('insights')
  .description('AI-driven analytics and intelligence');

insightsCmd
  .command('trends [timeframe]')
  .description('Analyze system trends and patterns')
  .action(async (timeframe) => {
    try {
      const { analyzeTrends } = await import(path.resolve(__dirname, '../commands/insights.ts'));
      await analyzeTrends(timeframe);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

insightsCmd
  .command('predict <metric> [days]')
  .description('Predict future metrics')
  .action(async (metric, days) => {
    try {
      const { predictMetrics } = await import(path.resolve(__dirname, '../commands/insights.ts'));
      await predictMetrics(metric, days ? parseInt(days) : 30);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

insightsCmd
  .command('anomalies [timeframe]')
  .description('Detect system anomalies')
  .action(async (timeframe) => {
    try {
      const { detectAnomalies } = await import(path.resolve(__dirname, '../commands/insights.ts'));
      await detectAnomalies(timeframe);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

insightsCmd
  .command('generate [focus]')
  .description('Generate AI insights')
  .action(async (focus) => {
    try {
      const { generateInsights } = await import(path.resolve(__dirname, '../commands/insights.ts'));
      await generateInsights(focus);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Workflow commands
const workflowCmd = program
  .command('workflow')
  .description('Advanced orchestration engine');

workflowCmd
  .command('create <template>')
  .description('Create workflow from template')
  .action(async (template) => {
    try {
      const { createWorkflow } = await import(path.resolve(__dirname, '../commands/workflow.ts'));
      await createWorkflow(template);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

workflowCmd
  .command('run <id>')
  .description('Execute workflow')
  .action(async (id) => {
    try {
      const { runWorkflow } = await import(path.resolve(__dirname, '../commands/workflow.ts'));
      await runWorkflow(id);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

workflowCmd
  .command('status <id>')
  .description('Check workflow status')
  .action(async (id) => {
    try {
      const { getWorkflowStatus } = await import(path.resolve(__dirname, '../commands/workflow.ts'));
      await getWorkflowStatus(id);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

workflowCmd
  .command('list')
  .description('List all workflows')
  .action(async () => {
    try {
      const { listWorkflows } = await import(path.resolve(__dirname, '../commands/workflow.ts'));
      await listWorkflows();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

workflowCmd
  .command('cancel <id>')
  .description('Cancel running workflow')
  .action(async (id) => {
    try {
      const { cancelWorkflow } = await import(path.resolve(__dirname, '../commands/workflow.ts'));
      await cancelWorkflow(id);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Diagnostics commands
const diagnosticsCmd = program
  .command('diagnostics')
  .description('System health monitoring and troubleshooting');

diagnosticsCmd
  .command('health')
  .description('System health check')
  .action(async () => {
    try {
      const { checkSystemHealth } = await import(path.resolve(__dirname, '../commands/diagnostics.ts'));
      await checkSystemHealth();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

diagnosticsCmd
  .command('logs [timeframe]')
  .description('Log analysis')
  .action(async (timeframe) => {
    try {
      const { analyzeLogs } = await import(path.resolve(__dirname, '../commands/diagnostics.ts'));
      await analyzeLogs(timeframe);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

diagnosticsCmd
  .command('metrics')
  .description('System metrics collection')
  .action(async () => {
    try {
      const { collectMetrics } = await import(path.resolve(__dirname, '../commands/diagnostics.ts'));
      await collectMetrics();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

diagnosticsCmd
  .command('troubleshoot <issue>')
  .description('Issue troubleshooting')
  .action(async (issue) => {
    try {
      const { troubleshootIssue } = await import(path.resolve(__dirname, '../commands/diagnostics.ts'));
      await troubleshootIssue(issue);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

diagnosticsCmd
  .command('benchmark <type> [duration]')
  .description('Performance benchmark')
  .action(async (type, duration) => {
    try {
      const { runBenchmark } = await import(path.resolve(__dirname, '../commands/diagnostics.ts'));
      await runBenchmark(type, duration ? parseInt(duration) : 60);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Email commands
const emailCmd = program
  .command('email')
  .description('Outbound email replies and management');

emailCmd
  .command('reply <email> <stateId>')
  .description('Draft AI-powered email reply')
  .action(async (email, stateId) => {
    try {
      const { draftEmailReply } = await import(path.resolve(__dirname, '../commands/email.ts'));
      await draftEmailReply(email, stateId);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

emailCmd
  .command('send <email> <stateId> [message]')
  .description('Send drafted email reply')
  .action(async (email, stateId, message) => {
    try {
      const { sendEmailReply } = await import(path.resolve(__dirname, '../commands/email.ts'));
      const result = await sendEmailReply(email, stateId, {
        customMessage: message,
        skipApproval: process.env.TGK_SKIP_APPROVAL === 'true'
      });
      if (!result.success) {
        console.error('❌ Failed to send email:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

emailCmd
  .command('status <email> <stateId>')
  .description('Check email reply status')
  .action(async (email, stateId) => {
    try {
      const { getEmailReplyStatus } = await import(path.resolve(__dirname, '../commands/email.ts'));
      await getEmailReplyStatus(email, stateId);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

emailCmd
  .command('list')
  .description('List all email replies')
  .action(async () => {
    try {
      const { listEmailReplies } = await import(path.resolve(__dirname, '../commands/email.ts'));
      await listEmailReplies();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

emailCmd
  .command('simulate [email] [subject] [stateId]')
  .description('Simulate email for testing')
  .action(async (email, subject, stateId) => {
    try {
      const { simulateEmailForReply } = await import(path.resolve(__dirname, '../commands/email.ts'));
      await simulateEmailForReply({
        from: email || 'test@example.com',
        to: 'support@cloudflare.com',
        subject: subject || 'Test email for reply',
        body: 'This is a simulated test email that needs a reply.',
        stateId: stateId || 'test123',
        telegramChatId: '@test-chat'
      });
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
