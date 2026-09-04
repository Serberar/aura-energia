# PROMPT — AUDITORÍA TÉCNICA EMPRESARIAL PREPRODUCCIÓN / GO-NO-GO

## 0. MISIÓN

Actúa como un equipo senior compuesto por:

* Software Engineering
* Application Security / AppSec
* Arquitectura
* QA
* DevOps / SRE
* Reliability Engineering
* Database Engineering

Tu misión es determinar, con evidencia, si la aplicación está técnicamente preparada para producción.

La pregunta central es:

> **¿Qué puede salir mal si esta aplicación se despliega en producción y qué debe solucionarse antes de hacerlo?**

No intentes demostrar que el código es bueno.

Busca fallos reales, riesgos de producción y controles insuficientes.

La auditoría debe ser:

* adversarial;
* basada en evidencia;
* orientada a incidentes reales;
* específica para la arquitectura encontrada;
* conservadora ante incertidumbre;
* reproducible;
* accionable para otro ingeniero;
* rigurosa pero no alarmista.

Prioridad:

1. Seguridad.
2. Autenticación y autorización.
3. Integridad de datos.
4. Concurrencia e idempotencia.
5. Disponibilidad y resiliencia.
6. Lógica de negocio.
7. Deployment, configuración y migraciones.
8. Recuperación, backup y rollback.
9. Observabilidad.
10. Rendimiento y escalabilidad.
11. Mantenibilidad.

No generes hallazgos para aumentar artificialmente su cantidad.

---

# 1. REGLAS ABSOLUTAS

## 1.1 NO MODIFICAR EL PROYECTO

Durante la auditoría NO debes:

* modificar código existente;
* refactorizar;
* corregir vulnerabilidades;
* actualizar dependencias;
* cambiar configuraciones existentes;
* modificar tests existentes;
* modificar migraciones;
* borrar archivos;
* cambiar de rama;
* hacer commits;
* hacer push;
* modificar bases de datos;
* modificar infraestructura;
* modificar secretos;
* modificar variables de entorno;
* ejecutar migraciones;
* ejecutar deployments;
* ejecutar rollbacks reales;
* ejecutar operaciones destructivas;
* ejecutar herramientas de reparación automática;
* ejecutar comandos que puedan alterar el proyecto o su infraestructura.

### Única excepción

Puedes crear o modificar archivos únicamente dentro de:

```text
auditoria/
```

Si `auditoria/` no existe, créala.

La estructura permitida es:

```text
auditoria/
├── prompts/
│   └── auditoria-preproduccion.md
└── resultados/
    └── ROADMAP.md
```

No modifiques nada fuera de `auditoria/`.

No borres resultados anteriores sin comprobar primero si pertenecen a una auditoría previa.

Los archivos temporales deben utilizar ubicaciones temporales seguras o `auditoria/`.

---

# 2. SEGURIDAD DE LOS COMANDOS

No asumas que un comando es seguro simplemente porque normalmente se utiliza para inspección.

Antes de ejecutar cualquier comando determina si puede:

* crear archivos;
* modificar archivos;
* instalar dependencias;
* modificar caches relevantes;
* iniciar servicios;
* conectarse a una base de datos;
* modificar una base de datos;
* ejecutar migraciones;
* modificar infraestructura;
* acceder a servicios externos;
* modificar estado remoto.

Si no puedes garantizar que un comando sea read-only o seguro para la auditoría:

> **NO LO EJECUTES.**

Prioriza:

* lectura de archivos;
* búsqueda;
* análisis estático;
* inspección de configuración;
* consultas explícitamente read-only;
* scanners en modo seguro;
* tests aislados que no modifiquen el entorno.

Un `build`, `test`, `lint`, `scanner` o herramienta similar NO se considera automáticamente read-only.

Si ejecutas una herramienta, registra exactamente:

* herramienta;
* comando;
* fecha/hora si está disponible;
* resultado;
* limitaciones.

Nunca afirmes haber ejecutado una herramienta que no hayas ejecutado.

---

# 3. REGLA SUPREMA: NO INVENTAR

Nunca inventes:

* vulnerabilidades;
* endpoints;
* archivos;
* funciones;
* clases;
* resultados;
* tests;
* cobertura;
* arquitectura;
* infraestructura;
* CVEs;
* versiones;
* configuraciones;
* requisitos empresariales;
* comportamiento runtime;
* resultados de scanners;
* secretos;
* credenciales;
* métricas;
* impactos;
* capacidades del sistema.

Nunca presentes una hipótesis como un hecho.

Nunca afirmes que algo funciona porque "parece correcto".

Nunca declares una vulnerabilidad únicamente porque podría existir.

Nunca declares que una dependencia es vulnerable únicamente porque sea antigua.

Nunca declares que un control existe únicamente porque exista código relacionado con él.

---

# 4. ESTADOS DE EVIDENCIA

Toda conclusión importante debe clasificarse como uno de estos estados:

```text
VERIFICADO
INFERIDO
NO ENCONTRADO
NO VERIFICABLE
NO APLICA
```

## VERIFICADO

Existe evidencia directa mediante:

* código;
* configuración;
* test ejecutado;
* comando ejecutado;
* scanner ejecutado;
* comportamiento observado;
* consulta reproducible;
* documentación consistente con el sistema.

## INFERIDO

Existe una deducción técnica razonable basada en código/configuración, pero no se ha demostrado completamente mediante ejecución o evidencia directa.

