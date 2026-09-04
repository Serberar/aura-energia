/**
 * Redux Slice para gestión de clientes CRM
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Client, CreateClientData } from '../../types/sales';
import * as clientService from './services/clientService';
import { logger } from '../../utils/logger';

// Estado del slice de clientes
export interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Estado inicial
const initialState: ClientsState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// ================================
// ASYNC THUNKS
// ================================

/**
 * Obtener todos los clientes
 */
export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Por ahora retornamos array vacío ya que no hay endpoint para listar todos
      // En el futuro se puede implementar GET /clients si el backend lo soporta
      logger.info('Fetch de clientes - pendiente de implementación en backend');
      return [];
    } catch (error: any) {
      logger.error('Error al obtener clientes', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener clientes');
    }
  }
);

/**
 * Buscar cliente por ID, DNI o teléfono
 */
export const searchClient = createAsyncThunk(
  'clients/search',
  async (value: string, { rejectWithValue }) => {
    try {
      const result = await clientService.searchClient(value);
      return Array.isArray(result) ? result : [result];
    } catch (error: any) {
      logger.error(`Error al buscar cliente: ${value}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al buscar cliente');
    }
  }
);

/**
 * Obtener un cliente por ID
 */
export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const client = await clientService.getClientById(id);
      return client;
    } catch (error: any) {
      logger.error(`Error al obtener cliente ${id}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener cliente');
    }
  }
);

/**
 * Crear un nuevo cliente
 */
export const createClient = createAsyncThunk(
  'clients/create',
  async (data: CreateClientData, { rejectWithValue }) => {
    try {
      const client = await clientService.createClient(data);
      logger.userAction('Cliente creado', {
        clientId: client.id,
        name: `${client.firstName} ${client.lastName}`,
      });
      return client;
    } catch (error: any) {
      logger.error('Error al crear cliente', error);
      return rejectWithValue(error.response?.data?.message || 'Error al crear cliente');
    }
  }
);

// ================================
// SLICE
// ================================

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    // Seleccionar un cliente
    selectClient: (state, action: PayloadAction<Client | null>) => {
      state.selectedClient = action.payload;
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar cliente seleccionado
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    },

    // Añadir cliente a la lista manualmente (útil después de crearlo)
    addClient: (state, action: PayloadAction<Client>) => {
      const exists = state.clients.find((c) => c.id === action.payload.id);
      if (!exists) {
        state.clients.unshift(action.payload);
      }
    },

    // Reset completo del estado
    resetClientsState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch all clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search client
    builder
      .addCase(searchClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchClient.fulfilled, (state, action) => {
        state.loading = false;
        // Añadir los resultados de búsqueda sin duplicar
        action.payload.forEach((client) => {
          const exists = state.clients.find((c) => c.id === client.id);
          if (!exists) {
            state.clients.push(client);
          }
        });
      })
      .addCase(searchClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch client by ID
    builder
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClient = action.payload;
        // También añadir a la lista si no existe
        const exists = state.clients.find((c) => c.id === action.payload.id);
        if (!exists) {
          state.clients.push(action.payload);
        }
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create client
    builder
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients.unshift(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ================================
// EXPORTS
// ================================

export const {
  selectClient,
  clearError,
  clearSelectedClient,
  addClient,
  resetClientsState,
} = clientsSlice.actions;

export default clientsSlice.reducer;