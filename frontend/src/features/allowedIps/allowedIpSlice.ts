import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AllowedIp, CreateAllowedIpData } from './services/allowedIpService';
import * as allowedIpService from './services/allowedIpService';
import { logger } from '@/utils/logger';

interface AllowedIpState {
  ips: AllowedIp[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: AllowedIpState = {
  ips: [],
  loading: false,
  error: null,
  lastFetch: null,
};

export const fetchAllowedIps = createAsyncThunk(
  'allowedIps/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await allowedIpService.getAllAllowedIps();
    } catch (error: any) {
      logger.error('Error al obtener IPs permitidas', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener IPs permitidas');
    }
  }
);

export const createAllowedIp = createAsyncThunk(
  'allowedIps/create',
  async (data: CreateAllowedIpData, { rejectWithValue }) => {
    try {
      const ip = await allowedIpService.createAllowedIp(data);
      logger.userAction('IP permitida creada', { ip: ip.ip });
      return ip;
    } catch (error: any) {
      logger.error('Error al crear IP permitida', error);
      return rejectWithValue(error.response?.data?.message || 'Error al crear IP permitida');
    }
  }
);

export const deleteAllowedIp = createAsyncThunk(
  'allowedIps/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await allowedIpService.deleteAllowedIp(id);
      logger.userAction('IP permitida eliminada', { id });
      return id;
    } catch (error: any) {
      logger.error('Error al eliminar IP permitida', error);
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar IP permitida');
    }
  }
);

const allowedIpSlice = createSlice({
  name: 'allowedIps',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllowedIps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllowedIps.fulfilled, (state, action) => {
        state.loading = false;
        state.ips = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchAllowedIps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createAllowedIp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAllowedIp.fulfilled, (state, action) => {
        state.loading = false;
        state.ips.unshift(action.payload);
      })
      .addCase(createAllowedIp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteAllowedIp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllowedIp.fulfilled, (state, action) => {
        state.loading = false;
        state.ips = state.ips.filter((ip) => ip.id !== action.payload);
      })
      .addCase(deleteAllowedIp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = allowedIpSlice.actions;
export default allowedIpSlice.reducer;
