import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef
} from 'react';
import { syncRun } from '@/utils/apiService';
import { configs } from '@/config';
import { AuthError } from '@/types';

// --- INTERFACES (These should match your existing types) ---

export interface SyncTriggerOptions {
[key: string]: any;
}

interface EmployeeStats {
  updated: number;
  inserted: number;
  deleted: number;
  deletionsSkipped: number;
}
interface IssueStats {
  totalIssuesLog:   number;
  totalPr:          number;
  totalPrMerged:    number;
  totalIssueClosed: number;
}
export interface SyncResponse {
  message:        string;
  issueCount?:    number;
  expiration_date: string;
  employeeStats: EmployeeStats;
  issueStats:    IssueStats;
}

interface SyncContextType {
isLoading: boolean;
error: string | null;
data: SyncResponse | null;
trigger: (options: SyncTriggerOptions) => Promise<void>;
}

// --- CONTEXT CREATION ---

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<SyncResponse | null>(null);
const panelTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use a ref to hold the AbortController for the trigger request
const abortControllerRef = useRef<AbortController | null>(null);

// --- GLOBAL SSE CONNECTION ---
useEffect(() => {
  // Establish a single, persistent SSE connection for the app's lifetime.
  const eventSource = new EventSource(`${configs.BACKEND_URL}/sync/stream`, { withCredentials: true });

  const handleSuccess = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data) as SyncResponse;
      setIsLoading(false);
      setError(null);
      setData(payload);
    } catch (e) {
      console.error("Failed to parse SSE success event data:", event.data);
      setError("Received a malformed success event from the server.");
      setIsLoading(false);
    }
  };

  const handleError = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data);
      setIsLoading(false);
      setData(null);
      setError(payload.message || 'An unknown sync error occurred.');
    } catch (e) {
      console.error("Failed to parse SSE error event data:", event.data);
      setError("Received a malformed error event from the server.");
      setIsLoading(false);
    }
  };

  eventSource.addEventListener('sync_completed', handleSuccess);
  eventSource.addEventListener('sync_error', handleError);
  
  eventSource.onerror = () => {
    console.log('SSE connection lost. EventSource will attempt to reconnect automatically.');
    // Don't set a top-level error here, as EventSource handles reconnection.
  };

  // Cleanup when the provider unmounts (i.e., the app is closed).
  return () => {
    eventSource.removeEventListener('sync_completed', handleSuccess);
    eventSource.removeEventListener('sync_error', handleError);
    eventSource.close();
  };
}, []); // Empty dependency array ensures this runs only once.

  // --- CANCEL FUNCTION ---
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort the ongoing fetch request
      setIsLoading(false);
      setError("The sync operation was cancelled by the user.");
      console.log("Sync cancelled by user.");
    }
  }, []);

// --- TRIGGER FUNCTION ---
const trigger = useCallback(async (options: SyncTriggerOptions) => {
  if (isLoading) {
    console.warn("Sync trigger ignored: a sync is already in progress.");
    return;
  }
  // Create a new AbortController for this specific request
  abortControllerRef.current = new AbortController();
  setIsLoading(true);
  setError(null);
  setData(null); // Clear previous data on new trigger

  try {
    // This API call just starts the process. The result comes via SSE.
    await syncRun(options, abortControllerRef.current.signal); 
  }  catch (err: any) {
    // Check for user-initiated cancellation first
    if (err.name === 'AbortError') {
      console.log('Fetch aborted by user.');
      return; // Stop execution
    }
    
    // --- REFINED ERROR HANDLING ---
    // The `apiService` guarantees that `err.message` will contain the
    // most specific error text available, whether from an AuthError
    // or a generic API error.
    const errorMessage = err.message || 'Failed to start the sync process.';

    console.error(`Sync trigger failed: ${errorMessage}`);
    setError(errorMessage);
    setIsLoading(false); // Set loading to false on immediate failure
  } finally {
    abortControllerRef.current = null;
  }
}, [isLoading]);

// --- AUTO-HIDE RESULTS PANEL ---
useEffect(() => {
  if (panelTimeout.current) {
    clearTimeout(panelTimeout.current);
  }

  if (data || error) {
    panelTimeout.current = setTimeout(() => {
      setData(null);
      setError(null);
    }, 10000); // Display for 10 seconds
  }

  return () => {
    if (panelTimeout.current) {
      clearTimeout(panelTimeout.current);
    }
  };
}, [data, error]);

// Memoize context value to prevent unnecessary re-renders of consumers
const value = useMemo(() => ({ isLoading, error, data, trigger, cancel }), [isLoading, error, data, trigger, cancel]);

return (
  <SyncContext.Provider value={value}>
    {children}
  </SyncContext.Provider>
);
};

/**
* Custom hook to access the global sync state.
* Replaces the old useSseSync hook.
*/
export const useSync = () => {
const context = useContext(SyncContext);
if (context === undefined) {
  throw new Error('useSync must be used within a SyncProvider');
}
return context;
};
