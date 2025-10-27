/**
 * Email Grammar Generator Utility
 * Helps construct valid email addresses for the TGK email orchestration system
 */

import { ui } from '../utils/ui.js';

export interface EmailGrammarConfig {
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
  meta: string;
  stateId?: string;
}

export interface EmailGrammarValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class EmailGrammarGenerator {
  // Valid token definitions from ALC-RFC-006
  private readonly domains = [
    'infra', 'docs', 'qa', 'integrations', 'exec', 'support'
  ];

  private readonly scopes = [
    'lead', 'sre', 'dev', 'bot', 'oncall', 'ai'
  ];

  private readonly types = [
    'pr', 'issue', 'deploy', 'alert', 'review', 'reply'
  ];

  private readonly hierarchies = [
    'p0', 'p1', 'p2', 'p3', 'blk', 'crit'
  ];

  private readonly metas = [
    'gh', 'tg', 'cf', 'jira', '24h'
  ];

  constructor() {
    this.validateGrammarDefinitions();
  }

  /**
   * Generate email address from configuration
   */
  generateEmail(config: EmailGrammarConfig): string {
    const tokens = [
      config.domain,
      config.scope,
      config.type,
      config.hierarchy,
      config.meta
    ];

    if (config.stateId) {
      tokens.push(config.stateId);
    }

    return `${tokens.join('.')}@cloudflare.com`;
  }

  /**
   * Parse email address into configuration
   */
  parseEmail(email: string): EmailGrammarConfig | null {
    const localPart = email.split('@')[0];
    const tokens = localPart.split('.');

    if (tokens.length < 5 || tokens.length > 6) {
      return null;
    }

    const [domain, scope, type, hierarchy, meta, stateId] = tokens;

    return {
      domain,
      scope,
      type,
      hierarchy,
      meta,
      stateId: tokens.length === 6 ? stateId : undefined
    };
  }

  /**
   * Validate email grammar configuration
   */
  validateConfig(config: EmailGrammarConfig): EmailGrammarValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Domain validation
    if (!this.domains.includes(config.domain)) {
      errors.push(`Invalid domain '${config.domain}'. Must be one of: ${this.domains.join(', ')}`);
      suggestions.push(`Try: ${this.domains[0]} (for infrastructure)`);
    }

    // Scope validation
    if (!this.scopes.includes(config.scope)) {
      errors.push(`Invalid scope '${config.scope}'. Must be one of: ${this.scopes.join(', ')}`);
      suggestions.push(`Try: 'dev' for development, 'sre' for operations`);
    }

    // Type validation
    if (!this.types.includes(config.type)) {
      errors.push(`Invalid type '${config.type}'. Must be one of: ${this.types.join(', ')}`);
      suggestions.push(`Try: 'alert' for notifications, 'pr' for reviews`);
    }

    // Hierarchy validation
    if (!this.hierarchies.includes(config.hierarchy)) {
      errors.push(`Invalid hierarchy '${config.hierarchy}'. Must be one of: ${this.hierarchies.join(', ')}`);
      suggestions.push(`Try: 'p0' for critical, 'p1' for high priority`);
    }

    // Meta validation
    if (!this.metas.includes(config.meta)) {
      errors.push(`Invalid meta '${config.meta}'. Must be one of: ${this.metas.join(', ')}`);
      suggestions.push(`Try: 'gh' for GitHub, 'tg' for Telegram`);
    }

    // State ID validation (optional)
    if (config.stateId) {
      if (config.stateId.length > 8) {
        errors.push(`State ID '${config.stateId}' too long. Maximum 8 characters.`);
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(config.stateId)) {
        errors.push(`State ID '${config.stateId}' contains invalid characters. Use only alphanumeric, hyphen, underscore.`);
      }
    }

    // Business logic validations
    if (config.domain === 'infra' && config.scope === 'dev') {
      warnings.push(`Domain 'infra' with scope 'dev' is unusual. Consider 'sre' for infrastructure operations.`);
    }

