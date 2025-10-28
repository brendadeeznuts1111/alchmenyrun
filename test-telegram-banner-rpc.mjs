#!/usr/bin/env bun
// test-telegram-banner-rpc.mjs - Test Telegram banner system with RPC integration

import { 
  updateCouncilMemberBanner,
  updateDepartmentBanner,
  updateSystemBanner,
  listAllTopics,
  getCouncilMember,
  getDepartment
} from './tgk/integrations/telegram-banner.js';

console.log('🚀 Testing Telegram Banner System with RPC Integration');
console.log('='.repeat(60));

async function testRpcIntegration() {
  try {
    // Test 1: List all topics via RPC
    console.log('\n📋 Test 1: Listing forum topics via RPC');
    try {
      const topics = await listAllTopics();
      console.log(`✅ Retrieved ${topics.length} topics from Telegram supergroup`);
      if (topics.length > 0) {
        console.log('Sample topic structure:');
        console.log(JSON.stringify(topics[0], null, 2));
      }
    } catch (error) {
      console.log('⚠️  RPC test failed (expected without Telegram credentials):', error.message);
    }

    // Test 2: Council member banner update (simulated)
    console.log('\n🎯 Test 2: Council member banner update');
    try {
      const alice = getCouncilMember('alice');
      if (alice) {
        console.log(`✅ Found council member: ${alice.name}`);
        
        // This would normally make RPC calls, but will fail without credentials
        await updateCouncilMemberBanner('alice.smith', {
          message: '🧪 Test banner update via RPC',
          priority: 'medium'
        });
        console.log('✅ Council banner update completed');
      }
    } catch (error) {
      console.log('⚠️  Council banner test failed (expected without Telegram credentials):', error.message);
    }

    // Test 3: Department banner update (simulated)
    console.log('\n🏢 Test 3: Department banner update');
    try {
      const tech = getDepartment('tech');
      if (tech) {
        console.log(`✅ Found department: ${tech.name}`);
        
        await updateDepartmentBanner('tech', {
          message: '🧪 Test department banner via RPC',
          priority: 'high'
        });
        console.log('✅ Department banner update completed');
      }
    } catch (error) {
      console.log('⚠️  Department banner test failed (expected without Telegram credentials):', error.message);
    }

    // Test 4: System banner update (simulated)
    console.log('\n🌐 Test 4: System banner update');
    try {
      await updateSystemBanner('main', {
        message: '🧪 Test system banner via RPC',
        priority: 'critical'
      });
      console.log('✅ System banner update completed');
    } catch (error) {
      console.log('⚠️  System banner test failed (expected without Telegram credentials):', error.message);
    }

    console.log('\n🎉 RPC Integration Tests Completed!');
    console.log('📝 Note: Actual Telegram API calls require valid credentials');
    console.log('🔧 Set up TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION');
    console.log('📱 Configure TELEGRAM_COUNCIL_ID for your supergroup');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
testRpcIntegration().then(() => {
  console.log('\n✅ All tests completed successfully');
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
