/**
 * Gestor de items de una venta con CRUD
 */

import { useState } from 'react';
import type { SaleItem, CreateSaleItemData, UpdateSaleItemData } from '@/types/sales';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import styles from './SaleItemsManager.module.scss';

interface SaleItemsManagerProps {
  items: SaleItem[];
  onAddItem: (item: CreateSaleItemData) => void | Promise<void>;
  onUpdateItem: (itemId: string, data: UpdateSaleItemData) => void | Promise<void>;
  onRemoveItem: (itemId: string) => void | Promise<void>;
  loading?: boolean;
  readonly?: boolean;
}

const SaleItemsManager = ({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  readonly = false,
}: SaleItemsManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    quantity: number;
    price: number;
  }>({ name: '', quantity: 1, price: 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    }));
  };

  const handleAddItem = async () => {
    await onAddItem({
      productId: '',
      name: formData.name,
      quantity: formData.quantity,
      price: formData.price,
    });

    setIsAdding(false);
    setFormData({ name: '', quantity: 1, price: 0 });
  };

  const handleStartEdit = (item: SaleItem) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.nameSnapshot,
      quantity: item.quantity,
      price: item.unitPrice,
    });
  };

  const handleUpdateItem = async (itemId: string) => {
    await onUpdateItem(itemId, {
      quantity: formData.quantity,
      unitPrice: formData.price,
      finalPrice: formData.price * formData.quantity,
    });

    setEditingItemId(null);
    setFormData({ name: '', quantity: 1, price: 0 });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Productos ({items.length})</h3>

        {!readonly && !isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
            + Añadir Producto
          </Button>
        )}
      </div>

      {/* Añadir item */}
      {isAdding && (
        <div className={styles.form}>
          <Input label="Nombre" name="name" value={formData.name} onChange={handleInputChange} />
          <Input label="Cantidad" type="number" name="quantity" value={formData.quantity} onChange={handleInputChange}/>
          <Input label="Precio" type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange}/>

          <div className={styles.formActions}>
            <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button size="sm" variant="primary" onClick={handleAddItem}>Añadir</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          {editingItemId === item.id ? (
            <>
              <Input name="name" value={formData.name} onChange={handleInputChange} />
              <Input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} />
              <Input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} />

              <div className={styles.itemActions}>
                <Button size="sm" variant="secondary" onClick={() => setEditingItemId(null)}>Cancelar</Button>
                <Button size="sm" variant="primary" onClick={() => handleUpdateItem(item.id)}>Guardar</Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.itemInfo}>
                <strong>{item.nameSnapshot}</strong>
                <span>Cantidad: {item.quantity}</span>
                {/* <span>Precio: {item.unitPrice}€</span>
                <span>Subtotal: {item.finalPrice}€</span> */}
              </div>

              {!readonly && (
                <div className={styles.itemActions}>
                  <Button size="sm" variant="secondary" onClick={() => handleStartEdit(item)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => onRemoveItem(item.id)}>Eliminar</Button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SaleItemsManager;
