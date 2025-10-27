// tgk/integrations/telegram-banner.ts - Telegram Banner Topic Management
import { makeRpcCall, getForumTopics } from '../core/rpc.js';

// Council member configurations with banner topics
const COUNCIL_MEMBERS = {
  'alice.smith': {
    name: 'Alice Smith',
    emoji: '🔴',
    role: 'tech-lead',
    bannerTopic: 'council-alice-updates',
    personalTopic: 'alice-smith-activities',
    color: '#FF6B6B'
  },
  'charlie.brown': {
    name: 'Charlie Brown',
    emoji: '🔵',
    role: 'security-lead',
    bannerTopic: 'council-charlie-updates',
    personalTopic: 'charlie-brown-activities',
    color: '#4ECDC4'
  },
  'diana.prince': {
    name: 'Diana Prince',
    emoji: '🟢',
    role: 'product-lead',
    bannerTopic: 'council-diana-updates',
    personalTopic: 'diana-prince-activities',
    color: '#A8E6CF'
  },
  'frank.taylor': {
    name: 'Frank Taylor',
    emoji: '🟣',
    role: 'support-lead',
    bannerTopic: 'council-frank-updates',
    personalTopic: 'frank-taylor-activities',
    color: '#DDA0DD'
  }
} as const;

// Department topic configurations
const DEPARTMENT_TOPICS = {
  'tech': {
    name: 'Tech Department',
    emoji: '💙',
    bannerTopic: 'tech-department-banner',
    updatesTopic: 'tech-updates',
    alertsTopic: 'tech-alerts',
    color: '#00BFFF'
  },
  'security': {
    name: 'Security Department',
    emoji: '🧡',
    bannerTopic: 'security-department-banner',
    updatesTopic: 'security-updates',
    alertsTopic: 'security-alerts',
    color: '#FF4500'
  },
  'product': {
    name: 'Product Department',
    emoji: '💚',
    bannerTopic: 'product-department-banner',
    updatesTopic: 'product-updates',
    alertsTopic: 'product-alerts',
    color: '#32CD32'
  },
  'support': {
    name: 'Support Team',
    emoji: '💜',
    bannerTopic: 'support-department-banner',
    updatesTopic: 'support-updates',
    alertsTopic: 'support-alerts',
    color: '#9370DB'
  }
} as const;

// System-wide banner topics
const SYSTEM_TOPICS = {
  'main': {
    name: 'Main Banner',
    topic: 'main-banner',
    description: 'Primary system status and announcements'
  },
  'releases': {
    name: 'Release Banner',
    topic: 'release-banner',
    description: 'Release planning and deployment status'
  },
  'health': {
    name: 'Health Banner',
    topic: 'health-banner',
    description: 'System health and monitoring status'
  },
  'incidents': {
    name: 'Incident Banner',
    topic: 'incident-banner',
    description: 'Incident response and resolution status'
  }
} as const;

