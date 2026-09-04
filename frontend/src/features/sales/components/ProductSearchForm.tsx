/**
 * ProductSearchForm - Componente para seleccionar productos del catálogo
 *
 * Permite:
 * - Ver todos los productos activos del catálogo
 * - Seleccionar múltiples productos
 * - Editar cantidad y precio para cada producto (solo para esta venta)
 * - Los cambios de precio NO se guardan en el catálogo, son solo para esta venta
 */

import { useState, useEffect } from 'react';
import type { Product, CreateSaleItemData } from '@/types/sales';
import { getAllProducts } from '@/features/products/services/productService';
import Button from '@/design-system/components/Button';
import styles from './ProductSearchForm.module.css';

// Interfaz para productos seleccionados con datos editables
export interface SelectedProductData {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number; // Precio original del catálogo
  tipo?: string | null;
  periodo?: string | null;
  precioBase?: number | null;
  precioConsumo?: number | null;
  unidadConsumo?: string | null;
}

interface ProductSearchFormProps {
  onProductsSelected: (items: CreateSaleItemData[]) => void;
  initialItems?: CreateSaleItemData[];
}

const ProductSearchForm = ({ onProductsSelected, initialItems = [] }: ProductSearchFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogo completo de productos activos
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Productos seleccionados para la venta
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductData[]>([]);

  // Cargar catálogo al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  // Inicializar selección previa si existen datos
  useEffect(() => {
    if (initialItems.length > 0) {
      const initialSelected: SelectedProductData[] = initialItems.map((item) => ({
        productId: item.productId || '',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.price,
      }));
      setSelectedProducts(initialSelected);
    }
  }, [initialItems]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const products = await getAllProducts();
      const activeProducts = products.filter((p) => p.active);
      setAllProducts(activeProducts);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el catálogo de productos');
    } finally {
      setIsLoading(false);
    }
  };

  // Añadir producto o incrementar cantidad si ya existe
  const handleAddProduct = (product: Product) => {
    const alreadySelected = selectedProducts.find((p) => p.productId === product.id);

    let updated: SelectedProductData[];

    if (alreadySelected) {
      // Si ya está seleccionado, incrementar cantidad
      updated = selectedProducts.map((p) =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
    } else {
      // Si no está, añadirlo con cantidad 1
      const newProduct: SelectedProductData = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        originalPrice: product.price,
        tipo: product.tipo ?? 'unico',
        periodo: product.periodo ?? null,
        precioBase: product.precioBase ?? null,
        precioConsumo: product.precioConsumo ?? null,
        unidadConsumo: product.unidadConsumo ?? null,
      };
      updated = [...selectedProducts, newProduct];
    }

    setSelectedProducts(updated);
    notifyParent(updated);
  };

  // Eliminar producto
  const handleRemoveProduct = (productId: string) => {
    const updated = selectedProducts.filter((p) => p.productId !== productId);
    setSelectedProducts(updated);
    notifyParent(updated);
  };

  // Cambiar cantidad
  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    const updated = selectedProducts.map((p) =>
      p.productId === productId ? { ...p, quantity } : p
    );

    setSelectedProducts(updated);
    notifyParent(updated);
  };

  // Notificar al padre
  const notifyParent = (products: SelectedProductData[]) => {
    const items: CreateSaleItemData[] = products.map((p) => ({
      productId: p.productId,
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      tipo: p.tipo,
      periodo: p.periodo,
      precioBase: p.precioBase,
      precioConsumo: p.precioConsumo,
      unidadConsumo: p.unidadConsumo,
    }));
    onProductsSelected(items);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Productos de la Venta</h3>

      {/* Error al cargar catálogo */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <Button onClick={loadProducts} variant="secondary" size="sm">
            Reintentar
          </Button>
        </div>
      )}

      {/* Catálogo */}
      {isLoading ? (
        <div className={styles.loading}>Cargando catálogo...</div>
      ) : (
        <div className={styles.catalogSection}>
          <h4 className={styles.sectionTitle}>
            Catálogo de productos ({allProducts.length})
          </h4>

          <div className={styles.productList}>
            {allProducts.length === 0 ? (
              <p className={styles.emptyMessage}>No hay productos activos en el catálogo.</p>
            ) : (
              allProducts.map((product) => (
                <div key={product.id} className={styles.productItem}>
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>{product.name}</div>
                    {product.sku && <div className={styles.productSku}>SKU: {product.sku}</div>}
                    {product.description && (
                      <div className={styles.productDescription}>{product.description}</div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleAddProduct(product)}
                    variant={selectedProducts.find((p) => p.productId === product.id) ? 'secondary' : 'primary'}
                    size="sm"
                  >
                    {(() => {
                      const selected = selectedProducts.find((p) => p.productId === product.id);
                      return selected ? `+1 (${selected.quantity})` : 'Añadir';
                    })()}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Productos seleccionados */}
      <div className={styles.selectedSection}>
        <h4 className={styles.sectionTitle}>
          Productos seleccionados ({selectedProducts.length})
        </h4>

        {selectedProducts.length === 0 ? (
          <p className={styles.emptyMessage}>No hay productos seleccionados.</p>
        ) : (
          <>
            <div className={styles.selectedList}>
              {selectedProducts.map((product) => (
                <div key={product.productId} className={styles.selectedItem}>
                  <div className={styles.selectedItemHeader}>
                    <div className={styles.selectedItemName}>
                      {product.name}
                    </div>
                    <div className={styles.selectedItemActions}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={product.quantity}
                        onChange={(e) =>
                          handleQuantityChange(product.productId, parseInt(e.target.value) || 1)
                        }
                        className={styles.quantityInput}
                        title="Cantidad"
                      />
                      <Button
                        onClick={() => handleRemoveProduct(product.productId)}
                        variant="danger"
                        size="sm"
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductSearchForm;
