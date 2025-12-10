/**
 * Automated Repository Migration Script
 * This script identifies all API routes that need updating and provides the changes needed
 */

const fs = require('fs');
const path = require('path');

// Repository imports to find and replace
const oldImports = {
  bisCompliance: `import { bisComplianceRepository } from '@/repositories/bisComplianceRepository';`,
  customer: `import { customerRepository } from '@/repositories/customerRepository';`,
  emiPayment: `import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';`,
  product: `import { productRepository } from '@/repositories/productRepository';`,
  purchaseOrder: `import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`,
  rateMaster: `import { rateMasterRepository } from '@/repositories/rateMasterRepository';`,
  salesOrder: `import { salesOrderRepository } from '@/repositories/salesOrderRepository';`,
  stockItem: `import { stockItemRepository } from '@/repositories/stockItemRepository';`,
  supplier: `import { supplierRepository } from '@/repositories/supplierRepository';`,
  transaction: `import { transactionRepository } from '@/repositories/transactionRepository';`,
};

const classImports = {
  BisCompliance: `import { BisComplianceRepository } from '@/repositories/bisComplianceRepository';`,
  Customer: `import { CustomerRepository } from '@/repositories/customerRepository';`,
  EmiPayment: `import { EmiPaymentRepository } from '@/repositories/emiPaymentRepository';`,
  Product: `import { ProductRepository } from '@/repositories/productRepository';`,
  PurchaseOrder: `import { PurchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`,
  RateMaster: `import { RateMasterRepository } from '@/repositories/rateMasterRepository';`,
  SalesOrder: `import { SalesOrderRepository } from '@/repositories/salesOrderRepository';`,
  StockItem: `import { StockItemRepository } from '@/repositories/stockItemRepository';`,
  Supplier: `import { SupplierRepository } from '@/repositories/supplierRepository';`,
  Transaction: `import { TransactionRepository } from '@/repositories/transactionRepository';`,
};

function findApiRoutes(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findApiRoutes(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const usesRepos = [];
  const usesClassRepos = [];
  
  // Check for singleton imports
  Object.entries(oldImports).forEach(([name, importStr]) => {
    if (content.includes(importStr)) {
      usesRepos.push(name);
    }
  });
  
  // Check for class imports
  Object.entries(classImports).forEach(([name, importStr]) => {
    if (content.includes(importStr)) {
      usesClassRepos.push(name);
    }
  });
  
  return {
    filePath,
    usesRepos,
    usesClassRepos,
    needsUpdate: usesRepos.length > 0 || usesClassRepos.length > 0,
    content
  };
}

function main() {
  const apiDir = path.join(__dirname, '../src/app/api');
  const routes = findApiRoutes(apiDir);
  
  console.log(`Found ${routes.length} API routes\n`);
  
  const routesToUpdate = routes
    .map(analyzeRoute)
    .filter(route => route.needsUpdate);
  
  console.log(`Routes needing update: ${routesToUpdate.length}\n`);
  
  routesToUpdate.forEach(route => {
    const relativePath = route.filePath.replace(__dirname, '').replace(/\\/g, '/');
    console.log(`\n📄 ${relativePath}`);
    
    if (route.usesRepos.length > 0) {
      console.log(`   Singleton repos used: ${route.usesRepos.join(', ')}`);
    }
    
    if (route.usesClassRepos.length > 0) {
      console.log(`   Class repos used: ${route.usesClassRepos.join(', ')}`);
    }
  });
  
  // Generate summary
  console.log(`\n\n📊 SUMMARY`);
  console.log(`========================================`);
  console.log(`Total routes: ${routes.length}`);
  console.log(`Routes needing update: ${routesToUpdate.length}`);
  console.log(`Routes already updated: ${routes.length - routesToUpdate.length}`);
  
  // Count by repository type
  const repoUsage = {};
  routesToUpdate.forEach(route => {
    route.usesRepos.forEach(repo => {
      repoUsage[repo] = (repoUsage[repo] || 0) + 1;
    });
  });
  
  console.log(`\n📈 Repository Usage:`);
  Object.entries(repoUsage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([repo, count]) => {
      console.log(`   ${repo}: ${count} routes`);
    });
}

main();