interface BannerUpdate {
  type: 'council' | 'department' | 'system';
  target: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

interface BannerConfig {
  memberId?: string;
  department?: string;
  systemTopic?: string;
  customTopic?: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  duration?: number; // in minutes, 0 = permanent
}

/**
 * Update banner topic for council member
 */
export async function updateCouncilMemberBanner(
  memberId: keyof typeof COUNCIL_MEMBERS,
  config: Partial<BannerConfig>
): Promise<void> {
  const member = COUNCIL_MEMBERS[memberId];
  if (!member) {
    throw new Error(`Council member ${memberId} not found`);
  }

  const bannerMessage = formatCouncilBanner(member, config);
  
  try {
    // Update personal banner topic
    await sendBannerUpdate(member.personalTopic, bannerMessage);
    
    // Update council-wide banner topic
    await sendBannerUpdate(member.bannerTopic, bannerMessage);
    
    // Log the update
    console.log(`🎯 Updated banner for ${member.name} (${member.emoji})`);
    
  } catch (error) {
    console.error(`❌ Failed to update banner for ${member.name}:`, error);
    throw error;
  }
}

/**
 * Update banner topic for department
 */
export async function updateDepartmentBanner(
  department: keyof typeof DEPARTMENT_TOPICS,
  config: Partial<BannerConfig>
): Promise<void> {
  const dept = DEPARTMENT_TOPICS[department];
  if (!dept) {
    throw new Error(`Department ${department} not found`);
  }

  const bannerMessage = formatDepartmentBanner(dept, config);
  
  try {
    // Update department banner topic
    await sendBannerUpdate(dept.bannerTopic, bannerMessage);
    
    // Update department updates topic
    await sendBannerUpdate(dept.updatesTopic, bannerMessage);
    
    console.log(`🏢 Updated banner for ${dept.name} (${dept.emoji})`);
    
  } catch (error) {
    console.error(`❌ Failed to update banner for ${dept.name}:`, error);
    throw error;
  }
}

/**
 * Update system-wide banner topic
 */
export async function updateSystemBanner(
  systemTopic: keyof typeof SYSTEM_TOPICS,
  config: Partial<BannerConfig>
): Promise<void> {
  const topic = SYSTEM_TOPICS[systemTopic];
  if (!topic) {
    throw new Error(`System topic ${systemTopic} not found`);
  }

  const bannerMessage = formatSystemBanner(topic, config);
  
  try {
    await sendBannerUpdate(topic.topic, bannerMessage);
    console.log(`🌐 Updated system banner: ${topic.name}`);
    
  } catch (error) {
    console.error(`❌ Failed to update system banner ${topic.name}:`, error);
    throw error;
  }
}

/**
 * Update all council member banners
 */
export async function updateAllCouncilBanners(
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const updatePromises = Object.keys(COUNCIL_MEMBERS).map(async (memberId) => {
    try {
      await updateCouncilMemberBanner(memberId as keyof typeof COUNCIL_MEMBERS, {
        message,
        priority
      });
    } catch (error) {
      console.error(`Failed to update banner for ${memberId}:`, error);
    }
  });

  await Promise.allSettled(updatePromises);
  console.log('🎯 Updated all council member banners');
}

/**
 * Update all department banners
 */
export async function updateAllDepartmentBanners(
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const updatePromises = Object.keys(DEPARTMENT_TOPICS).map(async (dept) => {
    try {
      await updateDepartmentBanner(dept as keyof typeof DEPARTMENT_TOPICS, {
        message,
        priority
      });
    } catch (error) {
      console.error(`Failed to update banner for ${dept}:`, error);
    }
  });

  await Promise.allSettled(updatePromises);
  console.log('🏢 Updated all department banners');
}

/**
 * Format council member banner message
 */
function formatCouncilBanner(
  member: typeof COUNCIL_MEMBERS[keyof typeof COUNCIL_MEMBERS],
  config: Partial<BannerConfig>
): string {
  const timestamp = new Date().toISOString();
  const priority = config.priority || 'medium';
  const priorityEmoji = getPriorityEmoji(priority);
  
  return `
${member.emoji} **${member.name} - Council Banner** ${priorityEmoji}

📋 **Status Update**
${config.message}

🔧 **Role**: ${member.role}
🎯 **Department**: ${member.role.split('-')[0]}
📅 **Updated**: ${timestamp}

---
*Banner managed by TGK AI Orchestration System*
  `.trim();
}

/**
 * Format department banner message
 */
function formatDepartmentBanner(
  dept: typeof DEPARTMENT_TOPICS[keyof typeof DEPARTMENT_TOPICS],
  config: Partial<BannerConfig>
): string {
  const timestamp = new Date().toISOString();
  const priority = config.priority || 'medium';
  const priorityEmoji = getPriorityEmoji(priority);
  
  return `
${dept.emoji} **${dept.name} - Department Banner** ${priorityEmoji}

📋 **Department Status**
${config.message}

🏢 **Type**: Department Operations
📊 **Monitoring**: Active
📅 **Updated**: ${timestamp}

---
*Banner managed by TGK AI Orchestration System*
  `.trim();
}

/**
 * Format system banner message
 */
function formatSystemBanner(
  topic: typeof SYSTEM_TOPICS[keyof typeof SYSTEM_TOPICS],
  config: Partial<BannerConfig>
): string {
  const timestamp = new Date().toISOString();
  const priority = config.priority || 'medium';
  const priorityEmoji = getPriorityEmoji(priority);
  
  return `
🌐 **${topic.name}** ${priorityEmoji}

📋 **System Status**
${config.message}

📝 **Description**: ${topic.description}
📅 **Updated**: ${timestamp}

---
*Banner managed by TGK AI Orchestration System*
  `.trim();
}

/**
 * Send banner update to Telegram topic
 */
async function sendBannerUpdate(
  topic: string,
  message: string
): Promise<void> {
  try {
    // First, try to edit the existing forum topic
    await makeRpcCall('channels.editForumTopic', {
      channel: process.env.TELEGRAM_COUNCIL_ID,
      topicId: topic,
      title: message.split('\n')[0].substring(0, 32), // Use first line as title, max 32 chars
      iconEmojiId: '📋'
    });
    
    // Then send a message to the topic with the full content
    await makeRpcCall('telegram.sendMessage', {
      chatId: process.env.TELEGRAM_COUNCIL_ID,
      text: message,
      parseMode: 'Markdown',
      topicId: topic,
      disableWebPagePreview: true
    });
  } catch (error) {
    console.error(`Failed to send banner update to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Get priority emoji for banner
 */
function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '📋';
    case 'low': return 'ℹ️';
    default: return '📋';
  }
}

/**
 * Get council member by username
 */
export function getCouncilMember(username: string): typeof COUNCIL_MEMBERS[keyof typeof COUNCIL_MEMBERS] | null {
  const memberKey = Object.keys(COUNCIL_MEMBERS).find(key => 
    key.toLowerCase().includes(username.toLowerCase()) ||
    COUNCIL_MEMBERS[key as keyof typeof COUNCIL_MEMBERS].name.toLowerCase().includes(username.toLowerCase())
  );
  
  return memberKey ? COUNCIL_MEMBERS[memberKey as keyof typeof COUNCIL_MEMBERS] : null;
}

/**
 * Get department by name
 */
export function getDepartment(name: string): typeof DEPARTMENT_TOPICS[keyof typeof DEPARTMENT_TOPICS] | null {
  const deptKey = Object.keys(DEPARTMENT_TOPICS).find(key => 
    key.toLowerCase().includes(name.toLowerCase()) ||
    DEPARTMENT_TOPICS[key as keyof typeof DEPARTMENT_TOPICS].name.toLowerCase().includes(name.toLowerCase())
  );
  
  return deptKey ? DEPARTMENT_TOPICS[deptKey as keyof typeof DEPARTMENT_TOPICS] : null;
}

/**
 * Get all available banner topics
 */
export function getAllBannerTopics(): {
  council: Record<string, { banner: string; personal: string }>;
  departments: Record<string, { banner: string; updates: string; alerts: string }>;
  system: Record<string, { topic: string; description: string }>;
} {
  return {
    council: Object.fromEntries(
      Object.entries(COUNCIL_MEMBERS).map(([key, member]) => [
        key,
        { banner: member.bannerTopic, personal: member.personalTopic }
      ])
    ),
    departments: Object.fromEntries(
      Object.entries(DEPARTMENT_TOPICS).map(([key, dept]) => [
        key,
        { banner: dept.bannerTopic, updates: dept.updatesTopic, alerts: dept.alertsTopic }
      ])
    ),
    system: Object.fromEntries(
      Object.entries(SYSTEM_TOPICS).map(([key, topic]) => [
        key,
        { topic: topic.topic, description: topic.description }
      ])
    )
  };
}

/**
 * List all forum topics in the supergroup
 */
export async function listAllTopics(): Promise<any[]> {
  try {
    const topics = await getForumTopics();
    return topics;
  } catch (error) {
    console.error('❌ Failed to list topics:', error);
    throw error;
  }
}

// Export configurations for external use
export { COUNCIL_MEMBERS, DEPARTMENT_TOPICS, SYSTEM_TOPICS };