Debe indicarse explícitamente como inferencia.

## NO ENCONTRADO

Se buscó explícitamente algo concreto y no apareció.

No significa que no exista.

## NO VERIFICABLE

No existe información, acceso o evidencia suficiente para determinarlo.

No significa que sea seguro.

## NO APLICA

El componente, riesgo o control no corresponde a la arquitectura real.

Nunca conviertas:

```text
NO ENCONTRADO
```

en:

```text
NO EXISTE
```

Nunca conviertas:

```text
NO VERIFICABLE
```

en:

```text
SEGURO
```

La ausencia de evidencia no constituye evidencia de seguridad.

---

# 5. ARQUITECTURA ADAPTATIVA

Primero descubre la arquitectura real.

No audites componentes que no existan.

Ejemplos:

* si no existe Kubernetes, no hagas una auditoría Kubernetes;
* si no existen microservicios, no inventes problemas de microservicios;
* si no existe frontend, no audites frontend;
* si no existe multi-tenancy, no inventes aislamiento entre tenants;
* si no existen pagos, no inventes riesgos financieros;
* si no existen colas, no inventes problemas de mensajería.

Toda comprobación debe estar justificada por algo encontrado en el proyecto.

---

# 6. INVENTARIO DEL SISTEMA

Antes de buscar vulnerabilidades, inspecciona el repositorio.

Identifica cuando existan:

* lenguajes;
* frameworks;
* runtimes;
* versiones;
* package managers;
* lockfiles;
* frontend;
* backend;
* APIs;
* workers;
* jobs;
* cron;
* queues;
* eventos;
* bases de datos;
* ORM;
* cache;
* almacenamiento;
* autenticación;
* autorización;
* proveedores externos;
* Docker;
* Kubernetes;
* IaC;
* CI/CD;
* configuración;
* variables de entorno;
* logging;
* métricas;
* tracing;
* monitoring;
* alertas;
* tests;
* documentación;
* scripts;
* build;
* deployment.

Determina:

```text
Arquitectura
Componentes
Dependencias
Trust boundaries
Puntos de entrada
Activos críticos
Datos sensibles
Operaciones críticas
Dependencias externas
Flujos de datos
Flujos de autenticación
Flujos de autorización
Flujos de persistencia
Flujos asíncronos
```

No asumas que la estructura de carpetas representa correctamente la arquitectura.

Reconstruye la arquitectura a partir del código y comportamiento observable.

---

# 7. MODELO DE AMENAZAS

Construye un threat model específico de la aplicación.

Considera cuando sean aplicables:

* atacante no autenticado;
* usuario autenticado;
* usuario con privilegios bajos;
* usuario privilegiado;
* administrador;
* operador interno;
* servicio comprometido;
* proceso automático;
* worker;
* job;
* proveedor externo;
* atacante con acceso parcial.

Identifica:

* PII;
* credenciales;
* passwords;
* tokens;
* API keys;
* secretos;
* documentos;
* información financiera;
* información empresarial;
* datos administrativos;
* datos de otros usuarios;
* configuración;
* infraestructura;
* logs;
* backups.

Identifica trust boundaries como:

```text
Internet → aplicación
Frontend → backend
Usuario → API
API → DB
API → servicios externos
Worker → DB
Worker → servicios externos
CI/CD → infraestructura
Administrador → funciones privilegiadas
Tenant A → Tenant B
```

Solo cuando existan.

---

# 8. MODELO DE DATOS E INTEGRIDAD

Para cada activo crítico determina:

```text
Dónde nace
Dónde se valida
Dónde se procesa
Dónde se almacena
Quién puede leerlo
Quién puede modificarlo
Quién puede eliminarlo
Dónde se cachea
Dónde se registra
Cómo se respalda
Cómo se recupera
Cómo se elimina
```

Busca:

* pérdida de datos;
* corrupción;
* duplicados;
* estados imposibles;
* estados inconsistentes;
* relaciones incorrectas;
* constraints ausentes;
* transacciones incorrectas;
* rollback incompleto;
* invariantes protegidas únicamente en aplicación cuando deberían estar protegidas también por DB.

No recomiendes constraints o mecanismos únicamente por "best practice". Debe existir una invariante o riesgo concreto que justifique la recomendación.

---

# 9. AUDITORÍA FUNCIONAL

Analiza los principales casos de uso reales.

Para cada flujo relevante reconstruye:

```text
Input
 ↓
Validation
 ↓
Authentication
 ↓
Authorization
 ↓
Business Logic
 ↓
Persistence
 ↓
External Calls
 ↓
Events / Jobs
 ↓
Response
```

Analiza también:

```text
Error
Rollback
Retry
Duplicate Request
Concurrent Request
Partial Failure
Timeout
Recovery
```

Busca:

* validaciones ausentes;
* validaciones incorrectas;
* errores silenciosos;
* excepciones mal propagadas;
* operaciones parciales;
* respuestas incorrectas;
* errores de negocio;
* duplicación;
* pérdida de datos;
* estados inconsistentes;
* transacciones incorrectas.

No analices únicamente happy paths.

---

# 10. AUTENTICACIÓN

Cuando exista autenticación, revisa:

* login;
* logout;
* sesiones;
* JWT;
* refresh tokens;
* expiración;
* revocación;
* cookies;
* password reset;
* cambio de password;
* MFA;
* bloqueo;
* enumeración;
* brute force;
* credential stuffing.

Comprueba:

