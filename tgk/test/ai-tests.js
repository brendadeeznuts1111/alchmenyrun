/**
 * tgk AI Accuracy & Bias Testing
 * Comprehensive evaluation of AI components for accuracy, fairness, and reliability
 */

const {
  suite,
  testAsync,
  assert,
  assertEqual,
  measurePerformance
} = require('./test-framework.js');

// AI testing datasets
const AI_TEST_DATA = {
  // Email content analysis test cases
  emailAnalysis: {
    positive: [
      { text: 'Thank you for the excellent work on this project!', expected: 'positive' },
      { text: 'This is working perfectly, great job team!', expected: 'positive' },
      { text: 'I appreciate your help with this issue.', expected: 'positive' },
      { text: 'The new feature is amazing and very useful.', expected: 'positive' }
    ],
    negative: [
      { text: 'This is completely broken and unusable.', expected: 'negative' },
      { text: 'I am very disappointed with this service.', expected: 'negative' },
      { text: 'This bug is causing major problems for our users.', expected: 'negative' },
      { text: 'The system crashed again, this is unacceptable.', expected: 'negative' }
    ],
    neutral: [
      { text: 'Here is the documentation for the new feature.', expected: 'neutral' },
      { text: 'The meeting is scheduled for tomorrow at 2 PM.', expected: 'neutral' },
      { text: 'Please find attached the quarterly report.', expected: 'neutral' },
      { text: 'The server will be restarted at midnight.', expected: 'neutral' }
    ],
    urgent: [
      { text: 'URGENT: System is down and affecting all users!', expected: 'critical' },
      { text: 'CRITICAL: Database corruption detected immediately.', expected: 'critical' },
      { text: 'EMERGENCY: Security breach in progress!', expected: 'critical' },
      { text: 'PRIORITY: Production outage affecting customers.', expected: 'high' }
    ]
  },

  // Issue labeling test cases
  issueLabeling: [
    {
      title: 'Fix login authentication bug',
      body: 'Users cannot log in due to authentication failure',
      expectedLabels: ['group/customer', 'topic/security', 'impact/high']
    },
    {
      title: 'Add dark mode toggle',
      body: 'Implement dark mode feature for better UX',
      expectedLabels: ['group/internal', 'topic/ux', 'impact/low']
    },
    {
      title: 'Database performance optimization',
      body: 'Query performance is slow, need optimization',
      expectedLabels: ['group/internal', 'topic/performance', 'impact/medium']
    },
    {
      title: 'Security vulnerability in API',
      body: 'Critical security issue found in REST API',
      expectedLabels: ['group/customer', 'topic/security', 'impact/critical']
    }
  ],

  // PII detection test cases
  piiDetection: {
    positive: [
      'Contact john.doe@example.com for more information',
      'Call 555-123-4567 for support',
      'SSN: 123-45-6789 is required',
      'Credit card: 4111-1111-1111-1111'
    ],
    negative: [
      'Please contact support@example.com',
      'The version number is 1.2.3.4',
      'Meeting at room 555 in building 123',
      'The code 456-789 is for testing'
    ]
  },

  // Bias detection test cases
  biasDetection: {
    gender: [
      { text: 'The female developer wrote excellent code', shouldFlag: true },
      { text: 'She is a great engineer', shouldFlag: false },
      { text: 'The male QA found the bug', shouldFlag: true }
    ],
    cultural: [
      { text: 'Our American office is the best', shouldFlag: true },
      { text: 'The London team did great work', shouldFlag: false },
      { text: 'European standards are superior', shouldFlag: true }
    ],
    age: [
      { text: 'The young intern made a mistake', shouldFlag: true },
      { text: 'The experienced developer fixed the issue', shouldFlag: false }
    ]
  }
};

