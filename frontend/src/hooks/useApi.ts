import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  fetchData: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await apiFunction(...args);
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('An error occurred'),
        });
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    fetchData,
    reset,
  };
}

export default useApi; 