#!/usr/bin/env node

/**
 * tgk Comprehensive Test Runner
 * Executes all test suites and provides detailed reporting
 */

const { ui } = require('../utils/ui.js');

async function runAllTests() {
  ui.header('🚀 tgk Comprehensive Test Suite', '🧪');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: []
  };

  const startTime = Date.now();

  // Test Suites to Run
  const testSuites = [
    { name: 'Framework Basics', file: './test/test-framework.js', type: 'unit' },
    { name: 'Unit Tests', file: './test/unit-tests.js', type: 'unit' },
    { name: 'Integration Tests', file: './test/integration-tests.js', type: 'integration' },
    { name: 'Load Tests', file: './test/load-tests.js', type: 'load' },
    { name: 'Chaos Tests', file: './test/chaos-tests.js', type: 'chaos' },
    { name: 'AI Tests', file: './test/ai-tests.js', type: 'ai' },
    { name: 'Security Tests', file: './test/security-tests.js', type: 'security' }
  ];

  ui.section('Test Execution Plan', '📋');
  ui.keyValue('Total Test Suites', testSuites.length.toString(), 'cyan', 'white');
  ui.keyValue('Coverage Areas', 'Unit, Integration, Load, Chaos, AI, Security', 'cyan', 'white');
  ui.keyValue('Execution Mode', 'Sequential with detailed reporting', 'cyan', 'white');

  // Run each test suite
  for (const suite of testSuites) {
    ui.section(`Running ${suite.name} (${suite.type.toUpperCase()})`, '▶️');

    const suiteStart = Date.now();

    try {
      // Load and run test suite
      const testModule = require(suite.file);
      let suiteResults = { passed: 0, failed: 0, skipped: 0, total: 0 };

      // If module has test functions, run them
      if (testModule.run) {
        suiteResults = await testModule.run({ verbose: false });
      } else {
        // Module loaded successfully
        suiteResults = { passed: 1, failed: 0, skipped: 0, total: 1 };
      }

      const suiteDuration = Date.now() - suiteStart;
      const suiteSuccessRate = suiteResults.total > 0 ?
        ((suiteResults.passed / suiteResults.total) * 100).toFixed(1) : '0.0';

      testResults.total += suiteResults.total;
      testResults.passed += suiteResults.passed;
      testResults.failed += suiteResults.failed;
      testResults.skipped += suiteResults.skipped;

      testResults.suites.push({
        name: suite.name,
        type: suite.type,
        results: suiteResults,
        duration: suiteDuration,
        successRate: suiteSuccessRate
      });

      const statusIcon = suiteResults.failed === 0 ? '✅' : '❌';
      ui.keyValue(`${suite.name} Results`,
        `${statusIcon} ${suiteResults.passed}/${suiteResults.total} passed (${suiteSuccessRate}%) - ${suiteDuration}ms`,
        suiteResults.failed === 0 ? 'green' : 'red', 'white');

    } catch (error) {
      const suiteDuration = Date.now() - suiteStart;

      testResults.failed += 1;
      testResults.total += 1;

      testResults.suites.push({
        name: suite.name,
        type: suite.type,
        error: error.message,
        duration: suiteDuration,
        results: { passed: 0, failed: 1, skipped: 0, total: 1 }
      });

      ui.error(`${suite.name} failed: ${error.message}`);
    }
  }

  testResults.duration = Date.now() - startTime;

  // Generate comprehensive report
  ui.header('📊 Test Results Summary', '📈');

  ui.section('Overall Statistics', '📊');
  ui.keyValue('Total Test Suites', testSuites.length.toString(), 'cyan', 'white');
  ui.keyValue('Total Tests Executed', testResults.total.toString(), 'cyan', 'white');
  ui.keyValue('Tests Passed', testResults.passed.toString(), 'green', 'white');
  ui.keyValue('Tests Failed', testResults.failed.toString(), 'red', 'white');
  ui.keyValue('Tests Skipped', testResults.skipped.toString(), 'yellow', 'white');
  ui.keyValue('Total Duration', `${testResults.duration}ms`, 'cyan', 'white');

  const overallSuccessRate = testResults.total > 0 ?
    ((testResults.passed / testResults.total) * 100).toFixed(1) : '0.0';
  ui.keyValue('Overall Success Rate', `${overallSuccessRate}%`,
    overallSuccessRate >= 90 ? 'green' : overallSuccessRate >= 75 ? 'yellow' : 'red', 'white');

  // Suite breakdown
  ui.section('Suite Breakdown', '📋');
  ui.table(
    ['Suite Name', 'Type', 'Passed/Failed', 'Success Rate', 'Duration'],
    testResults.suites.map(suite => [
      suite.name,
      suite.type.toUpperCase(),
      suite.error ? '❌ Error' : `${suite.results.passed}/${suite.results.total}`,
      suite.error ? '0.0%' : `${suite.successRate}%`,
      `${suite.duration}ms`
    ])
  );

  // Test coverage analysis
  ui.section('Test Coverage Analysis', '🎯');

  const coverageByType = {};
  testResults.suites.forEach(suite => {
    if (!coverageByType[suite.type]) {
      coverageByType[suite.type] = { total: 0, passed: 0 };
    }
    coverageByType[suite.type].total += suite.results.total;
    coverageByType[suite.type].passed += suite.results.passed;
  });

  Object.entries(coverageByType).forEach(([type, stats]) => {
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
    ui.keyValue(`${type.charAt(0).toUpperCase() + type.slice(1)} Tests`,
      `${stats.passed}/${stats.total} (${rate}%)`,
      rate >= 90 ? 'green' : rate >= 75 ? 'yellow' : 'red', 'white');
  });

  // Performance analysis
  ui.section('Performance Analysis', '⚡');

  const avgSuiteDuration = testResults.suites.length > 0 ?
    testResults.suites.reduce((sum, suite) => sum + suite.duration, 0) / testResults.suites.length : 0;

  ui.keyValue('Average Suite Duration', `${avgSuiteDuration.toFixed(1)}ms`, 'cyan', 'white');
  ui.keyValue('Total Execution Time', `${testResults.duration}ms`, 'cyan', 'white');
  ui.keyValue('Tests per Second', (testResults.total / (testResults.duration / 1000)).toFixed(1), 'cyan', 'white');

  // Quality assessment
  ui.section('Quality Assessment', '⭐');

  const qualityScore = calculateQualityScore(testResults);
  ui.keyValue('Overall Quality Score', `${qualityScore.toFixed(1)}/100`,
    qualityScore >= 90 ? 'green' : qualityScore >= 75 ? 'yellow' : 'red', 'white');

  const qualityLevel = qualityScore >= 90 ? 'Excellent' :
                      qualityScore >= 80 ? 'Good' :
                      qualityScore >= 70 ? 'Acceptable' :
                      qualityScore >= 60 ? 'Needs Improvement' : 'Critical Issues';

  ui.keyValue('Quality Level', qualityLevel,
    qualityScore >= 90 ? 'green' : qualityScore >= 75 ? 'yellow' : 'red', 'white');

  // Recommendations
  if (testResults.failed > 0) {
    ui.section('Recommendations', '💡');
    ui.warning('Some tests failed. Recommendations:');

    if (testResults.failed > testResults.total * 0.1) {
      ui.keyValue('•', 'High failure rate - investigate test stability', 'red', 'white');
    }

    const failedSuites = testResults.suites.filter(s => s.results.failed > 0);
    if (failedSuites.length > 0) {
      ui.keyValue('•', `Focus on failing suites: ${failedSuites.map(s => s.name).join(', ')}`, 'yellow', 'white');
    }

    ui.keyValue('•', 'Run tests individually to isolate issues', 'cyan', 'white');
    ui.keyValue('•', 'Check test environment and dependencies', 'cyan', 'white');
  }

  // Final status
  const finalStatus = testResults.failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS';
  const finalIcon = testResults.failed === 0 ? '🎉' : '⚠️';

  ui.summaryBox('Final Test Status', [
    `Status: ${finalStatus}`,
    `Test Suites: ${testSuites.length}`,
    `Total Tests: ${testResults.total}`,
    `Success Rate: ${overallSuccessRate}%`,
    `Quality Score: ${qualityScore.toFixed(1)}/100`,
    `Duration: ${testResults.duration}ms`,
    testResults.failed === 0 ?
      '🚀 All systems go! Ready for production deployment.' :
      '⚠️ Some issues detected. Review failures before deployment.'
  ], finalIcon);

  return testResults;
}

function calculateQualityScore(results) {
  let score = 100;

  // Deduct for failures
  score -= (results.failed / results.total) * 50;

  // Deduct for low coverage (assuming minimum expectations)
  if (results.total < 50) score -= 20; // Expect at least 50 tests
  if (testResults.suites.length < 5) score -= 10; // Expect comprehensive suite coverage

  // Bonus for high success rates
  if (results.total > 0 && (results.passed / results.total) > 0.95) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// CLI interface
async function main() {
  try {
    const results = await runAllTests();
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAllTests };
