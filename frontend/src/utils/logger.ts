// Sistema de logging centralizado para la aplicación

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    let message = `[${timestamp}] ${level} ${entry.message}`;
    
    if (entry.context) {
      message += `\nContext: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\nError: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    const formattedMessage = this.formatMessage(entry);

    // En desarrollo, usar console
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }

    // En producción, aquí se podría enviar a un servicio de logging
    // como Sentry, LogRocket, etc.
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // Implementar envío a servicio externo (Sentry, etc.)
    // Por ahora solo almacenamos en localStorage como fallback
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(entry);
      // Mantener solo los últimos 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to store error log:', err);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  // Método utilitario para loggear errores de API
  apiError(endpoint: string, error: unknown, context?: Record<string, unknown>) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.error(`API Error: ${endpoint}`, errorObj, {
      endpoint,
      ...context
    });
  }

  // Método utilitario para loggear acciones de usuario
  userAction(action: string, context?: Record<string, unknown>) {
    this.info(`User Action: ${action}`, context);
  }

  // Obtener logs almacenados (útil para debugging)
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch {
      return [];
    }
  }

  // Limpiar logs almacenados
  clearStoredLogs() {
    localStorage.removeItem('errorLogs');
  }
}

// Instancia singleton del logger
export const logger = new Logger();

// Hook para errores globales
export const setupGlobalErrorHandler = () => {
  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    logger.error('Unhandled JavaScript Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Capturar promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', new Error(String(event.reason)), {
      reason: event.reason
    });
  });
};

// Exportar tipos para uso en otros módulos
export type { LogLevel, LogEntry };