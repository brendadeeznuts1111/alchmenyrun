/**
 * tgk Testing Framework
 * Comprehensive testing utilities for unit, integration, and E2E tests
 */

const { ui } = require('../utils/ui.js');

class TestFramework {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      errors: []
    };
    this.startTime = null;
    this.currentSuite = null;
    this.suites = [];
  }

  // Test suite management
  suite(name, fn) {
    this.currentSuite = { name, tests: [], startTime: Date.now() };
    this.suites.push(this.currentSuite);

    ui.header(`Test Suite: ${name}`, '🧪');

    try {
      fn();
    } catch (error) {
      ui.error(`Suite failed: ${error.message}`);
      this.results.errors.push({
        type: 'suite_error',
        suite: name,
        error: error.message,
        stack: error.stack
      });
    }

    this.currentSuite.duration = Date.now() - this.currentSuite.startTime;
    this.currentSuite = null;
  }

  // Individual test cases
  test(name, fn, options = {}) {
    const test = {
      name,
      suite: this.currentSuite?.name || 'global',
      fn,
      options,
      status: 'pending',
      duration: 0,
      error: null
    };

    if (this.currentSuite) {
      this.currentSuite.tests.push(test);
    } else {
      this.tests.push(test);
    }

    this.results.total++;
  }

  // Async test support
  async testAsync(name, fn, options = {}) {
    this.test(name, async () => {
      await fn();
    }, { ...options, async: true });
  }

  // Test execution
  async run(options = {}) {
    this.startTime = Date.now();

    ui.header('tgk Test Suite Execution', '🚀');
    ui.keyValue('Test Framework', 'v2.0', 'cyan', 'white');
    ui.keyValue('Timestamp', new Date().toISOString(), 'cyan', 'white');
    ui.keyValue('Environment', process.env.NODE_ENV || 'development', 'cyan', 'white');

    // Run all suites
    for (const suite of this.suites) {
      await this.runSuite(suite, options);
    }

    // Run global tests
    if (this.tests.length > 0) {
      const globalSuite = {
        name: 'Global Tests',
        tests: this.tests,
        startTime: Date.now()
      };
      await this.runSuite(globalSuite, options);
    }

    this.results.duration = Date.now() - this.startTime;
    this.printResults();
    return this.results;
  }

  async runSuite(suite, options) {
    ui.section(`Running ${suite.name}`, '📋');

    for (const test of suite.tests) {
      await this.runTest(test, options);
    }
  }

  async runTest(test, options) {
    const startTime = Date.now();

    try {
      // Skip test if conditions not met
      if (options.skip && options.skip.includes(test.name)) {
        test.status = 'skipped';
        this.results.skipped++;
        ui.warning(`⏭️  Skipped: ${test.name}`);
        return;
      }

      // Check prerequisites
      if (test.options.requires) {
        const missing = test.options.requires.filter(req => !this.checkPrerequisite(req));
        if (missing.length > 0) {
          test.status = 'skipped';
          this.results.skipped++;
          ui.warning(`⏭️  Skipped: ${test.name} (missing: ${missing.join(', ')})`);
          return;
        }
      }

      // Execute test
      if (test.options.timeout) {
        await this.runWithTimeout(test, test.options.timeout);
      } else {
        await test.fn();
      }

      test.status = 'passed';
      this.results.passed++;
      ui.success(`✅ Passed: ${test.name}`);

    } catch (error) {
      test.status = 'failed';
      test.error = error;
      this.results.failed++;
      this.results.errors.push({
        type: 'test_failure',
        suite: test.suite,
        test: test.name,
        error: error.message,
        stack: error.stack
      });

      ui.error(`❌ Failed: ${test.name}`);
      if (options.verbose) {
        ui.keyValue('Error', error.message, 'red', 'white');
        if (error.stack && options.verbose > 1) {
          console.log(error.stack);
        }
      }
    }

    test.duration = Date.now() - startTime;
  }

  async runWithTimeout(test, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      test.fn()
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  checkPrerequisite(req) {
    // Check for environment variables, services, etc.
    switch (req) {
      case 'GITHUB_TOKEN':
        return !!process.env.GITHUB_TOKEN;
      case 'TELEGRAM_BOT_TOKEN':
        return !!process.env.TELEGRAM_BOT_TOKEN;
      case 'DATABASE':
        return !!process.env.DATABASE_URL;
      case 'REDIS':
        return !!process.env.REDIS_URL;
      default:
        return true;
    }
  }

  printResults() {
    ui.header('Test Results Summary', '📊');

    ui.keyValue('Total Tests', this.results.total.toString(), 'cyan', 'white');
    ui.keyValue('Passed', this.results.passed.toString(), 'green', 'white');
    ui.keyValue('Failed', this.results.failed.toString(), 'red', 'white');
    ui.keyValue('Skipped', this.results.skipped.toString(), 'yellow', 'white');
    ui.keyValue('Duration', `${this.results.duration}ms`, 'cyan', 'white');

    const successRate = this.results.total > 0 ?
      ((this.results.passed / this.results.total) * 100).toFixed(1) : '0.0';
    ui.keyValue('Success Rate', `${successRate}%`, 'cyan',
      successRate >= 90 ? 'green' : successRate >= 75 ? 'yellow' : 'red');

    if (this.results.errors.length > 0) {
      ui.section('Error Details', '❌');
      this.results.errors.forEach((error, i) => {
        ui.keyValue(`Error ${i + 1}`, `${error.suite}::${error.test}`, 'red', 'white');
        ui.keyValue('Message', error.error, 'red', 'gray');
      });
    }

    // Suite breakdown
    if (this.suites.length > 0) {
      ui.section('Suite Breakdown', '📈');

      this.suites.forEach(suite => {
        const passed = suite.tests.filter(t => t.status === 'passed').length;
        const total = suite.tests.length;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

        ui.keyValue(
          suite.name,
          `${passed}/${total} (${rate}%) - ${suite.duration}ms`,
          'cyan',
          rate >= 90 ? 'green' : rate >= 75 ? 'yellow' : 'red'
        );
      });
    }

    ui.summaryBox('Final Status',
      this.results.failed === 0 ? [
        '🎉 All tests passed!',
        `✅ ${this.results.passed} tests successful`,
        `⏱️  Completed in ${this.results.duration}ms`,
        '🚀 Ready for deployment'
      ] : [
        '⚠️  Some tests failed',
        `❌ ${this.results.failed} tests failed`,
        `✅ ${this.results.passed} tests passed`,
        '🔍 Check error details above'
      ],
      this.results.failed === 0 ? '🎉' : '⚠️'
    );
  }

  // Utility methods for test assertions
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} Expected ${expected}, got ${actual}`);
    }
  }

  assertDeepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`${message} Expected ${expectedStr}, got ${actualStr}`);
    }
  }

  assertThrows(fn, errorType, message = '') {
    try {
      fn();
      throw new Error(`${message} Expected function to throw ${errorType}`);
    } catch (error) {
      if (!(error instanceof errorType)) {
        throw new Error(`${message} Expected ${errorType}, got ${error.constructor.name}`);
      }
    }
  }

  // Performance testing utilities
  async measurePerformance(fn, iterations = 100) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1e6); // Convert to milliseconds
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    return { avg, min, max, p95, iterations };
  }

  // Mock utilities
  mockFunction(originalFn, mockImpl) {
    const original = originalFn;
    originalFn.mock = mockImpl;
    originalFn.restore = () => {
      Object.assign(originalFn, original);
      delete originalFn.mock;
      delete originalFn.restore;
    };
    return originalFn;
  }

  // Test data generators
  generateTestEmail(domain = 'test.alchemy.run', tokens = {}) {
    const defaults = {
      scope: 'test',
      type: 'test',
      hierarchy: 'p1',
      meta: 'test',
      stateId: 'test123'
    };

    const finalTokens = { ...defaults, ...tokens };
    return `${finalTokens.scope}.${finalTokens.type}.${finalTokens.hierarchy}.${finalTokens.meta}.${finalTokens.stateId}@${domain}`;
  }

  generateTestGitHubIssue(overrides = {}) {
    return {
      id: Math.floor(Math.random() * 10000),
      number: Math.floor(Math.random() * 1000),
      title: overrides.title || 'Test Issue',
      body: overrides.body || 'Test issue body',
      state: overrides.state || 'open',
      labels: overrides.labels || [],
      user: { login: overrides.user || 'testuser' },
      created_at: overrides.created_at || new Date().toISOString(),
      ...overrides
    };
  }
}

// Export singleton instance and utilities
const testFramework = new TestFramework();

module.exports = {
  TestFramework,
  testFramework,
  suite: (...args) => testFramework.suite(...args),
  test: (...args) => testFramework.test(...args),
  testAsync: (...args) => testFramework.testAsync(...args),
  run: (...args) => testFramework.run(...args),
  assert: (...args) => testFramework.assert(...args),
  assertEqual: (...args) => testFramework.assertEqual(...args),
  assertDeepEqual: (...args) => testFramework.assertDeepEqual(...args),
  assertThrows: (...args) => testFramework.assertThrows(...args),
  measurePerformance: (...args) => testFramework.measurePerformance(...args),
  mockFunction: (...args) => testFramework.mockFunction(...args),
  generateTestEmail: (...args) => testFramework.generateTestEmail(...args),
  generateTestGitHubIssue: (...args) => testFramework.generateTestGitHubIssue(...args)
};
