/* src/features/sales/components/SaleDetail.tsx */

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { initiateCall } from "@/features/calls/callsSlice";
import type { Sale } from "@/types/sales";
import { SaleStatusBadge, useSaleStatus } from "@/features/saleStatus";
import { useSales, useSaleItems, useSaleStatusChange } from "../hooks";
import { updateSaleClient } from "../services/saleService";
import { sendContract, resendContract, simulateSign, downloadEvidence, fetchEvidenceFromProvider } from "../services/signatureService";
import SaleItemsManager from "./SaleItemsManager";
import SaleStatusChanger from "./SaleStatusChanger";
import SaleRecordings from "./SaleRecordings";
import ContractPreview from "./ContractPreview";
import type { ClientFormData } from "./ClientSearchForm";
import type { CreateSaleItemData } from "@/types/sales";
import { Button, Input, Modal, useToast } from "@/design-system";
import styles from "./SaleDetail.module.scss";

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

interface SaleDetailProps {
  saleId: string;
  onClose?: () => void;
  onEdit?: (sale: Sale) => void;
  readonly?: boolean;
}

const SaleDetail = ({
  saleId,
  onClose,
  onEdit,
  readonly = false,
}: SaleDetailProps) => {
  const dispatch = useAppDispatch();
  const callsEnabled = useAppSelector((s) => s.appSettings.callsModuleEnabled);
  const { loadSaleById, selectedSale, loading, error } = useSales();
  const { addItem, updateItem, removeItem } = useSaleItems(saleId);
  const { changeStatus } = useSaleStatusChange(saleId);
  const { statuses } = useSaleStatus();
  const { showSuccess, showError } = useToast();

  // Estado para edición del cliente
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);
  const [editedComercial, setEditedComercial] = useState<string>('');

  // Estado para edición del comercial (independiente)
  const [isEditingComercial, setIsEditingComercial] = useState(false);
  const [tempComercial, setTempComercial] = useState<string>('');

  // Estado para envío de contrato desde el detalle
  const [signerEmail, setSignerEmail] = useState('');
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [contractPreviewOpen, setContractPreviewOpen] = useState(false);

  useEffect(() => {
    loadSaleById(saleId);
  }, [saleId, loadSaleById]);

  // Inicializar datos del cliente y comercial cuando se carga la venta
  useEffect(() => {
    if (selectedSale?.client) {
      setEditedClient({ ...selectedSale.client });
    }
    setEditedComercial(selectedSale?.comercial || '');
    setSignerEmail(
      selectedSale?.signatureRequest?.signerEmail ||
      selectedSale?.client?.email ||
      ''
    );
  }, [selectedSale]);

  const handleClientFieldChange = (field: string, value: any) => {
    setEditedClient((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleClientAddressFieldChange = (field: string, value: any) => {
    setEditedClient((prev: any) => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSaveClient = async () => {
    try {
      await updateSaleClient(saleId, editedClient, editedComercial || undefined);
      setIsEditingClient(false);
      showSuccess('Datos del cliente actualizados');
      // Recargar la venta para obtener los datos actualizados
      await loadSaleById(saleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar los datos del cliente';
      showError(message);
    }
  };

  const handleCancelEditClient = () => {
    setEditedClient(selectedSale?.client ? { ...selectedSale.client } : null);
    setEditedComercial(selectedSale?.comercial || '');
    setIsEditingClient(false);
  };

  // Funciones para edición del comercial (independiente)
  const handleStartEditComercial = () => {
    setTempComercial(selectedSale?.comercial || '');
    setIsEditingComercial(true);
  };

  const handleSaveComercial = async () => {
    try {
      await updateSaleClient(saleId, selectedSale?.client, tempComercial || undefined);
      setIsEditingComercial(false);
      showSuccess('Comercial actualizado');
      await loadSaleById(saleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el comercial';
      showError(message);
    }
  };

  const handleCancelEditComercial = () => {
    setTempComercial(selectedSale?.comercial || '');
    setIsEditingComercial(false);
  };

  const handleSendContractFromDetail = async () => {
    if (!signerEmail.trim()) return;
    setIsSendingContract(true);
    try {
      await sendContract(saleId, signerEmail.trim());
      showSuccess('Contrato enviado correctamente');
      await loadSaleById(saleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar el contrato';
      showError(message);
    } finally {
      setIsSendingContract(false);
    }
  };

  const handleResendContractFromDetail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await resendContract(saleId, signerEmail.trim() || undefined);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      await loadSaleById(saleId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reenviar el contrato';
      showError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleSimulateSignFromDetail = async () => {
    const docId = selectedSale?.signatureRequest?.providerDocumentId;
    if (!docId) return;
    setIsSendingContract(true);
    try {
      await simulateSign(docId);
      await loadSaleById(saleId);
      showSuccess('Firma simulada correctamente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al simular la firma';
      showError(message);
    } finally {
      setIsSendingContract(false);
    }
  };

  if (loading && !selectedSale) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando venta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        {onClose && <Button onClick={onClose}>Cerrar</Button>}
      </div>
    );
  }

  if (!selectedSale) {
    return (
      <div className={styles.error}>
        <p>Venta no encontrada</p>
        {onClose && <Button onClick={onClose}>Cerrar</Button>}
      </div>
    );
  }

  const sale = selectedSale;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const SIGNATURE_ACTIONS = ['signature_sent', 'signature_resent', 'signature_completed', 'signature_rejected', 'signature_cancelled', 'evidence_downloaded'];

  const signatureHistory = [...(sale.histories ?? [])]
    .filter((h) => SIGNATURE_ACTIONS.includes(h.action))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const statusHistory = [...(sale.histories ?? [])]
    .filter((h) => h.action === 'change_status')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getSignatureHistoryIcon = (action: string) => {
    switch (action) {
      case 'signature_sent':      return '📧';
      case 'signature_resent':    return '🔄';
      case 'signature_completed': return '✅';
      case 'signature_rejected':  return '❌';
      case 'signature_cancelled': return '🚫';
      case 'evidence_downloaded': return '📥';
      default: return '📋';
    }
  };

  const getSignatureHistoryLabel = (action: string, payload: any) => {
    const email = payload?.signerEmail;
    switch (action) {
      case 'signature_sent':
        return `Contrato enviado${email ? ` a ${email}` : ''}`;
      case 'signature_resent':
        return `Contrato reenviado${email ? ` a ${email}` : ''}`;
      case 'signature_completed':
        return 'Contrato firmado';
      case 'signature_rejected':
        return `Contrato rechazado${payload?.rejectionReason ? `: ${payload.rejectionReason}` : ''}`;
      case 'signature_cancelled':
        return 'Solicitud de firma cancelada';
      case 'evidence_downloaded':
        return 'Evidencia de firma descargada y almacenada';
      default:
        return action;
    }
  };

  return (
    <>
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Venta #{sale.id.substring(0, 8)}</h2>

          {sale.status && (
            <SaleStatusBadge
              name={sale.status.name}
              color={sale.status.color}
              isFinal={sale.status.isFinal}
              size="md"
            />
          )}
        </div>

        <div className={styles.headerActions}>
          {!readonly && onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(sale)}>
              Editar
            </Button>
          )}
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>

      {/* INFO GENERAL */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información General</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>ID Completo:</span>
            <span className={styles.infoValue}>{sale.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Fecha de Creación:</span>
            <span className={styles.infoValue}>
              {formatDate(sale.createdAt)}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Última Actualización:</span>
            <span className={styles.infoValue}>
              {formatDate(sale.updatedAt)}
            </span>
          </div>
          {sale.closedAt && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha de Cierre:</span>
              <span className={styles.infoValue}>
                {formatDate(sale.closedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CLIENTE */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Cliente</h3>
          {!readonly && sale.client && !isEditingClient && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditingClient(true)}
            >
              Editar Cliente
            </Button>
          )}
        </div>

        {sale.client && editedClient ? (
          isEditingClient ? (
            // MODO EDICIÓN
            <div className={styles.clientEditForm}>
              <div className={styles.formRow}>
                <Input
                  label="Nombre"
                  value={editedClient.firstName || ''}
                  onChange={(e) => handleClientFieldChange('firstName', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Apellidos"
                  value={editedClient.lastName || ''}
                  onChange={(e) => handleClientFieldChange('lastName', e.target.value)}
                  fullWidth
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="DNI/NIF"
                  value={editedClient.dni || ''}
                  onChange={(e) => handleClientFieldChange('dni', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Email"
                  type="email"
                  value={editedClient.email || ''}
                  onChange={(e) => handleClientFieldChange('email', e.target.value)}
                  fullWidth
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="Fecha de Nacimiento"
                  type="date"
                  value={editedClient.birthday || ''}
                  onChange={(e) => handleClientFieldChange('birthday', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Teléfono"
                  value={editedClient.phones?.[0] || ''}
                  onChange={(e) => handleClientFieldChange('phones', [e.target.value])}
                  fullWidth
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="Cuenta Bancaria"
                  value={editedClient.bankAccounts?.[0] || ''}
                  onChange={(e) => handleClientFieldChange('bankAccounts', [e.target.value])}
                  fullWidth
                />
              </div>

              <h4 className={styles.subsectionTitle}>Dirección de Suministro</h4>

              <Input
                label="Dirección"
                value={editedClient.address?.address || ''}
                onChange={(e) => handleClientAddressFieldChange('address', e.target.value)}
                fullWidth
              />

              <div className={styles.formRow}>
                <Input
                  label="CUPS Luz"
                  value={editedClient.address?.cupsLuz || ''}
                  onChange={(e) => handleClientAddressFieldChange('cupsLuz', e.target.value)}
                  fullWidth
                />
                <Input
                  label="CUPS Gas"
                  value={editedClient.address?.cupsGas || ''}
                  onChange={(e) => handleClientAddressFieldChange('cupsGas', e.target.value)}
                  fullWidth
                />
              </div>

              <h4 className={styles.subsectionTitle}>Comercial</h4>

              <Input
                label="Nombre del comercial"
                value={editedComercial}
                onChange={(e) => setEditedComercial(e.target.value)}
                placeholder="Nombre del comercial que realiza la venta"
                fullWidth
              />

              <div className={styles.formActions}>
                <Button variant="secondary" onClick={handleCancelEditClient}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleSaveClient}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          ) : (
            // MODO VISTA
            <div className={styles.clientDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ID Cliente:</span>
                <span className={styles.detailValue}>{sale.clientId}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nombre Completo:</span>
                <span className={styles.detailValue}>
                  {sale.client.firstName} {sale.client.lastName}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>DNI/NIF:</span>
                <span className={styles.detailValue}>{sale.client.dni}</span>
              </div>

              {sale.client.email && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{sale.client.email}</span>
                </div>
              )}

              {sale.client.birthday && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha de Nacimiento:</span>
                  <span className={styles.detailValue}>
                    {new Date(sale.client.birthday).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}

              {sale.client.phones && sale.client.phones.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Teléfono:</span>
                  <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {sale.client.phones.map((phone, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {phone}
                        {callsEnabled && (
                          <button
                            title={`Llamar a ${phone}`}
                            onClick={() => dispatch(initiateCall({ clientPhone: phone, saleId: sale.id, clientId: sale.clientId }))}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            📞
                          </button>
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              )}

              {sale.client.bankAccounts && sale.client.bankAccounts.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Cuenta Bancaria:</span>
                  <span className={styles.detailValue}>
                    {sale.client.bankAccounts.join(', ')}
                  </span>
                </div>
              )}

              {sale.client.address && (
                <>
                  <h4 className={styles.subsectionTitle}>Dirección de Suministro</h4>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Dirección:</span>
                    <span className={styles.detailValue}>{sale.client.address.address}</span>
                  </div>

                  {sale.client.address.cupsLuz && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>CUPS Luz:</span>
                      <span className={styles.detailValue}>{sale.client.address.cupsLuz}</span>
                    </div>
                  )}

                  {sale.client.address.cupsGas && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>CUPS Gas:</span>
                      <span className={styles.detailValue}>{sale.client.address.cupsGas}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        ) : (
          <p className={styles.noData}>Cliente no disponible</p>
        )}
      </div>

      {/* COMERCIAL */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Comercial</h3>
          {!readonly && !isEditingComercial && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartEditComercial}
            >
              Editar
            </Button>
          )}
        </div>

        {isEditingComercial ? (
          <div className={styles.comercialEditForm}>
            <Input
              label="Nombre del comercial"
              value={tempComercial}
              onChange={(e) => setTempComercial(e.target.value)}
              placeholder="Nombre del comercial que realiza la venta"
              fullWidth
            />
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={handleCancelEditComercial}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveComercial}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.userCard}>
            <p className={styles.userName}>
              {sale.comercial || <span className={styles.noData}>Sin comercial asignado</span>}
            </p>
          </div>
        )}
      </div>

      {/* ITEMS */}
      <div className={styles.section}>
        <SaleItemsManager
          items={sale.items}
          readonly={readonly}
          loading={loading}
          onAddItem={async (item) => {
            await addItem(item);
          }}
          onUpdateItem={async (itemId, data) => {
            await updateItem(itemId, data);
          }}
          onRemoveItem={async (itemId) => {
            await removeItem(itemId);
          }}
        />
      </div>

      {/* GRABACIONES */}
      <div className={styles.section}>
        <SaleRecordings saleId={sale.id} readonly={readonly} />
      </div>

      {/* CONTRATO FIRMADO — evidencia descargable */}
      {sale.signatureRequest?.status === 'signed' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Contrato Firmado</h3>
          <p className={styles.signatureDesc}>
            Firmado por <strong>{sale.signatureRequest.signerEmail}</strong>
            {sale.signatureRequest.signedAt && (
              <> el {new Date(sale.signatureRequest.signedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
            )}
          </p>
          {sale.signatureRequest.signedDocumentUrl ? (
            <Button
              variant="primary"
              onClick={async () => {
                try { await downloadEvidence(sale.id); }
                catch { showError('No se pudo descargar la evidencia'); }
              }}
            >
              Descargar evidencia de firma
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await fetchEvidenceFromProvider(sale.id);
                  showSuccess('Evidencia descargada desde Lleida.net');
                  await loadSaleById(sale.id);
                } catch {
                  showError('No se pudo descargar la evidencia desde Lleida.net');
                }
              }}
            >
              Obtener evidencia desde Lleida.net
            </Button>
          )}
        </div>
      )}

      {/* FIRMA DEL CONTRATO — solo si no está firmada */}
      {!readonly && sale.signatureRequest?.status !== 'signed' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Firma del Contrato</h3>

          {/* Previsualizar contrato (siempre visible si hay datos) */}
          {sale.client && sale.items.length > 0 && (
            <div>
              <Button
                variant="secondary"
                onClick={() => setContractPreviewOpen(true)}
              >
                Previsualizar contrato
              </Button>
            </div>
          )}

          {/* Sin solicitud → permitir enviar */}
          {!sale.signatureRequest && (
            <div className={styles.signatureUnsent}>
              <p className={styles.signatureDesc}>
                Esta venta no tiene ningún contrato enviado para firma.
              </p>
              <label className={styles.signatureLabel} htmlFor="detailSignerEmail">
                Email del firmante *
              </label>
              <input
                id="detailSignerEmail"
                type="email"
                className={styles.signatureInput}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
              <Button
                variant="primary"
                onClick={handleSendContractFromDetail}
                disabled={!signerEmail.trim() || isSendingContract}
              >
                {isSendingContract ? 'Enviando...' : 'Enviar contrato para firma'}
              </Button>
            </div>
          )}

          {/* Pendiente de firma */}
          {sale.signatureRequest?.status === 'pending' && (
            <div className={styles.signaturePendingSection}>
              <div className={styles.signaturePendingBox}>
                <div className={styles.signaturePendingBoxLeft}>
                  <span className={styles.signaturePendingIcon}>⏳</span>
                  <div>
                    <p className={styles.signaturePendingTitle}>Esperando firma del cliente</p>
                    <p className={styles.signaturePendingSub}>
                      Enviado a <strong>{sale.signatureRequest.signerEmail}</strong>
                    </p>
                    {resendSuccess && (
                      <p className={styles.resendSuccess}>✓ Reenviado correctamente</p>
                    )}
                  </div>
                </div>
                <div className={styles.signaturePendingActions}>
                  <input
                    type="email"
                    className={styles.signatureInput}
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="Cambiar email"
                  />
                  <div className={styles.signatureButtonRow}>
                    <Button
                      variant="secondary"
                      onClick={handleResendContractFromDetail}
                      disabled={isResending}
                    >
                      {isResending ? 'Reenviando...' : 'Reenviar'}
                    </Button>
                    {IS_DEMO && sale.signatureRequest.providerDocumentId && (
                      <Button
                        variant="tertiary"
                        onClick={handleSimulateSignFromDetail}
                        disabled={isSendingContract}
                      >
                        Simular firma (demo)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rechazado */}
          {sale.signatureRequest?.status === 'rejected' && (
            <div className={styles.signatureRejectedSection}>
              <div className={styles.signatureRejectedBox}>
                <span className={styles.signatureRejectedIcon}>✗</span>
                <div>
                  <p className={styles.signatureRejectedTitle}>Contrato rechazado</p>
                  {sale.signatureRequest.rejectionReason && (
                    <p className={styles.signatureRejectedSub}>{sale.signatureRequest.rejectionReason}</p>
                  )}
                </div>
              </div>
              <label className={styles.signatureLabel} htmlFor="detailResendEmail">
                Email del firmante
              </label>
              <input
                id="detailResendEmail"
                type="email"
                className={styles.signatureInput}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
              <Button
                variant="primary"
                onClick={handleResendContractFromDetail}
                disabled={isResending || !signerEmail.trim()}
              >
                {isResending ? 'Reenviando...' : 'Reenviar contrato'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL DE FIRMA — siempre visible cuando hay eventos */}
      {signatureHistory.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Historial de Firma</h3>
          <div className={styles.signatureHistory}>
            {signatureHistory.map((entry) => (
              <div key={entry.id} className={styles.signatureHistoryEntry}>
                <span className={styles.signatureHistoryIcon}>
                  {getSignatureHistoryIcon(entry.action)}
                </span>
                <div className={styles.signatureHistoryContent}>
                  <p className={styles.signatureHistoryLabel}>
                    {getSignatureHistoryLabel(entry.action, entry.payload as Record<string, string | null> | null)}
                  </p>
                  <p className={styles.signatureHistoryTime}>
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL DE ESTADOS */}
      {statusHistory.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Historial de Estados</h3>
          <div className={styles.signatureHistory}>
            {statusHistory.map((entry) => {
              const payload = entry.payload as Record<string, string | null> | null;
              const fromName = payload?.fromName ?? '—';
              const toName = payload?.toName ?? '—';
              const userName = entry.user
                ? `${entry.user.firstName} ${entry.user.lastName}`
                : 'Sistema';
              return (
                <div key={entry.id} className={styles.signatureHistoryEntry}>
                  <span className={styles.signatureHistoryIcon}>🔄</span>
                  <div className={styles.signatureHistoryContent}>
                    <p className={styles.signatureHistoryLabel}>
                      <strong>{fromName}</strong> → <strong>{toName}</strong>
                      {payload?.comment ? ` — ${payload.comment}` : ''}
                    </p>
                    <p className={styles.signatureHistoryTime}>
                      {userName} · {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CAMBIO DE ESTADO */}
      {!readonly && sale.status && (
        <div className={styles.section}>
          <SaleStatusChanger
            sale={sale}
            availableStatuses={statuses.filter((s) => !s.isSystem)}
            onChangeStatus={async (statusId) => {
              await changeStatus(statusId);
            }}
          />
        </div>
      )}
    </div>

    {/* MODAL: vista previa del contrato */}
    {sale.client && (
      <Modal
        isOpen={contractPreviewOpen}
        onClose={() => setContractPreviewOpen(false)}
        title="Vista previa del contrato"
        size="lg"
      >
        <div style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 120px)', padding: '1.5rem' }}>
          <ContractPreview
            clientData={{
              clientId: sale.client.id,
              firstName: sale.client.firstName,
              lastName: sale.client.lastName,
              dni: sale.client.dni,
              email: sale.client.email,
              phones: sale.client.phones ?? [],
              bankAccounts: sale.client.bankAccounts ?? [],
              address: sale.client.address,
              birthday: sale.client.birthday,
            } satisfies ClientFormData}
            items={sale.items.map((item): CreateSaleItemData => ({
              productId: item.productId,
              name: item.nameSnapshot,
              quantity: item.quantity,
              price: item.unitPrice,
            }))}
            comercial={sale.comercial ?? ''}
            signerEmail={signerEmail || sale.signatureRequest?.signerEmail || ''}
          />
        </div>
      </Modal>
    )}
    </>
  );
};

export default SaleDetail;