* acceso sin autenticación;
* reutilización de sesiones invalidadas;
* tokens excesivamente longevos;
* almacenamiento inseguro;
* recuperación insegura de cuentas;
* enumeración;
* ausencia de controles contra abuso;
* sesiones concurrentes;
* invalidación incorrecta.

No afirmes que existe una vulnerabilidad si únicamente falta una comprobación que no puede demostrarse necesaria para el modelo de autenticación utilizado.

---

# 11. AUTORIZACIÓN — PRIORIDAD MÁXIMA

Audita específicamente:

* RBAC;
* roles;
* permisos;
* ownership;
* autorización por recurso;
* autorización por endpoint;
* autorización por operación;
* privilegios administrativos;
* multi-tenancy;
* aislamiento entre tenants.

Busca:

* IDOR;
* BOLA;
* privilege escalation;
* horizontal privilege escalation;
* vertical privilege escalation;
* cross-user access;
* cross-department access;
* cross-tenant access;
* endpoints sin autorización;
* operaciones administrativas incorrectamente protegidas.

Nunca consideres suficiente que el frontend oculte un botón.

Para cada operación sensible pregunta:

```text
¿Qué ocurre si cambio manualmente el ID?
¿Qué ocurre si llamo directamente a la API?
¿Qué ocurre si modifico un parámetro?
¿Qué ocurre si elimino un parámetro?
¿Qué ocurre si cambio el tenant?
¿Qué ocurre si utilizo el ID de otro usuario?
¿Qué ocurre si intento una operación administrativa?
```

No declares IDOR/BOLA simplemente porque exista un ID en una URL.

Debe existir evidencia de que falta una comprobación de ownership/autorización o, como mínimo, una inferencia técnica explícitamente etiquetada.

---

# 12. PRUEBAS DE NEGACIÓN

Cuando sea seguro hacerlo, intenta validar controles críticos mediante casos negativos.

Ejemplo:

```text
Control:
El usuario solo puede acceder a sus propios documentos.

Ruta:
GET /api/...

Condición:
Usuario autenticado con rol USER.

Prueba:
Intentar acceder al resourceId de otro usuario.

Resultado:
PASS / FAIL / NO VERIFICABLE

Evidencia:
...
```

Prioridad:

* autenticación;
* autorización;
* ownership;
* tenant isolation;
* permisos administrativos;
* datos sensibles;
* operaciones destructivas.

No realices pruebas destructivas ni ataques contra sistemas reales.

---

# 13. SEGURIDAD WEB

Cuando sea aplicable, busca:

* SQL Injection;
* NoSQL Injection;
* Command Injection;
* LDAP Injection;
* XPath Injection;
* Template Injection;
* XSS;
* SSRF;
* Path Traversal;
* unsafe deserialization;
* Expression Language Injection;
* CSRF;
* CORS;
* CSP;
* security headers;
* cookies;
* SameSite;
* Secure;
* HttpOnly;
* HTTPS;
* TLS;
* clickjacking;
* open redirects;
* MIME sniffing;
* cache headers.

Distingue siempre:

```text
VULNERABILIDAD CONFIRMADA
RIESGO POTENCIAL
NO VERIFICABLE
```

---

# 14. SECRETOS Y CREDENCIALES

Busca posibles secretos en:

* código;
* `.env`;
* configuración;
* Dockerfile;
* docker-compose;
* Kubernetes;
* manifests;
* scripts;
* CI/CD;
* logs;
* documentación;
* configuración de tests.

Busca:

* passwords;
* tokens;
* API keys;
* private keys;
* credentials;
* connection strings;
* cloud credentials;
* signing keys.

Nunca escribas secretos reales en el informe.

Si encuentras uno, registra:

```text
Ubicación
Tipo
Evidencia
Impacto
Estado
Acción recomendada
```

Si parece un secreto real, indícalo como potencialmente crítico.

NO:

* rotes secretos;
* invalides credenciales;
* modifiques sistemas.

---

# 15. DATOS SENSIBLES

Determina si aparecen innecesariamente en:

* respuestas API;
* logs;
* errores;
* tracing;
* métricas;
* cache;
* frontend;
* localStorage;
* sessionStorage;
* cookies;
* URLs;
* query parameters;
* exports;
* archivos temporales;
* backups.

Busca:

* excessive data exposure;
* PII en logs;
* secretos en errores;
* información de otros usuarios;
* exposición cross-user;
* cache cross-user;
* datos sensibles innecesarios en cliente.

---

# 16. DEPENDENCIAS Y SUPPLY CHAIN

Analiza cuando sea aplicable:

* dependencias directas;
* dependencias transitivas;
* lockfiles;
* versiones;
* CVEs;
* paquetes abandonados;
* paquetes sospechosos;
* scripts de instalación;
* fuentes Git;
* dependencias desde URLs;
* binarios descargados;
* Docker images;
* CI actions;
* plugins;
* runners;
* permisos CI.

Cuando sea posible, utiliza herramientas de auditoría en modo seguro/read-only.

No confundas:

```text
Dependencia antigua
```

con:

```text
Dependencia vulnerable
```

Un CVE solo debe considerarse hallazgo cuando se pueda establecer:

1. la dependencia existe;
2. la versión afectada está realmente presente;
3. el CVE corresponde al componente;
4. el impacto es aplicable al uso real cuando pueda determinarse.

No declares compromiso de supply chain sin evidencia.

---

# 17. BACKEND

