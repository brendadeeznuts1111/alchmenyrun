#!/usr/bin/env bun
/**
 * CODEOWNERS Validation Script
 * Tests CODEOWNERS configuration against file changes
 * Usage: bun run scripts/validate-codeowners.ts [branch-or-commit]
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface CodeOwnerRule {
  pattern: string;
  owners: string[];
  lineNumber: number;
}

interface FileOwnership {
  file: string;
  owners: string[];
  rules: CodeOwnerRule[];
}

class CodeOwnersValidator {
  private codeownersPath = ".github/CODEOWNERS";
  private rules: CodeOwnerRule[] = [];

  async loadCodeOwners(): Promise<void> {
    if (!existsSync(this.codeownersPath)) {
      throw new Error("CODEOWNERS file not found at .github/CODEOWNERS");
    }

    const content = readFileSync(this.codeownersPath, "utf8");
    const lines = content.split("\n");

    this.rules = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and empty lines
      if (line.startsWith("#") || line === "") {
        continue;
      }

      // Parse pattern and owners
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const pattern = parts[0];
        const owners = parts.slice(1);

        this.rules.push({
          pattern,
          owners,
          lineNumber: i + 1
        });
      }
    }

    console.log(`📋 Loaded ${this.rules.length} CODEOWNERS rules`);
  }

  /**
   * Get ownership for a specific file path
   */
  getOwnership(filePath: string): FileOwnership {
    const matchingRules: CodeOwnerRule[] = [];
    const allOwners = new Set<string>();

    // Check each rule against the file path
    for (const rule of this.rules) {
      if (this.matchesPattern(filePath, rule.pattern)) {
        matchingRules.push(rule);
        rule.owners.forEach(owner => allOwners.add(owner));
      }
    }

    return {
      file: filePath,
      owners: Array.from(allOwners).sort(),
      rules: matchingRules
    };
  }

  /**
   * Check if a file path matches a CODEOWNERS pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert CODEOWNERS pattern to regex
    // Handle glob patterns: * and **
    let regexPattern = pattern
      .replace(/\./g, "\\.")  // Escape dots
      .replace(/\*\*/g, ".*") // ** matches any characters recursively
      .replace(/\*/g, "[^/]*"); // * matches any characters except /

    // Add start and end anchors
    if (!regexPattern.startsWith("/")) {
      regexPattern = ".*" + regexPattern;
    }

    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    } catch (error) {
      console.warn(`Invalid regex pattern: ${regexPattern}`);
      return false;
    }
  }

  /**
   * Analyze ownership for a set of changed files
   */
  async analyzeChanges(files: string[]): Promise<{
    totalFiles: number;
    ownedFiles: number;
    unownedFiles: number;
    allOwners: string[];
    fileOwnerships: FileOwnership[];
  }> {
    await this.loadCodeOwners();

    const fileOwnerships: FileOwnership[] = [];
    const allOwners = new Set<string>();
    let ownedFiles = 0;
    let unownedFiles = 0;

    for (const file of files) {
      const ownership = this.getOwnership(file);
      fileOwnerships.push(ownership);

      if (ownership.owners.length > 0) {
        ownedFiles++;
        ownership.owners.forEach(owner => allOwners.add(owner));
      } else {
        unownedFiles++;
      }
    }

    return {
      totalFiles: files.length,
      ownedFiles,
      unownedFiles,
      allOwners: Array.from(allOwners).sort(),
      fileOwnerships
    };
  }

  /**
   * Get files changed in a branch or commit
   */
  async getChangedFiles(ref?: string): Promise<string[]> {
    const { spawn } = require("child_process");

    return new Promise((resolve, reject) => {
      // Default to comparing with main branch
      const compareRef = ref || "origin/main";

      const git = spawn("git", ["diff", "--name-only", compareRef], {
        stdio: "pipe"
      });

      let output = "";
      git.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      git.on("close", (code: number) => {
        if (code === 0) {
          const files = output.trim().split("\n").filter(Boolean);
          resolve(files);
        } else {
          reject(new Error(`Git diff failed with code ${code}`));
        }
      });

      git.on("error", reject);
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const validator = new CodeOwnersValidator();

  try {
    // Load CODEOWNERS
    await validator.loadCodeOwners();

    // Get changed files
    const ref = args[0] || "origin/main";
    console.log(`🔍 Analyzing changes compared to: ${ref}`);

    const changedFiles = await validator.getChangedFiles(ref);

    if (changedFiles.length === 0) {
      console.log("ℹ️  No changed files found");
      return;
    }

    console.log(`📝 Found ${changedFiles.length} changed files\n`);

    // Analyze ownership
    const analysis = await validator.analyzeChanges(changedFiles);

    // Display results
    console.log("📊 CODEOWNERS Analysis:");
    console.log("─".repeat(50));
    console.log(`Total files: ${analysis.totalFiles}`);
    console.log(`Owned files: ${analysis.ownedFiles}`);
    console.log(`Unowned files: ${analysis.unownedFiles}`);
    console.log(`Required reviewers: ${analysis.allOwners.join(", ")}`);
    console.log("");

    // Show file-by-file breakdown
    console.log("📋 File Ownership Details:");
    console.log("─".repeat(50));

    for (const ownership of analysis.fileOwnerships) {
      const status = ownership.owners.length > 0 ? "✅" : "❌";
      const owners = ownership.owners.length > 0 ? ownership.owners.join(", ") : "No owners";

      console.log(`${status} ${ownership.file}`);
      console.log(`   └─ Owners: ${owners}`);

      if (ownership.rules.length > 0) {
        console.log(`   └─ Rules: ${ownership.rules.map(r => `line ${r.lineNumber}: ${r.pattern}`).join("; ")}`);
      }
      console.log("");
    }

    // Summary for PR
    console.log("🎯 PR Review Requirements:");
    console.log("─".repeat(50));

    if (analysis.allOwners.length > 0) {
      console.log("Required reviewers:");
      analysis.allOwners.forEach(owner => {
        console.log(`  • ${owner}`);
      });
    } else {
      console.log("❌ No CODEOWNERS rules matched - PR may not require reviews");
    }

    if (analysis.unownedFiles > 0) {
      console.log(`\n⚠️  ${analysis.unownedFiles} files have no owners assigned`);
      console.log("Consider adding CODEOWNERS rules for better review coverage");
    }

  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
}
