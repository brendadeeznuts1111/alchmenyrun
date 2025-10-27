// src/modules/telegram-manager.ts - Core Telegram management module
import { Telegram } from 'telegram';
import { ANSIColors, ColorFormatter } from '../utils/ansi-colors';
import { 
  TelegramTopic, 
  TelegramMessage, 
  BannerConfig, 
  TelegramCommand,
  TelegramUser,
  MessageAttachment
} from '../types/telegram-integration';

export interface CreateTopicOptions {
  title: string;
  description?: string;
  type: TelegramTopic['type'];
  metadata?: Record<string, any>;
}

export interface CommandHandler {
  (ctx: any, args: string[]): Promise<void>;
}

export interface CallbackQueryHandler {
  (ctx: any, match: RegExpMatchArray): Promise<void>;
}

export class TelegramManager {
  private botToken: string;
  private supergroupId: number;
  private topics: Map<number, TelegramTopic> = new Map();
  private banners: Map<string, BannerConfig> = new Map();
  private commands: Map<string, TelegramCommand> = new Map();
  private pinnedMessages: Map<number, TelegramMessage> = new Map();
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private callbackHandlers: Map<RegExp, CallbackQueryHandler> = new Map();

  constructor(botToken: string, supergroupId: string | number) {
    this.botToken = botToken;
    this.supergroupId = typeof supergroupId === 'string' ? parseInt(supergroupId) : supergroupId;
    this.initializeCommands();
  }