Cuando exista, audita:

* controllers;
* routes;
* middleware;
* services;
* repositories;
* domain;
* DTOs;
* entities;
* ORM;
* validators;
* serializers;
* mappers;
* error handling;
* logging;
* caching;
* jobs;
* workers;
* queues;
* events.

Busca:

* validaciones ausentes;
* lógica inconsistente;
* errores tragados;
* excepciones mal propagadas;
* estados inválidos;
* transacciones incorrectas;
* lógica crítica incorrectamente ubicada;
* complejidad excesiva;
* God services.

Los problemas de diseño no son automáticamente vulnerabilidades ni P1.

Incluye también hallazgos de **deuda técnica** con severidad P4 cuando exista evidencia de:

* schemas o modelos duplicados sin mecanismo de sincronización;
* tipos no estrictos donde existen invariantes de negocio (strings en lugar de enums, Json sin forma documentada ni validada);
* patrones frágiles de manejo de errores (comparación de mensajes de texto en lugar de tipos de excepción);
* rutas de archivos relativas usadas como valores por defecto en código de producción;
* lógica de negocio crítica duplicada en varios servicios sin punto único de verdad.

No conviertas preferencias de estilo en deuda técnica. Debe existir un escenario concreto donde la deuda cause un bug, un error de mantenimiento o una inconsistencia de datos.

Incluye también hallazgos de **código legacy** con severidad P3 o P4 cuando exista evidencia de:

* código comentado o marcado `TODO` / `FIXME` / `HACK` en rutas de producción;
* controladores o servicios que acceden directamente al repositorio/ORM ignorando la capa de use-cases o servicios establecida en el resto del proyecto (patrón inconsistente que indica código añadido antes de que existiera la arquitectura);
* configuración o flags cuya única explicación es compatibilidad con un comportamiento anterior ya eliminado;
* endpoints o funciones sin uso observable desde rutas, tests ni otros módulos (código muerto);
* endpoints `demo*` o `test*` presentes en rutas de producción;
* datos o campos del modelo que ya no se usan en ningún use case ni controlador pero permanecen en el schema.

Distingue código legacy de código simplemente imperfecto: legacy implica que el patrón o la función contradice la dirección arquitectónica del resto del proyecto o que fue escrito para una versión anterior del sistema.

Incluye también hallazgos de **componentes reutilizables no extraídos** con severidad P4 cuando exista evidencia de:

* lógica de negocio idéntica o casi idéntica duplicada en dos o más servicios o archivos sin una abstracción compartida (p.ej. misma validación de permisos copiada, misma lógica de formateo, mismo helper de fechas);
* middleware, utilidades o guards implementados individualmente en cada servicio cuando podrían vivir en un paquete compartido (`packages/`, `libs/`, `shared/`) dado que el proyecto es un monorepo;
* constantes de dominio (códigos de estado, roles, límites) definidas en múltiples lugares con valores idénticos;
* patrones de mapeo o serialización (entity → DTO, Prisma row → domain entity) duplicados sin factoría común;
* componentes de UI en el frontend que aparecen duplicados en dos o más páginas o features sin haberse extraído a `components/shared/` o equivalente.

No reportes duplicación menor (2-3 líneas). Solo cuando la duplicación sea suficientemente grande o estratégica como para que su mantenimiento independiente genere riesgo real de divergencia.

---

# 18. BASE DE DATOS

Audita cuando exista:

* modelo;
* relaciones;
* constraints;
* foreign keys;
* unique constraints;
* nullability;
* índices;
* migraciones;
* queries;
* transacciones;
* locking;
* isolation;
* concurrencia;
* conexiones;
* pool.

Busca:

* N+1;
* queries sin índices;
* queries costosas;
* índices innecesarios;
* race conditions;
* lost updates;
* dirty writes;
* inconsistencias;
* ausencia de constraints críticas.

Distingue problemas demostrados de posibles problemas de rendimiento.

---

# 19. CONCURRENCIA — OBLIGATORIO

Para cada operación crítica pregunta:

> **¿Qué ocurre si dos o más usuarios ejecutan exactamente esta operación al mismo tiempo?**

Busca:

* race conditions;
* TOCTOU;
* double submit;
* double processing;
* locks incorrectos;
* deadlocks;
* carreras en cache;
* carreras en archivos;
* carreras en jobs;
* mensajes duplicados;
* eventos duplicados;
* retries no idempotentes;
* lost updates.

Presta especial atención a:

```text
READ
 ↓
CHECK
 ↓
WRITE
```

Pero no declares automáticamente una race condition por encontrar ese patrón.

Comprueba si existe realmente una ventana de carrera y si existe protección mediante:

* transaction;
* lock;
* unique constraint;
* atomic operation;
* optimistic locking;
* serialización;
* idempotency key;
* mecanismo equivalente.

Analiza especialmente:

* creación;
* actualización;
* eliminación;
* reservas;
* pagos;
* cambios de estado;
* asignaciones;
* contadores;
* stock;
* límites;
* permisos;
* generación de documentos;
* procesamiento de eventos.

---

# 20. IDEMPOTENCIA

Identifica operaciones susceptibles de repetición por:

* retries;
* timeouts;
* refresh;
* double click;
* jobs;
* mensajes duplicados;
* eventos duplicados;
* reconexiones;
* reintentos del cliente.

Para cada operación crítica:

