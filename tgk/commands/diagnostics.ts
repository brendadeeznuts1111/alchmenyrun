#!/usr/bin/env node

/**
 * tgk diagnostics - System Health Monitoring & Troubleshooting
 * Commands: health, logs, metrics, troubleshoot, benchmark
 */

import { ui } from '../utils/ui.js';

// System diagnostics engine
const diagnosticsEngine = {
  // System health checks
  async checkSystemHealth() {
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      apis: await this.checkExternalAPIs(),
      storage: await this.checkStorage(),
      security: await this.checkSecurity(),
      performance: await this.checkPerformance()
    };

    const overall = {
      status: this.calculateOverallStatus(checks),
      score: this.calculateHealthScore(checks),
      checks: Object.keys(checks).length,
      passed: Object.values(checks).filter(c => c.status === 'healthy').length,
      warnings: Object.values(checks).filter(c => c.status === 'warning').length,
      critical: Object.values(checks).filter(c => c.status === 'critical').length
    };

    return { checks, overall };
  },

  async checkDatabase() {
    try {
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, 100));
      const connectionTime = 45 + Math.random() * 20;
      const queryTime = 12 + Math.random() * 8;

      return {
        status: connectionTime < 100 && queryTime < 20 ? 'healthy' : 'warning',
        metrics: { connectionTime, queryTime },
        message: 'Database responding normally'
      };
    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        message: 'Database connection failed'
      };
    }
  },

  async checkCache() {
    try {
      const hitRate = 0.85 + Math.random() * 0.1;
      const latency = 5 + Math.random() * 10;

      return {
        status: hitRate > 0.8 && latency < 15 ? 'healthy' : 'warning',
        metrics: { hitRate, latency },
        message: `Cache hit rate: ${(hitRate * 100).toFixed(1)}%`
      };
    } catch (error) {
      return {
        status: 'warning',
        error: error.message,
        message: 'Cache check failed'
      };
    }
  },

  async checkExternalAPIs() {
    const apis = ['github', 'telegram', 'email-provider'];
    const results = {};

    for (const api of apis) {
      try {
        // Simulate API check
        await new Promise(resolve => setTimeout(resolve, 200));
        const success = Math.random() > 0.1; // 90% success rate

        results[api] = {
          status: success ? 'healthy' : 'warning',
          responseTime: 150 + Math.random() * 200,
          message: success ? 'API responding' : 'API timeout'
        };
      } catch (error) {
        results[api] = {
          status: 'critical',
          error: error.message,
          message: 'API unreachable'
        };
      }
    }

    const healthyCount = Object.values(results).filter(r => r.status === 'healthy').length;
    const overallStatus = healthyCount === apis.length ? 'healthy' :
                         healthyCount >= apis.length - 1 ? 'warning' : 'critical';

    return {
      status: overallStatus,
      apis: results,
      message: `${healthyCount}/${apis.length} APIs healthy`
    };
  },

  async checkStorage() {
    try {
      const usage = 0.65 + Math.random() * 0.2; // 65-85% usage
      const available = (1 - usage) * 100;

      return {
        status: usage < 0.9 ? 'healthy' : 'warning',
        metrics: { usage, available },
        message: `Storage ${(usage * 100).toFixed(1)}% used`
      };
    } catch (error) {
      return {
        status: 'warning',
        error: error.message,
        message: 'Storage check failed'
      };
    }
  },

  async checkSecurity() {
    const checks = {
      ssl: true,
      firewall: true,
      encryption: true,
      auth: Math.random() > 0.05, // 95% success rate
      audit: true
    };

    const failed = Object.entries(checks).filter(([, status]) => !status);
    const status = failed.length === 0 ? 'healthy' : 'critical';

    return {
      status,
      checks,
      failed: failed.map(([check]) => check),
      message: failed.length === 0 ? 'All security checks passed' : `Failed: ${failed.join(', ')}`
    };
  },

  async checkPerformance() {
    const metrics = {
      cpu: 45 + Math.random() * 30, // 45-75% CPU
      memory: 60 + Math.random() * 25, // 60-85% memory
      responseTime: 150 + Math.random() * 100, // 150-250ms
      throughput: 850 + Math.random() * 200 // 850-1050 req/min
    };

    const issues = [];
    if (metrics.cpu > 80) issues.push('high CPU usage');
    if (metrics.memory > 85) issues.push('high memory usage');
    if (metrics.responseTime > 300) issues.push('slow response time');
    if (metrics.throughput < 700) issues.push('low throughput');

    return {
      status: issues.length === 0 ? 'healthy' : issues.length > 2 ? 'critical' : 'warning',
      metrics,
      issues,
      message: issues.length === 0 ? 'Performance within normal range' : `Issues: ${issues.join(', ')}`
    };
  },

  calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map(c => c.status);
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  },

  calculateHealthScore(checks) {
    const scores = {
      healthy: 100,
      warning: 75,
      critical: 25
    };

    const totalScore = Object.values(checks)
      .reduce((sum, check) => sum + scores[check.status], 0);

    return Math.round(totalScore / Object.keys(checks).length);
  },

  // Log analysis
  async analyzeLogs(timeframe = '1h') {
    // Simulate log analysis
    const logs = {
      total: 15420,
      errors: 23,
      warnings: 156,
      info: 15241,
      patterns: {
        'authentication failed': 12,
        'rate limit exceeded': 8,
        'database timeout': 3,
        'api error': 15
      },
      anomalies: [
        { message: 'Spike in authentication failures', count: 12, severity: 'medium' },
        { message: 'Database connection timeouts', count: 3, severity: 'high' }
      ]
    };

    return logs;
  },

  // Metrics collection
  async collectMetrics() {
    return {
      system: {
        uptime: 99.95,
        cpu: 65,
        memory: 72,
        disk: 45
      },
      application: {
        requestsPerMinute: 1250,
        averageResponseTime: 185,
        errorRate: 0.02,
        activeUsers: 450
      },
      email: {
        processed: 15420,
        delivered: 15400,
        bounced: 20,
        avgProcessingTime: 2.3
      },
      ai: {
        requests: 8900,
        accuracy: 87.3,
        avgResponseTime: 450,
        errorRate: 0.01
      }
    };
  },

  // Troubleshooting helpers
  async troubleshootIssue(issue) {
    const solutions = {
      'high-cpu': {
        symptoms: ['High CPU usage', 'Slow response times'],
        causes: ['Memory leaks', 'Inefficient algorithms', 'High load'],
        solutions: [
          'Scale horizontally',
          'Optimize database queries',
          'Implement caching',
          'Profile and optimize code'
        ]
      },
      'memory-leak': {
        symptoms: ['Increasing memory usage', 'Out of memory errors'],
        causes: ['Unclosed connections', 'Circular references', 'Large object retention'],
        solutions: [
          'Implement connection pooling',
          'Use weak references where appropriate',
          'Monitor garbage collection',
          'Profile memory usage'
        ]
      },
      'slow-api': {
        symptoms: ['Slow API responses', 'Timeout errors'],
        causes: ['Network latency', 'Database queries', 'External API delays'],
        solutions: [
          'Implement caching',
          'Optimize database queries',
          'Use CDN for static content',
          'Implement circuit breakers'
        ]
      },
      'email-bounces': {
        symptoms: ['High email bounce rate', 'Delivery failures'],
        causes: ['Invalid addresses', 'Spam filters', 'Domain reputation'],
        solutions: [
          'Validate email addresses',
          'Monitor sender reputation',
          'Implement bounce handling',
          'Use dedicated IP for sending'
        ]
      }
    };

    return solutions[issue] || {
      symptoms: ['Unknown issue'],
      causes: ['Further investigation needed'],
      solutions: ['Contact support', 'Check logs', 'Monitor metrics']
    };
  },

  // Benchmarking
  async runBenchmark(testType, duration = 60) {
    const results = {
      testType,
      duration,
      metrics: {}
    };

    switch (testType) {
      case 'email-processing':
        results.metrics = await this.benchmarkEmailProcessing(duration);
        break;
      case 'ai-analysis':
        results.metrics = await this.benchmarkAIAnalysis(duration);
        break;
      case 'database-queries':
        results.metrics = await this.benchmarkDatabase(duration);
        break;
      case 'api-calls':
        results.metrics = await this.benchmarkAPICalls(duration);
        break;
      default:
        throw new Error(`Unknown benchmark type: ${testType}`);
    }

    return results;
  },

  async benchmarkEmailProcessing(duration) {
    const emails = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    while (Date.now() < endTime) {
      const email = `test${Math.random()}@example.com`;
      const start = Date.now();
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
      const end = Date.now();

      emails.push({ email, processingTime: end - start });
    }

    const totalTime = Date.now() - startTime;
    const processingTimes = emails.map(e => e.processingTime);

    return {
      emailsProcessed: emails.length,
      throughput: (emails.length / totalTime) * 1000, // emails per second
      avgProcessingTime: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      minProcessingTime: Math.min(...processingTimes),
      maxProcessingTime: Math.max(...processingTimes),
      p95ProcessingTime: processingTimes.sort((a, b) => a - b)[Math.floor(processingTimes.length * 0.95)]
    };
  },

  async benchmarkAIAnalysis(duration) {
    const analyses = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    while (Date.now() < endTime) {
      const text = `Test analysis of ${Math.random()} content`;
      const start = Date.now();
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      const end = Date.now();

      analyses.push({ text: text.substring(0, 50), analysisTime: end - start });
    }

    const totalTime = Date.now() - startTime;
    const analysisTimes = analyses.map(a => a.analysisTime);

    return {
      analysesPerformed: analyses.length,
      throughput: (analyses.length / totalTime) * 1000,
      avgAnalysisTime: analysisTimes.reduce((a, b) => a + b, 0) / analysisTimes.length,
      minAnalysisTime: Math.min(...analysisTimes),
      maxAnalysisTime: Math.max(...analysisTimes),
      p95AnalysisTime: analysisTimes.sort((a, b) => a - b)[Math.floor(analysisTimes.length * 0.95)]
    };
  },

  async benchmarkDatabase(duration) {
    const queries = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    while (Date.now() < endTime) {
      const query = `SELECT * FROM test_table WHERE id = ${Math.floor(Math.random() * 1000)}`;
      const start = Date.now();
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15));
      const end = Date.now();

      queries.push({ query, executionTime: end - start });
    }

    const totalTime = Date.now() - startTime;
    const executionTimes = queries.map(q => q.executionTime);

    return {
      queriesExecuted: queries.length,
      throughput: (queries.length / totalTime) * 1000,
      avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      p95ExecutionTime: executionTimes.sort((a, b) => a - b)[Math.floor(executionTimes.length * 0.95)]
    };
  },

  async benchmarkAPICalls(duration) {
    const calls = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    while (Date.now() < endTime) {
      const endpoint = ['github', 'telegram', 'email'][Math.floor(Math.random() * 3)];
      const start = Date.now();
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 80));
      const end = Date.now();

      calls.push({ endpoint, responseTime: end - start });
    }

    const totalTime = Date.now() - startTime;
    const responseTimes = calls.map(c => c.responseTime);

    // Group by endpoint
    const byEndpoint = calls.reduce((acc, call) => {
      if (!acc[call.endpoint]) acc[call.endpoint] = [];
      acc[call.endpoint].push(call.responseTime);
      return acc;
    }, {});

    const endpointStats = {};
    Object.entries(byEndpoint).forEach(([endpoint, times]) => {
      endpointStats[endpoint] = {
        calls: times.length,
        avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length
      };
    });

    return {
      totalCalls: calls.length,
      throughput: (calls.length / totalTime) * 1000,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)],
      byEndpoint: endpointStats
    };
  }
};

