/**
 * Redux Slice para gestión de productos
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type {
  Product,
  ProductsState,
  CreateProductData,
  UpdateProductData,
} from '../../types/sales';

import * as productService from './services/productService';
import { logger } from '../../utils/logger';

// Estado inicial
const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// ================================
// ASYNC THUNKS
// ================================

/**
 * Obtener todos los productos
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const products = await productService.getAllProducts();
      return products;
    } catch (error: any) {
      logger.error('Error al obtener productos', error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener productos');
    }
  }
);

/**
 * Obtener un producto por ID
 */
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await productService.getProductById(id);
      return product;
    } catch (error: any) {
      logger.error(`Error al obtener producto ${id}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al obtener producto');
    }
  }
);

/**
 * Crear un nuevo producto
 */
export const createProduct = createAsyncThunk(
  'products/create',
  async (data: CreateProductData, { rejectWithValue }) => {
    try {
      const product = await productService.createProduct(data);
      logger.userAction('Producto creado', { productId: product.id, name: product.name });
      return product;
    } catch (error: any) {
      logger.error('Error al crear producto', error);
      return rejectWithValue(error.response?.data?.message || 'Error al crear producto');
    }
  }
);

/**
 * Actualizar un producto
 */
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }: { id: string; data: UpdateProductData }, { rejectWithValue }) => {
    try {
      const product = await productService.updateProduct(id, data);
      logger.userAction('Producto actualizado', { productId: product.id, name: product.name });
      return product;
    } catch (error: any) {
      logger.error(`Error al actualizar producto ${id}`, error);
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar producto');
    }
  }
);

/**
 * Activar/Desactivar producto
 */
export const toggleProductActive = createAsyncThunk(
  'products/toggleActive',
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await productService.toggleProductActive(id);
      logger.userAction('Estado de producto cambiado', {
        productId: product.id,
        active: product.active,
      });
      return product;
    } catch (error: any) {
      logger.error(`Error al cambiar estado del producto ${id}`, error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al cambiar estado del producto'
      );
    }
  }
);

// ================================
// SLICE
// ================================

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Seleccionar un producto
    selectProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar producto seleccionado
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },

    // Reset completo del estado
    resetProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch all products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create product
    builder
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle product active
    builder
      .addCase(toggleProductActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleProductActive.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex((p: Product) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
      })
      .addCase(toggleProductActive.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ================================
// EXPORTS
// ================================

export const { selectProduct, clearError, clearSelectedProduct, resetProductsState } =
  productsSlice.actions;

export default productsSlice.reducer;
