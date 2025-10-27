#!/usr/bin/env bun
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const VERSION_FILE = join(process.cwd(), '.tgk', 'VERSION');

// Get current version
function getCurrentVersion(): string {
  try {
    return readFileSync(VERSION_FILE, 'utf8').trim();
  } catch {
    return '4.4.0';
  }
}

// Run git commands safely
function runGitCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`❌ Git command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Main release process
function release(): void {
  const newVersion = getCurrentVersion();
  const tagName = `v${newVersion}`;

  console.log(`🚀 Releasing ${tagName}...`);

  // Check if we're on main branch
  const currentBranch = runGitCommand('git branch --show-current');
  if (currentBranch !== 'main') {
    console.error(`❌ Must be on main branch. Current: ${currentBranch}`);
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = runGitCommand('git status --porcelain');
  if (status) {
    console.error('❌ Uncommitted changes detected:');
    console.error(status);
    process.exit(1);
  }

  // Configure git user (for CI)
  if (process.env.CI) {
    runGitCommand('git config user.name "github-actions[bot]"');
    runGitCommand('git config user.email "github-actions[bot]@users.noreply.github.com"');
  }

  // Create annotated tag
  const tagMessage = `Release ${tagName}`;
  runGitCommand(`git tag -a "${tagName}" -m "${tagMessage}"`);

  // Push tag
  runGitCommand(`git push origin "${tagName}"`);

  console.log(`✅ Released ${tagName}`);
  console.log(`🔗 https://github.com/brendadeeznuts1111/alchmenyrun/releases/tag/${tagName}`);
}

// Run release
try {
  release();
} catch (error) {
  console.error(`❌ Release failed: ${error.message}`);
  process.exit(1);
}
