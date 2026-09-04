import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import styles from './Table.module.scss';

export interface TableColumn<T = any> {
  /** Identificador único de la columna */
  key: string;
  /** Título de la columna */
  title: string;
  /** Clave del dato a mostrar o función render */
  dataIndex?: keyof T;
  /** Función personalizada para renderizar la celda */
  render?: (value: any, record: T, index: number) => ReactNode;
  /** Si la columna es ordenable */
  sortable?: boolean;
  /** Ancho de la columna */
  width?: string | number;
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';
  /** Si la columna está fija */
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> {
  /** Columnas de la tabla */
  columns: TableColumn<T>[];
  /** Datos a mostrar */
  data: T[];
  /** Callback al hacer click en una fila */
  onRowClick?: (record: T, index: number) => void;
  /** Si se muestra el loading state */
  loading?: boolean;
  /** Mensaje cuando no hay datos */
  emptyText?: string;
  /** Si la tabla es compacta */
  compact?: boolean;
  /** Si la tabla tiene bordes */
  bordered?: boolean;
  /** Si las filas tienen hover */
  hoverable?: boolean;
  /** Si las filas son seleccionables */
  selectable?: boolean;
  /** Filas seleccionadas (array de índices) */
  selectedRows?: number[];
  /** Callback al cambiar la selección */
  onSelectionChange?: (selectedIndices: number[]) => void;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente Table del Design System
 *
 * Tabla responsive y reutilizable con soporte para ordenamiento,
 * selección de filas y renderizado personalizado.
 *
 * @example
 * ```tsx
 * const columns = [
 *   { key: 'name', title: 'Nombre', dataIndex: 'name', sortable: true },
 *   { key: 'age', title: 'Edad', dataIndex: 'age', align: 'center' },
 *   {
 *     key: 'actions',
 *     title: 'Acciones',
 *     render: (_, record) => <Button onClick={() => edit(record)}>Editar</Button>
 *   }
 * ];
 *
 * <Table columns={columns} data={users} onRowClick={handleRowClick} />
 * ```
 */
export const Table = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyText = 'No hay datos',
  compact = false,
  bordered = false,
  hoverable = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  className = '',
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const column = columns.find((col) => col.key === sortConfig.key);
      if (!column || !column.dataIndex) return 0;

      const aValue = a[column.dataIndex];
      const bValue = b[column.dataIndex];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig, columns]);

  const handleRowSelection = (index: number) => {
    if (!onSelectionChange) return;

    const newSelection = selectedRows.includes(index)
      ? selectedRows.filter((i) => i !== index)
      : [...selectedRows, index];

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedRows.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((_, index) => index));
    }
  };

  const tableClasses = [
    styles.table,
    compact && styles.compact,
    bordered && styles.bordered,
    hoverable && styles.hoverable,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <div className={styles.spinnerCircle}></div>
        </div>
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={tableClasses}>
        <thead>
          <tr>
            {selectable && (
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  aria-label="Seleccionar todo"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={[
                  styles.th,
                  column.align && styles[`align-${column.align}`],
                  column.sortable && styles.sortable,
                ].filter(Boolean).join(' ')}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={styles.thContent}>
                  <span>{column.title}</span>
                  {column.sortable && (
                    <span className={styles.sortIcon}>
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((record, index) => (
            <tr
              key={index}
              className={[
                styles.tr,
                onRowClick && styles.clickable,
                selectedRows.includes(index) && styles.selected,
              ].filter(Boolean).join(' ')}
              onClick={() => onRowClick?.(record, index)}
            >
              {selectable && (
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(index)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRowSelection(index);
                    }}
                    aria-label={`Seleccionar fila ${index + 1}`}
                  />
                </td>
              )}
              {columns.map((column) => {
                const value = column.dataIndex ? record[column.dataIndex] : undefined;
                const content = column.render
                  ? column.render(value, record, index)
                  : value;

                return (
                  <td
                    key={column.key}
                    className={[
                      styles.td,
                      column.align && styles[`align-${column.align}`],
                    ].filter(Boolean).join(' ')}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;