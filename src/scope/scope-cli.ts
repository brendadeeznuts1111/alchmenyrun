#!/usr/bin/env bun
/**
 * Scope CLI - Basic scope inspection commands
 * Usage: bun run scope-cli.ts <command> [args...]
 */

import { ScopeCLI } from "./scope-inspector";

async function main() {
  const args = process.argv.slice(2);
  const cli = new ScopeCLI();

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'list':
        await cli.listScopes(getFormatOption(commandArgs));
        break;

      case 'inspect':
        if (commandArgs.length === 0) {
          console.error('Error: Scope path required');
          console.error('Usage: scope-cli inspect <scope-path>');
          process.exit(1);
        }
        await cli.inspectScope(commandArgs[0], getFormatOption(commandArgs.slice(1)));
        break;

      case 'state':
        if (commandArgs.length === 0) {
          console.error('Error: Scope path required');
          console.error('Usage: scope-cli state <scope-path>');
          process.exit(1);
        }
        await cli.showState(commandArgs[0]);
        break;

      case 'stats':
        await cli.showStatistics();
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function getFormatOption(args: string[]): 'table' | 'json' | 'text' {
  if (args.includes('--json') || args.includes('-j')) {
    return 'json';
  }
  if (args.includes('--text') || args.includes('-t')) {
    return 'text';
  }
  return 'table';
}

function showHelp() {
  console.log(`
Scope CLI - Basic scope inspection commands

Usage: scope-cli <command> [options]

Commands:
  list                    List all active scopes
  inspect <scope-path>    Show detailed information about a scope
  state <scope-path>      Show raw state file contents
  stats                   Show scope statistics

Options:
  --json, -j              Output in JSON format
  --text, -t              Output in text format (for inspect)
  --help, -h              Show this help

Examples:
  scope-cli list
  scope-cli list --json
  scope-cli inspect my-app/prod
  scope-cli inspect my-app/prod --json
  scope-cli state my-app/prod
  scope-cli stats
`);
}

// Run the CLI
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
