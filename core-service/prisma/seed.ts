import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureSetting(key: string, value: string) {
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (!existing) {
    await prisma.systemSetting.create({ data: { key, value } });
    console.log(`Created setting: ${key}=${value}`);
  } else {
    console.log(`Setting already exists: ${key}`);
  }
}

async function main() {
  console.log('Seeding system settings...');

  // Module toggles
  await ensureSetting('calls_module_enabled',      'true');
  await ensureSetting('crm_module_enabled',        'true');
  await ensureSetting('firma_module_enabled',      'false');
  await ensureSetting('crm_online_search_enabled', 'false');

  // IP filter (disabled by default)
  await ensureSetting('ip_filter_enabled', 'false');

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
