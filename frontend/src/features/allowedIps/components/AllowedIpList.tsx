import type { AllowedIp } from '../services/allowedIpService';
import Button from '@/design-system/components/Button';
import styles from './AllowedIpList.module.scss';

interface AllowedIpListProps {
  ips: AllowedIp[];
  onDelete: (ip: AllowedIp) => void;
  loading?: boolean;
}

const AllowedIpList = ({ ips, onDelete, loading = false }: AllowedIpListProps) => {
  if (loading && ips.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando IPs...</p>
      </div>
    );
  }

  if (ips.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay IPs permitidas configuradas</p>
        <p className={styles.emptyHint}>
          Recuerda que las IPs privadas (red local) y la IP de emergencia del .env siempre tienen acceso
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>IPs Permitidas ({ips.length})</h3>

      <ul className={styles.list}>
        {ips.map((ip) => (
          <li key={ip.id} className={styles.item}>
            <div className={styles.ipInfo}>
              <span className={styles.ip}>{ip.ip}</span>
              {ip.description && (
                <span className={styles.description}>{ip.description}</span>
              )}
              <span className={styles.date}>
                {new Date(ip.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className={styles.actions}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(ip)}
                title={`Eliminar IP: ${ip.ip}`}
              >
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllowedIpList;
