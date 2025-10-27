// tgk/integrations/telegram-banner.ts - Telegram Banner Topic Management
import { makeRpcCall, getForumTopics } from '../core/rpc.js';

// Council member configurations with banner topics
const COUNCIL_MEMBERS = {
  'brendadeeznuts1111': {
    name: 'Brenda',
    emoji: '👑',
    role: 'project-lead',
    team: 'leadership',
    bannerTopic: 'council-brenda-updates',
    personalTopic: 'brenda-activities',
    color: '#FFD700' // Gold for leadership
  },
  'alice.smith': {
    name: 'Alice Smith',
    emoji: '🔴',
    role: 'infrastructure-lead',
    team: 'infrastructure',
    bannerTopic: 'council-alice-updates',
    personalTopic: 'alice-smith-activities',
    color: '#FF6B6B'
  },
  'charlie.brown': {
    name: 'Charlie Brown',
    emoji: '🔵',
    role: 'provider-lead',
    team: 'resource-providers',
    bannerTopic: 'council-charlie-updates',
    personalTopic: 'charlie-brown-activities',
    color: '#4ECDC4'
  },
  'diana.prince': {
    name: 'Diana Prince',
    emoji: '🟢',
    role: 'quality-lead',
    team: 'quality-testing',
    bannerTopic: 'council-diana-updates',
    personalTopic: 'diana-prince-activities',
    color: '#A8E6CF'
  },
  'frank.taylor': {
    name: 'Frank Taylor',
    emoji: '🟣',
    role: 'documentation-lead',
    team: 'documentation',
    bannerTopic: 'council-frank-updates',
    personalTopic: 'frank-taylor-activities',
    color: '#DDA0DD'
  }
} as const;

// Department topic configurations aligned with CODEOWNERS
const DEPARTMENT_TOPICS = {
  'infrastructure': {
    name: 'Infrastructure Team',
    emoji: '⚙️',
    lead: 'alice.smith',
    bannerTopic: 'infrastructure-department-banner',
    updatesTopic: 'infrastructure-updates',
    alertsTopic: 'infrastructure-alerts',
    color: '#FF6B6B',
    responsibilities: [
      'packages/@alch/*',
      'src/backend/*',
      'src/frontend/*',
      '.github/workflows/*',
      'scripts/*',
      'package.json',
      'bunfig.toml',
      'tsconfig.json'
    ]
  },
  'resource-providers': {
    name: 'Resource Provider Team',
    emoji: '🌐',
    lead: 'charlie.brown',
    bannerTopic: 'providers-department-banner',
    updatesTopic: 'providers-updates',
    alertsTopic: 'providers-alerts',
    color: '#4ECDC4',
    responsibilities: [
      'alchemy/src/cloudflare/*',
      'alchemy/src/docker/*',
      'alchemy/src/github/*',
      'alchemy/src/aws/*',
      'alchemy/src/gcp/*',
      'alchemy/src/neon/*',
      'alchemy/src/vercel/*'
    ]
  },
  'documentation': {
    name: 'Documentation Team',
    emoji: '📚',
    lead: 'frank.taylor',
    bannerTopic: 'documentation-department-banner',
    updatesTopic: 'documentation-updates',
    alertsTopic: 'documentation-alerts',
    color: '#DDA0DD',
    responsibilities: [
      'docs/*',
      'examples/*',
      'README.md',
      'CONTRIBUTING.md',
      'QUICK_START.md',
      'COMMANDS.md',
      'ROADMAP.md',
      'LICENSE'
    ]
  },
  'quality-testing': {
    name: 'Quality & Testing Team',
    emoji: '🧪',
    lead: 'diana.prince',
    bannerTopic: 'quality-department-banner',
    updatesTopic: 'quality-updates',
    alertsTopic: 'quality-alerts',
    color: '#A8E6CF',
    responsibilities: [
      'src/__tests__/*',
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      'vitest.config.ts',
      '.vitest.config.ts',
      '**/test-setup.*'
    ]
  }
} as const;

