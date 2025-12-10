/**
 * Cleanup Script - Remove leftover repository imports
 */

const fs = require('fs');
const path = require('path');

let cleanedCount = 0;

// Old imports to remove
const importsToRemove = [
  `import { stockItemRepository } from '@/repositories/stockItemRepository';`,
  `import { customerRepository } from '@/repositories/customerRepository';`,
  `import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';`,
  `import { productRepository } from '@/repositories/productRepository';`,
  `import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`,
  `import { rateMasterRepository } from '@/repositories/rateMasterRepository';`,
  `import { salesOrderRepository } from '@/repositories/salesOrderRepository';`,
  `import { supplierRepository } from '@/repositories/supplierRepository';`,
  `import { transactionRepository } from '@/repositories/transactionRepository';`,
  `import { bisComplianceRepository } from '@/repositories/bisComplianceRepository';`,
  `import { StockItemRepository } from '@/repositories/stockItemRepository';`,
  `import { CustomerRepository } from '@/repositories/customerRepository';`,
  `import { EmiPaymentRepository } from '@/repositories/emiPaymentRepository';`,
  `import { ProductRepository } from '@/repositories/productRepository';`,
  `import { PurchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`,
  `import { RateMasterRepository } from '@/repositories/rateMasterRepository';`,
  `import { SalesOrderRepository } from '@/repositories/salesOrderRepository';`,
  `import { SupplierRepository } from '@/repositories/supplierRepository';`,
  `import { TransactionRepository } from '@/repositories/transactionRepository';`,
  `import { BisComplianceRepository } from '@/repositories/bisComplianceRepository';`,
];

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Skip if doesn't use repositories
  if (!content.includes('@/repositories/') && !content.includes('Repository')) {
    return false;
  }
  
  // Remove any leftover old imports
  importsToRemove.forEach(imp => {
    const count = (content.match(new RegExp(imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
      content = content.split(imp + '\n').join('');
      content = content.split(imp).join(''); // Also without newline
      modified = true;
      console.log(`   Removed ${count} occurrence(s) of: ${imp.split("'")[1]}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'route.ts') {
      const relativePath = path.relative(process.cwd(), filePath);
      const cleaned = cleanFile(filePath);
      if (cleaned) {
        cleanedCount++;
        console.log(`✓ Cleaned: ${relativePath}`);
      }
    }
  });
}

function main() {
  console.log('🧹 Starting cleanup of leftover repository imports...\n');
  
  const apiDir = path.join(__dirname, '../src/app/api');
  processDirectory(apiDir);
  
  console.log(`\n✨ Cleanup complete!`);
  console.log(`✅ Files cleaned: ${cleanedCount}`);
}

main();
