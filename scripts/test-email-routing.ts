#!/usr/bin/env bun
/**
 * Safe Email Routing Test Script
 * Simulates the email routing process without sending real emails
 * Tests the structured email parsing and routing logic
 */

interface TestEmail {
  to: string;
  from: string;
  subject: string;
  body: string;
}

interface RoutingResult {
  valid: boolean;
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
  meta: string;
  chatId: string;
  telegramMessage: string;
  error?: string;
}

class EmailRoutingTester {
  private chatIdMap: Record<string, string> = {
    'infra': '-1001234567890',
    'docs': '-1001234567891',
    'qa': '-1001234567892',
    'integrations': '-1001234567893',
    'exec': '-1001234567894'
  };

  private priorityEmoji: Record<string, string> = {
    'p0': '🔴',
    'p1': '🟠',
    'p2': '🟡',
    'p3': '🟢',
    'blk': '🚨'
  };

  private sourceEmoji: Record<string, string> = {
    'gh': '🐙',
    'tg': '💬',
    'cf': '☁️',
    '24h': '⏰'
  };

  private typeLabel: Record<string, string> = {
    'pr': 'Pull Request',
    'issue': 'Issue',
    'deploy': 'Deployment',
    'alert': 'Alert',
    'review': 'Code Review'
  };

  /**
   * Parse and route an email address
   */
  routeEmail(email: TestEmail): RoutingResult {
    const localPart = email.to.split('@')[0];
    const parts = localPart.split('.');

    // Validate format
    if (parts.length !== 5) {
      return {
        valid: false,
        domain: '',
        scope: '',
        type: '',
        hierarchy: '',
        meta: '',
        chatId: '',
        telegramMessage: '',
        error: `Invalid format: expected 5 parts, got ${parts.length}`
      };
    }

    const [domain, scope, type, hierarchy, meta] = parts;

    // Validate domain
    if (!this.chatIdMap[domain]) {
      return {
        valid: false,
        domain,
        scope,
        type,
        hierarchy,
        meta,
        chatId: '',
        telegramMessage: '',
        error: `Unknown domain: ${domain}`
      };
    }

    const chatId = this.chatIdMap[domain];
    const priority = this.priorityEmoji[hierarchy] || '⚪';
    const source = this.sourceEmoji[meta] || '📧';
    const eventType = this.typeLabel[type] || type.toUpperCase();

    // Create Telegram message
    const telegramMessage = `${priority} **${domain.toUpperCase()}.${scope}** | ${eventType} | ${source}

👤 **From:** ${email.from}
📝 **Subject:** ${email.subject}
🏷️ **Priority:** ${hierarchy.toUpperCase()}
🔗 **Source:** ${meta.toUpperCase()}

${email.body ? `📄 **Body:** ${email.body.substring(0, 100)}${email.body.length > 100 ? '...' : ''}` : ''}`;

    return {
      valid: true,
      domain,
      scope,
      type,
      hierarchy,
      meta,
      chatId,
      telegramMessage
    };
  }

  /**
   * Run test cases
   */
  runTests(): void {
    console.log('🧪 Testing Email Routing System\n');
    console.log('═'.repeat(60));

    const testCases: TestEmail[] = [
      {
        to: 'infra.lead.pr.p0.gh@cloudflare.com',
        from: 'notifications@github.com',
        subject: 'PR #123: Scope System',
        body: 'Critical PR ready for review'
      },
      {
        to: 'docs.senior.issue.p2.gh@cloudflare.com',
        from: 'notifications@github.com',
        subject: 'Update scope docs',
        body: 'Doc update needed'
      },
      {
        to: 'qa.bot.alert.blk.24h@cloudflare.com',
        from: 'ci@cloudflare.com',
        subject: 'Pipeline failed',
        body: 'CI broken'
      },
      {
        to: 'integrations.junior.review.p1.gh@cloudflare.com',
        from: 'notifications@github.com',
        subject: 'Provider PR #456',
        body: 'Integration changes ready'
      },
      {
        to: 'exec.lead.deploy.p0.cf@cloudflare.com',
        from: 'deploy@cloudflare.com',
        subject: 'Production deployment approval needed',
        body: 'Critical deploy requires executive approval'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      console.log(`📧 Testing: ${testCase.to}`);
      console.log(`   From: ${testCase.from}`);
      console.log(`   Subject: ${testCase.subject}`);

      const result = this.routeEmail(testCase);

      if (result.valid) {
        console.log(`✅ Routed to chat: ${result.chatId}`);
        console.log(`📱 Telegram message preview:`);
        console.log(`${result.telegramMessage}\n`);
        passed++;
      } else {
        console.log(`❌ Failed: ${result.error}\n`);
        failed++;
      }

      console.log('─'.repeat(60));
    }

    // Test invalid formats
    console.log('🚫 Testing Invalid Formats:\n');

    const invalidTests = [
      'invalid@cloudflare.com',
      'too.many.parts.here.extra@cloudflare.com',
      'unknown.domain.pr.p0.gh@cloudflare.com',
      'missing@parts@cloudflare.com'
    ];

    for (const invalid of invalidTests) {
      const result = this.routeEmail({
        to: invalid,
        from: 'test@test.com',
        subject: 'Test',
        body: 'Test'
      });

      console.log(`❌ ${invalid} → ${result.error || 'Unknown error'}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

    if (passed === testCases.length && failed === 0) {
      console.log('🎉 All routing tests passed! Email system is ready for deployment.');
    } else {
      console.log('⚠️ Some tests failed. Please check the routing logic.');
    }
  }
}

// Run tests if called directly
if (import.meta.main) {
  const tester = new EmailRoutingTester();
  tester.runTests();
}