// System-wide banner topics aligned with governance streams
const SYSTEM_TOPICS = {
  'main': {
    name: 'Main Banner',
    topic: 'main-banner',
    description: 'Primary system status and announcements',
    stream: 'general',
    owner: 'brendadeeznuts1111'
  },
  'releases': {
    name: 'Release Banner',
    topic: 'release-banner',
    description: 'Release planning and deployment status',
    stream: 'releases',
    owner: 'alice.smith'
  },
  'health': {
    name: 'Health Banner',
    topic: 'health-banner',
    description: 'System health and monitoring status',
    stream: 'sre',
    owner: 'alice.smith'
  },
  'incidents': {
    name: 'Incident Banner',
    topic: 'incident-banner',
    description: 'Incident response and resolution status',
    stream: 'security',
    owner: 'charlie.brown'
  },
  'governance': {
    name: 'Governance Banner',
    topic: 'governance-banner',
    description: 'Forum governance and policy updates',
    stream: 'governance',
    owner: 'brendadeeznuts1111'
  },
  'analytics': {
    name: 'Analytics Banner',
    topic: 'analytics-banner',
    description: 'Data analytics and metrics reporting',
    stream: 'data',
    owner: 'diana.prince'
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
🏢 **Team**: ${member.team}
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

👥 **Team Lead**: ${dept.lead}
📁 **Responsibilities**: ${dept.responsibilities.length} areas
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
🏷️ **Stream**: ${topic.stream}
👤 **Owner**: @${topic.owner}
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
      topicId: parseInt(topic), // Convert topic string to number
      title: message.split('\n')[0].substring(0, 32), // Use first line as title, max 32 chars
      iconColor: 0x6FB9F0 // Blue color for banners
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
 * Get department by file path (based on CODEOWNERS)
 */
export function getDepartmentByFilePath(filePath: string): typeof DEPARTMENT_TOPICS[keyof typeof DEPARTMENT_TOPICS] | null {
  // Normalize the file path
  const normalizedPath = filePath.replace(/^\.\//, '');
  
  // Check each department's responsibilities
  for (const [deptKey, dept] of Object.entries(DEPARTMENT_TOPICS)) {
    for (const responsibility of dept.responsibilities) {
      // Convert glob pattern to regex for matching
      const pattern = responsibility
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/^\//, '^');
      
      const regex = new RegExp(pattern);
      if (regex.test(normalizedPath)) {
        return dept;
      }
    }
  }
  
  return null;
}

/**
 * Get council members by team
 */
export function getCouncilMembersByTeam(team: string): typeof COUNCIL_MEMBERS[keyof typeof COUNCIL_MEMBERS][] {
  return Object.values(COUNCIL_MEMBERS).filter(member => member.team === team);
}

/**
 * Get governance stream for system topic
 */
export function getGovernanceStream(systemTopic: keyof typeof SYSTEM_TOPICS): string {
  return SYSTEM_TOPICS[systemTopic].stream;
}

/**
 * Get system topics by stream
 */
export function getSystemTopicsByStream(stream: string): typeof SYSTEM_TOPICS[keyof typeof SYSTEM_TOPICS][] {
  return Object.values(SYSTEM_TOPICS).filter(topic => topic.stream === stream);
}

/**
 * Update banner based on file change (CODEOWNERS integration)
 */
export async function updateBannerForFileChange(
  filePath: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const department = getDepartmentByFilePath(filePath);
  if (!department) {
    console.log(`📝 No department found for file: ${filePath}`);
    return;
  }
  
  console.log(`📁 File ${filePath} belongs to ${department.name}`);
  await updateDepartmentBanner(Object.keys(DEPARTMENT_TOPICS).find(key => DEPARTMENT_TOPICS[key as keyof typeof DEPARTMENT_TOPICS] === department) as keyof typeof DEPARTMENT_TOPICS, {
    message: `📁 File Update: ${filePath}\n\n${message}`,
    priority
  });
}

/**
 * Get all available banner topics
 */
export function getAllBannerTopics(): {
  council: Record<string, { banner: string; personal: string; team: string; role: string }>;
  departments: Record<string, { banner: string; updates: string; alerts: string; lead: string; responsibilities: string[] }>;
  system: Record<string, { topic: string; description: string; stream: string; owner: string }>;
} {
  return {
    council: Object.fromEntries(
      Object.entries(COUNCIL_MEMBERS).map(([key, member]) => [
        key,
        { 
          banner: member.bannerTopic, 
          personal: member.personalTopic,
          team: member.team,
          role: member.role
        }
      ])
    ),
    departments: Object.fromEntries(
      Object.entries(DEPARTMENT_TOPICS).map(([key, dept]) => [
        key,
        { 
          banner: dept.bannerTopic, 
          updates: dept.updatesTopic, 
          alerts: dept.alertsTopic,
          lead: dept.lead,
          responsibilities: dept.responsibilities
        }
      ])
    ),
    system: Object.fromEntries(
      Object.entries(SYSTEM_TOPICS).map(([key, topic]) => [
        key,
        { 
          topic: topic.topic, 
          description: topic.description,
          stream: topic.stream,
          owner: topic.owner
        }
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
    return topics || [];
  } catch (error) {
    console.error('❌ Failed to list topics:', error);
    throw error;
  }
}

// Export configurations for external use
export { COUNCIL_MEMBERS, DEPARTMENT_TOPICS, SYSTEM_TOPICS };
