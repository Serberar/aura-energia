/**
 * Componente UserCard - Tarjeta de usuario
 */

import React, { useState } from 'react';
import Card from '@/design-system/components/Card';
import Button from '@/design-system/components/Button';
import Modal from '@/design-system/components/Modal';
import type { UserData, UpdateUserData } from '../services/userService';
import type { UserRole } from '@/types';
import styles from './UserCard.module.scss';

interface UserCardProps {
  user: UserData;
  onDelete?: (userId: string) => void;
  onUpdate?: (userId: string, data: UpdateUserData) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
  currentUserId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  verificador: 'Verificador',
  comercial: 'Comercial',
};

const ROLE_COLORS: Record<string, string> = {
  administrador: '#dc3545',
  coordinador: '#007bff',
  verificador: '#28a745',
  comercial: '#6c757d',
};

const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'verificador', label: 'Verificador' },
  { value: 'comercial', label: 'Comercial' },
];

const UserCard: React.FC<UserCardProps> = ({
  user,
  onDelete,
  onUpdate,
  isDeleting,
  isUpdating,
  currentUserId,
}) => {
  const isCurrentUser = currentUserId === user.id;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estado del formulario de edición
  const [editForm, setEditForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
    password: '',
    confirmPassword: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleDeleteClick = () => {
    if (!isCurrentUser) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(user.id);
    }
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleEditClick = () => {
    // Reset form to current user values
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      password: '',
      confirmPassword: '',
    });
    setEditErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    }
    if (!editForm.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }
    if (!editForm.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    }
    if (editForm.password && editForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmEdit = () => {
    if (!validateEditForm()) return;

    if (onUpdate) {
      const updateData: UpdateUserData = {};

      // Solo incluir campos que han cambiado
      if (editForm.firstName !== user.firstName) updateData.firstName = editForm.firstName;
      if (editForm.lastName !== user.lastName) updateData.lastName = editForm.lastName;
      if (editForm.username !== user.username) updateData.username = editForm.username;
      if (editForm.role !== user.role) updateData.role = editForm.role as UserRole;
      if (editForm.password) updateData.password = editForm.password;

      // Solo enviar si hay cambios
      if (Object.keys(updateData).length > 0) {
        onUpdate(user.id, updateData);
      }
    }
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const isLocked = user.failedLoginAttempts >= 20;

  const handleToggleActive = () => {
    if (onUpdate) {
      onUpdate(user.id, { active: !user.active });
    }
  };

  return (
    <Card variant="outlined" padding="md" className={`${styles.card} ${!user.active ? styles.cardInactive : ''}`}>
      <div className={styles.header}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.info}>
          <h3 className={styles.name}>
            {user.firstName} {user.lastName}
          </h3>
          <span className={styles.username}>@{user.username}</span>
        </div>
        <div className={styles.statusBadges}>
          {isLocked && (
            <span className={styles.badgeLocked} title={`Bloqueado tras ${user.failedLoginAttempts} intentos fallidos`}>
              Bloqueado
            </span>
          )}
          {!user.active && !isLocked && (
            <span className={styles.badgeInactive}>Desactivado</span>
          )}
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.label}>Rol:</span>
          <span
            className={styles.roleBadge}
            style={{ backgroundColor: ROLE_COLORS[user.role] || '#6c757d' }}
          >
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </div>

        <div className={styles.detail}>
          <span className={styles.label}>Creado:</span>
          <span className={styles.value}>{formatDate(user.createdAt)}</span>
        </div>

        <div className={styles.detail}>
          <span className={styles.label}>Último acceso:</span>
          <span className={styles.value}>{formatDate(user.lastLoginAt)}</span>
        </div>

        {isLocked && (
          <div className={styles.detail}>
            <span className={styles.label}>Intentos fallidos:</span>
            <span className={styles.value} style={{ color: '#dc3545', fontWeight: 600 }}>
              {user.failedLoginAttempts}
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <div className={styles.actionButtons}>
          {onUpdate && !isCurrentUser && (
            <Button
              variant={user.active ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggleActive}
              disabled={isUpdating}
              isLoading={isUpdating}
              loadingText="Guardando..."
            >
              {user.active ? 'Desactivar' : 'Activar'}
            </Button>
          )}
          {onUpdate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEditClick}
              disabled={isUpdating}
              isLoading={isUpdating}
              loadingText="Guardando..."
            >
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting || isCurrentUser}
              isLoading={isDeleting}
              loadingText="Eliminando..."
            >
              {isCurrentUser ? 'Usuario actual' : 'Eliminar'}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirmar eliminación"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" size="sm" onClick={handleCancelDelete}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        }
      >
        <div className={styles.deleteConfirmation}>
          <p>
            ¿Estás seguro de que deseas eliminar al usuario{' '}
            <strong>
              "{user.firstName} {user.lastName}"
            </strong>
            ?
          </p>
          <p className={styles.warning}>Esta acción no se puede deshacer.</p>
        </div>
      </Modal>

      {/* Modal de edición */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCancelEdit}
        title="Editar usuario"
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmEdit}>
              Guardar cambios
            </Button>
          </div>
        }
      >
        <form className={styles.editForm} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">Nombre</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={editForm.firstName}
                onChange={handleEditChange}
                className={editErrors.firstName ? styles.inputError : ''}
              />
              {editErrors.firstName && (
                <span className={styles.errorText}>{editErrors.firstName}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName">Apellido</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={editForm.lastName}
                onChange={handleEditChange}
                className={editErrors.lastName ? styles.inputError : ''}
              />
              {editErrors.lastName && (
                <span className={styles.errorText}>{editErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={editForm.username}
                onChange={handleEditChange}
                className={editErrors.username ? styles.inputError : ''}
              />
              {editErrors.username && (
                <span className={styles.errorText}>{editErrors.username}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="role">Rol</label>
              <select
                id="role"
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
              >
                {AVAILABLE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.passwordSection}>
            <p className={styles.passwordHint}>
              Deja los campos de contraseña vacíos si no deseas cambiarla
            </p>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password">Nueva contraseña</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={editForm.password}
                    onChange={handleEditChange}
                    placeholder="••••••••"
                    className={editErrors.password ? styles.inputError : ''}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {editErrors.password && (
                  <span className={styles.errorText}>{editErrors.password}</span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={editForm.confirmPassword}
                    onChange={handleEditChange}
                    placeholder="••••••••"
                    className={editErrors.confirmPassword ? styles.inputError : ''}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {editErrors.confirmPassword && (
                  <span className={styles.errorText}>{editErrors.confirmPassword}</span>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default UserCard;