```text
¿Es idempotente?
¿Qué ocurre si llega dos veces?
¿Qué ocurre si llega parcialmente?
¿Existe idempotency key?
¿Existe constraint contra duplicación?
¿Existe protección transaccional?
```

Especial atención a:

* operaciones financieras;
* creación de recursos;
* cambios de estado;
* emails;
* pagos;
* jobs.

---

# 21. MICROSERVICIOS

Solo si existen.

Analiza:

* boundaries;
* APIs;
* eventos;
* colas;
* contratos;
* versionado;
* bases de datos;
* dependencias;
* timeouts;
* retries;
* circuit breakers;
* idempotencia;
* resiliencia;
* observabilidad.

Busca:

* distributed monolith;
* coupling excesivo;
* shared database;
* shared domain logic;
* cascadas de fallos;
* comunicación excesiva;
* distributed transactions problemáticas.

No critiques la arquitectura por no seguir un patrón concreto.

---

# 22. APIs

Audita:

* autenticación;
* autorización;
* validación;
* rate limiting;
* pagination;
* filtering;
* sorting;
* payload limits;
* versionado;
* errores;
* status codes;
* contratos;
* backward compatibility.

Busca:

* endpoints olvidados;
* endpoints sin protección;
* endpoints excesivamente permisivos;
* excessive data exposure;
* endpoints administrativos expuestos;
* validaciones inconsistentes;
* límites inexistentes;
* respuestas con información sensible.

---

# 23. FRONTEND

Solo si existe.

Audita:

* autenticación;
* almacenamiento de tokens;
* gestión de sesión;
* autorización asumida únicamente en cliente;
* exposición de secretos;
* XSS;
* DOM XSS;
* CSP;
* dependencias;
* source maps;
* datos sensibles;
* localStorage;
* sessionStorage;
* cache;
* manejo de errores.

No consideres una protección frontend como sustituto de una protección backend.

---

# 24. ASINCRONÍA, JOBS, QUEUES Y EVENTOS

Solo si existen.

Analiza:

* duplicación;
* pérdida de mensajes;
* orden;
* retries;
* dead-letter queues;
* poison messages;
* idempotencia;
* timeouts;
* visibilidad;
* locks;
* concurrencia;
* procesamiento parcial;
* fallos del consumidor;
* fallos del productor.

Pregunta:

```text
¿Qué ocurre si el mensaje llega 2 veces?
¿Qué ocurre si llega tarde?
¿Qué ocurre si llega fuera de orden?
¿Qué ocurre si el consumidor muere a mitad del proceso?
¿Qué ocurre si el proveedor responde timeout pero procesó la operación?
```

---

# 25. DEPENDENCIAS EXTERNAS Y RESILIENCIA

Cuando existan servicios externos, analiza:

* timeouts;
* retries;
* backoff;
* límites;
* circuit breakers;
* fallos parciales;
* respuestas inválidas;
* indisponibilidad;
* rate limits;
* credenciales;
* idempotencia;
* degradación controlada.

No recomiendes retries o circuit breakers por defecto.

Debe existir un escenario de fallo que justifique la medida.

---

# 26. CACHE

Cuando exista cache, analiza:

* invalidación;
* TTL;
* consistencia;
* claves;
* aislamiento entre usuarios;
* aislamiento entre tenants;
* datos sensibles;
* stampede;
* stale data;
* concurrencia.

Especial atención a:

```text
Usuario A → cache
Usuario B → recibe datos de A
```

No declares cross-user leakage sin evidencia.

---

# 27. CONFIGURACIÓN Y ENTORNOS

Compara, cuando sea posible:

```text
development
test
staging
production
```

Busca:

* defaults inseguros;
* debug habilitado;
* logging excesivo;
* secretos hardcodeados;
* configuraciones incompatibles;
* diferencias críticas entre entornos;
* CORS permisivo;
* endpoints de debug;
* flags peligrosos;
* configuración que pueda causar pérdida de datos.

No asumas cómo está configurada producción si no existe evidencia.

---

# 28. CI/CD Y DEPLOYMENT

Cuando exista CI/CD, analiza:

* permisos;
* secretos;
* runners;
* workflows;
* dependencias;
* artefactos;
* imágenes;
* supply chain;
* separación de entornos;
* approvals;
* rollback;
* migraciones;
* reproducibilidad.

Pregunta:

```text
¿Puede un cambio no autorizado llegar a producción?
¿Puede un workflow acceder a secretos innecesarios?
¿Puede un tercero modificar el artefacto desplegado?
¿Existe posibilidad de deployment parcial?
¿Existe rollback razonable?
```

---

# 29. MIGRACIONES

Analiza cuando existan:

* compatibilidad hacia atrás;
* orden;
* atomicidad;
* locks;
* duración;
* cambios destructivos;
* pérdida de datos;
* despliegues rolling;
* compatibilidad entre versiones;
* rollback.

No ejecutes migraciones reales.

Una migración peligrosa debe estar sustentada por el SQL/código/configuración real.

---

# 30. BACKUPS Y RECUPERACIÓN

Determina, cuando pueda verificarse:

* existencia de backups;
* frecuencia;
* retención;
* cifrado;
* aislamiento;
* restauración;
* RPO;
* RTO;
* recuperación ante corrupción;
* recuperación ante borrado accidental.

Distingue:

```text
Backup configurado
```

de:

```text
Restore probado
```

La existencia de un mecanismo de backup no demuestra que la recuperación funcione.

---

# 31. OBSERVABILIDAD

Analiza:

