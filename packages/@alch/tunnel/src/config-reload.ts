/**
 * Zero-downtime configuration reload for Cloudflare Tunnel resource
 * Handles config diffing, checksums, and hot reloading
 */

import { createHash } from "crypto";
import type { TunnelConfig } from "./index.js";

export interface ConfigVersion {
  version: number;
  checksum: string;
  config: TunnelConfig;
  appliedAt: number;
  appliedBy: string;
}

export interface ConfigDiff {
  added: string[];
  removed: string[];
  modified: Record<string, { old: any; new: any }>;
  hasChanges: boolean;
}

export interface ReloadOptions {
  validateConfig?: (config: TunnelConfig) => Promise<boolean>;
  onBeforeReload?: (oldConfig: TunnelConfig, newConfig: TunnelConfig) => Promise<void>;
  onAfterReload?: (oldConfig: TunnelConfig, newConfig: TunnelConfig) => Promise<void>;
  onError?: (error: Error, config: TunnelConfig) => void;
}

/**
 * Configuration reload manager
 */
export class ConfigReloadManager {
  private currentConfig: TunnelConfig | null = null;
  private configHistory: ConfigVersion[] = [];
  private currentVersion = 0;
  private options: ReloadOptions;

  constructor(options: ReloadOptions = {}) {
    this.options = options;
  }

  /**
   * Calculate checksum for configuration
   */
  private calculateChecksum(config: TunnelConfig): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Compare two configurations and generate diff
   */
  private compareConfigs(oldConfig: TunnelConfig, newConfig: TunnelConfig): ConfigDiff {
    const diff: ConfigDiff = {
      added: [],
      removed: [],
      modified: {},
      hasChanges: false,
    };

    // Compare ingress rules
    const oldIngress = oldConfig.ingress || [];
    const newIngress = newConfig.ingress || [];

    // Find added ingress rules
    newIngress.forEach((rule, index) => {
      const matchingOld = oldIngress.find(old => 
        JSON.stringify(old) === JSON.stringify(rule)
      );
      if (!matchingOld) {
        diff.added.push(`ingress[${index}]`);
        diff.hasChanges = true;
      }
    });

    // Find removed ingress rules
    oldIngress.forEach((rule, index) => {
      const matchingNew = newIngress.find(newRule => 
        JSON.stringify(newRule) === JSON.stringify(rule)
      );
      if (!matchingNew) {
        diff.removed.push(`ingress[${index}]`);
        diff.hasChanges = true;
      }
    });

    // Compare warp routing
    if (JSON.stringify(oldConfig.warpRouting) !== JSON.stringify(newConfig.warpRouting)) {
      diff.modified.warpRouting = {
        old: oldConfig.warpRouting,
        new: newConfig.warpRouting,
      };
      diff.hasChanges = true;
    }

    // Compare origin request config
    if (JSON.stringify(oldConfig.originRequest) !== JSON.stringify(newConfig.originRequest)) {
      diff.modified.originRequest = {
        old: oldConfig.originRequest,
        new: newConfig.originRequest,
      };
      diff.hasChanges = true;
    }

    return diff;
  }

  /**
   * Validate configuration
   */
  private async validateConfig(config: TunnelConfig): Promise<boolean> {
    if (this.options.validateConfig) {
      return await this.options.validateConfig(config);
    }
    return true;
  }

  /**
   * Apply configuration with zero-downtime
   */
  async reloadConfig(
    newConfig: TunnelConfig,
    appliedBy: string = 'system'
  ): Promise<{ success: boolean; diff: ConfigDiff; version: number }> {
    try {
      // Validate new configuration
      const isValid = await this.validateConfig(newConfig);
      if (!isValid) {
        throw new Error('Configuration validation failed');
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(newConfig);

      // Check if configuration actually changed
      if (this.currentConfig && this.calculateChecksum(this.currentConfig) === checksum) {
        return {
          success: true,
          diff: { added: [], removed: [], modified: {}, hasChanges: false },
          version: this.currentVersion,
        };
      }

      // Generate diff
      const diff = this.currentConfig 
        ? this.compareConfigs(this.currentConfig, newConfig)
        : { added: ['config'], removed: [], modified: {}, hasChanges: true };

      // Execute before reload hook
      if (this.options.onBeforeReload && this.currentConfig) {
        await this.options.onBeforeReload(this.currentConfig, newConfig);
      }

      // Apply new configuration
      const oldConfig = this.currentConfig;
      this.currentConfig = newConfig;
      this.currentVersion++;

      // Store in history
      const configVersion: ConfigVersion = {
        version: this.currentVersion,
        checksum,
        config: JSON.parse(JSON.stringify(newConfig)), // Deep clone
        appliedAt: Date.now(),
        appliedBy,
      };

      this.configHistory.push(configVersion);

      // Keep only last 10 versions
      if (this.configHistory.length > 10) {
        this.configHistory = this.configHistory.slice(-10);
      }

      // Execute after reload hook
      if (this.options.onAfterReload && oldConfig) {
        await this.options.onAfterReload(oldConfig, newConfig);
      }

      console.log(`Configuration reloaded successfully (version ${this.currentVersion})`);
      console.log(`Changes: ${diff.added.length} added, ${diff.removed.length} removed, ${Object.keys(diff.modified).length} modified`);

      return {
        success: true,
        diff,
        version: this.currentVersion,
      };

    } catch (error) {
      console.error('Configuration reload failed:', error);
      
      if (this.options.onError) {
        this.options.onError(error as Error, newConfig);
      }

      return {
        success: false,
        diff: { added: [], removed: [], modified: {}, hasChanges: false },
        version: this.currentVersion,
      };
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): TunnelConfig | null {
    return this.currentConfig ? JSON.parse(JSON.stringify(this.currentConfig)) : null;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Get configuration history
   */
  getConfigHistory(): ConfigVersion[] {
    return this.configHistory.map(version => ({
      ...version,
      config: JSON.parse(JSON.stringify(version.config)),
    }));
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(version: number, appliedBy: string = 'rollback'): Promise<{ success: boolean; version: number }> {
    const targetVersion = this.configHistory.find(v => v.version === version);
    
    if (!targetVersion) {
      throw new Error(`Version ${version} not found in history`);
    }

    console.log(`Rolling back to version ${version}`);
    
    const result = await this.reloadConfig(targetVersion.config, appliedBy);
    
    if (result.success) {
      console.log(`Successfully rolled back to version ${version}`);
    } else {
      console.error(`Rollback to version ${version} failed`);
    }

    return result;
  }
}

/**
 * Create a config reload manager for tunnels
 */
export function createTunnelConfigReloadManager(options: ReloadOptions = {}): ConfigReloadManager {
  return new ConfigReloadManager({
    validateConfig: async (config) => {
      // Basic validation
      if (!config) return false;
      
      // Validate ingress rules if present
      if (config.ingress) {
        for (const rule of config.ingress) {
          if (!rule.service) {
            throw new Error('Ingress rule missing required service field');
          }
        }
      }
      
      return true;
    },
    onBeforeReload: async (oldConfig, newConfig) => {
      console.log('Preparing configuration reload...');
    },
    onAfterReload: async (oldConfig, newConfig) => {
      console.log('Configuration reload completed');
    },
    onError: (error, config) => {
      console.error('Configuration reload error:', error);
    },
    ...options,
  });
}
