/**
 * Batch Update All API Routes - Replace Repository Patterns
 * Run with: node scripts/batch-update-routes.js
 */

const fs = require('fs');
const path = require('path');

const UPDATED_COUNT = { value: 0 };
const FILES_PROCESSED = { value: 0 };

// Mapping of old singleton imports to remove
const singletonImports = [
  `import { bisComplianceRepository } from '@/repositories/bisComplianceRepository';`,
  `import { customerRepository } from '@/repositories/customerRepository';`,
  `import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';`,
  `import { productRepository } from '@/repositories/productRepository';`,
  `import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`,
  `import { rateMasterRepository } from '@/repositories/rateMasterRepository';`,
  `import { salesOrderRepository } from '@/repositories/salesOrderRepository';`,
  `import { stockItemRepository } from '@/repositories/stockItemRepository';`,
  `import { supplierRepository } from '@/repositories/supplierRepository';`,
  `import { transactionRepository } from '@/repositories/transactionRepository';`,
];

// Mapping of Class imports to  remove
const classImports = [
  { old: `import { BisComplianceRepository } from '@/repositories/bisComplianceRepository';`, name: 'BisCompliance' },
  { old: `import { CustomerRepository } from '@/repositories/customerRepository';`, name: 'Customer' },
  { old: `import { EmiPaymentRepository } from '@/repositories/emiPaymentRepository';`, name: 'EmiPayment' },
  { old: `import { ProductRepository } from '@/repositories/productRepository';`, name: 'Product' },
  { old: `import { PurchaseOrderRepository } from '@/repositories/purchaseOrderRepository';`, name: 'PurchaseOrder' },
  { old: `import { RateMasterRepository } from '@/repositories/rateMasterRepository';`, name: 'RateMaster' },
  { old: `import { SalesOrderRepository } from '@/repositories/salesOrderRepository';`, name: 'SalesOrder' },
  { old: `import { StockItemRepository } from '@/repositories/stockItemRepository';`, name: 'StockItem' },
  { old: `import { SupplierRepository } from '@/repositories/supplierRepository';`, name: 'Supplier' },
  { old: `import { TransactionRepository } from '@/repositories/transactionRepository';`, name: 'Transaction' },
];

// Map repository names to their key in getRepositories
const repoNameMap = {
  bisComplianceRepository: 'bisCompliance',
  customerRepository: 'customer',
  emiPaymentRepository: 'emiPayment',
  productRepository: 'product',
  purchaseOrderRepository: 'purchaseOrder',
  rateMasterRepository: 'rateMaster',
  salesOrderRepository: 'salesOrder',
  stockItemRepository: 'stockItem',
  supplierRepository: 'supplier',
  transactionRepository: 'transaction',
};

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if already uses getRepositories or getRepository
  if (content.includes('getRepositories') || content.includes('@/utils/apiRepository')) {
    console.log(`✓ Already updated: ${path.relative(process.cwd(), filePath)}`);
    return false;
  }
  
  // Check if file uses any repositories
  const usesRepos = singletonImports.some(imp => content.includes(imp)) ||
                    classImports.some(imp => content.includes(imp.old));
  
  if (!usesRepos) {
    return false;
  }
  
  console.log(`📝 Updating: ${path.relative(process.cwd(), filePath)}`);
  
  // Remove old imports
  singletonImports.forEach(imp => {
    if (content.includes(imp)) {
      content = content.replace(imp + '\n', '');
      modified = true;
    }
  });
  
  classImports.forEach(imp => {
    if (content.includes(imp.old)) {
      content = content.replace(imp.old + '\n', '');
      modified = true;
    }
  });
  
  // Add new import if needed
  if (modified && !content.includes('@/utils/apiRepository')) {
    // Find where to insert the import (after other imports)
    const importRegex = /^import .* from ['"]@\/.*['"];$/gm;
    const matches = [...content.matchAll(importRegex)];
    
    if (matches.length > 0) {
      const lastImport = matches[matches.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      content = content.slice(0, insertPos) + '\n' + `import { getRepositories } from '@/utils/apiRepository';` + content.slice(insertPos);
    }
  }
  
  // Replace new Repository({ session }) patterns
  classImports.forEach(({ name }) => {
    const className = name + 'Repository';
    const repoKey = name.charAt(0).toLowerCase() + name.slice(1);
    
    // Pattern: const repo = new ClassRepository({ session });
    const pattern1 = new RegExp(`const\\s+(\\w+)\\s*=\\s*new\\s+${className}\\s*\\(\\s*\\{\\s*session\\s*\\}\\s*\\);?`, 'g');
    content = content.replace(pattern1, (match, varName) => {
      modified = true;
      return `const repos = await getRepositories(request);\n    const ${varName} = repos.${repoKey};`;
    });
  });
  
  // Replace singleton repository usage patterns
  // Pattern: await repositoryName.method()
  Object.entries(repoNameMap).forEach(([oldName, newKey]) => {
    const regex = new RegExp(`\\b${oldName}\\.(\\w+)`, 'g');
    if (content.match(regex)) {
      // Check if getRepositories is already called
      if (!content.includes('const repos = await getRepositories(request)')) {
        // Find the first async function and add repos initialization
        const functionMatch = content.match(/(export async function \w+\([^)]*\)\s*\{)/);
        if (functionMatch) {
          const insertAfter = functionMatch.index + functionMatch[0].length;
          content = content.slice(0, insertAfter) + 
                   '\n    const repos = await getRepositories(request);' + 
                   content.slice(insertAfter);
          modified = true;
        }
      }
      
      // Replace repository calls
      content = content.replace(regex, `repos.${newKey}.$1`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    UPDATED_COUNT.value++;
    console.log(`   ✓ Updated successfully`);
    return true;
  }
  
  return false;
}

function findAndUpdateRoutes(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAndUpdateRoutes(filePath);
    } else if (file === 'route.ts') {
      FILES_PROCESSED.value++;
      updateFile(filePath);
    }
  });
}

function main() {
  console.log('🚀 Starting batch update of API routes...\n');
  
  const apiDir = path.join(__dirname, '../src/app/api');
  
  if (!fs.existsSync(apiDir)) {
    console.error(`Error: API directory not found at ${apiDir}`);
    process.exit(1);
  }
  
  findAndUpdateRoutes(apiDir);
  
  console.log(`\n✨ Update complete!`);
  console.log(`📊 Files processed: ${FILES_PROCESSED.value}`);
  console.log(`✅ Files updated: ${UPDATED_COUNT.value}`);
  console.log(`⏭️  Files skipped: ${FILES_PROCESSED.value - UPDATED_COUNT.value}`);
}

main();
