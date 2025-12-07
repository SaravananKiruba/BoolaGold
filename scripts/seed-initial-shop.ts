/**
 * Migration Script to Create Initial Shop and Owner User
 * Run this script after running `prisma db push` to set up the first shop and owner account
 * 
 * Usage:
 * npx tsx scripts/seed-initial-shop.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting initial shop and user setup...\n');

  // Create shop
  const shop = await prisma.shop.create({
    data: {
      name: 'BoolaGold Jewellers',
      tagline: 'Trust in Every Piece',
      address: '123, Jewelry Street, Gandhi Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600020',
      phone: '+91 98765 43210',
      email: 'info@boolagold.com',
      website: 'www.boolagold.com',
      gstNumber: '33AAAAA0000A1Z5',
      panNumber: 'AAAAA0000A',
      primaryColor: '#667eea',
      invoicePrefix: 'BG-',
      bankName: 'State Bank of India',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      bankBranch: 'T Nagar Branch',
      termsAndConditions: JSON.stringify([
        'All sales are subject to Chennai jurisdiction',
        'Goods once sold cannot be returned',
        'All gold items are BIS hallmarked',
        'Please verify weight and purity at the time of purchase',
      ]),
      isActive: true,
    },
  });

  console.log('✅ Shop created:', shop.name);
  console.log('   Shop ID:', shop.id);

  // Hash password for owner
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create owner user
  const owner = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Shop Owner',
      email: 'owner@boolagold.com',
      phone: '+91 98765 43210',
      role: 'OWNER',
      shopId: shop.id,
      isActive: true,
    },
  });

  console.log('\n✅ Owner user created:', owner.name);
  console.log('   Username:', owner.username);
  console.log('   Password: admin123 (Please change this after first login!)');
  console.log('   Role:', owner.role);

  // Create additional sample users
  const salesUser = await prisma.user.create({
    data: {
      username: 'sales1',
      password: await bcrypt.hash('sales123', 10),
      name: 'Sales Executive',
      email: 'sales@boolagold.com',
      phone: '+91 98765 43211',
      role: 'SALES',
      shopId: shop.id,
      isActive: true,
    },
  });

  console.log('\n✅ Sales user created:', salesUser.name);
  console.log('   Username:', salesUser.username);
  console.log('   Password: sales123');

  const accountsUser = await prisma.user.create({
    data: {
      username: 'accounts1',
      password: await bcrypt.hash('accounts123', 10),
      name: 'Accounts Manager',
      email: 'accounts@boolagold.com',
      phone: '+91 98765 43212',
      role: 'ACCOUNTS',
      shopId: shop.id,
      isActive: true,
    },
  });

  console.log('\n✅ Accounts user created:', accountsUser.name);
  console.log('   Username:', accountsUser.username);
  console.log('   Password: accounts123');

  console.log('\n🎉 Setup complete! You can now login with the following credentials:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 OWNER Account:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Access: Full system access');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 SALES Account:');
  console.log('   Username: sales1');
  console.log('   Password: sales123');
  console.log('   Access: Customer, Sales, Products, Stock');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 ACCOUNTS Account:');
  console.log('   Username: accounts1');
  console.log('   Password: accounts123');
  console.log('   Access: Financial, Purchases, EMI, Reports');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  IMPORTANT: Change all default passwords after first login!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error during setup:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
