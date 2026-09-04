# Plataforma Elite — Documentación del proyecto

## Estructura de carpetas

```
CRM/
├── core-service/        → carpeta: core-service      (puerto 3001)
├── crm-service/         → carpeta: crm-service        (puerto 3002)
├── calls-service/       → carpeta: calls-service      (puerto 3003)
├── calls-connector/     → carpeta: calls-connector    (puerto 3004)
├── sms-connector/       → carpeta: sms-connector      (puerto 3005)
├── sms-service/         → carpeta: sms-service        (puerto 3006)
├── frontend/            → carpeta: frontend           (puerto 5173)
└── docs/
```

## Servicios

| Servicio | Carpeta | Puerto | Responsabilidad |
|---|---|---|---|
| `core-service` | `core-service/` | `:3001` | Auth, Usuarios, Configuración del sistema, IPs permitidas |
| `crm-service` | `crm-service/` | `:3002` | Clientes, Productos, Ventas, Estados, Grabaciones, Firmas, Contratos |
| `calls-service` | `calls-service/` | `:3003` | Motor de llamadas, sesiones de agente, agenda, WebSocket tiempo real |
| `calls-connector` | `calls-connector/` | `:3004` | Adaptador de proveedor de llamadas (Mock / Twilio / Vicidial) |
| `sms-connector` | `sms-connector/` | `:3005` | Adaptador de proveedor de SMS (Mock / Twilio) |
| `sms-service` | `sms-service/` | `:3006` | Motor de SMS, eventos en tiempo real, WebSocket |
| Frontend | `frontend/` | `:5173` | SPA React + Vite (módulos: CRM, Llamadas, SMS) |

`core-service` y `crm-service` comparten la misma instancia de PostgreSQL (base de datos `crm`).
`calls-service` y `sms-service` usan sus propias bases de datos (`calls` y `sms`).

## Documentación técnica

| Documento | Descripción |
|---|---|
| [arquitectura.md](sistema-llamadas/arquitectura.md) | Diagrama completo, DTOs, base de datos, WebSocket, API endpoints |
| [roadmap.md](sistema-llamadas/roadmap.md) | Plan de implementación fase a fase con checklist y estado de cada fase |

## Orden de arranque

```bash
# 1. PostgreSQL (Docker)

# 2. core-service  (auth, usuarios, configuración)
cd core-service && npm run dev

# 3. crm-service  (clientes, ventas, contratos…)
cd crm-service && npm run dev

# 4. calls-connector  (antes que calls-service)
cd calls-connector && npm run dev

# 5. calls-service
cd calls-service && npm run dev

# 6. sms-connector  (opcional — solo si el módulo SMS está activo)
cd sms-connector && npm run dev

# 7. sms-service   (opcional — solo si el módulo SMS está activo)
cd sms-service && npm run dev

# 8. Frontend
cd frontend && npm run dev
```

## Seed de la base de datos

```bash
# Configuración del sistema (módulos, ip_filter) — solo la primera vez
cd core-service && npm run seed

# Estados de venta iniciales — solo la primera vez
cd crm-service && npx ts-node prisma/seed.ts
```
