import { routesConfig } from "./routesConfig";
import type { UserRole } from "../types";

export interface MenuItem {
  path: string;
  label: string;
  external: boolean;
  group?: string;
}

export interface MenuSection {
  group: string;
  items: MenuItem[];
}

/**
 * Obtiene los items del menú para un rol específico
 * Filtra por permisos y agrupa por sección
 */
export const getMenuItems = (userRole: UserRole): MenuItem[] => {
  return routesConfig
    .filter(route => route.allowedRoles.includes(userRole))
    .filter(route => !route.hideFromMenu)
    .map(route => ({
      path: route.path,
      label: route.label || route.path.replace("/", "").toUpperCase() || "Dashboard",
      external: route.external || false,
      group: route.group,
    }));
};

/**
 * Obtiene los items del menú agrupados por sección
 */
export const getGroupedMenuItems = (userRole: UserRole): MenuSection[] => {
  const items = getMenuItems(userRole);
  const grouped = new Map<string, MenuItem[]>();

  // Agrupar items
  items.forEach(item => {
    const groupName = item.group || 'General';
    if (!grouped.has(groupName)) {
      grouped.set(groupName, []);
    }
    grouped.get(groupName)!.push(item);
  });

  // Convertir a array y ordenar
  const sections: MenuSection[] = [];

  // Primero añadir General si existe
  if (grouped.has('General')) {
    sections.push({
      group: 'General',
      items: grouped.get('General')!,
    });
    grouped.delete('General');
  }

  // Luego el resto de grupos
  grouped.forEach((items, group) => {
    sections.push({ group, items });
  });

  return sections;
};
