#!/usr/bin/env node
/**
 * Script to help identify which API routes and repositories need RBAC fixes
 * Run: node check-rbac-status.js
 */

const fs = require('fs');
const path = require('path');

const apiRoutesPath = './src/app/api';
const repositoriesPath = './src/repositories';

console.log('🔍 Checking RBAC Implementation Status\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check API Routes
console.log('📋 API ROUTES STATUS:\n');

const apiRoutes = [
  { path: 'customers/route.ts', name: 'Customers' },
  { path: 'products/route.ts', name: 'Products' },
  { path: 'sales-orders/route.ts', name: 'Sales Orders' },
  { path: 'purchase-orders/route.ts', name: 'Purchase Orders' },
  { path: 'transactions/route.ts', name: 'Transactions' },
  { path: 'emi-payments/route.ts', name: 'EMI Payments' },
  { path: 'suppliers/route.ts', name: 'Suppliers' },
  { path: 'stock/route.ts', name: 'Stock' },
  { path: 'rate-master/route.ts', name: 'Rate Master' },
  { path: 'bis-compliance/route.ts', name: 'BIS Compliance' },
  { path: 'reports/sales/route.ts', name: 'Sales Reports' },
  { path: 'reports/financial/route.ts', name: 'Financial Reports' },
  { path: 'audit-logs/route.ts', name: 'Audit Logs' },
];

apiRoutes.forEach(route => {
  const filePath = path.join(apiRoutesPath, route.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRBAC = content.includes('getSession') && content.includes('hasPermission');
    const status = hasRBAC ? '✅' : '❌';
    const notes = hasRBAC ? 'Fixed - has RBAC' : 'Needs RBAC';
    route.status = status;
    route.notes = notes;
  } else {
    route.status = '⚠️';
    route.notes = 'File not found';
  }
  console.log(`${route.status} ${route.name.padEnd(25)} - ${route.notes}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check Repositories
console.log('📦 REPOSITORIES STATUS:\n');

const repositories = [
  { file: 'customerRepository.ts', name: 'Customer' },
  { file: 'productRepository.ts', name: 'Product' },
  { file: 'salesOrderRepository.ts', name: 'Sales Order' },
  { file: 'purchaseOrderRepository.ts', name: 'Purchase Order' },
  { file: 'transactionRepository.ts', name: 'Transaction' },
  { file: 'emiPaymentRepository.ts', name: 'EMI Payment' },
  { file: 'supplierRepository.ts', name: 'Supplier' },
  { file: 'stockItemRepository.ts', name: 'Stock Item' },
  { file: 'rateMasterRepository.ts', name: 'Rate Master' },
  { file: 'bisComplianceRepository.ts', name: 'BIS Compliance' },
];

repositories.forEach(repo => {
  const filePath = path.join(repositoriesPath, repo.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const extendsBase = content.includes('extends BaseRepository');
    const status = extendsBase ? '✅' : '❌';
    const notes = extendsBase ? 'Fixed - extends BaseRepository' : 'Needs BaseRepository';
    repo.status = status;
    repo.notes = notes;
  } else {
    repo.status = '⚠️';
    repo.notes = 'File not found';
  }
  console.log(`${repo.status} ${repo.name.padEnd(25)} - ${repo.notes}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Summary
const apiFixed = apiRoutes.filter(r => r.status === '✅').length;
const apiTotal = apiRoutes.length;
const repoFixed = repositories.filter(r => r.status === '✅').length;
const repoTotal = repositories.length;

console.log('📊 SUMMARY:\n');
console.log(`API Routes:    ${apiFixed}/${apiTotal} fixed (${Math.round(apiFixed/apiTotal*100)}%)`);
console.log(`Repositories:  ${repoFixed}/${repoTotal} fixed (${Math.round(repoFixed/repoTotal*100)}%)`);
console.log('');

if (apiFixed < apiTotal || repoFixed < repoTotal) {
  console.log('⚠️  RBAC is NOT fully implemented!');
  console.log('');
  console.log('🔧 TO FIX:');
  console.log('1. Update API routes to add permission checks (see FIXES-APPLIED.md)');
  console.log('2. Update repositories to extend BaseRepository');
  console.log('3. Test with different user roles');
  console.log('');
  console.log('📖 See: RBAC-AND-MULTITENANT-GUIDE.md for patterns');
} else {
  console.log('✅ All modules have RBAC implemented!');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
