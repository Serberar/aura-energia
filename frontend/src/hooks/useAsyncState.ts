// Hook personalizado para manejar estados de carga

import { useState, useCallback } from 'react';
import { useErrorHandler } from '../utils/errorHandler';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

interface UseAsyncStateOptions {
  initialLoading?: boolean;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorContext?: string;
}

export const useAsyncState = (options: UseAsyncStateOptions = {}) => {
  const {
    initialLoading = false,
    onSuccess,
    onError,
    successMessage,
    errorContext
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    success: null
  });

  const { handleError } = useErrorHandler();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error,
      success: loading ? null : prev.success
    }));
  }, []);

  const setError = useCallback((error: string | unknown) => {
    const errorMessage = typeof error === 'string' ? error : handleError(error, errorContext);
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
      success: null
    }));
    onError?.(errorMessage);
  }, [handleError, onError, errorContext]);

  const setSuccess = useCallback((message?: string) => {
    const successMsg = message || successMessage || 'Operación completada exitosamente';
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      success: successMsg
    }));
    onSuccess?.();
  }, [onSuccess, successMessage]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      success: null
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: null
    });
  }, []);

  // Función wrapper para ejecutar operaciones async
  const execute = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    config: {
      successMessage?: string;
      errorContext?: string;
      onSuccess?: (data: T) => void;
    } = {}
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      const result = await asyncOperation();
      setSuccess(config.successMessage);
      config.onSuccess?.(result);
      return result;
    } catch (error) {
      setError(error);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
    reset,
    execute
  };
};