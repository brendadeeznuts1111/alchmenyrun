// tgk/core/rpc.ts - RPC client for Telegram API calls
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// Telegram RPC client configuration
const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || '';
const TELEGRAM_SESSION = process.env.TELEGRAM_SESSION || '';

let telegramClient: TelegramClient | null = null;

/**
 * Initialize Telegram RPC client
 */
async function initializeTelegramClient(): Promise<TelegramClient> {
  if (telegramClient) {
    return telegramClient;
  }

  if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables are required');
  }

  try {
    const session = new StringSession(TELEGRAM_SESSION);
    telegramClient = new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 5,
      retryDelay: 2000,
    });

    await telegramClient.start({
      phoneNumber: async () => process.env.TELEGRAM_PHONE_NUMBER || '',
      password: async () => process.env.TELEGRAM_PASSWORD || '',
      phoneCode: async () => process.env.TELEGRAM_PHONE_CODE || '',
      onError: (err) => console.error('Telegram client error:', err),
    });

    console.log('✅ Telegram RPC client initialized');
    return telegramClient;
  } catch (error) {
    console.error('❌ Failed to initialize Telegram client:', error);
    throw error;
  }
}

/**
 * Make RPC call to Telegram API
 */
export async function makeRpcCall(method: string, params: any = {}): Promise<any> {
  try {
    const client = await initializeTelegramClient();
    
    // Handle different RPC methods
    switch (method) {
      case 'telegram.sendMessage':
        return await sendTelegramMessage(params);
      
      case 'telegram.editForumTopic':
        return await editForumTopic(params);
      
      case 'telegram.createForumTopic':
        return await createForumTopic(params);
      
      case 'release.addApproval':
        return {
          success: true,
          releaseId: params.releaseId,
          role: params.role,
          timestamp: params.timestamp
        };
      
      case 'release.getStatus':
        return {
          id: params.releaseId,
          status: 'pending',
          type: 'minor',
          createdAt: new Date().toISOString(),
          approvals: [
            { role: 'tech-lead', count: 1, required: 1, status: 'approved' },
            { role: 'security', count: 0, required: 1, status: 'pending' }
          ],
          blockers: []
        };
      
      case 'release.deploy':
        return {
          success: true,
          releaseId: params.releaseId,
          deploymentId: `deploy_${Date.now()}`,
          status: 'started'
        };
      
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  } catch (error) {
    console.error(`❌ RPC call failed for ${method}:`, error);
    throw error;
  }
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(params: {
  chatId: string;
  text: string;
  parseMode?: string;
  topicId?: string;
  disableWebPagePreview?: boolean;
}): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.sendMessage(params.chatId, {
      message: params.text,
      parseMode: params.parseMode || 'HTML',
      silent: false,
    });
    
    return {
      messageId: result.id.toString(),
      chatId: params.chatId,
      status: 'sent'
    };
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
    throw error;
  }
}

/**
 * Edit forum topic (banner topic management)
 */
async function editForumTopic(params: {
  channel: string; // Channel username or ID
  topicId: number; // Topic ID
  title?: string; // New topic title
  iconColor?: number; // Icon color (0-0xFFFFFF)
  iconEmojiId?: string; // Custom emoji ID
  closed?: boolean; // Close/open topic
  hidden?: boolean; // Hide/show topic
}): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.editForumTopic',
      channel: params.channel,
      topicId: params.topicId,
      title: params.title,
      iconColor: params.iconColor,
      iconEmojiId: params.iconEmojiId,
      closed: params.closed,
      hidden: params.hidden,
    });
    
    return {
      success: true,
      topicId: params.topicId,
      channel: params.channel,
      updates: result
    };
  } catch (error) {
    console.error('❌ Failed to edit forum topic:', error);
    throw error;
  }
}

/**
 * Create new forum topic
 */
async function createForumTopic(params: {
  channel: string; // Channel username or ID
  title: string; // Topic title
  iconColor?: number; // Icon color
  iconEmojiId?: string; // Custom emoji ID
}): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.createForumTopic',
      channel: params.channel,
      title: params.title,
      iconColor: params.iconColor || 0x7FFF00, // Default green
      iconEmojiId: params.iconEmojiId,
    });
    
    return {
      success: true,
      topicId: result.updates[0]?.id,
      channel: params.channel,
      title: params.title,
      updates: result
    };
  } catch (error) {
    console.error('❌ Failed to create forum topic:', error);
    throw error;
  }
}

/**
 * Get forum topics list
 */
export async function getForumTopics(channel: string): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.getForumTopics',
      channel: channel,
      offsetDate: 0,
      offsetId: 0,
      offsetTopic: 0,
      limit: 100,
    });
    
    return {
      success: true,
      topics: result.topics.map((topic: any) => ({
        id: topic.id,
        title: topic.title,
        iconColor: topic.iconColor,
        iconEmojiId: topic.iconEmojiId,
        closed: topic.closed,
        hidden: topic.hidden,
        date: topic.date,
        topMessage: topic.topMessage,
        readInboxMaxId: topic.readInboxMaxId,
        readOutboxMaxId: topic.readOutboxMaxId,
        unreadCount: topic.unreadCount,
        unreadMentionsCount: topic.unreadMentionsCount,
        unreadReactionsCount: topic.unreadReactionsCount,
      }))
    };
  } catch (error) {
    console.error('❌ Failed to get forum topics:', error);
    throw error;
  }
}

/**
 * Close Telegram client
 */
export async function closeTelegramClient(): Promise<void> {
  if (telegramClient) {
    await telegramClient.disconnect();
    telegramClient = null;
    console.log('✅ Telegram client disconnected');
  }
}
