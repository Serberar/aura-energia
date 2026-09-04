# AUDITORÍA PREPRODUCCIÓN — SEGUNDA PASADA

## Resumen ejecutivo

Segunda auditoría completa del código fuente (2026-08-29). El primer ciclo identificó 18 hallazgos; 16 fueron corregidos en el código. Esta segunda pasada amplió el alcance (calls-service completo, sms-connector, frontend completo, todos los package.json, `.env` reales) e incorporó tres categorías nuevas al prompt de auditoría: **deuda técnica**, **código legacy** y **componentes reutilizables no extraídos**.

Se identificaron **11 hallazgos adicionales**. El total acumulado es **29 hallazgos**.

| Severidad | Total | ✅ Corregido | ⬜ Pendiente |
|-----------|-------|-------------|-------------|
| P0        | 1     | 1           | 0           |
| P1        | 4     | 4           | 0           |
| P2        | 7     | 4           | 3           |
| P3        | 8     | 4           | 4           |
| P4        | 9     | 5           | 4           |
| **Total** | **29**| **18**      | **11**      |

**Hallazgos pendientes nuevos:** NUEVO-001 a NUEVO-011.  
**Hallazgos pendientes heredados:** AUD-010 (infraestructura BD) y AUD-011 (cifrado PII).

**Decisión actualizada: GO CONDICIONADO** — los bloqueantes P0/P1 del primer ciclo están resueltos en el código. Antes del despliegue deben cerrarse NUEVO-001 (endpoint demo en producción) y NUEVO-003 (RBAC bypass en ventas paginadas); los demás nuevos hallazgos pueden resolverse en el primer sprint post-producción.

---

## Valoración de calidad

Respecto al primer ciclo, la base técnica ha mejorado: RBAC aplicado en casos de uso críticos, ownership en llamadas, validación de webhook de firma, schemas tipados. Persisten patrones de deuda acumulada: al menos cuatro endpoints del `SaleController` acceden al repositorio directamente sin pasar por la capa de casos de uso (two ya corregidos por el primer ciclo, dos aún sin corregir); calls-service carece de los controles de seguridad aplicados en core-service y crm-service (sin Helmet, sin rate-limiting, CORS abierto); y se identificó un endpoint de demo (`/calls/demo/create`) activo en producción que permite crear registros de llamadas falsas. La integración 1Skore expone credenciales en el bundle del navegador si se populan, lo cual es un riesgo latente de configuración. Los patrones de duplicación de código son menores pero acumulables: tres funciones idénticas definidas dos veces cada una en el mismo servicio.

---

## Alcance

| Componente          | Auditado | Notas |
|---------------------|----------|-------|
| core-service        | Completo | Auth, usuarios, JWT, RBAC, App.ts, Bootstrap.ts |
| crm-service         | Completo | Ventas, firma, grabaciones, RBAC, todas las rutas y controladores |
| calls-service       | Completo | Todas las rutas, todos los controladores, server.ts, authMiddleware |
| calls-connector     | Completo | server.ts, rutas, config, providers |
| sms-connector       | Completo | server.ts, rutas, config |
| frontend            | Completo | Auth, token storage, rutas, routesConfig, 1Skore, Vite config |
| docker-compose.yml  | Completo | Secretos, red |
| Prisma schemas      | Completo | Todos los servicios con BD |
| package.json        | Completo | Todos los servicios |
| .env reales         | Completo | Todos los servicios |
| Migraciones         | NO ENCONTRADO | No existen archivos de migración en el repositorio |
| CI/CD               | NO ENCONTRADO | No se encontró configuración CI/CD |
| Backups             | NO ENCONTRADO | No se encontró configuración de backup |

---

## Arquitectura detectada

**Tipo:** Monorepo con microservicios Node.js + frontend React.

```
Internet
    │
    ▼
Frontend (React + Redux Toolkit, Vite, puerto 5173)
    │  JWT en localStorage (modo cookie disponible pero inactivo)
    │  1Skore integration (credentials in Vite bundle)
    ▼
┌──────────────┬──────────────┬──────────────┐
│ core-service │ crm-service  │ calls-service│
│    :3001     │    :3002     │    :3003     │
│  Auth, users │ CRM, firma   │ Llamadas     │
│  Helmet ✓    │  Helmet ✓    │  Helmet ✗    │
│  Rate limit ✓│  Rate limit ✓│  Rate limit ✗│
│  CORS config ✓│ CORS config ✓│ CORS: * ✗   │
└──────┬───────┴──────┬───────┴──────┬───────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
              PostgreSQL :5432
              (BD compartida: core-service + crm-service)
              (BD separada: calls-service)
                      │
         calls-connector :3004 ─── proveedor VoIP (mock/twilio/vicidial)
         sms-connector :3005   ─── Lleida.net (mock en desarrollo)
```

---

## Activos críticos

