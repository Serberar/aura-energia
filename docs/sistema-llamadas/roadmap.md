# Sistema de Llamadas -- Roadmap de Implementacion

**Fecha:** 26 de julio de 2026
**Estado general:** Fases 1-7 completas

---

## Resumen de fases

| Fase | Que se construye | Estado |
|---|---|---|
| **0** | Refactorizacion arquitectural: core-service + crm-service | COMPLETO |
| **1** | `calls-connector` con MockProvider | COMPLETO |
| **2** | `calls-service` -- core y base de datos | COMPLETO |
| **3** | Integracion calls-service <-> crm-service | COMPLETO |
| **4** | Frontend -- widget flotante y panel basico | COMPLETO |
| **5** | Agenda y recordatorios | COMPLETO |
| **6** | Panel supervisor y metricas | COMPLETO |
| **7** | Proveedor real (TwilioProvider + VicidialProvider) | COMPLETO |
| **8** | Sistema de modulos + sms-connector | COMPLETO |

---

## FASE 0 -- Refactorizacion arquitectural

El backend original contenia auth y logica de negocio en el mismo servicio.
Se dividio en dos microservicios que comparten la misma base de datos PostgreSQL.

- [x] `core-service` (core-service/, puerto 3001): auth, usuarios, configuracion, IPs
- [x] `crm-service` (crm-service/, puerto 3002): clientes, ventas, productos, firmas, contratos
- [x] `ServiceContainer` de cada servicio contiene solo sus propios casos de uso
- [x] `HealthChecker` de core-service simplificado (sin repos de cliente/venta)
- [x] Eliminados ~50 ficheros del arbol `src/` de core-service (controladores, repos, entidades de negocio)
- [x] Eliminados ficheros de usuario de crm-service (UserController, userRoutes, 7 use cases)
- [x] Frontend: creado `src/api/crmApi.ts` apuntando a crm-service (:3002)
- [x] 8 servicios del frontend migrados a `crmApi` (client, product, sale, saleStatus, recording, signature, contractConfig, contractTemplate)
- [x] `calls-service/.env`: `CRM_BACKEND_URL` cambiado a puerto 3002

---

## FASE 1 -- calls-connector con MockProvider

- [x] Scaffolding del proyecto (package.json, tsconfig, server.ts)
- [x] `ICallProvider` interface
- [x] `MockProvider` con simulacion completa de eventos (80% answer rate)
- [x] `POST /connect/call` con validacion Zod
- [x] `POST /provider/webhook` (esqueleto para proveedor real)
- [x] `apiKeyMiddleware` para autenticacion interna
- [x] `providerFactory.ts` selecciona proveedor segun `PROVIDER` env var

---

## FASE 2 -- calls-service (core)

- [x] Scaffolding y configuracion Prisma (base de datos `calls`)
- [x] Schema Prisma: Call, CallEvent, AgendaEntry, AgentSession
- [x] Entidades de dominio y repositorios
- [x] `InitiateCallUseCase`
- [x] `HandleCallEventUseCase`
- [x] `HangUpCallUseCase`
- [x] `CreateAgendaEntryUseCase` / `UpdateAgendaEntryUseCase`
- [x] `UpdateAgentStatusUseCase`
- [x] WebSocket Server con rooms por agentId
- [x] Endpoints REST (calls, agenda, agents)
- [x] `authMiddleware` usando el mismo JWT_SECRET que el CRM

---

## FASE 3 -- Integracion con crm-service

- [x] `CrmApiClient` en calls-service para consultar datos de cliente/venta
- [x] `POST /api/calls/initiate` en crm-service (proxy al calls-service)
- [x] `POST /api/calls/events` en crm-service (recibe CallEventDTO, graba SaleHistory)
- [x] `GET /api/sales/:saleId/calls` en crm-service (historial de llamadas)
- [x] Registro de `call_*` en SaleHistory (initiated, answered, completed, no_answer, recorded)
- [x] `Sale.metadata.lastCall` actualizado al completar la llamada

---

## FASE 4 -- Frontend: widget flotante y panel basico

- [x] `callsSlice.ts` en Redux (estado: activeCall, agentStatus, callHistory)
- [x] `useCallsWebSocket.ts` -- conexion WS, dispatch eventos a Redux
- [x] `CallWidget.tsx` -- widget flotante en Layout (visible en todas las paginas)
- [x] Estados del widget: IDLE / CALLING / IN_CALL / COMPLETED / NO_ANSWER
- [x] Click-to-call en ficha de cliente y venta
- [x] Pagina `/calls` con DialerPanel, AgentStatusBar y CallHistory
- [x] `callsApi.ts` -- instancia axios apuntando a calls-service (:3003)

---

## FASE 5 -- Agenda y recordatorios

