import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';

export const useDataSync = (dataType, fetchFunction, options = {}) => {
  const { data, lastUpdated, updateData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const fetchFunctionRef = useRef(fetchFunction);
  const isActiveRef = useRef(true);
  
  // Update function reference when it changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if component is unmounted
    if (!isActiveRef.current) return data[dataType] || [];
    
    // Don't fetch if data exists and is recent (unless forced)
    if (!force && data[dataType]?.length > 0 && lastUpdated[dataType] && hasInitialFetch) {
      return data[dataType];
    }

    // Prevent multiple simultaneous requests
    if (isLoading && !force) {
      return data[dataType] || [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunctionRef.current();
      
      // Only update if component is still active
      if (isActiveRef.current) {
        updateData(dataType, result);
        setHasInitialFetch(true);
      }
      
      return result;
    } catch (err) {
      if (isActiveRef.current) {
        setError(err);
        console.error(`Failed to fetch ${dataType}:`, err);
      }
      return data[dataType] || [];
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [dataType, data, lastUpdated, updateData, hasInitialFetch, isLoading]);

  // Only fetch on mount if enabled (default: true)
  useEffect(() => {
    if (!hasInitialFetch && (options.enabled !== false)) {
      fetchData();
    }
  }, [fetchData, hasInitialFetch, options.enabled]);

  // Refetch when data is explicitly invalidated
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
    lastUpdated: lastUpdated[dataType],
    hasData: (data[dataType]?.length || 0) > 0
  };
};