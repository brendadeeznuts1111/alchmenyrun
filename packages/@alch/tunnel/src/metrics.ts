/** Prometheus metrics exporter for Cloudflare Tunnels
 * 
 * @see {@link https://prometheus.io/docs/instrumenting/exposition_formats/ | Prometheus Exposition Formats}
 * @taxonomy [BUN/CLOUDFLARE/SPORTSBETTING]<TEST-STANDARDS:AGENT>[PERFORMANCE]{#FANTASY402}@v2
 */

import type { Tunnel } from "./index.js";
import { logger } from "alchemy";

// Constants for magic numbers
const METRICS_COLLECTION_INTERVAL_MS = 30_000; // 30 seconds
const METRICS_CACHE_TTL_MS = 5_000; // 5 seconds cache

export interface TunnelMetrics {
  tunnelId: string;
  tunnelName: string;
  accountTag: string;
  createdAt: string;
  activeConnections: number;
  totalConnections: number;
  connectionErrors: number;
  bytesTransferred: number;
  bytesReceived: number;
  bytesSent: number;
  requestsPerSecond: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  uptime: number;
  lastActivity: Date;
  healthStatus: "healthy" | "degraded" | "unhealthy";
  configVersion: string;
  lastConfigUpdate: Date;
  ingressRulesCount: number;
  collectedAt: Date;
}

export class TunnelMetricsCollector {
  private metrics: Map<string, TunnelMetrics> = new Map();
  private collectionInterval: number = METRICS_COLLECTION_INTERVAL_MS;
  private intervalId: NodeJS.Timeout | null = null;
  private intervals: Set<NodeJS.Timeout> = new Set();
  private cachedMetrics: TunnelMetrics[] | null = null;
  private cacheInvalidated: boolean = true;
  private lastCacheUpdate: number = 0;

  startCollection(tunnels: Tunnel[]): void {
    logger.log("Starting tunnel metrics collection");
    
    // Initialize metrics for each tunnel
    tunnels.forEach(tunnel => {
      this.initializeMetrics(tunnel);
    });

    // Start periodic collection with proper cleanup tracking
    const intervalId = setInterval(() => {
      this.collectAllMetrics();
    }, this.collectionInterval);
    
    this.intervals.add(intervalId);
    this.intervalId = intervalId;
  }

  stopCollection(): void {
    // Clear all intervals to prevent memory leaks
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    this.intervalId = null;
    this.cachedMetrics = null;
    this.cacheInvalidated = true;
    logger.log("Stopped tunnel metrics collection");
  }

  private initializeMetrics(tunnel: Tunnel): void {
    const metrics: TunnelMetrics = {
      tunnelId: tunnel.tunnelId,
      tunnelName: tunnel.name,
      accountTag: tunnel.accountTag,
      createdAt: tunnel.createdAt,
      
      activeConnections: 0,
      totalConnections: 0,
      connectionErrors: 0,
      
      bytesTransferred: 0,
      bytesReceived: 0,
      bytesSent: 0,
      
      requestsPerSecond: 0,
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      
      uptime: 0,
      lastActivity: new Date(),
      healthStatus: "healthy",
      
      configVersion: "1.0.0",
      lastConfigUpdate: new Date(),
      ingressRulesCount: tunnel.ingress?.length || 0,
      
      collectedAt: new Date(),
    };

    this.metrics.set(tunnel.tunnelId, metrics);
    this.invalidateCache();
  }

  private collectAllMetrics(): void {
    const now = new Date();
    
    for (const [tunnelId, metrics] of this.metrics.entries()) {
      // Simulate metrics collection
      // In a real implementation, this would collect actual tunnel metrics
      metrics.collectedAt = now;
    }
    
    this.invalidateCache();
  }
  
  private invalidateCache(): void {
    this.cacheInvalidated = true;
  }

  private async collectTunnelMetrics(tunnelId: string, metrics: TunnelMetrics): Promise<void> {
    const now = new Date();
    const timeSinceLastCollection = now.getTime() - metrics.collectedAt.getTime();
    
    // Simulate metric updates
    metrics.activeConnections = Math.floor(Math.random() * 100);
    metrics.totalConnections += Math.floor(Math.random() * 10);
    metrics.bytesTransferred += Math.floor(Math.random() * 1000000);
    metrics.requestsPerSecond = Math.floor(Math.random() * 50);
    metrics.totalRequests += metrics.requestsPerSecond * (timeSinceLastCollection / 1000);
    metrics.averageResponseTime = 50 + Math.random() * 200;
    metrics.uptime = now.getTime() - new Date(metrics.createdAt).getTime();
    metrics.lastActivity = now;
    
    // Update health status based on metrics
    if (metrics.errorRate > 0.1 || metrics.averageResponseTime > 1000) {
      metrics.healthStatus = "unhealthy";
    } else if (metrics.errorRate > 0.05 || metrics.averageResponseTime > 500) {
      metrics.healthStatus = "degraded";
    } else {
      metrics.healthStatus = "healthy";
    }
    
    metrics.collectedAt = now;
  }

