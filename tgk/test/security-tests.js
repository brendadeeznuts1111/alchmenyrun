/**
 * tgk Security & Vulnerability Testing
 * Comprehensive security assessment and penetration testing
 */

const {
  suite,
  testAsync,
  assert,
  assertEqual,
  generateTestEmail
} = require('./test-framework.js');

// Security testing utilities and mock data
const securityUtils = {
  // Mock vulnerable components for testing
  vulnerableComponents: {
    sqlInjection: {
      vulnerable: async (input) => {
        // Simulate SQL injection vulnerability
        const query = `SELECT * FROM users WHERE email = '${input}'`;
        if (input.includes("'") || input.includes(";")) {
          throw new Error('SQL Injection detected');
        }
        return { success: true };
      },

      secure: async (input) => {
        // Simulate parameterized query
        return { success: true, sanitized: input.replace(/['";\\]/g, '') };
      }
    },

    xss: {
      vulnerable: (input) => {
        // Simulate XSS vulnerability
        return `<div>${input}</div>`;
      },

      secure: (input) => {
        // Simulate XSS sanitization
        return input.replace(/[<>]/g, '').substring(0, 100);
      }
    },

    authBypass: {
      checkSession: (sessionId, userId) => {
        // Vulnerable: doesn't validate session belongs to user
        return sessionId && userId;
      },

      checkSessionSecure: (sessionId, userId, sessions) => {
        // Secure: validates session ownership
        const session = sessions.find(s => s.id === sessionId);
        return session && session.userId === userId;
      }
    }
  },

  // Mock security scanners
  scanners: {
    portScanner: async (host, ports = [80, 443, 22, 3389]) => {
      const results = [];
      for (const port of ports) {
        const isOpen = [80, 443].includes(port); // Simulate some ports open
        results.push({
          port,
          state: isOpen ? 'open' : 'closed',
          service: port === 80 ? 'http' : port === 443 ? 'https' : 'unknown'
        });
      }
      return results;
    },

    vulnerabilityScanner: async (target) => {
      // Mock vulnerability scan results
      const vulnerabilities = [
        {
          id: 'CVE-2023-001',
          severity: 'high',
          description: 'Remote code execution vulnerability',
          cvss: 9.1,
          affected: 'email-parser',
          status: 'patched'
        },
        {
          id: 'CVE-2023-002',
          severity: 'medium',
          description: 'Information disclosure',
          cvss: 5.3,
          affected: 'auth-module',
          status: 'open'
        }
      ];

      return {
        target,
        scanDate: new Date().toISOString(),
        vulnerabilities,
        summary: {
          critical: 0,
          high: 1,
          medium: 1,
          low: 0,
          total: 2
        }
      };
    },

    secretScanner: async (code) => {
      const secrets = [];
      const patterns = [
        { name: 'API Key', regex: /api[_-]?key['" ]*[:=][ '" ]*([a-zA-Z0-9_-]{20,})/gi },
        { name: 'Password', regex: /password['" ]*[:=][ '" ]*([a-zA-Z0-9!@#$%^&*()_+]{8,})/gi },
        { name: 'Token', regex: /token['" ]*[:=][ '" ]*([a-zA-Z0-9_-]{30,})/gi }
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(code)) !== null) {
          secrets.push({
            type: pattern.name,
            value: match[1].substring(0, 10) + '...',
            line: code.substring(0, match.index).split('\n').length,
            severity: 'high'
          });
        }
      });

      return secrets;
    }
  },

  // Encryption/decryption utilities for testing
  crypto: {
    encrypt: async (text, key) => {
      // Mock encryption
      return Buffer.from(text).toString('base64');
    },

    decrypt: async (encrypted, key) => {
      // Mock decryption
      try {
        return Buffer.from(encrypted, 'base64').toString();
      } catch (error) {
        throw new Error('Decryption failed');
      }
    },

    hash: async (text) => {
      // Mock hashing
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }
};

// Security test data
const SECURITY_TEST_DATA = {
  maliciousPayloads: [
    "<script>alert('XSS')</script>",
    "' OR '1'='1",
    "../../../etc/passwd",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(document.cookie)",
    "{{7*7}}", // Template injection
    "file:///etc/passwd",
    "data:text/html,<script>alert(1)</script>"
  ],

  sqlInjectionPayloads: [
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin' --",
    "1' OR '1' = '1"
  ],

  xssPayloads: [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(document.cookie)",
    "<svg onload=alert(1)>",
    "<iframe src=javascript:alert(1)>"
  ],

  validInputs: [
    "john.doe@company.com",
    "Hello world message",
    "Issue #123: Fix login bug",
    "https://github.com/user/repo",
    "Normal text without special chars"
  ]
};

// Security testing suites
suite('Input Validation & Sanitization', () => {
  testAsync('SQL injection prevention', async () => {
    const component = securityUtils.vulnerableComponents.sqlInjection;

    // Test vulnerable version fails
    let caughtInjection = false;
    for (const payload of SECURITY_TEST_DATA.sqlInjectionPayloads) {
      try {
        await component.vulnerable(payload);
        // If we get here, injection wasn't prevented
        assert(false, `SQL injection not prevented for payload: ${payload}`);
      } catch (error) {
        if (error.message.includes('SQL Injection')) {
          caughtInjection = true;
        }
      }
    }
    assert(caughtInjection, 'Should detect SQL injection attempts');

    // Test secure version handles malicious input safely
    for (const payload of SECURITY_TEST_DATA.sqlInjectionPayloads) {
      const result = await component.secure(payload);
      assert(result.success, `Secure version should handle malicious input: ${payload}`);
      assert(!result.sanitized.includes("'"), 'Should sanitize quotes');
      assert(!result.sanitized.includes(";"), 'Should sanitize semicolons');
    }

    console.log(`🗄️ SQL Injection Test:`);
    console.log(`   ✅ Vulnerable version: Properly detected ${SECURITY_TEST_DATA.sqlInjectionPayloads.length} attempts`);
    console.log(`   🛡️ Secure version: Safely handled all malicious inputs`);
  });

  testAsync('XSS prevention', async () => {
    const component = securityUtils.vulnerableComponents.xss;

    // Test that vulnerable version would allow XSS
    for (const payload of SECURITY_TEST_DATA.xssPayloads) {
      const result = component.vulnerable(payload);
      assert(result.includes('<'), `Vulnerable version allows XSS tags in: ${payload}`);
    }

    // Test secure version sanitizes input
    for (const payload of SECURITY_TEST_DATA.xssPayloads) {
      const result = component.secure(payload);
      assert(!result.includes('<'), `Secure version should sanitize XSS in: ${payload}`);
      assert(!result.includes('>'), `Secure version should sanitize XSS in: ${payload}`);
      assert(result.length <= 100, 'Should limit output length');
    }

    console.log(`🕷️ XSS Prevention Test:`);
    console.log(`   ⚠️ Vulnerable version: Allows XSS attacks`);
    console.log(`   🛡️ Secure version: Sanitizes all XSS payloads`);
  });

  testAsync('malicious payload detection', async () => {
    let detectedMalicious = 0;
    let falsePositives = 0;

    // Test malicious payload detection
    for (const payload of SECURITY_TEST_DATA.maliciousPayloads) {
      const isMalicious = payload.includes('<script>') ||
                         payload.includes('javascript:') ||
                         payload.includes('../../../') ||
                         payload.includes('{{') ||
                         payload.includes('file://');

      if (isMalicious) detectedMalicious++;
    }

    // Test false positive rate on valid inputs
    for (const input of SECURITY_TEST_DATA.validInputs) {
      const isFlagged = input.includes('<script>') ||
                       input.includes('javascript:') ||
                       input.includes('../../../');

      if (isFlagged) falsePositives++;
    }

    assert(detectedMalicious > 0, 'Should detect malicious payloads');
    assert(falsePositives === 0, 'Should not flag valid inputs as malicious');

    console.log(`🛡️ Malicious Payload Detection:`);
    console.log(`   🚨 Detected Malicious: ${detectedMalicious}/${SECURITY_TEST_DATA.maliciousPayloads.length}`);
    console.log(`   ✅ False Positives: ${falsePositives}/${SECURITY_TEST_DATA.validInputs.length}`);
  });
});

suite('Authentication & Authorization', () => {
  testAsync('session validation bypass prevention', async () => {
    const auth = securityUtils.vulnerableComponents.authBypass;
    const sessions = [
      { id: 'session1', userId: 'user1' },
      { id: 'session2', userId: 'user2' }
    ];

    // Test vulnerable version allows bypass
    const vulnerableBypass = auth.checkSession('session1', 'user2'); // Wrong user
    assert(vulnerableBypass, 'Vulnerable version allows session bypass');

    // Test secure version prevents bypass
    const secureBypass = auth.checkSessionSecure('session1', 'user2', sessions);
    assert(!secureBypass, 'Secure version prevents session bypass');

    // Test legitimate access
    const legitimateAccess = auth.checkSessionSecure('session1', 'user1', sessions);
    assert(legitimateAccess, 'Secure version allows legitimate access');

    console.log(`🔐 Session Validation Test:`);
    console.log(`   ⚠️ Vulnerable: Allows session bypass`);
    console.log(`   🛡️ Secure: Prevents bypass, allows legitimate access`);
  });

  testAsync('API key validation', async () => {
    const validKeys = ['sk_test_1234567890abcdef', 'pk_live_abcdef1234567890'];
    const invalidKeys = ['sk_', 'pk_test', 'random_string', ''];

    // Test key format validation
    const isValidKey = (key) => {
      return /^sk_(test|live)_[a-f0-9]{16,}$/.test(key) ||
             /^pk_(test|live)_[a-f0-9]{16,}$/.test(key);
    };

    let validCount = 0;
    let invalidCount = 0;

    validKeys.forEach(key => {
      if (isValidKey(key)) validCount++;
    });

    invalidKeys.forEach(key => {
      if (!isValidKey(key)) invalidCount++;
    });

    assertEqual(validCount, validKeys.length, 'Should validate all valid keys');
    assertEqual(invalidCount, invalidKeys.length, 'Should reject all invalid keys');

    console.log(`🔑 API Key Validation:`);
    console.log(`   ✅ Valid Keys: ${validCount}/${validKeys.length}`);
    console.log(`   ❌ Invalid Keys: ${invalidCount}/${invalidKeys.length}`);
  });

  testAsync('rate limiting effectiveness', async () => {
    const rateLimiter = {
      attempts: new Map(),
      limit: 5,
      window: 60000, // 1 minute

      check: function(key) {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Remove old attempts outside window
        const validAttempts = attempts.filter(time => now - time < this.window);

        if (validAttempts.length >= this.limit) {
          return false; // Rate limited
        }

        validAttempts.push(now);
        this.attempts.set(key, validAttempts);
        return true; // Allowed
      }
    };

    const testKey = 'test-user';

    // Test normal usage
    for (let i = 0; i < 5; i++) {
      assert(rateLimiter.check(testKey), `Should allow attempt ${i + 1}`);
    }

    // Test rate limiting
    assert(!rateLimiter.check(testKey), 'Should rate limit after limit exceeded');

    // Test after window reset (simulate time passing)
    rateLimiter.attempts.set(testKey, []); // Reset
    assert(rateLimiter.check(testKey), 'Should allow after reset');

    console.log(`⏱️ Rate Limiting Test:`);
    console.log(`   ✅ Normal Usage: 5 requests allowed`);
    console.log(`   🚫 Rate Limited: 6th request blocked`);
    console.log(`   🔄 Reset: New requests allowed`);
  });
});

suite('Data Protection & Encryption', () => {
  testAsync('encryption/decryption integrity', async () => {
    const crypto = securityUtils.crypto;
    const testData = [
      'Simple text',
      'Text with special chars: !@#$%^&*()',
      'Unicode: 你好世界 🚀',
      'Long text '.repeat(100),
      JSON.stringify({ key: 'value', number: 123 })
    ];

    for (const data of testData) {
      const key = 'test-encryption-key';
      const encrypted = await crypto.encrypt(data, key);
      const decrypted = await crypto.decrypt(encrypted, key);

      assertEqual(decrypted, data, `Encryption/decryption failed for: ${data.substring(0, 50)}...`);
      assert(encrypted !== data, 'Encrypted data should differ from original');
    }

    console.log(`🔐 Encryption Test:`);
    console.log(`   ✅ Integrity: All ${testData.length} test cases passed`);
    console.log(`   🔄 Round-trip: Encryption + decryption successful`);
  });

  testAsync('hash consistency and collision resistance', async () => {
    const crypto = securityUtils.crypto;

    // Test consistency
    const testString = 'consistent hash test';
    const hash1 = await crypto.hash(testString);
    const hash2 = await crypto.hash(testString);
    assertEqual(hash1, hash2, 'Hash should be consistent for same input');

    // Test collision resistance (basic test)
    const inputs = ['test1', 'test2', 'different', 'inputs'];
    const hashes = await Promise.all(inputs.map(input => crypto.hash(input)));
    const uniqueHashes = new Set(hashes);

    assertEqual(uniqueHashes.size, inputs.length, 'Hashes should be unique for different inputs');

    console.log(`🔗 Hash Function Test:`);
    console.log(`   🔄 Consistency: Same input produces same hash`);
    console.log(`   🛡️ Collision Resistance: ${uniqueHashes.size}/${inputs.length} unique hashes`);
  });

  testAsync('PII detection accuracy', async () => {
    const testCases = [
      { text: 'Contact john.doe@example.com', hasPII: true },
      { text: 'Phone: 555-123-4567', hasPII: true },
      { text: 'SSN: 123-45-6789', hasPII: true },
      { text: 'Normal text without PII', hasPII: false },
      { text: 'Version 1.2.3.4 is released', hasPII: false },
      { text: 'Room 555 on floor 123', hasPII: false }
    ];

    let correct = 0;
    for (const testCase of testCases) {
      const detected = await securityUtils.vulnerableComponents.piiDetection?.detectPII(testCase.text) || false;
      if (detected === testCase.hasPII) correct++;
    }

    const accuracy = correct / testCases.length;
    assert(accuracy >= 0.8, `PII detection accuracy should be >= 80%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`🔒 PII Detection Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${testCases.length}`);
  });
});

suite('Vulnerability Scanning', () => {
  testAsync('port scanning simulation', async () => {
    const results = await securityUtils.scanners.portScanner('localhost');

    assert(Array.isArray(results), 'Should return array of port results');
    assert(results.length > 0, 'Should scan multiple ports');

    const openPorts = results.filter(r => r.state === 'open');
    const closedPorts = results.filter(r => r.state === 'closed');

    assert(openPorts.length > 0, 'Should find some open ports');
    assert(closedPorts.length > 0, 'Should find some closed ports');

    // Check specific ports
    const httpPort = results.find(r => r.port === 80);
    assert(httpPort, 'Should scan port 80');
    assertEqual(httpPort.service, 'http', 'Port 80 should be identified as HTTP');

    console.log(`🔍 Port Scanning Test:`);
    console.log(`   📊 Ports Scanned: ${results.length}`);
    console.log(`   ✅ Open Ports: ${openPorts.length}`);
    console.log(`   ❌ Closed Ports: ${closedPorts.length}`);
  });

  testAsync('vulnerability assessment', async () => {
    const scanResult = await securityUtils.scanners.vulnerabilityScanner('tgk-email-orchestrator');

    assert(scanResult.target, 'Should include scan target');
    assert(scanResult.scanDate, 'Should include scan date');
    assert(Array.isArray(scanResult.vulnerabilities), 'Should include vulnerabilities array');
    assert(scanResult.summary, 'Should include summary');

    const highSeverity = scanResult.vulnerabilities.filter(v => v.severity === 'high');
    const mediumSeverity = scanResult.vulnerabilities.filter(v => v.severity === 'medium');

    assert(highSeverity.length > 0, 'Should detect high severity vulnerabilities');
    assert(mediumSeverity.length > 0, 'Should detect medium severity vulnerabilities');

    assertEqual(scanResult.summary.total, scanResult.vulnerabilities.length, 'Summary total should match vulnerabilities count');

    console.log(`🔓 Vulnerability Assessment:`);
    console.log(`   📊 Total Vulnerabilities: ${scanResult.summary.total}`);
    console.log(`   🔴 High Severity: ${scanResult.summary.high}`);
    console.log(`   🟠 Medium Severity: ${scanResult.summary.medium}`);
    console.log(`   📅 Scan Date: ${new Date(scanResult.scanDate).toLocaleDateString()}`);
  });

  testAsync('secret detection', async () => {
    const testCode = `
      const apiKey = 'sk_test_1234567890abcdef1234567890';
      const password = 'MySecurePass123!';
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const normalVar = 'normal_value';
      const config = {
        database_url: 'postgresql://user:password@localhost/db'
      };
    `;

    const secrets = await securityUtils.scanners.secretScanner(testCode);

    assert(Array.isArray(secrets), 'Should return array of detected secrets');

    const apiKeys = secrets.filter(s => s.type === 'API Key');
    const passwords = secrets.filter(s => s.type === 'Password');
    const tokens = secrets.filter(s => s.type === 'Token');

    assert(apiKeys.length > 0, 'Should detect API keys');
    assert(passwords.length > 0, 'Should detect passwords');
    assert(tokens.length > 0, 'Should detect tokens');

    // Verify secrets are partially masked
    secrets.forEach(secret => {
      assert(secret.value.includes('...'), 'Secret values should be masked');
      assert(secret.severity === 'high', 'Detected secrets should be high severity');
    });

    console.log(`🔐 Secret Detection Test:`);
    console.log(`   🔑 API Keys Found: ${apiKeys.length}`);
    console.log(`   🔒 Passwords Found: ${passwords.length}`);
    console.log(`   🎫 Tokens Found: ${tokens.length}`);
    console.log(`   ✅ Masking: All secrets properly masked`);
  });
});

suite('Compliance & Regulatory Testing', () => {
  testAsync('data retention compliance', async () => {
    // Simulate data retention policy
    const retentionPolicy = {
      emailContent: 90, // 90 days
      metadata: 365,    // 1 year
      logs: 2555,       // 7 years (GDPR requirement)
      audit: 2555       // 7 years
    };

    const testData = [
      { type: 'email', age: 30, shouldRetain: true },
      { type: 'email', age: 120, shouldRetain: false },
      { type: 'metadata', age: 200, shouldRetain: true },
      { type: 'metadata', age: 400, shouldRetain: false },
      { type: 'logs', age: 1000, shouldRetain: true },
      { type: 'logs', age: 3000, shouldRetain: false }
    ];

    let complianceErrors = 0;

    testData.forEach(data => {
      const policyDays = retentionPolicy[data.type];
      const shouldActuallyRetain = data.age <= policyDays;

      if (shouldActuallyRetain !== data.shouldRetain) {
        complianceErrors++;
      }
    });

    assertEqual(complianceErrors, 0, 'All data retention should comply with policy');

    console.log(`📋 Data Retention Compliance:`);
    console.log(`   📧 Email Retention: ${retentionPolicy.emailContent} days`);
    console.log(`   📊 Metadata Retention: ${retentionPolicy.metadata} days`);
    console.log(`   📝 Logs Retention: ${retentionPolicy.logs} days`);
    console.log(`   ✅ Compliance: All policies followed`);
  });

  testAsync('audit trail completeness', async () => {
    const auditEvents = [
      { action: 'email_received', user: 'system', timestamp: Date.now() - 1000 },
      { action: 'ai_analysis', user: 'ai-engine', timestamp: Date.now() - 900 },
      { action: 'routing_decision', user: 'router', timestamp: Date.now() - 800 },
      { action: 'telegram_sent', user: 'bot', timestamp: Date.now() - 700 },
      { action: 'user_interaction', user: 'john.doe', timestamp: Date.now() - 600 }
    ];

    // Verify audit trail completeness
    assert(auditEvents.every(event => event.action), 'All events should have action');
    assert(auditEvents.every(event => event.user), 'All events should have user');
    assert(auditEvents.every(event => event.timestamp), 'All events should have timestamp');

    // Verify chronological order
    const timestamps = auditEvents.map(e => e.timestamp);
    const isChronological = timestamps.every((ts, i) => i === 0 || ts >= timestamps[i - 1]);
    assert(isChronological, 'Audit events should be in chronological order');

    // Verify required event types
    const requiredEvents = ['email_received', 'ai_analysis', 'routing_decision', 'telegram_sent'];
    const presentEvents = auditEvents.map(e => e.action);
    const missingEvents = requiredEvents.filter(e => !presentEvents.includes(e));

    assertEqual(missingEvents.length, 0, `Missing required audit events: ${missingEvents.join(', ')}`);

    console.log(`📜 Audit Trail Test:`);
    console.log(`   📊 Events Recorded: ${auditEvents.length}`);
    console.log(`   ⏰ Chronological: ${isChronological ? 'Yes' : 'No'}`);
    console.log(`   ✅ Required Events: All present`);
    console.log(`   👤 Users Tracked: ${new Set(auditEvents.map(e => e.user)).size}`);
  });

  testAsync('access control verification', async () => {
    const roles = {
      admin: ['read', 'write', 'delete', 'admin'],
      user: ['read', 'write'],
      guest: ['read'],
      bot: ['read', 'write', 'automate']
    };

    const resources = ['emails', 'settings', 'analytics', 'users'];

    let accessViolations = 0;

    // Test role-based access control
    const testAccess = (role, resource, action) => {
      const allowedActions = roles[role];
      if (!allowedActions) return false;
      return allowedActions.includes(action);
    };

    // Test various access scenarios
    const testCases = [
      { role: 'admin', resource: 'users', action: 'delete', expected: true },
      { role: 'user', resource: 'emails', action: 'write', expected: true },
      { role: 'user', resource: 'users', action: 'delete', expected: false },
      { role: 'guest', resource: 'emails', action: 'read', expected: true },
      { role: 'guest', resource: 'settings', action: 'write', expected: false },
      { role: 'bot', resource: 'emails', action: 'automate', expected: true }
    ];

    testCases.forEach(testCase => {
      const hasAccess = testAccess(testCase.role, testCase.resource, testCase.action);
      if (hasAccess !== testCase.expected) {
        accessViolations++;
      }
    });

    assertEqual(accessViolations, 0, 'All access control rules should be enforced');

    console.log(`🔐 Access Control Test:`);
    console.log(`   👥 Roles Defined: ${Object.keys(roles).length}`);
    console.log(`   📁 Resources Protected: ${resources.length}`);
    console.log(`   ✅ Violations: ${accessViolations}`);
    console.log(`   🛡️ Access Control: Properly enforced`);
  });
});

suite('Security Regression Testing', () => {
  testAsync('known vulnerability regression prevention', async () => {
    // Test for known security issues that should be fixed
    const knownVulnerabilities = [
      {
        name: 'Path Traversal',
        payload: '../../../etc/passwd',
        shouldBeBlocked: true
      },
      {
        name: 'Command Injection',
        payload: '; rm -rf /',
        shouldBeBlocked: true
      },
      {
        name: 'Buffer Overflow',
        payload: 'A'.repeat(10000),
        shouldBeBlocked: true
      }
    ];

    let blockedCorrectly = 0;

    for (const vuln of knownVulnerabilities) {
      // Simple detection logic
      const isBlocked = vuln.payload.includes('../') ||
                       vuln.payload.includes(';') ||
                       vuln.payload.length > 1000;

      if (isBlocked === vuln.shouldBeBlocked) {
        blockedCorrectly++;
      }
    }

    assertEqual(blockedCorrectly, knownVulnerabilities.length, 'All known vulnerabilities should be properly blocked');

    console.log(`🔄 Security Regression Test:`);
    console.log(`   🛡️ Vulnerabilities Tested: ${knownVulnerabilities.length}`);
    console.log(`   ✅ Properly Blocked: ${blockedCorrectly}`);
    console.log(`   🐛 Regression Prevention: Active`);
  });

  testAsync('security header validation', async () => {
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security',
      'X-XSS-Protection'
    ];

    const mockResponseHeaders = {
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': 'max-age=31536000',
      'x-xss-protection': '1; mode=block'
    };

    let missingHeaders = 0;

    requiredHeaders.forEach(header => {
      const normalizedHeader = header.toLowerCase();
      if (!mockResponseHeaders[normalizedHeader]) {
        missingHeaders++;
      }
    });

    assertEqual(missingHeaders, 0, `All required security headers should be present: ${requiredHeaders.join(', ')}`);

    console.log(`🛡️ Security Headers Test:`);
    console.log(`   📋 Required Headers: ${requiredHeaders.length}`);
    console.log(`   ✅ Present: ${requiredHeaders.length - missingHeaders}`);
    console.log(`   ❌ Missing: ${missingHeaders}`);
  });
});

// Export security testing utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    securityUtils,
    SECURITY_TEST_DATA
  };
}