- [x] Pagina `/calls/agenda` con vista lista y modal de creacion
- [x] Crear / editar / cancelar citas (`CreateAgendaEntryUseCase`, `UpdateAgendaEntryUseCase`)
- [x] `AgendaScheduler` -- cada 60s busca citas con `reminderAt <= now`, emite `agenda:reminder` por WS
- [x] `ReminderToast.tsx` -- notificacion en frontend con boton "Llamar ahora"
- [x] La llamada desde recordatorio vincula `agendaEntryId` y pasa la cita a estado `called`

---

## FASE 6 -- Panel supervisor y metricas

- [x] Pagina `/calls/supervisor` (roles: administrador, coordinador)
- [x] 6 tiles de estadisticas del dia (total, contestadas, tasa, duracion media, activas, online)
- [x] Tabla de llamadas activas con duracion en vivo
- [x] Grid de tarjetas de agentes con estado en tiempo real
- [x] Auto-refresco cada 30 segundos + boton manual
- [x] `GET /api/supervisor/stats` en calls-service
- [x] `GET /api/supervisor/active-calls` en calls-service
- [x] `GET /api/supervisor/agents` en calls-service
- [x] `supervisorSlice.ts` en Redux con actualizaciones WS en tiempo real
- [x] `useCallsWebSocket.ts` extendido para despachar `agent:status-changed` al supervisor slice
- [x] Route `/calls/supervisor` con `moduleKey: "calls"` (respeta toggle del modulo)

---

## FASE 7 -- TwilioProvider (proveedor real)

- [x] `TwilioProvider.ts` completo (sin SDK de Twilio, usando axios directo)
  - [x] `initiateCall()`: llama a Twilio REST API, construye URLs de TwiML y StatusCallback
  - [x] `hangUp()`: actualiza estado de la llamada a `completed` via Twilio REST API
  - [x] Validacion de credenciales y CONNECTOR_PUBLIC_URL en el constructor
- [x] `twilioCallStore.ts` -- Map en memoria para datos de llamada (agentExtension, callbackUrl)
- [x] `GET /twilio/twiml/:callId` -- responde con TwiML segun tipo de extension del agente:
  - [x] Numero de telefono (+...) -> `<Dial><Number>`
  - [x] SIP address (...@...) -> `<Dial><Sip>`
  - [x] Sin extension -> `<Conference>` (sala nombrada por callId)
- [x] `POST /twilio/webhook` -- normaliza callbacks form-encoded de Twilio a CallEventDTO
  - [x] Mapeo completo de CallStatus: initiated/queued/ringing/in-progress/completed/busy/no-answer/failed/canceled
  - [x] Soporte de RecordingStatus=completed -> evento `recording`
  - [x] Siempre devuelve 200 a Twilio para evitar reintentos
  - [x] Limpia el store en eventos terminales
- [x] `express.urlencoded()` montado en server.ts (Twilio envia form-encoded)
- [x] `.env.example` actualizado con `CONNECTOR_PUBLIC_URL` y credenciales Twilio
- [x] `config.ts` extendido con `connectorPublicUrl`

### Cambio de proveedor

```bash
# calls-connector/.env
PROVIDER=twilio
CONNECTOR_PUBLIC_URL=https://xxxx.ngrok.io
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_NUMBER=+34900000000
```

Cero cambios en calls-service, crm-service, core-service y frontend.

---

## FASE 7b -- VicidialProvider

Vicidial no tiene webhooks nativos -- el estado se obtiene por polling cada 3 segundos.

- [x] `VicidialProvider.ts` completo
  - [x] `initiateCall()`: llama a `non_agent_api.php?function=external_dial`
  - [x] `hangUp()`: llama a `function=external_hangup`
  - [x] Polling cada 3s via `function=agent_status` para detectar cambios de estado
  - [x] Maquina de estados: QUEUE->ringing, INCALL->answered, DISPO/READY/DEAD->completed o no-answer
  - [x] Safety timeout: para el polling tras 2 horas si no llega estado terminal
  - [x] Soporte de parametros opcionales `VICIDIAL_CAMPAIGN_ID` y `VICIDIAL_CALL_SERVER_IP`
- [x] `config.ts` extendido con `vicidial.campaignId` y `vicidial.callServerIp`
- [x] `.env.example` documentado con instrucciones de uso (agente debe estar logueado en Vicidial)

### Diferencias clave frente a Twilio

| Aspecto | Twilio | Vicidial |
|---|---|---|
| Notificaciones | Webhooks HTTP (push) | Polling HTTP (pull) |
| Rutas nuevas en conector | `/twilio/twiml` + `/twilio/webhook` | Ninguna |
| Requiere URL publica | Si (CONNECTOR_PUBLIC_URL) | No |
| Agente en sesion | No (Twilio llama al agente) | Si (agente debe estar en Vicidial) |
| Extension del agente | Telefono/SIP/conferencia | agent_user de Vicidial (numero entero) |

