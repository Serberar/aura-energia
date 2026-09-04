import { useAppSelector } from "./reduxHooks";

/**
 * Hook para obtener el rol actual del usuario
 */
export function useRole() {
  return useAppSelector((state) => state.auth.role);
}

/**
 * Hook para verificar si el usuario tiene alguno de los roles especificados
 */
export function useHasRole(allowedRoles: string[]): boolean {
  const userRole = useRole();
  return userRole ? allowedRoles.includes(userRole) : false;
}

/**
 * Hook para verificar si el usuario es administrador
 */
export function useIsAdmin(): boolean {
  const role = useRole();
  return role === 'administrador';
}

// ============================================
// Hooks específicos del CRM
// ============================================

/**
 * Hook para verificar si el usuario puede gestionar productos
 * @returns true si el usuario puede crear, editar o eliminar productos
 */
export function useCanManageProducts(): boolean {
  const role = useRole();
  // Todos los roles pueden gestionar productos excepto verificadores
  return role ? ['administrador', 'coordinador', 'comercial'].includes(role) : false;
}

/**
 * Hook para verificar si el usuario puede crear ventas
 * @returns true si el usuario puede crear nuevas ventas
 */
export function useCanCreateSales(): boolean {
  const role = useRole();
  // Todos los roles autenticados pueden crear ventas
  return Boolean(role);
}

/**
 * Hook para verificar si el usuario puede editar cualquier venta
 * @returns true si el usuario puede editar ventas de cualquier usuario
 */
export function useCanEditAnySale(): boolean {
  const role = useRole();
  // Solo administradores y coordinadores pueden editar cualquier venta
  return role ? ['administrador', 'coordinador'].includes(role) : false;
}

/**
 * Hook para verificar si el usuario puede eliminar ventas
 * @returns true si el usuario puede eliminar ventas
 */
export function useCanDeleteSales(): boolean {
  const role = useRole();
  // Solo administradores pueden eliminar ventas
  return role === 'administrador';
}

/**
 * Hook para verificar si el usuario puede gestionar estados de venta
 * @returns true si el usuario puede crear, editar, eliminar u ordenar estados
 */
export function useCanManageSaleStatus(): boolean {
  const role = useRole();
  // Solo administradores pueden gestionar estados de venta
  return role === 'administrador';
}

/**
 * Hook para verificar si el usuario puede ver reportes y estadísticas
 * @returns true si el usuario tiene acceso a reportes avanzados
 */
export function useCanViewReports(): boolean {
  const role = useRole();
  // Administradores y coordinadores pueden ver reportes
  return role ? ['administrador', 'coordinador'].includes(role) : false;
}

/**
 * Hook para verificar si el usuario puede gestionar clientes
 * @returns true si el usuario puede crear, editar o eliminar clientes
 */
export function useCanManageClients(): boolean {
  const role = useRole();
  // Administradores, coordinadores y verificadores pueden gestionar clientes
  return role ? ['administrador', 'coordinador', 'verificador'].includes(role) : false;
}

/**
 * Hook para verificar si el usuario puede cambiar el estado de una venta
 * @returns true si el usuario puede cambiar estados de venta
 */
export function useCanChangeSaleStatus(): boolean {
  const role = useRole();
  // Todos los roles autenticados pueden cambiar el estado de ventas
  return Boolean(role);
}
