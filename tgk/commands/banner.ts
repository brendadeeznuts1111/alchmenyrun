#!/usr/bin/env bun
// tgk/commands/banner.ts - CLI commands for Telegram banner management
import { Command } from 'commander';
import { 
  updateCouncilMemberBanner,
  updateDepartmentBanner,
  updateSystemBanner,
  updateAllCouncilBanners,
  updateAllDepartmentBanners,
  getCouncilMember,
  getDepartment,
  getAllBannerTopics
} from '../integrations/telegram-banner.js';
import { formatCouncilMember, formatDepartment } from '../core/macro-colors.js';

const program = new Command();

program
  .name('banner')
  .description('Telegram banner topic management for council and departments')
  .version('1.0.0');

// Update council member banner
program
  .command('council')
  .description('Update council member banner topic')
  .argument('<member>', 'Council member (alice, charlie, diana, frank)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (member, message, options) => {
    try {
      const memberId = mapCouncilMember(member);
      if (!memberId) {
        console.error(`❌ Council member '${member}' not found`);
        console.log('Available members: alice, charlie, diana, frank');
        process.exit(1);
      }

      console.log(`🎯 Updating banner for council member: ${member}`);
      await updateCouncilMemberBanner(memberId, {
        message,
        priority: options.priority as any
      });
      
      const councilInfo = formatCouncilMember(member, 'Banner Updated');
      console.log(councilInfo);
      console.log(`✅ Banner updated successfully with priority: ${options.priority}`);
      
    } catch (error) {
      console.error(`❌ Failed to update council banner:`, error);
      process.exit(1);
    }
  });

// Update department banner
program
  .command('department')
  .description('Update department banner topic')
  .argument('<dept>', 'Department (tech, security, product, support)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (dept, message, options) => {
    try {
      const deptId = mapDepartment(dept);
      if (!deptId) {
        console.error(`❌ Department '${dept}' not found`);
        console.log('Available departments: tech, security, product, support');
        process.exit(1);
      }

      console.log(`🏢 Updating banner for department: ${dept}`);
      await updateDepartmentBanner(deptId, {
        message,
        priority: options.priority as any
      });
      
      const deptInfo = formatDepartment(dept, 'Banner Updated');
      console.log(deptInfo);
      console.log(`✅ Banner updated successfully with priority: ${options.priority}`);
      
    } catch (error) {
      console.error(`❌ Failed to update department banner:`, error);
      process.exit(1);
    }
  });

// Update system banner
program
  .command('system')
  .description('Update system-wide banner topic')
  .argument('<topic>', 'System topic (main, releases, health, incidents)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (topic, message, options) => {
    try {
      const topicId = mapSystemTopic(topic);
      if (!topicId) {
        console.error(`❌ System topic '${topic}' not found`);
        console.log('Available topics: main, releases, health, incidents');
        process.exit(1);
      }

      console.log(`🌐 Updating system banner: ${topic}`);
      await updateSystemBanner(topicId, {
        message,
        priority: options.priority as any
      });
      
      console.log(`✅ System banner '${topic}' updated successfully with priority: ${options.priority}`);
      
    } catch (error) {
      console.error(`❌ Failed to update system banner:`, error);
      process.exit(1);
    }
  });

// Update all council banners
program
  .command('all-council')
  .description('Update all council member banners')
  .argument('<message>', 'Banner message for all council members')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (message, options) => {
    try {
      console.log('🎯 Updating all council member banners...');
      await updateAllCouncilBanners(message, options.priority as any);
      console.log('✅ All council banners updated successfully');
      
    } catch (error) {
      console.error(`❌ Failed to update all council banners:`, error);
      process.exit(1);
    }
  });

// Update all department banners
program
  .command('all-departments')
  .description('Update all department banners')
  .argument('<message>', 'Banner message for all departments')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (message, options) => {
    try {
      console.log('🏢 Updating all department banners...');
      await updateAllDepartmentBanners(message, options.priority as any);
      console.log('✅ All department banners updated successfully');
      
    } catch (error) {
      console.error(`❌ Failed to update all department banners:`, error);
      process.exit(1);
    }
  });

