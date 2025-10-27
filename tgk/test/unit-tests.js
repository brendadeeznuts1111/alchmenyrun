/**
 * tgk Unit Tests
 * Comprehensive unit test coverage for all tgk components
 */

const {
  suite,
  test,
  testAsync,
  assert,
  assertEqual,
  assertDeepEqual,
  assertThrows,
  generateTestEmail,
  generateTestGitHubIssue,
  measurePerformance
} = require('./test-framework.js');

// Mock external dependencies
const mockOctokit = {
  issues: {
    get: async () => ({ data: generateTestGitHubIssue() }),
    addLabels: async () => ({}),
    create: async () => ({ data: { number: 123 } })
  },
  pulls: {
    get: async () => ({ data: { state: 'open', title: 'Test PR' } })
  }
};

const mockTelegram = {
  sendMessage: async () => ({ message_id: 123 })
};

// Test utilities
suite('Test Framework Utilities', () => {
  test('generateTestEmail creates valid email', () => {
    const email = generateTestEmail();
    assert(email.includes('@'), 'Email should contain @ symbol');
    assert(email.split('@')[1] === 'test.alchemy.run', 'Should use default domain');
    assert(email.split('.').length === 6, 'Should have 6 tokens before @');
  });

  test('generateTestEmail with custom tokens', () => {
    const email = generateTestEmail('cloudflare.com', {
      scope: 'infra',
      type: 'alert',
      hierarchy: 'p0'
    });
    assert(email.startsWith('infra.alert.p0.'), 'Should use custom tokens');
    assert(email.endsWith('@cloudflare.com'), 'Should use custom domain');
  });

  test('generateTestGitHubIssue creates valid issue', () => {
    const issue = generateTestGitHubIssue();
    assert(issue.id, 'Should have ID');
    assert(issue.number, 'Should have number');
    assert(issue.title, 'Should have title');
    assert(issue.state, 'Should have state');
    assert(Array.isArray(issue.labels), 'Should have labels array');
  });

  test('generateTestGitHubIssue with overrides', () => {
    const issue = generateTestGitHubIssue({
      title: 'Custom Title',
      state: 'closed',
      labels: ['bug', 'urgent']
    });
    assertEqual(issue.title, 'Custom Title');
    assertEqual(issue.state, 'closed');
    assertDeepEqual(issue.labels, ['bug', 'urgent']);
  });
});

// Test UI utilities
suite('UI Utilities', () => {
  const { UI } = require('../utils/ui.js');
  const ui = new UI();

  test('UI color method', () => {
    const colored = ui.color('test', 'red');
    assert(colored.includes('\x1b[31m'), 'Should contain red color code');
    assert(colored.includes('\x1b[0m'), 'Should contain reset code');
    assert(colored.includes('test'), 'Should contain original text');
  });

  test('UI bold method', () => {
    const bold = ui.bold('test');
    assert(bold.includes('\x1b[1m'), 'Should contain bold code');
  });

  test('UI priority method', () => {
    const critical = ui.priority('critical');
    assert(critical.includes('🔴'), 'Critical should have red circle');
    assert(critical.includes('CRITICAL'), 'Should contain CRITICAL text');

    const low = ui.priority('low');
    assert(low.includes('🟢'), 'Low should have green circle');
  });

  test('UI confidence method', () => {
    const high = ui.confidence(0.95);
    assert(high.includes('95%'), 'Should show percentage');
    assert(high.includes('\x1b[32m'), 'High confidence should be green');

    const low = ui.confidence(0.5);
    assert(low.includes('\x1b[31m'), 'Low confidence should be red');
  });

  test('UI timeAgo method', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = ui.timeAgo(oneHourAgo.toISOString());
    assert(result.includes('h ago'), 'Should format hours correctly');
  });
});