  getAllMetrics(): TunnelMetrics[] {
    // Use caching to avoid creating new arrays on every call
    const now = Date.now();
    
    if (this.cacheInvalidated || !this.cachedMetrics || (now - this.lastCacheUpdate) > METRICS_CACHE_TTL_MS) {
      this.cachedMetrics = Array.from(this.metrics.values());
      this.cacheInvalidated = false;
      this.lastCacheUpdate = now;
    }
    
    return this.cachedMetrics;
  }

  getTunnelMetrics(tunnelId: string): TunnelMetrics | null {
    return this.metrics.get(tunnelId) || null;
  }

  exportPrometheusMetrics(): string {
    const lines: string[] = [];
    
    // Use cached metrics to avoid repeated array creation
    const metrics = this.getAllMetrics();
    
    for (const metric of metrics) {
      const labels = `tunnel_id="${metric.tunnelId}",tunnel_name="${metric.tunnelName}",account_tag="${metric.accountTag}"`;
      
      lines.push(
        `# HELP tunnel_active_connections Current active connections`,
        `# TYPE tunnel_active_connections gauge`,
        `tunnel_active_connections{${labels}} ${metric.activeConnections}`,
        `# HELP tunnel_total_connections Total connections since start`,
        `# TYPE tunnel_total_connections counter`,
        `tunnel_total_connections{${labels}} ${metric.totalConnections}`,
        `# HELP tunnel_bytes_transferred Total bytes transferred`,
        `# TYPE tunnel_bytes_transferred counter`,
        `tunnel_bytes_transferred{${labels}} ${metric.bytesTransferred}`,
        `# HELP tunnel_requests_per_second Current requests per second`,
        `# TYPE tunnel_requests_per_second gauge`,
        `tunnel_requests_per_second{${labels}} ${metric.requestsPerSecond}`,
        `# HELP tunnel_error_rate Error rate (0-1)`,
        `# TYPE tunnel_error_rate gauge`,
        `tunnel_error_rate{${labels}} ${metric.errorRate}`,
        `# HELP tunnel_average_response_time Average response time in milliseconds`,
        `# TYPE tunnel_average_response_time gauge`,
        `tunnel_average_response_time{${labels}} ${metric.averageResponseTime}`,
        `# HELP tunnel_health_status Health status (1=healthy, 0.5=degraded, 0=unhealthy)`,
        `# TYPE tunnel_health_status gauge`,
        `tunnel_health_status{${labels}} ${metric.healthStatus === 'healthy' ? 1 : metric.healthStatus === 'degraded' ? 0.5 : 0}`,
        `# HELP tunnel_uptime Uptime in seconds`,
        `# TYPE tunnel_uptime counter`,
        `tunnel_uptime{${labels}} ${metric.uptime}`,
        `# HELP tunnel_ingress_rules_count Number of ingress rules`,
        `# TYPE tunnel_ingress_rules_count gauge`,
        `tunnel_ingress_rules_count{${labels}} ${metric.ingressRulesCount}`,
        `# HELP tunnel_last_config_update Unix timestamp of last config update`,
        `# TYPE tunnel_last_config_update gauge`,
        `tunnel_last_config_update{${labels}} ${Math.floor(metric.lastConfigUpdate.getTime() / 1000)}`,
        `# HELP tunnel_collected_at Unix timestamp of last collection`,
        `# TYPE tunnel_collected_at gauge`,
        `tunnel_collected_at{${labels}} ${Math.floor(metric.collectedAt.getTime() / 1000)}`
      );
      
      lines.push(""); // Empty line between tunnel metrics
    }
    
    return lines.join("\n");
  }

  getMetricsSummary(): {
    totalTunnels: number;
    healthyTunnels: number;
    totalConnections: number;
    totalBytesTransferred: number;
    averageResponseTime: number;
  } {
    const allMetrics = this.getAllMetrics();
    
    return {
      totalTunnels: allMetrics.length,
      healthyTunnels: allMetrics.filter(m => m.healthStatus === "healthy").length,
      totalConnections: allMetrics.reduce((sum, m) => sum + m.activeConnections, 0),
      totalBytesTransferred: allMetrics.reduce((sum, m) => sum + m.bytesTransferred, 0),
      averageResponseTime: allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length 
        : 0,
    };
  }
}

/**
 * Global metrics collector instance
 * 
 * @see {@link https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/monitor-tunnels/ | Cloudflare Tunnel Monitoring}
 * @see {@link https://prometheus.io/docs/instrumenting/exposition_formats/ | Prometheus Exposition Formats}
 */
export const metricsCollector = new TunnelMetricsCollector();
