import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';

import { ProductList } from '@/features/products';
import ProductForm from "@/features/products/components/ProductForm";
import Button from '@/design-system/components/Button';

import styles from './ProductsPage.module.scss';

import { createProduct, updateProduct } from "@/features/products/productsSlice";
import type { CreateProductData, Product, UpdateProductData } from "@/types/sales";

const ProductsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const dispatch = useAppDispatch();

  const loading = useAppSelector((state) => state.products.loading);

  // Crear producto
  const handleCreateSubmit = async (data: CreateProductData) => {
    await dispatch(createProduct(data));
    setShowCreateForm(false);
  };

  // Editar producto
  const handleEditSubmit = async (data: UpdateProductData) => {
    if (!editingProduct) return;

    await dispatch(updateProduct({ id: editingProduct.id, data }));
    setEditingProduct(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Productos</h1>

        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
        >
          + Nuevo Producto
        </Button>
      </div>

      <div className={styles.content}>
        <ProductList
          onEdit={(product) => setEditingProduct(product)}
        />
      </div>

      {/* MODAL CREAR */}
      {showCreateForm && (
        <div className={styles.modal}>
          <ProductForm
            mode="create"
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateForm(false)}
            isLoading={loading}
          />
        </div>
      )}

      {/* MODAL EDITAR */}
      {editingProduct && (
        <div className={styles.modal}>
          <ProductForm
            mode="edit"
            product={editingProduct}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingProduct(null)}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
