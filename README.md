# CRM

## Requisitos

- [Node.js](https://nodejs.org) ≥ 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — tiene que estar arrancado antes de `npm run dev`

---

## Arranque rápido

```bash
# Instalar dependencias del workspace raíz (solo la primera vez)
npm install

# Levantar todo: base de datos + 4 servicios backend + frontend
npm run dev
```

Primera vez que se levanta la BD, Docker crea el volumen y las dos bases de datos (`crm` y `calls`) automáticamente.

---

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Todo: Postgres + backends + frontend |
| `npm run dev:back` | Solo Postgres + los 4 backends |
| `npm run dev:front` | Solo el frontend |
| `npm run db:up` | Solo levanta Postgres |
| `npm run db:down` | Para Postgres |
| `npm run db:logs` | Logs de Postgres en tiempo real |
| `npm run db:reset` | **Borra todos los datos** y recrea la BD desde cero |

---

## Servicios y puertos

| Servicio | Puerto | Descripción |
|---|---|---|
| `frontend` | 5173 | Vite — interfaz web |
| `core-service` | 3001 | Auth, usuarios, configuración |
| `crm-service` | 3002 | Clientes, ventas, productos |
| `calls-service` | 3003 | Motor de llamadas |
| `calls-connector` | 3004 | Adaptador de proveedor (mock en desarrollo) |
| `postgres` | 5432 | PostgreSQL (Docker) |

---

## Módulo de llamadas

El conector arranca en modo **mock** — simula el ciclo completo de llamada sin necesidad de Twilio ni Vicidial. Para cambiar de proveedor, edita `calls-connector/.env`:

```env
PROVIDER=mock      # desarrollo
PROVIDER=twilio    # producción con Twilio
PROVIDER=vicidial  # producción con Vicidial
```

---

## Tests

```bash
# Backend (calls-service)
cd calls-service && npx vitest run

# Frontend — módulo de llamadas
cd frontend && npx vitest run src/features/calls src/pages/calls

# Frontend — todo
cd frontend && npx vitest run
```

---

## Base de datos

Credenciales de desarrollo (definidas en `docker-compose.yml` y en los `.env` de cada servicio):

```
Host:     localhost:5432
Usuario:  postgres
Password: 1234
BDs:      crm  /  calls
```
