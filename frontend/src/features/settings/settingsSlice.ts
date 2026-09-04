import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSetting, setSetting } from './services/settingsService';

interface AppSettingsState {
  callsModuleEnabled:    boolean;
  crmModuleEnabled:      boolean;
  firmaModuleEnabled:    boolean;
  crmOnlineSearchEnabled: boolean;
  loaded:                boolean;
}

const initialState: AppSettingsState = {
  callsModuleEnabled:    true,
  crmModuleEnabled:      true,
  firmaModuleEnabled:    true,
  crmOnlineSearchEnabled: true,
  loaded:                false,
};

// Carga los 3 módulos en paralelo al iniciar sesión
export const loadModuleSettings = createAsyncThunk(
  'appSettings/loadAll',
  async () => {
    const [calls, crm, firma, crmSearch] = await Promise.allSettled([
      getSetting('calls_module_enabled'),
      getSetting('crm_module_enabled'),
      getSetting('firma_module_enabled'),
      getSetting('crm_online_search_enabled'),
    ]);
    return {
      callsEnabled:     calls.status     === 'fulfilled' ? calls.value.value     : true,
      crmEnabled:       crm.status       === 'fulfilled' ? crm.value.value       : true,
      firmaEnabled:     firma.status     === 'fulfilled' ? firma.value.value     : true,
      crmSearchEnabled: crmSearch.status === 'fulfilled' ? crmSearch.value.value : true,
    };
  },
);

// Acción genérica para guardar cualquier toggle de módulo
export const saveModuleSetting = createAsyncThunk(
  'appSettings/save',
  async ({ key, value }: { key: string; value: boolean }) => {
    await setSetting(key, value);
    return { key, value };
  },
);

// Alias mantenido por compatibilidad con código existente
export const loadCallsSetting  = loadModuleSettings;
export const saveCallsSetting  = (value: boolean) =>
  saveModuleSetting({ key: 'calls_module_enabled', value });

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadModuleSettings.fulfilled, (state, action) => {
        state.callsModuleEnabled    = action.payload.callsEnabled;
        state.crmModuleEnabled      = action.payload.crmEnabled;
        state.firmaModuleEnabled    = action.payload.firmaEnabled;
        state.crmOnlineSearchEnabled = action.payload.crmSearchEnabled;
        state.loaded                = true;
      })
      .addCase(loadModuleSettings.rejected, (state) => {
        state.loaded = true; // defaults: todo activado
      })
      .addCase(saveModuleSetting.fulfilled, (state, action) => {
        const { key, value } = action.payload;
        if (key === 'calls_module_enabled')      state.callsModuleEnabled    = value;
        if (key === 'crm_module_enabled')        state.crmModuleEnabled      = value;
        if (key === 'firma_module_enabled')      state.firmaModuleEnabled    = value;
        if (key === 'crm_online_search_enabled') state.crmOnlineSearchEnabled = value;
      });
  },
});

export default appSettingsSlice.reducer;