---

---

## FASE 8 -- Sistema de modulos + sms-connector

### 8a -- Sistema de modulos (frontend + backend)

- [x] `settingsSlice.ts` generalizado para 3 modulos con `Promise.allSettled`
  - [x] `loadModuleSettings` carga `calls_module_enabled`, `crm_module_enabled`, `sms_module_enabled` en paralelo
  - [x] `saveModuleSetting({ key, value })` thunk para guardar cualquier modulo
  - [x] Aliases de compatibilidad: `loadCallsSetting`, `saveCallsSetting`
- [x] `AppRoutes.tsx` actualizado: llama a `loadModuleSettings` en lugar de `loadCallsSetting`
- [x] `Menu.tsx` extendido: `crmModuleEnabled` + `smsModuleEnabled` desde Redux, `enabledModules` record
- [x] `routesConfig.tsx` reescrito:
  - [x] `moduleKey: "crm"` en `/crm`, `/clients`, `/products`, `/sales`, `/sales/create`, `/sales/:saleId`, `/sale-status`
  - [x] `/settings/modules` route nueva con `ModulesPage` lazy-loaded
- [x] `SettingsPage.tsx` simplificado: enlace "Gestionar modulos" a `/settings/modules`
- [x] `ModulesPage.tsx` creado (`src/pages/settings/modules/`): card por modulo con toggle
- [x] `ModulesPage.module.scss`: CSS Modules, `--accent` custom property, soporte dark mode
- [x] Seed de BD actualizado (`core-service/prisma/seed.ts`): `calls_module_enabled`, `crm_module_enabled`, `sms_module_enabled`

### 8b -- sms-connector (microservicio, puerto 3005)

- [x] Scaffolding: `package.json`, `tsconfig.json`, `.env`, `.env.example`
- [x] `ISmsSender` interface: `send(dto) → { providerSmsId }`
- [x] `SendSmsDTO` / `SmsEventDTO` (Zod)
- [x] `MockSmsSender`: simula queued→sent→delivered (300/800/2000ms)
- [x] `TwilioSmsSender`: Twilio Messages API via axios (sin SDK), StatusCallback a `/twilio/status`
- [x] `providerFactory.ts` singleton: selecciona mock o twilio via `PROVIDER` env var
- [x] `POST /sms/send` (API key protegido)
- [x] `POST /twilio/status?smsId=xxx` (callback Twilio, sin API key)
- [x] Mapeo completo de `MessageStatus` → `SmsEventDTO.event`
- [x] TypeScript limpio (`npx tsc --noEmit` sin errores)

---

## FASE 9 -- Frontend SMS

- [x] `src/features/sms/types.ts` -- SmsStatus, Sms, SmsState
- [x] `src/features/sms/services/api.ts` -- SMS_ENDPOINTS
- [x] `src/features/sms/services/smsApi.ts` -- instancia axios apuntando a sms-service (:3006)
- [x] `src/features/sms/services/smsService.ts` -- sendSms, listSms, getSmsById
- [x] `src/features/sms/smsSlice.ts` -- Redux slice (sendSms, fetchSmsHistory, wsSmsUpdated)
- [x] `src/features/sms/hooks/useSmsWebSocket.ts` -- conexion WS, JWT auth, dispatch a Redux
- [x] `src/features/sms/components/SendSmsModal.tsx` -- modal de composicion de SMS
- [x] `src/pages/sms/SmsPage.tsx` -- panel con historial, estado WS y boton "Nuevo SMS"
- [x] `src/app/store.ts` -- smsReducer registrado
- [x] `src/routes/routesConfig.tsx` -- route `/sms` con `moduleKey: "sms"`
- [x] `src/features/sales/components/SaleDetail.tsx` -- boton click-to-SMS (💬) junto a cada telefono
- [x] `.env` / `.env.example` -- VITE_SMS_API_URL y VITE_SMS_WS_URL

---

## Pendiente

| Tarea | Prioridad | Descripcion |
|---|---|---|
| sms-service DB init | Alta | `cd sms-service && npx prisma db push` para crear tablas Sms y SmsEvent |
| Seed BD (ejecutar) | Alta | `cd core-service && npx ts-node prisma/seed.ts` si los registros no existen aun |
| Renombrar carpetas | Alta | `CRM-Elite-backend` -> `core-service` y `CRM-Elite-frontend` -> `frontend` (manual con VS Code cerrado) |
| Metricas Prometheus calls-service | Baja | calls_initiated_total, call_duration_seconds, etc. |
| Tests E2E | Baja | Prueba end-to-end con llamada real (Twilio o Vicidial) |
