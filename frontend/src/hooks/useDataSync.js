import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';

export const useDataSync = (dataType, fetchFunction, dependencies = []) => {
  const { data, lastUpdated, updateData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  
  // Minimum time between fetches (5 seconds)
  const MIN_FETCH_INTERVAL = 5000;

  // Stable reference to fetchFunction to prevent infinite loops
  const stableFetchFunction = useCallback(fetchFunction, dependencies);

  const fetchData = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (isLoading && !force) {
      return data[dataType] || [];
    }

    // Rate limiting: prevent fetches too close together
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (!force && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`⏳ Rate limited: ${dataType} fetch skipped (${timeSinceLastFetch}ms < ${MIN_FETCH_INTERVAL}ms)`);
      return data[dataType] || [];
    }

    // Don't fetch if data exists and is recent (unless forced)
    if (!force && data[dataType]?.length > 0 && lastUpdated[dataType] && hasInitialFetch) {
      const dataAge = now - lastUpdated[dataType];
      const MAX_DATA_AGE = 5 * 60 * 1000; // 5 minutes
      
      if (dataAge < MAX_DATA_AGE) {
        console.log(`📋 Using cached ${dataType} data (age: ${Math.round(dataAge / 1000)}s)`);
        return data[dataType];
      }
    }

    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (!isMountedRef.current) return data[dataType] || [];

    setIsLoading(true);
    setError(null);
    lastFetchTimeRef.current = now;

    try {
      console.log(`🔄 Fetching ${dataType} data...`);
      const result = await stableFetchFunction();
      
      if (!isMountedRef.current) return result;
      
      updateData(dataType, result);
      setHasInitialFetch(true);
      console.log(`✅ ${dataType} data fetched successfully (${result?.length || 0} items)`);
      return result;
    } catch (err) {
      if (!isMountedRef.current) return data[dataType] || [];
      
      setError(err);
      console.error(`❌ Failed to fetch ${dataType}:`, err.message);
      return data[dataType] || [];
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dataType, data, lastUpdated, updateData, stableFetchFunction, hasInitialFetch, isLoading]);

  // Auto-fetch on mount only (with debounce)
  useEffect(() => {
    if (!hasInitialFetch && isMountedRef.current) {
      // Debounce initial fetch to prevent multiple rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !hasInitialFetch) {
          fetchData();
        }
      }, 100);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [fetchData, hasInitialFetch]);

  // Refetch when data is invalidated (with debounce)
  useEffect(() => {
    if (lastUpdated[dataType] === null && hasInitialFetch && isMountedRef.current) {
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          fetchData(true);
        }
      }, 200);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [lastUpdated[dataType], fetchData, hasInitialFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    data: data[dataType] || [],
    isLoading,
    error,
    refetch: () => fetchData(true),
    lastUpdated: lastUpdated[dataType]
  };
};