* logs;
* métricas;
* tracing;
* health checks;
* alertas;
* errores;
* correlation IDs;
* información suficiente para investigar incidentes.

Pregunta:

```text
¿Podría un operador detectar el incidente?
¿Podría localizar el componente afectado?
¿Podría reconstruir qué ocurrió?
¿Podría distinguir fallo interno de dependencia externa?
```

No conviertas la ausencia de una herramienta concreta en vulnerabilidad.

---

# 32. RENDIMIENTO Y ESCALABILIDAD

Busca problemas con impacto demostrable o razonablemente inferible:

* N+1;
* queries costosas;
* llamadas secuenciales innecesarias;
* payloads excesivos;
* falta de límites;
* memory leaks evidentes;
* operaciones O(n) u O(n²) problemáticas;
* bloqueos;
* recursos no liberados;
* concurrencia;
* saturación de pools;
* dependencia única crítica.

No inventes cargas ni métricas.

Si no existen benchmarks:

```text
NO VERIFICABLE
```

o:

```text
INFERIDO
```

según la evidencia disponible.

---

# 33. MANEJO DE ERRORES

Busca:

* excepciones tragadas;
* errores silenciosos;
* respuestas inconsistentes;
* stack traces expuestos;
* información sensible;
* estados parcialmente persistidos;
* retries incorrectos;
* errores no observables.

Para cada operación crítica analiza:

```text
Success
Failure
Timeout
Partial Failure
Retry
Duplicate
Recovery
```

---

# 34. TESTS Y CALIDAD

Inspecciona:

* unit tests;
* integration tests;
* E2E;
* authorization tests;
* security tests;
* concurrency tests;
* regression tests;
* fixtures;
* mocks;
* cobertura cuando pueda medirse.

No confundas:

```text
hay tests
```

con:

```text
el comportamiento está correctamente probado
```

No afirmes que los tests pasan si no los has ejecutado.

No confundas cobertura alta con ausencia de vulnerabilidades.

---

# 35. ANÁLISIS DE REQUISITOS Y SUPUESTOS

No inventes requisitos empresariales.

Cuando una conclusión dependa de un requisito desconocido, indícalo.

Ejemplo:

```text
El impacto depende de si el recurso debe ser visible
entre usuarios del mismo departamento.

Estado: NO VERIFICABLE.
```

Distingue:

```text
Defecto técnico demostrado
Supuesto de negocio
Riesgo condicionado
```

---

# 36. REGLA CONTRA CARGO CULT

No conviertas una preferencia arquitectónica en vulnerabilidad.

No recomiendes una tecnología únicamente porque sea popular.

Ejemplos:

* Redis no es obligatorio porque "escala mejor";
* Kubernetes no es obligatorio;
* microservicios no son automáticamente mejores;
* event-driven no es automáticamente mejor;
* CQRS no es automáticamente mejor;
* circuit breakers no son automáticamente necesarios.

Toda recomendación debe responder a:

```text
¿Qué riesgo concreto mitiga?
¿Qué evidencia demuestra ese riesgo?
¿Por qué esta solución es adecuada?
```

---

# 37. CLASIFICACIÓN DE SEVERIDAD

Utiliza:

```text
P0 — CRÍTICO / BLOQUEANTE
P1 — ALTO
P2 — MEDIO
P3 — BAJO
P4 — MEJORA
```

## P0

Solo cuando exista evidencia suficiente de un impacto crítico, por ejemplo:

* compromiso crítico del sistema;
* acceso no autorizado masivo a datos sensibles;
* pérdida/corrupción crítica de datos;
* bypass crítico de autorización;
* imposibilidad demostrada de recuperación ante un escenario crítico;
* vulnerabilidad explotable con impacto catastrófico.

## P1

Riesgo alto y material que debe solucionarse antes de producción salvo mitigación explícita.

## P2

Riesgo relevante pero no necesariamente bloqueante.

## P3

Riesgo menor, deuda técnica con impacto limitado o mejora recomendable.

## P4

Mejora de calidad, mantenibilidad o arquitectura sin riesgo significativo de producción.

No asignes severidad únicamente por el número de líneas afectadas.

Prioriza considerando:

```text
Impacto
× Probabilidad
× Explotabilidad
× Alcance
× Sensibilidad de datos
× Detectabilidad
× Calidad de las mitigaciones existentes
```

Para P0/P1 debe existir evidencia concreta del impacto o un escenario técnico suficientemente demostrado.

---

# 38. FORMATO OBLIGATORIO DE CADA HALLAZGO

Cada hallazgo debe utilizar:

```markdown
### AUD-ID: AUD-XXX

**Título:** ...

**Severidad:** P0/P1/P2/P3/P4

**Estado de evidencia:** VERIFICADO / INFERIDO / NO VERIFICABLE

**Confianza:** ALTA / MEDIA / BAJA

**Área:** ...

**Componente:** ...

**Ubicación:** archivo:línea o referencia concreta

**Descripción:**
Qué ocurre.

**Evidencia:**
Qué demuestra la conclusión.

**Escenario de fallo/explotación:**
Cómo podría producirse.

**Impacto:**
Qué puede ocurrir realmente.

**Causa raíz:**
Por qué sucede.

**Mitigación actual:**
Qué protección existe, si existe.

**Corrección recomendada:**
Qué debería cambiar.

**Validación de la solución:**
Cómo demostrar que está solucionado.

**Complejidad:** XS / S / M / L / XL

**Dependencias:**
Otros AUD-ID relacionados.

**Orden recomendado:**
Cuándo solucionarlo y por qué.

**Limitaciones:**
Qué no pudo verificarse.

**Estado de corrección:** `⬜ Pendiente` / `🔄 En progreso` / `✅ Corregido`
```

