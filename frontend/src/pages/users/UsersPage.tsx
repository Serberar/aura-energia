/**
 * Página de gestión de usuarios
 */

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';

import { UserList, UserForm } from '@/features/users';
import Button from '@/design-system/components/Button';

import styles from './UsersPage.module.scss';

import { createUser } from '@/features/users/usersSlice';
import type { CreateUserData } from '@/features/users/services/userService';

const UsersPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.users.loading);

  const handleCreateSubmit = async (data: CreateUserData) => {
    await dispatch(createUser(data));
    setShowCreateForm(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>

        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
        >
          + Nuevo Usuario
        </Button>
      </div>

      <div className={styles.content}>
        <UserList />
      </div>

      {/* MODAL CREAR */}
      {showCreateForm && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <UserForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowCreateForm(false)}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
