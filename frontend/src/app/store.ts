import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import skoreReducer from "../features/1skore/skoreSlice";
import productsReducer from '../features/products/productsSlice';
import saleStatusReducer from '../features/saleStatus/saleStatusSlice';
import salesReducer from '../features/sales/salesSlice';
import clientsReducer from '../features/clientes/clientsSlice';
import usersReducer from '../features/users/usersSlice';
import allowedIpsReducer from '../features/allowedIps/allowedIpSlice';
import callsReducer from '../features/calls/callsSlice';
import supervisorReducer from '../features/calls/supervisorSlice';
import appSettingsReducer from '../features/settings/settingsSlice';
export const store = configureStore({
  reducer: {
   auth: authReducer,
   skore: skoreReducer,
   products: productsReducer,
   saleStatus: saleStatusReducer,
   sales: salesReducer,
   clients: clientsReducer,
   users: usersReducer,
   allowedIps: allowedIpsReducer,
   calls: callsReducer,
   supervisor: supervisorReducer,
   appSettings: appSettingsReducer,
  },
});

// Tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