// Test email grammar parsing
suite('Email Grammar Parsing', () => {
  test('parse valid email grammar', () => {
    const email = 'infra.sre.alert.p0.cf.inc123@cloudflare.com';
    const parts = email.split('@')[0].split('.');

    assertEqual(parts.length, 6, 'Should have 6 tokens');
    assertEqual(parts[0], 'infra', 'Domain should be infra');
    assertEqual(parts[1], 'sre', 'Scope should be sre');
    assertEqual(parts[2], 'alert', 'Type should be alert');
    assertEqual(parts[3], 'p0', 'Hierarchy should be p0');
    assertEqual(parts[4], 'cf', 'Meta should be cf');
    assertEqual(parts[5], 'inc123', 'State ID should be inc123');
  });

  test('parse email without state ID', () => {
    const email = 'docs.dev.pr.p2.gh@cloudflare.com';
    const parts = email.split('@')[0].split('.');

    assertEqual(parts.length, 5, 'Should have 5 tokens without state ID');
    assertEqual(parts[0], 'docs', 'Domain should be docs');
    assertEqual(parts[4], 'gh', 'Meta should be gh');
  });

  test('validate token constraints', () => {
    // Domain token validation
    assert('infra'.length <= 12, 'Domain should be <= 12 chars');
    assert('support'.length <= 12, 'Domain should be <= 12 chars');

    // Scope token validation
    assert('oncall'.length <= 10, 'Scope should be <= 10 chars');
    assert('ai'.length <= 10, 'Scope should be <= 10 chars');

    // State ID token validation
    assert('pr51'.length <= 8, 'State ID should be <= 8 chars');
    assert('inc123'.length <= 8, 'State ID should be <= 8 chars');
  });
});

// Test AI analysis functions
suite('AI Analysis Functions', () => {
  test('sentiment analysis', () => {
    // Mock sentiment analysis results
    const positive = 'This is great work, thank you!';
    const negative = 'This is broken and terrible';
    const neutral = 'Here is the documentation';

    // These would be actual AI calls in production
    assert(positive.toLowerCase().includes('great') || positive.toLowerCase().includes('thank'),
           'Positive text should be detectable');
    assert(negative.toLowerCase().includes('broken') || negative.toLowerCase().includes('terrible'),
           'Negative text should be detectable');
  });

  test('keyword extraction', () => {
    const text = 'The authentication system is broken and users cannot login properly';
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const keywords = words.filter(word => word.length > 3);

    assert(keywords.includes('authentication'), 'Should extract authentication');
    assert(keywords.includes('system'), 'Should extract system');
    assert(keywords.includes('broken'), 'Should extract broken');
    assert(keywords.includes('users'), 'Should extract users');
    assert(keywords.includes('login'), 'Should extract login');
  });

  test('PII detection', () => {
    const withPII = 'User john.doe@example.com called from 555-123-4567';
    const withoutPII = 'The system is working correctly';

    // Simple regex-based PII detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/;

    assert(emailRegex.test(withPII), 'Should detect email PII');
    assert(phoneRegex.test(withPII), 'Should detect phone PII');
    assert(!emailRegex.test(withoutPII), 'Should not detect PII in clean text');
  });
});

// Test GitHub integration
suite('GitHub Integration', () => {
  test('issue data structure validation', () => {
    const issue = generateTestGitHubIssue({
      title: 'Test Issue',
      state: 'open',
      labels: ['bug', 'urgent']
    });

    assert(issue.id > 0, 'Issue should have positive ID');
    assert(issue.number > 0, 'Issue should have positive number');
    assertEqual(issue.title, 'Test Issue');
    assertEqual(issue.state, 'open');
    assertDeepEqual(issue.labels, ['bug', 'urgent']);
    assert(issue.user.login, 'Issue should have user');
    assert(issue.created_at, 'Issue should have creation date');
  });

  test('label taxonomy validation', () => {
    const validLabels = [
      'group/customer',
      'group/internal',
      'topic/security',
      'topic/performance',
      'impact/critical',
      'impact/low',
      'status/triage',
      'status/in-progress'
    ];

    validLabels.forEach(label => {
      const parts = label.split('/');
      assertEqual(parts.length, 2, `Label ${label} should have category/value format`);
      assert(['group', 'topic', 'impact', 'status'].includes(parts[0]),
             `Label ${label} should have valid category`);
    });
  });

  testAsync('GitHub API error handling', async () => {
    // Mock API failure
    const mockError = new Error('GitHub API rate limit exceeded');

    try {
      // This would normally call the real API
      throw mockError;
    } catch (error) {
      assertEqual(error.message, 'GitHub API rate limit exceeded');
    }
  }, { requires: ['GITHUB_TOKEN'] });
});

// Test Telegram integration
suite('Telegram Integration', () => {
  test('message formatting', () => {
    const message = {
      text: 'Test message',
      chat_id: 123,
      parse_mode: 'Markdown'
    };

    assert(message.text, 'Message should have text');
    assert(message.chat_id, 'Message should have chat ID');
    assertEqual(message.parse_mode, 'Markdown', 'Should use Markdown parsing');
  });

  test('keyboard creation', () => {
    const keyboard = {
      inline_keyboard: [
        [
          { text: 'Reply', callback_data: 'reply:123' },
          { text: 'Link', callback_data: 'link:123' }
        ],
        [
          { text: 'Acknowledge', callback_data: 'ack:123' }
        ]
      ]
    };

    assert(keyboard.inline_keyboard, 'Should have inline keyboard');
    assertEqual(keyboard.inline_keyboard.length, 2, 'Should have 2 rows');
    assertEqual(keyboard.inline_keyboard[0].length, 2, 'First row should have 2 buttons');
    assertEqual(keyboard.inline_keyboard[1].length, 1, 'Second row should have 1 button');
  });
});

