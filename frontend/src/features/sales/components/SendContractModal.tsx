/* src/features/sales/components/SendContractModal.tsx */

import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/design-system';
import type { ContractTemplate } from '@/features/settings/services/contractTemplateService';

const EMPTY_TEMPLATES: ContractTemplate[] = [];

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signerEmail: string, templateId?: string) => void;
  defaultEmail?: string;
  loading?: boolean;
  templates?: ContractTemplate[];
}

const SendContractModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultEmail = '',
  loading = false,
  templates = EMPTY_TEMPLATES,
}: SendContractModalProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setEmailError('');
      // Pre-select the default template
      const def = templates.find((t) => t.esDefecto) ?? templates[0];
      setSelectedTemplateId(def?.id ?? '');
    }
  }, [isOpen, defaultEmail, templates]);

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  const handleConfirm = () => {
    if (!email.trim()) {
      setEmailError('El email del firmante es obligatorio');
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError('Introduce un email válido');
      return;
    }
    setEmailError('');
    onConfirm(email.trim(), selectedTemplateId || undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar contrato para firma">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary, #666)' }}>
          El cliente recibirá un email con el enlace para firmar el contrato digitalmente.
        </p>

        {templates.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Plantilla de contrato</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border, #ddd)',
                fontSize: '0.9rem',
                background: 'var(--color-surface, #fff)',
              }}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.esDefecto ? ' (por defecto)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Email del firmante"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError('');
          }}
          placeholder="email@ejemplo.com"
          fullWidth
        />
        {emailError && (
          <p style={{ margin: 0, color: 'var(--color-error, #d32f2f)', fontSize: '0.85rem' }}>
            {emailError}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar contrato'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SendContractModal;