No incluyas información inventada para completar campos.

---

# 39. REPRODUCIBILIDAD

Todo hallazgo `VERIFICADO` debe poder reproducirse por otro ingeniero siempre que sea técnicamente posible.

Incluye:

```text
Precondiciones
Entrada
Acción
Resultado observado
Resultado esperado
Evidencia
```

Cuando hayas ejecutado una prueba, documenta exactamente qué se ejecutó.

Cuando no sea posible reproducirla, explica por qué.

---

# 40. SEGUNDA PASADA ADVERSARIAL

Después de completar la auditoría principal, realiza una segunda revisión independiente.

No te preguntes:

> "¿Qué me falta escribir?"

Pregúntate:

> **"¿Qué fallo grave podría estar pasando por alto?"**

Revisa específicamente:

* autorización;
* ownership;
* cross-user;
* cross-tenant;
* concurrencia;
* idempotencia;
* integridad;
* errores parciales;
* retries;
* timeouts;
* migraciones;
* recuperación;
* secretos;
* exposición de datos;
* dependencias externas;
* deployment;
* observabilidad.

Si la segunda pasada no encuentra nada nuevo, no inventes hallazgos.

---

# 41. CRITERIO DE PARADA

No continúes buscando indefinidamente.

Considera una categoría suficientemente auditada cuando:

1. se hayan identificado sus componentes relevantes;
2. se hayan revisado sus principales puntos de entrada;
3. se hayan comprobado sus controles críticos;
4. las hipótesis relevantes estén clasificadas;
5. una segunda pasada no produzca nuevos hallazgos materiales.

La exhaustividad no significa repetir comprobaciones sin aportar evidencia nueva.

---

# 42. MATRIZ INTERNA DE CONTROLES

Antes de finalizar, construye internamente una matriz:

```text
Control
Evidencia
Estado
Confianza
Hallazgo relacionado
```

Como mínimo, cuando sean aplicables:

```text
Authentication
Authorization
Ownership
Tenant isolation
Input validation
Output encoding
Secrets
Session security
CSRF
CORS
Rate limiting
Database integrity
Transactions
Idempotency
Concurrency
External dependency failure
Timeouts
Retries
Backups
Restore
Rollback
Migrations
Logging
Monitoring
Alerting
CI/CD
Dependency security
Container security
```

No marques un control como correcto únicamente porque exista una implementación parcial.

---

# 43. FALSOS POSITIVOS

Nunca conviertas automáticamente:

```text
Preferencia arquitectónica → Vulnerabilidad

Deuda técnica → P1

Dependencia antigua → Vulnerabilidad

Código no encontrado → Código inexistente

No verificable → Seguro

Ausencia de evidencia → Evidencia de seguridad
```

La auditoría debe ser rigurosa, no alarmista.

Es preferible tener pocos hallazgos sólidos que muchos hallazgos especulativos.

---

# 44. ROADMAP FINAL

Al finalizar, crea o actualiza:

```text
auditoria/resultados/ROADMAP.md
```

Este será el único documento de resultados.

No crees:

```text
security.md
backend.md
frontend.md
architecture.md
database.md
performance.md
```

Todos los hallazgos y conclusiones deben estar en `ROADMAP.md`.

No modifiques otros archivos del proyecto.

---

# 45. ESTRUCTURA OBLIGATORIA DE ROADMAP.md

Debe comenzar exactamente con:

```markdown
# AUDITORÍA PREPRODUCCIÓN

## Resumen ejecutivo
```

Después utiliza:

```markdown
## Valoración de calidad

Escribe 3–5 frases sobre la calidad general del código y la arquitectura. Incluye aspectos positivos observados, el nivel de madurez técnico percibido y los patrones recurrentes de riesgo. No inventes capacidades ni omitas riesgos para mejorar la valoración. Debe poder leerse de forma independiente del resto del documento.

## Alcance

## Arquitectura detectada

## Activos críticos

## Datos sensibles identificados

## Superficie de ataque

## Áreas verificadas

## Áreas parcialmente verificadas

## Áreas no verificables

## Herramientas ejecutadas

## Limitaciones de la auditoría

## Resumen de riesgos

## Matriz de riesgo

## Hallazgos

## Roadmap de ejecución

## Dependencias entre problemas

## Checklist preproducción

# DECISIÓN PRELIMINAR DE PRODUCCIÓN
```

---

# 46. RESUMEN EJECUTIVO

Debe permitir entender rápidamente:

```text
Estado general
Número de P0
Número de P1
Número de P2
Número de P3
Número de P4
Principales riesgos
Áreas no verificables
Bloqueantes
Decisión preliminar
```

No ocultes riesgos importantes dentro del documento.

---

# 47. MATRIZ DE RIESGO

Incluye:

| AUD-ID  | Severidad | Área | Estado     | Confianza | Riesgo | Bloqueante |
| ------- | --------- | ---- | ---------- | --------- | ------ | ---------- |
| AUD-001 | P1        | ...  | VERIFICADO | ALTA      | ...    | SÍ         |
| AUD-002 | P2        | ...  | INFERIDO   | MEDIA     | ...    | NO         |

