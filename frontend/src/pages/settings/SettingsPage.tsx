import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/reduxHooks';
import styles from './SettingsPage.module.scss';

interface CardProps {
  icon: string;
  label: string;
  desc: string;
  to: string;
  badge?: string;
  badgeColor?: string;
}

function Card({ icon, label, desc, to, badge, badgeColor }: CardProps) {
  const navigate = useNavigate();
  return (
    <button className={styles.card} onClick={() => navigate(to)}>
      <span className={styles.cardIcon}>{icon}</span>
      <span className={styles.cardLabel}>
        {label}
        {badge && (
          <span
            className={styles.cardBadge}
            style={{ background: badgeColor ?? '#3b82f6' }}
          >
            {badge}
          </span>
        )}
      </span>
      <span className={styles.cardDesc}>{desc}</span>
    </button>
  );
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { callsModuleEnabled, crmModuleEnabled, firmaModuleEnabled, crmOnlineSearchEnabled } =
    useAppSelector((s) => s.appSettings);

  const activeCount = [callsModuleEnabled, crmModuleEnabled, firmaModuleEnabled, crmOnlineSearchEnabled]
    .filter(Boolean).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración</h1>
        <p className={styles.subtitle}>Ajustes globales del sistema (solo administrador)</p>
      </div>

      {/* ── Módulos del sistema ── */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Módulos del sistema</p>
        <div className={styles.modulesHero}>
          <div className={styles.modulesHeroText}>
            <span className={styles.modulesHeroTitle}>Activar / Desactivar módulos</span>
            <span className={styles.modulesHeroDesc}>
              Habilita o deshabilita CRM, Llamadas, Buscador Online, Firma y SMS de forma independiente.
              Los cambios se aplican inmediatamente para todos los usuarios.
            </span>
          </div>
          <div className={styles.modulesHeroBadge}>
            <span className={styles.modulesHeroCount}>{activeCount}</span>
            <span className={styles.modulesHeroCountLabel}>de 4 activos</span>
          </div>
          <button
            className={styles.modulesHeroBtn}
            onClick={() => navigate('/settings/modules')}
          >
            Gestionar módulos
          </button>
        </div>
      </div>

      {/* ── Configuración por módulo ── */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Configuración por módulo</p>
        <div className={styles.cardGrid}>
          <Card
            icon="📊"
            label="Módulo CRM"
            desc="Clientes, ventas, productos y fuente de datos de búsqueda"
            to="/settings/crm"
            badge={crmModuleEnabled ? 'Activo' : 'Inactivo'}
            badgeColor={crmModuleEnabled ? '#16a34a' : '#6b7280'}
          />
          <Card
            icon="📞"
            label="Módulo de Llamadas"
            desc="Códigos de disposición, guiones, DNC y demo"
            to="/settings/calls"
            badge={callsModuleEnabled ? 'Activo' : 'Inactivo'}
            badgeColor={callsModuleEnabled ? '#16a34a' : '#6b7280'}
          />
          <Card
            icon="✍️"
            label="Firma electrónica"
            desc="Firma de contratos, plantillas, logo y cláusulas"
            to="/settings/signature"
            badge={firmaModuleEnabled ? 'Activo' : 'Inactivo'}
            badgeColor={firmaModuleEnabled ? '#16a34a' : '#6b7280'}
          />
        </div>
      </div>

      {/* ── Sistema ── */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Sistema</p>
        <div className={styles.cardGrid}>
          <Card
            icon="👥"
            label="Gestión de usuarios"
            desc="Cuentas, roles y accesos de los agentes"
            to="/users"
          />
          <Card
            icon="🔒"
            label="IPs permitidas"
            desc="Restricción de acceso por dirección IP"
            to="/settings/ips"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
