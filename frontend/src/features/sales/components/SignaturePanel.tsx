/* src/features/sales/components/SignaturePanel.tsx */

import { useState, useEffect } from 'react';
import type { SignatureRequest } from '@/types/sales';
import { Button, useToast } from '@/design-system';
import { useSignature } from '../hooks/useSignature';
import { downloadEvidence } from '../services/signatureService';
import {
  listTemplates,
  type ContractTemplate,
} from '@/features/settings/services/contractTemplateService';
import SendContractModal from './SendContractModal';
import styles from './SignaturePanel.module.scss';

interface SignaturePanelProps {
  saleId: string;
  signatureRequest: SignatureRequest | null | undefined;
  defaultSignerEmail?: string;
  readonly?: boolean;
  onSignatureChange?: (signatureRequest: SignatureRequest) => void;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SignaturePanel = ({
  saleId,
  signatureRequest,
  defaultSignerEmail = '',
  readonly = false,
  onSignatureChange,
}: SignaturePanelProps) => {
  const { send, resend, loading } = useSignature();
  const { showSuccess, showError } = useToast();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [downloadingEvidence, setDownloadingEvidence] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => { /* no-op: sin plantillas simplemente no muestra selector */ });
  }, []);

  const handleDownloadEvidence = async () => {
    setDownloadingEvidence(true);
    try {
      await downloadEvidence(saleId);
      showSuccess('Evidencia descargada correctamente');
    } catch {
      showError('Error al descargar la evidencia. Inténtalo de nuevo.');
    } finally {
      setDownloadingEvidence(false);
    }
  };

  const handleSend = async (signerEmail: string, templateId?: string) => {
    const result = await send(saleId, signerEmail, templateId);
    if (result) {
      setIsSendModalOpen(false);
      showSuccess('Contrato enviado al firmante correctamente');
      onSignatureChange?.(result);
    } else {
      showError('Error al enviar el contrato. Inténtalo de nuevo.');
    }
  };

  const handleResend = async (signerEmail?: string) => {
    const result = await resend(saleId, signerEmail);
    if (result) {
      setIsResendModalOpen(false);
      showSuccess('Contrato reenviado correctamente');
      onSignatureChange?.(result);
    } else {
      showError('Error al reenviar el contrato. Inténtalo de nuevo.');
    }
  };

  const renderContent = () => {
    if (!signatureRequest) {
      return (
        <div className={styles.statusBlock}>
          <div className={`${styles.statusIndicator} ${styles.none}`}>
            <span className={styles.statusIcon}>●</span>
            <span className={styles.statusText}>Sin contrato</span>
          </div>
          {!readonly && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSendModalOpen(true)}
              disabled={loading}
            >
              Generar y enviar contrato
            </Button>
          )}
        </div>
      );
    }

    switch (signatureRequest.status) {
      case 'pending':
        return (
          <div className={styles.statusBlock}>
            <div className={`${styles.statusIndicator} ${styles.pending}`}>
              <span className={styles.statusIcon}>⏳</span>
              <span className={styles.statusText}>Pendiente de firma del cliente</span>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Enviado:</span>
                <span className={styles.detailValue}>{formatDate(signatureRequest.sentAt)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{signatureRequest.signerEmail}</span>
              </div>
            </div>
            {!readonly && (
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsResendModalOpen(true)}
                  disabled={loading}
                >
                  Reenviar email
                </Button>
              </div>
            )}
          </div>
        );

      case 'signed':
        return (
          <div className={styles.statusBlock}>
            <div className={`${styles.statusIndicator} ${styles.signed}`}>
              <span className={styles.statusIcon}>✓</span>
              <span className={styles.statusText}>Contrato firmado</span>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Firmado:</span>
                <span className={styles.detailValue}>{formatDate(signatureRequest.signedAt)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Firmante:</span>
                <span className={styles.detailValue}>{signatureRequest.signerEmail}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadEvidence}
                disabled={downloadingEvidence}
              >
                {downloadingEvidence ? 'Descargando...' : 'Descargar evidencia PDF'}
              </Button>
            </div>
          </div>
        );

      case 'rejected':
        return (
          <div className={styles.statusBlock}>
            <div className={`${styles.statusIndicator} ${styles.rejected}`}>
              <span className={styles.statusIcon}>✗</span>
              <span className={styles.statusText}>Firma rechazada por el cliente</span>
            </div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Rechazado:</span>
                <span className={styles.detailValue}>{formatDate(signatureRequest.rejectedAt)}</span>
              </div>
              {signatureRequest.rejectionReason && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Motivo:</span>
                  <span className={styles.detailValue}>{signatureRequest.rejectionReason}</span>
                </div>
              )}
            </div>
            {!readonly && (
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsResendModalOpen(true)}
                  disabled={loading}
                >
                  Corregir y reenviar
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Firma del Contrato</h3>
      {renderContent()}

      <SendContractModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onConfirm={handleSend}
        defaultEmail={defaultSignerEmail}
        loading={loading}
        templates={templates}
      />

      <SendContractModal
        isOpen={isResendModalOpen}
        onClose={() => setIsResendModalOpen(false)}
        onConfirm={handleResend}
        defaultEmail={signatureRequest?.signerEmail ?? defaultSignerEmail}
        loading={loading}
        templates={templates}
      />
    </div>
  );
};

export default SignaturePanel;