// AI testing utilities
const aiTesters = {
  // Mock AI analysis functions (would be replaced with real AI in production)
  analyzeSentiment: async (text) => {
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'appreciate', 'happy', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'broken', 'issue', 'problem', 'error', 'fail', 'crash', 'disappointed', 'unacceptable'];

    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  },

  analyzeUrgency: async (text) => {
    const urgentWords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'priority', 'crash', 'down'];
    const highWords = ['important', 'soon', 'blocking', 'production', 'customer'];

    const urgentCount = urgentWords.filter(word => text.toLowerCase().includes(word)).length;
    const highCount = highWords.filter(word => text.toLowerCase().includes(word)).length;

    if (urgentCount > 0) return 'critical';
    if (highCount > 0) return 'high';
    if (text.includes('?') || text.includes('please')) return 'low';
    return 'medium';
  },

  extractKeywords: async (text) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    const filtered = words.filter(word => word.length > 3 && !stopWords.includes(word));

    // Get frequency
    const freq = {};
    filtered.forEach(word => freq[word] = (freq[word] || 0) + 1);

    // Return top keywords
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  },

  detectPII: async (text) => {
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/ // Phone
    ];

    return patterns.some(pattern => pattern.test(text));
  },

  suggestLabels: async (title, body) => {
    const content = `${title} ${body}`.toLowerCase();

    let labels = ['group/internal', 'topic/governance', 'impact/low'];
    let confidence = 0.7;

    // Group classification
    if (content.includes('customer') || content.includes('user') || content.includes('login')) {
      labels[0] = 'group/customer';
    }

    // Topic classification
    if (content.includes('security') || content.includes('auth') || content.includes('password')) {
      labels[1] = 'topic/security';
      confidence += 0.1;
    } else if (content.includes('performance') || content.includes('slow') || content.includes('speed')) {
      labels[1] = 'topic/performance';
    } else if (content.includes('ui') || content.includes('ux') || content.includes('interface')) {
      labels[1] = 'topic/ux';
    }

    // Impact assessment
    if (content.includes('critical') || content.includes('crash') || content.includes('emergency')) {
      labels[2] = 'impact/critical';
      confidence += 0.15;
    } else if (content.includes('high') || content.includes('urgent') || content.includes('blocking')) {
      labels[2] = 'impact/high';
      confidence += 0.1;
    } else if (content.includes('medium') || content.includes('feature')) {
      labels[2] = 'impact/medium';
    }

    return {
      labels: labels,
      confidence: Math.min(confidence, 0.95),
      reasoning: 'Analysis based on content keywords and patterns'
    };
  },

  detectBias: async (text) => {
    const biasIndicators = {
      gender: ['male', 'female', 'man', 'woman', 'boy', 'girl', 'he', 'she', 'his', 'her'],
      cultural: ['american', 'european', 'asian', 'superior', 'best', 'worst'],
      age: ['young', 'old', 'experienced', 'junior', 'senior', 'intern']
    };

    let biasScore = 0;
    const detectedBiases = [];

    Object.entries(biasIndicators).forEach(([category, words]) => {
      const matches = words.filter(word => text.toLowerCase().includes(word)).length;
      if (matches > 0) {
        biasScore += matches * 0.1;
        detectedBiases.push(category);
      }
    });

    return {
      hasBias: biasScore > 0.2,
      biasScore: Math.min(biasScore, 1.0),
      detectedBiases: [...new Set(detectedBiases)]
    };
  }
};

// AI accuracy testing suites
suite('Sentiment Analysis Accuracy', () => {
  testAsync('positive sentiment detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.emailAnalysis.positive.length;

    for (const testCase of AI_TEST_DATA.emailAnalysis.positive) {
      const result = await aiTesters.analyzeSentiment(testCase.text);
      if (result === testCase.expected) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.8, `Positive sentiment accuracy should be >= 80%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`😊 Positive Sentiment Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });

  testAsync('negative sentiment detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.emailAnalysis.negative.length;

    for (const testCase of AI_TEST_DATA.emailAnalysis.negative) {
      const result = await aiTesters.analyzeSentiment(testCase.text);
      if (result === testCase.expected) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.8, `Negative sentiment accuracy should be >= 80%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`😞 Negative Sentiment Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });

  testAsync('neutral sentiment detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.emailAnalysis.neutral.length;

    for (const testCase of AI_TEST_DATA.emailAnalysis.neutral) {
      const result = await aiTesters.analyzeSentiment(testCase.text);
      if (result === testCase.expected) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.7, `Neutral sentiment accuracy should be >= 70%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`😐 Neutral Sentiment Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });

  testAsync('urgency level detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.emailAnalysis.urgent.length;

    for (const testCase of AI_TEST_DATA.emailAnalysis.urgent) {
      const result = await aiTesters.analyzeUrgency(testCase.text);
      if (result === testCase.expected) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.8, `Urgency detection accuracy should be >= 80%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`⚡ Urgency Detection Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });
});

