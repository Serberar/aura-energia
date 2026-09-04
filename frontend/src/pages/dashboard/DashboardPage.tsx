import React, { useState } from 'react';
import { UnifiedSearchResults } from '../../features/clientes/components/UnifiedSearchResults';
import { useUnifiedSearch } from '../../features/clientes/hooks/useUnifiedSearch';
import { Button, useToast } from '@/design-system';
import styles from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const { showWarning, showError } = useToast();

  const {
    searchResults,
    performUnifiedSearch,
    clearResults,
    removeResult,
    isAnyLoading
  } = useUnifiedSearch();

  const handleUnifiedSearch = async () => {
    if (!searchInput.trim()) {
      showWarning('Introduce un número de teléfono o DNI para buscar');
      return;
    }

    try {
      await performUnifiedSearch(searchInput.trim());
      setSearchInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error durante la búsqueda';
      showError(message);
    }
  };

  const handleClearAll = () => {
    setSearchInput('');
    clearResults();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnifiedSearch();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageMainTitle}>Búsqueda de Clientes</h2>
        <p className={styles.description}>
          Busca por teléfono o DNI
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.searchContainer}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por teléfono (666666666) o DNI (12345678Z)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <div className={styles.buttonGroup}>
            <Button
              variant="primary"
              onClick={handleUnifiedSearch}
              isLoading={isAnyLoading}
              loadingText="Buscando..."
              disabled={isAnyLoading}
            >
              Buscar
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearAll}
              disabled={isAnyLoading}
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Mostrar resultados unificados */}
        <UnifiedSearchResults
          results={searchResults}
          onRemoveResult={removeResult}
        />
      </div>
    </div>
  );
};

export default DashboardPage;