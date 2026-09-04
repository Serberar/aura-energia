# Gestión de Estado

## Visión General

La aplicación utiliza **Redux Toolkit** para la gestión del estado global. El estado se organiza en "slices" por funcionalidad, y se accede mediante hooks personalizados.

---

## Configuración del Store

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import salesReducer from '../features/sales/salesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sales: salesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## Slices

### authSlice

Gestiona el estado de autenticación del usuario.

```typescript
// features/auth/authSlice.ts

interface AuthState {
  isLoggedIn: boolean;
  id: string | null;
  user: string | null;
  accessToken: string | null;
  role: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  id: null,
  user: null,
  accessToken: null,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.id = action.payload.id;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.id = null;
      state.user = null;
      state.accessToken = null;
      state.role = null;
    },
    updateToken: (state, action) => {
      state.accessToken = action.payload;
    },
  },
});
```

**Acciones**:
| Acción | Payload | Descripción |
|--------|---------|-------------|
| `login` | `{ id, user, accessToken, role }` | Guarda datos del usuario al loguearse |
| `logout` | - | Limpia todo el estado de auth |
| `updateToken` | `string` | Actualiza el access token |

---

### salesSlice

Gestiona el estado de las ventas.

```typescript
// features/sales/salesSlice.ts

interface SalesState {
  sales: Sale[];
  selectedSale: Sale | null;
  loading: boolean;
  error: string | null;
  filters: SaleFilters;
}

const initialState: SalesState = {
  sales: [],
  selectedSale: null,
  loading: false,
  error: null,
  filters: {},
};
```

**Async Thunks**:

