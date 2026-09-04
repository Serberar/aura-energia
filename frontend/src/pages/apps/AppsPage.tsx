import styles from './AppsPage.module.scss';

// Apps externas definidas directamente en la página
const APPS = [
  {
    id: "naturgy",
    name: "Calculadora Naturgy",
    url: "https://front-calculator.zapotek.adn.naturgy.com",
    icon: "⚡",
    description: "Calculadora de tarifas Naturgy"
  },
  {
    id: "sesame",
    name: "Sesame Time",
    url: "https://app.sesametime.com/",
    icon: "🕐",
    description: "Control de tiempo y asistencia"
  },
  {
    id: "iban",
    name: "Calcular IBAN",
    url: "https://es.iban.com",
    icon: "💳",
    description: "Calculadora de códigos IBAN"
  },
  {
    id: "neotel",
    name: "PBX Neotel",
    url: "https://pbx.neotel2000.com",
    icon: "📞",
    description: "Central telefónica PBX"
  },
  {
    id: "twist",
    name: "Twist",
    url: "https://twist.com/login",
    icon: "📨",
    description: "Comunicación en equipo"
  },
  {
    id: "drive",
    name: "Google Drive",
    url: "https://drive.google.com/drive/shared-with-me",
    icon: "💾",
    description: "Almacenamiento compartido"
  }
];

export default function AppsPage() {
  // Función para abrir app directamente aquí
  const openApp = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Aplicaciones Externas</h1>
        <p>Accede a herramientas y servicios adicionales</p>
      </div>

      <div className={styles.appsGrid}>
        {APPS.map((app) => (
          <button
            key={app.id}
            className={styles.appCard}
            onClick={() => openApp(app.url)}
            type="button"
          >
            <div className={styles.appIcon}>
              {app.icon}
            </div>
            <div className={styles.appInfo}>
              <h3 className={styles.appName}>{app.name}</h3>
              <p className={styles.appDescription}>{app.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <p>Las aplicaciones se abrirán en una nueva ventana</p>
      </div>
    </div>
  );
}