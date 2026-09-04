# Documentación Técnica - Frontend CRM

## Introducción

Este documento proporciona la documentación técnica completa del frontend del sistema CRM. La aplicación está desarrollada con React 19 y utiliza una arquitectura basada en features para organizar el código de forma modular y mantenible.

---

## Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Librería de UI |
| Vite | 7.x | Build tool y dev server |
| TypeScript | 5.8 | Tipado estático |
| Redux Toolkit | 2.x | Gestión de estado global |
| React Router | 7.x | Enrutamiento |
| Axios | 1.x | Cliente HTTP |
| Zod | 4.x | Validación de esquemas |
| SCSS Modules | - | Estilos encapsulados |
| Vitest | 4.x | Testing |

---

## Requisitos del Sistema

- Node.js >= 18.0.0
- npm >= 9.0.0

---

## Instalación

```bash
# Ir al directorio del frontend
cd frontend-buscador/code-front

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173` por defecto.

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `build` | `npm run build` | Compila para producción |
| `preview` | `npm run preview` | Preview del build de producción |
| `test` | `npm run test` | Ejecuta tests con Vitest |
| `test:ui` | `npm run test:ui` | Tests con interfaz visual |
| `test:coverage` | `npm run test:coverage` | Genera reporte de cobertura |
| `lint` | `npm run lint` | Analiza el código con ESLint |

---

## Estructura del Proyecto

```
code-front/
├── public/                    # Archivos estáticos
├── src/
│   ├── api/                   # Configuración de Axios
│   │   └── axios.ts
│   ├── assets/                # Imágenes y recursos
│   ├── components/            # Componentes compartidos
│   │   ├── LazyErrorBoundary.tsx
│   │   └── LoadingComponents.tsx
│   ├── design-system/         # Sistema de diseño
│   │   └── components/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── ...
│   ├── features/              # Módulos funcionales
│   │   ├── auth/              # Autenticación
│   │   ├── clientes/          # Gestión de clientes
│   │   ├── products/          # Gestión de productos
│   │   ├── sales/             # Gestión de ventas
│   │   └── saleStatus/        # Estados de venta
│   ├── hooks/                 # Hooks personalizados
│   │   ├── reduxHooks.ts
│   │   ├── useAsyncState.ts
│   │   └── useRole.ts
│   ├── layouts/               # Layouts de página
│   │   └── Layout.tsx
│   ├── pages/                 # Páginas de la aplicación
│   │   ├── apps/
│   │   ├── clients/
│   │   ├── crm-dashboard/
│   │   ├── dashboard/
│   │   ├── editClients/
│   │   ├── login/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── sale-status/
│   │   └── unauthorized/
│   ├── routes/                # Configuración de rutas
│   │   ├── AppRoutes.tsx
│   │   ├── PrivateRoute.tsx
│   │   ├── routesConfig.tsx
│   │   └── menuConfig.ts
│   ├── store/                 # Configuración de Redux
│   │   └── store.ts
│   ├── types/                 # Tipos TypeScript
│   │   ├── index.ts
│   │   └── sales.ts
│   ├── validation/            # Esquemas de validación Zod
│   │   └── index.ts
│   ├── App.tsx                # Componente raíz
│   └── main.tsx               # Punto de entrada
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Índice de Documentación

1. [Arquitectura del Sistema](./arquitectura.md)
   - Organización del código
   - Feature-based architecture
   - Patrones de diseño

2. [Catálogo de Componentes](./componentes.md)
   - Design System
   - Componentes por feature

3. [Gestión de Estado](./estado.md)
   - Redux Toolkit
   - Slices y thunks
   - Hooks personalizados

4. [Sistema de Rutas](./rutas.md)
   - Configuración de rutas
   - Protección por rol
   - Navegación

5. [Sistema de Estilos](./estilos.md)
   - SCSS Modules
   - Variables y mixins
   - Responsive design

---

## Características Principales

### Lazy Loading

Las páginas se cargan bajo demanda para optimizar el rendimiento inicial:

```tsx
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
```

### Code Splitting

Vite divide automáticamente el código en chunks para cargas más rápidas.

### Autenticación

Sistema completo de autenticación con:
- Login/Logout
- Refresh automático de tokens
- Protección de rutas por rol

### Roles de Usuario

El sistema soporta 4 roles:
- **Administrador**: Acceso completo
- **Coordinador**: Supervisión de operaciones
- **Verificador**: Verificación de ventas
- **Comercial**: Registro de ventas

---

## Conexión con el Backend

La aplicación se conecta al backend mediante Axios con interceptores para:
- Añadir token de autenticación
- Refresh automático de tokens expirados
- Manejo centralizado de errores

```typescript
// src/api/axios.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});
```

---

## Variables de Entorno

```bash
# URL del backend
VITE_API_URL=http://localhost:3000/api
```

Crear archivo `.env` en la raíz del proyecto frontend:

```bash
VITE_API_URL=http://localhost:3000/api
```

---

## Build de Producción

```bash
# Generar build optimizado
npm run build

# Los archivos se generan en dist/
```

El build genera:
- Archivos minificados
- Code splitting automático
- Assets optimizados
- Source maps (configurables)
