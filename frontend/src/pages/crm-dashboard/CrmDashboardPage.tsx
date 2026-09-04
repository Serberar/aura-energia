/**
 * Dashboard del CRM con estadísticas y acceso rápido
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import { useSales } from '@/features/sales';
import { useProducts } from '@/features/products';
import { useSaleStatus } from '@/features/saleStatus';
import { getSalesStats } from '@/features/sales/services/saleService';
import type { SalesStats } from '@/types/sales';
import Button from '@/design-system/components/Button';
import styles from './CrmDashboardPage.module.scss';

const CrmDashboardPage = () => {
  const navigate = useNavigate();
  const { sales, loadSales } = useSales();
  const { products } = useProducts();
  const { statuses } = useSaleStatus();

  const activeProducts = products.filter((p) => p.active).length;

  // Estado para estadísticas del backend
  const [salesStats, setSalesStats] = useState<SalesStats>({ daily: 0, weekly: 0, monthly: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Cargar ventas recientes y estadísticas del backend
  useEffect(() => {
    loadSales();

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getSalesStats();
        setSalesStats(data);
      } catch (error) {
        logger.error('Error al cargar estadísticas', error as Error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [loadSales]);

  const stats = [
    {
      label: 'Ventas Hoy',
      value: statsLoading ? '...' : salesStats.daily,
      subtitle: 'Productos vendidos hoy',
      color: '#3b82f6',
      action: () => navigate('/sales'),
    },
    {
      label: 'Ventas Semana',
      value: statsLoading ? '...' : salesStats.weekly,
      subtitle: 'Productos esta semana',
      color: '#667eea',
      action: () => navigate('/sales'),
    },
    {
      label: 'Ventas Mes',
      value: statsLoading ? '...' : salesStats.monthly,
      subtitle: 'Productos este mes',
      color: '#10b981',
      action: () => navigate('/sales'),
    },
    {
      label: 'Productos',
      value: products.length,
      subtitle: `${activeProducts} activos`,
      color: '#28a745',
      action: () => navigate('/products'),
    },
    {
      label: 'Estados',
      value: statuses.length,
      subtitle: 'Estados de venta',
      color: '#f59e0b',
      action: () => navigate('/sale-status'),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard CRM</h1>
        <p className={styles.subtitle}>Vista general del sistema de ventas</p>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className={styles.statCard}
            style={{ borderLeftColor: stat.color }}
            onClick={stat.action}
          >
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statSubtitle}>{stat.subtitle}</span>
            </div>
            <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
              →
            </div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className={styles.quickAccess}>
        <h2 className={styles.sectionTitle}>Accesos Rápidos</h2>
        <div className={styles.actionsGrid}>
          <Button variant="primary" onClick={() => navigate('/sales/create')}>
            + Nueva Venta
          </Button>
          <Button variant="secondary" onClick={() => navigate('/clients')}>
            Ver Clientes
          </Button>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Ver Productos
          </Button>
          <Button variant="secondary" onClick={() => navigate('/sales')}>
            Ver Ventas
          </Button>
          <Button variant="secondary" onClick={() => navigate('/sale-status')}>
            Gestionar Estados
          </Button>
        </div>
      </div>

      {/* Ventas recientes */}
      {sales.length > 0 && (
        <div className={styles.recentSales}>
          <h2 className={styles.sectionTitle}>Ventas Recientes</h2>
          <div className={styles.salesList}>
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className={styles.saleItem}
                onClick={() => navigate(`/sales/${sale.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.saleInfo}>
                  <span className={styles.saleId}>
                    <span className={styles.label}>ID:</span> #{sale.id.substring(0, 8)}
                  </span>
                  <span className={styles.saleClient}>
                    <span className={styles.label}>Cliente:</span>{' '}
                    {sale.client
                      ? `${sale.client.firstName} ${sale.client.lastName}`
                      : 'N/A'}
                  </span>
                </div>
                {sale.status && (
                  <span
                    className={styles.saleStatus}
                    style={{ backgroundColor: sale.status.color || '#6b7280' }}
                  >
                    {sale.status.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmDashboardPage;
