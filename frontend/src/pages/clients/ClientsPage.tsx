import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useRole } from '@/hooks/useRole';

import { ClientList } from '@/features/clientes';
import ClientForm from '@/features/clientes/components/ClientForm';
import Button from '@/design-system/components/Button';

import styles from './ClientsPage.module.scss';

import { createClient } from '@/features/clientes/clientsSlice';
import type { CreateClientData, Client } from '@/types/sales';

const ClientsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const role = useRole();

  const loading = useAppSelector((state) => state.clients.loading);

  const canEdit = role === 'administrador' || role === 'coordinador';

  const handleEdit = (client: Client) => {
    navigate(`/edit?dni=${encodeURIComponent(client.dni)}`);
  };

  // Crear cliente
  const handleCreateSubmit = async (data: CreateClientData) => {
    await dispatch(createClient(data));
    setShowCreateForm(false);
  };


  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestión de Clientes</h1>

        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
        >
          + Nuevo Cliente
        </Button>
      </div>

      <div className={styles.content}>
        <ClientList onEdit={canEdit ? handleEdit : undefined} />
      </div>

      {/* MODAL CREAR */}
      {showCreateForm && (
        <div className={styles.modal}>
          <ClientForm
            mode="create"
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateForm(false)}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