  async initialize(): Promise<void> {
    try {
      // Simulate initialization - in real implementation would connect to Telegram API
      console.log(ANSIColors.colorize('✅ Telegram Manager initialized (demo mode)', 'green'));
      
      // Load existing topics (simulated)
      await this.loadTopics();
      
      // Load existing banners (simulated)
      await this.loadBanners();
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Telegram Manager initialization failed: ${error}`, 'red'));
      throw error;
    }
  }

  async createTopic(options: CreateTopicOptions): Promise<TelegramTopic> {
    try {
      // Simulate topic creation - in real implementation would call Telegram API
      const topicId = Math.floor(Math.random() * 100000) + 1;

      const topic: TelegramTopic = {
        id: topicId,
        title: options.title,
        description: options.description,
        type: options.type,
        metadata: options.metadata || {},
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        isPinned: false
      };

      this.topics.set(topic.id, topic);

      // Simulate sending description if provided
      if (options.description) {
        await this.sendMessage(topic.id, options.description);
      }

      console.log(ANSIColors.colorize(`✅ Created topic: ${options.title} (ID: ${topicId})`, 'cyan'));
      return topic;
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Failed to create topic: ${error}`, 'red'));
      throw error;
    }
  }

  async sendMessage(topicId: number, text: string, attachments?: string[]): Promise<TelegramMessage> {
    try {
      // Simulate sending message - in real implementation would call Telegram API
      const messageId = Math.floor(Math.random() * 1000000) + 1;

      const message: TelegramMessage = {
        message_id: messageId,
        topic_id: topicId,
        text,
        timestamp: new Date(),
        is_pinned: false
      };

      // Update topic activity
      const topic = this.topics.get(topicId);
      if (topic) {
        topic.lastActivity = new Date();
        topic.messageCount++;
      }

      console.log(ANSIColors.colorize(`📨 Message sent to topic ${topicId}: ${text.substring(0, 50)}...`, 'blue'));
      return message;
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Failed to send message: ${error}`, 'red'));
      throw error;
    }
  }

  async pinMessage(topicId: number, text: string): Promise<TelegramMessage> {
    try {
      const message = await this.sendMessage(topicId, text);
      
      // Simulate pinning - in real implementation would call Telegram API
      message.is_pinned = true;
      this.pinnedMessages.set(message.message_id, message);

      console.log(ANSIColors.colorize(`📌 Pinned message in topic ${topicId}`, 'yellow'));
      return message;
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Failed to pin message: ${error}`, 'red'));
      throw error;
    }
  }

  async editMessage(topicId: number, messageId: number, newText: string): Promise<void> {
    try {
      // Simulate editing - in real implementation would call Telegram API
      const message = this.pinnedMessages.get(messageId);
      if (message) {
        message.text = newText;
      }

      console.log(ANSIColors.colorize(`✏️ Edited message ${messageId} in topic ${topicId}`, 'cyan'));
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Failed to edit message: ${error}`, 'red'));
      throw error;
    }
  }

  async sendDirectMessage(userId: string | number, text: string): Promise<void> {
    try {
      // Simulate sending direct message - in real implementation would call Telegram API
      console.log(ANSIColors.colorize(`📨 Direct message to ${userId}: ${text.substring(0, 50)}...`, 'blue'));
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Failed to send direct message: ${error}`, 'red'));
      throw error;
    }
  }

  async updateBanner(team: string, message: string, options?: {
    priority?: BannerConfig['priority'];
    color?: string;
    emoji?: string;
    expiresAt?: Date;
  }): Promise<BannerConfig> {
    const bannerId = `banner-${team}`;
    const existingBanner = this.banners.get(bannerId);

    const banner: BannerConfig = {
      id: bannerId,
      team,
      message,
      priority: options?.priority || 'medium',
      color: options?.color || this.getPriorityColor(options?.priority || 'medium'),
      emoji: options?.emoji || this.getPriorityEmoji(options?.priority || 'medium'),
      isActive: true,
      expiresAt: options?.expiresAt,
      createdBy: 'system',
      createdAt: existingBanner?.createdAt || new Date(),
      updatedAt: new Date()
    };

    this.banners.set(bannerId, banner);

    // Update banner in Telegram
    await this.publishBanner(banner);

    console.log(ANSIColors.colorize(`📢 Updated banner for ${team}: ${message}`, 'cyan'));
    return banner;
  }

  async publishBanner(banner: BannerConfig): Promise<void> {
    const bannerText = [
      `${banner.emoji} **${banner.team.toUpperCase()} BANNER**`,
      '',
      banner.message,
      '',
      `*Priority: ${banner.priority.toUpperCase()}*`,
      `*Updated: ${banner.updatedAt.toLocaleString()}*`
    ].join('\n');

    // Find or create banner topic
    let bannerTopic = Array.from(this.topics.values()).find(t => t.type === 'announcement');
    
    if (!bannerTopic) {
      bannerTopic = await this.createTopic({
        title: '📢 System Announcements',
        type: 'announcement',
        description: 'Important system announcements and banners'
      });
    }

    // Update or create pinned banner message
    const existingPinned = Array.from(this.pinnedMessages.values())
      .find(m => m.text.includes(`${banner.team.toUpperCase()} BANNER`));

    if (existingPinned) {
      await this.editMessage(bannerTopic.id, existingPinned.message_id, bannerText);
    } else {
      await this.pinMessage(bannerTopic.id, bannerText);
    }
  }

  getTopic(topicId: number): TelegramTopic | undefined {
    return this.topics.get(topicId);
  }

  getAllTopics(): TelegramTopic[] {
    return Array.from(this.topics.values());
  }

  getActiveBanners(): BannerConfig[] {
    return Array.from(this.banners.values())
      .filter(banner => banner.isActive && (!banner.expiresAt || banner.expiresAt > new Date()));
  }

  private async loadTopics(): Promise<void> {
    try {
      // Simulate loading topics - in real implementation would call Telegram API
      console.log(ANSIColors.colorize(`📋 Loaded ${this.topics.size} topics (demo mode)`, 'blue'));
    } catch (error) {
      console.warn(ANSIColors.colorize(`⚠️ Could not load topics: ${error}`, 'yellow'));
    }
  }

  private async loadBanners(): Promise<void> {
    // In a real implementation, this would load from a database
    // For now, we'll start with empty banners
    console.log(ANSIColors.colorize('📋 Initialized banner system (demo mode)', 'blue'));
  }

  private initializeCommands(): void {
    const defaultCommands: TelegramCommand[] = [
      {
        command: 'banner',
        description: 'Manage team banners',
        handler: 'handleBannerCommand',
        permissions: ['admin', 'moderator']
      },
      {
        command: 'topic',
        description: 'Manage forum topics',
        handler: 'handleTopicCommand',
        permissions: ['admin', 'moderator']
      },
      {
        command: 'pin',
        description: 'Pin messages in topics',
        handler: 'handlePinCommand',
        permissions: ['admin', 'moderator']
      }
    ];

    for (const command of defaultCommands) {
      this.commands.set(command.command, command);
    }
  }

  private inferTopicType(title: string): TelegramTopic['type'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('pr') || lowerTitle.includes('pull request')) return 'github_pr';
    if (lowerTitle.includes('customer') || lowerTitle.includes('support')) return 'customer_service';
    if (lowerTitle.includes('system') || lowerTitle.includes('status')) return 'system_state';
    if (lowerTitle.includes('announcement') || lowerTitle.includes('banner')) return 'announcement';
    
    return 'team_coordination';
  }

  private getTopicColor(type: TelegramTopic['type']): number {
    const colorMap = {
      github_pr: 0x6C9BCF, // Blue
      customer_service: 0x9B59B6, // Purple
      system_state: 0x2ECC71, // Green
      team_coordination: 0xF39C12, // Orange
      announcement: 0xE74C3C // Red
    };
    
    return colorMap[type] || 0x95A5A6; // Gray default
  }

  private getTopicEmoji(type: TelegramTopic['type']): string {
    const emojiMap = {
      github_pr: '🔀',
      customer_service: '🎫',
      system_state: '🏗️',
      team_coordination: '👥',
      announcement: '📢'
    };
    
    return emojiMap[type] || '📝';
  }

  private getPriorityColor(priority: BannerConfig['priority']): string {
    const colorMap = {
      low: '#2ECC71',
      medium: '#F39C12',
      high: '#E67E22',
      critical: '#E74C3C'
    };
    
    return colorMap[priority];
  }

  private getPriorityEmoji(priority: BannerConfig['priority']): string {
    const emojiMap = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    
    return emojiMap[priority];
  }

  // Command and callback registration methods
  registerCommand(command: string, handler: CommandHandler): void {
    this.commandHandlers.set(command, handler);
    console.log(ANSIColors.colorize(`✅ Registered command: /${command}`, 'green'));
  }

  registerCallbackQuery(pattern: RegExp, handler: CallbackQueryHandler): void {
    this.callbackHandlers.set(pattern, handler);
    console.log(ANSIColors.colorize(`✅ Registered callback query: ${pattern}`, 'green'));
  }

  getCommandHandler(command: string): CommandHandler | undefined {
    return this.commandHandlers.get(command);
  }

  getCallbackHandler(callbackData: string): { handler: CallbackQueryHandler; match: RegExpMatchArray } | undefined {
    for (const [pattern, handler] of this.callbackHandlers.entries()) {
      const match = callbackData.match(pattern);
      if (match) {
        return { handler, match };
      }
    }
    return undefined;
  }

  // Method to process incoming callback queries
  async processCallbackQuery(ctx: any): Promise<void> {
    try {
      const callbackData = ctx.callbackQuery?.data;
      if (!callbackData) return;

      const result = this.getCallbackHandler(callbackData);
      if (result) {
        await result.handler(ctx, result.match);
      } else {
        console.warn(ANSIColors.colorize(`⚠️ No handler found for callback: ${callbackData}`, 'yellow'));
        await ctx.answerCallbackQuery('❌ Unknown action');
      }
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Error processing callback query: ${error}`, 'red'));
      await ctx.answerCallbackQuery('❌ Action failed');
    }
  }

  // Method to process incoming commands
  async processCommand(ctx: any): Promise<void> {
    try {
      const text = ctx.message?.text;
      if (!text || !text.startsWith('/')) return;

      const [command, ...args] = text.slice(1).split(' ');
      const handler = this.getCommandHandler(command);
      
      if (handler) {
        await handler(ctx, args);
      } else {
        console.warn(ANSIColors.colorize(`⚠️ No handler found for command: /${command}`, 'yellow'));
        await ctx.reply(`❌ Unknown command: /${command}`);
      }
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Error processing command: ${error}`, 'red'));
      await ctx.reply('❌ Command failed');
    }
  }
}
