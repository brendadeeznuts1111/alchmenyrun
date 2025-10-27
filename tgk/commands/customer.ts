#!/usr/bin/env node

/**
 * tgk customer - AI-Driven Customer Communication
 * Commands: notify (AI drafts → D12 sends)
 */

import { TelegramBot } from '../utils/telegram.js';

const telegram = new TelegramBot();

// Customer database (simplified - would be D12 in production)
const CUSTOMERS = {
  'acme-corp': {
    name: 'ACME Corporation',
    contact: 'support@acme.com',
    telegram_chat_id: process.env.TELEGRAM_CUSTOMER_ACME,
    notification_preferences: ['email', 'telegram'],
    priority: 'high'
  },
  'startup-x': {
    name: 'Startup X',
    contact: 'hello@startupx.io',
    telegram_chat_id: process.env.TELEGRAM_CUSTOMER_STARTUPX,
    notification_preferences: ['telegram'],
    priority: 'medium'
  }
};

interface Notification {
  id: string;
  customer_id: string;
  type: 'release' | 'incident' | 'feature' | 'maintenance';
  subject: string;
  content: string;
  channels: string[];
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  created_at: string;
  sent_at?: string;
}

export async function notifyCustomer(customerId: string, options: { type?: string, message?: string }) {
  console.log(`📨 Preparing AI-powered notification for ${customerId}...`);

  try {
    // Get customer details
    const customer = CUSTOMERS[customerId as keyof typeof CUSTOMERS];
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Determine notification type and content
    const notificationType = options.type as Notification['type'] || 'feature';
    const customMessage = options.message;

    // AI-generated notification content
    const notification = await generateNotification(customer, notificationType, customMessage);

    // Send via D12 (customer notification API)
    await sendViaD12(notification);

    // Also send to Telegram if preferred
    if (customer.notification_preferences.includes('telegram') && customer.telegram_chat_id) {
      await sendViaTelegram(customer, notification);
    }

    console.log(`✅ Notification sent to ${customer.name}`);
    console.log(`📊 Channels: ${notification.channels.join(', ')}`);

    return notification;

  } catch (error) {
    console.error(`❌ Failed to notify customer ${customerId}:`, error.message);
    throw error;
  }
}

async function generateNotification(customer: any, type: Notification['type'], customMessage?: string): Promise<Notification> {
  // AI-powered notification generation (simplified)
  let subject = '';
  let content = '';

  switch (type) {
    case 'release':
      subject = 'New Release Available';
      content = `Hi ${customer.name} team,

We're excited to announce a new release with improved performance and new features.

${customMessage || 'Key improvements include better error handling and enhanced user experience.'}

Best regards,
Alchemist Team`;
      break;

    case 'incident':
      subject = 'Service Incident Update';
      content = `Dear ${customer.name},

We're currently experiencing a service incident and our team is working to resolve it.

${customMessage || 'We apologize for any inconvenience and will provide updates as they become available.'}

Status: Investigating
Estimated resolution: Within 2 hours

Best regards,
Alchemist Team`;
      break;

    case 'feature':
      subject = 'New Feature Announcement';
      content = `Hello ${customer.name},

We've deployed a new feature that you might find valuable.

${customMessage || 'This feature enhances your workflow and provides better insights.'}

Please let us know if you have any questions!

Best regards,
Alchemist Team`;
      break;

    case 'maintenance':
      subject = 'Scheduled Maintenance';
      content = `Hi ${customer.name} team,

We'll be performing scheduled maintenance this weekend.

${customMessage || 'Expected downtime: 2 hours. Service will resume by Monday morning.'}

Thank you for your patience.

Best regards,
Alchemist Team`;
      break;

    default:
      subject = 'Alchemist Update';
      content = customMessage || 'We have an important update for you.';
  }

  const notificationId = `notify-${Date.now()}`;

  return {
    id: notificationId,
    customer_id: customer.name.toLowerCase().replace(/\s+/g, '-'),
    type,
    subject,
    content,
    channels: customer.notification_preferences,
    status: 'draft',
    created_at: new Date().toISOString()
  };
}

async function sendViaD12(notification: Notification): Promise<void> {
  // Send via D12 customer notification API
  const d12Payload = {
    customer_id: notification.customer_id,
    subject: notification.subject,
    content: notification.content,
    channels: notification.channels,
    priority: 'normal'
  };

  // In production, this would call the D12 API
  console.log(`📡 Sending via D12 API:`, JSON.stringify(d12Payload, null, 2));

  // Mock successful delivery
  notification.status = 'sent';
  notification.sent_at = new Date().toISOString();

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function sendViaTelegram(customer: any, notification: Notification): Promise<void> {
  const telegramMessage = `📢 **${notification.subject}**

${notification.content}

---
*Sent via Alchemist Customer Notification System*`;

  await telegram.sendMessage(
    customer.telegram_chat_id,
    telegramMessage,
    { message_thread_id: 'general' }
  );

  console.log(`📱 Also sent via Telegram to ${customer.name}`);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'notify':
        const customerId = args[2];
        if (!customerId) {
          console.error('Usage: tgk customer notify <customer-id> [--type=<release|incident|feature|maintenance>] [--message="custom message"]');
          process.exit(1);
        }

        const options: { type?: string, message?: string } = {};
        args.slice(3).forEach(arg => {
          if (arg.startsWith('--type=')) {
            options.type = arg.split('=')[1];
          } else if (arg.startsWith('--message=')) {
            options.message = arg.split('=')[1];
          }
        });

        await notifyCustomer(customerId, options);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk customer notify <customer-id>  - Send AI-generated customer notification');
        console.log('');
        console.log('Options:');
        console.log('  --type=<release|incident|feature|maintenance>');
        console.log('  --message="custom message content"');
        console.log('');
        console.log('Available customers:');
        Object.keys(CUSTOMERS).forEach(id => {
          const customer = CUSTOMERS[id as keyof typeof CUSTOMERS];
          console.log(`  ${id} - ${customer.name}`);
        });
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
