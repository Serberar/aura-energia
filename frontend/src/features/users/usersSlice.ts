/**
 * Redux Slice para gestión de usuarios
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import * as userService from './services/userService';
import type { UserData, CreateUserData, UpdateUserData } from './services/userService';
import { logger } from '../../utils/logger';

// Estado del módulo de usuarios
export interface UsersState {
  users: UserData[];
  selectedUser: UserData | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Estado inicial
const initialState: UsersState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// ================================
// ASYNC THUNKS
// ================================

/**
 * Obtener todos los usuarios
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const users = await userService.getAllUsers();
      return users;
    } catch (error: any) {
      logger.error('Error al obtener usuarios', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener usuarios');
    }
  }
);

/**
 * Crear un nuevo usuario
 */
export const createUser = createAsyncThunk(
  'users/create',
  async (data: CreateUserData, { rejectWithValue }) => {
    try {
      const user = await userService.createUser(data);
      logger.userAction('Usuario creado', { userId: user.id, username: user.username });
      return user;
    } catch (error: any) {
      logger.error('Error al crear usuario', error);
      return rejectWithValue(error.response?.data?.message || 'Error al crear usuario');
    }
  }
);

/**
 * Eliminar un usuario
 */
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (userId: string, { rejectWithValue }) => {
    try {
      await userService.deleteUser(userId);
      logger.userAction('Usuario eliminado', { userId });
      return userId;
    } catch (error: any) {
      logger.error('Error al eliminar usuario', error);
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar usuario');
    }
  }
);

/**
 * Actualizar un usuario
 */
export const updateUser = createAsyncThunk(
  'users/update',
  async ({ userId, data }: { userId: string; data: UpdateUserData }, { rejectWithValue }) => {
    try {
      const user = await userService.updateUser(userId, data);
      logger.userAction('Usuario actualizado', { userId, username: user.username });
      return user;
    } catch (error: any) {
      logger.error('Error al actualizar usuario', error);
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar usuario');
    }
  }
);

// ================================
// SLICE
// ================================

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Seleccionar un usuario
    selectUser: (state, action: PayloadAction<UserData | null>) => {
      state.selectedUser = action.payload;
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar usuario seleccionado
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },

    // Reset completo del estado
    resetUsersState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ================================
// EXPORTS
// ================================

export const { selectUser, clearError, clearSelectedUser, resetUsersState } =
  usersSlice.actions;

export default usersSlice.reducer;
