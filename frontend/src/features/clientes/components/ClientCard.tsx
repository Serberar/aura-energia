/**
 * Componente ClientCard - Tarjeta individual de cliente
 */

import React from 'react';
import Card from '@/design-system/components/Card';
import Button from '@/design-system/components/Button';
import type { Client } from '@/types/sales';
import styles from './ClientCard.module.scss';

export interface ClientCardProps {
  /** Cliente a mostrar */
  client: Client;
  /** Callback al hacer click en editar */
  onEdit?: (client: Client) => void;
  /** Si se debe mostrar acciones */
  showActions?: boolean;
  /** Si está en modo compacto */
  compact?: boolean;
  /** Callback al hacer click en la tarjeta */
  onClick?: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  showActions = true,
  compact = false,
  onClick,
}) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card
      variant="outlined"
      hoverable={!!onClick}
      clickable={!!onClick}
      onClick={() => onClick?.(client)}
      className={`${styles.clientCard} ${compact ? styles.compact : ''}`}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.name}>
            {client.firstName} {client.lastName}
          </h3>
          {client.businessName && (
            <span className={styles.businessBadge}>{client.businessName}</span>
          )}
        </div>
        {client.dni && <span className={styles.dni}>DNI: {client.dni}</span>}
      </div>

      {!compact && (
        <div className={styles.details}>
          {client.email && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email:</span>
              <span className={styles.detailValue}>{client.email}</span>
            </div>
          )}

          {client.phones && client.phones.length > 0 && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Teléfono:</span>
              <span className={styles.detailValue}>{client.phones[0]}</span>
              {client.phones.length > 1 && (
                <span className={styles.detailExtra}>+{client.phones.length - 1} más</span>
              )}
            </div>
          )}

          {client.birthday && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>F. Nacimiento:</span>
              <span className={styles.detailValue}>{formatDate(client.birthday)}</span>
            </div>
          )}

          {client.addresses && client.addresses.length > 0 && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Dirección:</span>
              <span className={styles.detailValue}>{client.addresses[0].address}</span>
              {client.addresses.length > 1 && (
                <span className={styles.detailExtra}>+{client.addresses.length - 1} más</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.createdAt}>
          Creado: {formatDate(client.createdAt)}
        </span>

        {showActions && onEdit && (
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            >
              Editar →
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientCard;
