# Sistema de Llamadas — Arquitectura

**Fecha:** 26 de julio de 2026
**Version:** 2.0
**Estado:** Implementado — Fases 1-7 completas

---

## Vision general

El sistema de llamadas se compone de cuatro microservicios que se integran con el CRM sin modificar su nucleo:

| Servicio | Puerto | Descripcion |
|---|---|---|
| `core-service` | `:3001` | Auth, Usuarios, Configuracion del sistema, IPs permitidas |
| `crm-service` | `:3002` | Clientes, Ventas, Productos, Firmas, Contratos; proxy de llamadas |
| `calls-service` | `:3003` | Motor principal: gestion de llamadas, WebSocket, agenda, estado de agentes |
| `calls-connector` | `:3004` | Adaptador de proveedor: MockProvider, TwilioProvider, VicidialProvider |

`core-service` y `crm-service` comparten la misma base de datos PostgreSQL (schema `crm`).
`calls-service` usa su propia base de datos (schema `calls`).

---

## Diagrama de arquitectura

```
+---------------------------------------------------------------------+
|  Frontend  :5173                                                |
|  +----------------------+    +-----------------------------------+  |
|  |  CRM Pages           |    |  Calls Panel (feature/calls)      |  |
|  |  - Ventas / Clientes |    |  - Dialer                         |  |
|  |  - Click-to-call btn |    |  - Llamada activa + temporizador  |  |
|  |  - Historial en venta|    |  - Agenda / citas                 |  |
|  +----------+-----------+    |  - Historial de llamadas          |  |
|             |                |  - Estado agente (widget flotante) |  |
|             | REST           |  - Panel supervisor (/supervisor)  |  |
|             |                +----------------+------------------+  |
+-------------|-------------------------------|-----------------------+
              |                               | WebSocket (tiempo real)
              v                               v
+-------------------------------+  +-------------------------------+
|  core-service  :3001          |  |  crm-service  :3002           |
|  /api/users                   |  |  /api/clients                 |
|  /api/settings                |  |  /api/sales                   |
|  /api/allowed-ips             |  |  /api/products                |
|  /api/auth                    |  |  /api/calls (proxy)           |
|                               |  |  /api/recordings              |
|  PostgreSQL (schema: crm)     |  |  /api/signature               |
+-------------------------------+  |  /api/contract-*              |
                                   |                               |
                                   |  PostgreSQL (schema: crm)     |
                                   +---------------+---------------+
                                                   |
                                        HTTP  CallRequestDTO
                                                   v
+---------------------------------------------------------------------+
|  calls-service  :3003  -- motor de llamadas                        |
|  +---------------+  +------------------+  +--------------------+   |
|  |  REST API     |  |  WebSocket Server|  |  Agenda Scheduler  |   |
|  |  /api/calls   |  |  /ws             |  |  (setInterval 60s) |   |
|  |  /api/agenda  |  |  JWT auth        |  |  agenda:reminder   |   |
|  |  /api/agents  |  |  rooms x agente  |  +--------------------+   |
|  |  /api/        |  +------------------+                           |
|  |  supervisor   |                                                  |
|  +---------------+                                                  |
|  Prisma -> PostgreSQL (schema: calls)                               |
+----------------------------------+----------------------------------+
                                   |  HTTP  CallRequestDTO
                                   v        ^  CallEventDTO (webhook)
+---------------------------------------------------------------------+
|  calls-connector  :3004  -- UNICO PUNTO DE CAMBIO AL CAMBIAR       |
|                             PROVEEDOR                               |
|  POST /connect/call        recibe CallRequestDTO -> llama proveedor |
|  POST /provider/webhook    recibe webhook -> normaliza DTO          |
|  GET  /twilio/twiml/:id    TwiML para Twilio (sin autenticacion)    |
|  POST /twilio/webhook      callbacks de estado Twilio              |
|                                                                     |
|  ICallProvider                                                      |
|  +-- TwilioProvider    (Twilio REST API + TwiML, PROVIDER=twilio)  |
|  +-- VicidialProvider  (stub, PROVIDER=vicidial)                   |
|  +-- MockProvider      (simulacion, PROVIDER=mock)                 |
+----------------------------------+----------------------------------+
                                   |  API nativa del proveedor
                                   v    ^ Webhooks nativos
+---------------------------------------------------------------------+
|  Proveedor de llamadas (intercambiable)                             |
|  Twilio  /  Vicidial  /  cualquier otro                             |
+---------------------------------------------------------------------+
```

