import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';

export const useDataSync = (dataType, fetchFunction, dependencies = []) => {
  const { data, lastUpdated, updateData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if data exists and is recent (unless forced)
    if (!force && data[dataType]?.length > 0 && lastUpdated[dataType]) {
      return data[dataType];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      updateData(dataType, result);
      return result;
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch ${dataType}:`, err);
      return data[dataType] || [];
    } finally {
      setIsLoading(false);
    }
  }, [dataType, fetchFunction, data, lastUpdated, updateData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Refetch when data is invalidated
  useEffect(() => {
    if (lastUpdated[dataType] === null) {
      fetchData(true);
    }
  }, [lastUpdated[dataType], fetchData]);

  return {
    data: data[dataType] || [],
    isLoading,
    error,
    refetch: () => fetchData(true),
    lastUpdated: lastUpdated[dataType]
  };
};