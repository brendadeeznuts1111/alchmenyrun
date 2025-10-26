#!/usr/bin/env bun
/**
 * alchemy-kit - Infrastructure code generator
 * Generate resources, blocks, workflows, and cron jobs from templates
 */

import { $ } from "bun";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { join } from "node:path";

const { positionals } = parseArgs({
  allowPositionals: true,
  strict: false,
});

const [cmd, type, name] = positionals;

async function generate(type: string, name: string) {
  // Validate inputs
  if (!type || !name) {
    console.error("❌ Usage: alchemy-kit generate <type> <name>");
    console.error("\nTypes: resource, block, workflow, cron");
    process.exit(1);
  }

  // Find template directory
  const templateDir = join(import.meta.dir, "../templates", type);

  if (!existsSync(templateDir)) {
    console.error(`❌ Template type "${type}" not found`);
    console.error("\nAvailable types: resource, block, workflow, cron");
    process.exit(1);
  }

  // Create destination directory
  const destDir = join(process.cwd(), "src", `${type}s`, name);

  if (existsSync(destDir)) {
    console.error(`❌ Directory already exists: ${destDir}`);
    process.exit(1);
  }

  // Copy template files
  await $`mkdir -p ${destDir}`;
  await $`cp -r ${templateDir}/* ${destDir}/`;

  // Replace __NAME__ placeholder in all files
  const files = await $`find ${destDir} -type f`.text();
  for (const file of files.trim().split("\n")) {
    if (file) {
      await $`sed -i '' 's/__NAME__/${name}/g' ${file}`;
    }
  }

  console.log(`✅ Generated ${type} "${name}" in ${destDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${destDir}`);
  console.log(`  # Edit the generated files`);
  console.log(`  alchemy deploy --profile dev`);
}

// Main CLI logic
if (cmd === "generate" || cmd === "g") {
  await generate(type, name);
} else if (cmd === "help" || cmd === "--help" || cmd === "-h" || !cmd) {
  console.log(`
alchemy-kit - Infrastructure code generator

Usage:
  alchemy-kit generate <type> <name>
  alchemy-kit g <type> <name>          (shorthand)

Types:
  resource   - Generic Cloudflare Worker
  block      - Reusable building block (chat, queue, etc.)
  workflow   - Durable Workflow
  cron       - Scheduled task handler

Examples:
  alchemy-kit generate resource hello
  alchemy-kit g block chat-room
  alchemy-kit generate workflow onboarding
  alchemy-kit g cron nightly-cleanup
  `);
} else {
  console.error(`❌ Unknown command: ${cmd}`);
  console.error("Run 'alchemy-kit help' for usage");
  process.exit(1);
}
