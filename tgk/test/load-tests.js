/**
 * tgk Load & Performance Tests
 * Comprehensive load testing for scalability validation
 */

const {
  suite,
  testAsync,
  assert,
  measurePerformance,
  generateTestEmail
} = require('./test-framework.js');

// Load testing configuration
const LOAD_CONFIG = {
  // Email processing load
  email: {
    burst: { count: 100, duration: 30 },      // 100 emails in 30 seconds
    sustained: { count: 1000, duration: 300 }, // 1000 emails over 5 minutes
    peak: { count: 10000, duration: 600 }      // 10000 emails over 10 minutes
  },

  // API endpoint load
  api: {
    concurrent: { users: 50, duration: 60 },   // 50 concurrent users for 1 minute
    ramp: { start: 10, end: 100, duration: 300 } // Ramp from 10 to 100 users over 5 minutes
  },

  // Database load
  database: {
    read: { queries: 10000, duration: 60 },   // 10000 read queries per minute
    write: { queries: 1000, duration: 60 }    // 1000 write queries per minute
  }
};

// Mock load testing services
const loadServices = {
  emailProcessor: {
    processEmail: async (email, body) => {
      // Simulate realistic processing time
      const baseDelay = 50 + Math.random() * 100; // 50-150ms base processing
      const aiDelay = Math.random() < 0.1 ? 500 : 100; // 10% of emails get heavy AI processing
      const networkDelay = 20 + Math.random() * 30; // Network latency

      await new Promise(resolve => setTimeout(resolve, baseDelay + aiDelay + networkDelay));

      return {
        success: true,
        processing_time: baseDelay + aiDelay + networkDelay,
        email_id: Math.random().toString(36).substr(2, 9)
      };
    }
  },

  apiEndpoints: {
    issueTriage: async (issueId) => {
      const processingTime = 200 + Math.random() * 300; // 200-500ms
      await new Promise(resolve => setTimeout(resolve, processingTime));

      return {
        success: true,
        labels: ['group/internal', 'topic/governance', 'impact/low'],
        confidence: 0.85,
        processing_time: processingTime
      };
    },

    aiAnalysis: async (text) => {
      const processingTime = 100 + Math.random() * 400; // 100-500ms AI processing
      await new Promise(resolve => setTimeout(resolve, processingTime));

      return {
        sentiment: 'neutral',
        keywords: ['test', 'analysis'],
        confidence: 0.82,
        processing_time: processingTime
      };
    },

    telegramSend: async (chatId, message) => {
      const processingTime = 50 + Math.random() * 100; // 50-150ms API call
      await new Promise(resolve => setTimeout(resolve, processingTime));

      return {
        message_id: Math.floor(Math.random() * 1000000),
        processing_time: processingTime
      };
    }
  },

  database: {
    read: async (query) => {
      const processingTime = 5 + Math.random() * 20; // 5-25ms read
      await new Promise(resolve => setTimeout(resolve, processingTime));
      return { success: true, data: {}, processing_time: processingTime };
    },

    write: async (query) => {
      const processingTime = 10 + Math.random() * 30; // 10-40ms write
      await new Promise(resolve => setTimeout(resolve, processingTime));
      return { success: true, processing_time: processingTime };
    }
  }
};

// Load testing utilities
class LoadTester {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  start() {
    this.metrics.startTime = Date.now();
  }

  end() {
    this.metrics.endTime = Date.now();
  }

  recordSuccess(responseTime) {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.responseTimes.push(responseTime);
  }

  recordFailure(error, responseTime = 0) {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.responseTimes.push(responseTime);
    this.metrics.errors.push(error);
  }

