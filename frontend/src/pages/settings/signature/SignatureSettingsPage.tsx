import { useNavigate } from 'react-router-dom';
import Button from '@/design-system/components/Button';
import styles from '../SettingsPage.module.scss';

const SignatureSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/settings')}>
          ← Volver
        </Button>
        <h1 className={styles.title}>Firma Electrónica</h1>
        <p className={styles.subtitle}>Configuración del proceso de firma de contratos</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Plantillas de contrato</h2>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Gestión de contratos</span>
            <span className={styles.settingDesc}>
              Crea y edita las plantillas de contrato que se envían al cliente para su firma.
              Personaliza el logo, los textos y las cláusulas.
            </span>
          </div>
          <Button variant="secondary" onClick={() => navigate('/settings/contract')}>
            Gestionar →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureSettingsPage;
