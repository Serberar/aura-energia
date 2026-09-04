# Arquitectura del Frontend

## Visión General

El frontend sigue una arquitectura **Feature-Based** (basada en características), donde el código se organiza por funcionalidad de negocio en lugar de por tipo de archivo. Esto facilita la escalabilidad y el mantenimiento del proyecto.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         APLICACIÓN                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                         App.tsx                          │    │
│  │                    BrowserRouter                         │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐    │
│  │                       AppRoutes                          │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   Login     │  │ PrivateRoute │  │ Unauthorized │    │    │
│  │  └─────────────┘  └──────┬───────┘  └──────────────┘    │    │
│  │                          │                               │    │
│  │                    ┌─────┴─────┐                         │    │
│  │                    │  Layout   │                         │    │
│  │                    └─────┬─────┘                         │    │
│  │                          │                               │    │
│  │         ┌────────────────┼────────────────┐              │    │
│  │         │                │                │              │    │
│  │    ┌────┴────┐    ┌─────┴─────┐    ┌────┴────┐         │    │
│  │    │Dashboard│    │   Sales   │    │Products │         │    │
│  │    └─────────┘    └───────────┘    └─────────┘         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      FEATURES                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │  auth    │  │ clientes │  │  sales   │  │ products │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      REDUX STORE                          │   │
│  │  ┌───────────────┐  ┌────────────────┐                   │   │
│  │  │   authSlice   │  │   salesSlice   │                   │   │
│  │  └───────────────┘  └────────────────┘                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Organización por Features

Cada feature es un módulo autocontenido con todos los elementos necesarios:

```
features/
├── auth/                    # Autenticación
│   ├── authSlice.ts         # Estado Redux
│   └── services/
│       └── authService.ts   # Llamadas API
│
├── clientes/                # Gestión de clientes
│   ├── components/          # Componentes de UI
│   │   └── UnifiedSearchResults.tsx
│   ├── hooks/               # Hooks del feature
│   │   └── useUnifiedSearch.ts
│   └── services/
│       └── clientService.ts
│
├── sales/                   # Gestión de ventas
│   ├── components/          # Componentes
│   │   ├── SaleForm.tsx
│   │   ├── SalesList.tsx
│   │   ├── SaleDetail.tsx
│   │   ├── SaleCard.tsx
│   │   ├── SaleFilters.tsx
│   │   ├── SaleItemsManager.tsx
│   │   ├── SaleStatusChanger.tsx
│   │   ├── SaleRecordings.tsx
│   │   ├── ClientSearchForm.tsx
│   │   ├── ProductSearchForm.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSales.ts
│   │   ├── useSaleItems.ts
│   │   └── index.ts
│   ├── services/
│   │   └── saleService.ts
│   ├── utils/
│   │   └── saleCalculations.ts
│   ├── salesSlice.ts
│   └── index.ts             # Exports públicos
│
├── products/                # Gestión de productos
│   ├── components/
│   ├── hooks/
│   └── services/
│
└── saleStatus/              # Estados de venta
    ├── components/
    ├── hooks/
    └── services/
```

---

## Capas de la Aplicación

### 1. Capa de Presentación (Pages + Components)

Componentes de React que renderizan la UI:

```tsx
// pages/sales/SalesPage.tsx
const SalesPage = () => {
  const { sales, loading } = useSales();

  return (
    <div className={styles.page}>
      <SalesList sales={sales} />
    </div>
  );
};
```

### 2. Capa de Estado (Redux + Hooks)

Gestión del estado global y local:

```tsx
// features/sales/salesSlice.ts
const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    // ...
  },
  extraReducers: (builder) => {
    // Async thunks
  }
});

// features/sales/hooks/useSales.ts
export const useSales = () => {
  const dispatch = useAppDispatch();
  const { sales, loading } = useAppSelector(state => state.sales);

  const loadSales = useCallback(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  return { sales, loading, loadSales };
};
```

### 3. Capa de Servicios (API Calls)

Comunicación con el backend:

```tsx
// features/sales/services/saleService.ts
export const getSales = async (filters?: SaleFilters): Promise<Sale[]> => {
  const response = await api.get('/sales', { params: filters });
  return response.data;
};
```

---

## Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │ ──▶ │ Componente  │ ──▶ │    Hook     │
│   (click)   │     │ (dispatch)  │     │  (action)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     UI      │ ◀── │   Selector  │ ◀── │   Reducer   │
│  (render)   │     │  (state)    │     │  (update)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Ejemplo: Crear una Venta**

1. Usuario completa el formulario y hace click en "Crear Venta"
2. `SaleForm` llama a `onSubmit` con los datos
3. `useSales.create()` dispatch el thunk `createSale`
4. `saleService.createSale()` hace POST al backend
5. El reducer actualiza el estado con la nueva venta
6. El selector notifica al componente del cambio
7. La UI se actualiza mostrando la nueva venta

---

## Sistema de Rutas

### Configuración Centralizada

```tsx
// routes/routesConfig.tsx
export const routesConfig: RouteConfig[] = [
  {
    path: "/dashboard",
    element: <DashboardPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Buscar registro",
    group: "Buscador",
  },
  {
    path: "/sales",
    element: <SalesPage />,
    allowedRoles: ["administrador", "coordinador", "verificador", "comercial"],
    label: "Ventas",
    group: "CRM",
  },
  // ...
];
```

### Protección de Rutas

```tsx
// routes/PrivateRoute.tsx
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, role } = useAppSelector(state => state.auth);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

---

## Patrones de Diseño Utilizados

### 1. Container/Presentational

Separación entre lógica y presentación:

```tsx
// Container (con lógica)
const SalesPageContainer = () => {
  const { sales, loading } = useSales();
  return <SalesPage sales={sales} loading={loading} />;
};

// Presentational (sin lógica)
const SalesPage = ({ sales, loading }) => (
  <div>{loading ? <Spinner /> : <SalesList sales={sales} />}</div>
);
```

### 2. Custom Hooks

Encapsulan lógica reutilizable:

```tsx
const useSales = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);

  const loadSales = async () => {
    setLoading(true);
    const data = await getSales();
    setSales(data);
    setLoading(false);
  };

  return { sales, loading, loadSales };
};
```

### 3. Compound Components

Componentes que trabajan juntos:

```tsx
<SaleForm>
  <ClientSearchForm />
  <ProductSearchForm />
  <SaleActions />
</SaleForm>
```

### 4. Render Props / Children as Function

Para componentes flexibles:

```tsx
<AsyncState
  loading={loading}
  error={error}
  render={(data) => <SalesList sales={data} />}
/>
```

---

## Lazy Loading

Las páginas se cargan bajo demanda:

```tsx
// routesConfig.tsx
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const SalesPage = lazy(() => import('../pages/sales/SalesPage'));

// AppRoutes.tsx
<Suspense fallback={<Spinner />}>
  <DashboardPage />
</Suspense>
```

---

## Error Boundaries

Manejo de errores en componentes lazy:

```tsx
// components/LazyErrorBoundary.tsx
class LazyErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Ventajas de esta Arquitectura

1. **Escalabilidad**: Fácil añadir nuevos features sin afectar otros
2. **Mantenibilidad**: Código relacionado junto, fácil de encontrar
3. **Testabilidad**: Cada feature puede testearse aisladamente
4. **Colaboración**: Equipos pueden trabajar en features distintos
5. **Reutilización**: Hooks y servicios compartidos entre componentes