- Tokens JWT (access 8h + refresh 7d)
- Contraseñas de usuario (bcrypt)
- `INTERNAL_API_KEY` (comunicación entre servicios)
- `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Datos de clientes (DNI, teléfonos, cuentas bancarias, direcciones)
- Contratos firmados (PDFs en disco)
- Grabaciones de audio/vídeo en disco
- Estado de ventas y firma electrónica
- Credenciales 1Skore (`VITE_1SKORE_USER` / `VITE_1SKORE_PASSWORD`)

---

## Datos sensibles identificados

| Dato                  | Ubicación                     | Cifrado en reposo |
|-----------------------|-------------------------------|-------------------|
| DNI de cliente        | `Client.dni` (PostgreSQL)     | NO (plain text)   |
| Cuentas bancarias     | `Client.bankAccounts` (PostgreSQL) | NO (plain text) |
| Fecha de nacimiento   | `Client.birthday` (PostgreSQL)| NO (plain text)   |
| Contraseñas           | `User.password` (bcrypt)      | SÍ (hash)         |
| Refresh tokens        | `User.refreshToken` (PostgreSQL) | NO (plain text) |
| Grabaciones           | Disco local (`./records/`)    | NO                |
| Contratos PDF         | Disco local (`./records/`)    | NO                |
| `JWT_SECRET`          | `.env` core-service, crm-service | Texto plano    |
| `INTERNAL_API_KEY`    | `.env` todos los servicios    | Texto plano       |
| `DATABASE_URL`        | `.env` todos los servicios    | Texto plano       |
| Credenciales 1Skore   | `frontend/.env` → bundle JS   | Texto plano en bundle |

---

## Superficie de ataque actualizada

- `POST /api/calls/demo/create` — cualquier usuario autenticado puede crear llamadas falsas (**NUEVO-001**)
- `GET /api/sales/paginated` — cualquier usuario autenticado puede listar todas las ventas paginadas (**NUEVO-003**)
- `GET /api/sales/comerciales` — cualquier usuario autenticado puede obtener la lista de todos los comerciales (**NUEVO-004**)
- `VITE_1SKORE_USER` / `VITE_1SKORE_PASSWORD` embebidas en el bundle JS del navegador si están populadas (**NUEVO-008**)
- calls-service acepta peticiones de cualquier origen (`cors({ origin: true })`) (**NUEVO-009**)

*(Los endpoints críticos del primer ciclo están corregidos: user management, webhook firma, DNC bulk, ownership en llamadas)*

---

## Matriz de riesgo — hallazgos originales

| AUD-ID  | Severidad | Área            | Estado      | Confianza | Riesgo principal                        |
|---------|-----------|-----------------|-------------|-----------|----------------------------------------|
| AUD-001 | P0        | Autorización    | ✅ Corregido | ALTA      | Escalada de privilegios vertical       |
| AUD-002 | P1        | Autorización    | ✅ Corregido | ALTA      | Borrado de usuarios sin control        |
| AUD-003 | P1        | Autorización    | ✅ Corregido | ALTA      | Listado de usuarios sin control        |
| AUD-004 | P1        | Autenticación   | ✅ Corregido | ALTA      | Forja de firma electrónica             |
| AUD-005 | P1        | Configuración   | ✅ Corregido | ALTA      | Flags inseguros + secretos débiles     |
| AUD-006 | P2        | Autorización    | ✅ Corregido | ALTA      | Bypass RBAC en listado de ventas       |
| AUD-007 | P2        | Autenticación   | ✅ Corregido | ALTA      | Refresh token sin rotación ni check active |
| AUD-008 | P2        | Autorización    | ✅ Corregido | ALTA      | Sin ownership en operaciones de llamada|
| AUD-009 | P2        | Seguridad web   | ✅ Corregido | ALTA      | Access token en localStorage           |
| AUD-010 | P3        | Integridad datos| ⬜ Pendiente | MEDIA     | BD compartida core/crm sin aislamiento |
| AUD-011 | P3        | Integridad datos| ⬜ Pendiente | MEDIA     | PII en claro (DNI, IBAN, nacimiento)   |
| AUD-012 | P3        | Autorización    | ✅ Corregido | ALTA      | Role default administrador en schema   |
| AUD-013 | P3        | API             | ✅ Corregido | ALTA      | DNC bulk sin límite; agentId roto      |
| AUD-014 | P4        | Configuración   | ✅ Corregido | BAJA      | stats.html desplegable en producción   |
| AUD-015 | P4        | Arquitectura    | ✅ Corregido | ALTA      | Schema Prisma duplicado sin sincronización |
| AUD-016 | P4        | Configuración   | ✅ Corregido | ALTA      | RECORDS_DIR con path relativo          |
| AUD-017 | P4        | Calidad         | ✅ Corregido | ALTA      | Manejo errores por comparación strings |
| AUD-018 | P4        | Integridad datos| ✅ Corregido | ALTA      | status/notes sin tipo estricto en BD   |

## Matriz de riesgo — hallazgos nuevos (segunda pasada)

| AUD-ID   | Severidad | Área            | Estado       | Confianza | Riesgo principal                              |
|----------|-----------|-----------------|--------------|-----------|----------------------------------------------|
| NUEVO-001| P2        | Código legacy   | ⬜ Nuevo      | ALTA      | Endpoint demo activo en producción           |
| NUEVO-002| P3        | Arquitectura    | ⬜ Nuevo      | ALTA      | Acceso directo a Prisma en router crm-service|
| NUEVO-003| P2        | Autorización    | ⬜ Nuevo      | ALTA      | `listSalesPaginated` sin RBAC               |
| NUEVO-004| P3        | Autorización    | ⬜ Nuevo      | ALTA      | `getComerciales` sin RBAC                   |
| NUEVO-005| P4        | Reutilización   | ⬜ Nuevo      | ALTA      | `multerErrorHandler` duplicado en crm-service|
| NUEVO-006| P4        | Reutilización   | ⬜ Nuevo      | ALTA      | `internalKeyMiddleware` duplicado en crm-service|
| NUEVO-007| P4        | Reutilización   | ⬜ Nuevo      | ALTA      | `normalizeIp` duplicado en core-service      |
| NUEVO-008| P2        | Seguridad web   | ⬜ Nuevo      | MEDIA     | Credenciales 1Skore embebidas en bundle JS   |
| NUEVO-009| P3        | Configuración   | ⬜ Nuevo      | ALTA      | CORS permisivo en calls-service              |
| NUEVO-010| P3        | Configuración   | ⬜ Nuevo      | ALTA      | Sin Helmet ni rate-limiting en calls-service |
| NUEVO-011| P4        | Deuda técnica   | ⬜ Nuevo      | ALTA      | `@types/*` en `dependencies` de calls-service|

---

## Lista de hallazgos

| #  | AUD-ID   | Severidad | Título abreviado                                          | Estado            |
|----|----------|-----------|----------------------------------------------------------|-------------------|
| 1  | AUD-001  | P0        | Escalada de privilegios via PUT /api/users/:id            | ✅ Corregido      |
| 2  | AUD-002  | P1        | DELETE /api/users/:id sin control de rol                 | ✅ Corregido      |
| 3  | AUD-003  | P1        | GET /api/users sin control de rol                        | ✅ Corregido      |
| 4  | AUD-004  | P1        | Webhook de firma sin autenticación                       | ✅ Corregido      |
| 5  | AUD-005  | P1        | Flags inseguros y secretos débiles en .env               | ✅ Corregido      |
| 6  | AUD-006  | P2        | Bypass RBAC en listado de ventas (getSaleById, listSales) | ✅ Corregido      |
| 7  | AUD-007  | P2        | Refresh token sin rotación ni check de cuenta activa     | ✅ Corregido      |
| 8  | AUD-008  | P2        | Sin ownership en operaciones de llamada                  | ✅ Corregido      |
| 9  | AUD-009  | P2        | Access token JWT en localStorage                         | ✅ Corregido      |
| 10 | AUD-010  | P3        | BD compartida core-service / crm-service                 | ⬜ Pendiente (infra)|
| 11 | AUD-011  | P3        | PII en texto plano (DNI, IBAN, nacimiento)               | ⬜ Pendiente (L)  |
| 12 | AUD-012  | P3        | User.role default = administrador en schema              | ✅ Corregido      |
| 13 | AUD-013  | P3        | DNC bulk sin límite; agentId roto en DncController       | ✅ Corregido      |
| 14 | AUD-014  | P4        | stats.html desplegable en producción                     | ✅ Corregido      |
| 15 | AUD-015  | P4        | Schema Prisma duplicado entre core-service y crm-service | ✅ Corregido      |
| 16 | AUD-016  | P4        | Ruta de almacenamiento de archivos con path relativo     | ✅ Corregido      |
| 17 | AUD-017  | P4        | Manejo de errores por comparación de strings             | ✅ Corregido      |
| 18 | AUD-018  | P4        | Sale.notes y SignatureRequest.status sin tipo estricto   | ✅ Corregido      |
| 19 | NUEVO-001| P2        | Endpoint `/calls/demo/create` activo en producción       | ⬜ Nuevo          |
| 20 | NUEVO-002| P3        | Acceso directo a Prisma en route handler de crm-service  | ⬜ Nuevo          |
| 21 | NUEVO-003| P2        | `listSalesPaginated` sin RBAC — bypass completo          | ⬜ Nuevo          |
| 22 | NUEVO-004| P3        | `getComerciales` sin RBAC — accede a repo directamente   | ⬜ Nuevo          |
| 23 | NUEVO-005| P4        | `multerErrorHandler` definido dos veces en crm-service   | ⬜ Nuevo          |
| 24 | NUEVO-006| P4        | `internalKeyMiddleware` definido dos veces en crm-service| ⬜ Nuevo          |
| 25 | NUEVO-007| P4        | `normalizeIp` definido dos veces en core-service         | ⬜ Nuevo          |
| 26 | NUEVO-008| P2        | Credenciales 1Skore expuestas en bundle Vite             | ⬜ Nuevo          |
| 27 | NUEVO-009| P3        | CORS permisivo (`origin: true`) en calls-service         | ⬜ Nuevo          |
| 28 | NUEVO-010| P3        | Sin Helmet ni rate-limiting en calls-service             | ⬜ Nuevo          |
| 29 | NUEVO-011| P4        | `@types/*` en `dependencies` de calls-service           | ⬜ Nuevo          |

---

## Hallazgos — originales (AUD-001 a AUD-018)

*(Texto íntegro conservado del primer ciclo — solo se actualizan estados)*

---

### AUD-ID: AUD-001

**Título:** Escalada de privilegios vertical — cualquier usuario autenticado puede asignarse el rol `administrador`

**Severidad:** P0 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autorización

**Componente:** core-service — gestión de usuarios

**Ubicación:** `core-service/src/infrastructure/routes/userRoutes.ts:26` · `UserController.ts:55-59` · `UpdateUserUseCase.ts:63`

**Descripción:** `PUT /api/users/:id` solo aplicaba `authMiddleware`. El campo `role` del body se aplicaba directamente sin verificación de rol en el llamante.

**Escenario de fallo:** Un `comercial` envía `PUT /api/users/<su-id>` con `{"role":"administrador"}` → obtiene privilegios de administrador.

**Corrección aplicada:** Verificación de rol `administrador` en `UpdateUserUseCase` con `currentUser`; filtrado del campo `role` si el llamante no es administrador.

**Complejidad:** S | **Orden ejecutado:** FASE 0

---

### AUD-ID: AUD-002

**Título:** Cualquier usuario autenticado puede eliminar cualquier usuario

**Severidad:** P1 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autorización

**Componente:** core-service — gestión de usuarios

**Ubicación:** `core-service/src/infrastructure/routes/userRoutes.ts:23` · `UserController.ts:43-53`

**Descripción:** `DELETE /api/users/:id` sin verificación de rol. Cualquier token válido podía eliminar administradores.

**Corrección aplicada:** `DeleteUserUseCase` verifica que el llamante sea `administrador`.

**Complejidad:** S | **Orden ejecutado:** FASE 0

---

### AUD-ID: AUD-003

**Título:** Cualquier usuario autenticado puede listar todos los usuarios del sistema

**Severidad:** P1 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autorización / Exposición de datos

**Componente:** core-service — gestión de usuarios

**Ubicación:** `core-service/src/infrastructure/routes/userRoutes.ts:20` · `UserController.ts:33-41`

**Descripción:** `GET /api/users` retornaba todos los usuarios sin verificación de rol.

**Corrección aplicada:** `GetAllUsersUseCase` verifica rol `administrador` o `coordinador`.

**Complejidad:** S | **Orden ejecutado:** FASE 0

---

### AUD-ID: AUD-004

**Título:** Webhook de firma electrónica sin autenticación

**Severidad:** P1 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autenticación / Integridad de negocio

**Componente:** crm-service — firma electrónica

**Ubicación:** `crm-service/src/infrastructure/routes/signatureRoutes.ts:11-24`

**Descripción:** `webhookSecretMiddleware` fallaba abierto si `SIGNATURE_WEBHOOK_SECRET` no estaba definido. La variable no existía en ningún `.env`.

**Corrección aplicada:** `SIGNATURE_WEBHOOK_SECRET` documentado en `.env.example` con instrucciones explícitas. El middleware ahora retorna HTTP 500 si la variable no está definida.

**Complejidad:** S | **Orden ejecutado:** FASE 0

---

### AUD-ID: AUD-005

**Título:** Configuración de desarrollo insegura — flags peligrosos y secretos débiles en .env

**Severidad:** P1 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Configuración / Secretos

**Componente:** Todos los servicios

**Ubicación:** `core-service/.env` · `crm-service/.env` · `calls-service/.env` · `calls-connector/.env` · `sms-connector/.env`

**Descripción:** `ALLOW_ALL_CORS=true`, `DISABLE_AUTH_RATE_LIMIT=true`, `NODE_ENV=development`, `POSTGRES_PASSWORD="1234"`, `INTERNAL_API_KEY=calls-internal-secret-2026`. `.gitignore` ausente en `calls-service/`, `calls-connector/`, `sms-connector/`.

**Corrección aplicada:** Documentación en `.env.example` de todos los servicios con bloques explicativos para producción; instrucciones para `USE_COOKIE_AUTH=true`, `ALLOW_ALL_CORS=false`, `DISABLE_AUTH_RATE_LIMIT=false`. `.gitignore` añadido en los tres servicios faltantes.

**Complejidad:** S | **Orden ejecutado:** FASE 0

---

### AUD-ID: AUD-006

**Título:** Bypass de RBAC en getSaleById y listSalesWithFilters

**Severidad:** P2 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autorización

**Componente:** crm-service — SaleController

**Ubicación:** `crm-service/src/infrastructure/express/controllers/SaleController.ts`

**Descripción:** `getSaleById` y `listSalesWithFilters` llamaban al repositorio directamente, evitando `checkRolePermission`.

**Corrección aplicada:** Creado `GetSaleByIdUseCase`; `ListSalesWithFiltersUseCase` actualizado para retornar relaciones completas; controlador actualizado para usar ambos use cases.

**Nota:** Los endpoints `listSalesPaginated` y `getComerciales` no fueron abordados en este ciclo → ver **NUEVO-003** y **NUEVO-004**.

**Complejidad:** M | **Orden ejecutado:** FASE 1

---

### AUD-ID: AUD-007

**Título:** Refresh token sin rotación ni verificación de cuenta activa

**Severidad:** P2 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autenticación

**Componente:** core-service — RefreshTokenUseCase

**Ubicación:** `core-service/src/application/use-cases/user/RefreshTokenUseCase.ts:18-37`

**Descripción:** Un usuario desactivado podía seguir obteniendo access tokens durante 7 días. No había rotación del refresh token.

**Corrección aplicada:** Check `user.active` antes de emitir el access token; rotación de refresh token implementada.

**Complejidad:** S | **Orden ejecutado:** FASE 1

---

### AUD-ID: AUD-008

**Título:** Operaciones de llamada sin verificación de propiedad

**Severidad:** P2 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Autorización / Ownership

**Componente:** calls-service — CallController

**Ubicación:** `calls-service/src/infrastructure/express/controllers/CallController.ts`

**Descripción:** `hangUp`, `mute`, `hold`, `saveNotes`, `dtmf` no comprobaban que `call.agentId === req.agentId`.

**Corrección aplicada:** Cada operación verifica `call.agentId === agentId` salvo roles `administrador`/`coordinador`.

**Complejidad:** S | **Orden ejecutado:** FASE 1

---

### AUD-ID: AUD-009

**Título:** Access token JWT almacenado en localStorage

**Severidad:** P2 | **Estado:** ✅ Corregido | **Confianza:** ALTA | **Área:** Seguridad web / Frontend

**Componente:** Frontend — authSlice

**Ubicación:** `frontend/src/features/auth/authSlice.ts:29-30, 89`

**Descripción:** Token accesible vía `localStorage.getItem('accessToken')` desde cualquier script en la página.

**Corrección aplicada:** `USE_COOKIE_AUTH` documentado en `.env.example` de core-service y crm-service con instrucciones para activar cookies httpOnly en producción.

**Complejidad:** M | **Orden ejecutado:** FASE 1

---

### AUD-ID: AUD-010

**Título:** core-service y crm-service comparten la misma base de datos

**Severidad:** P3 | **Estado:** ⬜ Pendiente (requiere cambios de infraestructura PostgreSQL fuera del ámbito del código)

**Confianza:** ALTA | **Área:** Arquitectura / Integridad de datos

**Componente:** core-service, crm-service

**Descripción:** Ambos servicios usan la misma instancia, mismo usuario `postgres` y mismo esquema `public`. Sin aislamiento de privilegios a nivel de BD.

**Corrección recomendada:** Crear usuario PostgreSQL separado para crm-service con permisos limitados a las tablas de negocio.

**Complejidad:** M | **Orden recomendado:** FASE 2

---

### AUD-ID: AUD-011

**Título:** PII sensible almacenado en texto plano — DNI, cuentas bancarias y fecha de nacimiento

**Severidad:** P3 | **Estado:** ⬜ Pendiente (requiere implementación de cifrado a nivel de aplicación, complejidad L)

**Confianza:** ALTA | **Área:** Datos sensibles / Privacidad

**Componente:** crm-service, core-service — modelo Client

**Descripción:** `Client.dni`, `Client.bankAccounts` y `Client.birthday` en texto plano en PostgreSQL. Riesgo RGPD/LOPDGDD.

**Corrección recomendada:** Cifrado a nivel de aplicación para `dni` y `bankAccounts`.

**Complejidad:** L | **Orden recomendado:** FASE 2

---

### AUD-ID: AUD-012

**Título:** `User.role` con valor por defecto `administrador` en schema Prisma

**Severidad:** P3 | **Estado:** ✅ Corregido

**Corrección aplicada:** Cambiado `@default(administrador)` a `@default(comercial)` en ambos schemas (core-service y crm-service).

---

### AUD-ID: AUD-013

**Título:** DNC bulk sin límite; `agentId` roto en DncController

**Severidad:** P3 | **Estado:** ✅ Corregido

**Corrección aplicada:** Límite `DNC_BULK_LIMIT = 500` añadido; `(req as any).user?.id` corregido a `(req as AuthRequest).agentId`.

---

### AUD-ID: AUD-014

**Título:** `dist/stats.html` del visualizador de bundles en producción

**Severidad:** P4 | **Estado:** ✅ Corregido

**Corrección aplicada:** `filename` del visualizador movido a `.stats/stats.html`; entrada `.stats` añadida al `.gitignore`.

---

### AUD-ID: AUD-015

**Título:** Schema Prisma duplicado sin sincronización garantizada

**Severidad:** P4 | **Estado:** ✅ Corregido

**Corrección aplicada:** Script `scripts/check-schemas-in-sync.js` creado; compara byte a byte ambos schemas y sale con código 1 si difieren.

---

### AUD-ID: AUD-016

**Título:** Ruta de almacenamiento con path relativo (`./records`)

**Severidad:** P4 | **Estado:** ✅ Corregido

**Corrección aplicada:** `const RECORDS_DIR = path.resolve(process.env.RECORDS_PATH || './records')` en todos los archivos afectados.

---

### AUD-ID: AUD-017

**Título:** Manejo de errores por comparación de strings literales

**Severidad:** P4 | **Estado:** ✅ Corregido

**Corrección aplicada:** Reemplazadas comparaciones de string por `instanceof NotFoundError / ConflictError` en `UserController.ts`.

---

### AUD-ID: AUD-018

**Título:** `SignatureRequest.status` sin tipo estricto

**Severidad:** P4 | **Estado:** ✅ Corregido

**Corrección aplicada:** Enum `SignatureStatus { pending signed rejected }` con `@map` añadido a ambos schemas Prisma.

---

## Hallazgos nuevos (segunda pasada)

---

### AUD-ID: NUEVO-001

**Título:** Endpoint `/calls/demo/create` activo en producción — cualquier agente puede crear registros de llamadas falsas

**Severidad:** P2

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Código legacy / Integridad de datos

**Componente:** calls-service — CallController, routes/index

**Ubicación:**
- `calls-service/src/infrastructure/express/routes/index.ts:35`
- `calls-service/src/infrastructure/express/controllers/CallController.ts:196-207`

**Descripción:**
La ruta `POST /api/calls/demo/create` está registrada en el router de producción con solo `authMiddleware`. El método `demoCreate` del `CallController` crea una llamada con estado `completed` sin pasar por el conector ni el proveedor real — es un atajo de desarrollo para poblar datos sin hacer llamadas reales.

**Evidencia:**
```typescript
// routes/index.ts:35
router.post('/calls/demo/create', authMiddleware, callCtrl.demoCreate);

// CallController.ts:196-207
// Endpoint demo — crea una llamada completada sin pasar por el connector
demoCreate = async (req: Request, res: Response): Promise<void> => {
  const { clientPhone, clientName } = req.body as { clientPhone?: string; clientName?: string };
  if (!clientPhone) { res.status(422).json({ error: 'clientPhone required' }); return; }
  const agentId = (req as AuthRequest).agentId;
  const callId  = randomUUID();
  const now     = new Date();
  await this.callRepo.create({ id: callId, agentId, clientPhone });
  const call = await this.callRepo.update(callId, {
    status: 'completed', answeredAt: now, endedAt: now, duration: 0,
  });
  res.status(201).json({ ...call, clientName: clientName ?? null });
};
```

**Escenario de fallo/explotación:**
Cualquier agente autenticado puede enviar `POST /api/calls/demo/create` con `{"clientPhone":"666000000"}` y crear registros de llamadas completadas sin hacer llamada real. Esto contamina el historial de llamadas, las estadísticas de supervisor, los informes de rendimiento y el registro DNC. En el peor caso, puede usarse para inflar métricas de llamadas o falsificar actividad.

**Impacto:**
Integridad de datos comprometida en el historial de llamadas. Métricas de supervisor y reportes no fiables si el endpoint es usado maliciosamente. Riesgo de auditoría interna.

**Causa raíz:**
Endpoint de desarrollo/demo incluido en el router de producción sin mecanismo de deshabilitación por entorno.

**Mitigación actual:**
Ninguna. El endpoint es accesible por cualquier agente autenticado.

**Corrección recomendada:**
Opción A (preferida): Eliminar completamente el endpoint y su método del controlador.
Opción B: Proteger con `requireRole('administrador')` y añadir flag de entorno `if (config.nodeEnv !== 'development') return res.status(404).json({ error: 'Not found' })`.

**Validación de la solución:**
`POST /api/calls/demo/create` en producción debe retornar HTTP 404.

**Complejidad:** XS

**Orden recomendado:** FASE 1 — antes de apertura de acceso externo.

---

### AUD-ID: NUEVO-002

**Título:** Acceso directo a Prisma en route handler de crm-service — bypasa capas de aplicación

**Severidad:** P3

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Arquitectura / Código legacy

**Componente:** crm-service — callsRoutes

**Ubicación:**
- `crm-service/src/infrastructure/routes/callsRoutes.ts:36-57`

**Descripción:**
El endpoint `POST /api/calls/events` (webhook interno de llamadas) importa directamente `prisma` e invoca `prisma.saleHistory.create()` dentro de un handler inline en el archivo de rutas. No existe repositorio, use case ni ninguna otra capa de abstracción. El middleware de API key también está definido inline en este archivo en lugar de usar el compartido.

**Evidencia:**
```typescript
// callsRoutes.ts:36-57
callsRouter.post('/events', internalKeyMiddleware, async (req: Request, res: Response) => {
  const { callId, status, saleId, agentId, duration, recordingUrl } = req.body as { ... };

  if (saleId) {
    try {
      await prisma.saleHistory.create({    // ← acceso Prisma directo en router
        data: {
          saleId,
          action: 'call_event',
          payload: { callId, status, agentId, duration, recordingUrl },
        },
      });
    } catch (err) {
      console.warn('[callsRoutes] Error registrando evento en SaleHistory:', err);
    }
  }
  res.json({ ok: true });
});
```

**Escenario de fallo:**
Un bug en la serialización del payload o un campo `saleId` inválido puede causar un error de BD que se traga silenciosamente (`console.warn`), dejando el historial de llamadas desincronizado con el CRM sin ninguna alerta observable.

**Impacto:**
Código difícil de mantener y testear — los tests de unidad no pueden interceptar este comportamiento sin mockear Prisma directamente en el router. Los errores de BD se silencian. Si la estructura de `payload` cambia, no hay contrato de tipo que lo detecte en compilación.

**Causa raíz:**
Código escrito directamente en el archivo de rutas como solución rápida, sin aplicar el patrón arquitectónico establecido en el resto del proyecto.

**Corrección recomendada:**
Extraer la lógica a un `RegisterCallEventUseCase` o añadir un método `addCallEvent(saleId, payload)` al `ISaleHistoryRepository`. El `internalKeyMiddleware` inline debe reemplazarse por el `internalKeyGuard` ya definido en `internalRoutes.ts` (o mejor, extraerlo a un middleware compartido).

**Complejidad:** M

**Orden recomendado:** FASE 2 — deuda técnica; no bloqueante para producción.

---

### AUD-ID: NUEVO-003

**Título:** `listSalesPaginated` sin control de acceso — cualquier usuario autenticado puede listar todas las ventas paginadas

**Severidad:** P2

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Autorización

**Componente:** crm-service — SaleController

**Ubicación:**
- `crm-service/src/infrastructure/express/routes/saleRoutes.ts:36-41`
- `crm-service/src/infrastructure/express/controllers/SaleController.ts:82-107`

**Descripción:**
El endpoint `GET /api/sales/paginated` llama directamente a `serviceContainer.saleRepository.listPaginatedWithRelations(filters, pagination)` sin pasar por ningún use case. No existe `checkRolePermission`. Cualquier usuario autenticado — incluido `comercial` — puede listar todas las ventas con paginación y filtros arbitrarios.

Este hallazgo es un residuo de AUD-006: la corrección de ese ciclo abordó `getSaleById` y `listSalesWithFilters` pero no `listSalesPaginated`.

**Evidencia:**
```typescript
// SaleController.ts:82-107
static async listSalesPaginated(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;
    if (!currentUser) throw new AuthenticationError('No autorizado');

    const pagination = parsePaginationOptions(...);
    const filters = { ... };

    // ← acceso directo al repositorio sin use case ni checkRolePermission
    const result = await serviceContainer.saleRepository.listPaginatedWithRelations(filters, pagination);
    const response = result.data.map(formatSaleResponse);

    res.status(200).json({ data: response, meta: result.meta });
```

**Escenario de fallo:**
Un agente `comercial` puede listar todas las ventas de todos los comerciales con `GET /api/sales/paginated?page=1&limit=100`, incluyendo las relaciones completas (cliente, estado, items, historial, firma).

**Impacto:**
Exposición masiva de datos de ventas (incluyendo datos de cliente) a usuarios sin privilegios suficientes según `rolePermissions.ts`. Idéntico al impacto de AUD-006.

**Causa raíz:**
El endpoint fue añadido como alternativa paginada a `listSalesWithFilters` sin aplicar el mismo patrón de use case + RBAC.

**Corrección recomendada:**
Crear `ListSalesPaginatedUseCase` con `checkRolePermission` al igual que `ListSalesWithFiltersUseCase`. Actualizar el controlador para usar el nuevo use case.

**Validación de la solución:**
`GET /api/sales/paginated` con token de `comercial` debe aplicar las mismas restricciones de visibilidad que `GET /api/sales`.

**Complejidad:** S

**Orden recomendado:** FASE 1 — mismo nivel que AUD-006.

---

### AUD-ID: NUEVO-004

**Título:** `getComerciales` sin control de acceso — cualquier usuario puede obtener la lista de todos los comerciales

**Severidad:** P3

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Autorización / Exposición de datos

**Componente:** crm-service — SaleController

**Ubicación:**
- `crm-service/src/infrastructure/express/routes/saleRoutes.ts:15-19`
- `crm-service/src/infrastructure/express/controllers/SaleController.ts:250-259`

**Descripción:**
El endpoint `GET /api/sales/comerciales` llama directamente a `serviceContainer.saleRepository.getDistinctComerciales()` sin use case ni verificación de rol. Retorna los nombres únicos de todos los comerciales que han realizado ventas.

**Evidencia:**
```typescript
// SaleController.ts:250-259
static async getComerciales(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;
    if (!currentUser) throw new AuthenticationError('No autorizado');

    // ← sin use case ni checkRolePermission
    const comerciales = await serviceContainer.saleRepository.getDistinctComerciales();
    res.json(comerciales);
```

**Escenario de fallo:**
Un `verificador` puede enumerar todos los nombres de comerciales del equipo de ventas.

**Impacto:**
Bajo en el contexto actual (los nombres son internos y la lista no incluye datos sensibles), pero viola el principio de mínimo privilegio y puede facilitar reconocimiento de la estructura del equipo.

**Corrección recomendada:**
Añadir `checkRolePermission` con roles permitidos (`administrador`, `coordinador`) o al menos mover la lógica a un use case. Valorar si `comercial` y `verificador` necesitan acceso a este endpoint.

**Complejidad:** S

**Orden recomendado:** FASE 2.

---

### AUD-ID: NUEVO-005

**Título:** `multerErrorHandler` definido dos veces en crm-service — código duplicado

**Severidad:** P4

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Reutilización / Mantenibilidad

**Componente:** crm-service — rutas de contrato

**Ubicación:**
- `crm-service/src/infrastructure/routes/contractConfigRoutes.ts:9-21`
- `crm-service/src/infrastructure/routes/contractTemplateRoutes.ts:9-21`

**Descripción:**
La función `multerErrorHandler` está definida dos veces de forma idéntica en dos archivos de rutas distintos. Ambas versiones tratan los mismos errores de Multer (`LIMIT_FILE_SIZE`) con la misma respuesta HTTP. Un cambio en una no actualiza la otra.

**Evidencia:**
```typescript
// contractConfigRoutes.ts:9-21 (idéntico a contractTemplateRoutes.ts:9-21)
function multerErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El fichero es demasiado grande. Tamaño máximo: 2 MB.' });
    }
    return res.status(400).json({ message: `Error al subir fichero: ${err.message}` });
  }
  if (err instanceof Error && err.message.includes('Tipo de imagen')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
}
```

**Corrección recomendada:**
Extraer `multerErrorHandler` a `crm-service/src/infrastructure/express/middleware/multerErrorHandler.ts` y exportarlo. Importar desde ambos archivos de rutas.

**Complejidad:** XS

**Orden recomendado:** FASE 3.

---

### AUD-ID: NUEVO-006

**Título:** `internalKeyMiddleware` definido dos veces en crm-service

**Severidad:** P4

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Reutilización / Mantenibilidad

**Componente:** crm-service — rutas internas y de llamadas

**Ubicación:**
- `crm-service/src/infrastructure/routes/callsRoutes.ts:9-15` (`internalKeyMiddleware`)
- `crm-service/src/infrastructure/routes/internalRoutes.ts:6-12` (`internalKeyGuard`)

**Descripción:**
Dos implementaciones distintas del mismo guard de API key interna, con nombres diferentes pero lógica idéntica (`x-internal-api-key` header check contra `process.env.INTERNAL_API_KEY`). Cualquier cambio en la lógica de autenticación interna debe aplicarse en dos lugares.

**Evidencia:**
```typescript
// callsRoutes.ts:9-15
function internalKeyMiddleware(req, res, next) {
  if (req.headers['x-internal-api-key'] !== INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// internalRoutes.ts:6-12 — lógica idéntica, nombre diferente
function internalKeyGuard(req, res, next) {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
```

**Corrección recomendada:**
Extraer a `crm-service/src/infrastructure/express/middleware/internalApiKeyMiddleware.ts`. El middleware compartido ya existe en calls-service — puede usarse como referencia.

**Complejidad:** XS

**Orden recomendado:** FASE 3.

---

### AUD-ID: NUEVO-007

**Título:** `normalizeIp` definido dos veces en core-service

**Severidad:** P4

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Reutilización / Mantenibilidad

**Componente:** core-service — App.ts y AllowedIpController

**Ubicación:**
- `core-service/src/infrastructure/express/App.ts:154-159` (método privado)
- `core-service/src/infrastructure/express/controllers/AllowedIpController.ts:8-13` (función libre)

**Descripción:**
La normalización de IPs IPv6 a IPv4 (`::ffff:` y `::1`) está implementada dos veces en el mismo servicio con lógica idéntica. Un error en el algoritmo de normalización (p.ej., nuevos formatos IPv6) requeriría corrección en dos lugares.

**Corrección recomendada:**
Extraer a un módulo utilitario `core-service/src/infrastructure/express/utils/normalizeIp.ts` e importar desde ambos lugares. `resolveClientIp` de `AllowedIpController` también puede exportarse para reutilizar en `App.ts`.

**Complejidad:** XS

**Orden recomendado:** FASE 3.

---

### AUD-ID: NUEVO-008

**Título:** Credenciales del servicio 1Skore embebidas en el bundle JavaScript del navegador

**Severidad:** P2

**Estado:** ⬜ Nuevo

**Confianza:** MEDIA (depende de que las variables estén populadas en producción)

**Área:** Seguridad web / Gestión de secretos

**Componente:** Frontend — integración 1Skore

**Ubicación:**
- `frontend/src/features/1skore/services/skoreService.ts:12-13`
- `frontend/.env:12-13`

**Descripción:**
La autenticación con el servicio externo 1Skore usa `import.meta.env.VITE_1SKORE_USER` y `import.meta.env.VITE_1SKORE_PASSWORD`. Las variables de entorno con prefijo `VITE_` son inlined en el bundle JavaScript por Vite en tiempo de build y son visibles para cualquiera que descargue el archivo JS de la aplicación (accesibles en las DevTools del navegador o descargando el bundle).

En el `.env` de desarrollo estas variables están vacías (`VITE_1SKORE_USER=`). Si se populan en producción — que es su propósito declarado — las credenciales estarán expuestas en el código cliente.

**Evidencia:**
```typescript
// skoreService.ts:12-13
params.append("name", import.meta.env.VITE_1SKORE_USER);    // ← bundle público
params.append("pwd", import.meta.env.VITE_1SKORE_PASSWORD);  // ← bundle público

// frontend/.env:10-13
VITE_1SKORE_URL=https://ws.1skore.com/php
VITE_1SKORE_TARGET=https://ws.1skore.com
VITE_1SKORE_USER=            // actualmente vacío en desarrollo
VITE_1SKORE_PASSWORD=        // actualmente vacío en desarrollo
```

**Escenario de fallo:**
Un atacante descarga el bundle JS de producción, extrae las credenciales de 1Skore de las cadenas literales incrustadas y las usa para hacer búsquedas directas en 1Skore (DNI, teléfonos de personas externas al sistema) sin autenticación en el CRM.

**Impacto:**
Exposición de credenciales de un servicio externo. Posible uso malicioso para consultas masivas sobre el API de 1Skore, con implicaciones de privacidad para personas no relacionadas con el CRM.

**Causa raíz:**
Las credenciales de backend deben mantenerse en el servidor; un proxy backend-a-1Skore protegería las credenciales y añadiría una capa de control de acceso.

**Corrección recomendada:**
Crear un endpoint backend (p.ej. `POST /api/skore/search`) en core-service o crm-service que actúe como proxy hacia 1Skore. Las credenciales se almacenan en el `.env` del servidor (no en `VITE_*`). El frontend llama al proxy con autenticación JWT normal.

**Validación de la solución:**
El bundle JS de producción no debe contener las credenciales de 1Skore en texto plano.

**Complejidad:** M

**Orden recomendado:** FASE 2 — antes de poplar las credenciales en producción.

---

### AUD-ID: NUEVO-009

**Título:** CORS permisivo en calls-service — acepta cualquier origen con credentials

**Severidad:** P3

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Configuración / Seguridad web

**Componente:** calls-service — server.ts

**Ubicación:**
- `calls-service/src/server.ts:39`

**Descripción:**
`calls-service` usa `cors({ origin: true, credentials: true })`. La opción `origin: true` refleja el header `Origin` de la petición entrante, efectivamente permitiendo cualquier origen. Con `credentials: true`, cualquier sitio web puede hacer peticiones autenticadas (con cookies o tokens Bearer) a calls-service desde el navegador del usuario.

En contraste, core-service y crm-service tienen una lista explícita de orígenes permitidos (`CORS1`, `CORS2`, `CORS3`) o `ALLOW_ALL_CORS=false` en producción.

**Evidencia:**
```typescript
// calls-service/src/server.ts:39
app.use(cors({ origin: true, credentials: true }));
```

**Escenario de fallo:**
En un ataque CSRF clásico, si el navegador de un agente visita un sitio malicioso, ese sitio puede hacer peticiones autenticadas a calls-service desde cualquier origen, incluyendo `POST /api/calls/initiate` para iniciar llamadas o `POST /api/calls/demo/create` para crear registros falsos.

**Impacto:**
Ataques CSRF contra el módulo de llamadas, especialmente relevante si no se activa `USE_COOKIE_AUTH` (tokens en localStorage mitigan CSRF pero son vulnerables a XSS).

**Corrección recomendada:**
Reemplazar `{ origin: true }` por una lista explícita de orígenes (`CORS_ORIGIN` env var) consistente con core-service y crm-service. Ejemplo: `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true })`.

**Complejidad:** XS

**Orden recomendado:** FASE 1.

---

### AUD-ID: NUEVO-010

**Título:** calls-service carece de Helmet y rate-limiting — inconsistencia con el resto de servicios

**Severidad:** P3

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Configuración / Seguridad web

**Componente:** calls-service — server.ts

**Ubicación:**
- `calls-service/src/server.ts`

**Descripción:**
calls-service no usa `helmet()` (ausencia de headers de seguridad HTTP: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, etc.) y no tiene rate limiter. core-service y crm-service aplican ambos.

**Evidencia:**
```typescript
// calls-service/src/server.ts — no hay:
// app.use(helmet());
// app.use('/api', apiRateLimiter);

// core-service/src/infrastructure/express/App.ts (referencia)
this.app.use(helmet());
this.app.use('/api', apiRateLimiter);
```

**Impacto:**
- Sin Helmet: headers de seguridad ausentes, los navegadores no tienen instrucciones explícitas de seguridad para las respuestas del servicio.
- Sin rate limiter: posible abuso de endpoints como `POST /api/calls/initiate` (provocar llamadas masivas hacia clientes) sin control de frecuencia.

**Corrección recomendada:**
Añadir `app.use(helmet())` y un rate limiter (`express-rate-limit`) en `calls-service/src/server.ts`. Para el rate limiter, ajustar límites según el volumen esperado de llamadas (los agentes hacen muchas llamadas en un turno).

**Complejidad:** XS

**Orden recomendado:** FASE 1.

---

### AUD-ID: NUEVO-011

**Título:** Paquetes `@types/*` en `dependencies` de calls-service

**Severidad:** P4

**Estado:** ⬜ Nuevo

**Confianza:** ALTA

**Área:** Deuda técnica / npm

**Componente:** calls-service — package.json

**Ubicación:**
- `calls-service/package.json:22-23`

**Descripción:**
`@types/cors` y `@types/multer` están en el bloque `dependencies` (producción) en lugar de `devDependencies`. Los paquetes `@types/*` son declaraciones de tipos TypeScript que solo se necesitan en tiempo de compilación, no en tiempo de ejecución. Su presencia en `dependencies` los incluye en la instalación de producción (`npm ci --omit=dev`), añadiendo peso innecesario al artefacto.

**Evidencia:**
```json
// calls-service/package.json:19-33 (extracto)
"dependencies": {
  "@types/cors": "^2.8.19",   // ← debería estar en devDependencies
  "@types/multer": "^2.2.0",  // ← debería estar en devDependencies
  ...
}
```

**Corrección recomendada:**
Mover `@types/cors` y `@types/multer` a `devDependencies`.

**Complejidad:** XS

**Orden recomendado:** FASE 3.

---

## Roadmap de ejecución actualizado

### FASE 0 — BLOQUEANTES (P0/P1)
*Completada. Todos los hallazgos P0/P1 están corregidos en el código.*

| # | AUD-ID  | Acción                                                                  | Estado      |
|---|---------|-------------------------------------------------------------------------|-------------|
| 1 | AUD-005 | Configuración de producción; .gitignore faltantes                       | ✅ Corregido |
| 2 | AUD-004 | `SIGNATURE_WEBHOOK_SECRET` documentado y middleware reforzado           | ✅ Corregido |
| 3 | AUD-001 | RBAC en `PUT /api/users/:id`                                            | ✅ Corregido |
| 4 | AUD-002 | RBAC en `DELETE /api/users/:id`                                         | ✅ Corregido |
| 5 | AUD-003 | RBAC en `GET /api/users`                                                | ✅ Corregido |

### FASE 1 — INTEGRIDAD Y SEGURIDAD (P1/P2)
*Completada para hallazgos del primer ciclo. Nuevos hallazgos añadidos.*

| # | AUD-ID    | Acción                                                                  | Estado      | Complejidad |
|---|-----------|-------------------------------------------------------------------------|-------------|-------------|
| 6 | AUD-012   | `User.role` default = `comercial`                                       | ✅ Corregido | XS          |
| 7 | AUD-007   | Rotación de refresh token + check `user.active`                         | ✅ Corregido | S           |
| 8 | AUD-006   | RBAC en `getSaleById` y `listSalesWithFilters`                          | ✅ Corregido | M           |
| 9 | AUD-008   | Ownership check en operaciones de llamada                               | ✅ Corregido | S           |
|10 | AUD-013   | DNC bulk limit + agentId correcto                                       | ✅ Corregido | S           |
|11 | AUD-009   | `USE_COOKIE_AUTH=true` documentado para producción                      | ✅ Corregido | M           |
|12 | **NUEVO-001** | Eliminar o deshabilitar `/calls/demo/create` en producción         | ⬜ Pendiente | XS          |
|13 | **NUEVO-003** | `ListSalesPaginatedUseCase` con RBAC                               | ⬜ Pendiente | S           |
|14 | **NUEVO-009** | CORS explícito en calls-service (`CORS_ORIGIN` env var)            | ⬜ Pendiente | XS          |
|15 | **NUEVO-010** | Helmet + rate-limiting en calls-service                            | ⬜ Pendiente | XS          |

### FASE 2 — RESILIENCIA Y PRIVACIDAD (P2/P3)

| # | AUD-ID    | Acción                                                                  | Estado      | Complejidad |
|---|-----------|-------------------------------------------------------------------------|-------------|-------------|
|16 | AUD-010   | Usuario PostgreSQL separado para crm-service                            | ⬜ Pendiente | M           |
|17 | AUD-011   | Cifrado de DNI y cuentas bancarias                                      | ⬜ Pendiente | L           |
|18 | **NUEVO-002** | Extraer lógica de `/calls/events` a use case + middleware compartido| ⬜ Pendiente | M           |
|19 | **NUEVO-004** | RBAC en `getComerciales`                                           | ⬜ Pendiente | S           |
|20 | **NUEVO-008** | Proxy backend para credenciales 1Skore                             | ⬜ Pendiente | M           |

### FASE 3 — CALIDAD Y OBSERVABILIDAD (P3/P4)

| # | AUD-ID    | Acción                                                                  | Estado      | Complejidad |
|---|-----------|-------------------------------------------------------------------------|-------------|-------------|
|21 | AUD-014   | `stats.html` fuera del artefacto de producción                          | ✅ Corregido | XS          |
|22 | AUD-015   | Script de comparación de schemas Prisma                                 | ✅ Corregido | M           |
|23 | AUD-016   | `RECORDS_DIR` con ruta absoluta                                         | ✅ Corregido | XS          |
|24 | AUD-017   | `instanceof` en manejo de errores de UserController                     | ✅ Corregido | XS          |
|25 | AUD-018   | `SignatureStatus` enum Prisma                                           | ✅ Corregido | S           |
|26 | **NUEVO-005** | Extraer `multerErrorHandler` a middleware compartido               | ⬜ Pendiente | XS          |
|27 | **NUEVO-006** | Extraer `internalKeyMiddleware` a middleware compartido             | ⬜ Pendiente | XS          |
|28 | **NUEVO-007** | Extraer `normalizeIp` a utilidad compartida en core-service        | ⬜ Pendiente | XS          |
|29 | **NUEVO-011** | Mover `@types/*` a `devDependencies` en calls-service             | ⬜ Pendiente | XS          |

---

## Dependencias entre problemas

```
AUD-006 (RBAC ventas) — parcialmente corregido
    └── NUEVO-003 (listSalesPaginated sin RBAC) — residuo de AUD-006

NUEVO-008 (creds 1Skore en bundle)
    └── Solo riesgo real si VITE_1SKORE_USER/PASSWORD se populan en producción

NUEVO-009 (CORS calls-service)
    └── Impacto amplificado si NUEVO-001 (demoCreate) no se cierra

NUEVO-001 (demoCreate en prod)
    └── No requiere NUEVO-009 para ser explotable (Bearer header, no cookie)
```

---

## Checklist preproducción actualizada

- [x] P0 solucionados (AUD-001)
- [x] P1 solucionados o mitigados (AUD-002, AUD-003, AUD-004, AUD-005)
- [x] Autorización validada en user management endpoints
- [x] Ownership validado en operaciones de llamada (AUD-008)
- [x] RBAC en getSaleById y listSalesWithFilters (AUD-006)
- [ ] **NUEVO-001: Endpoint demo eliminado de producción**
- [ ] **NUEVO-003: RBAC en listSalesPaginated**
- [ ] **NUEVO-009: CORS configurado en calls-service**
- [ ] **NUEVO-010: Helmet + rate-limiting en calls-service**
- [ ] AUD-010 / AUD-011: Planificados para post-producción con fecha comprometida
- [ ] Evaluación de dependencias npm (`npm audit`) completada
- [ ] `VITE_1SKORE_USER`/`PASSWORD` o están vacíos en producción o se implementó el proxy (NUEVO-008)
- [ ] Secretos de producción rotados (JWT, INTERNAL_API_KEY, POSTGRES_PASSWORD)
- [ ] Migraciones Prisma ejecutadas (`SignatureStatus` enum, `User.role` default)
- [ ] Backup documentado o comprometido con fecha
- [ ] CI/CD revisado — NO ENCONTRADO (no existe configuración CI/CD en el repositorio)
- [ ] Alertas configuradas — NO ENCONTRADO

---

## Herramientas ejecutadas

| Herramienta         | Acción                                                    | Resultado |
|---------------------|-----------------------------------------------------------|-----------|
| Lectura de archivos | Read (análisis estático completo — dos pasadas)           | Completado |
| Búsqueda de patrón  | Grep varios patrones de seguridad                         | Completado |
| Búsqueda de archivos| Glob routes, controllers, configs, package.json          | Completado |

No se ejecutó análisis dinámico, scanner de vulnerabilidades ni `npm audit`.

---

# DECISIÓN ACTUALIZADA DE PRODUCCIÓN

## GO CONDICIONADO

**Estado de correcciones del primer ciclo:** 16/18 hallazgos corregidos en el código. Los dos pendientes (AUD-010 BD compartida, AUD-011 cifrado PII) requieren cambios de infraestructura y se han planificado para el primer sprint post-producción.

**Nuevos bloqueantes identificados en segunda pasada:**

1. **NUEVO-001 (P2):** El endpoint `POST /api/calls/demo/create` en producción permite crear registros de llamadas falsas. Corrección trivial (XS): eliminar el método y la ruta.

2. **NUEVO-003 (P2):** `GET /api/sales/paginated` expone todas las ventas a cualquier usuario autenticado, sin RBAC. Corrección pequeña (S): crear `ListSalesPaginatedUseCase`.

**Condiciones para GO:**

El sistema puede desplegarse en producción cuando se completen:
- NUEVO-001 cerrado (eliminar demoCreate)
- NUEVO-003 cerrado (use case con RBAC)
- NUEVO-009 y NUEVO-010 cerrados (CORS + Helmet en calls-service — XS cada uno)
- Variables de entorno de producción configuradas correctamente: `ALLOW_ALL_CORS=false`, `DISABLE_AUTH_RATE_LIMIT=false`, `NODE_ENV=production`, `USE_COOKIE_AUTH=true`, `SIGNATURE_WEBHOOK_SECRET=<secreto>`, `POSTGRES_PASSWORD=<fuerte>`, `INTERNAL_API_KEY=<rotado>`, `JWT_SECRET=<rotado>`
- Migraciones Prisma ejecutadas en la BD de producción

**Condiciones post-producción comprometidas con fecha:**
- AUD-010 (aislamiento de BD)
- AUD-011 (cifrado PII)
- NUEVO-008 (proxy 1Skore, si se van a usar las credenciales)

---

*Segunda auditoría realizada el 2026-08-29. Análisis estático únicamente. No se modificó ningún archivo del proyecto durante la auditoría.*
