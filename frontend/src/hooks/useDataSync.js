import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';

export const useDataSync = (dataType, fetchFunction, dependencies = []) => {
  const { data, lastUpdated, updateData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  // Stable reference to fetchFunction to prevent infinite loops
  const stableFetchFunction = useCallback(fetchFunction, dependencies);

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if data exists and is recent (unless forced)
    if (!force && data[dataType]?.length > 0 && lastUpdated[dataType] && hasInitialFetch) {
      return data[dataType];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await stableFetchFunction();
      updateData(dataType, result);
      setHasInitialFetch(true);
      return result;
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch ${dataType}:`, err);
      return data[dataType] || [];
    } finally {
      setIsLoading(false);
    }
  }, [dataType, data, lastUpdated, updateData, stableFetchFunction, hasInitialFetch]);

  // Auto-fetch on mount only
  useEffect(() => {
    if (!hasInitialFetch) {
      fetchData();
    }
  }, [fetchData, hasInitialFetch]);

  // Refetch when data is invalidated
  useEffect(() => {
    if (lastUpdated[dataType] === null && hasInitialFetch) {
      fetchData(true);
    }
  }, [lastUpdated[dataType], fetchData, hasInitialFetch]);

  return {
    data: data[dataType] || [],
    isLoading,
    error,
    refetch: () => fetchData(true),
    lastUpdated: lastUpdated[dataType]
  };
};