// Basic metrics collection for TGK Orchestrator
export interface Metrics {
  requests_total: number;
  errors_total: number;
  duration_seconds: number;
  active_requests: number;
}

export interface MetricCounter {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export interface MetricHistogram {
  name: string;
  help: string;
  buckets: number[];
  counts: number[];
  sum: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricCounter> = new Map();
  private histograms: Map<string, MetricHistogram> = new Map();
  private startTime: number = Date.now();

  constructor() {
    // Initialize basic metrics
    this.initCounter('tgk_requests_total', 'Total number of requests');
    this.initCounter('tgk_errors_total', 'Total number of errors', ['type', 'endpoint']);
    this.initHistogram('tgk_duration_seconds', 'Request duration in seconds', [0.1, 0.5, 1, 2, 5, 10]);
    this.initCounter('tgk_health_checks_total', 'Total health checks performed');
    this.initCounter('tgk_ai_requests_total', 'Total AI requests made');
    this.initCounter('tgk_policy_checks_total', 'Total policy checks performed');
    this.initCounter('tgk_notifications_total', 'Total notifications sent', ['channel', 'priority']);
  }

  private initCounter(name: string, help: string, labelNames?: string[]): void {
    this.metrics.set(name, {
      name,
      help,
      value: 0,
      labels: {}
    });
  }

  private initHistogram(name: string, help: string, buckets: number[]): void {
    this.histograms.set(name, {
      name,
      help,
      buckets,
      counts: new Array(buckets.length + 1).fill(0),
      sum: 0
    });
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const counter = this.metrics.get(name);
    if (counter) {
      counter.value++;
      if (labels) {
        counter.labels = { ...counter.labels, ...labels };
      }
    }
  }

  recordHistogram(name: string, value: number): void {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.sum += value;
      
      // Find the right bucket
      let bucketIndex = histogram.buckets.length;
      for (let i = 0; i < histogram.buckets.length; i++) {
        if (value <= histogram.buckets[i]) {
          bucketIndex = i;
          break;
        }
      }
      
      histogram.counts[bucketIndex]++;
    }
  }

  getPrometheusFormat(): string {
    let output = '';
    
    // Output counters
    for (const counter of this.metrics.values()) {
      output += `# HELP ${counter.name} ${counter.help}\n`;
      output += `# TYPE ${counter.name} counter\n`;
      
      if (Object.keys(counter.labels).length > 0) {
        const labelStr = Object.entries(counter.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        output += `${counter.name}{${labelStr}} ${counter.value}\n`;
      } else {
        output += `${counter.name} ${counter.value}\n`;
      }
    }
    
    // Output histograms
    for (const histogram of this.histograms.values()) {
      output += `# HELP ${histogram.name} ${histogram.help}\n`;
      output += `# TYPE ${histogram.name} histogram\n`;
      
      // Output bucket counts
      for (let i = 0; i < histogram.buckets.length; i++) {
        const bucket = histogram.buckets[i];
        const count = histogram.counts.slice(0, i + 1).reduce((a, b) => a + b, 0);
        output += `${histogram.name}_bucket{le="${bucket}"} ${count}\n`;
      }
      
      // Output +Inf bucket
      const totalCount = histogram.counts.reduce((a, b) => a + b, 0);
      output += `${histogram.name}_bucket{le="+Inf"} ${totalCount}\n`;
      output += `${histogram.name}_sum ${histogram.sum}\n`;
      output += `${histogram.name}_count ${totalCount}\n`;
    }
    
    // Add uptime metric
    const uptime = (Date.now() - this.startTime) / 1000;
    output += `# HELP tgk_uptime_seconds Service uptime in seconds\n`;
    output += `# TYPE tgk_uptime_seconds gauge\n`;
    output += `tgk_uptime_seconds ${uptime}\n`;
    
    return output;
  }

  getMetrics(): Metrics {
    return {
      requests_total: this.metrics.get('tgk_requests_total')?.value || 0,
      errors_total: this.metrics.get('tgk_errors_total')?.value || 0,
      duration_seconds: this.histograms.get('tgk_duration_seconds')?.sum || 0,
      active_requests: 0 // This would need to be tracked differently
    };
  }
}

// Global metrics instance
export const orchestratorMetrics = new MetricsCollector();

// Middleware helper for request tracking
export function trackRequest(endpoint: string, handler: () => Promise<Response>): Promise<Response> {
  const startTime = Date.now();
  
  orchestratorMetrics.incrementCounter('tgk_requests_total', { endpoint });
  
  return handler()
    .then(response => {
      const duration = (Date.now() - startTime) / 1000;
      orchestratorMetrics.recordHistogram('tgk_duration_seconds', duration);
      return response;
    })
    .catch(error => {
      orchestratorMetrics.incrementCounter('tgk_errors_total', { 
        type: error.constructor.name, 
        endpoint 
      });
      throw error;
    });
}
