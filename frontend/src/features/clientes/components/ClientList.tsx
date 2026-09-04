/**
 * Componente ClientList - Lista de clientes con filtros
 */

import React, { useState } from 'react';
import { useClients } from '../hooks';
import { useClientActions } from '../hooks';
import ClientCard from './ClientCard';
import { useToast } from '@/design-system';
import type { Client } from '@/types/sales';
import styles from './ClientList.module.scss';

export interface ClientListProps {
  /** Callback al hacer click en editar */
  onEdit?: (client: Client) => void;
  /** Callback al hacer click en crear */
  onCreate?: () => void;
  /** Callback al hacer click en un cliente */
  onClientClick?: (client: Client) => void;
  /** Si se debe auto-cargar al montar */
  autoFetch?: boolean;
  /** Vista (grid o list) */
  view?: 'grid' | 'list';
}

const ClientList: React.FC<ClientListProps> = ({
  onEdit,
  onCreate,
  onClientClick,
  autoFetch = true,
  view = 'grid',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { showError } = useToast();

  const { clients, loading, error, refresh } = useClients({
    autoFetch,
    searchTerm,
  });

  const { searchClient } = useClientActions();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      await searchClient(searchTerm.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al buscar cliente';
      showError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <h3>Error al cargar clientes</h3>
          <p>{error}</p>
          <button onClick={refresh} className={styles.retryButton}>
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
          <div className={styles.stats}>
            <span className={styles.stat}>
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar por DNI, teléfono o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className={styles.clearButton}>
              ✕
            </button>
          )}
          <button
            onClick={handleSearch}
            className={styles.searchButton}
            disabled={!searchTerm.trim() || isSearching}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {onCreate && (
          <button onClick={onCreate} className={styles.createButton}>
            + Nuevo Cliente
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>Búsqueda de clientes</h3>
            <p>
              {searchTerm
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'Filtra por DNI, teléfono o ID'}
            </p>
          </div>
        </div>
      ) : (
        <div className={`${styles.list} ${styles[view]}`}>
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEdit}
              onClick={onClientClick}
              compact={view === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientList;
