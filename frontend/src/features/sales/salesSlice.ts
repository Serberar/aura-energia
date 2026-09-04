/* src/features/sales/salesSlice.ts */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  Sale,
  SalesState,
  CreateSaleData,
  SaleFilters,
  ChangeSaleStatusRequest,
  CreateSaleItemData,
  UpdateSaleItemData,
} from '@/types/sales';

import * as saleService from './services/saleService';
import { logger } from '@/utils/logger';

const initialState: SalesState = {
  sales: [],
  selectedSale: null,
  filters: {},
  loading: false,
  error: null,
  lastFetch: null,
};

// THUNKS
export const fetchSales = createAsyncThunk(
  'sales/fetchAll',
  async (filters: SaleFilters | undefined, { rejectWithValue }) => {
    try {
      const sales = await saleService.getAllSales(filters);
      return { sales, filters: filters || {} };
    } catch (error: any) {
      logger.error('Error al obtener ventas', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener ventas');
    }
  }
);

export const fetchSaleById = createAsyncThunk('sales/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const sale = await saleService.getSaleById(id);
    return sale;
  } catch (error: any) {
    logger.error(`Error al obtener venta ${id}`, error);
    return rejectWithValue(error.response?.data?.message || 'Error al obtener venta');
  }
});

export const createSale = createAsyncThunk('sales/create', async (data: CreateSaleData, { rejectWithValue }) => {
  try {
    const sale = await saleService.createSale(data);
    logger.userAction('Venta creada', { saleId: sale.id, total: sale.totalAmount });
    return sale;
  } catch (error: any) {
    logger.error('Error al crear venta', error);
    return rejectWithValue(error.response?.data?.message || 'Error al crear venta');
  }
});

export const addSaleItem = createAsyncThunk(
  'sales/addItem',
  async ({ saleId, itemData }: { saleId: string; itemData: CreateSaleItemData }, { rejectWithValue }) => {
    try {
      const sale = await saleService.addSaleItem(saleId, itemData);
      logger.userAction('Item añadido a venta', { saleId, itemName: itemData.name });
      return sale;
    } catch (error: any) {
      logger.error(`Error al añadir item a venta ${saleId}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al añadir item');
    }
  }
);

export const updateSaleItem = createAsyncThunk(
  'sales/updateItem',
  async (
    { saleId, itemId, itemData }: { saleId: string; itemId: string; itemData: UpdateSaleItemData },
    { rejectWithValue }
  ) => {
    try {
      const sale = await saleService.updateSaleItem(saleId, itemId, itemData);
      logger.userAction('Item actualizado en venta', { saleId, itemId });
      return sale;
    } catch (error: any) {
      logger.error(`Error al actualizar item ${itemId} en venta ${saleId}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar item');
    }
  }
);

export const removeSaleItem = createAsyncThunk(
  'sales/removeItem',
  async ({ saleId, itemId }: { saleId: string; itemId: string }, { rejectWithValue }) => {
    try {
      const sale = await saleService.removeSaleItem(saleId, itemId);
      logger.userAction('Item eliminado de venta', { saleId, itemId });
      return sale;
    } catch (error: any) {
      logger.error(`Error al eliminar item ${itemId} de venta ${saleId}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar item');
    }
  }
);

export const changeSaleStatus = createAsyncThunk(
  'sales/changeStatus',
  async ({ saleId, statusData }: { saleId: string; statusData: ChangeSaleStatusRequest }, { rejectWithValue }) => {
    try {
      const sale = await saleService.changeSaleStatus(saleId, statusData);
      logger.userAction('Estado de venta cambiado', { saleId, statusId: statusData.statusId });
      return sale;
    } catch (error: any) {
      logger.error(`Error al cambiar estado de venta ${saleId}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al cambiar estado');
    }
  }
);

export const deleteSale = createAsyncThunk('sales/delete', async (id: string, { rejectWithValue }) => {
  try {
    await saleService.deleteSale(id);
    logger.userAction('Venta eliminada', { saleId: id });
    return id;
  } catch (error: any) {
    logger.error(`Error al eliminar venta ${id}`, error);
    return rejectWithValue(error.response?.data?.message || 'Error al eliminar venta');
  }
});

// SLICE
const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    selectSale: (state, action: PayloadAction<Sale | null>) => {
      state.selectedSale = action.payload;
    },
    setFilters: (state, action: PayloadAction<SaleFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedSale: (state) => {
      state.selectedSale = null;
    },
    resetSalesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload.sales;
        state.filters = action.payload.filters;
        state.lastFetch = Date.now();
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchSaleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSale = action.payload;
        const idx = state.sales.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sales[idx] = action.payload;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.loading = false;
        state.sales.unshift(action.payload);
        state.selectedSale = action.payload;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addSaleItem.fulfilled, (state, action) => {
        const idx = state.sales.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sales[idx] = action.payload;
        if (state.selectedSale?.id === action.payload.id) state.selectedSale = action.payload;
        state.loading = false;
      })
      .addCase(addSaleItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateSaleItem.fulfilled, (state, action) => {
        const idx = state.sales.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sales[idx] = action.payload;
        if (state.selectedSale?.id === action.payload.id) state.selectedSale = action.payload;
        state.loading = false;
      })
      .addCase(updateSaleItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(removeSaleItem.fulfilled, (state, action) => {
        const idx = state.sales.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sales[idx] = action.payload;
        if (state.selectedSale?.id === action.payload.id) state.selectedSale = action.payload;
        state.loading = false;
      })
      .addCase(removeSaleItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(changeSaleStatus.fulfilled, (state, action) => {
        const idx = state.sales.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.sales[idx] = action.payload;
        if (state.selectedSale?.id === action.payload.id) state.selectedSale = action.payload;
        state.loading = false;
      })
      .addCase(changeSaleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteSale.fulfilled, (state, action) => {
        state.sales = state.sales.filter((s) => s.id !== action.payload);
        if (state.selectedSale?.id === action.payload) state.selectedSale = null;
        state.loading = false;
      })
      .addCase(deleteSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectSale, setFilters, clearFilters, clearError, clearSelectedSale, resetSalesState } =
  salesSlice.actions;

export default salesSlice.reducer;
