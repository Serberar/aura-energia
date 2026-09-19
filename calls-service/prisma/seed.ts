import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Seed IDs (deterministic, safe to re-run) ──────────────────────────────────

const DEMO_LIST_ID     = '00000000-0000-0000-0000-000000000001';
const LIST_ENERGIA_ID  = '00000000-0000-0000-0000-000000000002';
const LIST_FIBRA_ID    = '00000000-0000-0000-0000-000000000003';
const LIST_RECOVERY_ID = '00000000-0000-0000-0000-000000000004';
const CAMP_ENERGIA_ID  = '00000000-0000-0000-0000-000000000010';
const CAMP_FIBRA_ID    = '00000000-0000-0000-0000-000000000011';
const CAMP_RECOVERY_ID = '00000000-0000-0000-0000-000000000012';
const SCRIPT_ENERGIA   = '00000000-0000-0000-0000-000000000020';
const SCRIPT_FIBRA     = '00000000-0000-0000-0000-000000000021';
const SEED_AGENT_ID    = '00000000-0000-0000-0001-000000000001';

// ── Name generators ───────────────────────────────────────────────────────────

const MALE = [
  'Álvaro','Carlos','Daniel','Eduardo','Fernando','Gabriel','Héctor',
  'Ignacio','Javier','Luis','Manuel','Pablo','Rafael','Santiago','Tomás',
  'Antonio','Andrés','David','Emilio','Francisco','Hugo','Iván','Jorge',
  'Lorenzo','Miguel','Nicolás','Óscar','Pedro','Roberto','Sergio',
];
const FEMALE = [
  'Ana','Beatriz','Carmen','Diana','Elena','Fátima','Gloria','Helena',
  'Isabel','Julia','Laura','María','Nuria','Olga','Patricia','Raquel',
  'Sara','Teresa','Valentina','Verónica','Alicia','Adriana','Claudia',
  'Eva','Inés','Jimena','Lucía','Marta','Rosa','Silvia',
];
const SURNAMES = [
  'García','López','Martínez','Sánchez','Pérez','González','Rodríguez',
  'Fernández','Ramírez','Torres','Flores','Díaz','Moreno','Jiménez',
  'Herrera','Vargas','Castillo','Ramos','Cruz','Molina','Álvarez','Ruiz',
  'Navarro','Serrano','Moya','Ortega','Delgado','Castro','Ortiz','Rubio',
];
const NOTES_POOL = [
  'Cliente potencial — alta probabilidad de cierre',
  'Prefiere llamadas por la mañana',
  'Llamar después de las 17h',
  'Habló con agente anterior — interesado en tarifa gas',
  'Propietario — no inquilino',
  'Número facilitado por referido',
  'Llamada aplazada por vacaciones',
  'Revisión de oferta pendiente',
  null, null, null, null,
];

function makeName(i: number): string {
  const first = i % 2 === 0 ? MALE[i % MALE.length] : FEMALE[i % FEMALE.length];
  const sn1   = SURNAMES[i % SURNAMES.length];
  const sn2   = SURNAMES[(i + 9) % SURNAMES.length];
  return `${first} ${sn1} ${sn2}`;
}