    if (config.type === 'pr' && config.meta !== 'gh') {
      warnings.push(`Type 'pr' usually uses meta 'gh' for GitHub. Current meta: '${config.meta}'`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get suggestions for partial configurations
   */
  getSuggestions(partialConfig: Partial<EmailGrammarConfig>): EmailGrammarConfig[] {
    const suggestions: EmailGrammarConfig[] = [];

    // Common patterns for different use cases
    const templates = {
      'infrastructure-alert': {
        domain: 'infra',
        scope: 'sre',
        type: 'alert',
        hierarchy: 'p0',
        meta: 'cf'
      },
      'pull-request-review': {
        domain: 'qa',
        scope: 'dev',
        type: 'pr',
        hierarchy: 'p2',
        meta: 'gh',
        stateId: 'pr123'
      },
      'customer-support': {
        domain: 'support',
        scope: 'customer',
        type: 'issue',
        hierarchy: 'p1',
        meta: 'web'
      },
      'documentation-review': {
        domain: 'docs',
        scope: 'senior',
        type: 'review',
        hierarchy: 'p2',
        meta: 'gh'
      }
    };

    // Return all templates
    Object.values(templates).forEach(template => {
      suggestions.push({ ...template });
    });

    return suggestions;
  }

  /**
   * Interactive email builder for CLI/Admin UI
   */
  async buildEmailInteractive(): Promise<string> {
    ui.header('Email Grammar Generator', ui.symbols.mail);

    ui.section('Domain Selection', ui.symbols.gear);
    ui.keyValue('Available', this.domains.join(', '), 'cyan', 'white');
    const domain = await this.selectOption('Select domain:', this.domains, 'infra');

    ui.section('Scope Selection', ui.symbols.users);
    ui.keyValue('Available', this.scopes.join(', '), 'cyan', 'white');
    const scope = await this.selectOption('Select scope:', this.scopes, 'sre');

    ui.section('Type Selection', ui.symbols.message);
    ui.keyValue('Available', this.types.join(', '), 'cyan', 'white');
    const type = await this.selectOption('Select type:', this.types, 'alert');

    ui.section('Hierarchy Selection', ui.symbols.priority);
    ui.keyValue('Available', this.hierarchies.join(', '), 'cyan', 'white');
    const hierarchy = await this.selectOption('Select hierarchy:', this.hierarchies, 'p1');

    ui.section('Meta Selection', ui.symbols.link);
    ui.keyValue('Available', this.metas.join(', '), 'cyan', 'white');
    const meta = await this.selectOption('Select meta:', this.metas, 'cf');

    const stateId = await ui.prompt('State ID (optional, press Enter to skip):', '');

    const config: EmailGrammarConfig = {
      domain,
      scope,
      type,
      hierarchy,
      meta,
      stateId: stateId || undefined
    };

    const validation = this.validateConfig(config);

    if (!validation.isValid) {
      ui.error('Configuration has errors:');
      validation.errors.forEach(error => ui.keyValue('❌', error, 'red', 'white'));

      if (validation.suggestions.length > 0) {
        ui.section('Suggestions', ui.symbols.lightbulb);
        validation.suggestions.forEach(suggestion => {
          ui.keyValue('💡', suggestion, 'yellow', 'white');
        });
      }

      const retry = await ui.confirm('Would you like to try again?');
      if (retry) {
        return this.buildEmailInteractive();
      }
      return '';
    }

    if (validation.warnings.length > 0) {
      ui.section('Warnings', ui.symbols.warning);
      validation.warnings.forEach(warning => {
        ui.keyValue('⚠️', warning, 'yellow', 'white');
      });

      const proceed = await ui.confirm('Continue with warnings?');
      if (!proceed) {
        return this.buildEmailInteractive();
      }
    }

    const email = this.generateEmail(config);

    ui.success(`Generated email address: ${email}`);

    ui.section('Configuration Summary', ui.symbols.check);
    ui.keyValue('Domain', config.domain, 'cyan', 'white');
    ui.keyValue('Scope', config.scope, 'cyan', 'white');
    ui.keyValue('Type', config.type, 'cyan', 'white');
    ui.keyValue('Hierarchy', config.hierarchy, 'cyan', 'white');
    ui.keyValue('Meta', config.meta, 'cyan', 'white');
    if (config.stateId) {
      ui.keyValue('State ID', config.stateId, 'cyan', 'white');
    }

    return email;
  }

  /**
   * Get common email templates
   */
  getTemplates(): Array<{ name: string; description: string; config: EmailGrammarConfig }> {
    return [
      {
        name: 'Infrastructure Alert',
        description: 'Critical infrastructure notifications',
        config: {
          domain: 'infra',
          scope: 'sre',
          type: 'alert',
          hierarchy: 'p0',
          meta: 'cf'
        }
      },
      {
        name: 'Pull Request Review',
        description: 'Code review notifications',
        config: {
          domain: 'qa',
          scope: 'dev',
          type: 'pr',
          hierarchy: 'p2',
          meta: 'gh',
          stateId: 'pr123'
        }
      },
      {
        name: 'Customer Support Issue',
        description: 'Customer-reported problems',
        config: {
          domain: 'support',
          scope: 'customer',
          type: 'issue',
          hierarchy: 'p1',
          meta: 'web'
        }
      },
      {
        name: 'Documentation Review',
        description: 'Documentation updates and reviews',
        config: {
          domain: 'docs',
          scope: 'senior',
          type: 'review',
          hierarchy: 'p2',
          meta: 'gh'
        }
      },
      {
        name: 'On-Call Alert',
        description: 'Emergency notifications for on-call personnel',
        config: {
          domain: 'infra',
          scope: 'oncall',
          type: 'alert',
          hierarchy: 'crit',
          meta: '24h'
        }
      }
    ];
  }

  private async selectOption(prompt: string, options: string[], defaultValue?: string): Promise<string> {
    // In a real interactive UI, this would show a dropdown/select
    // For now, we'll use a simple text-based selection
    console.log(`${prompt}`);
    options.forEach((option, i) => {
      console.log(`  ${i + 1}. ${option}${option === defaultValue ? ' (default)' : ''}`);
    });

    // For CLI usage, return the first option or default
    return defaultValue || options[0];
  }

  private validateGrammarDefinitions() {
    // Ensure all required token lists are populated
    const lists = [
      { name: 'domains', list: this.domains },
      { name: 'scopes', list: this.scopes },
      { name: 'types', list: this.types },
      { name: 'hierarchies', list: this.hierarchies },
      { name: 'metas', list: this.metas }
    ];

    lists.forEach(({ name, list }) => {
      if (!list || list.length === 0) {
        throw new Error(`Email grammar ${name} list is empty or undefined`);
      }
    });
  }
}

// Export singleton instance
export const emailGrammarGenerator = new EmailGrammarGenerator();

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'interactive':
        await emailGrammarGenerator.buildEmailInteractive();
        break;

      case 'validate':
        const email = args[1];
        if (!email) {
          console.error('Usage: email-grammar validate <email>');
          process.exit(1);
        }

        const config = emailGrammarGenerator.parseEmail(email);
        if (!config) {
          console.error('❌ Invalid email format');
          process.exit(1);
        }

        const validation = emailGrammarGenerator.validateConfig(config);

        if (validation.isValid) {
          console.log('✅ Email grammar is valid');
        } else {
          console.log('❌ Email grammar has errors:');
          validation.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (validation.warnings.length > 0) {
          console.log('⚠️ Warnings:');
          validation.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        break;

      case 'templates':
        console.log('Available email templates:');
        emailGrammarGenerator.getTemplates().forEach(template => {
          const email = emailGrammarGenerator.generateEmail(template.config);
          console.log(`\n📧 ${template.name}`);
          console.log(`   ${template.description}`);
          console.log(`   Email: ${email}`);
        });
        break;

      default:
        console.log('Email Grammar Generator');
        console.log('Usage:');
        console.log('  interactive    - Build email interactively');
        console.log('  validate <email> - Validate email grammar');
        console.log('  templates      - Show available templates');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
