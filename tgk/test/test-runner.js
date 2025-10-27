#!/usr/bin/env node

/**
 * Comprehensive Test Runner for tgk RFC Lifecycle Orchestration
 * Integrates with CI/CD and provides detailed reporting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestRunner {
    constructor(configPath = './test-config.json') {
        this.config = this.loadConfig(configPath);
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            scenarios: [],
            startTime: new Date(),
            endTime: null
        };
    }

    loadConfig(configPath) {
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error(`❌ Failed to load test config: ${error.message}`);
            process.exit(1);
        }
    }

    async runAllTests(environment = 'test-do-006') {
        console.log('🧪 Starting Comprehensive tgk Test Suite');
        console.log(`📊 Environment: ${environment}`);
        console.log('==================================');

        const env = this.config.test_environments[environment];
        if (!env) {
            console.error(`❌ Unknown test environment: ${environment}`);
            process.exit(1);
        }

        // Validate environment variables
        this.validateEnvironment(env);

        // Run each test scenario
        for (const [scenarioKey, scenario] of Object.entries(this.config.test_scenarios)) {
            await this.runScenario(scenarioKey, scenario, env);
        }

        // Generate final report
        this.generateFinalReport();
    }

    validateEnvironment(env) {
        console.log('🔍 Validating environment configuration...');
        
        const missingVars = [];
        for (const scenario of Object.values(this.config.test_scenarios)) {
            for (const varName of scenario.required_env_vars || []) {
                if (!process.env[varName]) {
                    missingVars.push(varName);
                }
            }
        }

        if (missingVars.length > 0) {
            console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
            console.log('💡 Set these variables and try again:');
            missingVars.forEach(varName => {
                console.log(`   export ${varName}=your_value`);
            });
            process.exit(1);
        }

        console.log('✅ Environment validation passed');
    }

    async runScenario(scenarioKey, scenario, env) {
        console.log(`\n🔬 Running: ${scenario.name}`);
        console.log('----------------------------------------');

        this.results.total++;
        const startTime = Date.now();

        try {
            // Set environment variables for this scenario
            const testEnv = {
                ...process.env,
                TGK_STAGE: env.stage,
                TGK_PROFILE: env.profile,
                ...env
            };

            // Run the test script with timeout
            const result = execSync(
                `./${scenario.script} ${env.stage} ${env.profile}`,
                {
                    cwd: __dirname,
                    env: testEnv,
                    timeout: scenario.timeout_seconds * 1000,
                    encoding: 'utf8'
                }
            );

            const duration = Date.now() - startTime;
            
            console.log(`✅ PASSED: ${scenario.name} (${duration}ms)`);
            this.results.passed++;
            
            this.results.scenarios.push({
                name: scenario.name,
                status: 'PASSED',
                duration,
                output: result
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            
            console.log(`❌ FAILED: ${scenario.name} (${duration}ms)`);
            console.log(`Error: ${error.message}`);
            
            this.results.failed++;
            
            this.results.scenarios.push({
                name: scenario.name,
                status: 'FAILED',
                duration,
                error: error.message,
                output: error.stdout || ''
            });
        }
    }

    generateFinalReport() {
        this.results.endTime = new Date();
        const totalDuration = this.results.endTime - this.results.startTime;

        console.log('\n==================================');
        console.log('🏁 Test Suite Complete');
        console.log(`📊 Results: ${this.results.passed}/${this.results.total} passed, ${this.results.failed} failed`);
        console.log(`⏱️  Total duration: ${totalDuration}ms`);
        console.log('==================================');

        // Generate detailed report
        const report = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                success_rate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%',
                duration: totalDuration,
                timestamp: new Date().toISOString()
            },
            scenarios: this.results.scenarios,
            environment: process.env.TGK_STAGE || 'unknown'
        };

        // Save report to file
        const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Detailed report saved to: ${reportPath}`);

        // Generate markdown report for GitHub
        this.generateMarkdownReport(report);

        // Exit with appropriate code
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed! System is production ready.');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Review logs and fix issues.');
            process.exit(1);
        }
    }

    generateMarkdownReport(report) {
        const markdown = `
# tgk RFC Lifecycle Test Report

## Summary

- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed}
- **Failed:** ${report.summary.failed}
- **Success Rate:** ${report.summary.success_rate}
- **Duration:** ${report.summary.duration}ms
- **Environment:** ${report.environment}
- **Timestamp:** ${report.summary.timestamp}

## Test Results

${report.scenarios.map(scenario => `
### ${scenario.name}

**Status:** ${scenario.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}
**Duration:** ${scenario.duration}ms

${scenario.error ? `**Error:** ${scenario.error}` : ''}

${scenario.output ? `\`\`\`\n${scenario.output.substring(0, 500)}${scenario.output.length > 500 ? '...' : ''}\n\`\`\`` : ''}
`).join('')}

## Recommendations

${report.scenarios.filter(s => s.status === 'FAILED').length > 0 ? 
    '⚠️ **Action Required:** Some tests failed. Please review the failed scenarios and fix the identified issues before deploying to production.' :
    '🎉 **Ready for Production:** All tests passed. The system is ready for production deployment.'
}

---

*Generated by tgk test runner on ${new Date().toISOString()}*
        `;

        const markdownPath = path.join(__dirname, `test-report-${Date.now()}.md`);
        fs.writeFileSync(markdownPath, markdown);
        console.log(`📄 Markdown report saved to: ${markdownPath}`);
    }

    async runSpecificScenario(scenarioName, environment = 'test-do-006') {
        const scenario = Object.values(this.config.test_scenarios).find(s => s.name === scenarioName);
        if (!scenario) {
            console.error(`❌ Unknown test scenario: ${scenarioName}`);
            console.log('Available scenarios:');
            Object.values(this.config.test_scenarios).forEach(s => {
                console.log(`  - ${s.name}`);
            });
            process.exit(1);
        }

        const env = this.config.test_environments[environment];
        if (!env) {
            console.error(`❌ Unknown test environment: ${environment}`);
            process.exit(1);
        }

        console.log(`🧪 Running specific scenario: ${scenarioName}`);
        await this.runScenario(scenarioName, scenario, env);
        this.generateFinalReport();
    }

    listScenarios() {
        console.log('📋 Available test scenarios:');
        console.log('==================================');
        
        Object.entries(this.config.test_scenarios).forEach(([key, scenario]) => {
            console.log(`${key}: ${scenario.name}`);
            console.log(`  Script: ${scenario.script}`);
            console.log(`  Timeout: ${scenario.timeout_seconds}s`);
            console.log(`  Required env vars: ${(scenario.required_env_vars || []).join(', ')}`);
            console.log('');
        });
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const runner = new TestRunner();

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: node test-runner.js [options]

Options:
  --list, -l           List available test scenarios
  --scenario <name>    Run specific scenario
  --env <environment>  Test environment (default: test-do-006)
  --help, -h           Show this help

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js --list             # List scenarios
  node test-runner.js --scenario "DO Thread Safety & State Persistence"
  node test-runner.js --env production   # Run in production environment
        `);
        return;
    }

    if (args.includes('--list') || args.includes('-l')) {
        runner.listScenarios();
        return;
    }

    const scenarioIndex = args.indexOf('--scenario');
    const envIndex = args.indexOf('--env');

    const scenario = scenarioIndex !== -1 ? args[scenarioIndex + 1] : null;
    const environment = envIndex !== -1 ? args[envIndex + 1] : 'test-do-006';

    if (scenario) {
        await runner.runSpecificScenario(scenario, environment);
    } else {
        await runner.runAllTests(environment);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = TestRunner;
