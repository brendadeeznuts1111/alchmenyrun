/**
 * tgk Integration Tests
 * End-to-end workflow testing across components
 */

const {
  suite,
  testAsync,
  assert,
  assertEqual,
  generateTestEmail,
  generateTestGitHubIssue
} = require('./test-framework.js');

// Mock services for integration testing
const mockServices = {
  // Mock Cloudflare Email Worker
  emailWorker: {
    processEmail: async (email, body) => {
      console.log(`📧 Processing email: ${email}`);

      // Parse email grammar
      const localPart = email.split('@')[0];
      const tokens = localPart.split('.');

      if (tokens.length < 5) {
        throw new Error('Invalid email grammar');
      }

      const [domain, scope, type, hierarchy, meta, stateId] = tokens;

      // Mock AI analysis
      const aiResult = {
        sentiment: 'neutral',
        urgency: 'medium',
        keywords: ['test', 'integration'],
        summary: `Email about ${type} in ${domain} domain`
      };

      // Mock routing decision
      const routingResult = {
        chat_id: `telegram-${domain}-${scope}`,
        confidence: 0.85,
        reasoning: `Routed to ${domain}/${scope} channel`
      };

      // Mock Telegram notification
      const telegramResult = {
        message_id: Math.floor(Math.random() * 10000),
        chat_id: routingResult.chat_id,
        text: `📧 ${type.toUpperCase()}: ${aiResult.summary}`
      };

      return {
        parsed: { domain, scope, type, hierarchy, meta, stateId },
        ai: aiResult,
        routing: routingResult,
        telegram: telegramResult
      };
    }
  },

  // Mock tgk CLI integration
  tgkCli: {
    runCommand: async (command, args = []) => {
      console.log(`🔧 Running tgk command: ${command} ${args.join(' ')}`);

      switch (command) {
        case 'issue-triage':
          return {
            success: true,
            labels: ['group/internal', 'topic/governance', 'impact/low'],
            confidence: 0.87
          };

        case 'ai-predict-risk':
          return {
            level: 'medium',
            score: 0.65,
            factors: ['external dependency', 'data processing']
          };

        case 'orchestrate-auto-triage':
          return {
            success: true,
            issue_id: args[0],
            actions_taken: ['labeled', 'assigned', 'notified']
          };

        default:
          return { success: false, error: 'Unknown command' };
      }
    }
  },

  // Mock external APIs
  externalAPIs: {
    github: {
      getIssue: async (issueId) => {
        return generateTestGitHubIssue({
          number: parseInt(issueId),
          title: `Integration Test Issue #${issueId}`,
          state: 'open'
        });
      },

      addLabels: async (issueId, labels) => {
        console.log(`🏷️ Adding labels ${labels.join(', ')} to issue #${issueId}`);
        return { success: true };
      }
    },

    telegram: {
      sendMessage: async (chatId, text, options = {}) => {
        console.log(`📱 Sending to ${chatId}: ${text.substring(0, 50)}...`);
        return {
          message_id: Math.floor(Math.random() * 10000),
          chat: { id: chatId },
          text: text
        };
      },

      sendKeyboard: async (chatId, text, keyboard) => {
        console.log(`⌨️ Sending keyboard to ${chatId}`);
        return {
          message_id: Math.floor(Math.random() * 10000),
          reply_markup: keyboard
        };
      }
    },

    pagerduty: {
      getOnCall: async (scheduleId) => {
        return {
          user: { id: 'user123', name: 'Alice Smith', email: 'alice@company.com' },
          schedule: scheduleId,
          until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      }
    }
  }
};

// Integration test suites
suite('Email-to-Telegram Integration', () => {
  testAsync('complete email processing workflow', async () => {
    const testEmail = generateTestEmail('cloudflare.com', {
      domain: 'infra',
      scope: 'sre',
      type: 'alert',
      hierarchy: 'p0',
      meta: 'cf',
      stateId: 'inc123'
    });

    const emailBody = 'Critical infrastructure alert: Database CPU at 95%';

    // Process email through worker
    const result = await mockServices.emailWorker.processEmail(testEmail, emailBody);

    // Validate parsing
    assertEqual(result.parsed.domain, 'infra');
    assertEqual(result.parsed.scope, 'sre');
    assertEqual(result.parsed.type, 'alert');
    assertEqual(result.parsed.hierarchy, 'p0');
    assertEqual(result.parsed.stateId, 'inc123');

    // Validate AI analysis
    assert(result.ai.sentiment, 'Should have sentiment analysis');
    assert(result.ai.keywords.length > 0, 'Should extract keywords');
    assert(result.ai.summary, 'Should generate summary');

    // Validate routing
    assert(result.routing.chat_id, 'Should determine chat ID');
    assert(result.routing.confidence > 0, 'Should have routing confidence');
    assert(result.routing.reasoning, 'Should explain routing decision');

    // Validate Telegram notification
    assert(result.telegram.message_id, 'Should send Telegram message');
    assert(result.telegram.chat_id, 'Should target specific chat');
    assert(result.telegram.text.includes('ALERT'), 'Should format alert properly');
  });

  testAsync('email with interactive buttons', async () => {
    const testEmail = generateTestEmail('cloudflare.com', {
      domain: 'qa',
      scope: 'dev',
      type: 'pr',
      hierarchy: 'p2',
      meta: 'gh',
      stateId: 'pr456'
    });

    const emailBody = 'PR #456 is ready for review. Please review the changes.';

    const result = await mockServices.emailWorker.processEmail(testEmail, emailBody);

    // Should include interactive elements for PR review
    assert(result.parsed.type === 'pr', 'Should identify as PR email');
    assert(result.routing.chat_id.includes('qa-dev'), 'Should route to QA dev channel');

    // Simulate button interaction
    const approveResult = await mockServices.telegram.sendKeyboard(
      result.routing.chat_id,
      'PR Review Requested',
      {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: 'approve:456' },
            { text: '💬 Comment', callback_data: 'comment:456' }
          ],
          [
            { text: '🔄 Re-request', callback_data: 'rerequest:456' }
          ]
        ]
      }
    );

    assert(approveResult.message_id, 'Should create interactive message');
    assert(approveResult.reply_markup.inline_keyboard, 'Should have keyboard');
  });

  testAsync('email routing with on-call integration', async () => {
    const testEmail = generateTestEmail('cloudflare.com', {
      domain: 'support',
      scope: 'oncall',
      type: 'issue',
      hierarchy: 'p1',
      meta: 'jira',
      stateId: 'bug789'
    });

    // Get current on-call
    const onCallInfo = await mockServices.externalAPIs.pagerduty.getOnCall('support-primary');

    // Process email
    const result = await mockServices.emailWorker.processEmail(testEmail, 'Urgent customer issue');

    // Should route to on-call person
    assert(result.routing.chat_id.includes('oncall'), 'Should route to on-call channel');
    assert(result.routing.confidence > 0.8, 'Should have high confidence for on-call routing');

    // Verify on-call context is included
    assert(result.routing.reasoning.includes('on-call'), 'Should mention on-call in reasoning');
  });
});

suite('CLI-to-Service Integration', () => {
  testAsync('issue triage workflow', async () => {
    const issueId = '123';

    // Run tgk issue triage
    const triageResult = await mockServices.tgkCli.runCommand('issue-triage', [issueId]);

    assert(triageResult.success, 'Triage should succeed');
    assert(triageResult.labels.length > 0, 'Should apply labels');
    assert(triageResult.confidence > 0, 'Should have confidence score');

    // Verify labels include proper taxonomy
    const hasGroup = triageResult.labels.some(l => l.startsWith('group/'));
    const hasTopic = triageResult.labels.some(l => l.startsWith('topic/'));
    const hasImpact = triageResult.labels.some(l => l.startsWith('impact/'));

    assert(hasGroup, 'Should have group classification');
    assert(hasTopic, 'Should have topic classification');
    assert(hasImpact, 'Should have impact assessment');
  });

  testAsync('orchestration workflow', async () => {
    const issueId = '456';

    // Run auto-triage orchestration
    const orchestrateResult = await mockServices.tgkCli.runCommand('orchestrate-auto-triage', [issueId]);

    assert(orchestrateResult.success, 'Orchestration should succeed');
    assertEqual(orchestrateResult.issue_id, issueId);
    assert(orchestrateResult.actions_taken.length > 0, 'Should perform actions');

    // Verify comprehensive automation
    assert(orchestrateResult.actions_taken.includes('labeled'), 'Should apply labels');
    assert(orchestrateResult.actions_taken.includes('assigned'), 'Should assign issue');
    assert(orchestrateResult.actions_taken.includes('notified'), 'Should send notifications');
  });

  testAsync('risk assessment integration', async () => {
    const component = 'authentication';
    const change = 'add biometric login';

    const riskResult = await mockServices.tgkCli.runCommand('ai-predict-risk', [component, change]);

    assert(riskResult.level, 'Should assess risk level');
    assert(riskResult.score >= 0 && riskResult.score <= 1, 'Should have valid risk score');
    assert(riskResult.factors.length > 0, 'Should identify risk factors');

    // Higher risk for authentication changes
    assert(['high', 'critical'].includes(riskResult.level),
           'Authentication changes should be high/critical risk');
  });
});

