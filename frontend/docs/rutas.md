# Sistema de Rutas

## Visión General

El sistema de rutas utiliza **React Router v7** con una configuración centralizada que define todas las rutas, sus componentes y los permisos de acceso por rol.

---

## Configuración de Rutas

### routesConfig.tsx

Archivo central que define todas las rutas de la aplicación:

```tsx
// src/routes/routesConfig.tsx
import { lazy } from "react";
import type { RouteConfig } from "../types";

// Lazy loading de páginas
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const EditClientsPage = lazy(() => import("../pages/editClients/EditClientsPage"));
const AppsPage = lazy(() => import("../pages/apps/AppsPage"));
const CrmDashboardPage = lazy(() => import("../pages/crm-dashboard/CrmDashboardPage"));
const ClientsPage = lazy(() => import("../pages/clients/ClientsPage"));
const ProductsPage = lazy(() => import("../pages/products/ProductsPage"));
const SalesPage = lazy(() => import("../pages/sales/SalesPage"));
const SaleStatusPage = lazy(() => import("../pages/sale-status/SaleStatusPage"));

export const routesConfig: RouteConfig[] = [
  // Rutas del Buscador
  {
    path: "/dashboard",
    element: <DashboardPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Buscar registro",
    group: "Buscador",
  },
  {
    path: "/edit",
    element: <EditClientsPage />,
    allowedRoles: ["administrador", "coordinador"],
    label: "Editar registro",
    group: "Buscador",
  },
  {
    path: "/apps",
    element: <AppsPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Aplicaciones",
    group: "Buscador",
  },

  // Rutas del CRM
  {
    path: "/crm",
    element: <CrmDashboardPage />,
    allowedRoles: ["administrador"],
    label: "Dashboard CRM",
    group: "CRM",
  },
  {
    path: "/clients",
    element: <ClientsPage />,
    allowedRoles: ["administrador", "coordinador", "verificador"],
    label: "Clientes",
    group: "CRM",
  },
  {
    path: "/products",
    element: <ProductsPage />,
    allowedRoles: ["administrador"],
    label: "Productos",
    group: "CRM",
  },
  {
    path: "/sales",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Ventas",
    group: "CRM",
  },
  {
    path: "/sales/:saleId",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Detalle de Venta",
    group: "CRM",
    hideFromMenu: true,
  },
  {
    path: "/sale-status",
    element: <SaleStatusPage />,
    allowedRoles: ["administrador"],
    label: "Estados de Venta",
    group: "CRM",
  },
];
```

---

## Tipo RouteConfig

```typescript
// src/types/index.ts
export interface RouteConfig {
  path: string;           // Ruta URL
  element: React.ReactNode; // Componente a renderizar
  allowedRoles: string[]; // Roles con acceso
  label: string;          // Etiqueta para menú
  group: string;          // Grupo de navegación
  hideFromMenu?: boolean; // Ocultar del menú lateral
}
```

---

## AppRoutes

Componente que renderiza todas las rutas:

```tsx
// src/routes/AppRoutes.tsx
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/login/LoginPage";
import UnauthorizedPage from "../pages/unauthorized/UnauthorizedPage";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layouts/Layout";
import { useAppSelector } from "../hooks/reduxHooks";
import { routesConfig } from "./routesConfig";
import { Spinner } from "../components/LoadingComponents";
import LazyErrorBoundary from "../components/LazyErrorBoundary";

export default function AppRoutes() {
  const { isLoggedIn } = useAppSelector((state) => state.auth);

  return (
    <Routes>
      {/* Ruta pública: Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta pública: Acceso denegado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rutas privadas con protección */}
      {routesConfig.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <PrivateRoute allowedRoles={route.allowedRoles}>
              <Layout>
                <LazyErrorBoundary>
                  <Suspense fallback={<Spinner size="large" />}>
                    {route.element}
                  </Suspense>
                </LazyErrorBoundary>
              </Layout>
            </PrivateRoute>
          }
        />
      ))}

      {/* Ruta comodín: Redirección según estado de login */}
      <Route
        path="*"
        element={
          isLoggedIn
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
```

---

## PrivateRoute

Componente que protege las rutas por autenticación y rol:

```tsx
// src/routes/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { isLoggedIn, role } = useAppSelector((state) => state.auth);

  // Si no está logueado, redirigir a login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Si no tiene el rol necesario, redirigir a unauthorized
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

export default PrivateRoute;
```

---

## Mapa de Rutas y Permisos

