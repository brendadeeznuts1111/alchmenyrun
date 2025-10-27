import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for managing Alchemy Queue resources
 *
 * @param queueId - Unique identifier for the queue
 * @param queueConfig - Queue configuration options
 * @returns Queue instance and management functions
 */
export function useQueue(
  queueId: string,
  queueConfig?: {
    name?: string;
    delete?: boolean;
    retries?: number;
  },
) {
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const queueRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeQueue = async () => {
      try {
        setLoading(true);
        setError(null);

        // This would integrate with the Alchemy Queue resource
        // For now, return a placeholder implementation
        const queueInstance = {
          id: queueId,
          config: queueConfig,
          send: async (message: any) => {
            console.log(`Queue ${queueId} sending message:`, message);
            setMessages((prev) => [
              ...prev,
              { ...message, timestamp: Date.now() },
            ]);
          },
          receive: async () => {
            // Placeholder for receiving messages
            return messages.length > 0 ? messages[0] : null;
          },
          delete: async () => {
            if (queueConfig?.delete) {
              console.log(`Deleting queue: ${queueId}`);
              setMessages([]);
            }
          },
        };

        if (isMounted) {
          setQueue(queueInstance);
          queueRef.current = queueInstance;
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    initializeQueue();

    return () => {
      isMounted = false;
    };
  }, [queueId, queueConfig?.delete]);

  const sendMessage = useCallback(
    async (message: any) => {
      if (queue) {
        await queue.send(message);
      }
    },
    [queue],
  );

  const receiveMessage = useCallback(async () => {
    if (queue) {
      return await queue.receive();
    }
    return null;
  }, [queue]);

  return {
    queue,
    loading,
    error,
    messages,
    sendMessage,
    receiveMessage,
    ref: queueRef,
  };
}

/**
 * Hook for queue message polling
 *
 * @param queueHook - Result from useQueue hook
 * @param interval - Polling interval in milliseconds
 * @returns Latest message and polling status
 */
export function useQueuePolling(
  queueHook: ReturnType<typeof useQueue>,
  interval = 5000,
) {
  const [latestMessage, setLatestMessage] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!queueHook.queue) return;

    setPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const message = await queueHook.receiveMessage();
        if (message) {
          setLatestMessage(message);
        }
      } catch (error) {
        console.error("Error polling queue:", error);
      }
    }, interval);

    return () => {
      setPolling(false);
      clearInterval(pollInterval);
    };
  }, [queueHook.queue, interval, queueHook.receiveMessage]);

  return {
    latestMessage,
    polling,
  };
}
