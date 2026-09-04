import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIpFilterMode, setIpFilterMode, getMyIp } from '@/features/allowedIps/services/allowedIpService';
import { AllowedIpList, AllowedIpForm, useAllowedIps } from '@/features/allowedIps';
import type { CreateAllowedIpData, AllowedIp, MyIpInfo } from '@/features/allowedIps/services/allowedIpService';
import Button from '@/design-system/components/Button';
import { logger } from '@/utils/logger';
import styles from '../SettingsPage.module.scss';

const IpSettingsPage = () => {
  const navigate = useNavigate();
  const [ipViewMode, setIpViewMode] = useState<'list' | 'create'>('list');
  const { ips, loading: ipsLoading, error: ipsError, addIp, removeIp } = useAllowedIps();
  const [filteringEnabled, setFilteringEnabled] = useState(false);
  const [filterModeLoading, setFilterModeLoading] = useState(true);
  const [filterModeError, setFilterModeError] = useState<string | null>(null);
  const [myIp, setMyIp] = useState<MyIpInfo | null>(null);

  useEffect(() => {
    Promise.all([getIpFilterMode(), getMyIp()])
      .then(([mode, ipInfo]) => {
        setFilteringEnabled(mode.filteringEnabled);
        setMyIp(ipInfo);
      })
      .catch(() => setFilterModeError('No se pudo cargar la configuración de acceso'))
      .finally(() => setFilterModeLoading(false));
  }, []);

  const handleToggleFiltering = async (checked: boolean) => {
    setFilteringEnabled(checked);
    setFilterModeError(null);
    try {
      await setIpFilterMode({ filteringEnabled: checked });
    } catch {
      setFilteringEnabled(!checked);
      setFilterModeError('Error al cambiar la configuración');
    }
  };

  const handleCreateIp = async (data: CreateAllowedIpData) => {
    try {
      await addIp(data);
      setIpViewMode('list');
    } catch (err) {
      logger.error('Error al crear IP', err as Error);
    }
  };

  const handleDeleteIp = async (ip: AllowedIp) => {
    if (window.confirm(`¿Eliminar la IP "${ip.ip}"${ip.description ? ` (${ip.description})` : ''}?`)) {
      try {
        await removeIp(ip.id);
      } catch (err) {
        logger.error('Error al eliminar IP', err as Error);
      }
    }
  };

  const showLockoutWarning = myIp && !myIp.alwaysAllowed && !filteringEnabled;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/settings')}>
          ← Volver
        </Button>
        <h1 className={styles.title}>IPs Permitidas</h1>
        <p className={styles.subtitle}>Control de acceso al sistema por dirección IP</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Lista de IPs permitidas</h2>
          {ipViewMode === 'list' && (
            <Button variant="primary" onClick={() => setIpViewMode('create')}>+ Añadir IP</Button>
          )}
          {ipViewMode === 'create' && (
            <Button variant="secondary" onClick={() => setIpViewMode('list')}>← Volver</Button>
          )}
        </div>

        <p className={styles.sectionInfo}>
          Las conexiones desde la red local de la oficina siempre tienen acceso.
          Los cambios se aplican de forma inmediata, sin necesidad de reiniciar nada.
        </p>

        {!filterModeLoading && (
          <div className={styles.filterModePanel}>
            <div className={styles.filterModeRow}>
              <div className={styles.filterModeLeft}>
                <p className={styles.filterModeTitle}>Control de acceso por IP</p>
                <p className={styles.filterModeDesc}>
                  {filteringEnabled
                    ? 'Activo — solo pueden acceder las IPs de la lista de abajo.'
                    : 'Desactivado — cualquier IP puede acceder al sistema.'}
                </p>
                {myIp?.ip && (
                  <p className={styles.myIpInfo}>
                    Tu IP actual: <strong>{myIp.ip}</strong>
                    {myIp.isPrivate && <span className={styles.ipBadgeSafe}> red local</span>}
                    {myIp.isWhitelisted && !myIp.isPrivate && <span className={styles.ipBadgeSafe}> en lista</span>}
                    {!myIp.alwaysAllowed && <span className={styles.ipBadgeWarn}> no está en la lista</span>}
                  </p>
                )}
              </div>
              <label className={styles.ipToggleLabel}>
                <input
                  type="checkbox"
                  checked={filteringEnabled}
                  onChange={(e) => handleToggleFiltering(e.target.checked)}
                />
                <span className={styles.ipToggleTrack} />
                <span className={styles.ipToggleText}>
                  {filteringEnabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {showLockoutWarning && (
              <p className={styles.filterModeWarning}>
                ⚠️ Tu IP actual ({myIp?.ip}) no está en la lista. Si activas el filtrado, perderás acceso al sistema. Añade tu IP primero.
              </p>
            )}
            {filterModeError && (
              <p className={styles.filterModeError}>{filterModeError}</p>
            )}
          </div>
        )}

        <div className={styles.ipContent}>
          {ipsError && <p className={styles.errorMsg}>{ipsError}</p>}
          {ipViewMode === 'list' && (
            <AllowedIpList ips={ips} onDelete={handleDeleteIp} loading={ipsLoading} />
          )}
          {ipViewMode === 'create' && (
            <AllowedIpForm
              onSubmit={handleCreateIp}
              onCancel={() => setIpViewMode('list')}
              loading={ipsLoading}
              error={ipsError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default IpSettingsPage;
