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
  
  // Reduced minimum time between fetches (2 seconds instead of 5)
  const MIN_FETCH_INTERVAL = 2000;

  // Stable reference to fetchFunction to prevent infinite loops
  const stableFetchFunction = useCallback(fetchFunction, dependencies);

  const fetchData = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (isLoading && !force) {
      return data[dataType] || [];
    }

    // Rate limiting: prevent fetches too close together (but more lenient)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (!force && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`⏳ Rate limited: ${dataType} fetch skipped (${timeSinceLastFetch}ms < ${MIN_FETCH_INTERVAL}ms)`);
      return data[dataType] || [];
    }

    // More lenient caching - only use cache if data is very recent (30 seconds) and not forced
    if (!force && data[dataType]?.length > 0 && lastUpdated[dataType] && hasInitialFetch) {
      const dataAge = now - lastUpdated[dataType];
      const MAX_DATA_AGE = 30 * 1000; // Reduced from 5 minutes to 30 seconds
      
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

  // Auto-fetch on mount (immediate, no debounce for initial load)
  useEffect(() => {
    if (!hasInitialFetch && isMountedRef.current) {
      // Immediate fetch for initial load
      fetchData();
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [fetchData, hasInitialFetch]);

  // Refetch when data is invalidated (immediate)
  useEffect(() => {
    if (lastUpdated[dataType] === null && hasInitialFetch && isMountedRef.current) {
      // Immediate refetch when invalidated
      fetchData(true);
    }
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