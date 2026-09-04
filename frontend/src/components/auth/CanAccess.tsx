import type { ReactNode } from 'react';
import { useHasRole } from '../../hooks/useRole';

export interface CanAccessProps {
  /**
   * Roles permitidos para ver el contenido
   */
  allowedRoles: string[];

  /**
   * Contenido a renderizar si el usuario tiene permiso
   */
  children: ReactNode;

  /**
   * Contenido alternativo a renderizar si el usuario NO tiene permiso
   * @default null
   */
  fallback?: ReactNode;

  /**
   * Si true, renderiza el fallback cuando no tiene acceso.
   * Si false, no renderiza nada.
   * @default false
   */
  showFallback?: boolean;
}

/**
 * Componente CanAccess - Wrapper condicional por permisos
 *
 * Renderiza su contenido solo si el usuario tiene uno de los roles permitidos.
 * Útil para ocultar UI elements basándose en permisos.
 *
 * @example
 * ```tsx
 * // Mostrar botón solo para admins
 * <CanAccess allowedRoles={['administrador']}>
 *   <Button onClick={handleDelete}>Eliminar</Button>
 * </CanAccess>
 *
 * // Con fallback personalizado
 * <CanAccess
 *   allowedRoles={['administrador', 'coordinador']}
 *   fallback={<p>No tienes permiso para ver esto</p>}
 *   showFallback
 * >
 *   <AdminPanel />
 * </CanAccess>
 *
 * // Múltiples roles
 * <CanAccess allowedRoles={['administrador', 'coordinador', 'comercial']}>
 *   <ReportsSection />
 * </CanAccess>
 * ```
 */
export const CanAccess: React.FC<CanAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
  showFallback = false,
}) => {
  const hasAccess = useHasRole(allowedRoles);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

export default CanAccess;