---

## La regla del conector

> El CRM y `calls-service` **solo conocen** `CallRequestDTO` y `CallEventDTO`.
> El conector traduce esos DTOs al protocolo nativo del proveedor.
> **Cambiar de proveedor = redesplegar unicamente `calls-connector`.**
> Cero cambios en el CRM y cero cambios en `calls-service`.

---

## DTOs -- contrato entre servicios

### CallRequestDTO

```typescript
interface CallRequestDTO {
  callId:          string;   // UUID generado por calls-service
  agentId:         string;   // CRM User.id
  agentExtension?: string;   // extension SIP / numero del agente
  clientPhone:     string;   // numero a marcar -- E.164: +34612345678
  clientId?:       string;   // CRM Client.id (contexto)
  saleId?:         string;   // CRM Sale.id (contexto)
  callbackUrl:     string;   // URL donde el conector enviara CallEventDTOs
  record:          boolean;  // si el proveedor debe grabar la llamada
  metadata?:       Record<string, unknown>;
}
```

### CallEventDTO

```typescript
type CallEventType =
  | 'initiated'   // llamada creada en el proveedor
  | 'ringing'     // sonando en el telefono del cliente
  | 'answered'    // cliente descuelga
  | 'completed'   // llamada finalizada
  | 'no-answer'   // no contesto
  | 'busy'        // linea ocupada
  | 'failed'      // error del proveedor
  | 'recording';  // grabacion disponible

interface CallEventDTO {
  callId:         string;     // UUID original de calls-service (echo)
  providerCallId: string;     // ID del proveedor (Twilio CallSid, etc.)
  event:          CallEventType;
  timestamp:      string;     // ISO 8601
  duration?:      number;     // segundos -- solo en 'completed'
  recordingUrl?:  string;     // URL publica de grabacion
  disposition?:   string;     // answered / no-answer / busy / failed
  providerRaw?:   unknown;    // payload original del proveedor (debug)
}
```

### SupervisorStats (calls-service)

```typescript
interface SupervisorStats {
  today: {
    total:        number;
    answered:     number;
    answerRate:   number;  // porcentaje 0-100
    avgDuration:  number;  // segundos
    activeCalls:  number;
  };
  agents: {
    total:     number;
    online:    number;
    available: number;
    busy:      number;
    paused:    number;
    offline:   number;
  };
}
```

---

## Base de datos -- calls-service

Base de datos **propia** (schema `calls`), independiente del CRM.
Los IDs de agente, cliente y venta son referencias externas (strings), sin foreign keys reales.

### model Call

| Campo | Tipo | Descripcion |
|---|---|---|
| id | String uuid PK | generado por calls-service |
| agentId | String | CRM User.id (referencia externa) |
| clientId | String? | CRM Client.id (referencia externa) |
| saleId | String? | CRM Sale.id (referencia externa) |
| clientPhone | String | numero marcado (E.164) |
| providerCallId | String? | ID del proveedor, llega con el primer evento |
| status | CallStatus enum | initiated -> ringing -> answered -> completed / failed |
| direction | CallDirection | outbound / inbound |
| duration | Int? | segundos, rellenado al completar |
| recordingUrl | String? | URL de grabacion del proveedor |
| disposition | String? | answered / no-answer / busy / failed |
| agendaEntryId | String? | si la llamada viene de una cita agendada |
| startedAt | DateTime? | cuando se inicio |
| answeredAt | DateTime? | cuando contesto el cliente |
| endedAt | DateTime? | cuando termino |
| createdAt | DateTime | |

