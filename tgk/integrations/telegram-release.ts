import { makeRpcCall } from '../core/rpc.js';
import { ReleasePlan } from '../commands/release-plan.js';

export async function sendReleaseApproval(plan: ReleasePlan): Promise<void> {
  const message = formatReleaseApprovalMessage(plan);
  
  await makeRpcCall('telegram.sendMessage', {
    chatId: process.env.TELEGRAM_COUNCIL_ID,
    text: message,
    parseMode: 'Markdown',
    replyMarkup: {
      inlineKeyboard: [
        [
          { text: '✅ Approve (Tech Lead)', callback_data: `release_approve:${plan.id}:tech-lead` },
          { text: '✅ Approve (Security)', callback_data: `release_approve:${plan.id}:security` }
        ],
        [
          { text: '✅ Approve (Product)', callback_data: `release_approve:${plan.id}:product` },
          { text: '🚧 Request Changes', callback_data: `release_hold:${plan.id}` }
        ],
        [
          { text: '❌ Reject', callback_data: `release_reject:${plan.id}` },
          { text: '📊 View Details', callback_data: `release_details:${plan.id}` }
        ]
      ]
    }
  });
}

function formatReleaseApprovalMessage(plan: ReleasePlan): string {
  return [
    '🚀 *Release Approval Request*',
    '',
    `*Type:* ${plan.type}`,
    `*Components:* ${plan.components.join(', ')}`,
    `*Risk Level:* ${plan.riskLevel}`,
    `*Estimated Duration:* ${plan.estimatedDuration}`,
    `*Steps:* ${plan.steps.length}`,
    '',
    '*Quick Actions:*',
    '✅ Approve - Click your role button',
    '🚧 Request Changes - Use Request Changes',
    '❌ Reject - Use Reject button',
    '',
    `*Plan ID:* ${plan.id}` 
  ].join('\n');
}

export async function handleReleaseCallback(callbackData: string): Promise<void> {
  const parts = callbackData.split(':');
  const [action, releaseId, role] = parts;
  
  switch (action) {
    case 'release_approve':
      await handleApproval(releaseId || '', role || '');
      break;
    case 'release_hold':
      await handleHold(releaseId || '');
      break;
    case 'release_reject':
      await handleReject(releaseId || '');
      break;
    case 'release_details':
      await handleDetails(releaseId || '');
      break;
    default:
      console.warn(`Unknown callback action: ${action}`);
  }
}

async function handleApproval(releaseId: string, role: string): Promise<void> {
  try {
    await makeRpcCall('release.addApproval', {
      releaseId,
      role,
      timestamp: new Date().toISOString()
    });
    
    // Send confirmation message
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: `✅ *Release Approved*\n\n*Release ID:* ${releaseId}\n*Role:* ${role}\n*Time:* ${new Date().toISOString()}`,
      parseMode: 'Markdown'
    });
    
    // Check if all approvals are met
    const status = await makeRpcCall('release.getStatus', { releaseId });
    const allApproved = status.approvals.every((approval: any) => 
      approval.count >= approval.required
    );
    
    if (allApproved) {
      await makeRpcCall('telegram.sendMessage', {
        chatId: process.env.TELEGRAM_COUNCIL_ID,
        text: `🎉 *All Approvals Received!*\n\n*Release ID:* ${releaseId}\n\n🚀 Deployment starting automatically...`,
        parseMode: 'Markdown'
      });
      
      // Trigger deployment
      await makeRpcCall('release.deploy', { releaseId });
    }
    
  } catch (error) {
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: `❌ *Approval Failed*\n\n*Release ID:* ${releaseId}\n*Error:* ${(error as Error).message}`,
      parseMode: 'Markdown'
    });
  }
}

async function handleHold(releaseId: string): Promise<void> {
  try {
    await makeRpcCall('release.hold', {
      releaseId,
      reason: 'Requested changes via Telegram',
      timestamp: new Date().toISOString()
    });
    
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: `🚧 *Release Held*\n\n*Release ID:* ${releaseId}\n*Status:* Awaiting changes`,
      parseMode: 'Markdown'
    });
    
  } catch (error) {
    console.error(`Failed to hold release ${releaseId}:`, error);
  }
}

async function handleReject(releaseId: string): Promise<void> {
  try {
    await makeRpcCall('release.reject', {
      releaseId,
      reason: 'Rejected via Telegram',
      timestamp: new Date().toISOString()
    });
    
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: `❌ *Release Rejected*\n\n*Release ID:* ${releaseId}\n*Status:* Rejected`,
      parseMode: 'Markdown'
    });
    
  } catch (error) {
    console.error(`Failed to reject release ${releaseId}:`, error);
  }
}

async function handleDetails(releaseId: string): Promise<void> {
  try {
    const status = await makeRpcCall('release.getStatus', { releaseId });
    
    const details = [
      `📊 *Release Details*`,
      '',
      `*ID:* ${status.id}`,
      `*Type:* ${status.type}`,
      `*Status:* ${status.status}`,
      `*Created:* ${status.createdAt}`,
      '',
      '*Approvals:*',
      ...status.approvals.map((approval: any) => 
        `${approval.role}: ${approval.count}/${approval.required} (${approval.status})`
      )
    ];
    
    if (status.blockers.length > 0) {
      details.push('', '*Blockers:*', ...status.blockers.map((blocker: string) => `• ${blocker}`));
    }
    
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: details.join('\n'),
      parseMode: 'Markdown'
    });
    
  } catch (error) {
    console.error(`Failed to get release details ${releaseId}:`, error);
  }
}
