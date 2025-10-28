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
  title?: string; // New topic title (max 128 characters)
  iconColor?: number; // Icon color (0-0xFFFFFF)
  iconEmojiId?: string; // Custom emoji ID
  closed?: boolean; // Close/open topic
  hidden?: boolean; // Hide/show topic
}): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    // Build the request parameters dynamically based on what's provided
    const requestParams: any = {
      _: 'channels.editForumTopic',
      channel: params.channel,
      topic: params.topicId, // Note: API uses 'topic' not 'topicId'
    };
    
    // Only include parameters that are explicitly set
    if (params.title !== undefined) requestParams.title = params.title;
    if (params.iconColor !== undefined) requestParams.iconColor = params.iconColor;
    if (params.iconEmojiId !== undefined) requestParams.iconEmojiId = params.iconEmojiId;
    if (params.closed !== undefined) requestParams.closed = params.closed;
    if (params.hidden !== undefined) requestParams.hidden = params.hidden;
    
    const result = await client.invoke(requestParams);
    
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
  title: string; // Topic title (max 128 characters)
  iconColor?: number; // Icon color (0x6FB9F0, 0xFFD67E, 0xCB86DB, 0x8EEE98, 0xFF93B2, 0xFB6F5F)
  iconEmojiId?: string; // Custom emoji ID
  sendAs?: string; // Send as peer ID
}): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    // Build the request parameters dynamically
    const requestParams: any = {
      _: 'channels.createForumTopic',
      channel: params.channel,
      title: params.title,
      iconColor: params.iconColor || 0x6FB9F0, // Default blue color
    };
    
    // Only include parameters that are explicitly set
    if (params.iconEmojiId !== undefined) requestParams.iconEmojiId = params.iconEmojiId;
    if (params.sendAs !== undefined) requestParams.sendAs = params.sendAs;
    
    const result = await client.invoke(requestParams);
    
    // Extract the created topic from the updates
    const createdTopic = result.updates?.find((update: any) => update._ === 'updateForumTopic');
    
    return {
      success: true,
      topicId: createdTopic?.id || result.updates[0]?.id,
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
export async function getForumTopics(channel?: string): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    // Use default channel if none provided
    const targetChannel = channel || process.env.TELEGRAM_COUNCIL_ID;
    
    if (!targetChannel) {
      throw new Error('Channel parameter or TELEGRAM_COUNCIL_ID environment variable is required');
    }
    
    const result = await client.invoke({
      _: 'channels.getForumTopics',
      channel: targetChannel,
      offsetDate: 0,
      offsetId: 0,
      offsetTopic: 0,
      limit: 100,
    });
    
    // Map the topics to a more usable format
    const topics = result.topics?.map((topic: any) => ({
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
      fromId: topic.fromId,
      notifySettings: topic.notifySettings
    })) || [];
    
    return topics;
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

/**
 * Get channel information
 */
export async function getChannelInfo(channel: string): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.getChannels',
      id: [channel]
    });
    
    return result.chats[0];
  } catch (error) {
    console.error('❌ Failed to get channel info:', error);
    throw error;
  }
}

/**
 * Get full channel information
 */
export async function getFullChannelInfo(channel: string): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.getFullChannel',
      channel: channel
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to get full channel info:', error);
    throw error;
  }
}

/**
 * Check if channel has forum enabled
 */
export async function isForumEnabled(channel: string): Promise<boolean> {
  try {
    const channelInfo = await getFullChannelInfo(channel);
    return channelInfo.fullChat?.forum === true;
  } catch (error) {
    console.error('❌ Failed to check forum status:', error);
    return false;
  }
}

/**
 * Toggle forum mode for a channel
 */
export async function toggleForum(channel: string, enabled: boolean): Promise<any> {
  const client = await initializeTelegramClient();
  
  try {
    const result = await client.invoke({
      _: 'channels.toggleForum',
      channel: channel,
      enabled: enabled
    });
    
    return {
      success: true,
      channel: channel,
      forumEnabled: enabled,
      updates: result
    };
  } catch (error) {
    console.error('❌ Failed to toggle forum mode:', error);
    throw error;
  }
}
