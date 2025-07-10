import { useState, useEffect, useCallback, useRef } from 'react';

// --- Interfaces ---

// Generic type for the data payload on success
export interface SseSyncSuccessPayload {
  message: string;
  [key: string]: any; // Allow other properties
  // Add other properties that are always present in your success payload
}

// The options required to trigger the sync process
export interface SyncTriggerOptions {
  [key: string]: any; // Allows for flexible options like fullSync, batchSize, etc.
}

// Props for the hook itself
interface UseSseSyncProps<T extends SseSyncSuccessPayload> {
  // The API function that starts the backend process
  triggerApiCall: (options: SyncTriggerOptions) => Promise<any>;
  
  // The URL for the Server-Sent Events stream
  sseUrl: string;

  // Optional callbacks for parent components
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
  onStart?: () => void;
}

/**
 * A custom hook to manage a long-running process triggered by an API call
 * and monitored via a Server-Sent Events (SSE) stream.
 *
 * @param triggerApiCall - The async function that POSTs to the backend to start the sync.
 * @param sseUrl - The URL of the SSE endpoint to listen for completion events.
 * @param T - The type of the data payload received on successful completion.
 * @returns An object with state (isLoading, error, data) and a function to trigger the process.
 */
export function useSseSync<T extends SseSyncSuccessPayload>({
  triggerApiCall,
  sseUrl,
  onSuccess,
  onError,
  onStart,
}: UseSseSyncProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Ref to manage the auto-hide timeout
  const panelTimeout = useRef<NodeJS.Timeout | null>(null);

  // Effect for handling the SSE connection
  useEffect(() => {
    // Don't connect if we aren't in a loading state
    if (!isLoading) {
      return;
    }

    const es = new EventSource(sseUrl, { withCredentials: true });
    const handleSuccess = (e: Event) => {
      const payload = JSON.parse((e as MessageEvent).data) as T;
      setIsLoading(false);
      setError(null);
      setData(payload);
      onSuccess?.(payload);
    };

    const handleError = (e: Event) => {
      const payload: { message: string } = JSON.parse((e as MessageEvent).data);
      setIsLoading(false);
      setData(null);
      setError(payload.message);
      onError?.(payload.message);
    };

    es.addEventListener('sync_completed', handleSuccess);
    es.addEventListener('sync_error', handleError);
    es.addEventListener('error', () => es.close()); // Close on generic network error

    // Cleanup function
    return () => {
      es.removeEventListener('sync_completed', handleSuccess);
      es.removeEventListener('sync_error', handleError);
      es.close();
    };
    // Re-run this effect if the URL changes or if we start loading
  }, [isLoading, sseUrl, onSuccess, onError]);

    // --- ADDITION 2: Effect to auto-hide the result/error panel ---
    useEffect(() => {
        // Clear any existing timeout if a new result or error comes in
        if (panelTimeout.current) {
          clearTimeout(panelTimeout.current);
        }
    
        // If there's data or an error to display...
        if (data || error) {
          // ...schedule it to be cleared after 5 seconds.
          panelTimeout.current = setTimeout(() => {
            setData(null);
            setError(null);
          }, 5000); // 5-second delay
        }
    
        // Cleanup function to clear the timeout if the component unmounts
        return () => {
          if (panelTimeout.current) {
            clearTimeout(panelTimeout.current);
          }
        };
      }, [data, error]); // This effect runs only when data or error state changes.

  // The function returned to the component to start the process
  const trigger = useCallback(async (options: SyncTriggerOptions) => {
    // Prevent multiple triggers while one is running
    if (isLoading) {
      console.warn("Sync is already in progress.");
      return;
    }

    // Reset state and start loading
    setIsLoading(true);
    setError(null);
    setData(null);
    onStart?.();
    
    try {
      // Call the API to kick off the process
      await triggerApiCall(options);
    } catch (err: any) {
      // This catches immediate errors from the trigger (e.g., 409 Conflict, network down)
      const errorMessage = err.message || 'Failed to start sync process.';
      setError(errorMessage);
      setIsLoading(false); // Stop loading immediately on trigger failure
      onError?.(errorMessage);
    }
  }, [isLoading, triggerApiCall, onStart, onError]);

  return { isLoading, error, data, trigger };
}