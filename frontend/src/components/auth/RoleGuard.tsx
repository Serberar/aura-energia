import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useHasRole } from '../../hooks/useRole';

export interface RoleGuardProps {
  /**
   * Roles permitidos para acceder al contenido
   */
  allowedRoles: string[];

  /**
   * Contenido a renderizar si el usuario tiene permiso
   */
  children: ReactNode;

  /**
   * Ruta a la que redirigir si no tiene permiso
   * @default '/dashboard'
   */
  redirectTo?: string;

  /**
   * Componente personalizado a mostrar cuando no tiene acceso
   * Si se proporciona, se usa en lugar de la redirección
   */
  fallback?: ReactNode;
}

/**
 * Componente RoleGuard - Guard de autorización con redirección
 *
 * Similar a CanAccess, pero diseñado para proteger rutas completas.
 * Si el usuario no tiene permiso, redirige a otra ruta o muestra un fallback.
 *
 * @example
 * ```tsx
 * // Proteger una página completa
 * <RoleGuard allowedRoles={['administrador']}>
 *   <AdminDashboard />
 * </RoleGuard>
 *
 * // Con redirección personalizada
 * <RoleGuard
 *   allowedRoles={['administrador', 'coordinador']}
 *   redirectTo="/crm"
 * >
 *   <SaleStatusManagement />
 * </RoleGuard>
 *
 * // Con mensaje de acceso denegado
 * <RoleGuard
 *   allowedRoles={['administrador']}
 *   fallback={
 *     <div>
 *       <h1>Acceso Denegado</h1>
 *       <p>No tienes permisos para ver esta página</p>
 *     </div>
 *   }
 * >
 *   <SecureContent />
 * </RoleGuard>
 * ```
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
  fallback,
}) => {
  const hasAccess = useHasRole(allowedRoles);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Si hay fallback, lo mostramos
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no hay fallback, redirigimos
  return <Navigate to={redirectTo} replace />;
};

export default RoleGuard;
