/**
 * Create Super Admin User
 * Run this script after migrating the database schema
 * 
 * IMPORTANT: Run these commands FIRST:
 *   1. npx prisma migrate dev --name add_super_admin_role
 *   2. npx prisma generate
 *   3. npx ts-node scripts/create-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating Super Admin user...\n');

  // Check if super admin already exists
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' as any },
  });

  if (existing) {
    console.log('⚠️  Super Admin already exists:');
    console.log('   Username:', existing.username);
    console.log('   Name:', existing.name);
    console.log('\nIf you want to create a new one, delete the existing one first.\n');
    return;
  }

  // Hash password
  const password = 'admin123'; // Change this to a secure password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Super Admin (no shopId for SUPER_ADMIN)
  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      password: hashedPassword,
      name: 'Super Administrator',
      email: 'admin@boolagold.com',
      phone: '+91 9876543210',
      role: 'SUPER_ADMIN' as any,
      isActive: true,
    },
  });

  console.log('✅ Super Admin created successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('   URL: http://localhost:3000/login');
  console.log('   Username:', superAdmin.username);
  console.log('   Password:', password);
  console.log('   Role:', superAdmin.role);
  console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
  console.log('🎯 Access Super Admin Dashboard at: /super-admin\n');
}

main()
  .catch((error) => {
    console.error('❌ Error creating Super Admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
