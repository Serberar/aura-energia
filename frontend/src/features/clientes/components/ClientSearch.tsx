/**
 * Componente ClientSearch - Búsqueda unificada de clientes
 * Busca por ID, DNI o teléfono
 */

import React, { useState } from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Card from '@/design-system/components/Card';
import { clientService } from '../services/clientService';
import type { Client } from '@/types/sales';
import styles from './ClientSearch.module.scss';

export interface ClientSearchProps {
  /** Callback cuando se selecciona un cliente */
  onClientSelect?: (client: Client) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Si muestra los resultados automáticamente */
  autoShowResults?: boolean;
}

const ClientSearch: React.FC<ClientSearchProps> = ({
  onClientSelect,
  placeholder = 'Buscar por ID, DNI o teléfono...',
  autoShowResults = true,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Client[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Ingresa un valor para buscar');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await clientService.searchClient(searchValue.trim());

      // Normalizar respuesta a array
      const clientsArray = Array.isArray(response) ? response : [response];

      setResults(clientsArray);

      if (autoShowResults) {
        setShowResults(true);
      }

      if (clientsArray.length === 0) {
        setError('No se encontraron clientes');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al buscar cliente';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClientClick = (client: Client) => {
    onClientSelect?.(client);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchValue('');
    setResults([]);
    setError(null);
    setShowResults(false);
  };

  const formatPhone = (phone: string) => {
    // Formato: 612 345 678
    if (phone.length === 9) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          fullWidth
          disabled={loading}
          error={error || undefined}
        />
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleSearch}
            isLoading={loading}
            loadingText="Buscando..."
            disabled={!searchValue.trim()}
          >
            Buscar
          </Button>
          {searchValue && (
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h3>Resultados ({results.length})</h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowResults(false)}
              aria-label="Cerrar resultados"
            >
              ✕
            </button>
          </div>

          <div className={styles.resultsList}>
            {results.map((client) => (
              <Card
                key={client.id}
                variant="outlined"
                hoverable
                clickable
                onClick={() => handleClientClick(client)}
                className={styles.clientCard}
              >
                <div className={styles.clientHeader}>
                  <h4 className={styles.clientName}>
                    {client.firstName} {client.lastName}
                  </h4>
                  {client.dni && (
                    <span className={styles.dni}>DNI: {client.dni}</span>
                  )}
                </div>

                {client.email && (
                  <p className={styles.clientInfo}>
                    <span className={styles.label}>Email:</span> {client.email}
                  </p>
                )}

                {client.phones && client.phones.length > 0 && (
                  <p className={styles.clientInfo}>
                    <span className={styles.label}>Teléfonos:</span>{' '}
                    {client.phones.map(formatPhone).join(', ')}
                  </p>
                )}

                {client.businessName && (
                  <p className={styles.clientInfo}>
                    <span className={styles.label}>Empresa:</span> {client.businessName}
                  </p>
                )}

                <div className={styles.clientFooter}>
                  <span className={styles.createdAt}>
                    Creado: {new Date(client.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
