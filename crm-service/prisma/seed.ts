import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Data pools ────────────────────────────────────────────────────────────────

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
const CITIES = [
  'Madrid','Barcelona','Valencia','Sevilla','Zaragoza','Málaga','Murcia',
  'Palma','Bilbao','Alicante','Córdoba','Granada','Vitoria','Gijón',
  'Oviedo','Santander','Salamanca','Logroño','Tarragona','Lleida',
];
const STREETS = [
  'Calle Mayor','Av. de la Paz','Calle del Sol','Paseo de las Flores',
  'Calle Real','Av. de España','Calle Nueva','Plaza Mayor','Calle del Mar',
  'Av. Central','C/ Libertad','Paseo del Prado','C/ del Pino','Av. del Norte',
  'Calle Colón','Ronda Sur','C/ Cervantes','Av. Constitución','C/ Lepanto',
];
const EMAIL_DOMAINS = ['gmail.com','hotmail.com','yahoo.es','outlook.com','icloud.com'];
const DNI_LETTERS   = 'TRWAGMYFPDXBNJZSQVHLCKE';

function dniLetter(n: number) { return DNI_LETTERS[n % 23]; }
function pad(n: number, len: number) { return String(n).padStart(len, '0'); }
function slug(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s']/g, '');
}

// ── Static data ───────────────────────────────────────────────────────────────

const STATUSES = [
  { name: 'Pendiente firma',       order: 1, color: '#f59e0b', isFinal: false, isCancelled: false, isSystem: true  },
  { name: 'Firmada',               order: 2, color: '#10b981', isFinal: true,  isCancelled: false, isSystem: true  },
  { name: 'Pendiente de contacto', order: 3, color: '#3b82f6', isFinal: false, isCancelled: false, isSystem: false },
  { name: 'Contactado',            order: 4, color: '#8b5cf6', isFinal: false, isCancelled: false, isSystem: false },
  { name: 'No interesado',         order: 5, color: '#ef4444', isFinal: true,  isCancelled: true,  isSystem: false },
  { name: 'Seguimiento',           order: 6, color: '#f97316', isFinal: false, isCancelled: false, isSystem: false },
  { name: 'En negociación',        order: 7, color: '#06b6d4', isFinal: false, isCancelled: false, isSystem: false },
];

