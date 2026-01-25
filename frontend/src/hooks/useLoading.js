// Custom hook for managing loading states
// Reduces duplication of loading state management across components

import { useState, useCallback } from 'react';

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFunction) => {
    startLoading();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    setIsLoading
  };
};

// Hook for managing multiple loading states
export const useMultipleLoading = (states = {}) => {
  const [loadingStates, setLoadingStates] = useState(states);

  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const startLoading = useCallback((key) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key) => {
    setLoading(key, false);
  }, [setLoading]);

  const withLoading = useCallback(async (key, asyncFunction) => {
    startLoading(key);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    withLoading,
    isAnyLoading,
    isLoading: (key) => loadingStates[key] || false
  };
};

export default useLoading;