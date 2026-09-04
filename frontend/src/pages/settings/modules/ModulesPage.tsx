import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { saveModuleSetting } from '@/features/settings/settingsSlice';
import styles from './ModulesPage.module.scss';

interface ModuleCardProps {
  title:       string;
  description: string;
  detail:      string;
  settingKey:  string;
  enabled:     boolean;
  accent:      string;
  icon:        string;
}

function ModuleCard({ title, description, detail, settingKey, enabled, accent, icon }: ModuleCardProps) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{ text: string; ok: boolean } | null>(null);

  const handleToggle = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await dispatch(saveModuleSetting({ key: settingKey, value: !enabled })).unwrap();
      setMsg({ text: `Módulo ${!enabled ? 'activado' : 'desactivado'} correctamente`, ok: true });
    } catch {
      setMsg({ text: 'Error al guardar. Inténtalo de nuevo.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${enabled ? styles.cardOn : styles.cardOff}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div className={styles.cardTop}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.cardInfo}>
          <span className={styles.cardTitle}>{title}</span>
          <span className={styles.cardDesc}>{description}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={saving}
          onClick={handleToggle}
          className={`${styles.toggle} ${enabled ? styles.toggleOn : styles.toggleOff}`}
        >
          <span className={styles.thumb} />
          <span className={styles.toggleLabel}>{saving ? '…' : enabled ? 'Activo' : 'Inactivo'}</span>
        </button>
      </div>

      <p className={styles.detail}>{detail}</p>

      {msg && (
        <p className={msg.ok ? styles.success : styles.error}>{msg.text}</p>
      )}
    </div>
  );
}

export default function ModulesPage() {
  const { callsModuleEnabled, crmModuleEnabled, firmaModuleEnabled, crmOnlineSearchEnabled } =
    useAppSelector((s) => s.appSettings);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Módulos del sistema</h1>
        <p className={styles.subtitle}>
          Activa o desactiva cada módulo. Los cambios se aplican inmediatamente
          para todos los usuarios sin necesidad de reiniciar.
        </p>
      </div>

      <div className={styles.grid}>
        <ModuleCard
          icon="🗂"
          title="CRM"
          description="Gestión de clientes, ventas y productos"
          detail="Incluye la ficha de cliente, el pipeline de ventas, los estados de venta, el catálogo de productos y el historial de operaciones."
          settingKey="crm_module_enabled"
          enabled={crmModuleEnabled}
          accent="#3b82f6"
        />
        <ModuleCard
          icon="📞"
          title="Gestor de Llamadas"
          description="Click-to-call, agenda y panel de supervisor"
          detail="Activa el widget de llamadas en todas las páginas, el botón click-to-call en las fichas de venta, la agenda de citas y el panel de supervisión en tiempo real."
          settingKey="calls_module_enabled"
          enabled={callsModuleEnabled}
          accent="#8b5cf6"
        />
        <ModuleCard
          icon="🔍"
          title="Buscador Online"
          description="Búsqueda de clientes en plataformas externas"
          detail="Activa la búsqueda online a través de Skore al consultar un teléfono o DNI. Cuando está desactivado, la búsqueda solo consulta la base de datos local."
          settingKey="crm_online_search_enabled"
          enabled={crmOnlineSearchEnabled}
          accent="#06b6d4"
        />
        <ModuleCard
          icon="✍️"
          title="Firma Electrónica"
          description="Firma digital de contratos con el cliente"
          detail="Activa el proceso de firma electrónica al crear ventas. Permite enviar el contrato al cliente para su firma y gestionar las plantillas de contrato."
          settingKey="firma_module_enabled"
          enabled={firmaModuleEnabled}
          accent="#f59e0b"
        />
      </div>
    </div>
  );
}
