/**
 * Componente UserForm - Formulario para crear usuarios
 */

import React, { useState } from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Card from '@/design-system/components/Card';
import type { UserRole } from '@/types';
import type { CreateUserData } from '../services/userService';
import { logger } from '@/utils/logger';
import styles from './UserForm.module.scss';

interface UserFormProps {
  onSubmit: (data: CreateUserData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'verificador', label: 'Verificador' },
  { value: 'comercial', label: 'Comercial' },
];

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'comercial',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'lastName':
        if (!value.trim()) return 'El apellido es requerido';
        if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres';
        break;
      case 'username':
        if (!value.trim()) return 'El usuario es requerido';
        if (value.trim().length < 3) return 'El usuario debe tener al menos 3 caracteres';
        break;
      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value) return 'Confirma la contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.firstName = validateField('firstName', formData.firstName);
    newErrors.lastName = validateField('lastName', formData.lastName);
    newErrors.username = validateField('username', formData.username);
    newErrors.password = validateField('password', formData.password);
    newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);

    // Filtrar undefined
    const filteredErrors: FormErrors = {};
    Object.entries(newErrors).forEach(([key, value]) => {
      if (value) filteredErrors[key as keyof FormErrors] = value;
    });

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      password: true,
      confirmPassword: true,
      role: true,
    });

    if (!validateForm()) return;

    const payload: CreateUserData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      logger.error('Error al enviar formulario de usuario', error as Error);
    }
  };

  return (
    <Card variant="outlined" padding="lg" className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crear Usuario</h2>
        </div>

        <div className={styles.fields}>
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
              label="Apellido"
              type="text"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              error={touched.lastName ? errors.lastName : undefined}
              required
              fullWidth
              placeholder="Ej: García"
              disabled={isLoading}
            />
          </div>

          <Input
            label="Usuario"
            type="text"
            value={formData.username}
            onChange={handleChange('username')}
            onBlur={handleBlur('username')}
            error={touched.username ? errors.username : undefined}
            required
            fullWidth
            placeholder="Ej: jgarcia"
            disabled={isLoading}
          />

          <div className={styles.row}>
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              required
              fullWidth
              placeholder="Mínimo 6 caracteres"
              disabled={isLoading}
              endAdornment={
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              }
            />

            <Input
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              required
              fullWidth
              placeholder="Repite la contraseña"
              disabled={isLoading}
              endAdornment={
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              }
            />
          </div>

          <div className={styles.selectGroup}>
            <label htmlFor="role" className={styles.label}>
              Rol <span className={styles.required}>*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange('role')}
              className={styles.select}
              disabled={isLoading}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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
            loadingText="Creando..."
            disabled={isLoading}
            fullWidth
          >
            Crear Usuario
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UserForm;
