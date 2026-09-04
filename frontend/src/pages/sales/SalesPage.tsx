/**
 * Página de gestión de ventas
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Sale } from '@/types/sales';
import { SalesList, SaleDetail, SaleForm } from '@/features/sales';
import type { SaleFormPayload } from '@/features/sales/components/SaleForm';
import { useSales } from '@/features/sales';
import { sendContract } from '@/features/sales/services/signatureService';
import { changeSaleStatus } from '@/features/sales/services/saleService';
import { useSaleStatus } from '@/features/saleStatus';
import { useRole } from '@/hooks/useRole';
import { Button, useToast } from '@/design-system';
import styles from './SalesPage.module.scss';

type ViewMode = 'list' | 'detail' | 'create';

const SalesPage = () => {
  const { saleId } = useParams<{ saleId?: string }>();
  const navigate = useNavigate();
  const role = useRole();
  const { showSuccess, showError } = useToast();
  const isComercial = role === 'comercial';
  const [viewMode, setViewMode] = useState<ViewMode>(isComercial ? 'create' : 'list');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const { create, loading, error } = useSales();
  const { statuses } = useSaleStatus();

  // Sincronizar viewMode con la URL
  useEffect(() => {
    if (saleId === 'create') {
      setViewMode('create');
    } else if (saleId) {
      setSelectedSaleId(saleId);
      setViewMode('detail');
    } else if (!isComercial) {
      setViewMode('list');
    }
  }, [saleId, isComercial]);

  const handleViewSale = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    setViewMode('detail');
    navigate(`/sales/${sale.id}`);
  };

  /**
   * Paso 1 del flujo de firma:
   * Crea la venta (estado "Pendiente firma") y envía el contrato.
   * Devuelve saleId + providerDocumentId para que SaleForm maneje la espera.
   */
  const handleSendForSignature = async (
    payload: SaleFormPayload
  ): Promise<{ saleId: string; providerDocumentId?: string | null } | null> => {
    const { signerEmail, signerPhone, deliveryMethod, templateId, ...saleData } = payload;
    try {
      const sale = await create(saleData);
      if (!sale) return null;

      const sigReq = await sendContract(sale.id, signerEmail, templateId, deliveryMethod, signerPhone);
      return { saleId: sale.id, providerDocumentId: sigReq.providerDocumentId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar el contrato';
      showError(message);
      return null;
    }
  };

  /**
   * Paso 2 del flujo de firma:
   * El contrato está firmado → cambia el estado a "Firmada".
   * No navega: SaleForm pasa a fase 'completed' y ofrece botones al usuario.
   */
  const handleConfirmSale = async (pendingSaleId: string): Promise<void> => {
    try {
      const firmadaStatus =
        statuses.find((s) => s.name === 'Firmada') ??
        statuses.find((s) => s.isFinal && !s.isCancelled);

      if (!firmadaStatus) {
        showError('No se encontró el estado "Firmada". Créalo en el panel de administración.');
        return;
      }

      await changeSaleStatus(pendingSaleId, { statusId: firmadaStatus.id });
      showSuccess('¡Venta creada y contrato firmado!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar la venta';
      showError(message);
      throw err; // re-throw para que SaleForm no cambie de fase si falló
    }
  };

  const handleSaveWithoutSignature = async (payload: SaleFormPayload): Promise<void> => {
    const { sendContract: _, signerEmail: __, ...saleData } = payload;
    try {
      const sale = await create(saleData);
      showSuccess('Venta guardada correctamente');
      if (isComercial) {
        setViewMode('create');
      } else if (sale) {
        setSelectedSaleId(sale.id);
        setViewMode('detail');
        navigate(`/sales/${sale.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la venta';
      showError(message);
    }
  };

  const handleViewSaleById = (saleId: string) => {
    setSelectedSaleId(saleId);
    setViewMode('detail');
    navigate(`/sales/${saleId}`);
  };

  const handleBack = () => {
    if (isComercial) {
      navigate('/dashboard');
    } else {
      setViewMode('list');
      setSelectedSaleId(null);
      navigate('/sales');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {viewMode !== 'list' && !isComercial && (
            <Button variant="secondary" onClick={handleBack}>
              ← Volver
            </Button>
          )}
          <h1 className={styles.title}>
            {viewMode === 'list' && 'Gestión de Ventas'}
            {viewMode === 'detail' && 'Detalle de Venta'}
            {viewMode === 'create' && (isComercial ? 'Crear Venta' : 'Nueva Venta')}
          </h1>
        </div>
        {viewMode === 'list' && !isComercial && (
          <Button variant="primary" onClick={() => {
            setViewMode('create');
            navigate('/sales/create');
          }}>
            + Nueva Venta
          </Button>
        )}
      </div>

      {/* Contenido */}
      <div className={styles.content}>
        {viewMode === 'list' && (
          <SalesList onViewSale={handleViewSale} showFilters={true} />
        )}

        {viewMode === 'detail' && selectedSaleId && (
          <SaleDetail saleId={selectedSaleId} onClose={handleBack} />
        )}

        {viewMode === 'create' && (
          <SaleForm
            onSendForSignature={handleSendForSignature}
            onConfirmSale={handleConfirmSale}
            onSaveWithoutSignature={handleSaveWithoutSignature}
            onViewSale={handleViewSaleById}
            onCancel={handleBack}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default SalesPage;
