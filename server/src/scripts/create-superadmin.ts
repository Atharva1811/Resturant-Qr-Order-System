import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = (process.env.SUPERADMIN_EMAIL || args[0] || '').toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD || args[1] || '';
  const name = process.env.SUPERADMIN_NAME || args[2] || 'Platform Superadmin';

  if (!email || !email.includes('@')) {
    console.error('❌ Error: Valid SUPERADMIN_EMAIL or first CLI argument is required.');
    console.error('Usage: npm run create:superadmin <email> <password> [name]');
    console.error('   Or: SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npm run create:superadmin');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`🔐 Provisioning privileged SUPERADMIN account for: ${email}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const superadmin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: 'SUPERADMIN',
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      name,
      role: 'SUPERADMIN',
      isActive: true,
    },
  });

  console.log(`✅ SUPERADMIN account successfully provisioned: [${superadmin.id}] ${superadmin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Provisioning failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