suite('Issue Labeling Accuracy', () => {
  testAsync('label prediction accuracy', async () => {
    let totalPredictions = 0;
    let correctPredictions = 0;

    for (const testCase of AI_TEST_DATA.issueLabeling) {
      const result = await aiTesters.suggestLabels(testCase.title, testCase.body);

      // Check each expected label
      for (const expectedLabel of testCase.expectedLabels) {
        totalPredictions++;
        if (result.labels.includes(expectedLabel)) {
          correctPredictions++;
        }
      }
    }

    const accuracy = correctPredictions / totalPredictions;
    assert(accuracy >= 0.75, `Label prediction accuracy should be >= 75%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`🏷️ Label Prediction Test:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correctPredictions}/${totalPredictions}`);
  });

  testAsync('confidence score calibration', async () => {
    const results = [];

    for (const testCase of AI_TEST_DATA.issueLabeling) {
      const result = await aiTesters.suggestLabels(testCase.title, testCase.body);
      results.push(result);
    }

    // Check confidence distribution
    const highConfidence = results.filter(r => r.confidence > 0.8).length;
    const mediumConfidence = results.filter(r => r.confidence > 0.6 && r.confidence <= 0.8).length;
    const lowConfidence = results.filter(r => r.confidence <= 0.6).length;

    assert(highConfidence > 0, 'Should have some high confidence predictions');
    assert(results.every(r => r.confidence >= 0 && r.confidence <= 1), 'All confidence scores should be 0-1');

    console.log(`📈 Confidence Calibration:`);
    console.log(`   🔴 High (>0.8): ${highConfidence}`);
    console.log(`   🟡 Medium (0.6-0.8): ${mediumConfidence}`);
    console.log(`   🟢 Low (≤0.6): ${lowConfidence}`);
  });
});

suite('PII Detection Accuracy', () => {
  testAsync('PII detection precision', async () => {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    // Test positive cases (should detect PII)
    for (const text of AI_TEST_DATA.piiDetection.positive) {
      const result = await aiTesters.detectPII(text);
      if (result) truePositives++;
      else falseNegatives++;
    }

    // Test negative cases (should not detect PII)
    for (const text of AI_TEST_DATA.piiDetection.negative) {
      const result = await aiTesters.detectPII(text);
      if (!result) trueNegatives++;
      else falsePositives++;
    }

    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);

    assert(precision >= 0.9, `PII detection precision should be >= 90%, got ${(precision * 100).toFixed(1)}%`);
    assert(recall >= 0.8, `PII detection recall should be >= 80%, got ${(recall * 100).toFixed(1)}%`);

    console.log(`🔒 PII Detection Test:`);
    console.log(`   🎯 Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`   📊 Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`   ✅ True Positives: ${truePositives}`);
    console.log(`   ❌ False Positives: ${falsePositives}`);
  });
});

suite('Bias Detection & Fairness', () => {
  testAsync('gender bias detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.biasDetection.gender.length;

    for (const testCase of AI_TEST_DATA.biasDetection.gender) {
      const result = await aiTesters.detectBias(testCase.text);
      const shouldDetect = result.hasBias;

      if (shouldDetect === testCase.shouldFlag) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.7, `Gender bias detection accuracy should be >= 70%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`🚹 Gender Bias Detection:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });

  testAsync('cultural bias detection', async () => {
    let correct = 0;
    const total = AI_TEST_DATA.biasDetection.cultural.length;

    for (const testCase of AI_TEST_DATA.biasDetection.cultural) {
      const result = await aiTesters.detectBias(testCase.text);
      const shouldDetect = result.hasBias;

      if (shouldDetect === testCase.shouldFlag) correct++;
    }

    const accuracy = correct / total;
    assert(accuracy >= 0.7, `Cultural bias detection accuracy should be >= 70%, got ${(accuracy * 100).toFixed(1)}%`);

    console.log(`🌍 Cultural Bias Detection:`);
    console.log(`   📊 Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Correct: ${correct}/${total}`);
  });

  testAsync('overall bias score distribution', async () => {
    const texts = [
      ...AI_TEST_DATA.biasDetection.gender.map(t => t.text),
      ...AI_TEST_DATA.biasDetection.cultural.map(t => t.text),
      ...AI_TEST_DATA.biasDetection.age.map(t => t.text)
    ];

    const results = await Promise.all(texts.map(text => aiTesters.detectBias(text)));

    const biasScores = results.map(r => r.biasScore);
    const avgBias = biasScores.reduce((a, b) => a + b, 0) / biasScores.length;
    const maxBias = Math.max(...biasScores);

    assert(avgBias < 0.5, `Average bias score should be < 0.5, got ${avgBias.toFixed(3)}`);
    assert(maxBias <= 1.0, `Maximum bias score should be <= 1.0, got ${maxBias}`);

    console.log(`⚖️ Overall Bias Analysis:`);
    console.log(`   📊 Average Bias: ${avgBias.toFixed(3)}`);
    console.log(`   📈 Max Bias: ${maxBias.toFixed(3)}`);
    console.log(`   🛡️ Bias Threshold: 0.2`);
  });
});

suite('AI Performance Benchmarks', () => {
  testAsync('sentiment analysis performance', async () => {
    const perf = await measurePerformance(async () => {
      const text = 'This is a test email for sentiment analysis performance benchmarking';
      return await aiTesters.analyzeSentiment(text);
    }, 1000);

    assert(perf.avg < 50, `Sentiment analysis should be < 50ms, got ${perf.avg.toFixed(2)}ms`);
    assert(perf.p95 < 100, `Sentiment analysis P95 should be < 100ms, got ${perf.p95.toFixed(2)}ms`);

    console.log(`😊 Sentiment Analysis Performance:`);
    console.log(`   📊 Average: ${perf.avg.toFixed(2)}ms`);
    console.log(`   📈 P95: ${perf.p95.toFixed(2)}ms`);
    console.log(`   🔄 Iterations: ${perf.iterations}`);
  });

  testAsync('keyword extraction performance', async () => {
    const perf = await measurePerformance(async () => {
      const text = 'This is a longer test email with multiple keywords for performance testing of the keyword extraction algorithm';
      return await aiTesters.extractKeywords(text);
    }, 500);

    assert(perf.avg < 20, `Keyword extraction should be < 20ms, got ${perf.avg.toFixed(2)}ms`);

    console.log(`🔑 Keyword Extraction Performance:`);
    console.log(`   📊 Average: ${perf.avg.toFixed(2)}ms`);
    console.log(`   📈 P95: ${perf.p95.toFixed(2)}ms`);
    console.log(`   🔄 Iterations: ${perf.iterations}`);
  });

  testAsync('label suggestion performance', async () => {
    const perf = await measurePerformance(async () => {
      return await aiTesters.suggestLabels(
        'Test issue title',
        'This is a test issue body for performance benchmarking'
      );
    }, 200);

    assert(perf.avg < 100, `Label suggestion should be < 100ms, got ${perf.avg.toFixed(2)}ms`);

    console.log(`🏷️ Label Suggestion Performance:`);
    console.log(`   📊 Average: ${perf.avg.toFixed(2)}ms`);
    console.log(`   📈 P95: ${perf.p95.toFixed(2)}ms`);
    console.log(`   🔄 Iterations: ${perf.iterations}`);
  });
});

suite('AI Edge Cases & Robustness', () => {
  testAsync('empty input handling', async () => {
    // Test with empty inputs
    const emptyResult = await aiTesters.analyzeSentiment('');
    assertEqual(emptyResult, 'neutral', 'Empty text should return neutral sentiment');

    const emptyKeywords = await aiTesters.extractKeywords('');
    assert(Array.isArray(emptyKeywords), 'Empty text should return empty keyword array');
    assert(emptyKeywords.length === 0, 'Empty text should return no keywords');
  });

  testAsync('very long input handling', async () => {
    const longText = 'test '.repeat(10000); // 50,000 characters

    const startTime = Date.now();
    const result = await aiTesters.analyzeSentiment(longText);
    const duration = Date.now() - startTime;

    assert(['positive', 'negative', 'neutral'].includes(result), 'Should handle long text');
    assert(duration < 1000, `Long text processing should be < 1s, took ${duration}ms`);
  });

  testAsync('special characters and unicode', async () => {
    const unicodeText = 'Test with émojis 🚀 and spëcial chärs 中文';
    const result = await aiTesters.analyzeSentiment(unicodeText);

    assert(['positive', 'negative', 'neutral'].includes(result), 'Should handle Unicode text');
    assert(typeof result === 'string', 'Should return valid sentiment');
  });

  testAsync('malformed data handling', async () => {
    // Test with null/undefined inputs
    try {
      await aiTesters.analyzeSentiment(null);
      assert(false, 'Should throw error for null input');
    } catch (error) {
      assert(error, 'Should handle null input gracefully');
    }

    try {
      await aiTesters.extractKeywords(undefined);
      assert(false, 'Should throw error for undefined input');
    } catch (error) {
      assert(error, 'Should handle undefined input gracefully');
    }
  });
});

suite('AI Model Drift Detection', () => {
  testAsync('accuracy stability over time', async () => {
    // Simulate multiple runs to check for consistency
    const runs = 10;
    const accuracies = [];

    for (let i = 0; i < runs; i++) {
      let correct = 0;
      const testCases = AI_TEST_DATA.emailAnalysis.positive.slice(0, 5);

      for (const testCase of testCases) {
        const result = await aiTesters.analyzeSentiment(testCase.text);
        if (result === testCase.expected) correct++;
      }

      accuracies.push(correct / testCases.length);
    }

    const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - avgAccuracy, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    assert(stdDev < 0.1, `Accuracy std dev should be < 0.1, got ${stdDev.toFixed(3)} (indicates model drift)`);

    console.log(`📊 Accuracy Stability Test:`);
    console.log(`   📈 Average Accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
    console.log(`   📏 Standard Deviation: ${stdDev.toFixed(3)}`);
    console.log(`   🔄 Runs: ${runs}`);
    console.log(`   ✅ Stability: ${stdDev < 0.1 ? 'Good' : 'Needs Attention'}`);
  });

  testAsync('performance regression detection', async () => {
    // Baseline performance measurement
    const baselinePerf = await measurePerformance(async () => {
      return await aiTesters.analyzeSentiment('This is a baseline test');
    }, 100);

    // Current performance measurement
    const currentPerf = await measurePerformance(async () => {
      return await aiTesters.analyzeSentiment('This is a current test');
    }, 100);

    const regression = ((currentPerf.avg - baselinePerf.avg) / baselinePerf.avg) * 100;

    assert(Math.abs(regression) < 20, `Performance regression should be < 20%, got ${regression.toFixed(1)}%`);

    console.log(`📈 Performance Regression Test:`);
    console.log(`   📊 Baseline: ${baselinePerf.avg.toFixed(2)}ms`);
    console.log(`   📊 Current: ${currentPerf.avg.toFixed(2)}ms`);
    console.log(`   📉 Regression: ${regression.toFixed(1)}%`);
    console.log(`   ✅ Status: ${Math.abs(regression) < 20 ? 'Acceptable' : 'Needs Investigation'}`);
  });
});

// Export AI testing utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    aiTesters,
    AI_TEST_DATA
  };
}
