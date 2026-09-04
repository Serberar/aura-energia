/**
 * Utilidades para precargar recursos y optimizar la carga
 */

// Precargar componentes lazy cuando el usuario está cerca de navegarlos
export const preloadComponent = (importFunction: () => Promise<unknown>) => {
  return importFunction();
};

// Precargar rutas comunes cuando el usuario entra al dashboard
export const preloadCommonRoutes = () => {
  // Precargar las páginas más utilizadas después del login
  const routes = [
    () => import("../pages/dashboard/DashboardPage"),
  ];

  // Usar requestIdleCallback si está disponible, sino setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback);
    } else {
      setTimeout(callback, 100);
    }
  };

  routes.forEach((routeImport, index) => {
    schedulePreload(() => {
      setTimeout(() => {
        routeImport().catch(() => {
          // Silenciar errores de precarga
        });
      }, index * 500); // Espaciar las precargas
    });
  });
};

// Precargar recursos cuando el mouse entra en un enlace
export const preloadOnHover = (routePath: string) => {
  const routeImports: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import("../pages/dashboard/DashboardPage"),
    '/edit': () => import("../pages/editClients/EditClientsPage"),
  };

  const importFunction = routeImports[routePath];
  if (importFunction) {
    importFunction().catch(() => {
      // Silenciar errores de precarga
    });
  }
};