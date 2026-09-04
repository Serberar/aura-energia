/**
 * Formulario de nueva venta con firma obligatoria (inline)
 */

import { useState, useEffect } from 'react';
import type { CreateSaleItemData, SignatureRequest } from '@/types/sales';
import Button from '@/design-system/components/Button';
import { Modal } from '@/design-system';
import ClientSearchForm, { type ClientFormData } from './ClientSearchForm';
import ProductSearchForm from './ProductSearchForm';
import ContractPreview from './ContractPreview';
import { saleFormSchema } from '@/validation';
import { useAppSelector } from '@/hooks/reduxHooks';
import { getSignatureStatus, simulateSign, resendContract, fetchEvidenceFromProvider } from '../services/signatureService';
import { getSetting } from '@/features/settings/services/settingsService';
import {
  listTemplates,
  getTemplate,
  type ContractTemplate,
} from '@/features/settings/services/contractTemplateService';
import type { ContractConfig } from '@/features/settings/services/contractConfigService';
import styles from './SaleForm.module.scss';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export interface SaleFormPayload {
  client: any;
  items: CreateSaleItemData[];
  comercial: string;
  sendContract: boolean;
  signerEmail: string;
  signerPhone?: string;
  deliveryMethod?: 'email' | 'sms';
  templateId?: string;
}

type SignatureState = 'none' | 'awaiting' | 'signed';

