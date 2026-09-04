/**
 * Componente UserList - Lista de usuarios
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchUsers, deleteUser, updateUser } from '../usersSlice';
import UserCard from './UserCard';
import type { UpdateUserData, UserData } from '../services/userService';
import type { UserRole } from '@/types';
import styles from './UserList.module.scss';

export interface UserListProps {
  autoFetch?: boolean;
}

const ROLE_ORDER: UserRole[] = ['administrador', 'coordinador', 'verificador', 'comercial'];

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  administrador: { label: 'Administradores', color: '#dc3545' },
  coordinador: { label: 'Coordinadores', color: '#007bff' },
  verificador: { label: 'Verificadores', color: '#28a745' },
  comercial: { label: 'Comerciales', color: '#6c757d' },
};

const UserList: React.FC<UserListProps> = ({ autoFetch = true }) => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Agrupar usuarios por rol
  const usersByRole = useMemo(() => {
    const grouped: Record<UserRole, UserData[]> = {
      administrador: [],
      coordinador: [],
      verificador: [],
      comercial: [],
    };

    users.forEach((user) => {
      const role = user.role as UserRole;
      if (grouped[role]) {
        grouped[role].push(user);
      } else {
        grouped.comercial.push(user);
      }
    });

    return grouped;
  }, [users]);

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchUsers());
    }
  }, [dispatch, autoFetch]);

  const handleRetry = () => {
    dispatch(fetchUsers());
  };

  const handleDelete = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      await dispatch(deleteUser(userId)).unwrap();
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUpdate = async (userId: string, data: UpdateUserData) => {
    setUpdatingUserId(userId);
    try {
      await dispatch(updateUser({ userId, data })).unwrap();
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <h3>Error al cargar usuarios</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Usuarios</h2>
          <div className={styles.stats}>
            <span className={styles.stat}>
              Total: <strong>{users.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>No hay usuarios</h3>
            <p>Aún no hay usuarios registrados en el sistema.</p>
          </div>
        </div>
      ) : (
        <div className={styles.sections}>
          {ROLE_ORDER.map((role) => {
            const roleUsers = usersByRole[role];
            if (roleUsers.length === 0) return null;

            const config = ROLE_CONFIG[role];
            return (
              <section key={role} className={styles.roleSection}>
                <div className={styles.sectionHeader}>
                  <span
                    className={styles.sectionIndicator}
                    style={{ backgroundColor: config.color }}
                  />
                  <h3 className={styles.sectionTitle}>{config.label}</h3>
                  <span className={styles.sectionCount}>{roleUsers.length}</span>
                </div>
                <div className={styles.list}>
                  {roleUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                      isDeleting={deletingUserId === user.id}
                      isUpdating={updatingUserId === user.id}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserList;