```typescript
// Cargar ventas
export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (filters: SaleFilters, { rejectWithValue }) => {
    try {
      const response = await getSales(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Crear venta
export const createSale = createAsyncThunk(
  'sales/createSale',
  async (payload: CreateSalePayload, { rejectWithValue }) => {
    try {
      const response = await saleService.createSale(payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

**Extra Reducers**:

```typescript
extraReducers: (builder) => {
  builder
    // fetchSales
    .addCase(fetchSales.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchSales.fulfilled, (state, action) => {
      state.loading = false;
      state.sales = action.payload;
    })
    .addCase(fetchSales.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    // createSale
    .addCase(createSale.fulfilled, (state, action) => {
      state.sales.unshift(action.payload);
    });
}
```

---

## Hooks de Redux

### Hooks Tipados

```typescript
// hooks/reduxHooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

// Usar estos hooks en lugar de los genéricos
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**Uso**:

```tsx
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { isLoggedIn, user, role } = useAppSelector((state) => state.auth);
  const { sales, loading } = useAppSelector((state) => state.sales);

  // ...
};
```

---

## Hooks Personalizados

### useRole

Obtiene el rol del usuario actual.

```typescript
// hooks/useRole.ts
export const useRole = () => {
  const { role } = useAppSelector((state) => state.auth);
  return role;
};
```

**Uso**:

```tsx
const role = useRole();
const isAdmin = role === 'administrador';
const canEdit = ['administrador', 'coordinador'].includes(role);
```

---

### useAsyncState

Hook para gestionar estados asíncronos.

```typescript
// hooks/useAsyncState.ts
interface AsyncStateOptions {
  errorContext?: string;
}

export const useAsyncState = (options: AsyncStateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const execute = async <T>(
    asyncFn: () => Promise<T>,
    executeOptions?: {
      successMessage?: string;
      errorContext?: string;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (executeOptions?.successMessage) {
        setSuccess(executeOptions.successMessage);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return { isLoading, error, success, execute, clearMessages };
};
```

**Uso**:

```tsx
const { isLoading, error, execute, clearMessages } = useAsyncState({
  errorContext: 'Login'
});

const handleLogin = async () => {
  const result = await execute(
    () => loginAPI({ username, password }),
    { successMessage: 'Iniciando sesión...' }
  );

  if (result) {
    // Login exitoso
  }
};
```

---

### useSales

Hook principal para gestión de ventas.

```typescript
// features/sales/hooks/useSales.ts
export const useSales = () => {
  const dispatch = useAppDispatch();
  const { sales, selectedSale, loading, error } = useAppSelector(
    (state) => state.sales
  );

  const loadSales = useCallback(
    (filters?: SaleFilters) => {
      dispatch(fetchSales(filters || {}));
    },
    [dispatch]
  );

  const loadSaleById = useCallback(
    (saleId: string) => {
      dispatch(fetchSaleById(saleId));
    },
    [dispatch]
  );

  const create = useCallback(
    async (payload: CreateSalePayload) => {
      await dispatch(createSale(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    sales,
    selectedSale,
    loading,
    error,
    loadSales,
    loadSaleById,
    create,
  };
};
```

---

### useSaleItems

Hook para gestión de items de venta.

```typescript
// features/sales/hooks/useSaleItems.ts
export const useSaleItems = (saleId: string) => {
  const dispatch = useAppDispatch();

  const addItem = useCallback(
    async (item: AddItemPayload) => {
      await saleService.addSaleItem(saleId, item);
      dispatch(fetchSaleById(saleId)); // Recargar venta
    },
    [saleId, dispatch]
  );

  const updateItem = useCallback(
    async (itemId: string, data: UpdateItemPayload) => {
      await saleService.updateSaleItem(saleId, itemId, data);
      dispatch(fetchSaleById(saleId));
    },
    [saleId, dispatch]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await saleService.removeSaleItem(saleId, itemId);
      dispatch(fetchSaleById(saleId));
    },
    [saleId, dispatch]
  );

  return { addItem, updateItem, removeItem };
};
```

---

### useSaleStatusChange

Hook para cambiar el estado de una venta.

```typescript
// features/sales/hooks/useSaleStatusChange.ts
export const useSaleStatusChange = (saleId: string) => {
  const dispatch = useAppDispatch();

  const changeStatus = useCallback(
    async (statusId: string) => {
      await saleService.changeSaleStatus(saleId, statusId);
      dispatch(fetchSaleById(saleId));
    },
    [saleId, dispatch]
  );

  return { changeStatus };
};
```

---

### useSaleStatus

Hook para estados de venta.

```typescript
// features/saleStatus/hooks/useSaleStatus.ts
export const useSaleStatus = () => {
  const [statuses, setStatuses] = useState<SaleStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await saleStatusService.getStatuses();
      setStatuses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  return { statuses, loading, reload: loadStatuses };
};
```

---

## Flujo de Autenticación

### Login

```tsx
// pages/login/LoginPage.tsx
const handleLogin = async () => {
  const result = await execute(
    () => loginAPI({ username, password })
  );

  if (result) {
    // Guardar en Redux
    dispatch(login({
      id: result.id,
      user: result.firstName,
      accessToken: result.accessToken,
      role: result.role,
    }));

    // Redirigir
    navigate('/dashboard');
  }
};
```

### Refresh Token

```typescript
// api/axios.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { accessToken } = await refreshAPI();
        store.dispatch(updateToken(accessToken));
        // Reintentar petición original
        return api(error.config);
      } catch {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Logout

```tsx
const handleLogout = async () => {
  await logoutUser();
  dispatch(logout());
  navigate('/login');
};
```

---

## Persistencia del Estado

El estado de autenticación se persiste en localStorage:

```typescript
// Al hacer login
localStorage.setItem('refreshToken', refreshToken);

// Al hacer logout
localStorage.removeItem('refreshToken');

// Al cargar la app (opcional: rehidratar estado)
const savedToken = localStorage.getItem('refreshToken');
if (savedToken) {
  // Intentar refresh para obtener nuevo accessToken
}
```

---

## Buenas Prácticas

1. **Usar hooks tipados** (`useAppDispatch`, `useAppSelector`)
2. **Crear hooks personalizados** para encapsular lógica
3. **Usar `createAsyncThunk`** para operaciones asíncronas
4. **Manejar estados de loading/error** en el slice
5. **Evitar lógica en componentes**, moverla a hooks
6. **Normalizar datos** cuando sea posible
