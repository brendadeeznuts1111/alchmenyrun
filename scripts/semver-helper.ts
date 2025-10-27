#!/usr/bin/env bun
/**
 * Bun Native Semver Helper
 * Drop-in semver validation & bump using Bun's built-in semver (20x faster than node-semver)
 */

import { semver } from 'bun';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export type BumpType = 'major' | 'minor' | 'patch';

/**
 * Calculate next version based on bump type
 */
export function nextVersion(current: string, bump: BumpType): string {
  const parts = current.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid semver format: ${current} (expected x.y.z)`);
  }

  const [major, minor, patch] = parts.map(Number);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid semver numbers in: ${current}`);
  }

  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${bump} (expected: major, minor, or patch)`);
  }
}

/**
 * Validate that new version is greater than old version using Bun's native semver
 */
export function validateBump(oldVersion: string, newVersion: string): void {
  const order = semver.order(oldVersion, newVersion);

  if (order !== -1) {
    throw new Error(
      `❌ Invalid version bump: ${oldVersion} → ${newVersion}\n` +
      `   New version must be greater than current version.\n` +
      `   Comparison result: ${order} (expected: -1 for valid bump)`
    );
  }
}

/**
 * Get current version from package.json
 */
export function getCurrentVersion(packageJsonPath: string = './package.json'): string {
  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    if (!pkg.version || typeof pkg.version !== 'string') {
      throw new Error('No version field found in package.json');
    }

    return pkg.version;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update version in package.json
 */
export function updatePackageVersion(newVersion: string, packageJsonPath: string = './package.json'): void {
  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    pkg.version = newVersion;

    // Write back with 2-space indentation to match common formatting
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update package.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Bun Native Semver Helper

Usage:
  bun scripts/semver-helper.ts <bump-type> [options]

Bump Types:
  major       1.2.3 → 2.0.0
  minor       1.2.3 → 1.3.0
  patch       1.2.3 → 1.2.4

Options:
  --dry-run   Show what would change without writing
  --current   Show current version and exit
  --help, -h  Show this help message

Examples:
  bun scripts/semver-helper.ts patch
  bun scripts/semver-helper.ts minor --dry-run
  bun scripts/semver-helper.ts --current
`);
    process.exit(0);
  }

  // Handle --current flag
  if (args.includes('--current')) {
    const current = getCurrentVersion();
    console.log(current);
    process.exit(0);
  }

  const bumpType = args[0] as BumpType;
  const isDryRun = args.includes('--dry-run');

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(`❌ Invalid bump type: ${bumpType}`);
    console.error('   Expected: major, minor, or patch');
    process.exit(1);
  }

  try {
    const currentVersion = getCurrentVersion();
    const newVersion = nextVersion(currentVersion, bumpType);

    // Validate using Bun's native semver
    validateBump(currentVersion, newVersion);

    console.log(`✅ Version bump validated: ${currentVersion} → ${newVersion}`);
    console.log(`   Bump type: ${bumpType}`);
    console.log(`   Using Bun native semver (20x faster than node-semver)`);

    if (isDryRun) {
      console.log(`\n📋 DRY RUN - No changes written`);
      console.log(`   Would update package.json to: ${newVersion}`);
    } else {
      updatePackageVersion(newVersion);
      console.log(`\n✅ package.json updated to ${newVersion}`);
    }

    // Output just the version for shell scripting
    if (!isDryRun && !process.stdout.isTTY) {
      console.log(newVersion);
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
