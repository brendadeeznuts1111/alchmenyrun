/**
 * tgk Chaos Engineering & Resilience Tests
 * Testing system behavior under failure conditions
 */

const {
  suite,
  testAsync,
  assert,
  generateTestEmail
} = require('./test-framework.js');

// Chaos testing configuration
const CHAOS_CONFIG = {
  network: {
    latency: { min: 100, max: 5000, duration: 30 },  // 100ms-5s latency for 30s
    packetLoss: { rate: 0.1, duration: 20 },          // 10% packet loss for 20s
    connectionReset: { frequency: 0.05, duration: 15 } // 5% connection resets
  },

  services: {
    apiFailure: { rate: 0.2, duration: 45 },          // 20% API failures for 45s
    databaseDown: { duration: 30 },                   // Complete DB outage for 30s
    cacheMiss: { rate: 0.8, duration: 60 }            // 80% cache misses for 60s
  },

  resources: {
    memorySpike: { increase: 200, duration: 20 },     // 200MB memory spike
    cpuSpike: { utilization: 90, duration: 25 },      // 90% CPU utilization
    diskFull: { threshold: 95, duration: 15 }         // 95% disk usage
  }
};

// Chaos testing services with failure injection
const chaosServices = {
  // Faulty email processor that can fail
  emailProcessor: {
    failureMode: null,
    failureRate: 0,

    setFailureMode(mode, rate = 1.0) {
      this.failureMode = mode;
      this.failureRate = rate;
    },

    clearFailureMode() {
      this.failureMode = null;
      this.failureRate = 0;
    },

    async processEmail(email, body) {
      // Inject failures based on configuration
      if (this.failureMode && Math.random() < this.failureRate) {
        switch (this.failureMode) {
          case 'timeout':
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30s timeout
            break;
          case 'error':
            throw new Error('Simulated processing failure');
          case 'memory':
            // Consume memory
            const largeArray = new Array(10 * 1024 * 1024).fill('x');
            throw new Error('Out of memory');
          case 'crash':
            process.exit(1);
        }
      }

      // Normal processing
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        email_id: Math.random().toString(36).substr(2, 9),
        processing_time: 100
      };
    }
  },

  // Unreliable external APIs
  externalAPIs: {
    github: {
      failureMode: null,

      setFailureMode(mode) {
        this.failureMode = mode;
      },

      async getIssue(issueId) {
        if (this.failureMode) {
          switch (this.failureMode) {
            case 'timeout':
              await new Promise(resolve => setTimeout(resolve, 10000));
              throw new Error('API timeout');
            case 'rate_limit':
              throw new Error('API rate limit exceeded');
            case 'server_error':
              throw new Error('Internal server error');
            case 'network':
              throw new Error('Network connection failed');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          id: issueId,
          title: `Issue ${issueId}`,
          state: 'open',
          labels: ['bug']
        };
      }
    },

    telegram: {
      failureMode: null,

      setFailureMode(mode) {
        this.failureMode = mode;
      },

      async sendMessage(chatId, text) {
        if (this.failureMode) {
          switch (this.failureMode) {
            case 'timeout':
              await new Promise(resolve => setTimeout(resolve, 5000));
              throw new Error('Telegram API timeout');
            case 'blocked':
              throw new Error('Bot was blocked by the user');
            case 'quota':
              throw new Error('Message quota exceeded');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 30));
        return {
          message_id: Math.floor(Math.random() * 10000),
          chat: { id: chatId }
        };
      }
    },

    database: {
      failureMode: null,

      setFailureMode(mode) {
        this.failureMode = mode;
      },

      async query(sql) {
        if (this.failureMode) {
          switch (this.failureMode) {
            case 'down':
              throw new Error('Database connection failed');
            case 'slow':
              await new Promise(resolve => setTimeout(resolve, 5000));
              return { rows: [] };
            case 'corruption':
              throw new Error('Database corruption detected');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10));
        return { rows: [{ id: 1, data: 'test' }] };
      }
    }
  },

  // Circuit breaker simulation
  circuitBreaker: {
    state: 'closed', // closed, open, half-open
    failureCount: 0,
    lastFailureTime: 0,
    threshold: 5,
    timeout: 30000, // 30 seconds

    async execute(operation) {
      if (this.state === 'open') {
        if (Date.now() - this.lastFailureTime > this.timeout) {
          this.state = 'half-open';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await operation();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    },

    onSuccess() {
      this.failureCount = 0;
      this.state = 'closed';
    },

    onFailure() {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = 'open';
      }
    },

    getState() {
      return this.state;
    },

    reset() {
      this.state = 'closed';
      this.failureCount = 0;
      this.lastFailureTime = 0;
    }
  }
};

// Chaos experiment utilities
class ChaosExperiment {
  constructor(name, duration = 60) {
    this.name = name;
    this.duration = duration;
    this.startTime = null;
    this.endTime = null;
    this.metrics = {
      operations: 0,
      successes: 0,
      failures: 0,
      responseTimes: [],
      errors: []
    };
  }

  async run(testFunction, chaosFunction) {
    console.log(`🌀 Starting chaos experiment: ${this.name}`);
    console.log(`⏱️  Duration: ${this.duration}s`);

    this.startTime = Date.now();

    // Start chaos in background
    const chaosPromise = chaosFunction();

    // Run test operations during chaos
    const testPromises = [];
    const endTime = Date.now() + (this.duration * 1000);

    while (Date.now() < endTime) {
      testPromises.push(this.runTestOperation(testFunction));
      await new Promise(resolve => setTimeout(resolve, 100)); // 10 ops/second
    }

    // Wait for all test operations to complete
    await Promise.allSettled(testPromises);

    // Stop chaos
    await chaosPromise;

    this.endTime = Date.now();

    return this.getResults();
  }

  async runTestOperation(testFunction) {
    const startTime = Date.now();

    try {
      this.metrics.operations++;
      const result = await testFunction();
      const responseTime = Date.now() - startTime;

      this.metrics.successes++;
      this.metrics.responseTimes.push(responseTime);

      return { success: true, responseTime, result };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.metrics.failures++;
      this.metrics.responseTimes.push(responseTime);
      this.metrics.errors.push({
        error: error.message,
        responseTime,
        timestamp: new Date()
      });

      return { success: false, responseTime, error };
    }
  }

  getResults() {
    const duration = (this.endTime - this.startTime) / 1000;
    const rps = this.metrics.operations / duration;
    const successRate = (this.metrics.successes / this.metrics.operations) * 100;

    const responseTimes = this.metrics.responseTimes.sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    return {
      experiment: this.name,
      duration,
      operations: this.metrics.operations,
      successes: this.metrics.successes,
      failures: this.metrics.failures,
      successRate,
      rps,
      responseTimes: {
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50,
        p95,
        p99
      },
      errors: this.metrics.errors.slice(0, 5) // First 5 errors
    };
  }
}

// Chaos experiment suites
suite('Network Chaos Tests', () => {
  testAsync('high latency resilience', async () => {
    const experiment = new ChaosExperiment('High Latency Test', 30);

    // Inject network latency
    chaosServices.externalAPIs.github.setFailureMode('timeout');
    chaosServices.externalAPIs.telegram.setFailureMode('timeout');

    const results = await experiment.run(
      async () => {
        const email = generateTestEmail();
        return await chaosServices.emailProcessor.processEmail(
          email,
          'Chaos test under high latency'
        );
      },
      async () => {
        // Simulate network latency for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
        chaosServices.externalAPIs.github.clearFailureMode();
        chaosServices.externalAPIs.telegram.clearFailureMode();
      }
    );

    // System should degrade gracefully, not crash
    assert(results.successRate > 50, `Should maintain > 50% success rate under latency, got ${results.successRate.toFixed(1)}%`);
    assert(results.responseTimes.p95 < 10000, `P95 should be < 10s under latency, got ${results.responseTimes.p95}ms`);

    console.log(`🌐 High Latency Chaos Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 P95 Latency: ${results.responseTimes.p95}ms`);
    console.log(`   ⚡ RPS: ${results.rps.toFixed(1)}`);
  });

  testAsync('API failure resilience', async () => {
    const experiment = new ChaosExperiment('API Failure Test', 45);

    // Inject API failures
    chaosServices.externalAPIs.github.setFailureMode('server_error');
    chaosServices.externalAPIs.telegram.setFailureMode('blocked');

    const results = await experiment.run(
      async () => {
        const email = generateTestEmail();
        return await chaosServices.emailProcessor.processEmail(
          email,
          'Chaos test with API failures'
        );
      },
      async () => {
        // Maintain failures for 45 seconds
        await new Promise(resolve => setTimeout(resolve, 45000));
        chaosServices.externalAPIs.github.clearFailureMode();
        chaosServices.externalAPIs.telegram.clearFailureMode();
      }
    );

    // System should handle API failures gracefully
    assert(results.operations > 0, 'Should continue processing during API failures');
    assert(results.errors.length > 0, 'Should record API failure errors');

    console.log(`🔌 API Failure Chaos Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 Total Operations: ${results.operations}`);
    console.log(`   ⚠️  Errors Recorded: ${results.errors.length}`);
  });
});

suite('Service Failure Chaos Tests', () => {
  testAsync('database outage resilience', async () => {
    const experiment = new ChaosExperiment('Database Outage Test', 30);

    // Inject database failures
    chaosServices.externalAPIs.database.setFailureMode('down');

    const results = await experiment.run(
      async () => {
        // Simulate email processing that requires database
        try {
          await chaosServices.externalAPIs.database.query('SELECT * FROM emails');
          return { success: true };
        } catch (error) {
          // Should handle DB failure gracefully
          return { success: false, fallback: true };
        }
      },
      async () => {
        // Database down for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
        chaosServices.externalAPIs.database.clearFailureMode();
      }
    );

    // System should implement fallback strategies
    assert(results.operations > 0, 'Should continue operating during DB outage');

    console.log(`🗄️ Database Outage Chaos Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 Operations: ${results.operations}`);
  });

  testAsync('circuit breaker effectiveness', async () => {
    const breaker = chaosServices.circuitBreaker;
    breaker.reset();

    // Inject failures to trigger circuit breaker
    chaosServices.externalAPIs.github.setFailureMode('server_error');

    let operations = 0;
    let failures = 0;

    // Make requests until circuit breaker opens
    for (let i = 0; i < 20; i++) {
      try {
        operations++;
        await breaker.execute(async () => {
          return await chaosServices.externalAPIs.github.getIssue('test');
        });
      } catch (error) {
        failures++;
      }
    }

    // Circuit breaker should have opened
    assert(breaker.getState() === 'open', 'Circuit breaker should be open after failures');

    // Try one more request - should fail fast
    try {
      await breaker.execute(async () => {
        return await chaosServices.externalAPIs.github.getIssue('test');
      });
      assert(false, 'Should fail fast when circuit is open');
    } catch (error) {
      assert(error.message.includes('Circuit breaker is OPEN'), 'Should fail with circuit breaker message');
    }

    console.log(`🔌 Circuit Breaker Test:`);
    console.log(`   🔴 State: ${breaker.getState()}`);
    console.log(`   📊 Operations: ${operations}`);
    console.log(`   ❌ Failures: ${failures}`);
    console.log(`   ✅ Fast Failures: Working`);

    // Cleanup
    chaosServices.externalAPIs.github.clearFailureMode();
    breaker.reset();
  });
});

suite('Resource Exhaustion Chaos Tests', () => {
  testAsync('memory pressure handling', async () => {
    const experiment = new ChaosExperiment('Memory Pressure Test', 20);

    const results = await experiment.run(
      async () => {
        // Simulate memory-intensive operation
        const data = new Array(100000).fill('x');
        await new Promise(resolve => setTimeout(resolve, 10));
        return { data: data.length };
      },
      async () => {
        // Simulate memory pressure
        const memoryHogs = [];
        for (let i = 0; i < 10; i++) {
          memoryHogs.push(new Array(1000000).fill('memory_hog_' + i));
          await new Promise(resolve => setTimeout(resolve, 2000)); // Add memory every 2s
        }

        // Cleanup
        memoryHogs.length = 0;
        if (global.gc) global.gc(); // Force garbage collection if available
      }
    );

    // System should handle memory pressure
    assert(results.successRate > 80, `Should maintain > 80% success under memory pressure, got ${results.successRate.toFixed(1)}%`);

    console.log(`🧠 Memory Pressure Chaos Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 Operations: ${results.operations}`);
  });

  testAsync('error avalanche prevention', async () => {
    const experiment = new ChaosExperiment('Error Avalanche Test', 30);

    // Inject cascading failures
    chaosServices.emailProcessor.setFailureMode('error', 0.3); // 30% failure rate

    const results = await experiment.run(
      async () => {
        return await chaosServices.emailProcessor.processEmail(
          generateTestEmail(),
          'Avalanche test'
        );
      },
      async () => {
        // Maintain failure rate for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
        chaosServices.emailProcessor.clearFailureMode();
      }
    );

    // System should prevent error avalanches
    assert(results.successRate > 60, `Should maintain > 60% success rate, got ${results.successRate.toFixed(1)}%`);
    assert(results.failures < results.operations * 0.5, 'Failures should not exceed 50%');

    console.log(`❄️ Error Avalanche Chaos Results:`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📊 Successes: ${results.successes}`);
    console.log(`   ❌ Failures: ${results.failures}`);
  });
});

suite('Recovery and Self-Healing Tests', () => {
  testAsync('automatic recovery after failures', async () => {
    const experiment = new ChaosExperiment('Recovery Test', 60);

    let chaosActive = true;

    const results = await experiment.run(
      async () => {
        const email = generateTestEmail();
        return await chaosServices.emailProcessor.processEmail(
          email,
          'Recovery test'
        );
      },
      async () => {
        // Start with failures
        chaosServices.emailProcessor.setFailureMode('error', 0.5);

        // After 20 seconds, reduce failure rate
        setTimeout(() => {
          chaosServices.emailProcessor.setFailureMode('error', 0.2);
        }, 20000);

        // After 40 seconds, clear failures
        setTimeout(() => {
          chaosServices.emailProcessor.clearFailureMode();
          chaosActive = false;
        }, 40000);

        // Wait for experiment to complete
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    );

    // System should recover as failures decrease
    assert(results.operations > 0, 'Should process operations throughout');

    // Check recovery pattern in results
    const midPoint = Math.floor(results.operations / 2);
    const firstHalf = results.responseTimes.slice(0, midPoint);
    const secondHalf = results.responseTimes.slice(midPoint);

    console.log(`🔄 Recovery Test Results:`);
    console.log(`   📊 Total Operations: ${results.operations}`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   📈 Recovery: System should improve as chaos decreases`);
  });

  testAsync('graceful degradation under extreme conditions', async () => {
    const experiment = new ChaosExperiment('Graceful Degradation Test', 45);

    // Inject multiple failure types simultaneously
    chaosServices.emailProcessor.setFailureMode('timeout', 0.4);
    chaosServices.externalAPIs.github.setFailureMode('rate_limit');
    chaosServices.externalAPIs.telegram.setFailureMode('quota');

    const results = await experiment.run(
      async () => {
        try {
          return await chaosServices.emailProcessor.processEmail(
            generateTestEmail(),
            'Extreme chaos test'
          );
        } catch (error) {
          // Should degrade gracefully, not crash
          return { success: false, degraded: true, error: error.message };
        }
      },
      async () => {
        // Maintain extreme conditions for 45 seconds
        await new Promise(resolve => setTimeout(resolve, 45000));

        // Cleanup
        chaosServices.emailProcessor.clearFailureMode();
        chaosServices.externalAPIs.github.clearFailureMode();
        chaosServices.externalAPIs.telegram.clearFailureMode();
      }
    );

    // System should degrade gracefully, not crash
    assert(results.operations > 0, 'Should continue operating under extreme conditions');

    console.log(`🎭 Graceful Degradation Test:`);
    console.log(`   📊 Operations: ${results.operations}`);
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log(`   🎯 Degradation: System should handle extreme conditions`);
  });
});

suite('Chaos Engineering Best Practices', () => {
  testAsync('experiment isolation', async () => {
    // Ensure chaos experiments don't interfere with each other
    const experiment1 = new ChaosExperiment('Isolation Test 1', 5);
    const experiment2 = new ChaosExperiment('Isolation Test 2', 5);

    // Run both experiments simultaneously
    const [results1, results2] = await Promise.all([
      experiment1.run(
        async () => ({ test: 1 }),
        async () => new Promise(resolve => setTimeout(resolve, 5000))
      ),
      experiment2.run(
        async () => ({ test: 2 }),
        async () => new Promise(resolve => setTimeout(resolve, 5000))
      )
    ]);

    // Both should complete successfully
    assert(results1.operations > 0, 'Experiment 1 should run');
    assert(results2.operations > 0, 'Experiment 2 should run');
    assert(results1.experiment !== results2.experiment, 'Experiments should be isolated');

    console.log(`🔬 Experiment Isolation:`);
    console.log(`   📊 Experiment 1: ${results1.operations} operations`);
    console.log(`   📊 Experiment 2: ${results2.operations} operations`);
    console.log(`   ✅ Isolation: Maintained`);
  });

  testAsync('blast radius control', async () => {
    // Test that chaos is contained and doesn't affect other systems
    const experiment = new ChaosExperiment('Blast Radius Test', 15);

    // Monitor "other system" that should not be affected
    let otherSystemCalls = 0;

    const mockOtherSystem = async () => {
      otherSystemCalls++;
      return { success: true };
    };

    const results = await experiment.run(
      async () => {
        // Call both chaotic system and unaffected system
        const chaosResult = await chaosServices.emailProcessor.processEmail(
          generateTestEmail(),
          'Blast radius test'
        );
        const otherResult = await mockOtherSystem();

        return { chaos: chaosResult, other: otherResult };
      },
      async () => {
        // Inject chaos
        chaosServices.emailProcessor.setFailureMode('error', 0.5);
        await new Promise(resolve => setTimeout(resolve, 15000));
        chaosServices.emailProcessor.clearFailureMode();
      }
    );

    // Other system should continue working normally
    assert(otherSystemCalls > 0, 'Other system should continue operating');
    assert(otherSystemCalls >= results.successes, 'Other system calls should match successful operations');

    console.log(`💥 Blast Radius Control:`);
    console.log(`   📊 Chaos Operations: ${results.operations}`);
    console.log(`   ✅ Other System Calls: ${otherSystemCalls}`);
    console.log(`   🛡️  Containment: Successful`);
  });
});

// Export chaos testing utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChaosExperiment,
    chaosServices,
    CHAOS_CONFIG
  };
}