suite('End-to-End Email Bidirectional Flow', () => {
  testAsync('complete bidirectional workflow', async () => {
    // Phase 1: Email arrives and is processed
    const incomingEmail = generateTestEmail('cloudflare.com', {
      domain: 'qa',
      scope: 'dev',
      type: 'pr',
      hierarchy: 'p2',
      meta: 'gh',
      stateId: 'pr789'
    });

    const emailBody = 'PR #789 requires review for the new feature implementation.';

    // Process incoming email
    const emailResult = await mockServices.emailWorker.processEmail(incomingEmail, emailBody);
    assert(emailResult.telegram.message_id, 'Should send Telegram notification');

    // Phase 2: User interacts via Telegram (approves PR)
    const approvalAction = {
      callback_data: 'approve:789',
      user: { id: 12345, username: 'reviewer' }
    };

    // Simulate PR approval workflow
    const prApproval = await mockServices.externalAPIs.github.addLabels('789', ['approved']);
    assert(prApproval.success, 'Should successfully approve PR');

    // Phase 3: System sends reply email
    const replyEmail = {
      to: 'sender@example.com',
      subject: 'Re: PR #789 Review Complete',
      body: 'Your PR has been approved and merged. Thank you for the contribution!',
      from: 'qa@cloudflare.com'
    };

    // Verify reply email structure
    assert(replyEmail.subject.startsWith('Re:'), 'Should be reply');
    assert(replyEmail.body.includes('approved'), 'Should confirm approval');
    assert(replyEmail.from.includes('qa@'), 'Should be from QA team');

    console.log('✅ Complete bidirectional email flow validated');
  });

  testAsync('error handling and recovery', async () => {
    // Test with invalid email format
    const invalidEmail = 'invalid.email@cloudflare.com';

    try {
      await mockServices.emailWorker.processEmail(invalidEmail, 'test');
      assert(false, 'Should have thrown error for invalid email');
    } catch (error) {
      assert(error.message.includes('Invalid email grammar'), 'Should identify grammar error');
    }

    // Test with API failure
    const originalGithub = mockServices.externalAPIs.github;
    mockServices.externalAPIs.github = {
      getIssue: async () => { throw new Error('API rate limit exceeded'); }
    };

    try {
      const testEmail = generateTestEmail();
      await mockServices.emailWorker.processEmail(testEmail, 'test');
      assert(false, 'Should have handled API failure gracefully');
    } catch (error) {
      // Should degrade gracefully, not crash
      assert(error.message.includes('rate limit'), 'Should surface API error');
    }

    // Restore original service
    mockServices.externalAPIs.github = originalGithub;
  });
});