// List all banner topics
program
  .command('list')
  .description('List all available banner topics')
  .option('-t, --type <type>', 'Filter by type (council, department, system)', 'all')
  .action((options) => {
    const topics = getAllBannerTopics();
    
    console.log('📋 Available Banner Topics');
    console.log('='.repeat(50));
    
    if (options.type === 'all' || options.type === 'council') {
      console.log('\n🎯 Council Member Topics:');
      Object.entries(topics.council).forEach(([key, value]) => {
        console.log(`  ${key}:`);
        console.log(`    banner: ${value.banner}`);
        console.log(`    personal: ${value.personal}`);
      });
    }
    
    if (options.type === 'all' || options.type === 'department') {
      console.log('\n🏢 Department Topics:');
      Object.entries(topics.departments).forEach(([key, value]) => {
        console.log(`  ${key}:`);
        console.log(`    banner: ${value.banner}`);
        console.log(`    updates: ${value.updates}`);
        console.log(`    alerts: ${value.alerts}`);
      });
    }
    
    if (options.type === 'all' || options.type === 'system') {
      console.log('\n🌐 System Topics:');
      Object.entries(topics.system).forEach(([key, value]) => {
        console.log(`  ${key}:`);
        console.log(`    topic: ${value.topic}`);
        console.log(`    description: ${value.description}`);
      });
    }
  });

// Test banner functionality
program
  .command('test')
  .description('Test banner functionality with sample messages')
  .option('-t, --type <type>', 'Test type (council, department, system)', 'council')
  .action(async (options) => {
    try {
      const testMessage = `🧪 Test banner update at ${new Date().toISOString()}`;
      
      switch (options.type) {
        case 'council':
          console.log('🎯 Testing council banner updates...');
          await updateAllCouncilBanners(testMessage, 'medium');
          break;
          
        case 'department':
          console.log('🏢 Testing department banner updates...');
          await updateAllDepartmentBanners(testMessage, 'medium');
          break;
          
        case 'system':
          console.log('🌐 Testing system banner updates...');
          await updateSystemBanner('main', { message: testMessage, priority: 'medium' });
          break;
          
        default:
          console.error(`❌ Unknown test type: ${options.type}`);
          process.exit(1);
      }
      
      console.log('✅ Banner test completed successfully');
      
    } catch (error) {
      console.error(`❌ Banner test failed:`, error);
      process.exit(1);
    }
  });

// Helper functions to map user input to internal IDs
function mapCouncilMember(input: string): keyof typeof import('../integrations/telegram-banner.js').COUNCIL_MEMBERS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').COUNCIL_MEMBERS> = {
    'alice': 'alice.smith',
    'smith': 'alice.smith',
    'charlie': 'charlie.brown',
    'brown': 'charlie.brown',
    'diana': 'diana.prince',
    'prince': 'diana.prince',
    'frank': 'frank.taylor',
    'taylor': 'frank.taylor'
  };
  
  return mapping[input.toLowerCase()] || null;
}

function mapDepartment(input: string): keyof typeof import('../integrations/telegram-banner.js').DEPARTMENT_TOPICS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').DEPARTMENT_TOPICS> = {
    'tech': 'tech',
    'technical': 'tech',
    'security': 'security',
    'sec': 'security',
    'product': 'product',
    'prod': 'product',
    'support': 'support',
    'help': 'support'
  };
  
  return mapping[input.toLowerCase()] || null;
}

function mapSystemTopic(input: string): keyof typeof import('../integrations/telegram-banner.js').SYSTEM_TOPICS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').SYSTEM_TOPICS> = {
    'main': 'main',
    'primary': 'main',
    'releases': 'releases',
    'release': 'releases',
    'health': 'health',
    'status': 'health',
    'incidents': 'incidents',
    'incident': 'incidents'
  };
  
  return mapping[input.toLowerCase()] || null;
}

// Parse and execute commands
program.parse();

export default program;
