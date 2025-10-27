#!/usr/bin/env node

import { Command } from 'commander';
import { createReleaseCommands } from './commands/release-plan';

const program = new Command();

program
  .name('tgk')
  .description('AI-powered release planning and orchestration CLI')
  .version('1.0.0');

// Add release planning commands
program.addCommand(createReleaseCommands());

// Parse command line arguments
program.parse();

// Handle no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
