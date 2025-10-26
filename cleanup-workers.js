#!/usr/bin/env node

/**
 * Cleanup script for orphaned Cloudflare Workers
 * This script identifies and removes old Workers that are preventing queue cleanup
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

// Get Cloudflare credentials
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
let CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Missing required environment variable: CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

async function getAccountId() {
  if (CLOUDFLARE_ACCOUNT_ID) {
    return CLOUDFLARE_ACCOUNT_ID;
  }

  console.log('🔍 Getting account ID from Cloudflare API...');

  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get accounts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.result && data.result.length > 0) {
      CLOUDFLARE_ACCOUNT_ID = data.result[0].id;
      console.log(`✅ Found account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
      return CLOUDFLARE_ACCOUNT_ID;
    } else {
      throw new Error('No accounts found');
    }
  } catch (error) {
    console.error('❌ Failed to get account ID:', error.message);
    process.exit(1);
  }
}

async function makeRequest(endpoint, method = 'GET', body = null) {
  const accountId = await getAccountId();
  const url = endpoint.startsWith('http') ? endpoint : `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok && response.status !== 404) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function listWorkers() {
  console.log('📋 Listing all Workers...');

  try {
    const response = await makeRequest('');
    const data = await response.json();

    if (data.success && data.result) {
      return data.result.map(worker => worker.id);
    }
  } catch (error) {
    console.error('❌ Failed to list workers:', error.message);
  }

  return [];
}

async function listQueueConsumersForWorker(workerName) {
  console.log(`   Checking queue consumers for ${workerName}...`);

  try {
    const response = await makeRequest(`/${workerName}/queue-consumers?perPage=100`);

    if (response.status === 404) {
      console.log(`   No queue consumers found for ${workerName}`);
      return [];
    }

    if (!response.ok) {
      console.log(`   Error checking consumers for ${workerName}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.success && data.result) {
      return data.result.map(consumer => ({
        consumerId: consumer.consumer_id,
        queueId: consumer.queue_id,
        queueName: consumer.queue_name,
      }));
    }
  } catch (error) {
    console.log(`   Error checking consumers for ${workerName}:`, error.message);
  }

  return [];
}

async function deleteQueueConsumer(queueId, consumerId) {
  console.log(`   Deleting queue consumer ${consumerId} from queue ${queueId}`);

  try {
    const response = await makeRequest(`/${queueId}/consumers/${consumerId}`, 'DELETE');

    if (response.ok || response.status === 404) {
      console.log(`   ✅ Deleted consumer ${consumerId}`);
      return true;
    } else {
      console.log(`   ❌ Failed to delete consumer ${consumerId}: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   Error deleting consumer ${consumerId}:`, error.message);
    return false;
  }
}

async function deleteWorker(workerName) {
  console.log(`🗑️  Deleting Worker: ${workerName}`);

  try {
    // First delete any queue consumers for this worker
    const consumers = await listQueueConsumersForWorker(workerName);

    for (const consumer of consumers) {
      await deleteQueueConsumer(consumer.queueId, consumer.consumerId);
    }

    // Then delete the worker itself
    console.log(`   Deleting worker script: ${workerName}`);
    const response = await makeRequest(`/${workerName}`, 'DELETE');

    if (response.ok || response.status === 404) {
      console.log(`✅ Successfully deleted worker: ${workerName}`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Failed to delete worker ${workerName}: ${response.status}`, errorData.errors?.[0]?.message || '');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error deleting worker ${workerName}:`, error.message);
    return false;
  }
}

async function cleanupOrphanedWorkers() {
  console.log('🧹 Starting cleanup of orphaned Cloudflare Workers...\n');

  // Get all workers
  const workers = await listWorkers();
  console.log(`📊 Found ${workers.length} total Workers\n`);

  // Filter for workers that match our naming pattern and are likely orphaned
  const orphanedPattern = /^cloudflare-demo-website-(pr-\d+|nolarose|main|feat-)/;
  const orphanedWorkers = workers.filter(name => orphanedPattern.test(name));

  console.log(`🎯 Identified ${orphanedWorkers.length} potentially orphaned Workers:`);
  orphanedWorkers.forEach(name => console.log(`   - ${name}`));
  console.log('');

  if (orphanedWorkers.length === 0) {
    console.log('✅ No orphaned workers found!');
    return;
  }

  // Confirm before deletion
  console.log('⚠️  This will permanently delete the above Workers!');
  console.log('   Make sure these are truly orphaned and not currently in use.\n');

  // For safety, let's only delete workers that are clearly old
  // We'll delete them one by one with confirmation
  let deletedCount = 0;

  for (const workerName of orphanedWorkers) {
    try {
      const success = await deleteWorker(workerName);
      if (success) {
        deletedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Error processing ${workerName}:`, error.message);
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} orphaned Workers.`);

  if (deletedCount > 0) {
    console.log('\n🚀 You can now retry the deployment that was failing.');
    console.log('   The shared queue should now be free to be cleaned up.');
  }
}

// Run the cleanup
cleanupOrphanedWorkers().catch(error => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});
