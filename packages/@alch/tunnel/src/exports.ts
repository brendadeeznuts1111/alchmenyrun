/**
 * Phase 3 Production Features Exports
 * Metrics, graceful shutdown, and config reload functionality
 */

// Export metrics functionality
export {
  TunnelMetricsCollector,
  metricsCollector,
  createMetricsMiddleware,
  initializeTunnelMetrics,
  recordTunnelRequest,
  recordTunnelError,
  updateTunnelMetrics,
  type TunnelMetrics,
  type PrometheusMetric,
} from "./metrics.js";

// Export graceful shutdown functionality
export {
  GracefulShutdown,
  TunnelShutdownManager,
  shutdownManager,
  tunnelShutdownManager,
  registerTunnelShutdownHandlers,
  unregisterTunnelShutdownHandlers,
  createTunnelCleanupHandler,
  createMetricsFlushHandler,
  createConnectionDrainHandler,
  isShuttingDown,
  type ShutdownHandler,
  type ShutdownOptions,
} from "./shutdown.js";

// Export config reload functionality
export {
  ConfigReloadManager,
  createTunnelConfigReloadManager,
  type ConfigVersion,
  type ConfigDiff,
  type ReloadOptions,
} from "./config-reload.js";
