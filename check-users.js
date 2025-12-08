const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        username: true,
        name: true,
        role: true,
        shopId: true,
        isActive: true,
      },
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    });

    console.log('\n=== EXISTING USERS ===\n');
    users.forEach((user) => {
      console.log(`Username: ${user.username}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Shop ID: ${user.shopId || 'NULL (Super Admin)'}`);
      console.log(`Active: ${user.isActive ? 'YES' : 'NO'}`);
      console.log('---');
    });

    console.log(`\nTotal users found: ${users.length}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
