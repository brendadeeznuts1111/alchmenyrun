import { Command } from 'commander';

export function createGrammarCommands(): Command {
  const grammar = new Command('grammar')
    .description('Email grammar parsing and generation commands');

  grammar
    .command('parse')
    .description('Parse an email address using grammar rules')
    .argument('<email>', 'Email address to parse')
    .action(async (email: string) => {
      console.log(`📧 Grammar parsing not yet implemented. Email: ${email}`);
    });

  grammar
    .command('rules')
    .description('Show available grammar rules')
    .action(() => {
      console.log('📋 Grammar rules not yet implemented');
    });

  return grammar;
}
