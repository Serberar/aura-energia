import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { firstName: 'Admin', lastName: 'Sistema', username: 'admin', password: '1234', role: 'administrador' as const },
    { firstName: 'Comercial', lastName: 'Sistema', username: 'comercial', password: '1234', role: 'comercial' as const },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`User already exists: ${u.username}`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: {
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        password: hash,
        role: u.role,
        active: true,
      },
    });
    console.log(`Created user: ${u.username} (${u.role})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
