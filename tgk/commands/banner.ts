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
  getAllBannerTopics,
  updateBannerForFileChange,
  getDepartmentByFilePath,
  getGovernanceStream,
  getSystemTopicsByStream
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
  .argument('<member>', 'Council member (brenda, alice, charlie, diana, frank)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (member, message, options) => {
    try {
      const memberId = mapCouncilMember(member);
      if (!memberId) {
        console.error(`❌ Council member '${member}' not found`);
        console.log('Available members: brenda, alice, charlie, diana, frank');
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
  .argument('<dept>', 'Department (infrastructure, resource-providers, documentation, quality-testing)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (dept, message, options) => {
    try {
      const deptId = mapDepartment(dept);
      if (!deptId) {
        console.error(`❌ Department '${dept}' not found`);
        console.log('Available departments: infrastructure, resource-providers, documentation, quality-testing');
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
  .argument('<topic>', 'System topic (main, releases, health, incidents, governance, analytics)')
  .argument('<message>', 'Banner message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (topic, message, options) => {
    try {
      const topicId = mapSystemTopic(topic);
      if (!topicId) {
        console.error(`❌ System topic '${topic}' not found`);
        console.log('Available topics: main, releases, health, incidents, governance, analytics');
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

// Update banner for file change (CODEOWNERS integration)
program
  .command('file-update')
  .description('Update banner for file change based on CODEOWNERS')
  .argument('<filePath>', 'File path that was changed')
  .argument('<message>', 'Update message')
  .option('-p, --priority <priority>', 'Priority level (low, medium, high, critical)', 'medium')
  .action(async (filePath, message, options) => {
    try {
      console.log(`📁 Processing file update: ${filePath}`);
      await updateBannerForFileChange(filePath, message, options.priority as any);
      console.log('✅ File update banner completed successfully');
      
    } catch (error) {
      console.error(`❌ File update banner failed:`, error);
      process.exit(1);
    }
  });

// Show department for file path
program
  .command('lookup-file')
  .description('Lookup which department owns a file path')
  .argument('<filePath>', 'File path to lookup')
  .action(async (filePath) => {
    try {
      const department = getDepartmentByFilePath(filePath);
      if (department) {
        console.log(`📁 File: ${filePath}`);
        console.log(`🏢 Department: ${department.name}`);
        console.log(`👥 Team Lead: ${department.lead}`);
        console.log(`📁 Responsibilities: ${department.responsibilities.length} areas`);
        console.log(`📋 Sample responsibilities:`);
        department.responsibilities.slice(0, 3).forEach(resp => {
          console.log(`   • ${resp}`);
        });
      } else {
        console.log(`📁 File: ${filePath}`);
        console.log(`❌ No department found for this file path`);
      }
      
    } catch (error) {
      console.error(`❌ File lookup failed:`, error);
      process.exit(1);
    }
  });

// Show governance stream info
program
  .command('stream-info')
  .description('Show governance stream information')
  .argument('<stream>', 'Stream name (general, releases, sre, security, governance, data)')
  .action(async (stream) => {
    try {
      const topics = getSystemTopicsByStream(stream);
      if (topics.length > 0) {
        console.log(`🏷️ Stream: ${stream}`);
        console.log(`📊 Topics: ${topics.length}`);
        topics.forEach(topic => {
          console.log(`   • ${topic.name} (${topic.topic})`);
          console.log(`     Owner: @${topic.owner}`);
          console.log(`     Description: ${topic.description}`);
        });
      } else {
        console.log(`🏷️ Stream: ${stream}`);
        console.log(`❌ No topics found for this stream`);
      }
      
    } catch (error) {
      console.error(`❌ Stream info failed:`, error);
      process.exit(1);
    }
  });

// Helper functions to map user input to internal IDs
function mapCouncilMember(input: string): keyof typeof import('../integrations/telegram-banner.js').COUNCIL_MEMBERS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').COUNCIL_MEMBERS> = {
    'brenda': 'brendadeeznuts1111',
    'lead': 'brendadeeznuts1111',
    'alice': 'alice.smith',
    'smith': 'alice.smith',
    'infra': 'alice.smith',
    'infrastructure': 'alice.smith',
    'charlie': 'charlie.brown',
    'brown': 'charlie.brown',
    'providers': 'charlie.brown',
    'diana': 'diana.prince',
    'prince': 'diana.prince',
    'quality': 'diana.prince',
    'testing': 'diana.prince',
    'frank': 'frank.taylor',
    'taylor': 'frank.taylor',
    'docs': 'frank.taylor',
    'documentation': 'frank.taylor'
  };
  
  return mapping[input.toLowerCase()] || null;
}

function mapDepartment(input: string): keyof typeof import('../integrations/telegram-banner.js').DEPARTMENT_TOPICS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').DEPARTMENT_TOPICS> = {
    'infrastructure': 'infrastructure',
    'infra': 'infrastructure',
    'packages': 'infrastructure',
    'backend': 'infrastructure',
    'frontend': 'infrastructure',
    'resource-providers': 'resource-providers',
    'providers': 'resource-providers',
    'cloudflare': 'resource-providers',
    'docker': 'resource-providers',
    'aws': 'resource-providers',
    'gcp': 'resource-providers',
    'documentation': 'documentation',
    'docs': 'documentation',
    'examples': 'documentation',
    'quality-testing': 'quality-testing',
    'quality': 'quality-testing',
    'testing': 'quality-testing',
    'tests': 'quality-testing',
    'qa': 'quality-testing'
  };
  
  return mapping[input.toLowerCase()] || null;
}

function mapSystemTopic(input: string): keyof typeof import('../integrations/telegram-banner.js').SYSTEM_TOPICS | null {
  const mapping: Record<string, keyof typeof import('../integrations/telegram-banner.js').SYSTEM_TOPICS> = {
    'main': 'main',
    'primary': 'main',
    'general': 'main',
    'releases': 'releases',
    'release': 'releases',
    'deploy': 'releases',
    'health': 'health',
    'status': 'health',
    'sre': 'health',
    'incidents': 'incidents',
    'incident': 'incidents',
    'security': 'incidents',
    'governance': 'governance',
    'policy': 'governance',
    'analytics': 'analytics',
    'data': 'analytics',
    'metrics': 'analytics'
  };
  
  return mapping[input.toLowerCase()] || null;
}

// Parse and execute commands
program.parse();

export default program;
