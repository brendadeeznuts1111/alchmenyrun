#!/usr/bin/env bun
/**
 * Kinja Integration Test Script
 * Validates the Kinja-enhanced email orchestration system
 */

import { KinjaEmailOrchestrator } from '../tgk/email';

async function testKinjaIntegration() {
  console.log('🧪 Testing Kinja-Enhanced Email Orchestration\n');

  const orchestrator = new KinjaEmailOrchestrator();

  // Test emails with different scenarios
  const testEmails = [
    {
      to: 'infra.lead.pr.p0.gh@cloudflare.com',
      from: 'notifications@github.com',
      subject: 'Critical PR: Database outage fix',
      body: 'This PR fixes the production database outage that occurred immediately. Need urgent review asap.',
      expectedPriority: 'p0',
      scenario: 'Critical Infrastructure Issue'
    },
    {
      to: 'docs.senior.issue.p2.tg@cloudflare.com',
      from: 'user@company.com',
      subject: 'Documentation unclear',
      body: 'The API documentation is confusing and needs updates. Please review when you have time.',
      expectedPriority: 'p2',
      scenario: 'Documentation Request'
    },
    {
      to: 'qa.bot.alert.blk.24h@cloudflare.com',
      from: 'ci@cloudflare.com',
      subject: 'CI Pipeline Broken',
      body: 'All tests are failing due to recent changes. This is blocking the release.',
      expectedPriority: 'blk',
      scenario: 'CI Pipeline Failure'
    }
  ];

  for (const email of testEmails) {
    console.log(`📧 Testing: ${email.scenario}`);
    console.log(`   Email: ${email.to}`);
    console.log(`   Subject: ${email.subject}`);

    try {
      const result = await orchestrator.processEmailWithKinja(email);

      console.log(`✅ Processed successfully`);
      console.log(`   Routing: ${result.routing.domain}.${result.routing.scope}`);
      console.log(`   Priority: ${result.kinjaAnalysis.calibratedPriority} (expected: ${email.expectedPriority})`);
      console.log(`   Time to Answer: ${result.kinjaAnalysis.timeToAnswer}h`);
      console.log(`   Correctness: ${(result.kinjaAnalysis.correctnessScore * 100).toFixed(0)}%`);
      console.log(`   Actions: ${result.kinjaAnalysis.recommendedActions.length} recommended`);
      console.log(`   Telegram: ${result.telegramMessage.substring(0, 50)}...`);

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }

    console.log('─'.repeat(60));
  }

  console.log('🎉 Kinja integration test completed!');
  console.log('📊 Check the results above for temporal intelligence, correctness scoring, and priority calibration.');
}

if (import.meta.main) {
  testKinjaIntegration().catch(console.error);
}
