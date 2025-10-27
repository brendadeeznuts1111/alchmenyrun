#!/usr/bin/env bun
/**
 * Scope Monitor - Real-time monitoring and alerting for scope system
 * Usage: bun run scripts/scope-monitor.ts [options]
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { ScopeCLI } from "../src/scope/scope-inspector";

interface MonitorOptions {
  interval?: number; // Check interval in seconds
  alerts?: boolean; // Enable alerts
  threshold?: {
    maxScopes?: number;
    maxResources?: number;
    maxAge?: number; // Max age in days for state files
  };
}

class ScopeMonitor {
  private options: MonitorOptions;
  private cli: ScopeCLI;
  private lastStats: any = null;

  constructor(options: MonitorOptions = {}) {
    this.options = {
      interval: 300, // 5 minutes default
      alerts: true,
      threshold: {
        maxScopes: 50,
        maxResources: 100,
        maxAge: 30, // 30 days
      },
      ...options
    };
    this.cli = new ScopeCLI();
  }

  async startMonitoring(): Promise<void> {
    console.log("🔍 Starting Scope System Monitor");
    console.log(`📊 Check interval: ${this.options.interval}s`);
    console.log(`🚨 Alerts: ${this.options.alerts ? 'enabled' : 'disabled'}`);
    console.log("");

    // Initial check
    await this.performCheck();

    // Continuous monitoring
    if (this.options.interval && this.options.interval > 0) {
      setInterval(async () => {
        await this.performCheck();
      }, this.options.interval * 1000);
    }
  }

  private async performCheck(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] 🔍 Performing scope health check...`);

      const stats = await this.getScopeStatistics();
      const issues = await this.analyzeHealth(stats);

      if (issues.length > 0) {
        console.log(`⚠️  Found ${issues.length} issues:`);
        issues.forEach(issue => console.log(`   • ${issue}`));

        if (this.options.alerts) {
          await this.sendAlerts(issues);
        }
      } else {
        console.log("✅ All systems healthy");
      }

      // Show summary
      console.log(`📊 Current stats: ${stats.totalScopes} scopes, ${stats.totalResources} resources`);
      console.log("");

      this.lastStats = stats;

    } catch (error) {
      console.error(`❌ Monitoring check failed:`, error);
    }
  }

  private async getScopeStatistics(): Promise<{
    totalScopes: number;
    totalResources: number;
    oldestStateFile: number;
    lockedScopes: string[];
  }> {
    const baseDir = ".alchemy";
    const stats = {
      totalScopes: 0,
      totalResources: 0,
      oldestStateFile: Date.now(),
      lockedScopes: [] as string[]
    };

    if (!existsSync(baseDir)) {
      return stats;
    }

    // Walk through all state files
    const walkDir = (dir: string, currentPath: string[] = []): void => {
      const entries = require("fs").readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          walkDir(fullPath, [...currentPath, entry.name]);
        } else if (entry.name === "state.json") {
          stats.totalScopes++;
          const scopePath = [...currentPath].join("/");

          try {
            const stateData = JSON.parse(readFileSync(fullPath, "utf8"));
            stats.totalResources += Object.keys(stateData.resources || {}).length;

            const fileAge = Date.now() - stateData.updatedAt;
            if (fileAge < stats.oldestStateFile) {
              stats.oldestStateFile = fileAge;
            }
          } catch (error) {
            console.warn(`Failed to parse state file: ${fullPath}`);
          }
        } else if (entry.name === ".lock") {
          stats.lockedScopes.push([...currentPath].join("/"));
        }
      }
    };

    walkDir(baseDir);
    return stats;
  }

  private async analyzeHealth(stats: any): Promise<string[]> {
    const issues: string[] = [];
    const threshold = this.options.threshold!;

    // Check scope count
    if (stats.totalScopes > threshold.maxScopes!) {
      issues.push(`Too many scopes: ${stats.totalScopes} (threshold: ${threshold.maxScopes})`);
    }

    // Check resource count
    if (stats.totalResources > threshold.maxResources!) {
      issues.push(`Too many resources: ${stats.totalResources} (threshold: ${threshold.maxResources})`);
    }

    // Check for locked scopes
    if (stats.lockedScopes.length > 0) {
      issues.push(`Found ${stats.lockedScopes.length} locked scopes: ${stats.lockedScopes.join(", ")}`);
    }

    // Check state file age
    const maxAgeMs = threshold.maxAge! * 24 * 60 * 60 * 1000;
    if (stats.oldestStateFile > maxAgeMs) {
      const daysOld = Math.floor(stats.oldestStateFile / (24 * 60 * 60 * 1000));
      issues.push(`Old state files detected (${daysOld} days old)`);
    }

    // Check for orphaned resources
    const orphanedIssues = await this.checkOrphanedResources();
    issues.push(...orphanedIssues);

    return issues;
  }

  private async checkOrphanedResources(): Promise<string[]> {
    const issues: string[] = [];

    try {
      // Use the CLI to check for orphaned resources
      // This is a simplified check - in production you'd want more sophisticated logic
      const baseDir = ".alchemy";
      if (!existsSync(baseDir)) return issues;

      // Look for state files that might indicate orphaned resources
      // This is a placeholder - real implementation would compare with alchemy.run.ts

      return issues;
    } catch (error) {
      issues.push(`Failed to check orphaned resources: ${error}`);
      return issues;
    }
  }

  private async sendAlerts(issues: string[]): Promise<void> {
    // Send alerts via multiple channels
    console.log("🚨 Sending alerts...");

    // 1. Log to file
    const alertLog = join(".alchemy", "alerts.log");
    const timestamp = new Date().toISOString();
    const alertMessage = `[${timestamp}] ALERT: ${issues.join("; ")}\n`;

    try {
      require("fs").appendFileSync(alertLog, alertMessage);
      console.log("📝 Alert logged to .alchemy/alerts.log");
    } catch (error) {
      console.warn("Failed to log alert:", error);
    }

    // 2. Send to Telegram (if configured)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const message = `🚨 *Alchemy Scope Alert*\n\n${issues.map(issue => `• ${issue}`).join("\n")}`;
        // Note: In production, you'd use the Telegram API here
        console.log("📱 Telegram alert would be sent:", message);
      } catch (error) {
        console.warn("Failed to send Telegram alert:", error);
      }
    }

    // 3. Send to webhook (if configured)
    if (process.env.SCOPE_ALERT_WEBHOOK) {
      try {
        const payload = {
          timestamp,
          type: "scope_alert",
          issues,
          stats: this.lastStats
        };
        console.log("🔗 Webhook alert would be sent to:", process.env.SCOPE_ALERT_WEBHOOK);
      } catch (error) {
        console.warn("Failed to send webhook alert:", error);
      }
    }
  }

  // One-time check method
  async checkOnce(): Promise<void> {
    console.log("🔍 Performing one-time scope health check...");
    await this.performCheck();
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let interval: number | undefined;
  let alerts = true;
  let checkOnce = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--interval":
      case "-i":
        interval = parseInt(args[++i]);
        if (isNaN(interval)) {
          console.error("Invalid interval:", args[i]);
          process.exit(1);
        }
        break;
      case "--no-alerts":
        alerts = false;
        break;
      case "--once":
      case "--check-once":
        checkOnce = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
      default:
        console.error("Unknown option:", arg);
        showHelp();
        process.exit(1);
    }
  }

  const monitor = new ScopeMonitor({
    interval,
    alerts
  });

  if (checkOnce) {
    await monitor.checkOnce();
  } else {
    await monitor.startMonitoring();

    // Keep running
    process.on('SIGINT', () => {
      console.log("\n🛑 Stopping scope monitor...");
      process.exit(0);
    });
  }
}

function showHelp() {
  console.log(`
Scope Monitor - Real-time monitoring and alerting for scope system

Usage: scope-monitor [options]

Options:
  --interval, -i <seconds>   Check interval in seconds (default: 300)
  --no-alerts                Disable alerts
  --once, --check-once       Perform one-time check only
  --help, -h                 Show this help

Environment Variables:
  TELEGRAM_BOT_TOKEN         Bot token for Telegram alerts
  TELEGRAM_CHAT_ID           Chat ID for Telegram alerts
  SCOPE_ALERT_WEBHOOK        Webhook URL for alerts

Examples:
  scope-monitor --once                          # Single check
  scope-monitor --interval 60                   # Check every minute
  scope-monitor --no-alerts                     # Monitor without alerts
`);
}

if (import.meta.main) {
  main().catch(error => {
    console.error("Monitor failed:", error);
    process.exit(1);
  });
}
