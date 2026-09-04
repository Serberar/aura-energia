/**
 * Lista de ventas con filtros y paginación
 */

import type { Sale } from '@/types/sales';
import SaleCard from './SaleCard';
import SaleFilters from './SaleFilters';
import { useSales } from '../hooks';
import { exportSalesToExcel } from '@/utils/exportToExcel';
import { Button, useToast } from '@/design-system';
import styles from './SalesList.module.scss';

interface SalesListProps {
  onViewSale?: (sale: Sale) => void;
  onEditSale?: (sale: Sale) => void;
  showFilters?: boolean;
  readonly?: boolean;
}

/**
 * Componente de lista completa de ventas con filtros
 */
const SalesList = ({
  onViewSale,
  onEditSale,
  showFilters = true,
  readonly = false,
}: SalesListProps) => {
  const { sales, filters, loading, error, applyFilters, removeFilters } = useSales();
  const { showSuccess, showError } = useToast();

  const handleExport = () => {
    try {
      exportSalesToExcel(sales);
      showSuccess('Excel exportado correctamente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al exportar';
      showError(message);
    }
  };

  if (loading && sales.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error al cargar ventas: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filtros */}
      {showFilters && (
        <div className={styles.filtersSection}>
          <SaleFilters
            filters={filters}
            onApplyFilters={applyFilters}
            onClearFilters={removeFilters}
          />
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Ventas {sales.length > 0 && `(${sales.length})`}
        </h2>
        <div className={styles.headerActions}>
          {loading && <span className={styles.loadingBadge}>Actualizando...</span>}
          {sales.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
            >
              Exportar Excel
            </Button>
          )}
        </div>
      </div>

      {/* Lista */}
      {sales.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay ventas que mostrar</p>
          <p className={styles.emptyHint}>
            {Object.keys(filters).length > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Usa los filtros para buscar ventas'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {sales.map((sale) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              onView={onViewSale}
              onEdit={readonly ? undefined : onEditSale}
              showActions={!readonly || onViewSale !== undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesList;
