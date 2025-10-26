/**
 * Metrics and observability for Cloudflare Tunnel resource
 * Prometheus-compatible metrics exporter
 */

export interface TunnelMetrics {
  tunnelId: string;
  tunnelName: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: number;
  lastUpdated: number;
  requestCount: number;
  errorCount: number;
  bytesTransferred: number;
  activeConnections: number;
}

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Metrics collector for Tunnel resources
 */
export class TunnelMetricsCollector {
  private metrics: Map<string, TunnelMetrics> = new Map();
  private counters: Map<string, number> = new Map();

  /**
   * Initialize metrics for a tunnel
   */
  initializeTunnel(tunnelId: string, tunnelName: string): void {
    const now = Date.now();
    this.metrics.set(tunnelId, {
      tunnelId,
      tunnelName,
      status: 'active',
      createdAt: now,
      lastUpdated: now,
      requestCount: 0,
      errorCount: 0,
      bytesTransferred: 0,
      activeConnections: 0,
    });
  }

  /**
   * Increment request counter for a tunnel
   */
  incrementRequests(tunnelId: string): void {
    const metrics = this.metrics.get(tunnelId);
    if (metrics) {
      metrics.requestCount++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Increment error counter for a tunnel
   */
  incrementErrors(tunnelId: string): void {
    const metrics = this.metrics.get(tunnelId);
    if (metrics) {
      metrics.errorCount++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Update bytes transferred for a tunnel
   */
  updateBytesTransferred(tunnelId: string, bytes: number): void {
    const metrics = this.metrics.get(tunnelId);
    if (metrics) {
      metrics.bytesTransferred += bytes;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Update active connections count for a tunnel
   */
  updateActiveConnections(tunnelId: string, count: number): void {
    const metrics = this.metrics.get(tunnelId);
    if (metrics) {
      metrics.activeConnections = count;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Set tunnel status
   */
  setTunnelStatus(tunnelId: string, status: 'active' | 'inactive' | 'error'): void {
    const metrics = this.metrics.get(tunnelId);
    if (metrics) {
      metrics.status = status;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Get metrics for a specific tunnel
   */
  getTunnelMetrics(tunnelId: string): TunnelMetrics | undefined {
    return this.metrics.get(tunnelId);
  }

  /**
   * Get all tunnel metrics
   */
  getAllMetrics(): TunnelMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Tunnel info metrics
    lines.push('# HELP tunnel_info Information about Cloudflare tunnels');
    lines.push('# TYPE tunnel_info gauge');
    
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}",status="${metrics.status}"`;
      lines.push(`tunnel_info{${labels}} 1`);
    }

    // Request count metrics
    lines.push('# HELP tunnel_requests_total Total number of requests per tunnel');
    lines.push('# TYPE tunnel_requests_total counter');
    
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}"`;
      lines.push(`tunnel_requests_total{${labels}} ${metrics.requestCount}`);
    }

    // Error count metrics
    lines.push('# HELP tunnel_errors_total Total number of errors per tunnel');
    lines.push('# TYPE tunnel_errors_total counter');
    
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}"`;
      lines.push(`tunnel_errors_total{${labels}} ${metrics.errorCount}`);
    }

    // Bytes transferred metrics
    lines.push('# HELP tunnel_bytes_transferred_total Total bytes transferred per tunnel');
    lines.push('# TYPE tunnel_bytes_transferred_total counter');
    
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}"`;
      lines.push(`tunnel_bytes_transferred_total{${labels}} ${metrics.bytesTransferred}`);
    }

    // Active connections metrics
    lines.push('# HELP tunnel_active_connections Number of active connections per tunnel');
    lines.push('# TYPE tunnel_active_connections gauge');
    
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}"`;
      lines.push(`tunnel_active_connections{${labels}} ${metrics.activeConnections}`);
    }

    // Uptime metrics
    lines.push('# HELP tunnel_uptime_seconds Tunnel uptime in seconds');
    lines.push('# TYPE tunnel_uptime_seconds gauge');
    
    const now = Date.now();
    for (const metrics of this.metrics.values()) {
      const labels = `tunnel_id="${metrics.tunnelId}",tunnel_name="${metrics.tunnelName}"`;
      const uptime = Math.floor((now - metrics.createdAt) / 1000);
      lines.push(`tunnel_uptime_seconds{${labels}} ${uptime}`);
    }

    // General system metrics
    lines.push('# HELP alch_tunnels_total Total number of managed tunnels');
    lines.push('# TYPE alch_tunnels_total gauge');
    lines.push(`alch_tunnels_total ${this.metrics.size}`);

    lines.push('# HELP alch_tunnels_active Number of active tunnels');
    lines.push('# TYPE alch_tunnels_active gauge');
    const activeCount = Array.from(this.metrics.values()).filter(m => m.status === 'active').length;
    lines.push(`alch_tunnels_active ${activeCount}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Get metrics as JSON for API responses
   */
  getMetricsAsJson(): { tunnels: TunnelMetrics[], summary: any } {
    const tunnels = this.getAllMetrics();
    const summary = {
      total: tunnels.length,
      active: tunnels.filter(t => t.status === 'active').length,
      inactive: tunnels.filter(t => t.status === 'inactive').length,
      error: tunnels.filter(t => t.status === 'error').length,
      totalRequests: tunnels.reduce((sum, t) => sum + t.requestCount, 0),
      totalErrors: tunnels.reduce((sum, t) => sum + t.errorCount, 0),
      totalBytesTransferred: tunnels.reduce((sum, t) => sum + t.bytesTransferred, 0),
      totalActiveConnections: tunnels.reduce((sum, t) => sum + t.activeConnections, 0),
    };

    return { tunnels, summary };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }

  /**
   * Remove metrics for a deleted tunnel
   */
  removeTunnel(tunnelId: string): void {
    this.metrics.delete(tunnelId);
  }
}

// Global metrics collector instance
export const metricsCollector = new TunnelMetricsCollector();

/**
 * Metrics middleware for Express/HTTP servers
 */
export function createMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    if (req.path === '/metrics') {
      res.setHeader('Content-Type', 'text/plain');
      res.send(metricsCollector.exportPrometheusMetrics());
    } else {
      next();
    }
  };
}

/**
 * Initialize metrics for a new tunnel
 */
export function initializeTunnelMetrics(tunnelId: string, tunnelName: string): void {
  metricsCollector.initializeTunnel(tunnelId, tunnelName);
}

/**
 * Record tunnel request
 */
export function recordTunnelRequest(tunnelId: string): void {
  metricsCollector.incrementRequests(tunnelId);
}

/**
 * Record tunnel error
 */
export function recordTunnelError(tunnelId: string): void {
  metricsCollector.incrementErrors(tunnelId);
}

/**
 * Update tunnel metrics
 */
export function updateTunnelMetrics(tunnelId: string, metrics: Partial<TunnelMetrics>): void {
  const currentMetrics = metricsCollector.getTunnelMetrics(tunnelId);
  if (currentMetrics) {
    Object.assign(currentMetrics, metrics);
    currentMetrics.lastUpdated = Date.now();
  }
}
