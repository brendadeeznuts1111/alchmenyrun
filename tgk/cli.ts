#!/usr/bin/env node

/**
 * TGK Issue Triage CLI - AI-powered GitHub issue management
 */

import { Command } from 'commander';
import { createIssueTriageCommands } from './commands/issue-triage';
import { createGrammarCommands } from './commands/grammar';

const program = new Command();

program
  .name('tgk-triage')
  .description('TGK - AI-powered issue triage and orchestration CLI')
  .version('0.1.0');

// Add issue triage commands
program.addCommand(createIssueTriageCommands());

// Add grammar commands (if they exist)
try {
  program.addCommand(createGrammarCommands());
} catch (error) {
  // Grammar commands not available yet
}

// Error handling
program.on('command:*', () => {
  console.error('❌ Invalid command: %s', program.args.join(' '));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse and execute
program.parse();
