import React from 'react';
import { useAppSelector } from '@/hooks/reduxHooks';
import { CrmResults } from './CrmResults';
import { SkoreResults } from './SkoreResults';
import type { UnifiedSearchResult } from '../hooks/useUnifiedSearch';
import styles from './SearchResults.module.scss';

interface UnifiedSearchResultsProps {
  results: UnifiedSearchResult[];
  onRemoveResult: (searchTerm: string) => void;
}

export const UnifiedSearchResults: React.FC<UnifiedSearchResultsProps> = ({
  results,
  onRemoveResult,
}) => {
  const onlineSearchEnabled = useAppSelector((s) => s.appSettings.crmOnlineSearchEnabled);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={styles.searchResultsContainer}>
      {results.map((result, index) => (
        <div key={`${result.searchTerm}-${index}`}>
          <div className={styles.searchHeader}>
            <span className={styles.searchTerm}>
              Resultados para: "{result.searchTerm}"
            </span>
            <button
              className={styles.removeButton}
              onClick={() => onRemoveResult(result.searchTerm)}
              title="Eliminar estos resultados"
            >
              ✕
            </button>
          </div>

          {result.isLoading ? (
            <div className={styles.loadingResult}>
              <div className={styles.loadingSpinner}></div>
              {onlineSearchEnabled ? 'Buscando en base de datos local y online...' : 'Buscando en base de datos local...'}
            </div>
          ) : (
            <>
              {result.error && (
                <div className={styles.errorResult}>
                  Error: {result.error}
                </div>
              )}

              {/* Resultados del CRM local */}
              <CrmResults
                clients={result.crmClients}
                searchTerm={result.searchTerm}
              />

              {/* Resultados de 1Skore — solo si el buscador online está activo */}
              {onlineSearchEnabled && (
                <SkoreResults
                  results={result.skoreResults}
                  searchTerm={result.searchTerm}
                />
              )}

              {!result.error &&
               result.crmClients.length === 0 &&
               (!onlineSearchEnabled || result.skoreResults.length === 0) && (
                <div className={styles.noResults}>
                  <p>No se encontraron resultados</p>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};