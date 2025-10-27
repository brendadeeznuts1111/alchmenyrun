import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing Alchemy Tunnel resources
 *
 * @param tunnelId - Unique identifier for the tunnel
 * @param tunnelConfig - Tunnel configuration options
 * @returns Tunnel instance and connection management
 */
export function useTunnel(
  tunnelId: string,
  tunnelConfig?: {
    name?: string;
    ingress?: any[];
    delete?: boolean;
  }
) {
  const [tunnel, setTunnel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const tunnelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeTunnel = async () => {
      try {
        setLoading(true);
        setError(null);

        // This would integrate with the Alchemy Tunnel resource
        // For now, return a placeholder implementation
        const tunnelInstance = {
          id: tunnelId,
          config: tunnelConfig,
          connect: async (target: string) => {
            console.log(`Tunnel ${tunnelId} connecting to: ${target}`);
            const connection = {
              id: `${tunnelId}-${Date.now()}`,
              target,
              status: 'connected',
              timestamp: Date.now(),
            };
            setConnections(prev => [...prev, connection]);
            setConnected(true);
            return connection;
          },
          disconnect: async (connectionId: string) => {
            console.log(`Tunnel ${tunnelId} disconnecting: ${connectionId}`);
            setConnections(prev => prev.filter(conn => conn.id !== connectionId));
            if (connections.length <= 1) {
              setConnected(false);
            }
          },
          listConnections: () => connections,
          delete: async () => {
            if (tunnelConfig?.delete) {
              console.log(`Deleting tunnel: ${tunnelId}`);
              setConnections([]);
              setConnected(false);
            }
          },
        };

        if (isMounted) {
          setTunnel(tunnelInstance);
          tunnelRef.current = tunnelInstance;
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    initializeTunnel();

    return () => {
      isMounted = false;
    };
  }, [tunnelId, tunnelConfig?.delete]);

  const connect = async (target: string) => {
    if (tunnel) {
      return await tunnel.connect(target);
    }
  };

  const disconnect = async (connectionId: string) => {
    if (tunnel) {
      await tunnel.disconnect(connectionId);
    }
  };

  return {
    tunnel,
    loading,
    error,
    connected,
    connections,
    connect,
    disconnect,
    ref: tunnelRef,
  };
}

/**
 * Hook for tunnel connection monitoring
 *
 * @param tunnelHook - Result from useTunnel hook
 * @returns Connection health and metrics
 */
export function useTunnelHealth(tunnelHook: ReturnType<typeof useTunnel>) {
  const [health, setHealth] = useState({
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    uptime: 0,
  });

  useEffect(() => {
    if (!tunnelHook.tunnel) return;

    const updateHealth = () => {
      const connections = tunnelHook.connections;
      const activeConnections = connections.filter(conn => conn.status === 'connected').length;
      const failedConnections = connections.filter(conn => conn.status === 'failed').length;

      setHealth({
        totalConnections: connections.length,
        activeConnections,
        failedConnections,
        uptime: Date.now() - (tunnelHook.tunnel?.createdAt || Date.now()),
      });
    };

    updateHealth();
    const interval = setInterval(updateHealth, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [tunnelHook.tunnel, tunnelHook.connections]);

  return health;
}
