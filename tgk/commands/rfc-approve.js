#!/usr/bin/env node

/**
 * tgk rfc approve - Approve an RFC and update its status
 * Usage: tgk rfc approve <rfc-id> [--reviewer <username>]
 */

const { TelegramBot } = require('../utils/telegram');
const { RFCStore } = require('../utils/rfc-store');
const { renderTemplate } = require('../utils/template-renderer');

async function approveRfc(rfcId, options = {}) {
  const rfcStore = new RFCStore();
  const telegram = new TelegramBot();
  
  try {
    // Get RFC details
    const rfc = await rfcStore.getRfc(rfcId);
    if (!rfc) {
      console.error(`❌ RFC ${rfcId} not found`);
      process.exit(1);
    }
    
    // Get reviewer from options or environment
    const reviewer = options.reviewer || process.env.TGK_USER || process.env.USER || 'unknown';
    
    // Record approval
    const updatedRfc = await rfcStore.addApproval(rfcId, reviewer);
    
    // Check if approval threshold met
    const isApproved = updatedRfc.approvals_received >= updatedRfc.approvals_needed;
    const newStatus = isApproved ? 'APPROVED' : 'READY_FOR_REVIEW';
    
    // Update RFC status
    await rfcStore.updateStatus(rfcId, newStatus);
    
    // Get final RFC data for template rendering
    const finalRfc = await rfcStore.getRfc(rfcId);
    
    // Render updated template and replace pinned message
    await replacePinnedCard(telegram, finalRfc, newStatus);
    
    console.log(`✅ RFC ${rfcId} approved by ${reviewer}`);
    console.log(`📊 Approvals: ${finalRfc.approvals_received}/${finalRfc.approvals_needed}`);
    console.log(`🎯 Status: ${newStatus}`);
    
    if (isApproved) {
      console.log(`🚀 RFC ${rfcId} is now APPROVED and ready for merge!`);
      
      // Trigger merge workflow if approved
      await triggerMergeWorkflow(rfcId);
    }
    
  } catch (error) {
    console.error(`❌ Failed to approve RFC ${rfcId}:`, error.message);
    process.exit(1);
  }
}

async function replacePinnedCard(telegram, rfc, status) {
  try {
    // Render the updated template
    const templateVars = {
      rfc: rfc,
      council_id: process.env.TELEGRAM_COUNCIL_ID,
      topic_id: rfc.topic_id || '25782'
    };
    
    const updatedCard = await renderTemplate('rfc-status-card.jinja2', templateVars);
    
    // Define interactive buttons based on status
    const replyMarkup = status === 'APPROVED' ? {
      inline_keyboard: [[
        { text: "🎉 RFC APPROVED", callback_data: `/tgk rfc status ${rfc.id}` }
      ]]
    } : {
      inline_keyboard: [
        [
          { text: "✅ Approve RFC", callback_data: `/tgk rfc approve ${rfc.id}` },
          { text: "✍️ Provide Feedback", url: `https://github.com/brendadeeznuts1111/alchmenyrun/pull/${rfc.pr_number}` }
        ],
        [
          { text: "🔄 Extend SLA", callback_data: `/tgk sla extend ${rfc.id} --hours 24` }
        ]
      ]
    };
    
    // Update the pinned message (unpin old, post new, pin new)
    if (rfc.telegram_message_id) {
      await telegram.unpinMessage(process.env.TELEGRAM_COUNCIL_ID, rfc.telegram_message_id);
    }
    
    const newMessage = await telegram.sendMessage(
      process.env.TELEGRAM_COUNCIL_ID,
      updatedCard,
      {
        message_thread_id: rfc.topic_id || '25782',
        reply_markup: replyMarkup
      }
    );
    
    // Pin the new message
    await telegram.pinMessage(process.env.TELEGRAM_COUNCIL_ID, newMessage.message_id);
    
    // Update RFC with new message ID
    const rfcStore = new RFCStore();
    await rfcStore.updateTelegramMessageId(rfc.id, newMessage.message_id);
    
    console.log(`📌 Updated pinned card (Message ID: ${newMessage.message_id})`);
    
  } catch (error) {
    console.error(`⚠️ Failed to update pinned card:`, error.message);
    // Don't exit - approval was still recorded
  }
}

async function triggerMergeWorkflow(rfcId) {
  try {
    // Trigger GitHub workflow for approved RFC
    const { execSync } = require('child_process');
    
    console.log(`🔄 Triggering merge workflow for approved RFC ${rfcId}...`);
    
    // This would trigger a GitHub workflow or perform the merge
    execSync(`gh workflow run rfc-merge.yml -f rfc_id=${rfcId}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
  } catch (error) {
    console.error(`⚠️ Failed to trigger merge workflow:`, error.message);
    // Don't exit - RFC was still approved
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const rfcId = args[0];
  const options = {};
  
  if (!rfcId) {
    console.error('Usage: tgk rfc approve <rfc-id> [--reviewer <username>]');
    process.exit(1);
  }
  
  // Parse optional arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--reviewer' && args[i + 1]) {
      options.reviewer = args[i + 1];
      i++;
    }
  }
  
  return { rfcId, options };
}

const { rfcId, options } = parseArgs();
approveRfc(rfcId, options);