function makePhone(i: number, prefix = '6'): string {
  const n = Math.abs(i * 131 + 10100000) % 100000000;
  return `${prefix}${String(n).padStart(8, '0')}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {

  // ── Disposition codes ───────────────────────────────────────────────────────
  const CODES = [
    { id: 'seed-0', label: 'Interesado',           color: '#22c55e', isDefault: false, order: 0 },
    { id: 'seed-1', label: 'Venta cerrada',         color: '#16a34a', isDefault: false, marksSaleClosed: true, order: 1 },
    { id: 'seed-2', label: 'No interesado',         color: '#ef4444', isDefault: false, order: 2 },
    { id: 'seed-3', label: 'Devolverá llamada',     color: '#3b82f6', isDefault: false, order: 3 },
    { id: 'seed-4', label: 'No disponible',         color: '#f59e0b', isDefault: false, order: 4 },
    { id: 'seed-5', label: 'Número incorrecto',     color: '#8b5cf6', isDefault: false, order: 5 },
    { id: 'seed-6', label: 'Buzón de voz',          color: '#6b7280', isDefault: true,  order: 6 },
    { id: 'seed-7', label: 'Fuera de cobertura',    color: '#d97706', isDefault: false, order: 7 },
    { id: 'seed-8', label: 'Cita concertada',       color: '#0ea5e9', isDefault: false, order: 8 },
    { id: 'seed-9', label: 'Número de empresa',     color: '#a855f7', isDefault: false, order: 9 },
  ];
  for (const c of CODES) {
    const { id, ...rest } = c;
    await prisma.dispositionCode.upsert({ where: { id }, update: rest, create: c });
  }
  console.log('[seed] Disposition codes OK');

  // ── Call scripts ────────────────────────────────────────────────────────────
  await prisma.callScript.upsert({
    where:  { id: SCRIPT_ENERGIA },
    update: {},
    create: {
      id:      SCRIPT_ENERGIA,
      name:    'Script Energía Renovable',
      order:   0,
      active:  true,
      content: `Buenos días/tardes, ¿hablo con [NOMBRE]?

Soy [AGENTE] de [EMPRESA]. Le contactamos porque puede beneficiarse de nuestras tarifas de energía 100% renovable con hasta un 30% de ahorro.

PRESENTACIÓN
• Tarifas fijas garantizadas 12 meses sin sorpresas
• Energía certificada 100% renovable
• Atención personalizada 24/7 — sin esperas
• Sin permanencia ni penalización por salida

GESTIÓN DE OBJECIONES
• "Ya tengo contrato" → Podemos esperar al vencimiento o gestionar el cambio sin coste.
• "No me interesa"   → ¿Es por el precio o tiene una oferta mejor que pueda mejorar?
• "Llame más tarde"  → ¿Cuándo es un buen momento? Le anoto la cita ahora mismo.

CIERRE
¿Le parece bien que le prepare un estudio de ahorro personalizado, sin compromiso?`,
    },
  });

  await prisma.callScript.upsert({
    where:  { id: SCRIPT_FIBRA },
    update: {},
    create: {
      id:      SCRIPT_FIBRA,
      name:    'Script Fibra Óptica 1 Gb',
      order:   1,
      active:  true,
      content: `Buenos días/tardes, ¿hablo con [NOMBRE]?

Soy [AGENTE] de [EMPRESA]. Le llamo porque en su zona acabamos de activar fibra óptica de 1 Gb simétrico.

PLANES DISPONIBLES
• Fibra 300 Mb →  39,99 €/mes
• Fibra 600 Mb →  54,99 €/mes
• Fibra 1 Gb   →  69,99 €/mes (más popular)
Router WiFi 6 incluido · Instalación en 48h sin coste · Sin límite de datos

GESTIÓN DE OBJECIONES
• "Ya tengo fibra"    → ¿Cuánto paga? Podemos mejorar su tarifa con mayor velocidad.
• "No lo necesito"    → ¿Cuántas personas usan internet en casa? Calculo la mejor opción.
• "Es caro"           → Desde 39,99/mes. ¿Cuál es su presupuesto aproximado?

CIERRE
¿Puedo anotar sus datos para que nuestro técnico le contacte y agende la instalación esta semana?`,
    },
  });
  console.log('[seed] Call scripts OK');

  // ── Dial lists + entries ────────────────────────────────────────────────────

  // Lista Demo (5 contactos — compatibilidad con seed original)
  await prisma.dialList.upsert({
    where:  { id: DEMO_LIST_ID },
    update: {},
    create: { id: DEMO_LIST_ID, name: 'Lista Demo', status: 'active' },
  });
  await prisma.dialListEntry.updateMany({
    where: { listId: DEMO_LIST_ID },
    data:  { status: 'pending', attempts: 0, lastCallId: null, lastAttemptAt: null },
  });
  const demoCount = await prisma.dialListEntry.count({ where: { listId: DEMO_LIST_ID } });
  if (demoCount === 0) {
    // Teléfonos idénticos a los primeros clientes reales sembrados en crm-service
    // (misma fórmula makePhone) para que la ficha de cliente aparezca en la llamada demo.
    await prisma.dialListEntry.createMany({
      data: [
        { listId: DEMO_LIST_ID, phone: '610100000', clientName: 'Álvaro García Fernández', notes: 'Interesado el mes pasado. Pedir referencia.' },
        { listId: DEMO_LIST_ID, phone: '610100131', clientName: 'Beatriz López Ramírez',   notes: 'Prefiere llamadas por la tarde.'             },
        { listId: DEMO_LIST_ID, phone: '610100262', clientName: 'Daniel Martínez Torres',  notes: null                                          },
        { listId: DEMO_LIST_ID, phone: '610100393', clientName: 'Diana Sánchez Flores',    notes: 'No disponible en intentos anteriores.'       },
        { listId: DEMO_LIST_ID, phone: '610100524', clientName: 'Fernando Pérez Díaz',     notes: 'Referido por García. Alta prioridad.'        },
      ],
    });
    console.log('[seed] Lista Demo: 5 entries');
  }

  // Lista Energía Renovable (90 entradas — mix de estados)
  await prisma.dialList.upsert({
    where:  { id: LIST_ENERGIA_ID },
    update: {},
    create: { id: LIST_ENERGIA_ID, name: 'Lista Energía Renovable Nov', status: 'active' },
  });
  const energiaCount = await prisma.dialListEntry.count({ where: { listId: LIST_ENERGIA_ID } });
  if (energiaCount === 0) {
    const STATUSES_E = ['pending','pending','pending','pending','pending','called','pending','called','dnc','pending'] as const;
    const now = new Date();
    await prisma.dialListEntry.createMany({
      data: Array.from({ length: 90 }, (_, i) => {
        const st = STATUSES_E[i % STATUSES_E.length];
        return {
          listId:       LIST_ENERGIA_ID,
          phone:        makePhone(i),
          clientName:   makeName(i),
          notes:        NOTES_POOL[i % NOTES_POOL.length],
          status:       st,
          attempts:     st === 'called' ? 1 : st === 'dnc' ? 1 : 0,
          lastAttemptAt: st === 'called' ? new Date(now.getTime() - i * 3_600_000) : null,
        };
      }),
    });
    console.log('[seed] Lista Energía: 90 entries');
  }

  // Lista Fibra Q4 (65 entradas — mayoría pendientes)
  await prisma.dialList.upsert({
    where:  { id: LIST_FIBRA_ID },
    update: {},
    create: { id: LIST_FIBRA_ID, name: 'Lista Fibra Q4 2024', status: 'active' },
  });
  const fibraCount = await prisma.dialListEntry.count({ where: { listId: LIST_FIBRA_ID } });
  if (fibraCount === 0) {
    await prisma.dialListEntry.createMany({
      data: Array.from({ length: 65 }, (_, i) => ({
        listId:     LIST_FIBRA_ID,
        phone:      makePhone(i + 200, '7'),
        clientName: makeName(i + 200),
        notes:      i % 5 === 0 ? 'Zona con cobertura recién ampliada' : null,
        status:     (i < 12 ? 'called' : 'pending') as 'called' | 'pending',
        attempts:   i < 12 ? 1 : 0,
      })),
    });
    console.log('[seed] Lista Fibra: 65 entries');
  }

  // Lista Recuperación (45 entradas — múltiples intentos)
  await prisma.dialList.upsert({
    where:  { id: LIST_RECOVERY_ID },
    update: {},
    create: { id: LIST_RECOVERY_ID, name: 'Lista Recuperación Clientes', status: 'paused' },
  });
  const recovCount = await prisma.dialListEntry.count({ where: { listId: LIST_RECOVERY_ID } });
  if (recovCount === 0) {
    const now = new Date();
    await prisma.dialListEntry.createMany({
      data: Array.from({ length: 45 }, (_, i) => {
        const attempts     = (i % 3) + 1;
        const isCalled     = i < 8;
        const hoursAgo     = (45 - i) * 6;
        const nextHours    = (i % 3 + 1) * 24;
        return {
          listId:       LIST_RECOVERY_ID,
          phone:        makePhone(i + 400, i % 2 === 0 ? '6' : '9'),
          clientName:   makeName(i + 400),
          notes:        `${attempts}/3 intentos — pendiente seguimiento`,
          status:       (isCalled ? 'called' : 'pending') as 'called' | 'pending',
          attempts,
          lastAttemptAt: new Date(now.getTime() - hoursAgo * 3_600_000),
          nextAttemptAt: isCalled ? null : new Date(now.getTime() + nextHours * 3_600_000),
        };
      }),
    });
    console.log('[seed] Lista Recuperación: 45 entries');
  }

  console.log('[seed] Dial lists OK');

  // ── Campaigns ───────────────────────────────────────────────────────────────
  await prisma.campaign.upsert({
    where:  { id: CAMP_ENERGIA_ID },
    update: {},
    create: {
      id:            CAMP_ENERGIA_ID,
      name:          'Campaña Energía Noviembre',
      description:   'Captación para productos de luz y gas con tarifas renovables certificadas.',
      status:        'active',
      scriptId:      SCRIPT_ENERGIA,
      dialListId:    LIST_ENERGIA_ID,
      maxAttempts:   3,
      totalImported: 90,
      createdBy:     SEED_AGENT_ID,
      crmFilter:     {},
    },
  });

  await prisma.campaign.upsert({
    where:  { id: CAMP_FIBRA_ID },
    update: {},
    create: {
      id:            CAMP_FIBRA_ID,
      name:          'Campaña Fibra Q4 2024',
      description:   'Venta de fibra óptica en zonas con cobertura recién activada.',
      status:        'paused',
      scriptId:      SCRIPT_FIBRA,
      dialListId:    LIST_FIBRA_ID,
      maxAttempts:   2,
      totalImported: 65,
      createdBy:     SEED_AGENT_ID,
      crmFilter:     {},
    },
  });

  await prisma.campaign.upsert({
    where:  { id: CAMP_RECOVERY_ID },
    update: {},
    create: {
      id:            CAMP_RECOVERY_ID,
      name:          'Recuperación de Clientes Perdidos',
      description:   'Re-contacto de leads que no cerraron en llamadas anteriores.',
      status:        'draft',
      dialListId:    LIST_RECOVERY_ID,
      maxAttempts:   3,
      totalImported: 45,
      createdBy:     SEED_AGENT_ID,
      crmFilter:     {},
    },
  });
  console.log('[seed] Campaigns OK');

  // ── DNC entries ─────────────────────────────────────────────────────────────
  const DNC_REASONS = [
    'Solicitó no ser contactado',
    'Lista Robinson',
    'Cliente bloqueado por reclamación',
    'Número de empresa — no contactar',
    'Baja voluntaria',
  ];
  const dncPhones = Array.from({ length: 15 }, (_, i) => makePhone(i + 600));
  for (let i = 0; i < dncPhones.length; i++) {
    await prisma.dncEntry.upsert({
      where:  { phone: dncPhones[i] },
      update: {},
      create: {
        phone:     dncPhones[i],
        addedById: SEED_AGENT_ID,
        reason:    DNC_REASONS[i % DNC_REASONS.length],
      },
    });
  }
  console.log('[seed] DNC entries OK (15)');

  // ── Historical calls ─────────────────────────────────────────────────────────
  const callCount = await prisma.call.count();
  if (callCount >= 10) {
    console.log(`[seed] Calls already seeded (${callCount}), skipping`);
  } else {
    type CallStatus = 'completed' | 'no_answer' | 'busy' | 'failed';
    const STATUS_SEQ: CallStatus[] = [
      'completed','no_answer','completed','busy','completed',
      'no_answer','failed','completed','no_answer','completed',
    ];
    const DISPOSITIONS = [
      'Interesado','Buzón de voz',null,'No disponible','Devolverá llamada',
      null,null,'Venta cerrada',null,'No interesado',
    ];
    const DURATIONS = [62, null, 245, null, 410, null, null, 183, null, 97];
    const now = new Date();

    const callsData = Array.from({ length: 40 }, (_, i) => {
      const status    = STATUS_SEQ[i % STATUS_SEQ.length];
      const dur       = DURATIONS[i % DURATIONS.length];
      const startMs   = now.getTime() - (40 - i) * 25 * 60_000;
      const answered  = status === 'completed' ? new Date(startMs + 8_000) : null;
      const ended     = status === 'completed' && dur
        ? new Date(startMs + 8_000 + dur * 1_000)
        : null;
      return {
        agentId:     SEED_AGENT_ID,
        clientPhone: makePhone(700 + i),
        status,
        direction:   'outbound' as const,
        duration:    status === 'completed' ? dur : null,
        disposition: DISPOSITIONS[i % DISPOSITIONS.length],
        startedAt:   new Date(startMs),
        answeredAt:  answered,
        endedAt:     ended,
        createdAt:   new Date(startMs),
      };
    });

    await prisma.call.createMany({ data: callsData });
    console.log('[seed] Historical calls OK (40)');
  }

  // ── Agent session (demo) ────────────────────────────────────────────────────
  await prisma.agentSession.upsert({
    where:  { agentId: SEED_AGENT_ID },
    update: {},
    create: { agentId: SEED_AGENT_ID, agentName: 'Agente Demo', status: 'offline' },
  });

  // ── Agenda entries (demo) ───────────────────────────────────────────────────
  const agendaCount = await prisma.agendaEntry.count();
  if (agendaCount === 0) {
    const now = new Date();
    await prisma.agendaEntry.createMany({
      data: [
        {
          agentId:     SEED_AGENT_ID,
          clientPhone: makePhone(800),
          clientName:  makeName(800),
          scheduledAt: new Date(now.getTime() + 2 * 3_600_000),
          reminderAt:  new Date(now.getTime() + 1 * 3_600_000),
          notes:       'Devolución de llamada acordada — interesado en tarifa gas',
          status:      'pending',
          priority:    'high',
        },
        {
          agentId:     SEED_AGENT_ID,
          clientPhone: makePhone(801),
          clientName:  makeName(801),
          scheduledAt: new Date(now.getTime() + 24 * 3_600_000),
          reminderAt:  new Date(now.getTime() + 23 * 3_600_000),
          notes:       'Enviar oferta por correo antes de llamar',
          status:      'pending',
          priority:    'normal',
        },
        {
          agentId:     SEED_AGENT_ID,
          clientPhone: makePhone(802),
          clientName:  makeName(802),
          scheduledAt: new Date(now.getTime() + 48 * 3_600_000),
          notes:       'Cliente en periodo de reflexión — fibra 1Gb',
          status:      'pending',
          priority:    'low',
        },
        {
          agentId:     SEED_AGENT_ID,
          clientPhone: makePhone(803),
          clientName:  makeName(803),
          scheduledAt: new Date(now.getTime() - 3 * 3_600_000),
          notes:       'Venta pendiente de firma digital',
          status:      'called',
          priority:    'high',
        },
      ],
    });
    console.log('[seed] Agenda entries OK (4)');
  }

  console.log('[seed] Seed completado. Resumen:');
  console.log('  • Disposition codes : 10');
  console.log('  • Call scripts      : 2');
  console.log('  • Dial lists        : 4  (Demo 5 · Energía 90 · Fibra 65 · Recuperación 45)');
  console.log('  • Campaigns         : 3  (active · paused · draft)');
  console.log('  • DNC entries       : 15');
  console.log('  • Historical calls  : 40');
  console.log('  • Agenda entries    : 4');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
