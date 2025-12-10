# Repository Session Context Issue - Complete Analysis

## 🔴 ROOT CAUSE
All repository classes are exported as **singleton instances with `session: null`**, causing "Unauthorized: No shop context available" errors when repositories try to access `shopId`.

Example from all repository files:
```typescript
export const xxxRepository = new XxxRepository({ session: null });
```

## 📊 AFFECTED REPOSITORIES (10 Total)
1. ✅ **purchaseOrderRepository** - PARTIALLY FIXED (payments only)
2. ✅ **salesOrderRepository** - PARTIALLY FIXED (payments only)
3. ❌ **stockItemRepository** - BROKEN
4. ❌ **productRepository** - BROKEN
5. ❌ **customerRepository** - BROKEN
6. ❌ **supplierRepository** - BROKEN
7. ❌ **transactionRepository** - BROKEN
8. ❌ **rateMasterRepository** - BROKEN
9. ❌ **emiPaymentRepository** - BROKEN
10. ❌ **bisComplianceRepository** - BROKEN

## 🚨 CRITICAL BROKEN API ROUTES (Need Immediate Fix)

### **HIGH PRIORITY - User-Facing Features**

#### 1. **Receive Stock** (CRITICAL - Currently Failing)
- **File**: `src/app/api/purchase-orders/[id]/receive-stock/route.ts`
- **Uses**: `purchaseOrderRepository`, `stockItemRepository`, `productRepository`
- **Impact**: Cannot receive purchased items into stock

#### 2. **Stock Management** (9 routes)
- `src/app/api/stock/route.ts` - List/filter stock
- `src/app/api/stock/[id]/route.ts` - Get/update stock item
- `src/app/api/stock/[id]/recalculate-price/route.ts` - Price updates
- `src/app/api/stock/summary/route.ts` - Dashboard summary
- `src/app/api/stock/search/route.ts` - Stock search
- `src/app/api/stock/reserve/route.ts` - Reserve stock for sales
- `src/app/api/stock/fifo/route.ts` - FIFO calculation
- `src/app/api/stock/availability/route.ts` - Check availability

#### 3. **Product Management** (3 routes)
- `src/app/api/products/route.ts` - List/create products
- `src/app/api/products/[id]/route.ts` - Get/update/delete product
- `src/app/api/products/[id]/price-breakdown/route.ts` - Pricing

#### 4. **Customer Management** (2 routes)
- `src/app/api/customers/route.ts` - List/create customers
- `src/app/api/customers/[id]/route.ts` - Get/update/delete customer

#### 5. **Supplier Management** (4 routes)
- `src/app/api/suppliers/route.ts` - List/create suppliers
- `src/app/api/suppliers/[id]/route.ts` - Get/update/delete supplier
- `src/app/api/suppliers/[id]/products/route.ts` - Supplier products
- `src/app/api/suppliers/[id]/purchase-orders/route.ts` - Supplier POs

#### 6. **Sales Order Management** (3 routes)
- `src/app/api/sales-orders/route.ts` - Create sales orders
- `src/app/api/sales-orders/[id]/route.ts` - Get/update/delete
- `src/app/api/sales-orders/[id]/complete/route.ts` - Complete order
- `src/app/api/sales-orders/[id]/invoice/route.ts` - Generate invoice

#### 7. **Purchase Order Management** (2 routes)
- `src/app/api/purchase-orders/route.ts` - List/create POs
- `src/app/api/purchase-orders/[id]/route.ts` - Get/update/delete PO
- `src/app/api/purchase-orders/pending/route.ts` - Pending POs

#### 8. **Transaction Management** (3 routes)
- `src/app/api/transactions/route.ts` - List/create transactions
- `src/app/api/transactions/[id]/route.ts` - Get/update/delete
- `src/app/api/transactions/summary/route.ts` - Financial summary

#### 9. **Rate Master** (5 routes)
- `src/app/api/rate-master/route.ts` - List/create rates
- `src/app/api/rate-master/[id]/route.ts` - Get/update/delete rate
- `src/app/api/rate-master/current/route.ts` - Current rates
- `src/app/api/rate-master/history/[metalType]/[purity]/route.ts` - Rate history
- `src/app/api/rate-master/bulk-update-prices/route.ts` - Bulk updates

#### 10. **EMI Payments** (5 routes)
- `src/app/api/emi-payments/route.ts` - List/create EMI
- `src/app/api/emi-payments/[id]/route.ts` - Get/update/delete EMI
- `src/app/api/emi-payments/[id]/pay-installment/route.ts` - Pay installment
- `src/app/api/emi-payments/upcoming/route.ts` - Upcoming payments
- `src/app/api/emi-payments/overdue/route.ts` - Overdue payments

#### 11. **Reports** (1 route)
- `src/app/api/reports/financial/route.ts` - Financial reports

---

## 📝 TOTAL COUNT
- **Affected API Files**: ~45+ routes
- **Files Using Singleton (lowercase)**: ~30 files
- **Files Already Using Class (uppercase)**: ~15 files (but not instantiating with session)

---

## ✅ SOLUTION OPTIONS

### **Option 1: Fix Each Route Individually** (Current Approach)
**Pros**: 
- Surgical, precise fixes
- Can test incrementally

**Cons**: 
- Very time-consuming (~45 files to edit)
- Easy to miss files
- High chance of inconsistency

### **Option 2: Remove Singleton Exports** (RECOMMENDED)
**Pros**:
- Forces correct usage everywhere
- TypeScript will catch all errors
- Consistent pattern across codebase

**Cons**:
- Breaking change
- Need to update all imports at once

**Implementation**:
```typescript
// In each repository file, REMOVE this line:
// export const xxxRepository = new XxxRepository({ session: null });

// Keep only the class export:
export class XxxRepository extends BaseRepository { ... }
```

### **Option 3: Create Helper Function** (RECOMMENDED + Quick Fix)
Add to each repository file:
```typescript
// Helper function to create repository with session
export function createXxxRepository(session: SessionPayload | null) {
  return new XxxRepository({ session });
}

// Deprecated singleton (for backward compatibility during migration)
export const xxxRepository = new XxxRepository({ session: null });
```

Then in API routes:
```typescript
const session = await getSession();
const repo = createXxxRepository(session);
```

---

## 🎯 RECOMMENDED ACTION PLAN

### **Phase 1: Immediate Fix (Today)**
Fix the most critical user-facing routes that are currently blocking workflow:

1. ✅ **Payment Recording** - DONE
2. **Receive Stock** - Fix now (blocks purchase workflow)
3. **Create Sales Order** - Fix now (blocks sales workflow)
4. **Stock Reserve/FIFO** - Fix now (required for sales)

### **Phase 2: Core Operations (This Week)**
5. All Stock Management routes
6. Product Management routes
7. Customer & Supplier routes
8. Transaction routes

### **Phase 3: Secondary Features (Next Week)**
9. Rate Master routes
10. EMI Payment routes
11. Reports routes
12. BIS Compliance routes

### **Phase 4: Refactor (After Testing)**
- Remove all singleton exports
- Update all repository imports to use classes only
- Add TypeScript strict checks
- Document the pattern

---

## 🔧 IMMEDIATE NEXT STEP

**Fix the Receive Stock route NOW** - It's blocking your purchase order workflow.

Files to fix:
- `src/app/api/purchase-orders/[id]/receive-stock/route.ts`

Repositories needed:
- `PurchaseOrderRepository`
- `StockItemRepository`
- `ProductRepository`

Would you like me to fix the Receive Stock functionality immediately?
