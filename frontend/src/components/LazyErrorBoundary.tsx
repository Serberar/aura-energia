import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { ErrorMessage } from './LoadingComponents';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para manejar errores en componentes lazy y otros
 * Proporciona un fallback elegante cuando falla la carga de chunks
 */
class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyErrorBoundary caught an error:', error, errorInfo);
    
    // Reportar error a servicio de logging si está disponible
    if ('logger' in window && window.logger) {
      (window.logger as { error: (message: string, data: unknown) => void }).error('Lazy loading error', { error, errorInfo });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <div style={{ 
          padding: '2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '1rem'
        }}>
          <ErrorMessage 
            message="Error al cargar el componente. Hubo un problema cargando esta página. Por favor, inténtalo de nuevo."
          />
          <button 
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyErrorBoundary;