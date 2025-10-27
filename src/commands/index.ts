// CLI commands for scope management
export { scopeList } from "./scope-list";
export { scopeInspect } from "./scope-inspect";
export { finalize } from "./finalize";

/**
 * Command registry for the Alchemy CLI
 */
export const commands = {
  "scope-list": {
    description: "List all stages and scopes in an application",
    handler: (args: string[]) => {
      const appName = args[0];
      return import("./scope-list").then(m => m.scopeList(appName));
    }
  },

  "scope-inspect": {
    description: "Inspect a specific stage and its resources",
    handler: (args: string[]) => {
      const [appName, stageName, ...options] = args;
      const json = options.includes("--json");
      const showResources = !options.includes("--no-resources");
      const showNested = !options.includes("--no-nested");

      return import("./scope-inspect").then(m =>
        m.scopeInspect(appName, stageName, { json, showResources, showNested })
      );
    }
  },

  "finalize": {
    description: "Clean up orphaned resources in scopes",
    handler: (args: string[]) => {
      // Parse command line arguments for finalize
      let app: string | undefined;
      let stage: string | undefined;
      let all = false;
      let dryRun = false;
      let strategy: 'conservative' | 'aggressive' = 'conservative';
      let retryAttempts = 3;
      let force = false;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
          case '--app':
            app = args[++i];
            break;
          case '--stage':
            stage = args[++i];
            break;
          case '--all':
            all = true;
            break;
          case '--dry-run':
            dryRun = true;
            break;
          case '--strategy':
            const strat = args[++i];
            if (strat === 'conservative' || strat === 'aggressive') {
              strategy = strat;
            }
            break;
          case '--retry':
            retryAttempts = parseInt(args[++i]) || 3;
            break;
          case '--force':
            force = true;
            break;
        }
      }

      return import("./finalize").then(m =>
        m.finalize({ app, stage, all, dryRun, strategy, retryAttempts, force })
      );
    }
  }
} as const;

/**
 * Get help text for all commands
 */
export function getCommandsHelp(): string {
  let help = "🔧 Alchemy Scope Commands:\n\n";

  for (const [name, cmd] of Object.entries(commands)) {
    help += `  alchemy ${name}\n`;
    help += `    ${cmd.description}\n\n`;
  }

  help += "For detailed help on a specific command, run:\n";
  help += "  alchemy <command> --help\n";

  return help;
}
