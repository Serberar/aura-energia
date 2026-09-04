import { useNavigate } from 'react-router-dom';
import styles from './UnauthorizedPage.module.scss';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Acceso denegado</h1>
        <p className={styles.message}>No tienes permisos para ver esta sección.</p>
        <button className={styles.button} onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
