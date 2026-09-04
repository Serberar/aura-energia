# Backend CRM Elite - Sistema de Gestión de Ventas

Backend robusto y escalable para sistema CRM construido con TypeScript, Express, Prisma y arquitectura hexagonal.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-green.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-blueviolet.svg)](https://www.prisma.io/)
[![Test Coverage](https://img.shields.io/badge/coverage-83.68%25-brightgreen.svg)](https://github.com/your-repo)
[![Tests](https://img.shields.io/badge/tests-592%20passing-success.svg)](https://github.com/your-repo)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Testing](#-testing)
- [Documentación](#-documentación)
- [Estructura del Proyecto](#-estructura-del-proyecto)

## ✨ Características

### Funcionalidades Core

- 🔐 **Autenticación JWT** con refresh tokens
- 👥 **Sistema de Roles** (Administrador, Coordinador, Verificador, Comercial)
- 🛡️ **Autorización basada en permisos** por rol y use case
- 📦 **Gestión de Productos** (CRUD, activar/desactivar, duplicar)
- 💰 **Sistema de Ventas** completo con items y estados configurables
- 👤 **Gestión de Clientes** con búsqueda múltiple (ID, DNI, teléfono)
- 📊 **Estados de Venta** personalizables y reordenables
- 🔍 **Filtrado avanzado** de ventas por cliente, estado y fechas

### Características Técnicas

- ⚡ **Alta Performance** con circuit breakers y timeouts
- 📈 **Observabilidad** completa (logs, métricas Prometheus, OpenTelemetry)
- 🧪 **Cobertura de Tests** del 83.68% (592 tests)
- 🏗️ **Arquitectura Hexagonal** (Clean Architecture)
- ✅ **Validación de datos** con Zod
- 🔄 **Migraciones de BD** con Prisma
- 🚀 **Preparado para producción**

## 🏛️ Arquitectura

Este proyecto sigue **Arquitectura Hexagonal (Clean Architecture)** con separación clara de capas:

```
┌─────────────────────────────────────────────────┐
│           INTERFACES (HTTP/CLI)                 │
│  Controllers, Routes, Middleware, Validation    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           APPLICATION LAYER                     │
│  Use Cases (Business Logic), Authorization      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              DOMAIN LAYER                       │
│  Entities, Repository Interfaces, Domain Logic  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         INFRASTRUCTURE LAYER                    │
│  Prisma Repos, Database, External Services      │
└─────────────────────────────────────────────────┘
```

### Ventajas de esta arquitectura

- ✅ **Testeable**: Fácil de mockear dependencias
- ✅ **Mantenible**: Responsabilidades claramente definidas
- ✅ **Escalable**: Agregar features sin romper código existente
- ✅ **Independiente de frameworks**: Core business logic desacoplado

## 🛠️ Tecnologías

### Core

- **Node.js** 18+ - Runtime JavaScript
- **TypeScript** 5.x - Tipado estático
- **Express** 4.x - Framework web
- **Prisma** 5.x - ORM y migraciones de BD
- **PostgreSQL** - Base de datos

### Autenticación & Seguridad

- **jsonwebtoken** - Tokens JWT
- **bcryptjs** - Hash de contraseñas
- **zod** - Validación de schemas
- **helmet** - Headers de seguridad HTTP
- **cors** - Control de acceso CORS

### Observabilidad

- **winston** - Logging estructurado
- **prom-client** - Métricas Prometheus
- **@opentelemetry** - Distributed tracing
- **morgan** - HTTP request logging

### Resiliencia

- **opossum** - Circuit breaker pattern
- **redis** - Caché y rate limiting

### Testing

- **jest** - Framework de testing
- **supertest** - Tests de integración HTTP
- **ts-jest** - Soporte TypeScript para Jest

### DevOps

- **ts-node-dev** - Hot reload desarrollo
- **eslint** + **prettier** - Code quality
- **husky** - Git hooks

## 📦 Instalación

### Prerrequisitos

- Node.js 18 o superior
- PostgreSQL 14+
- Redis (opcional, para rate limiting)
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd backend-buscador/code-back
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

# JWT
JWT_SECRET="tu-secret-super-seguro"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# CORS
ALLOW_ALL_CORS=true
CORS1="http://localhost:5173"

# Observability (opcional)
OTEL_ENABLED=false
```

4. **Ejecutar migraciones**
```bash
npx prisma migrate dev
```

5. **Seed inicial (opcional)**
```bash
npx prisma db seed
```

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Producción

```bash
# Build
npm run build

# Start
npm start
```

### Otros comandos

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check

# Tests
npm test

# Tests con coverage
npm test -- --coverage

# Generar estructura del proyecto
npm run estructura
```

## 🧪 Testing

Este proyecto tiene una cobertura de **83.68%** con **592 tests** pasando.

### Tipos de Tests

1. **Unit Tests** - Tests de casos de uso y entidades
2. **Integration Tests** - Tests de controladores
3. **E2E Tests** - Tests de rutas completas con HTTP

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm test -- --coverage

# Tests específicos
npm test -- UserController

# Tests de integración
npm test -- __test__/integration/

# Watch mode
npm test -- --watch
```

### Cobertura por Módulo

| Módulo | Cobertura |
|--------|-----------|
| Use Cases | 100% ✅ |
| Repositories | 100% ✅ |
| Controllers | 96.59% ✅ |
| Domain Entities | 86.33% ✅ |
| Overall | 83.68% ✅ |

## 📚 Documentación

### Para Desarrolladores Frontend

- **[Frontend Guide](docs/FRONTEND_GUIDE.md)** - Guía completa para integrar con el frontend
- **[API Documentation](docs/API.md)** - Todas las rutas, payloads y respuestas
- **[Authentication Flow](docs/AUTHENTICATION.md)** - Flujo de autenticación y JWT

### Para Desarrolladores Backend

- **[Testing Guide](docs/TESTING.md)** - Guía para escribir tests
- **[Architecture](docs/ARCHITECTURE.md)** - Decisiones de arquitectura
- **[Roadmap](docs/ROADMAP.md)** - Plan de desarrollo

### API Endpoints

#### Autenticación
```
POST   /api/users/register    - Registrar usuario
POST   /api/users/login       - Iniciar sesión
POST   /api/users/refresh     - Refrescar token
POST   /api/users/logout      - Cerrar sesión
```

#### Productos
```
GET    /api/products          - Listar productos
GET    /api/products/:id      - Obtener producto
POST   /api/products          - Crear producto
PUT    /api/products/:id      - Actualizar producto
PATCH  /api/products/:id/toggle - Activar/desactivar
POST   /api/products/:id/duplicate - Duplicar producto
```

#### Clientes
```
GET    /api/clients/:value    - Buscar por ID/DNI/teléfono
POST   /api/clients           - Crear cliente
PUT    /api/clients/:id       - Actualizar cliente
POST   /api/clients/:id/push  - Añadir datos (teléfono, dirección, etc.)
```

#### Estados de Venta
```
GET    /api/sale-status       - Listar estados
POST   /api/sale-status       - Crear estado
PUT    /api/sale-status/:id   - Actualizar estado
POST   /api/sale-status/reorder - Reordenar estados
```

#### Ventas
```
GET    /api/sales             - Listar con filtros
POST   /api/sales             - Crear venta
POST   /api/sales/:id/items   - Añadir item
PUT    /api/sales/:id/items/:itemId - Actualizar item
DELETE /api/sales/:id/items/:itemId - Eliminar item
PATCH  /api/sales/:id/status  - Cambiar estado
```

#### Monitoreo
```
GET    /health                - Health check
GET    /metrics               - Métricas Prometheus
```

Ver [API.md](docs/API.md) para ejemplos completos con payloads y respuestas.

## 📁 Estructura del Proyecto

```
src/
├── application/              # Capa de aplicación
│   ├── shared/              # Código compartido
│   │   ├── authorization/   # Sistema de permisos
│   │   └── types/           # Tipos compartidos
│   └── use-cases/           # Casos de uso (business logic)
│       ├── client/          # Gestión de clientes
│       ├── product/         # Gestión de productos
│       ├── sale/            # Gestión de ventas
│       ├── saleStatus/      # Estados de venta
│       └── user/            # Autenticación y usuarios
│
├── domain/                   # Capa de dominio
│   ├── entities/            # Entidades de negocio
│   └── repositories/        # Interfaces de repositorios
│
├── infrastructure/           # Capa de infraestructura
│   ├── config/              # Configuración
│   ├── container/           # Dependency Injection
│   ├── express/             # Express app
│   │   ├── controllers/     # Controladores HTTP
│   │   ├── middleware/      # Middleware (auth, errors, etc.)
│   │   └── validation/      # Schemas Zod
│   ├── observability/       # Logs, métricas, tracing
│   ├── prisma/              # Repositorios Prisma
│   ├── resilience/          # Circuit breakers
│   └── routes/              # Definición de rutas
│
└── server.ts                 # Entry point

__test__/                     # Tests
├── controllers/             # Tests de controladores
├── integration/             # Tests E2E
├── repositories/            # Tests de repositorios
├── shared/                  # Tests de shared
└── use-cases/               # Tests de use cases

prisma/
├── schema.prisma            # Schema de BD
├── migrations/              # Migraciones
└── seed.ts                  # Datos iniciales
```

## 🔒 Sistema de Roles y Permisos

### Roles Disponibles

- **administrador** - Acceso completo al sistema
- **coordinador** - Gestión de ventas y clientes
- **verificador** - Lectura y validación de ventas
- **comercial** - Crear y ver sus propias ventas

### Matriz de Permisos

| Recurso | Administrador | Coordinador | Verificador | Comercial |
|---------|--------------|-------------|-------------|-----------|
| Productos | CRUD | Lectura | Lectura | Lectura |
| Clientes | CRUD | CRUD | Lectura | CRUD* |
| Ventas | CRUD | CRUD | Lectura | CRUD* |
| Estados | CRUD | Lectura | Lectura | Lectura |
| Usuarios | CRUD | - | - | - |

\* Comerciales solo pueden gestionar sus propios recursos

## 🚦 Health Checks

El sistema incluye health checks para monitoreo:

```bash
# Health check básico
curl http://localhost:3000/health

# Health check detallado
curl http://localhost:3000/health/detailed
```

Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-03T14:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

## 📊 Métricas

Métricas Prometheus disponibles en `/metrics`:

- `http_requests_total` - Total de requests HTTP
- `http_request_duration_seconds` - Duración de requests
- `circuit_breaker_state` - Estado de circuit breakers
- `database_queries_total` - Queries a base de datos

Integración con Grafana disponible.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- Seguir la guía de estilo TypeScript
- Mantener cobertura de tests >80%
- Documentar funciones públicas
- Usar commits semánticos

## 📝 Licencia

ISC License - ver [LICENSE](LICENSE) para más detalles

## 👥 Equipo

- **Sergio** - Desarrollo Backend

## 🙏 Agradecimientos

- Prisma Team por el excelente ORM
- Express.js community
- OpenTelemetry contributors

## 📞 Soporte

Para reportar bugs o solicitar features:
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: support@example.com

---

**Hecho con ❤️ y TypeScript**
