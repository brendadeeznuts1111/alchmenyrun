#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const VERSION_FILE = join(process.cwd(), '.tgk', 'VERSION');
const PACKAGE_JSON = join(process.cwd(), 'package.json');

// Read current version from .tgk/VERSION
function getCurrentVersion(): string {
  try {
    return readFileSync(VERSION_FILE, 'utf8').trim();
  } catch {
    return '4.4.0'; // Default fallback
  }
}

// Parse version into components
function parseVersion(version: string): { major: number; minor: number; patch: number; pre?: string; preNum?: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+)\.(\d+))?$/);
  if (!match) throw new Error(`Invalid version format: ${version}`);

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    pre: match[4],
    preNum: match[4] ? parseInt(match[5]) : undefined
  };
}

// Generate new version
function bumpVersion(currentVersion: string, type: 'patch' | 'minor' | 'major' | 'canary'): string {
  const parsed = parseVersion(currentVersion);

  switch (type) {
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;

    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;

    case 'major':
      return `${parsed.major + 1}.0.0`;

    case 'canary':
      if (parsed.pre === 'canary' && parsed.preNum !== undefined) {
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-canary.${parsed.preNum + 1}`;
      } else {
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-canary.0`;
      }

    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

// Update version files
function updateVersionFiles(newVersion: string): void {
  // Update .tgk/VERSION
  writeFileSync(VERSION_FILE, newVersion + '\n');

  // Update package.json
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  packageJson.version = newVersion;
  writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`✅ Version bumped to ${newVersion}`);
}

// Main execution
const bumpType = process.argv[2] as 'patch' | 'minor' | 'major' | 'canary';

if (!bumpType || !['patch', 'minor', 'major', 'canary'].includes(bumpType)) {
  console.error('Usage: bun run scripts/version-bump.ts <patch|minor|major|canary>');
  process.exit(1);
}

try {
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`🔄 Bumping version: ${currentVersion} → ${newVersion}`);
  updateVersionFiles(newVersion);

  // Output for GitHub Actions
  console.log(`::set-output name=new_version::${newVersion}`);

} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
