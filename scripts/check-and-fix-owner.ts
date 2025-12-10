import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixOwner() {
  try {
    console.log('🔍 Checking OWNER user and shop configuration...\n');

    // Get all shops
    const shops = await prisma.shop.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${shops.length} active shop(s):`);
    shops.forEach(shop => {
      console.log(`   - ${shop.name} (ID: ${shop.id})`);
    });
    console.log();

    // Get all OWNER users
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER', deletedAt: null },
      include: { shop: true }
    });

    console.log(`👤 Found ${owners.length} OWNER user(s):`);
    owners.forEach(owner => {
      console.log(`   - ${owner.username} (${owner.name})`);
      console.log(`     Shop ID: ${owner.shopId || 'NOT SET ❌'}`);
      console.log(`     Shop Name: ${owner.shop?.name || 'N/A'}`);
      console.log(`     Active: ${owner.isActive ? '✅' : '❌'}`);
      console.log();
    });

    // Check if any OWNER doesn't have a shopId
    const ownersWithoutShop = owners.filter(o => !o.shopId);

    if (ownersWithoutShop.length > 0 && shops.length > 0) {
      console.log('⚠️  Found OWNER users without shopId. Fixing...\n');

      for (const owner of ownersWithoutShop) {
        // Assign to the first shop (or you can implement logic to choose)
        const shopToAssign = shops[0];
        
        console.log(`🔧 Assigning ${owner.username} to shop: ${shopToAssign.name}`);
        
        await prisma.user.update({
          where: { id: owner.id },
          data: { shopId: shopToAssign.id }
        });

        console.log(`✅ Successfully assigned shopId to ${owner.username}\n`);
      }
    } else if (ownersWithoutShop.length === 0) {
      console.log('✅ All OWNER users have shopId assigned correctly!\n');
    } else {
      console.log('⚠️  No active shops found. Please create a shop first.\n');
    }

    // Final verification
    console.log('📋 Final User-Shop Configuration:');
    const finalOwners = await prisma.user.findMany({
      where: { role: 'OWNER', deletedAt: null },
      include: { shop: true }
    });

    finalOwners.forEach(owner => {
      console.log(`   ${owner.username}: ${owner.shop?.name || 'No Shop'} ${owner.shopId ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixOwner();
