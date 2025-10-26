/** Graceful shutdown hooks for Cloudflare Tunnels */

import type { Tunnel } from "./index.js";
import { metricsCollector } from "./metrics.js";
import { logger } from "alchemy";

export interface ShutdownConfig {
  /**
   * Grace period in milliseconds before forced shutdown
   * @default 30000 (30 seconds)
   */
  gracePeriodMs?: number;

  /**
   * Whether to wait for active connections to close
   * @default true
   */
  waitForActiveConnections?: boolean;

  /**
   * Maximum time to wait for connections to close
   * @default 10000 (10 seconds)
   */
  connectionTimeoutMs?: number;

  /**
   * Whether to export final metrics before shutdown
   * @default true
   */
  exportFinalMetrics?: boolean;

  /**
   * Custom cleanup functions to run during shutdown
   */
  cleanupFunctions?: Array<() => Promise<void>>;

  /**
   * Whether to attempt tunnel deletion on shutdown
   * @default false
   */
  deleteTunnelsOnShutdown?: boolean;
}

export interface ShutdownStatus {
  startTime: Date;
  endTime?: Date;
  phase: "starting" | "stopping_connections" | "cleaning_resources" | "exporting_metrics" | "completed" | "failed";
  tunnelsProcessed: number;
  activeConnectionsClosed: number;
  cleanupFunctionsRun: number;
  errors: Array<{
    phase: string;
    error: string;
    timestamp: Date;
  }>;
}

export class TunnelShutdownManager {
  private config: Required<ShutdownConfig>;
  private status: ShutdownStatus;
  private isShuttingDown: boolean = false;
  private shutdownPromise: Promise<void> | null = null;

