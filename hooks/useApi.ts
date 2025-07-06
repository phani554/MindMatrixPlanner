import { useState, useEffect } from 'react';

// A hook that handles loading, error, and data states, plus cancellation.
export function useApi<T>(apiCall: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiCall(controller.signal);
        setData(result);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [apiCall]); // Re-run if the API call function changes.

  return { data, isLoading, error };
}