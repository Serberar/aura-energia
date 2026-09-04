# Roadmap — Módulo de Llamadas (Ventas Outbound)

> Última actualización: 2026-08-14  
> Contexto: equipo de ventas outbound. Fases ordenadas por impacto operacional.

---

## Fase 1 — Operacional inmediato

| # | Funcionalidad | Estado | Notas |
|---|---|---|---|
| 1.1 | Vista de detalle por agente (coordinador) | ✅ Hecho | Drawer lateral en SupervisorPage con llamadas, disposición, notas, tiempo codificación |
| 1.2 | Click-to-call desde ficha del cliente | ✅ Hecho | Botón 📞 junto a cada teléfono en EditClientsPage |
| 1.3 | Tiempo de codificación visible (wrap-up) | ✅ Hecho | Columna en historial del agente y en el drawer del coordinador |
| 1.4 | UI de gestión de campañas | ⬜ Pendiente | Crear/listar campañas, subir contactos, start/stop dialer predictivo |
| 1.5 | Lógica de reintentos configurable | ⬜ Pendiente | Max intentos, espera entre reintentos, comportamiento por disposición |
| 1.6 | Transferencia de llamada | ⬜ Pendiente | Blind transfer + warm transfer (consulta antes de pasar) |

---

## Fase 2 — Eficiencia comercial

| # | Funcionalidad | Estado | Notas |
|---|---|---|---|
| 2.1 | Voicemail drop | ⬜ Pendiente | Mensaje grabado automático en no-respuesta, 1 clic |
| 2.2 | Screen pop automático | ⬜ Pendiente | Abrir ficha del cliente al iniciar/recibir llamada |
| 2.3 | Power dialer | ⬜ Pendiente | Modo 1:1, espera respuesta antes de marcar el siguiente |
| 2.4 | Límites de pausa + alertas supervisor | ⬜ Pendiente | Tiempo máximo por razón, aviso cuando se supera |
| 2.5 | Alertas en tiempo real | ⬜ Pendiente | Drop rate, agente sin actividad, tasa respuesta baja |
| 2.6 | Cumplimiento horario / zona horaria | ⬜ Pendiente | Bloquear marcado fuera del horario legal del contacto |

---

## Fase 3 — Calidad y control

| # | Funcionalidad | Estado | Notas |
|---|---|---|---|
| 3.1 | Barge-in del supervisor | ⬜ Pendiente | Unirse como participante real a la llamada (3-way) |
| 3.2 | Formulario de QA / scoring | ⬜ Pendiente | Scorecard configurable por llamada para el supervisor |
| 3.3 | Informes programados | ⬜ Pendiente | Resumen diario/semanal por email automático |
| 3.4 | Proveedor real (Fase 7) | ⬜ Pendiente | Conectar Twilio o Vicidial en calls-connector |

---

## Fase 4 — Expansión

| # | Funcionalidad | Estado | Notas |
|---|---|---|---|
| 4.1 | SMS de seguimiento post-llamada | ⬜ Pendiente | Desde ficha del cliente, canal de apoyo al cierre |
| 4.2 | Transcripción automática (IA) | ⬜ Pendiente | Whisper/Deepgram, extrae notas automáticamente |
| 4.3 | Lead scoring predictivo | ⬜ Pendiente | Priorizar contactos por propensión a comprar |
| 4.4 | WhatsApp Business | ⬜ Pendiente | Canal de mensajería integrado en la misma plataforma |

---

## Funcionalidades ya completadas (referencia)

| Funcionalidad | Fase histórica |
|---|---|
| Marcación manual saliente | Fase 1 |
| Llamadas entrantes + toast | Fase 2 |
| Hold / Mute / DTMF | Fase 2 |
| Grabación de llamadas + player | Fase 3 |
| Dialer predictivo con AMD | Fase 4 |
| Lista DNC | Fase 4 |
| Guiones de venta | Fase 4 |
| Agenda / recordatorios | Fase 4 |
| Wrap-up panel (120s countdown) | Fase 5 |
| Disposiciones configurables | Fase 5 |
| WebSocket tiempo real | Fase 5 |
| Panel supervisor: live + histórico | Fase 6 |
| Monitor WebRTC (escucha + susurro) | Fase 6 |
| Historial con gráficas + exportación CSV | Fase 6 |
