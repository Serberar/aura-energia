/**
 * Redux Slice para gestión de estados de venta
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  SaleStatus,
  SaleStatusState,
  CreateSaleStatusData,
  UpdateSaleStatusData,
  ReorderStatusesRequest,
} from '../../types/sales';

import * as saleStatusService from './services/saleStatusService';
import { logger } from '../../utils/logger';

// Estado inicial
const initialState: SaleStatusState = {
  statuses: [],
  selectedStatus: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// ================================
// ASYNC THUNKS
// ================================

/**
 * Obtener todos los estados de venta
 */
export const fetchSaleStatuses = createAsyncThunk(
  'saleStatus/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const statuses = await saleStatusService.getAllSaleStatuses();
      return statuses;
    } catch (error: any) {
      logger.error('Error al obtener estados de venta', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener estados de venta');
    }
  }
);

/**
 * Obtener un estado de venta por ID
 */
export const fetchSaleStatusById = createAsyncThunk(
  'saleStatus/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const status = await saleStatusService.getSaleStatusById(id);
      return status;
    } catch (error: any) {
      logger.error(`Error al obtener estado de venta ${id}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener estado de venta');
    }
  }
);

/**
 * Crear un nuevo estado de venta
 */
export const createSaleStatus = createAsyncThunk(
  'saleStatus/create',
  async (data: CreateSaleStatusData, { rejectWithValue }) => {
    try {
      const status = await saleStatusService.createSaleStatus(data);
      logger.userAction('Estado de venta creado', { statusId: status.id, name: status.name });
      return status;
    } catch (error: any) {
      logger.error('Error al crear estado de venta', error);
      return rejectWithValue(error.response?.data?.message || 'Error al crear estado de venta');
    }
  }
);

/**
 * Actualizar un estado de venta
 */
export const updateSaleStatus = createAsyncThunk(
  'saleStatus/update',
  async ({ id, data }: { id: string; data: UpdateSaleStatusData }, { rejectWithValue }) => {
    try {
      const status = await saleStatusService.updateSaleStatus(id, data);
      logger.userAction('Estado de venta actualizado', { statusId: status.id, name: status.name });
      return status;
    } catch (error: any) {
      logger.error(`Error al actualizar estado de venta ${id}`, error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al actualizar estado de venta'
      );
    }
  }
);

/**
 * Eliminar un estado de venta
 */
export const deleteSaleStatus = createAsyncThunk(
  'saleStatus/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await saleStatusService.deleteSaleStatus(id);
      logger.userAction('Estado de venta eliminado', { statusId: id });
      return id;
    } catch (error: any) {
      logger.error(`Error al eliminar estado de venta ${id}`, error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al eliminar estado de venta'
      );
    }
  }
);

/**
 * Reordenar estados de venta
 */
export const reorderSaleStatuses = createAsyncThunk(
  'saleStatus/reorder',
  async (data: ReorderStatusesRequest, { rejectWithValue }) => {
    try {
      const statuses = await saleStatusService.reorderSaleStatuses(data);
      logger.userAction('Estados de venta reordenados', { count: statuses.length });
      return statuses;
    } catch (error: any) {
      logger.error('Error al reordenar estados de venta', error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al reordenar estados de venta'
      );
    }
  }
);

// ================================
// SLICE
// ================================

const saleStatusSlice = createSlice({
  name: 'saleStatus',
  initialState,
  reducers: {
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Reset completo del estado
    resetSaleStatusState: () => initialState,

    // Actualizar orden localmente (para drag & drop optimista)
    updateLocalOrder: (state, action: PayloadAction<SaleStatus[]>) => {
      state.statuses = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all sale statuses
    builder
      .addCase(fetchSaleStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchSaleStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch sale status by ID
    builder
      .addCase(fetchSaleStatusById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleStatusById.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar en la lista si existe
        const index = state.statuses.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.statuses[index] = action.payload;
        }
      })
      .addCase(fetchSaleStatusById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create sale status
    builder
      .addCase(createSaleStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSaleStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses.push(action.payload);
        // Reordenar por 'order'
        state.statuses.sort((a, b) => a.order - b.order);
      })
      .addCase(createSaleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update sale status
    builder
      .addCase(updateSaleStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSaleStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.statuses.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.statuses[index] = action.payload;
        }
      })
      .addCase(updateSaleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete sale status
    builder
      .addCase(deleteSaleStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSaleStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = state.statuses.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteSaleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reorder sale statuses
    builder
      .addCase(reorderSaleStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderSaleStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = action.payload;
        // Ya vienen ordenados del backend
      })
      .addCase(reorderSaleStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ================================
// EXPORTS
// ================================

export const { clearError, resetSaleStatusState, updateLocalOrder } = saleStatusSlice.actions;

export default saleStatusSlice.reducer;