### model CallEvent

| Campo | Tipo | Descripcion |
|---|---|---|
| id | String uuid PK | |
| callId | String -> Call | |
| event | String | ringing / answered / completed / ... |
| payload | Json? | CallEventDTO completo (auditoria) |
| createdAt | DateTime | |

### model AgendaEntry

| Campo | Tipo | Descripcion |
|---|---|---|
| id | String uuid PK | |
| agentId | String | CRM User.id |
| clientId | String? | CRM Client.id |
| saleId | String? | CRM Sale.id |
| clientPhone | String | |
| clientName | String? | snapshot del nombre del cliente |
| scheduledAt | DateTime | cuando esta programada la llamada |
| reminderAt | DateTime? | cuando notificar al agente |
| notes | String? | |
| status | AgendaStatus | pending / called / cancelled / rescheduled |
| priority | Priority | low / normal / high |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### model AgentSession

| Campo | Tipo | Descripcion |
|---|---|---|
| agentId | String PK | CRM User.id |
| status | AgentStatus | offline / available / busy / paused |
| extension | String? | numero SIP / extension del agente |
| activeCallId | String? | llamada activa en este momento |
| updatedAt | DateTime | |

---

## WebSocket -- eventos en tiempo real

El `calls-service` expone un servidor WebSocket en `/ws`.
El frontend conecta al iniciar sesion usando el mismo JWT del CRM.
Cada agente solo recibe sus propios eventos (rooms por agentId).
Los supervisores reciben adicionalmente los eventos de todos los agentes.

| Evento | Cuando | Accion en UI |
|---|---|---|
| `call:initiated` | Llamada creada | Agente pasa a estado busy |
| `call:ringing` | Telefono del cliente sonando | Mostrar temporizador |
| `call:answered` | Cliente descuelga | Iniciar contador de duracion |
| `call:completed` | Llamada terminada | Mostrar duracion, pedir disposicion |
| `call:no-answer` | No contesto | Ofrecer reagendar |
| `call:busy` | Linea ocupada | Notificar al agente |
| `call:failed` | Error del proveedor | Mostrar error, habilitar reintentar |
| `call:recording` | Grabacion disponible | Enlace para adjuntar a la venta |
| `agenda:reminder` | Cita proxima | Notificacion con boton "Llamar ahora" |
| `agent:status-changed` | Cambio de estado | Actualizar panel del supervisor |

---

## API Endpoints -- calls-service (:3003)

```
POST   /api/calls/initiate          iniciar llamada
POST   /api/calls/:callId/hangup    colgar llamada activa
GET    /api/calls                   historial paginado con filtros
GET    /api/calls/:callId           detalle de llamada y eventos
POST   /api/calls/webhook           recibe CallEventDTO del conector (interno)

GET    /api/agenda                  agenda del agente
POST   /api/agenda                  crear cita
PATCH  /api/agenda/:id              actualizar cita
DELETE /api/agenda/:id              eliminar cita

GET    /api/agents/me               estado del agente conectado
PATCH  /api/agents/me/status        cambiar estado: available / paused / offline
GET    /api/agents                  lista de agentes y estado

GET    /api/supervisor/stats        estadisticas del dia + conteo de agentes por estado
GET    /api/supervisor/active-calls llamadas activas con estado del agente
GET    /api/supervisor/agents       todas las sesiones de agente

GET    /health
GET    /metrics                     Prometheus
```

## API Endpoints -- calls-connector (:3004)

```
POST   /connect/call           recibe CallRequestDTO -> llama al proveedor
POST   /provider/webhook       webhook nativo (normalizado ya en CallEventDTO, usado por Mock)

GET    /twilio/twiml/:callId   TwiML: controla el flujo de la llamada en Twilio
POST   /twilio/webhook         callbacks de estado Twilio (form-encoded, sin API key)

GET    /health
```

---

## Proveedor Twilio -- flujo completo

