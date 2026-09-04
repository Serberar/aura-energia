import { memo } from 'react';
import type { Sale } from '@/types/sales';
import { SaleStatusBadge } from '@/features/saleStatus';
import Button from '@/design-system/components/Button';
import styles from './SaleCard.module.scss';

const SIGNATURE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  signed:   { label: '✓ Firmada',   bg: '#d4edda', color: '#155724' },
  pending:  { label: '⏳ Pendiente', bg: '#fff3cd', color: '#856404' },
  rejected: { label: '✗ Rechazada', bg: '#f8d7da', color: '#721c24' },
};

interface SaleCardProps {
  sale: Sale;
  onView?: (sale: Sale) => void;
  onEdit?: (sale: Sale) => void;
  showActions?: boolean;
}

/**
 * Componente memoizado para evitar re-renders innecesarios en listas
 */
const SaleCard = memo(function SaleCard({ sale, onView, onEdit, showActions = true }: SaleCardProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ✔ FIX: fallback seguro si el backend NO envía sale.status
  const status = sale.status ?? {
    name: sale.statusId,
    color: '#6c757d',
    isFinal: false,
  };

  // Obtener el nombre del cliente del snapshot
  const clientName = sale.client
    ? `${sale.client.firstName} ${sale.client.lastName}`
    : 'Sin cliente';

  return (
    <div className={styles.card}>
      {/* HEADER: ID y Estado */}
      <div className={styles.header}>
        <div className={styles.id}>
          <span className={styles.idLabel}>ID:</span>
          <span className={styles.idValue}>{sale.id.substring(0, 8)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SaleStatusBadge
            name={status.name}
            color={status.color}
            isFinal={status.isFinal}
            size="md"
          />
          {(() => {
            const sigStatus = sale.signatureRequest?.status;
            const badge = sigStatus ? SIGNATURE_BADGE[sigStatus] : null;
            if (badge) {
              return (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </span>
              );
            }
            return (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: '#fdecea',
                color: '#b71c1c',
                whiteSpace: 'nowrap',
              }}>
                Sin firma
              </span>
            );
          })()}
        </div>
      </div>

      {/* CLIENTE */}
      <div className={styles.clientSection}>
        <span className={styles.clientLabel}>Cliente:</span>
        <span className={styles.clientName}>{clientName}</span>
      </div>

      {/* FECHAS */}
      <div className={styles.dates}>
        <div className={styles.dateItem}>
          <span className={styles.dateLabel}>Creada:</span>
          <span className={styles.dateValue}>{formatDateTime(sale.createdAt)}</span>
        </div>

        {sale.closedAt && (
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Cerrada:</span>
            <span className={styles.dateValue}>{formatDate(sale.closedAt)}</span>
          </div>
        )}
      </div>

      {/* USUARIO ASIGNADO */}
      {sale.user && (
        <div className={styles.user}>
          <span className={styles.userLabel}>Comercial:</span>
          <span className={styles.userName}>
            {sale.user.firstName} {sale.user.lastName}
          </span>
        </div>
      )}

      {/* ACCIONES */}
      {showActions && (
        <div className={styles.actions}>
          {onView && (
            <Button variant="primary" size="md" onClick={() => onView(sale)}>
              Ver
            </Button>
          )}

          {onEdit && (
            <Button variant="secondary" size="md" onClick={() => onEdit(sale)}>
              Editar
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

export default SaleCard;
