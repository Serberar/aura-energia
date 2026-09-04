/**
 * Componente ClientForm - Formulario para crear/editar clientes
 */

import React, { useState, useEffect } from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Card from '@/design-system/components/Card';
import type { Client, CreateClientData, UpdateClientData, AddressInfo } from '@/types/sales';
import { logger } from '@/utils/logger';
import styles from './ClientForm.module.scss';

// ======================================
// TIPADO CORRECTO PARA create y edit
// ======================================

interface ClientFormBaseProps {
  client?: Client;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface ClientFormCreateProps extends ClientFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateClientData) => Promise<void>;
}

export interface ClientFormEditProps extends ClientFormBaseProps {
  mode: 'edit';
  onSubmit: (data: UpdateClientData) => Promise<void>;
}

export type ClientFormProps = ClientFormCreateProps | ClientFormEditProps;

// ======================================
// COMPONENTE
// ======================================

interface FormData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  birthday: string;
  businessName: string;
  authorized: string;
  // Arrays dinámicos
  phones: string[];
  addresses: AddressInfo[];
  bankAccounts: string[];
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  birthday?: string;
  phones?: string;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    dni: client?.dni || '',
    email: client?.email || '',
    birthday: client?.birthday || '',
    businessName: client?.businessName || '',
    authorized: client?.authorized || '',
    phones: client?.phones?.length ? [...client.phones] : [''],
    addresses: client?.addresses?.length ? [...client.addresses] : [],
    bankAccounts: client?.bankAccounts?.length ? [...client.bankAccounts] : [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dni: client.dni || '',
        email: client.email || '',
        birthday: client.birthday || '',
        businessName: client.businessName || '',
        authorized: client.authorized || '',
        phones: client.phones?.length ? [...client.phones] : [''],
        addresses: client.addresses?.length ? [...client.addresses] : [],
        bankAccounts: client.bankAccounts?.length ? [...client.bankAccounts] : [],
      });
    }
  }, [client]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.length > 100) return 'El nombre no puede exceder 100 caracteres';
        break;

      case 'lastName':
        if (!value.trim()) return 'Los apellidos son requeridos';
        if (value.length < 2) return 'Los apellidos deben tener al menos 2 caracteres';
        if (value.length > 100) return 'Los apellidos no pueden exceder 100 caracteres';
        break;

      case 'dni':
        if (!value.trim()) return 'El DNI es requerido';
        if (value.length < 1) return 'El DNI es obligatorio';
        if (value.length > 20) return 'El DNI no puede exceder 20 caracteres';
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email inválido';
        }
        if (value && value.length > 100) return 'El email no puede exceder 100 caracteres';
        break;

      case 'birthday':
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) return 'Fecha inválida';
          if (date > new Date()) return 'La fecha no puede ser futura';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      dni: validateField('dni', formData.dni),
      email: validateField('email', formData.email),
      birthday: validateField('birthday', formData.birthday),
    };

    // Validar teléfonos
    const validPhones = formData.phones.filter((p) => p.trim());
    if (mode === 'create' && validPhones.length === 0) {
      newErrors.phones = 'Debe proporcionar al menos un teléfono';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;

      setFormData((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
      }
    };

  const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = formData[field as keyof FormData];
    if (typeof value === 'string') {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  // Manejar array de teléfonos
  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData((prev) => ({ ...prev, phones: newPhones }));
  };

  const addPhone = () => {
    setFormData((prev) => ({ ...prev, phones: [...prev.phones, ''] }));
  };

  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      const newPhones = formData.phones.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, phones: newPhones }));
    }
  };

  // Manejar array de direcciones
  const handleAddressChange = (index: number, field: keyof AddressInfo, value: string) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, { address: '', cupsLuz: '', cupsGas: '' }],
    }));
  };

  const removeAddress = (index: number) => {
    const newAddresses = formData.addresses.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, addresses: newAddresses }));
  };

  // Manejar array de cuentas bancarias
  const handleBankAccountChange = (index: number, value: string) => {
    const newBankAccounts = [...formData.bankAccounts];
    newBankAccounts[index] = value;
    setFormData((prev) => ({ ...prev, bankAccounts: newBankAccounts }));
  };

  const addBankAccount = () => {
    setFormData((prev) => ({ ...prev, bankAccounts: [...prev.bankAccounts, ''] }));
  };

  const removeBankAccount = (index: number) => {
    const newBankAccounts = formData.bankAccounts.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, bankAccounts: newBankAccounts }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      dni: true,
      email: true,
      birthday: true,
      phones: true,
    });

    if (!validateForm()) return;

    // Filtrar valores vacíos
    const validPhones = formData.phones.filter((p) => p.trim());
    const validAddresses = formData.addresses.filter((a) => a.address.trim());
    const validBankAccounts = formData.bankAccounts.filter((b) => b.trim());

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dni: formData.dni.trim(),
      email: formData.email.trim() || undefined,
      birthday: formData.birthday || undefined,
      businessName: formData.businessName.trim() || undefined,
      authorized: formData.authorized.trim() || undefined,
      phones: validPhones,
      addresses: validAddresses.length > 0 ? validAddresses : undefined,
      bankAccounts: validBankAccounts.length > 0 ? validBankAccounts : undefined,
    };

    try {
      if (mode === 'create') {
        await (onSubmit as (data: CreateClientData) => Promise<void>)(payload as CreateClientData);
      } else {
        await (onSubmit as (data: UpdateClientData) => Promise<void>)(payload as UpdateClientData);
      }
    } catch (error) {
      logger.error('Error al enviar formulario de cliente', error as Error);
    }
  };

  return (
    <Card variant="outlined" padding="lg" className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'create' ? 'Crear Cliente' : 'Editar Cliente'}
          </h2>
        </div>

        <div className={styles.fields}>
          {/* Nombre y Apellidos */}
          <div className={styles.row}>
            <Input
              label="Nombre"
              type="text"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
              error={touched.firstName ? errors.firstName : undefined}
              required
              fullWidth
              placeholder="Ej: Juan"
              disabled={isLoading}
            />

            <Input
              label="Apellidos"
              type="text"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              error={touched.lastName ? errors.lastName : undefined}
              required
              fullWidth
              placeholder="Ej: García López"
              disabled={isLoading}
            />
          </div>

          {/* DNI y Email */}
          <div className={styles.row}>
            <Input
              label="DNI/NIF"
              type="text"
              value={formData.dni}
              onChange={handleChange('dni')}
              onBlur={handleBlur('dni')}
              error={touched.dni ? errors.dni : undefined}
              required
              fullWidth
              placeholder="Ej: 12345678A"
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              fullWidth
              placeholder="Ej: cliente@example.com"
              disabled={isLoading}
            />
          </div>

          {/* Fecha de nacimiento y Nombre de empresa */}
          <div className={styles.row}>
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={formData.birthday}
              onChange={handleChange('birthday')}
              onBlur={handleBlur('birthday')}
              error={touched.birthday ? errors.birthday : undefined}
              fullWidth
              disabled={isLoading}
            />

            <Input
              label="Nombre de empresa"
              type="text"
              value={formData.businessName}
              onChange={handleChange('businessName')}
              fullWidth
              placeholder="Ej: Acme Corporation S.L."
              disabled={isLoading}
            />
          </div>

          {/* Autorizado */}
          <Input
            label="Autorizado"
            type="text"
            value={formData.authorized}
            onChange={handleChange('authorized')}
            fullWidth
            placeholder="Nombre de persona autorizada"
            disabled={isLoading}
          />

          {/* Teléfonos */}
          <div className={styles.arraySection}>
            <div className={styles.arrayHeader}>
              <label className={styles.arrayLabel}>
                Teléfonos <span className={styles.required}>*</span>
              </label>
              <button type="button" onClick={addPhone} className={styles.addButton} disabled={isLoading}>
                + Añadir teléfono
              </button>
            </div>
            {errors.phones && <span className={styles.error}>{errors.phones}</span>}
            {formData.phones.map((phone, index) => (
              <div key={index} className={styles.arrayItem}>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder="Ej: 612345678"
                  fullWidth
                  disabled={isLoading}
                />
                {formData.phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className={styles.removeButton}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Direcciones */}
          <div className={styles.arraySection}>
            <div className={styles.arrayHeader}>
              <label className={styles.arrayLabel}>Direcciones</label>
              <button type="button" onClick={addAddress} className={styles.addButton} disabled={isLoading}>
                + Añadir dirección
              </button>
            </div>
            {formData.addresses.map((address, index) => (
              <div key={index} className={styles.addressGroup}>
                <div className={styles.arrayItem}>
                  <Input
                    label="Dirección"
                    type="text"
                    value={address.address}
                    onChange={(e) => handleAddressChange(index, 'address', e.target.value)}
                    placeholder="Calle, número, ciudad..."
                    fullWidth
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className={styles.removeButton}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.row}>
                  <Input
                    label="CUPS Luz"
                    type="text"
                    value={address.cupsLuz || ''}
                    onChange={(e) => handleAddressChange(index, 'cupsLuz', e.target.value)}
                    placeholder="CUPS de luz"
                    fullWidth
                    disabled={isLoading}
                  />
                  <Input
                    label="CUPS Gas"
                    type="text"
                    value={address.cupsGas || ''}
                    onChange={(e) => handleAddressChange(index, 'cupsGas', e.target.value)}
                    placeholder="CUPS de gas"
                    fullWidth
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cuentas bancarias */}
          <div className={styles.arraySection}>
            <div className={styles.arrayHeader}>
              <label className={styles.arrayLabel}>Cuentas Bancarias (IBAN)</label>
              <button type="button" onClick={addBankAccount} className={styles.addButton} disabled={isLoading}>
                + Añadir cuenta
              </button>
            </div>
            {formData.bankAccounts.map((account, index) => (
              <div key={index} className={styles.arrayItem}>
                <Input
                  type="text"
                  value={account}
                  onChange={(e) => handleBankAccountChange(index, e.target.value)}
                  placeholder="Ej: ES1234567890123456789012"
                  fullWidth
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => removeBankAccount(index)}
                  className={styles.removeButton}
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              fullWidth
            >
              Cancelar
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText={mode === 'create' ? 'Creando...' : 'Guardando...'}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ClientForm;