```
1. calls-service --> POST /connect/call  (CallRequestDTO)
                               |
2.             TwilioProvider.initiateCall()
               POST https://api.twilio.com/.../Calls.json
               To=clientPhone, From=TWILIO_NUMBER
               Url=https://connector/twilio/twiml/{callId}
               StatusCallback=https://connector/twilio/webhook?callId={callId}
                               |
3.          Twilio llama al cliente (clientPhone)
                               |
4.          Twilio GET /twilio/twiml/{callId}
            <- TwiML: <Dial><Number>agentExtension</Number></Dial>
               o <Dial><Sip>agent@sip.domain</Sip></Dial>
               o <Conference>{callId}</Conference>
                               |
5.          Estado change: POST /twilio/webhook?callId={callId}
            Body form-encoded: CallStatus=in-progress, CallSid=CA...
                               |
6.          twilioRoutes.ts normaliza -> CallEventDTO { event: 'answered', ... }
            POST callbackUrl (calls-service /api/calls/webhook)
                               |
7.          calls-service actualiza Call en DB, emite WS event al agente
```

**Variables de entorno necesarias (PROVIDER=twilio):**

```env
PROVIDER=twilio
CONNECTOR_PUBLIC_URL=https://xxxx.ngrok.io  # URL publica para Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_NUMBER=+34900000000
```

---

## Autenticacion entre servicios

El `calls-service` valida los JWTs del CRM usando el **mismo `JWT_SECRET`**.
Los agentes se autentican en el CRM y ese token es valido para `calls-service`.

Para llamadas internas entre servicios se usa una `INTERNAL_API_KEY` compartida.
Los endpoints de Twilio (`/twilio/*`) no requieren API key porque Twilio no puede enviarla.

```
core-service      JWT_SECRET=X   INTERNAL_API_KEY=Y
crm-service       JWT_SECRET=X   INTERNAL_API_KEY=Y
calls-service     JWT_SECRET=X   INTERNAL_API_KEY=Y
calls-connector                  INTERNAL_API_KEY=Y
```

---

## Cambios en el CRM existente

Todo fue **aditivo y no destructivo**.

### Nuevos endpoints en crm-service (:3002)

```
POST   /api/calls/initiate       proxy al calls-service
POST   /api/calls/events         recibe CallEventDTO -> graba en SaleHistory
GET    /api/sales/:saleId/calls  historial de llamadas de una venta
```

### SaleHistory -- acciones nuevas

```typescript
'call_initiated'   // agente inicio una llamada desde esta venta
'call_answered'    // cliente descuelga
'call_completed'   // llamada finalizada -- payload: { duration, disposition }
'call_no_answer'   // no contesto
'call_recorded'    // grabacion disponible -- payload: { recordingUrl }
```

### Sale.metadata -- campos nuevos

```typescript
// Sale.metadata ya es Json -- se anadio sin cambiar el schema:
{
  lastCall: {
    callId:      string,
    at:          string,   // ISO 8601
    duration:    number,   // segundos
    disposition: string,
    agentId:     string,
  }
}
```

---

## Refactorizacion arquitectural

El backend original (`core-service`) contenia auth, usuarios y toda la logica de negocio.
Se dividio en dos microservicios independientes:

- **core-service** (`core-service/`, puerto 3001): solo auth, usuarios, configuracion e IPs.
- **crm-service** (`crm-service/`, puerto 3002): toda la logica de negocio CRM.

Ambos comparten la misma instancia de PostgreSQL (mismo host, mismo schema `crm`, mismo `JWT_SECRET`).
No hay cross-service FK enforcement a nivel de aplicacion: los IDs de usuario se almacenan como strings en crm-service.

El frontend usa dos instancias de axios:
- `src/api/axios.ts` con `VITE_API_URL` (:3001) -> auth, usuarios, configuracion, IPs
- `src/api/crmApi.ts` con `VITE_CRM_API_URL` (:3002) -> clientes, ventas, productos, firmas, contratos