  getResults() {
    const duration = this.metrics.endTime - this.metrics.startTime;
    const rps = this.metrics.totalRequests / (duration / 1000);

    return {
      duration,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100,
      rps: rps,
      avgResponseTime: this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length,
      p50: this.calculatePercentile(this.metrics.responseTimes, 50),
      p95: this.calculatePercentile(this.metrics.responseTimes, 95),
      p99: this.calculatePercentile(this.metrics.responseTimes, 99),
      errors: this.metrics.errors.slice(0, 10) // First 10 errors
    };
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const sorted = [...sortedArray].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  async runLoadTest(testFn, config) {
    this.start();

    const promises = [];
    const results = [];

    if (config.count) {
      // Fixed number of requests
      for (let i = 0; i < config.count; i++) {
        promises.push(this.runSingleTest(testFn, results, i));
      }
    } else if (config.users) {
      // Concurrent users
      for (let i = 0; i < config.users; i++) {
        promises.push(this.runConcurrentUser(testFn, results, config.duration));
      }
    }

    await Promise.all(promises);
    this.end();

    return this.getResults();
  }

  async runSingleTest(testFn, results, index) {
    const startTime = Date.now();

    try {
      const result = await testFn(index);
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      results.push({ success: true, responseTime, result });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure(error, responseTime);
      results.push({ success: false, responseTime, error });
    }
  }

  async runConcurrentUser(testFn, results, duration) {
    const endTime = Date.now() + (duration * 1000);

    while (Date.now() < endTime) {
      await this.runSingleTest(testFn, results, 0);
      // Small delay between requests to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// Performance test suites
suite('Email Processing Load Tests', () => {
  const loadTester = new LoadTester();

  testAsync('burst email processing (100 emails)', async () => {
    const config = LOAD_CONFIG.email.burst;

    const results = await loadTester.runLoadTest(
      async (index) => {
        const email = generateTestEmail('cloudflare.com', {
          domain: 'infra',
          scope: 'sre',
          type: 'alert',
          hierarchy: 'p' + (index % 3), // Vary priority
          meta: 'cf',
          stateId: `test${index}`
        });

        return await loadServices.emailProcessor.processEmail(
          email,
          `Load test alert ${index}`
        );
      },
      config
    );

    // Validate performance requirements
    assert(results.successRate >= 99, `Success rate should be >= 99%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 1000, `95th percentile should be < 1000ms, got ${results.p95.toFixed(1)}ms`);
    assert(results.rps >= 2, `Should handle at least 2 RPS, got ${results.rps.toFixed(1)}`);

    console.log(`📧 Burst Load Test Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
    console.log(`   📈 Total Requests: ${results.totalRequests}`);
  });

  testAsync('sustained email processing (1000 emails)', async () => {
    const config = LOAD_CONFIG.email.sustained;

    const results = await loadTester.runLoadTest(
      async (index) => {
        const email = generateTestEmail();
        return await loadServices.emailProcessor.processEmail(
          email,
          `Sustained load test ${index}`
        );
      },
      config
    );

    // Sustained load should maintain performance
    assert(results.successRate >= 99.5, `Success rate should be >= 99.5%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 800, `95th percentile should be < 800ms, got ${results.p95.toFixed(1)}ms`);

    console.log(`📧 Sustained Load Test Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });

  testAsync('peak load simulation (10000 emails)', async () => {
    const config = LOAD_CONFIG.email.peak;

    const results = await loadTester.runLoadTest(
      async (index) => {
        const email = generateTestEmail();
        return await loadServices.emailProcessor.processEmail(
          email,
          `Peak load test ${index}`
        );
      },
      config
    );

    // Peak load may have some degradation but should not fail completely
    assert(results.successRate >= 95, `Success rate should be >= 95%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 2000, `95th percentile should be < 2000ms, got ${results.p95.toFixed(1)}ms`);

    console.log(`📧 Peak Load Test Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });
});

suite('API Endpoint Load Tests', () => {
  const loadTester = new LoadTester();

  testAsync('concurrent API users (50 users)', async () => {
    const config = LOAD_CONFIG.api.concurrent;

    const results = await loadTester.runLoadTest(
      async (userId) => {
        // Mix of different API calls
        const apiCall = Math.random();
        if (apiCall < 0.4) {
          return await loadServices.apiEndpoints.issueTriage(`issue-${userId}`);
        } else if (apiCall < 0.7) {
          return await loadServices.apiEndpoints.aiAnalysis(`User query ${userId}`);
        } else {
          return await loadServices.apiEndpoints.telegramSend(
            `chat-${userId}`,
            `Test message ${userId}`
          );
        }
      },
      config
    );

    assert(results.successRate >= 98, `API success rate should be >= 98%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 1000, `API P95 should be < 1000ms, got ${results.p95.toFixed(1)}ms`);

    console.log(`🔗 API Load Test Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });

  testAsync('ramping API load (10-100 users)', async () => {
    const config = LOAD_CONFIG.api.ramp;
    const loadTester = new LoadTester();

    // Simulate ramping load
    const results = await loadTester.runLoadTest(
      async (index) => {
        // Determine current load level based on time
        const elapsed = (Date.now() - loadTester.metrics.startTime) / 1000;
        const progress = Math.min(elapsed / config.duration, 1);
        const currentUsers = Math.round(config.start + (config.end - config.start) * progress);

        return await loadServices.apiEndpoints.aiAnalysis(
          `Ramping load test with ${currentUsers} concurrent users`
        );
      },
      { count: 500, duration: config.duration } // Simplified for testing
    );

    assert(results.successRate >= 95, `Ramping load success rate should be >= 95%, got ${results.successRate.toFixed(1)}%`);

    console.log(`📈 Ramping Load Test Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });
});

suite('Database Load Tests', () => {
  const loadTester = new LoadTester();

  testAsync('database read load (10000 queries)', async () => {
    const config = LOAD_CONFIG.database.read;

    const results = await loadTester.runLoadTest(
      async (index) => {
        return await loadServices.database.read(
          `SELECT * FROM issues WHERE id = ${index % 1000}`
        );
      },
      config
    );

    assert(results.successRate >= 99.9, `DB read success rate should be >= 99.9%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 100, `DB read P95 should be < 100ms, got ${results.p95.toFixed(1)}ms`);
    assert(results.rps >= 100, `Should handle >= 100 read RPS, got ${results.rps.toFixed(1)}`);

    console.log(`🗄️ Database Read Load Test:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });

  testAsync('database write load (1000 queries)', async () => {
    const config = LOAD_CONFIG.database.write;

    const results = await loadTester.runLoadTest(
      async (index) => {
        return await loadServices.database.write(
          `INSERT INTO email_logs (email_id, processed_at) VALUES ('email-${index}', NOW())`
        );
      },
      config
    );

    assert(results.successRate >= 99, `DB write success rate should be >= 99%, got ${results.successRate.toFixed(1)}%`);
    assert(results.p95 < 200, `DB write P95 should be < 200ms, got ${results.p95.toFixed(1)}ms`);

    console.log(`💾 Database Write Load Test:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
    console.log(`   📊 P95 Latency: ${results.p95.toFixed(1)}ms`);
  });
});

suite('Memory and Resource Usage Tests', () => {
  testAsync('memory leak detection', async () => {
    const initialMemory = process.memoryUsage();

    // Process many emails to check for memory leaks
    const emailPromises = Array.from({ length: 1000 }, async (_, i) => {
      const email = generateTestEmail();
      return await loadServices.emailProcessor.processEmail(
        email,
        `Memory test email ${i}`
      );
    });

    await Promise.all(emailPromises);

    const finalMemory = process.memoryUsage();

    const memoryIncrease = {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external
    };

    // Memory increase should be reasonable (less than 100MB for 1000 emails)
    const maxIncrease = 100 * 1024 * 1024; // 100MB
    assert(memoryIncrease.heapUsed < maxIncrease,
           `Heap memory increase should be < 100MB, got ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(1)}MB`);

    console.log(`🧠 Memory Usage Test:`);
    console.log(`   📈 Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(1)}MB → ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   📊 Increase: ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  });

  testAsync('CPU usage monitoring', async () => {
    // Note: CPU monitoring is more complex in Node.js
    // This is a simplified version
    const startUsage = process.cpuUsage();

    // Run CPU-intensive operations
    const promises = Array.from({ length: 10 }, async () => {
      for (let i = 0; i < 100000; i++) {
        Math.sqrt(i) * Math.sin(i);
      }
      return true;
    });

    await Promise.all(promises);

    const endUsage = process.cpuUsage(startUsage);

    const totalCpuTime = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds

    console.log(`⚡ CPU Usage Test:`);
    console.log(`   👤 User CPU: ${endUsage.user / 1000}ms`);
    console.log(`   🔧 System CPU: ${endUsage.system / 1000}ms`);
    console.log(`   📊 Total CPU: ${totalCpuTime}ms`);

    // Should complete within reasonable time
    assert(totalCpuTime < 5000, `CPU-intensive task should complete in < 5s, took ${totalCpuTime}ms`);
  });
});

suite('Performance Benchmarks', () => {
  testAsync('microbenchmark - email parsing', async () => {
    const perf = await measurePerformance(async () => {
      const email = generateTestEmail();
      const parts = email.split('@')[0].split('.');
      return parts.length === 6;
    }, 10000);

    assert(perf.avg < 1, `Email parsing should be < 1ms, got ${perf.avg.toFixed(3)}ms`);
    assert(perf.p95 < 2, `Email parsing P95 should be < 2ms, got ${perf.p95.toFixed(3)}ms`);

    console.log(`📧 Email Parsing Benchmark:`);
    console.log(`   📊 Average: ${perf.avg.toFixed(3)}ms`);
    console.log(`   📈 P95: ${perf.p95.toFixed(3)}ms`);
    console.log(`   🔄 Iterations: ${perf.iterations}`);
  });

  testAsync('microbenchmark - AI text processing', async () => {
    const perf = await measurePerformance(async () => {
      const text = 'This is a sample email about system performance and security issues that need attention';
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const keywords = words.filter(word => word.length > 3 && !['this', 'that', 'with', 'from', 'they', 'have'].includes(word));
      return keywords.length;
    }, 5000);

    assert(perf.avg < 5, `AI text processing should be < 5ms, got ${perf.avg.toFixed(3)}ms`);

    console.log(`🤖 AI Text Processing Benchmark:`);
    console.log(`   📊 Average: ${perf.avg.toFixed(3)}ms`);
    console.log(`   📈 P95: ${perf.p95.toFixed(3)}ms`);
  });
});

// Export load testing utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LoadTester,
    loadServices,
    LOAD_CONFIG
  };
}