| Ruta | Página | Admin | Coord | Verif | Comerc |
|------|--------|:-----:|:-----:|:-----:|:------:|
| `/login` | Login | - | - | - | - |
| `/dashboard` | Búsqueda | X | X | X | X |
| `/edit` | Editar Registros | X | X | - | - |
| `/apps` | Aplicaciones | X | X | X | X |
| `/crm` | Dashboard CRM | X | - | - | - |
| `/clients` | Clientes | X | X | X | - |
| `/products` | Productos | X | - | - | - |
| `/sales` | Ventas | X | X | X | X |
| `/sales/:saleId` | Detalle Venta | X | X | X | X |
| `/sale-status` | Estados | X | - | - | - |
| `/unauthorized` | Sin Acceso | - | - | - | - |

---

## Menú de Navegación

### menuConfig.ts

Configuración del menú lateral basada en las rutas:

```typescript
// src/routes/menuConfig.ts
import { routesConfig } from './routesConfig';

export interface MenuItem {
  path: string;
  label: string;
  group: string;
}

// Filtrar rutas visibles en el menú
export const getMenuItems = (userRole: string): MenuItem[] => {
  return routesConfig
    .filter(route => !route.hideFromMenu)
    .filter(route => route.allowedRoles.includes(userRole))
    .map(route => ({
      path: route.path,
      label: route.label,
      group: route.group,
    }));
};

// Agrupar items por grupo
export const getGroupedMenuItems = (userRole: string) => {
  const items = getMenuItems(userRole);
  const groups: Record<string, MenuItem[]> = {};

  items.forEach(item => {
    if (!groups[item.group]) {
      groups[item.group] = [];
    }
    groups[item.group].push(item);
  });

  return groups;
};
```

---

## Navegación Programática

### Usando useNavigate

```tsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navegar a una ruta
    navigate('/sales');

    // Navegar con parámetros
    navigate(`/sales/${saleId}`);

    // Navegar hacia atrás
    navigate(-1);

    // Navegar reemplazando historial
    navigate('/dashboard', { replace: true });
  };

  return <Button onClick={handleClick}>Ir a Ventas</Button>;
};
```

### Usando Link

```tsx
import { Link } from 'react-router-dom';

<Link to="/sales">Ver Ventas</Link>
<Link to={`/sales/${sale.id}`}>Detalle</Link>
```

---

## Parámetros de URL

### Obtener parámetros

```tsx
import { useParams } from 'react-router-dom';

const SaleDetailPage = () => {
  const { saleId } = useParams<{ saleId: string }>();

  useEffect(() => {
    if (saleId) {
      loadSale(saleId);
    }
  }, [saleId]);

  return <div>Venta: {saleId}</div>;
};
```

### Query Parameters

```tsx
import { useSearchParams } from 'react-router-dom';

const SalesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status');
  const page = searchParams.get('page') || '1';

  const updateFilters = (newStatus: string) => {
    setSearchParams({ status: newStatus, page: '1' });
  };

  return <SaleFilters onFilterChange={updateFilters} />;
};
```

---

## Lazy Loading

Las páginas se cargan bajo demanda para mejorar el rendimiento inicial:

```tsx
// Definición con lazy
const SalesPage = lazy(() => import('../pages/sales/SalesPage'));

// Uso con Suspense
<Suspense fallback={<Spinner size="large" />}>
  <SalesPage />
</Suspense>
```

**Beneficios**:
- Menor tamaño del bundle inicial
- Carga más rápida de la primera página
- Código dividido en chunks

---

## Error Boundary para Rutas

```tsx
// components/LazyErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class LazyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error loading component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Algo salió mal</h2>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyErrorBoundary;
```

---

## Flujo de Navegación por Rol

### Comercial

```
Login → Dashboard (búsqueda)
     → Apps
     → Ventas (formulario de creación directa)
```

### Verificador

```
Login → Dashboard (búsqueda)
     → Apps
     → Clientes
     → Ventas (lista + detalle + edición)
```

### Coordinador

```
Login → Dashboard (búsqueda)
     → Editar Registros
     → Apps
     → Clientes
     → Ventas (lista + detalle + edición completa)
```

### Administrador

```
Login → Dashboard (búsqueda)
     → Editar Registros
     → Apps
     → Dashboard CRM
     → Clientes
     → Productos
     → Ventas (acceso completo)
     → Estados de Venta
```

---

## Redirecciones Especiales

### Después del Login

```tsx
// Siempre redirige a /dashboard después del login
navigate('/dashboard');
```

### Acceso Denegado

```tsx
// Si el rol no tiene permisos
<Navigate to="/unauthorized" replace />
```

### Ruta No Encontrada

```tsx
// Redirige según estado de login
{isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
```

### Comportamiento del Comercial en Ventas

```tsx
// SalesPage.tsx
const isComercial = role === 'comercial';

// El comercial ve directamente el formulario, no la lista
const [viewMode, setViewMode] = useState<ViewMode>(
  isComercial ? 'create' : 'list'
);
```
