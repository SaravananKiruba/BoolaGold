import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Super Admin user...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create or update Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      password: hashedPassword,
      isActive: true,
      deletedAt: null,
    },
    create: {
      username: 'superadmin',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      email: 'admin@boolagold.com',
      phone: '9999999999',
      isActive: true,
      shopId: null, // Super Admin has no shop
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Username: superadmin');
  console.log('Password: admin123');
  console.log('Role:     SUPER_ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ You can now login and create shops!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
