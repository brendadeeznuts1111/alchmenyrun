/**
 * Graceful shutdown handling for Cloudflare Tunnel resource
 * Manages SIGTERM, SIGINT, and cleanup operations
 */

export interface ShutdownHandler {
  name: string;
  handler: () => Promise<void> | void;
  timeout?: number;
}

export interface ShutdownOptions {
  timeout?: number;
  forceTimeout?: number;
  onShutdown?: (signal: string) => void;
  onError?: (error: Error, handler: string) => void;
}

/**
 * Graceful shutdown manager
 */
export class GracefulShutdown {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private defaultTimeout = 30000; // 30 seconds
  private forceTimeout = 5000; // 5 seconds force timeout
  private options: ShutdownOptions;

  constructor(options: ShutdownOptions = {}) {
    this.options = {
      timeout: options.timeout || this.defaultTimeout,
      forceTimeout: options.forceTimeout || this.forceTimeout,
      onShutdown: options.onShutdown,
      onError: options.onError,
    };

    this.setupSignalHandlers();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  /**
   * Register a shutdown handler
   */
  registerHandler(handler: ShutdownHandler): void {
    if (this.isShuttingDown) {
      throw new Error('Cannot register handlers during shutdown');
    }

    this.handlers.push({
      timeout: this.options.timeout,
      ...handler,
    });

    // Sort by priority (lower timeout = higher priority)
    this.handlers.sort((a, b) => (a.timeout || 0) - (b.timeout || 0));
  }

  /**
   * Remove a shutdown handler
   */
  removeHandler(name: string): void {
    this.handlers = this.handlers.filter(h => h.name !== name);
  }

  /**
   * Execute graceful shutdown
   */
  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;

    if (this.options.onShutdown) {
      this.options.onShutdown(signal);
    }

    console.log(`Executing ${this.handlers.length} shutdown handlers...`);

    const shutdownPromises = this.handlers.map(async (handler) => {
      try {
        console.log(`Executing shutdown handler: ${handler.name}`);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Handler ${handler.name} timed out`)), handler.timeout || this.options.timeout);
        });

        const handlerPromise = Promise.resolve(handler.handler());
        
        await Promise.race([handlerPromise, timeoutPromise]);
        console.log(`Shutdown handler completed: ${handler.name}`);
      } catch (error) {
        console.error(`Shutdown handler failed: ${handler.name}`, error);
        
        if (this.options.onError) {
          this.options.onError(error as Error, handler.name);
        }
      }
    });

    try {
      await Promise.all(shutdownPromises);
      console.log('All shutdown handlers completed successfully');
    } catch (error) {
      console.error('Some shutdown handlers failed:', error);
    }

    // Force exit if still running
    setTimeout(() => {
      console.log('Force exiting...');
      process.exit(1);
    }, this.options.forceTimeout);
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Get registered handlers
   */
  getHandlers(): ShutdownHandler[] {
    return [...this.handlers];
  }
}

// Global shutdown manager instance
export const shutdownManager = new GracefulShutdown();

/**
 * Tunnel-specific shutdown handlers
 */
export class TunnelShutdownManager {
  private tunnelHandlers: Map<string, ShutdownHandler[]> = new Map();

  /**
   * Register a handler for a specific tunnel
   */
  registerTunnelHandler(tunnelId: string, handler: ShutdownHandler): void {
    if (!this.tunnelHandlers.has(tunnelId)) {
      this.tunnelHandlers.set(tunnelId, []);
    }
    
    this.tunnelHandlers.get(tunnelId)!.push(handler);
    
    // Also register with global shutdown manager
    shutdownManager.registerHandler({
      ...handler,
      name: `tunnel-${tunnelId}-${handler.name}`,
    });
  }

  /**
   * Remove all handlers for a tunnel
   */
  removeTunnelHandlers(tunnelId: string): void {
    const handlers = this.tunnelHandlers.get(tunnelId) || [];
    
    handlers.forEach(handler => {
      shutdownManager.removeHandler(`tunnel-${tunnelId}-${handler.name}`);
    });
    
    this.tunnelHandlers.delete(tunnelId);
  }

  /**
   * Get handlers for a tunnel
   */
  getTunnelHandlers(tunnelId: string): ShutdownHandler[] {
    return this.tunnelHandlers.get(tunnelId) || [];
  }
}

// Global tunnel shutdown manager
export const tunnelShutdownManager = new TunnelShutdownManager();

/**
 * Create a tunnel cleanup handler
 */
export function createTunnelCleanupHandler(tunnelId: string, cleanupFn: () => Promise<void>): ShutdownHandler {
  return {
    name: 'cleanup',
    handler: async () => {
      console.log(`Cleaning up tunnel: ${tunnelId}`);
      await cleanupFn();
      console.log(`Tunnel cleanup completed: ${tunnelId}`);
    },
    timeout: 10000, // 10 seconds for tunnel cleanup
  };
}

/**
 * Create a tunnel metrics flush handler
 */
export function createMetricsFlushHandler(tunnelId: string): ShutdownHandler {
  return {
    name: 'metrics-flush',
    handler: () => {
      console.log(`Flushing metrics for tunnel: ${tunnelId}`);
      // Metrics are automatically flushed by the metrics collector
      console.log(`Metrics flush completed: ${tunnelId}`);
    },
    timeout: 5000, // 5 seconds for metrics flush
  };
}

/**
 * Create a tunnel connection drain handler
 */
export function createConnectionDrainHandler(tunnelId: string, drainFn: () => Promise<void>): ShutdownHandler {
  return {
    name: 'connection-drain',
    handler: async () => {
      console.log(`Draining connections for tunnel: ${tunnelId}`);
      await drainFn();
      console.log(`Connection drain completed: ${tunnelId}`);
    },
    timeout: 15000, // 15 seconds for connection drain
  };
}

/**
 * Register all standard tunnel shutdown handlers
 */
export function registerTunnelShutdownHandlers(
  tunnelId: string,
  options: {
    cleanupFn?: () => Promise<void>;
    drainFn?: () => Promise<void>;
  } = {}
): void {
  if (options.cleanupFn) {
    tunnelShutdownManager.registerTunnelHandler(
      tunnelId,
      createTunnelCleanupHandler(tunnelId, options.cleanupFn)
    );
  }

  if (options.drainFn) {
    tunnelShutdownManager.registerTunnelHandler(
      tunnelId,
      createConnectionDrainHandler(tunnelId, options.drainFn)
    );
  }

  // Always register metrics flush
  tunnelShutdownManager.registerTunnelHandler(
    tunnelId,
    createMetricsFlushHandler(tunnelId)
  );
}

/**
 * Unregister all tunnel shutdown handlers
 */
export function unregisterTunnelShutdownHandlers(tunnelId: string): void {
  tunnelShutdownManager.removeTunnelHandlers(tunnelId);
}

/**
 * Check if shutdown is in progress
 */
export function isShuttingDown(): boolean {
  return shutdownManager.isShutdownInProgress();
}
