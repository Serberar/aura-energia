import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { CreateAllowedIpData } from '../services/allowedIpService';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import styles from './AllowedIpForm.module.scss';

interface AllowedIpFormProps {
  onSubmit: (data: CreateAllowedIpData) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

const AllowedIpForm = ({ onSubmit, onCancel, loading = false, error }: AllowedIpFormProps) => {
  const [formData, setFormData] = useState<CreateAllowedIpData>({
    ip: '',
    description: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateIp = (ip: string): boolean => {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.').map(Number);
      return parts.every((p) => p >= 0 && p <= 255);
    }
    // IPv6 (simplificado)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedIp = formData.ip.trim();
    if (!trimmedIp) {
      setValidationError('La IP es obligatoria');
      return;
    }

    if (!validateIp(trimmedIp)) {
      setValidationError('Formato de IP invalido');
      return;
    }

    onSubmit({ ip: trimmedIp, description: formData.description?.trim() || null });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Añadir IP Permitida</h3>

      <div className={styles.field}>
        <Input
          label="Direccion IP"
          name="ip"
          type="text"
          value={formData.ip}
          onChange={handleInputChange}
          placeholder="Ej: 83.58.107.153"
          error={validationError || undefined}
          required
        />
      </div>

      <div className={styles.field}>
        <Input
          label="Descripcion (opcional)"
          name="description"
          type="text"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Ej: Oficina principal, VPN empresa..."
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Añadir IP'}
        </Button>
      </div>
    </form>
  );
};

export default AllowedIpForm;