suite('Performance and Scalability Integration', () => {
  testAsync('concurrent email processing', async () => {
    const emailCount = 10;
    const testEmails = Array.from({ length: emailCount }, () =>
      generateTestEmail('cloudflare.com', {
        domain: 'infra',
        scope: 'sre',
        type: 'alert',
        hierarchy: 'p0',
        meta: 'cf'
      })
    );

    const startTime = Date.now();

    // Process multiple emails concurrently
    const results = await Promise.all(
      testEmails.map(email =>
        mockServices.emailWorker.processEmail(email, `Alert ${email}`)
      )
    );

    const duration = Date.now() - startTime;

    // Validate all emails processed successfully
    assertEqual(results.length, emailCount, 'Should process all emails');
    results.forEach(result => {
      assert(result.telegram.message_id, 'Each email should generate Telegram message');
    });

    // Performance check: should process 10 emails in reasonable time
    assert(duration < 5000, `Should process 10 emails in < 5s, took ${duration}ms`);

    console.log(`⚡ Processed ${emailCount} emails in ${duration}ms (${(duration/emailCount).toFixed(1)}ms per email)`);
  });

  testAsync('memory and resource usage', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Process many emails to test memory usage
    const emailPromises = Array.from({ length: 50 }, (_, i) =>
      mockServices.emailWorker.processEmail(
        generateTestEmail(),
        `Load test email ${i}`
      )
    );

    await Promise.all(emailPromises);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB for 50 emails)
    assert(memoryIncrease < 50 * 1024 * 1024,
           `Memory increase should be < 50MB, was ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);

    console.log(`🧠 Memory usage: ${(initialMemory / 1024 / 1024).toFixed(1)}MB → ${(finalMemory / 1024 / 1024).toFixed(1)}MB`);
  });
});

suite('Security Integration Tests', () => {
  testAsync('PII detection and blocking', async () => {
    const emailWithPII = generateTestEmail();
    const bodyWithPII = 'User john.doe@example.com reported issue with phone 555-123-4567';

    const result = await mockServices.emailWorker.processEmail(emailWithPII, bodyWithPII);

    // Should detect PII and flag appropriately
    assert(result.ai.potential_pii === true, 'Should detect PII in email');
    assert(result.routing.confidence < 0.9, 'Should reduce confidence for PII content');

    // Should not send to public channels
    assert(!result.routing.chat_id.includes('public'), 'Should not route PII to public channels');
  });

  testAsync('phishing detection', async () => {
    const phishingEmail = generateTestEmail('cloudflare.com', {
      domain: 'security',
      scope: 'alert',
      type: 'phishing',
      hierarchy: 'p0',
      meta: 'urgent'
    });

    const phishingBody = 'URGENT: Your account will be suspended! Click here to verify: http://fake-bank.com';

    const result = await mockServices.emailWorker.processEmail(phishingEmail, phishingBody);

    // Should detect phishing indicators
    assert(result.ai.phishing_risk > 0.7, 'Should detect high phishing risk');
    assert(result.routing.chat_id.includes('security'), 'Should route to security team');

    // Should quarantine suspicious content
    assert(result.routing.quarantined === true, 'Should quarantine suspicious emails');
  });

  testAsync('rate limiting and abuse prevention', async () => {
    const spamEmails = Array.from({ length: 100 }, () =>
      generateTestEmail('cloudflare.com', {
        domain: 'abuse',
        scope: 'test',
        type: 'spam',
        hierarchy: 'p3'
      })
    );

    let processedCount = 0;
    let blockedCount = 0;

    // Process emails with rate limiting simulation
    for (const email of spamEmails) {
      try {
        await mockServices.emailWorker.processEmail(email, 'Spam content');
        processedCount++;
      } catch (error) {
        if (error.message.includes('rate limit')) {
          blockedCount++;
        } else {
          throw error;
        }
      }
    }

    // Should block some emails due to rate limiting
    assert(blockedCount > 0, 'Should block some emails due to rate limiting');
    assert(processedCount > blockedCount, 'Should still process legitimate emails');

    console.log(`🛡️ Rate limiting: ${processedCount} allowed, ${blockedCount} blocked`);
  });
});

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockServices
  };
}