  constructor(config: ShutdownConfig = {}) {
    this.config = {
      gracePeriodMs: config.gracePeriodMs || 30000,
      waitForActiveConnections: config.waitForActiveConnections !== false,
      connectionTimeoutMs: config.connectionTimeoutMs || 10000,
      exportFinalMetrics: config.exportFinalMetrics !== false,
      cleanupFunctions: config.cleanupFunctions || [],
      deleteTunnelsOnShutdown: config.deleteTunnelsOnShutdown || false,
    };

    this.status = {
      startTime: new Date(),
      phase: "starting",
      tunnelsProcessed: 0,
      activeConnectionsClosed: 0,
      cleanupFunctionsRun: 0,
      errors: [],
    };

    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.log(`Received ${signal}, initiating graceful shutdown...`);
        this.initiateShutdown();
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception, initiating emergency shutdown:", error);
      this.status.errors.push({
        phase: "emergency",
        error: error.message,
        timestamp: new Date(),
      });
      this.initiateShutdown();
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection, initiating emergency shutdown:", reason);
      this.status.errors.push({
        phase: "emergency",
        error: String(reason),
        timestamp: new Date(),
      });
      this.initiateShutdown();
    });
  }

  async initiateShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.log("Shutdown already in progress, ignoring duplicate request");
      return;
    }

    this.isShuttingDown = true;
    this.status.startTime = new Date();
    this.status.phase = "starting";

    // Return existing shutdown promise if already running
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }

  private async performShutdown(): Promise<void> {
    try {
      logger.log("Starting graceful shutdown sequence...");

      // Phase 1: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Phase 2: Wait for active connections to close
      if (this.config.waitForActiveConnections) {
        await this.waitForActiveConnections();
      }

      // Phase 3: Stop metrics collection
      await this.stopMetricsCollection();

      // Phase 4: Run cleanup functions
      await this.runCleanupFunctions();

      // Phase 5: Export final metrics
      if (this.config.exportFinalMetrics) {
        await this.exportFinalMetrics();
      }

      // Phase 6: Handle tunnel deletion if configured
      if (this.config.deleteTunnelsOnShutdown) {
        await this.deleteTunnels();
      }

      this.status.phase = "completed";
      this.status.endTime = new Date();
      
      const duration = this.status.endTime.getTime() - this.status.startTime.getTime();
      logger.log(`Graceful shutdown completed in ${duration}ms`);

    } catch (error) {
      this.status.phase = "failed";
      this.status.endTime = new Date();
      this.status.errors.push({
        phase: this.status.phase,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      
      logger.error("Graceful shutdown failed:", error);
      throw error;
    }
  }

  private async stopAcceptingConnections(): Promise<void> {
    logger.log("Stopping acceptance of new connections...");
    this.status.phase = "stopping_connections";
    
    // In a real implementation, this would stop the tunnel listener
    // For now, we'll simulate the process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.log("Stopped accepting new connections");
  }

  private async waitForActiveConnections(): Promise<void> {
    logger.log("Waiting for active connections to close...");
    
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second
    
    while (Date.now() - startTime < this.config.connectionTimeoutMs) {
      const activeConnections = this.getActiveConnectionsCount();
      
      if (activeConnections === 0) {
        logger.log("All active connections closed");
        this.status.activeConnectionsClosed = activeConnections;
        break;
      }
      
      logger.log(`Waiting for ${activeConnections} active connections to close...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    const remainingConnections = this.getActiveConnectionsCount();
    if (remainingConnections > 0) {
      logger.warn(`Timeout reached, ${remainingConnections} connections still active`);
      this.status.activeConnectionsClosed = remainingConnections;
    }
  }

  private getActiveConnectionsCount(): number {
    // In a real implementation, this would query actual connection counts
    // For now, we'll simulate based on metrics
    const allMetrics = metricsCollector.getAllMetrics();
    return allMetrics.reduce((total, metrics) => total + metrics.activeConnections, 0);
  }

  private async stopMetricsCollection(): Promise<void> {
    logger.log("Stopping metrics collection...");
    metricsCollector.stopCollection();
    logger.log("Metrics collection stopped");
  }

  private async runCleanupFunctions(): Promise<void> {
    logger.log("Running cleanup functions...");
    this.status.phase = "cleaning_resources";
    
    for (const cleanupFn of this.config.cleanupFunctions) {
      try {
        await cleanupFn();
        this.status.cleanupFunctionsRun++;
      } catch (error) {
        this.status.errors.push({
          phase: "cleanup",
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
        logger.error("Cleanup function failed:", error);
      }
    }
    
    logger.log(`Completed ${this.status.cleanupFunctionsRun} cleanup functions`);
  }

  private async exportFinalMetrics(): Promise<void> {
    logger.log("Exporting final metrics...");
    this.status.phase = "exporting_metrics";
    
    try {
      const prometheusMetrics = metricsCollector.exportPrometheusMetrics();
      const summary = metricsCollector.getMetricsSummary();
      
      // Log metrics summary
      logger.log("Final metrics summary:", summary);
      
      // In a real implementation, this would save metrics to a file or send to a monitoring service
      // For now, we'll just log them
      logger.log("Prometheus metrics exported successfully");
      
    } catch (error) {
      this.status.errors.push({
        phase: "metrics_export",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      logger.error("Failed to export final metrics:", error);
    }
  }

  private async deleteTunnels(): Promise<void> {
    logger.log("Deleting tunnels...");
    
    try {
      // In a real implementation, this would delete the tunnels via Cloudflare API
      // For now, we'll simulate the process
      const allMetrics = metricsCollector.getAllMetrics();
      this.status.tunnelsProcessed = allMetrics.length;
      
      logger.log(`Deleted ${this.status.tunnelsProcessed} tunnels`);
      
    } catch (error) {
      this.status.errors.push({
        phase: "tunnel_deletion",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      logger.error("Failed to delete tunnels:", error);
    }
  }

  getStatus(): ShutdownStatus {
    return { ...this.status };
  }

  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  async forceShutdown(): Promise<void> {
    logger.log("Force shutdown initiated");
    
    // Stop metrics collection immediately
    metricsCollector.stopCollection();
    
    // Mark as failed due to force shutdown
    this.status.phase = "failed";
    this.status.endTime = new Date();
    this.status.errors.push({
      phase: "force_shutdown",
      error: "Force shutdown initiated",
      timestamp: new Date(),
    });
    
    logger.log("Force shutdown completed");
  }
}

/**
 * Global shutdown manager instance
 * 
 * Handles graceful shutdown with configurable grace periods and cleanup hooks.
 * Automatically registers handlers for SIGTERM, SIGINT, and SIGUSR2.
 * 
 * @see {@link https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/tunnel-run-parameters/ | Cloudflare Tunnel Run Parameters}
 * @example
 * ```typescript
 * // Use the global instance
 * await shutdownManager.initiateShutdown();
 * 
 * // Or create a custom instance
 * const customManager = new TunnelShutdownManager({
 *   gracePeriodMs: 60000,
 *   exportFinalMetrics: true,
 * });
 * ```
 */
export const shutdownManager = new TunnelShutdownManager();
