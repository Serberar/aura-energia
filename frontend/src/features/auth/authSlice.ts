import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { logger } from '@/utils/logger';

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  id: string | null;
  user: UserInfo | null;
  accessToken: string | null;
  role: string | null;
  isLoggedIn: boolean;
}

interface TokenPayload {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  exp: number; // fecha de expiración en segundos
}

// Cargamos token desde localStorage
const storedAccessToken =
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

// Inicializamos estado a partir del token (si existe)
let initialUser: UserInfo | null = null;
let initialRole: string | null = null;
let initialId: string | null = null;
let initialToken: string | null = storedAccessToken;

if (storedAccessToken) {
  try {
    const decoded = jwtDecode<TokenPayload>(storedAccessToken);

    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      localStorage.removeItem('accessToken');
      initialToken = null;
    } else {
      initialUser = {
        id: decoded.id,
        firstName: decoded.firstName,
        lastName: decoded.lastName || '',
      };
      initialRole = decoded.role;
      initialId = decoded.id;
    }
  } catch (err) {
    logger.error('Error decodificando token', err as Error);
    localStorage.removeItem('accessToken');
    initialToken = null;
  }
}

const initialState: AuthState = {
  id: initialId,
  user: initialUser,
  accessToken: initialToken,
  role: initialRole,
  isLoggedIn: Boolean(initialUser && initialToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ id: string; firstName: string; lastName: string; accessToken: string; role: string }>
    ) => {
      state.id = action.payload.id;
      state.user = {
        id: action.payload.id,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
      };
      state.role = action.payload.role;
      state.accessToken = action.payload.accessToken;
      state.isLoggedIn = true;

      try {
        localStorage.setItem('accessToken', state.accessToken);
      } catch (storageError) {
        logger.error('Error al guardar token en localStorage', storageError as Error);
      }
    },

    logout: (state) => {
      state.id = null;
      state.user = null;
      state.accessToken = null;
      state.role = null;
      state.isLoggedIn = false;
      try {
        localStorage.removeItem('accessToken');
      } catch (storageError) {
        logger.error('Error al eliminar token de localStorage', storageError as Error);
      }
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      try {
        localStorage.setItem('accessToken', action.payload);
      } catch (storageError) {
        logger.error('Error al guardar token en localStorage', storageError as Error);
      }

      // Actualizamos datos del usuario desde el token
      try {
        const decoded = jwtDecode<TokenPayload>(action.payload);
        state.id = decoded.id;
        state.user = {
          id: decoded.id,
          firstName: decoded.firstName,
          lastName: decoded.lastName || '',
        };
        state.role = decoded.role;
        state.isLoggedIn = true;
      } catch (err) {
        logger.error('Error decodificando token en setAccessToken', err as Error);
        state.id = null;
        state.user = null;
        state.role = null;
        state.isLoggedIn = false;
      }
    },
  },
});

export const { login, logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;