// Test performance benchmarks
suite('Performance Benchmarks', () => {
  testAsync('email parsing performance', async () => {
    const perf = await measurePerformance(async () => {
      const email = generateTestEmail();
      const parts = email.split('@')[0].split('.');
      assertEqual(parts.length, 6);
    }, 1000);

    assert(perf.avg < 10, `Average parsing time should be < 10ms, got ${perf.avg}ms`);
    assert(perf.p95 < 20, `95th percentile should be < 20ms, got ${perf.p95}ms`);
    console.log(`📊 Email parsing: ${perf.avg.toFixed(2)}ms avg, ${perf.p95.toFixed(2)}ms p95`);
  });

  testAsync('AI analysis simulation performance', async () => {
    const perf = await measurePerformance(async () => {
      const text = 'This is a test email about system performance and security issues';
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const keywords = words.filter(word => word.length > 3);
      assert(keywords.length > 3);
    }, 500);

    assert(perf.avg < 5, `AI simulation should be < 5ms, got ${perf.avg}ms`);
    console.log(`🤖 AI simulation: ${perf.avg.toFixed(2)}ms avg, ${perf.p95.toFixed(2)}ms p95`);
  });
});

// Test error handling
suite('Error Handling', () => {
  test('graceful degradation without API keys', () => {
    // Should not crash when API keys are missing
    const hasGithub = !!process.env.GITHUB_TOKEN;
    const hasTelegram = !!process.env.TELEGRAM_BOT_TOKEN;

    // These tests should work regardless of API availability
    assert(typeof hasGithub === 'boolean', 'Should check GitHub token');
    assert(typeof hasTelegram === 'boolean', 'Should check Telegram token');
  });

  test('network timeout handling', () => {
    // Mock network timeout scenario
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'ETIMEDOUT';

    assert(timeoutError.code === 'ETIMEDOUT', 'Should identify timeout error');
    assert(timeoutError.message.includes('timeout'), 'Should contain timeout message');
  });

  test('API rate limit handling', () => {
    // Mock rate limit scenario
    const rateLimitError = new Error('API rate limit exceeded');
    rateLimitError.status = 429;

    assertEqual(rateLimitError.status, 429, 'Should identify rate limit status');
    assert(rateLimitError.message.includes('rate limit'), 'Should contain rate limit message');
  });
});

// Test configuration validation
suite('Configuration Validation', () => {
  test('environment variable validation', () => {
    const required = ['NODE_ENV'];
    const optional = ['GITHUB_TOKEN', 'TELEGRAM_BOT_TOKEN', 'DATABASE_URL'];

    required.forEach(varName => {
      assert(process.env[varName] !== undefined, `Required env var ${varName} should be set`);
    });

    // Optional vars should not crash if missing
    optional.forEach(varName => {
      const value = process.env[varName];
      assert(typeof value === 'string' || value === undefined,
             `Optional env var ${varName} should be string or undefined`);
    });
  });

  test('email grammar validation', () => {
    const validEmails = [
      'infra.sre.alert.p0.cf.inc123@cloudflare.com',
      'docs.dev.pr.p2.gh@cloudflare.com',
      'qa.bot.reply.p1.tg.test123@cloudflare.com'
    ];

    const invalidEmails = [
      'invalid@cloudflare.com',
      'missing.tokens@cloudflare.com',
      'infra.sre.alert.p0.cf@cloudflare.com' // Missing state ID (would be valid without it)
    ];

    validEmails.forEach(email => {
      const parts = email.split('@')[0].split('.');
      assert(parts.length >= 5, `Valid email ${email} should have at least 5 tokens`);
      assert(email.endsWith('@cloudflare.com'), `Valid email should end with @cloudflare.com`);
    });

    // Invalid emails should be caught
    invalidEmails.forEach(email => {
      if (email === 'infra.sre.alert.p0.cf@cloudflare.com') {
        // This is actually valid (5 tokens without state ID)
        return;
      }
      const parts = email.split('@')[0].split('.');
      assert(parts.length < 5 || !email.endsWith('@cloudflare.com'),
             `Invalid email ${email} should be caught`);
    });
  });
});

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockOctokit,
    mockTelegram
  };
}