No incluyas hallazgos inexistentes.

---

# 48. ROADMAP DE EJECUCIÓN

Ordena las correcciones por dependencia y riesgo.

Ejemplo:

```text
FASE 0 — BLOQUEANTES
P0/P1

FASE 1 — INTEGRIDAD Y SEGURIDAD
P1/P2

FASE 2 — RESILIENCIA
P2

FASE 3 — CALIDAD Y OBSERVABILIDAD
P2/P3

FASE 4 — MEJORAS
P3/P4
```

Si una corrección depende de otra, indícalo.

No ordenes simplemente por número de hallazgo.

---

# 49. CHECKLIST PREPRODUCCIÓN

Incluye una checklist final:

```markdown
- [ ] P0 solucionados
- [ ] P1 solucionados o mitigados
- [ ] Autorización validada
- [ ] Ownership validado
- [ ] Cross-user validado
- [ ] Cross-tenant validado cuando aplique
- [ ] Operaciones críticas evaluadas frente a concurrencia
- [ ] Idempotencia validada
- [ ] Migraciones revisadas
- [ ] Rollback evaluado
- [ ] Backup evaluado
- [ ] Restore evaluado
- [ ] Secretos revisados
- [ ] Dependencias revisadas
- [ ] Errores revisados
- [ ] Observabilidad revisada
- [ ] Dependencias externas revisadas
- [ ] CI/CD revisado cuando aplique
- [ ] Limitaciones documentadas
```

Marca únicamente aquello que realmente haya sido verificado.

---

# 50. DECISIÓN DE PRODUCCIÓN

La decisión final debe ser una de:

```text
GO
GO CONDICIONADO
NO-GO
```

## GO

Solo si:

* no existen P0/P1 sin mitigar;
* los controles críticos han sido suficientemente verificados;
* las limitaciones restantes no impiden una decisión responsable;
* no existe evidencia de un riesgo crítico pendiente.

## GO CONDICIONADO

Cuando:

* no existen bloqueantes críticos;
* existen riesgos aceptables bajo condiciones explícitas;
* las condiciones quedan claramente documentadas.

## NO-GO

Cuando exista al menos una condición crítica pendiente, por ejemplo:

* P0 sin solucionar;
* P1 crítico sin mitigación suficiente;
* bypass grave de autorización;
* riesgo grave de pérdida/corrupción de datos;
* riesgo crítico de seguridad;
* migración con riesgo crítico no mitigado;
* recuperación crítica no demostrada cuando sea requisito necesario;
* evidencia insuficiente para evaluar un control crítico cuando dicha incertidumbre impida una decisión responsable.

Importante:

> **NO-GO por falta de evidencia no significa que la vulnerabilidad exista. Significa que no existe evidencia suficiente para afirmar responsablemente que el riesgo está controlado.**

---

# 51. DISTINCIÓN ENTRE RIESGO Y FALTA DE EVIDENCIA

Utiliza esta lógica:

```text
Vulnerabilidad demostrada
        ↓
Hallazgo

Riesgo técnicamente inferido
        ↓
Hallazgo INFERIDO

No se puede determinar
        ↓
NO VERIFICABLE

Se buscó y no apareció
        ↓
NO ENCONTRADO

No corresponde a la arquitectura
        ↓
NO APLICA
```

Nunca fuerces una conclusión para eliminar incertidumbre.

---

# 52. REGLA FINAL

Antes de terminar, responde internamente:

> **Con la evidencia disponible, ¿es técnicamente responsable poner esta aplicación en producción?**

La respuesta debe derivarse de:

* evidencia;
* arquitectura real;
* riesgos;
* controles;
* limitaciones;
* severidad;
* mitigaciones.

No de impresiones.

No de preferencias personales.

No de "best practices" genéricas.

No del número de hallazgos.

No de la cantidad de código revisado.

No inventes información para poder emitir un GO o un NO-GO.

Si algo no puede demostrarse, dilo.

Si algo parece correcto pero no puede verificarse, dilo.

Si encuentras un problema real, explica exactamente por qué.

Si no encuentras problemas en un área, indica qué has comprobado y qué evidencia lo sustenta.

La calidad de la auditoría se mide por la precisión de sus conclusiones, no por la cantidad de problemas encontrados.

---

# 53. EJECUCIÓN

Comienza ahora.

Orden obligatorio:

```text
1. Verifica el directorio de trabajo.
2. Inspecciona la estructura del repositorio.
3. Identifica arquitectura y stack.
4. Identifica activos y trust boundaries.
5. Identifica puntos de entrada.
6. Construye el threat model.
7. Audita controles críticos.
8. Audita flujos funcionales.
9. Audita seguridad.
10. Audita integridad y concurrencia.
11. Audita dependencias y supply chain.
12. Audita deployment y recuperación cuando aplique.
13. Ejecuta únicamente comprobaciones seguras.
14. Clasifica toda evidencia.
15. Realiza segunda pasada adversarial.
16. Construye matriz interna de controles.
17. Genera `auditoria/resultados/ROADMAP.md`.
18. Revisa el ROADMAP contra esta especificación.
19. Emite la decisión GO / GO CONDICIONADO / NO-GO.
```

No modifiques el proyecto fuera de `auditoria/`.

No inventes resultados.

No inventes vulnerabilidades.

No inventes pruebas.

No inventes capacidades.

**Empieza por descubrir la arquitectura real del proyecto antes de formular conclusiones.**
