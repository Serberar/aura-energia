/**
 * Página de gestión de estados de venta (solo administradores)
 */

import { useState } from 'react';
import { logger } from '@/utils/logger';
import type { SaleStatus, CreateSaleStatusData } from '@/types/sales';
import {
  SaleStatusList,
  SaleStatusForm,
  SaleStatusReorder,
  useSaleStatus,
} from '@/features/saleStatus';
import Button from '@/design-system/components/Button';
import styles from './SaleStatusPage.module.scss';

type ViewMode = 'list' | 'create' | 'edit' | 'reorder';

const SaleStatusPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | null>(null);
  const {
    statuses,
    loading,
    error,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
  } = useSaleStatus();

  const handleCreate = async (data: CreateSaleStatusData) => {
    try {
      await createStatus(data);
      setViewMode('list');
    } catch (err) {
      logger.error('Error al crear estado', err as Error);
    }
  };

  const handleUpdate = async (data: CreateSaleStatusData) => {
    if (!selectedStatus) return;
    try {
      await updateStatus(selectedStatus.id, data);
      setViewMode('list');
      setSelectedStatus(null);
    } catch (err) {
      logger.error('Error al actualizar estado', err as Error);
    }
  };

  const handleDelete = async (status: SaleStatus) => {
    if (window.confirm(`¿Eliminar el estado "${status.name}"?`)) {
      try {
        await deleteStatus(status.id);
      } catch (err) {
        logger.error('Error al eliminar estado', err as Error);
      }
    }
  };

  const handleEdit = (status: SaleStatus) => {
    setSelectedStatus(status);
    setViewMode('edit');
  };

  const handleReorderSave = async (reorderedData: any) => {
    try {
      await reorderStatuses({ statuses: reorderedData });
      setViewMode('list');
    } catch (err) {
      logger.error('Error al reordenar estados', err as Error);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedStatus(null);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {viewMode !== 'list' && (
            <Button variant="secondary" onClick={handleCancel}>
              ← Volver
            </Button>
          )}
          <h1 className={styles.title}>
            {viewMode === 'list' && 'Gestión de Estados de Venta'}
            {viewMode === 'create' && 'Nuevo Estado'}
            {viewMode === 'edit' && 'Editar Estado'}
            {viewMode === 'reorder' && 'Reordenar Estados'}
          </h1>
        </div>
        {viewMode === 'list' && (
          <Button variant="primary" onClick={() => setViewMode('create')}>
            + Nuevo Estado
          </Button>
        )}
      </div>

      {/* Contenido */}
      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {viewMode === 'list' && (
          <SaleStatusList
            statuses={statuses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={() => setViewMode('reorder')}
            loading={loading}
          />
        )}

        {viewMode === 'create' && (
          <SaleStatusForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        )}

        {viewMode === 'edit' && selectedStatus && (
          <SaleStatusForm
            status={selectedStatus}
            onSubmit={handleUpdate}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        )}

        {viewMode === 'reorder' && (
          <SaleStatusReorder
            statuses={statuses}
            onSave={handleReorderSave}
            onCancel={handleCancel}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default SaleStatusPage;
