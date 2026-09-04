import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { login1Skore, search1Skore } from "./services/skoreService";
import type { SkoreSearchResponse } from "../../types";
import { logger } from "../../utils/logger";

interface SkoreState {
  cookie: string | null;
  loading: boolean;
  result: SkoreSearchResponse | null;
  error: string | null;
}

const initialState: SkoreState = {
  cookie: null,
  loading: false,
  result: null,
  error: null,
};

// LOGIN: obtiene y guarda la cookie de sesión
export const doLogin1Skore = createAsyncThunk("skore/login", async () => {
  const { cookie } = await login1Skore();
  return cookie;
});

// BÚSQUEDA GENÉRICA: detecta si es DNI o teléfono
export const doSearch1Skore = createAsyncThunk(
  "skore/search",
  async (input: string, { getState, dispatch }) => {
    const state = getState() as { skore: SkoreState };
    let cookie = state.skore.cookie;

    // Si no hay cookie, hacemos login primero
    if (!cookie) {
      const loginResult = await dispatch(doLogin1Skore());
      cookie = (loginResult as { payload: string }).payload;
    }

    // Detectar tipo (DNI o teléfono)
    const isPhone = /^[0-9]{9}$/.test(input); // 9 dígitos
    const type = isPhone ? "phone" : "dni";

    const result = await search1Skore(type, input, cookie!);

    // Limpieza y parseo del campo msg si viene como texto fragmentado
    let parsedResult = result;
    if (result?.msg && Array.isArray(result.msg)) {
      try {
        const joined = result.msg.join("\n");
        parsedResult = JSON.parse(joined) as SkoreSearchResponse;
      } catch (err) {
        logger.error("Error al parsear respuesta 1Skore", err as Error);
      }
    }

    return parsedResult;
  }
);

const skoreSlice = createSlice({
  name: "skore",
  initialState,
  reducers: {
    clearSkoreResult: (state) => {
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(doLogin1Skore.fulfilled, (state, action) => {
        state.cookie = action.payload;
      })
      // SEARCH
      .addCase(doSearch1Skore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(doSearch1Skore.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(doSearch1Skore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error al buscar en 1Skore";
      });
  },
});

export const { clearSkoreResult } = skoreSlice.actions;
export default skoreSlice.reducer;
