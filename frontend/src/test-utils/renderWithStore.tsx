/**
 * Utilidades de test reutilizables
 * Provee un store de Redux configurado para tests de componentes y páginas
 */

import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

// Reducers reales - usamos los slices reales para tests de integración
import authReducer from '@/features/auth/authSlice';
import saleStatusReducer from '@/features/saleStatus/saleStatusSlice';
import clientsReducer from '@/features/clientes/clientsSlice';
import usersReducer from '@/features/users/usersSlice';
import productsReducer from '@/features/products/productsSlice';
import appSettingsReducer from '@/features/settings/settingsSlice';

// Slice stub mínimo para features no testeadas en contexto
const noopReducer = (state = {}) => state;

// ─── Store factory ────────────────────────────────────────────────────────────

export interface StorePreloadedState {
  auth?: {
    id?: string | null;
    user?: { id: string; firstName: string; lastName: string } | null;
    accessToken?: string | null;
    role?: string | null;
    isLoggedIn?: boolean;
  };
  saleStatus?: any;
  clients?: any;
  users?: any;
  products?: any;
}

export function createTestStore(preloadedState: StorePreloadedState = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialState: any = {
    auth: {
      id: 'user-1',
      user: { id: 'user-1', firstName: 'Admin', lastName: 'Test' },
      accessToken: 'test-token',
      role: 'administrador',
      isLoggedIn: true,
      ...preloadedState.auth,
    },
    saleStatus: {
      statuses: [],
      selectedStatus: null,
      loading: false,
      error: null,
      lastFetch: null,
      ...preloadedState.saleStatus,
    },
    clients: {
      clients: [],
      loading: false,
      error: null,
      lastFetch: null,
      ...preloadedState.clients,
    },
    users: {
      users: [],
      loading: false,
      error: null,
      ...preloadedState.users,
    },
    products: {
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      lastFetch: null,
      ...preloadedState.products,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reducerMap: any = {
    auth:        authReducer,
    saleStatus:  saleStatusReducer,
    clients:     clientsReducer,
    users:       usersReducer,
    skore:       noopReducer,
    products:    productsReducer,
    sales:       noopReducer,
    allowedIps:  noopReducer,
    appSettings: appSettingsReducer,
  };

  return configureStore({ reducer: reducerMap, preloadedState: initialState });
}

// ─── renderWithStore ──────────────────────────────────────────────────────────

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: StorePreloadedState;
  initialRoute?: string;
}

export function renderWithStore(
  ui: React.ReactElement,
  { preloadedState = {}, initialRoute = '/', ...renderOptions }: RenderWithStoreOptions = {}
) {
  const store = createTestStore(preloadedState);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
