// Sistema centralizado de manejo de errores

import { logger } from './logger';

// Tipos de errores personalizados
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Mantener el stack trace en browsers que lo soportan
    if ('captureStackTrace' in Error) {
      type ErrorConstructor = typeof Error & {
        captureStackTrace: (targetObject: object, constructorOpt: typeof AppError) => void;
      };
      (Error as ErrorConstructor).captureStackTrace(this, this.constructor as typeof AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, true);
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Error de conexión') {
    super(message, 0, true);
  }
}

// Utilidad para normalizar errores de diferentes fuentes
export const normalizeError = (error: unknown): AppError => {
  // Si ya es nuestro tipo de error personalizado
  if (error instanceof AppError) {
    return error;
  }

  // Si es un error estándar de JavaScript
  if (error instanceof Error) {
    return new AppError(error.message, 500, true);
  }

  // Si es un error de axios/fetch
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string; error?: string } };
      message?: string;
      code?: string;
    };

    if (axiosError.response) {
      const status = axiosError.response.status || 500;
      const message = 
        axiosError.response.data?.message || 
        axiosError.response.data?.error || 
        axiosError.message || 
        'Error del servidor';

      switch (status) {
        case 400:
          return new ValidationError(message);
        case 401:
          return new AuthenticationError(message);
        case 403:
          return new AuthorizationError(message);
        case 404:
          return new NotFoundError(message);
        case 500:
        default:
          return new AppError(message, status);
      }
    }

    // Error de red (sin respuesta del servidor)
    if (axiosError.code === 'NETWORK_ERROR' || axiosError.code === 'ERR_NETWORK') {
      return new NetworkError('No se pudo conectar con el servidor');
    }

    if (axiosError.message) {
      return new AppError(axiosError.message);
    }
  }

  // Fallback para errores desconocidos
  return new AppError('Error desconocido', 500, false);
};

// Función para manejar errores de forma consistente
export const handleError = (
  error: unknown,
  context?: string,
  additionalContext?: Record<string, unknown>
): AppError => {
  const normalizedError = normalizeError(error);
  
  // Log del error
  logger.error(
    context ? `${context}: ${normalizedError.message}` : normalizedError.message,
    normalizedError,
    {
      statusCode: normalizedError.statusCode,
      isOperational: normalizedError.isOperational,
      ...normalizedError.context,
      ...additionalContext
    }
  );

  return normalizedError;
};

// Utilidades específicas para diferentes tipos de errores
export const handleApiError = (
  error: unknown,
  endpoint: string,
  operation?: string
): AppError => {
  const context = operation ? `${operation} - ${endpoint}` : `API ${endpoint}`;
  return handleError(error, context, { endpoint, operation });
};

export const handleFormError = (
  error: unknown,
  formName: string,
  fieldName?: string
): AppError => {
  const context = fieldName ? 
    `Form ${formName} - Field ${fieldName}` : 
    `Form ${formName}`;
  return handleError(error, context, { formName, fieldName });
};

export const handleAsyncError = (
  error: unknown,
  actionName: string,
  userId?: string
): AppError => {
  return handleError(error, `Async Action: ${actionName}`, { 
    actionName, 
    userId 
  });
};

// Función para generar mensajes de error user-friendly
export const getUserFriendlyMessage = (error: AppError): string => {
  // Mensajes específicos para diferentes tipos de errores
  if (error instanceof ValidationError) {
    return error.message; // Los errores de validación suelen ser user-friendly
  }

  if (error instanceof AuthenticationError) {
    return 'Necesitas iniciar sesión para realizar esta acción';
  }

  if (error instanceof AuthorizationError) {
    return 'No tienes permisos para realizar esta acción';
  }

  if (error instanceof NotFoundError) {
    return 'El recurso solicitado no fue encontrado';
  }

  if (error instanceof NetworkError) {
    return 'Error de conexión. Verifica tu conexión a internet';
  }

  // Para errores del servidor
  if (error.statusCode >= 500) {
    return 'Error interno del servidor. Inténtalo de nuevo más tarde';
  }

  // Para otros errores
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return error.message || 'Error en la solicitud';
  }

  // Fallback genérico
  return 'Ha ocurrido un error inesperado';
};

// Hook para manejar errores en componentes React
export const useErrorHandler = () => {
  return {
    handleError: (error: unknown, context?: string) => {
      const appError = handleError(error, context);
      return getUserFriendlyMessage(appError);
    },
    
    handleApiError: (error: unknown, endpoint: string, operation?: string) => {
      const appError = handleApiError(error, endpoint, operation);
      return getUserFriendlyMessage(appError);
    },
    
    handleFormError: (error: unknown, formName: string, fieldName?: string) => {
      const appError = handleFormError(error, formName, fieldName);
      return getUserFriendlyMessage(appError);
    }
  };
};