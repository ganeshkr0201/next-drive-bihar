// Custom hook for API calls
// Reduces duplication of API call patterns with loading states and error handling

import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import errorHandler from '../utils/errorHandler';

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useToast();

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      showLoadingToast = false,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError,
      loadingMessage = 'Processing...'
    } = options;

    setIsLoading(true);
    setError(null);

    if (showLoadingToast) {
      showSuccess(loadingMessage);
    }

    try {
      const result = await apiCall();
      
      if (showSuccessToast) {
        showSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const handledError = errorHandler.handleApiError(err);
      setError(handledError);
      
      if (showErrorToast) {
        showError(handledError.message);
      }
      
      if (onError) {
        onError(handledError);
      }
      
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  }, [showError, showSuccess]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset
  };
};

// Hook for managing multiple API calls
export const useMultipleApi = () => {
  const [states, setStates] = useState({});
  const { showError, showSuccess } = useToast();

  const execute = useCallback(async (key, apiCall, options = {}) => {
    const {
      showLoadingToast = false,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError,
      loadingMessage = 'Processing...'
    } = options;

    setStates(prev => ({
      ...prev,
      [key]: { isLoading: true, error: null }
    }));

    if (showLoadingToast) {
      showSuccess(loadingMessage);
    }

    try {
      const result = await apiCall();
      
      setStates(prev => ({
        ...prev,
        [key]: { isLoading: false, error: null }
      }));
      
      if (showSuccessToast) {
        showSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const handledError = errorHandler.handleApiError(err);
      
      setStates(prev => ({
        ...prev,
        [key]: { isLoading: false, error: handledError }
      }));
      
      if (showErrorToast) {
        showError(handledError.message);
      }
      
      if (onError) {
        onError(handledError);
      }
      
      throw handledError;
    }
  }, [showError, showSuccess]);

  const reset = useCallback((key) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: { isLoading: false, error: null }
      }));
    } else {
      setStates({});
    }
  }, []);

  const getState = useCallback((key) => {
    return states[key] || { isLoading: false, error: null };
  }, [states]);

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.isLoading);
  }, [states]);

  return {
    execute,
    getState,
    reset,
    isAnyLoading,
    states
  };
};

export default useApi;