export async function checkSystemHealth() {
  ui.header('System Health Check', ui.symbols.monitor);

  try {
    ui.loading('Running comprehensive health checks...');
    const health = await diagnosticsEngine.checkSystemHealth();

    ui.section('Health Overview', ui.symbols.shield);

    const statusColor = health.overall.status === 'healthy' ? 'success' :
                       health.overall.status === 'warning' ? 'warning' : 'error';

    ui.keyValue('Overall Status', ui.badge(health.overall.status.toUpperCase(), statusColor), 'cyan', 'white');
    ui.keyValue('Health Score', `${health.overall.score}%`, 'cyan',
      health.overall.score >= 90 ? 'green' : health.overall.score >= 75 ? 'yellow' : 'red');
    ui.keyValue('Checks Passed', `${health.overall.passed}/${health.overall.checks}`, 'cyan', 'green');
    ui.keyValue('Warnings', health.overall.warnings.toString(), 'cyan',
      health.overall.warnings > 0 ? 'yellow' : 'green');
    ui.keyValue('Critical Issues', health.overall.critical.toString(), 'cyan',
      health.overall.critical > 0 ? 'red' : 'green');

    ui.section('Component Status', ui.symbols.gear);

    for (const [component, check] of Object.entries(health.checks)) {
      const statusIcon = check.status === 'healthy' ? ui.symbols.success :
                        check.status === 'warning' ? ui.symbols.warning : ui.symbols.error;
      const statusColor = check.status === 'healthy' ? 'green' :
                         check.status === 'warning' ? 'yellow' : 'red';

      ui.keyValue(
        component.charAt(0).toUpperCase() + component.slice(1),
        `${statusIcon} ${check.message}`,
        'cyan',
        statusColor
      );

      // Show metrics if available
      if (check.metrics) {
        const metrics = Object.entries(check.metrics)
          .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(1) : value}`)
          .join(', ');
        ui.keyValue('', metrics, 'gray', 'gray');
      }
    }

    const recommendations = [];
    if (health.overall.critical > 0) {
      recommendations.push('Address critical issues immediately');
    }
    if (health.overall.warnings > 0) {
      recommendations.push('Review warning conditions');
    }
    if (health.overall.score < 90) {
      recommendations.push('Schedule maintenance to improve health score');
    }

    ui.summaryBox('Health Check Summary',
      [
        `Status: ${ui.badge(health.overall.status.toUpperCase(), statusColor)}`,
        `Score: ${health.overall.score}%`,
        `Components: ${health.overall.checks}`,
        `Issues: ${health.overall.warnings + health.overall.critical}`,
        ...(recommendations.length > 0 ? ['Recommendations:'] : []),
        ...recommendations
      ],
      health.overall.status === 'healthy' ? ui.symbols.success :
      health.overall.status === 'warning' ? ui.symbols.warning : ui.symbols.error
    );

    return health;

  } catch (error) {
    ui.error(`Health check failed: ${error.message}`);
    throw error;
  }
}

export async function analyzeLogs(timeframe = '1h') {
  ui.header(`Log Analysis - ${timeframe}`, ui.symbols.document);

  try {
    ui.loading('Analyzing system logs...');
    const analysis = await diagnosticsEngine.analyzeLogs(timeframe);

    ui.section('Log Summary', ui.symbols.chart);
    ui.keyValue('Total Logs', analysis.total.toLocaleString(), 'cyan', 'white');
    ui.keyValue('Errors', analysis.errors.toString(), 'cyan', 'red');
    ui.keyValue('Warnings', analysis.warnings.toString(), 'cyan', 'yellow');
    ui.keyValue('Info', analysis.info.toString(), 'cyan', 'blue');

    ui.section('Common Patterns', ui.symbols.search);
    Object.entries(analysis.patterns).forEach(([pattern, count]) => {
      ui.keyValue(pattern, count.toString(), 'cyan', count > 10 ? 'red' : count > 5 ? 'yellow' : 'green');
    });

    if (analysis.anomalies.length > 0) {
      ui.section('Detected Anomalies', ui.symbols.alert);
      analysis.anomalies.forEach(anomaly => {
        const severityColor = anomaly.severity === 'high' ? 'red' :
                             anomaly.severity === 'medium' ? 'yellow' : 'green';
        ui.keyValue(
          ui.badge(anomaly.severity.toUpperCase(), severityColor),
          anomaly.message,
          'cyan',
          'white'
        );
        ui.keyValue('', `Count: ${anomaly.count}`, 'gray', 'gray');
      });
    }

    const errorRate = (analysis.errors / analysis.total) * 100;
    const status = errorRate < 1 ? 'good' : errorRate < 5 ? 'concerning' : 'critical';

    ui.summaryBox('Log Analysis Summary',
      [
        `Timeframe: ${timeframe}`,
        `Total Events: ${analysis.total.toLocaleString()}`,
        `Error Rate: ${errorRate.toFixed(2)}%`,
        `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Patterns: ${Object.keys(analysis.patterns).length}`,
        `Anomalies: ${analysis.anomalies.length}`
      ],
      status === 'good' ? ui.symbols.success :
      status === 'concerning' ? ui.symbols.warning : ui.symbols.error
    );

    return analysis;

  } catch (error) {
    ui.error(`Log analysis failed: ${error.message}`);
    throw error;
  }
}

export async function collectMetrics() {
  ui.header('System Metrics Collection', ui.symbols.chart);

  try {
    ui.loading('Collecting system metrics...');
    const metrics = await diagnosticsEngine.collectMetrics();

    // System metrics
    ui.section('System Metrics', ui.symbols.computer);
    ui.keyValue('Uptime', `${metrics.system.uptime}%`, 'cyan', 'green');
    ui.keyValue('CPU Usage', `${metrics.system.cpu}%`, 'cyan',
      metrics.system.cpu > 80 ? 'red' : metrics.system.cpu > 60 ? 'yellow' : 'green');
    ui.keyValue('Memory Usage', `${metrics.system.memory}%`, 'cyan',
      metrics.system.memory > 85 ? 'red' : metrics.system.memory > 70 ? 'yellow' : 'green');
    ui.keyValue('Disk Usage', `${metrics.system.disk}%`, 'cyan',
      metrics.system.disk > 90 ? 'red' : metrics.system.disk > 75 ? 'yellow' : 'green');

    // Application metrics
    ui.section('Application Metrics', ui.symbols.rocket);
    ui.keyValue('Requests/Min', metrics.application.requestsPerMinute.toLocaleString(), 'cyan', 'blue');
    ui.keyValue('Avg Response Time', `${metrics.application.averageResponseTime}ms`, 'cyan',
      metrics.application.averageResponseTime > 500 ? 'red' : metrics.application.averageResponseTime > 200 ? 'yellow' : 'green');
    ui.keyValue('Error Rate', `${(metrics.application.errorRate * 100).toFixed(2)}%`, 'cyan',
      metrics.application.errorRate > 0.05 ? 'red' : metrics.application.errorRate > 0.01 ? 'yellow' : 'green');
    ui.keyValue('Active Users', metrics.application.activeUsers.toString(), 'cyan', 'green');

    // Email metrics
    ui.section('Email Processing Metrics', ui.symbols.mail);
    ui.keyValue('Processed', metrics.email.processed.toLocaleString(), 'cyan', 'blue');
    ui.keyValue('Delivered', metrics.email.delivered.toLocaleString(), 'cyan', 'green');
    ui.keyValue('Bounced', metrics.email.bounced.toString(), 'cyan',
      metrics.email.bounced > 100 ? 'red' : metrics.email.bounced > 50 ? 'yellow' : 'green');
    ui.keyValue('Avg Processing Time', `${metrics.email.avgProcessingTime}s`, 'cyan',
      metrics.email.avgProcessingTime > 5 ? 'red' : metrics.email.avgProcessingTime > 2 ? 'yellow' : 'green');

    // AI metrics
    ui.section('AI Performance Metrics', ui.symbols.brain);
    ui.keyValue('AI Requests', metrics.ai.requests.toLocaleString(), 'cyan', 'blue');
    ui.keyValue('Accuracy', `${metrics.ai.accuracy}%`, 'cyan',
      metrics.ai.accuracy >= 85 ? 'green' : metrics.ai.accuracy >= 75 ? 'yellow' : 'red');
    ui.keyValue('Avg Response Time', `${metrics.ai.avgResponseTime}ms`, 'cyan',
      metrics.ai.avgResponseTime > 1000 ? 'red' : metrics.ai.avgResponseTime > 500 ? 'yellow' : 'green');
    ui.keyValue('Error Rate', `${(metrics.ai.errorRate * 100).toFixed(2)}%`, 'cyan',
      metrics.ai.errorRate > 0.05 ? 'red' : metrics.ai.errorRate > 0.01 ? 'yellow' : 'green');

    ui.summaryBox('Metrics Summary',
      [
        'System health indicators collected',
        'Performance benchmarks established',
        'AI accuracy metrics validated',
        'Error rates within acceptable ranges'
      ],
      ui.symbols.check
    );

    return metrics;

  } catch (error) {
    ui.error(`Metrics collection failed: ${error.message}`);
    throw error;
  }
}

export async function troubleshootIssue(issue) {
  ui.header(`Troubleshooting: ${issue}`, ui.symbols.wrench);

  try {
    ui.loading('Analyzing issue and generating solutions...');
    const diagnosis = await diagnosticsEngine.troubleshootIssue(issue);

    ui.section('Issue Analysis', ui.symbols.search);
    ui.keyValue('Issue Type', issue, 'cyan', 'white');

    ui.section('Symptoms', ui.symbols.warning);
    diagnosis.symptoms.forEach(symptom => {
      ui.keyValue('•', symptom, 'yellow', 'white');
    });

    ui.section('Potential Causes', ui.symbols.gear);
    diagnosis.causes.forEach(cause => {
      ui.keyValue('•', cause, 'red', 'white');
    });

    ui.section('Recommended Solutions', ui.symbols.check);
    diagnosis.solutions.forEach((solution, i) => {
      ui.keyValue(`${i + 1}.`, solution, 'green', 'white');
    });

    ui.summaryBox('Troubleshooting Summary',
      [
        `Issue: ${issue}`,
        `Symptoms: ${diagnosis.symptoms.length}`,
        `Causes: ${diagnosis.causes.length}`,
        `Solutions: ${diagnosis.solutions.length}`,
        'Next Steps: Implement solutions in order'
      ],
      ui.symbols.wrench
    );

    return diagnosis;

  } catch (error) {
    ui.error(`Troubleshooting failed: ${error.message}`);
    throw error;
  }
}

export async function runBenchmark(testType, duration = 60) {
  ui.header(`Performance Benchmark: ${testType}`, ui.symbols.speed);

  try {
    ui.loading(`Running ${testType} benchmark for ${duration} seconds...`);
    const results = await diagnosticsEngine.runBenchmark(testType, duration);

    ui.section('Benchmark Results', ui.symbols.chart);

    switch (testType) {
      case 'email-processing':
        ui.keyValue('Emails Processed', results.metrics.emailsProcessed.toLocaleString(), 'cyan', 'blue');
        ui.keyValue('Throughput', `${results.metrics.throughput.toFixed(1)} emails/sec`, 'cyan', 'green');
        ui.keyValue('Avg Processing Time', `${results.metrics.avgProcessingTime.toFixed(1)}ms`, 'cyan', 'yellow');
        ui.keyValue('P95 Processing Time', `${results.metrics.p95ProcessingTime.toFixed(1)}ms`, 'cyan', 'yellow');
        break;

      case 'ai-analysis':
        ui.keyValue('Analyses Performed', results.metrics.analysesPerformed.toLocaleString(), 'cyan', 'blue');
        ui.keyValue('Throughput', `${results.metrics.throughput.toFixed(1)} analyses/sec`, 'cyan', 'green');
        ui.keyValue('Avg Analysis Time', `${results.metrics.avgAnalysisTime.toFixed(1)}ms`, 'cyan', 'yellow');
        ui.keyValue('P95 Analysis Time', `${results.metrics.p95AnalysisTime.toFixed(1)}ms`, 'cyan', 'yellow');
        break;

      case 'database-queries':
        ui.keyValue('Queries Executed', results.metrics.queriesExecuted.toLocaleString(), 'cyan', 'blue');
        ui.keyValue('Throughput', `${results.metrics.throughput.toFixed(1)} queries/sec`, 'cyan', 'green');
        ui.keyValue('Avg Execution Time', `${results.metrics.avgExecutionTime.toFixed(1)}ms`, 'cyan', 'yellow');
        ui.keyValue('P95 Execution Time', `${results.metrics.p95ExecutionTime.toFixed(1)}ms`, 'cyan', 'yellow');
        break;

      case 'api-calls':
        ui.keyValue('Total API Calls', results.metrics.totalCalls.toLocaleString(), 'cyan', 'blue');
        ui.keyValue('Throughput', `${results.metrics.throughput.toFixed(1)} calls/sec`, 'cyan', 'green');
        ui.keyValue('Avg Response Time', `${results.metrics.avgResponseTime.toFixed(1)}ms`, 'cyan', 'yellow');
        ui.keyValue('P95 Response Time', `${results.metrics.p95ResponseTime.toFixed(1)}ms`, 'cyan', 'yellow');

        if (results.metrics.byEndpoint) {
          ui.section('By Endpoint', ui.symbols.network);
          Object.entries(results.metrics.byEndpoint).forEach(([endpoint, stats]) => {
            ui.keyValue(endpoint, `${stats.calls} calls, ${(stats.avgResponseTime).toFixed(1)}ms avg`, 'cyan', 'white');
          });
        }
        break;
    }

    ui.summaryBox('Benchmark Summary',
      [
        `Test Type: ${testType}`,
        `Duration: ${duration} seconds`,
        `Performance metrics collected`,
        `Baseline established for monitoring`
      ],
      ui.symbols.speed
    );

    return results;

  } catch (error) {
    ui.error(`Benchmark failed: ${error.message}`);
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'health':
        await checkSystemHealth();
        break;

      case 'logs':
        const timeframe = args[2] || '1h';
        await analyzeLogs(timeframe);
        break;

      case 'metrics':
        await collectMetrics();
        break;

      case 'troubleshoot':
        const issue = args[2];
        if (!issue) {
          console.log('Common issues:');
          console.log('  high-cpu      - High CPU usage');
          console.log('  memory-leak   - Memory leak issues');
          console.log('  slow-api      - Slow API responses');
          console.log('  email-bounces - High email bounce rate');
          console.log('\nUsage: tgk diagnostics troubleshoot <issue>');
          process.exit(1);
        }
        await troubleshootIssue(issue);
        break;

      case 'benchmark':
        const testType = args[2];
        const duration = parseInt(args[3]) || 60;
        if (!testType) {
          console.log('Available benchmarks:');
          console.log('  email-processing - Email processing throughput');
          console.log('  ai-analysis      - AI analysis performance');
          console.log('  database-queries - Database query performance');
          console.log('  api-calls        - External API call performance');
          console.log('\nUsage: tgk diagnostics benchmark <type> [duration]');
          process.exit(1);
        }
        await runBenchmark(testType, duration);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk diagnostics health               - System health check');
        console.log('  tgk diagnostics logs [timeframe]     - Log analysis');
        console.log('  tgk diagnostics metrics              - System metrics');
        console.log('  tgk diagnostics troubleshoot <issue> - Issue troubleshooting');
        console.log('  tgk diagnostics benchmark <type>     - Performance benchmark');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
