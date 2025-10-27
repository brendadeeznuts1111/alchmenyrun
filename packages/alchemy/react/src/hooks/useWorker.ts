import { useEffect, useRef, useState } from "react";

/**
 * Hook for managing Cloudflare Workers with Alchemy framework
 *
 * @param workerId - Unique identifier for the worker
 * @param workerFactory - Function that returns worker configuration
 * @returns Worker instance and loading/error states
 */
export function useWorker<T = any>(
  workerId: string,
  workerFactory: () => Promise<T> | T,
) {
  const [worker, setWorker] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<T | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorker = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await workerFactory();

        if (isMounted) {
          setWorker(result);
          workerRef.current = result;
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    loadWorker();

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  return {
    worker,
    loading,
    error,
    ref: workerRef,
  };
}

/**
 * Hook for managing dynamic workers with WorkerLoader
 *
 * @param workerId - Unique identifier for the dynamic worker
 * @param workerConfig - Worker configuration object
 * @returns Dynamic worker instance and management functions
 */
export function useDynamicWorker(
  workerId: string,
  workerConfig: {
    compatibilityDate: string;
    mainModule: string;
    modules: Record<string, string>;
  },
) {
  return useWorker(workerId, async () => {
    // This would integrate with the WorkerLoader binding
    // For now, return a placeholder implementation
    return {
      id: workerId,
      config: workerConfig,
      getEntrypoint: () => ({
        fetch: async (request: Request) => {
          // Placeholder implementation
          return new Response(`Response from worker: ${workerId}`);
        },
      }),
    };
  });
}