interface SaleFormProps {
  onSendForSignature: (payload: SaleFormPayload) => Promise<{ saleId: string; providerDocumentId?: string | null } | null>;
  onConfirmSale: (saleId: string) => Promise<void>;
  onSaveWithoutSignature: (payload: SaleFormPayload) => Promise<void>;
  onViewSale?: (saleId: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

const SaleForm = ({ onSendForSignature, onConfirmSale, onSaveWithoutSignature, onViewSale, onCancel, loading = false, error }: SaleFormProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const comercialName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  // Datos del formulario
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [items, setItems] = useState<CreateSaleItemData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [contractPreviewOpen, setContractPreviewOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<ContractConfig | undefined>(undefined);
  const [evidenceState, setEvidenceState] = useState<'idle' | 'fetching' | 'ready' | 'waiting'>('idle');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Estado de firma (inline)
  const [sigState, setSigState] = useState<SignatureState>('none');
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null);
  const [signatureReq, setSignatureReq] = useState<SignatureRequest | null>(null);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Historial local de envíos durante esta sesión
  const [sendLog, setSendLog] = useState<Array<{ email: string; time: Date }>>([]);

  // Fase global (editing → completed)
  const [completed, setCompleted] = useState(false);

  // Modal guardar sin firma
  const [noSignatureModalOpen, setNoSignatureModalOpen] = useState(false);
  const [noSignatureChecked, setNoSignatureChecked] = useState(false);
  const [firmaRequerida, setFirmaRequerida] = useState(true);

  useEffect(() => {
    getSetting('firma_requerida')
      .then((s) => setFirmaRequerida(s.value))
      .catch(() => {/* mantener default true si falla */});
    listTemplates()
      .then((tpls) => {
        setTemplates(tpls);
        const def = tpls.find((t) => t.esDefecto) ?? tpls[0];
        if (def) setSelectedTemplateId(def.id);
      })
      .catch(() => {/* no hay plantillas o error de red, ignorar */});
  }, []);

  const handleClientSelected = (data: ClientFormData) => {
    setClientData(data);
    setValidationErrors([]);
    if (data.email && !signerEmail) setSignerEmail(data.email);
    if (data.phones?.[0] && !signerPhone) setSignerPhone(data.phones[0]);
  };

  const handleProductsSelected = (selectedItems: CreateSaleItemData[]) => {
    setItems(selectedItems);
    setValidationErrors([]);
  };

  const buildAndValidatePayload = () => {
    const payload = clientData ? {
      client: {
        id: clientData.clientId,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        dni: clientData.dni,
        email: clientData.email,
        birthday: clientData.birthday,
        phones: clientData.phones,
        bankAccounts: clientData.bankAccounts,
        address: clientData.address,
      },
      items,
      comercial: comercialName,
    } : { client: null, items, comercial: comercialName };

    const result = saleFormSchema.safeParse(payload);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      setValidationErrors([...new Set(errors)]);
      return null;
    }
    setValidationErrors([]);
    return result.data;
  };

  // ── Enviar contrato ───────────────────────────────────────────────────────
  const handleSendContract = async () => {
    if (deliveryMethod === 'sms') {
      if (!signerPhone.trim()) {
        setValidationErrors(['El teléfono del firmante es obligatorio para enviar por SMS']);
        return;
      }
    } else {
      if (!signerEmail.trim()) {
        setValidationErrors(['El email del firmante es obligatorio para enviar el contrato']);
        return;
      }
    }
    const validData = buildAndValidatePayload();
    if (!validData) return;

    setIsSendingContract(true);
    try {
      const result = await onSendForSignature({
        ...validData,
        sendContract: true,
        signerEmail: signerEmail.trim(),
        signerPhone: deliveryMethod === 'sms' ? signerPhone.trim() : undefined,
        deliveryMethod,
        templateId: selectedTemplateId || undefined,
      });
      if (result) {
        setPendingSaleId(result.saleId);
        setSignatureReq({ providerDocumentId: result.providerDocumentId } as SignatureRequest);
        setSigState('awaiting');
        const contact = deliveryMethod === 'sms' ? signerPhone.trim() : signerEmail.trim();
        setSendLog(prev => [...prev, { email: contact, time: new Date() }]);
      }
    } finally {
      setIsSendingContract(false);
    }
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sigState !== 'awaiting' || !pendingSaleId) return;
    const interval = setInterval(async () => {
      try {
        const sig = await getSignatureStatus(pendingSaleId);
        if (sig?.status === 'signed') {
          setSignatureReq(sig);
          setSigState('signed');
        }
      } catch { /* silenciar errores de polling */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [sigState, pendingSaleId]);

  // ── Evidencia: descarga automática al firmar y polling si no está lista ──
  useEffect(() => {
    if (sigState !== 'signed' || !pendingSaleId || evidenceState !== 'idle') return;
    setEvidenceState('fetching');
    fetchEvidenceFromProvider(pendingSaleId)
      .then(() => setEvidenceState('ready'))
      .catch(() => setEvidenceState('waiting'));
  }, [sigState, pendingSaleId, evidenceState]);

  useEffect(() => {
    if (evidenceState !== 'waiting' || !pendingSaleId) return;
    const interval = setInterval(async () => {
      try {
        await fetchEvidenceFromProvider(pendingSaleId);
        setEvidenceState('ready');
      } catch { /* seguir esperando */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [evidenceState, pendingSaleId]);

  // ── Simular firma (demo) ──────────────────────────────────────────────────
  const handleSimulateSign = async () => {
    if (!signatureReq?.providerDocumentId || !pendingSaleId) return;
    setIsSendingContract(true);
    try {
      await simulateSign(signatureReq.providerDocumentId);
      const sig = await getSignatureStatus(pendingSaleId);
      if (sig?.status === 'signed') {
        setSignatureReq(sig);
        setSigState('signed');
      }
    } finally {
      setIsSendingContract(false);
    }
  };

  // ── Reenviar ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!pendingSaleId) return;
    setIsResending(true);
    setResendSuccess(false);
    try {
      const sig = await resendContract(pendingSaleId, signerEmail.trim() || undefined);
      setSignatureReq(sig);
      setResendSuccess(true);
      setSendLog(prev => [...prev, { email: sig.signerEmail || signerEmail.trim(), time: new Date() }]);
      setTimeout(() => setResendSuccess(false), 3000);
    } finally {
      setIsResending(false);
    }
  };

  // ── Crear venta (confirmar) ───────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pendingSaleId || sigState !== 'signed') return;
    setIsConfirming(true);
    try {
      await onConfirmSale(pendingSaleId);
      setCompleted(true);
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Nueva venta ───────────────────────────────────────────────────────────
  const handleNewSale = () => {
    setCompleted(false);
    setSigState('none');
    setPendingSaleId(null);
    setSignatureReq(null);
    setClientData(null);
    setItems([]);
    setSignerEmail('');
    setSignerPhone('');
    setDeliveryMethod('email');
    setValidationErrors([]);
    setSendLog([]);
    setEvidenceState('idle');
  };

  // ── Guardar sin firma ─────────────────────────────────────────────────────
  const handleConfirmNoSignature = async () => {
    const validData = buildAndValidatePayload();
    if (!validData) return;
    setNoSignatureModalOpen(false);
    setNoSignatureChecked(false);
    await onSaveWithoutSignature({ ...validData, sendContract: false, signerEmail: '' });
  };

  const canSubmit = clientData !== null && items.length > 0;

  // ── VISTA: COMPLETADO ─────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className={styles.form}>
        <h2 className={styles.title}>Nueva Venta</h2>
        <div className={styles.completedSection}>
          <div className={styles.signedIcon}>✓</div>
          <h3 className={styles.signedTitle}>¡Venta creada con éxito!</h3>
          <p className={styles.signedHint}>
            La venta ha sido registrada con el contrato firmado.
          </p>
          <div className={styles.completedActions}>
            {onViewSale && pendingSaleId && (
              <Button type="button" variant="primary" onClick={() => onViewSale(pendingSaleId)}>
                Ver detalle de la venta
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={handleNewSale}>
              Crear otra venta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── VISTA: FORMULARIO ─────────────────────────────────────────────────────
  return (
    <>
      <div className={styles.form}>
        <h2 className={styles.title}>Nueva Venta</h2>

        <div className={styles.section}>
          <ClientSearchForm onClientSelected={handleClientSelected} initialData={clientData || undefined} />
        </div>

        <div className={styles.separator} />

        <div className={styles.section}>
          <ProductSearchForm onProductsSelected={handleProductsSelected} initialItems={items} />
        </div>

        <div className={styles.separator} />

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Comercial</h3>
          <input type="text" className={styles.input} value={comercialName} readOnly disabled />
        </div>

        <div className={styles.separator} />

        {/* ── FIRMA DEL CONTRATO ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Firma del Contrato</h3>
          <p className={styles.signatureDescription}>
            El cliente recibirá el contrato para firmarlo digitalmente.
            La venta solo se creará una vez que el contrato esté firmado.
          </p>

          {/* ── Toggle Email / SMS ── */}
          <div className={styles.deliveryToggle}>
            <button
              type="button"
              className={`${styles.deliveryOption} ${deliveryMethod === 'email' ? styles.deliveryOptionActive : ''}`}
              onClick={() => setDeliveryMethod('email')}
              disabled={sigState !== 'none'}
            >
              📧 Email
            </button>
            <button
              type="button"
              className={`${styles.deliveryOption} ${deliveryMethod === 'sms' ? styles.deliveryOptionActive : ''}`}
              onClick={() => setDeliveryMethod('sms')}
              disabled={sigState !== 'none'}
            >
              📱 SMS
            </button>
          </div>

          {templates.length > 1 && (
            <>
              <label className={styles.label} htmlFor="contractTemplate">
                Plantilla de contrato
              </label>
              <select
                id="contractTemplate"
                className={styles.input}
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}{t.esDefecto ? ' (por defecto)' : ''}
                  </option>
                ))}
              </select>
            </>
          )}

          {deliveryMethod === 'email' ? (
            <>
              <label className={styles.label} htmlFor="signerEmail">
                Email del firmante *
              </label>
              <input
                id="signerEmail"
                type="email"
                className={styles.input}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                disabled={sigState !== 'none'}
              />
            </>
          ) : (
            <>
              <label className={styles.label} htmlFor="signerPhone">
                Teléfono del firmante *
              </label>
              <input
                id="signerPhone"
                type="tel"
                className={styles.input}
                value={signerPhone}
                onChange={(e) => setSignerPhone(e.target.value)}
                placeholder="600000000"
                disabled={sigState !== 'none'}
              />
            </>
          )}

          {/* Botones: Previsualizar + Enviar */}
          <div className={styles.signatureButtonRow}>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                if (selectedTemplateId) {
                  try { setPreviewConfig(await getTemplate(selectedTemplateId)); } catch { setPreviewConfig(undefined); }
                } else {
                  setPreviewConfig(undefined);
                }
                setContractPreviewOpen(true);
              }}
              disabled={!canSubmit}
            >
              Previsualizar contrato
            </Button>
            {!IS_DEMO && (
              <Button
                type="button"
                variant="primary"
                onClick={handleSendContract}
                disabled={!canSubmit || sigState !== 'none' || isSendingContract}
              >
                {isSendingContract ? 'Enviando...' : 'Enviar para firma'}
              </Button>
            )}
          </div>

          {/* Panel demo: simular envío (solo en modo DEMO) */}
          {IS_DEMO && sigState === 'none' && (
            <div className={styles.demoActions} style={{ marginTop: '0.75rem' }}>
              <span className={styles.demoLabel}>DEMO</span>
              <Button
                type="button"
                variant="tertiary"
                onClick={handleSendContract}
                disabled={!canSubmit || isSendingContract}
              >
                {isSendingContract ? 'Simulando...' : '📤 Simular: enviar contrato'}
              </Button>
            </div>
          )}

          {/* Sección inline: esperando firma */}
          {sigState === 'awaiting' && (
            <div className={styles.awaitingBox}>
              <div className={styles.awaitingBoxLeft}>
                <span className={styles.awaitingBoxIcon}>⏳</span>
                <div>
                  <p className={styles.awaitingBoxTitle}>Esperando firma del cliente</p>
                  <p className={styles.awaitingBoxSub}>
                    {deliveryMethod === 'sms' ? 'Enviado por SMS a' : 'Enviado a'}{' '}
                    <strong>{deliveryMethod === 'sms' ? signerPhone : signerEmail}</strong>
                  </p>
                  {resendSuccess && <p className={styles.resendSuccess}>✓ Reenviado correctamente</p>}
                </div>
              </div>
              <div className={styles.awaitingBoxActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? 'Reenviando...' : 'Reenviar'}
                </Button>
                {IS_DEMO && (
                  <div className={styles.demoActions}>
                    <span className={styles.demoLabel}>DEMO</span>
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={handleSimulateSign}
                      disabled={isSendingContract}
                    >
                      ✍️ Simular: cliente firma
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección inline: firmado */}
          {sigState === 'signed' && (
            <div className={styles.signedBox}>
              <span className={styles.signedBoxIcon}>✓</span>
              <div>
                <p className={styles.signedBoxTitle}>Contrato firmado</p>
                {signatureReq?.signedAt && (
                  <p className={styles.signedBoxSub}>
                    {new Date(signatureReq.signedAt).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Estado de la evidencia de firma */}
          {sigState === 'signed' && evidenceState !== 'idle' && (
            <div className={styles.awaitingBox} style={evidenceState === 'ready' ? { borderColor: 'var(--color-success, #16a34a)', background: 'var(--color-success-bg, #f0fdf4)' } : {}}>
              <div className={styles.awaitingBoxLeft}>
                <span className={styles.awaitingBoxIcon}>
                  {evidenceState === 'ready' ? '📥' : '⏳'}
                </span>
                <div>
                  <p className={styles.awaitingBoxTitle}>
                    {evidenceState === 'fetching' && 'Descargando evidencia de firma...'}
                    {evidenceState === 'waiting' && 'Esperando generación de evidencia'}
                    {evidenceState === 'ready' && 'Evidencia de firma descargada'}
                  </p>
                  <p className={styles.awaitingBoxSub}>
                    {evidenceState === 'fetching' && 'Obteniendo el documento de Lleida.net'}
                    {evidenceState === 'waiting' && 'Se descargará automáticamente cuando esté lista'}
                    {evidenceState === 'ready' && 'El documento de evidencia está almacenado correctamente'}
                  </p>
                </div>
              </div>
              {IS_DEMO && evidenceState !== 'ready' && (
                <div className={styles.demoActions}>
                  <span className={styles.demoLabel}>DEMO</span>
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => setEvidenceState('ready')}
                  >
                    📄 Simular: documentación recibida
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Historial de envíos de esta sesión */}
          {sendLog.length > 0 && (
            <div className={styles.sendLog}>
              <p className={styles.sendLogTitle}>Historial de envíos</p>
              {sendLog.map((entry, i) => (
                <div key={i} className={styles.sendLogEntry}>
                  <span className={styles.sendLogIcon}>{i === 0 ? (deliveryMethod === 'sms' ? '📱' : '📧') : '🔄'}</span>
                  <span className={styles.sendLogText}>
                    {i === 0 ? (deliveryMethod === 'sms' ? 'Enviado por SMS a' : 'Enviado a') : 'Reenviado a'} <strong>{entry.email}</strong>
                  </span>
                  <span className={styles.sendLogTime}>
                    {entry.time.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {sigState === 'signed' && signatureReq?.signedAt && (
                <div className={styles.sendLogEntry}>
                  <span className={styles.sendLogIcon}>✅</span>
                  <span className={styles.sendLogText}>Firmado</span>
                  <span className={styles.sendLogTime}>
                    {new Date(signatureReq.signedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {validationErrors.length > 0 && (
          <div className={styles.errors}>
            {validationErrors.map((err, i) => (
              <p key={i} className={styles.error}>{err}</p>
            ))}
          </div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        {canSubmit && (
          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Resumen de la Venta</h3>
            <div className={styles.summaryContent}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Cliente:</span>
                <span className={styles.summaryValue}>{clientData!.firstName} {clientData!.lastName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Dirección:</span>
                <span className={styles.summaryValue}>{clientData!.address.address}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Pedido:</span>
                <ul className={styles.summaryList}>
                  {items.map((item, index) => (
                    <li key={item.productId || index}>
                      {item.name} — {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming || loading}>
              Cancelar
            </Button>
          )}
          {!firmaRequerida && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const validData = buildAndValidatePayload();
                if (validData) setNoSignatureModalOpen(true);
              }}
              disabled={!canSubmit || isConfirming || loading}
            >
              Guardar sin firma
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={sigState !== 'signed' || isConfirming || loading}
          >
            {isConfirming || loading ? 'Creando...' : 'Crear venta'}
          </Button>
        </div>
      </div>

      {/* Modal: vista previa del contrato */}
      <Modal
        isOpen={contractPreviewOpen}
        onClose={() => setContractPreviewOpen(false)}
        title="Vista previa del contrato"
        size="lg"
      >
        <div style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 120px)', padding: '1.5rem' }}>
          {clientData && items.length > 0 && (
            <ContractPreview
              clientData={clientData}
              items={items}
              comercial={comercialName}
              signerEmail={signerEmail}
              contractConfig={previewConfig}
            />
          )}
        </div>
      </Modal>

      {/* Modal: guardar sin firma */}
      <Modal
        isOpen={noSignatureModalOpen}
        onClose={() => { setNoSignatureModalOpen(false); setNoSignatureChecked(false); }}
        title="Guardar venta sin firma"
        showCloseButton={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <p style={{ margin: 0 }}>
            Esta venta se guardará <strong>SIN contrato firmado</strong>. Deberás gestionar la firma manualmente más adelante.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={noSignatureChecked}
              onChange={(e) => setNoSignatureChecked(e.target.checked)}
              style={{ marginTop: '2px', flexShrink: 0 }}
            />
            <span>Entiendo que esta venta quedará pendiente de revisión manual</span>
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => { setNoSignatureModalOpen(false); setNoSignatureChecked(false); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmNoSignature} disabled={!noSignatureChecked || loading}>
              Guardar sin firma
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SaleForm;
