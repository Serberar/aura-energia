import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { saveModuleSetting } from '@/features/settings/settingsSlice';
import Button from '@/design-system/components/Button';
import styles from '../SettingsPage.module.scss';

export default function CrmSettingsPage() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const enabled   = useAppSelector((s) => s.appSettings.crmOnlineSearchEnabled);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{ text: string; ok: boolean } | null>(null);

  const handleToggle = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await dispatch(saveModuleSetting({ key: 'crm_online_search_enabled', value: !enabled })).unwrap();
      setMsg({ text: 'Configuración guardada', ok: true });
    } catch {
      setMsg({ text: 'Error al guardar. Inténtalo de nuevo.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/settings')}>
          ← Volver
        </Button>
        <h1 className={styles.title}>Módulo CRM</h1>
        <p className={styles.subtitle}>Opciones del módulo de gestión de clientes y ventas</p>
      </div>

      {/* ── Importación de datos ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Importación de datos</h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Carga masiva desde Excel</span>
            <span className={styles.settingDesc}>
              Importa clientes en bloque a partir de una hoja de cálculo. Descarga la plantilla,
              rellénala y súbela para previsualizar y confirmar la importación.
            </span>
          </div>
          <Button variant="secondary" onClick={() => navigate('/settings/crm/import')}>
            Ir a la herramienta →
          </Button>
        </div>
      </div>

      {/* ── Fuente de datos ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Fuente de datos en búsquedas</h2>
        <p className={styles.sectionInfo}>
          Cuando se busca un cliente por teléfono o DNI, el sistema puede consultar solo la base
          de datos local o también lanzar una búsqueda en el buscador online (1Skore) en paralelo.
          El buscador online consume créditos de API.
        </p>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Buscador online (1Skore)</span>
            <span className={styles.settingDesc}>
              {enabled
                ? 'Activo — cada búsqueda consulta la BD local y 1Skore en paralelo'
                : 'Inactivo — las búsquedas usan solo la base de datos local'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={saving}
            onClick={handleToggle}
            className={`${styles.toggle} ${enabled ? styles.toggleOn : styles.toggleOff}`}
          >
            <span className={styles.toggleThumb} />
            <span className={styles.toggleBtnLabel}>
              {saving ? '…' : enabled ? 'Activo' : 'Inactivo'}
            </span>
          </button>
        </div>

        {msg && (
          <p className={msg.ok ? styles.successMsg : styles.errorMsg}>{msg.text}</p>
        )}
      </div>
    </div>
  );
}