const PRODUCTS = [
  { name: 'Luz Hogar Básico',   sku: 'LUZ-HOG-01', price: 89.99,  tipo: 'periodico', periodo: 'mensual' },
  { name: 'Luz Hogar Plus',     sku: 'LUZ-HOG-02', price: 129.99, tipo: 'periodico', periodo: 'mensual' },
  { name: 'Gas Natural Básico', sku: 'GAS-HOG-01', price: 74.50,  tipo: 'periodico', periodo: 'mensual' },
  { name: 'Gas Natural Plus',   sku: 'GAS-HOG-02', price: 109.00, tipo: 'periodico', periodo: 'mensual' },
  { name: 'Fibra 300 Mb',       sku: 'FIB-300',    price: 39.99,  tipo: 'periodico', periodo: 'mensual' },
  { name: 'Fibra 600 Mb',       sku: 'FIB-600',    price: 54.99,  tipo: 'periodico', periodo: 'mensual' },
  { name: 'Fibra 1 Gb',         sku: 'FIB-1G',     price: 69.99,  tipo: 'periodico', periodo: 'mensual' },
  { name: 'Pack Luz + Gas',     sku: 'PKG-LUZ-GAS',price: 179.99, tipo: 'periodico', periodo: 'mensual' },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {

  // ── Sale statuses ───────────────────────────────────────────────────────────
  const statusMap: Record<string, string> = {};
  for (const s of STATUSES) {
    const existing = await prisma.saleStatus.findFirst({ where: { name: s.name } });
    if (existing) {
      statusMap[s.name] = existing.id;
      // Keep isFinal / isSystem in sync
      if (existing.isFinal !== s.isFinal || existing.isSystem !== s.isSystem) {
        await prisma.saleStatus.update({
          where: { id: existing.id },
          data: { isFinal: s.isFinal, isSystem: s.isSystem, isCancelled: s.isCancelled },
        });
      }
    } else {
      const created = await prisma.saleStatus.create({ data: s });
      statusMap[s.name] = created.id;
      console.log(`[seed] Status: ${s.name}`);
    }
  }
  console.log('[seed] Sale statuses OK');

  // ── Products ────────────────────────────────────────────────────────────────
  const productMap: Record<string, string> = {};
  for (const p of PRODUCTS) {
    const ex = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (ex) {
      productMap[p.sku] = ex.id;
    } else {
      const cr = await prisma.product.create({ data: { ...p, price: p.price } });
      productMap[p.sku] = cr.id;
      console.log(`[seed] Product: ${p.name}`);
    }
  }
  console.log('[seed] Products OK');

  // ── Clients ─────────────────────────────────────────────────────────────────
  const clientCount = await prisma.client.count();
  if (clientCount >= 50) {
    console.log(`[seed] Clients already seeded (${clientCount}), skipping`);
  } else {
    type ClientData = {
      firstName: string; lastName: string; dni: string; email: string;
      birthday: string; phones: string[]; addresses: object[];
      bankAccounts: string[]; comments: string[];
      businessName: string | null; authorized: null;
    };
    const clients: ClientData[] = [];

    for (let i = 0; i < 130; i++) {
      const isMale    = i % 2 === 0;
      const firstName = isMale ? MALE[i % MALE.length] : FEMALE[i % FEMALE.length];
      const sn1       = SURNAMES[i % SURNAMES.length];
      const sn2       = SURNAMES[(i + 7) % SURNAMES.length];
      const lastName  = `${sn1} ${sn2}`;
      const dniNum    = (10000000 + i * 97) % 100000000;
      const dni       = `${pad(dniNum, 8)}${dniLetter(dniNum)}`;
      const email     = `${slug(firstName)}.${slug(sn1)}${i}@${EMAIL_DOMAINS[i % EMAIL_DOMAINS.length]}`;
      const byear     = 1950 + (i * 7 % 50);
      const bmon      = (i % 12) + 1;
      const bday      = (i % 28) + 1;
      const birthday  = `${pad(bday, 2)}/${pad(bmon, 2)}/${byear}`;
      const city      = CITIES[i % CITIES.length];
      const street    = STREETS[i % STREETS.length];
      const cp        = `${28000 + (i * 13 % 72000)}`.slice(0, 5);
      const phone1    = `6${pad((i * 131 + 10100000) % 100000000, 8)}`;
      const phone2    = i % 3 === 0 ? `9${pad((i * 173 + 20200000) % 100000000, 8)}` : null;
      const phones    = phone2 ? [phone1, phone2] : [phone1];
      const bankNum   = i % 2 === 0
        ? `ES${pad((i * 31 + 100000000000) % 10000000000000000, 22)}`
        : '';

      clients.push({
        firstName,
        lastName,
        dni,
        email,
        birthday,
        phones,
        addresses: [{ type: 'principal', street: `${street} ${(i % 99) + 1}`, city, cp, province: city }],
        bankAccounts: bankNum ? [bankNum] : [],
        comments: i % 5 === 0 ? ['Cliente potencial detectado por campaña'] : [],
        businessName: i % 10 === 0 ? `Empresa ${sn1} S.L.` : null,
        authorized: null,
      });
    }

    await prisma.client.createMany({ data: clients });
    console.log(`[seed] Created ${clients.length} clients`);
  }

  // ── Sales ────────────────────────────────────────────────────────────────────
  const saleCount = await prisma.sale.count();
  if (saleCount >= 20) {
    console.log(`[seed] Sales already seeded (${saleCount}), skipping`);
  } else {
    const allClients = await prisma.client.findMany({
      take: 100, select: { id: true }, orderBy: { createdAt: 'asc' },
    });
    const statusKeys = Object.keys(statusMap);
    const skuList    = Object.keys(productMap);
    const amounts    = [89.99, 129.99, 74.50, 109.00, 39.99, 54.99, 69.99, 179.99];

    type SaleData = {
      clientId: string; statusId: string;
      totalAmount: number; comercial: string;
    };
    const salesData: SaleData[] = allClients
      .map((c, i) => ({
        clientId:    c.id,
        statusId:    statusMap[statusKeys[i % statusKeys.length]],
        totalAmount: amounts[i % amounts.length],
        comercial:   `Agente ${(i % 5) + 1}`,
      }))
      .filter((s) => !!s.statusId);

    await prisma.sale.createMany({ data: salesData });
    console.log(`[seed] Created ${salesData.length} sales`);

    // Add items to first 50 sales so the product filter in campaigns works
    const createdSales = await prisma.sale.findMany({
      take: 50,
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    for (let i = 0; i < createdSales.length; i++) {
      const sku       = skuList[i % skuList.length];
      const productId = productMap[sku];
      const price     = amounts[i % amounts.length];
      await prisma.saleItem.create({
        data: {
          saleId:       createdSales[i].id,
          productId,
          nameSnapshot: sku,
          skuSnapshot:  sku,
          unitPrice:    price,
          quantity:     1,
          finalPrice:   price,
          tipoSnapshot: 'periodico',
          periodoSnapshot: 'mensual',
        },
      });
    }
    console.log('[seed] Created 50 sale items');
  }

  console.log('[seed] Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
