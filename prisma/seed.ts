// Prisma Seed Script - Populate database with sample data

import { PrismaClient } from '@prisma/client';
import { 
  CustomerType, 
  MetalType, 
  RateSource, 
  PaymentMethod, 
  OrderType,
  TransactionType,
  TransactionCategory
} from '../src/domain/entities/types';
import { generateBarcode, generateTagId, generateInvoiceNumber, generatePurchaseOrderNumber } from '../src/utils/barcode';
import { calculateSellingPrice } from '../src/utils/pricing';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep data)
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.salesPayment.deleteMany();
  await prisma.salesOrderLine.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.purchasePayment.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rateMaster.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.emiInstallment.deleteMany();
  await prisma.emiPayment.deleteMany();
  await prisma.bisCompliance.deleteMany();

  // 1. Create Rate Master
  console.log('Creating rate master entries...');
  const goldRate22k = await prisma.rateMaster.create({
    data: {
      metalType: MetalType.GOLD,
      purity: '22K',
      ratePerGram: 6500.00,
      effectiveDate: new Date(),
      rateSource: RateSource.MARKET,
      isActive: true,
      defaultMakingChargePercent: 12,
      createdBy: 'System',
    },
  });

  const goldRate18k = await prisma.rateMaster.create({
    data: {
      metalType: MetalType.GOLD,
      purity: '18K',
      ratePerGram: 5200.00,
      effectiveDate: new Date(),
      rateSource: RateSource.MARKET,
      isActive: true,
      defaultMakingChargePercent: 10,
      createdBy: 'System',
    },
  });

  const silverRate = await prisma.rateMaster.create({
    data: {
      metalType: MetalType.SILVER,
      purity: '925',
      ratePerGram: 85.00,
      effectiveDate: new Date(),
      rateSource: RateSource.MARKET,
      isActive: true,
      defaultMakingChargePercent: 15,
      createdBy: 'System',
    },
  });

  console.log(`✓ Created ${3} rate master entries\n`);

  // 2. Create Suppliers
  console.log('Creating suppliers...');
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Gold Craft Industries',
      contactPerson: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh@goldcraft.com',
      address: '123 Jewelry Market',
      city: 'Mumbai',
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Silver Artisans Ltd',
      contactPerson: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya@silverartisans.com',
      address: '456 Bullion Street',
      city: 'Jaipur',
      isActive: true,
    },
  });

  console.log(`✓ Created ${2} suppliers\n`);

  // 3. Create Customers
  console.log('Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Amit Patel',
      phone: '9123456780',
      email: 'amit.patel@example.com',
      whatsapp: '9123456780',
      address: '789 Main Road',
      city: 'Ahmedabad',
      dateOfBirth: new Date('1985-05-15'),
      anniversaryDate: new Date('2010-12-20'),
      customerType: CustomerType.RETAIL,
      isActive: true,
      familyMembers: {
        create: [
          {
            name: 'Neha Patel',
            relation: 'Spouse',
            dateOfBirth: new Date('1987-08-10'),
            anniversary: new Date('2010-12-20'),
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Sunita Reddy',
      phone: '9123456781',
      email: 'sunita.r@example.com',
      address: '321 Temple Street',
      city: 'Hyderabad',
      customerType: CustomerType.VIP,
      isActive: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Vikram Wholesale',
      phone: '9123456782',
      email: 'vikram@wholesale.com',
      customerType: CustomerType.WHOLESALE,
      isActive: true,
    },
  });

  console.log(`✓ Created ${3} customers\n`);

  // 4. Create Products
  console.log('Creating products...');
  const product1 = await prisma.product.create({
    data: {
      name: 'Gold Necklace - Traditional Design',
      metalType: MetalType.GOLD,
      purity: '22K',
      grossWeight: 25.500,
      netWeight: 24.000,
      barcode: generateBarcode('PRD', 'GOLD001'),
      huid: 'HUID22K001',
      tagNumber: 'TAG-001',
      description: 'Beautiful traditional gold necklace with intricate design',
      makingCharges: 8000.00,
      wastagePercent: 6.0,
      stoneWeight: 2.5,
      stoneValue: 5000.00,
      hallmarkNumber: 'BIS916-001',
      bisCompliant: true,
      collectionName: 'Wedding Collection',
      design: 'Temple Jewelry',
      reorderLevel: 2,
      isActive: true,
      calculatedPrice: calculateSellingPrice(24.000, 6.0, 6500.00, 8000.00, 5000.00),
      lastPriceUpdate: new Date(),
      rateUsedId: goldRate22k.id,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Gold Ring - Solitaire',
      metalType: MetalType.GOLD,
      purity: '18K',
      grossWeight: 5.200,
      netWeight: 4.800,
      barcode: generateBarcode('PRD', 'GOLD002'),
      huid: 'HUID18K002',
      tagNumber: 'TAG-002',
      description: 'Elegant gold ring with solitaire diamond',
      makingCharges: 3500.00,
      wastagePercent: 8.0,
      stoneWeight: 0.5,
      stoneValue: 15000.00,
      hallmarkNumber: 'BIS750-002',
      bisCompliant: true,
      collectionName: 'Engagement Collection',
      design: 'Classic Solitaire',
      size: '16',
      reorderLevel: 3,
      isActive: true,
      calculatedPrice: calculateSellingPrice(4.800, 8.0, 5200.00, 3500.00, 15000.00),
      lastPriceUpdate: new Date(),
      rateUsedId: goldRate18k.id,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Silver Anklet - Pair',
      metalType: MetalType.SILVER,
      purity: '925',
      grossWeight: 45.000,
      netWeight: 42.000,
      barcode: generateBarcode('PRD', 'SILV001'),
      tagNumber: 'TAG-003',
      description: 'Traditional silver anklet pair',
      makingCharges: 800.00,
      wastagePercent: 10.0,
      collectionName: 'Silver Collection',
      design: 'Traditional',
      reorderLevel: 5,
      isActive: true,
      calculatedPrice: calculateSellingPrice(42.000, 10.0, 85.00, 800.00, 0),
      lastPriceUpdate: new Date(),
      rateUsedId: silverRate.id,
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Gold Earrings - Drop Design',
      metalType: MetalType.GOLD,
      purity: '22K',
      grossWeight: 8.500,
      netWeight: 7.800,
      barcode: generateBarcode('PRD', 'GOLD003'),
      huid: 'HUID22K003',
      tagNumber: 'TAG-004',
      description: 'Elegant drop earrings in 22K gold',
      makingCharges: 2500.00,
      wastagePercent: 5.0,
      stoneWeight: 1.0,
      stoneValue: 3000.00,
      hallmarkNumber: 'BIS916-003',
      bisCompliant: true,
      collectionName: 'Daily Wear',
      design: 'Contemporary',
      reorderLevel: 4,
      isActive: true,
      calculatedPrice: calculateSellingPrice(7.800, 5.0, 6500.00, 2500.00, 3000.00),
      lastPriceUpdate: new Date(),
      rateUsedId: goldRate22k.id,
    },
  });

  console.log(`✓ Created ${4} products\n`);

  // 5. Create Stock Items
  console.log('Creating stock items...');
  const stockItems = [];

  // Product 1 - 3 stock items
  for (let i = 1; i <= 3; i++) {
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: product1.id,
        tagId: generateTagId(MetalType.GOLD, '22K'),
        barcode: generateBarcode('STK', product1.id, i),
        purchaseCost: 150000.00,
        sellingPrice: product1.calculatedPrice || 165000.00,
        status: 'AVAILABLE',
        purchaseDate: new Date(Date.now() - i * 86400000), // Different dates
      },
    });
    stockItems.push(stockItem);
  }

  // Product 2 - 5 stock items
  for (let i = 1; i <= 5; i++) {
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: product2.id,
        tagId: generateTagId(MetalType.GOLD, '18K'),
        barcode: generateBarcode('STK', product2.id, i),
        purchaseCost: 40000.00,
        sellingPrice: product2.calculatedPrice || 45000.00,
        status: 'AVAILABLE',
        purchaseDate: new Date(Date.now() - i * 86400000),
      },
    });
    stockItems.push(stockItem);
  }

  // Product 3 - 10 stock items
  for (let i = 1; i <= 10; i++) {
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: product3.id,
        tagId: generateTagId(MetalType.SILVER, '925'),
        barcode: generateBarcode('STK', product3.id, i),
        purchaseCost: 4000.00,
        sellingPrice: product3.calculatedPrice || 4700.00,
        status: i <= 8 ? 'AVAILABLE' : 'SOLD',
        purchaseDate: new Date(Date.now() - i * 86400000),
        ...(i > 8 && { saleDate: new Date() }),
      },
    });
    stockItems.push(stockItem);
  }

  // Product 4 - 6 stock items
  for (let i = 1; i <= 6; i++) {
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: product4.id,
        tagId: generateTagId(MetalType.GOLD, '22K'),
        barcode: generateBarcode('STK', product4.id, i),
        purchaseCost: 50000.00,
        sellingPrice: product4.calculatedPrice || 58000.00,
        status: 'AVAILABLE',
        purchaseDate: new Date(Date.now() - i * 86400000),
      },
    });
    stockItems.push(stockItem);
  }

  console.log(`✓ Created ${stockItems.length} stock items\n`);

  // 6. Create Sample Sales Order
  console.log('Creating sample sales order...');
  const invoiceNumber = generateInvoiceNumber();
  const selectedStock = stockItems[0]; // First available stock item

  const salesOrder = await prisma.salesOrder.create({
    data: {
      invoiceNumber,
      customerId: customer1.id,
      orderTotal: selectedStock.sellingPrice,
      discountAmount: 5000.00,
      finalAmount: selectedStock.sellingPrice - 5000.00,
      paidAmount: selectedStock.sellingPrice - 5000.00,
      paymentMethod: PaymentMethod.UPI,
      orderType: OrderType.RETAIL,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      notes: 'First purchase - loyalty discount applied',
      orderDate: new Date(),
      lines: {
        create: [
          {
            stockItemId: selectedStock.id,
            quantity: 1,
            unitPrice: selectedStock.sellingPrice,
            lineTotal: selectedStock.sellingPrice,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: selectedStock.sellingPrice - 5000.00,
            paymentDate: new Date(),
            paymentMethod: PaymentMethod.UPI,
            referenceNumber: 'UPI-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            notes: 'Full payment received',
          },
        ],
      },
      transactions: {
        create: [
          {
            transactionDate: new Date(),
            transactionType: TransactionType.INCOME,
            amount: selectedStock.sellingPrice - 5000.00,
            paymentMode: PaymentMethod.UPI,
            category: TransactionCategory.SALES,
            description: `Sales Order ${invoiceNumber}`,
            referenceNumber: invoiceNumber,
            customerId: customer1.id,
            status: 'COMPLETED',
            currency: 'INR',
          },
        ],
      },
    },
  });

  // Update stock item status
  await prisma.stockItem.update({
    where: { id: selectedStock.id },
    data: {
      status: 'SOLD',
      saleDate: new Date(),
    },
  });

  console.log(`✓ Created 1 sales order (${invoiceNumber})\n`);

  // 7. Create Sample Purchase Order
  console.log('Creating sample purchase order...');
  const poNumber = generatePurchaseOrderNumber();
  
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNumber: poNumber,
      supplierId: supplier1.id,
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000), // 7 days from now
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      discountAmount: 0,
      totalAmount: 500000.00,
      paidAmount: 250000.00,
      status: 'CONFIRMED',
      paymentStatus: 'PARTIAL',
      notes: 'Bulk order for wedding season',
      orderDate: new Date(),
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 5,
            unitPrice: 150000.00,
            expectedWeight: 25.0,
            receivedQuantity: 0,
          },
          {
            productId: product4.id,
            quantity: 10,
            unitPrice: 50000.00,
            expectedWeight: 8.5,
            receivedQuantity: 0,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 250000.00,
            paymentDate: new Date(),
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            referenceNumber: 'NEFT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            notes: 'Advance payment 50%',
          },
        ],
      },
    },
  });

  console.log(`✓ Created 1 purchase order (${poNumber})\n`);

  console.log('✅ Database seeding completed successfully!\n');
  console.log('Summary:');
  console.log(`- ${3} Rate Master entries`);
  console.log(`- ${2} Suppliers`);
  console.log(`- ${3} Customers`);
  console.log(`- ${4} Products`);
  console.log(`- ${stockItems.length} Stock Items`);
  console.log(`- ${1} Sales Order`);
  console.log(`- ${1} Purchase Order`);
  console.log('\nYou can now start the application and test the APIs!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
