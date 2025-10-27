import { Command } from 'commander';
import { parseEmailGrammar, generateEmailGrammar, validateGrammarComponents, GRAMMAR_RULES } from '../core/grammar-parser.js';

export function createGrammarCommands(): Command {
  const grammar = new Command('grammar')
    .description('Email grammar parsing and generation commands');

  grammar
    .command('parse')
    .description('Parse an email address using grammar rules')
    .argument('<email>', 'Email address to parse')
    .action(async (email: string) => {
      const result = parseEmailGrammar(email);
      
      if (result.valid) {
        console.log('✅ Grammar parsed successfully:');
        console.log(`   Domain: ${result.domain}`);
        console.log(`   Scope: ${result.scope}`);
        console.log(`   Type: ${result.type}`);
        console.log(`   Hierarchy: ${result.hierarchy}`);
        console.log(`   Meta: ${result.meta}`);
        console.log(`   State ID: ${result.stateId}`);
        console.log(`   Priority: ${result.priority}`);
        console.log(`   Severity: ${result.severity}`);
      } else {
        console.error(`❌ Grammar parsing failed: ${result.error}`);
        process.exit(1);
      }
    });

  grammar
    .command('generate')
    .description('Generate an email address using grammar rules')
    .requiredOption('--domain <domain>', 'Domain (support, ops, dev, security, customer)')
    .requiredOption('--scope <scope>', 'Scope (internal, customer, partner, vendor)')
    .requiredOption('--type <type>', 'Type (issue, request, alert, incident, question)')
    .option('--hierarchy <hierarchy>', 'Hierarchy (critical, urgent, high, normal, low)', 'normal')
    .option('--meta <meta>', 'Meta (p0, p1, p2, p3, urgent, normal)', 'normal')
    .option('--state-id <stateId>', 'State ID (optional)', '')
    .action(async (options) => {
      try {
        const email = generateEmailGrammar({
          domain: options.domain,
          scope: options.scope,
          type: options.type,
          hierarchy: options.hierarchy,
          meta: options.meta,
          stateId: options.stateId
        });
        
        console.log(`✅ Generated email: ${email}`);
      } catch (error: any) {
        console.error(`❌ Generation failed: ${error.message}`);
        process.exit(1);
      }
    });

  grammar
    .command('validate')
    .description('Validate grammar components')
    .option('--domain <domain>', 'Domain to validate')
    .option('--scope <scope>', 'Scope to validate')
    .option('--type <type>', 'Type to validate')
    .option('--hierarchy <hierarchy>', 'Hierarchy to validate')
    .option('--meta <meta>', 'Meta to validate')
    .action(async (options) => {
      const result = validateGrammarComponents(options);
      
      if (result.valid) {
        console.log('✅ All components are valid');
      } else {
        console.log('❌ Validation failed:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        result.suggestions.forEach(suggestion => console.log(`   💡 ${suggestion}`));
        process.exit(1);
      }
    });

  grammar
    .command('rules')
    .description('Show available grammar rules')
    .action(() => {
      console.log('📋 Grammar Rules:');
      console.log('');
      console.log('Domains:', GRAMMAR_RULES.domains.join(', '));
      console.log('Scopes:', GRAMMAR_RULES.scopes.join(', '));
      console.log('Types:', GRAMMAR_RULES.types.join(', '));
      console.log('Hierarchies:', GRAMMAR_RULES.hierarchies.join(', '));
      console.log('Meta Patterns:', GRAMMAR_RULES.metaPatterns.join(', '));
    });

  return grammar;
}
