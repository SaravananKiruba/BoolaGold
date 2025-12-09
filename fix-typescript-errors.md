# TypeScript Error Fix Guide

## Summary of Fixes Applied

### ✅ Completed
1. **Repository Exports**: Added default exports to all repository files
2. **Repository Create Methods**: Changed to use `UncheckedCreateInput` with `shopId`
3. **BaseRepository**: Added `verifyOwnership` method
4. **Auth Types**: Fixed JWT payload type compatibility
5. **API Protection**: Fixed return types
6. **Audit Utils**: Added `shopId` parameter to all audit functions
7. **Navigation.tsx**: Fixed item type annotation
8. **Deleted rbac-examples.ts**: Removed duplicate function declarations

### ⚠️ Remaining Fixes Needed

#### Pattern 1: Repository Variable Names
Many API routes create `const repository = new Repository({ session })` but then use lowercase names.

**Files affected:**
- `src/app/api/transactions/[id]/route.ts` - Uses `transactionRepository` instead of `repository`
- `src/app/api/purchase-orders/[id]/route.ts` - Uses `purchaseOrderRepository` instead of `repository`
- `src/app/api/sales-orders/[id]/route.ts` - Uses `salesOrderRepository` instead of `repository`

**Fix**: Search and replace within each file:
```typescript
// Replace:
await transactionRepository.
await purchaseOrderRepository.
await salesOrderRepository.

// With:
await repository.
```

#### Pattern 2: Missing shopId in Audit Logs
All audit log calls need `shopId: session!.shopId!`

**Search for:**
```typescript
await logAudit({
  action: AuditAction.
```

**Add:**
```typescript
shopId: session!.shopId!,
```

**Similarly for:**
- `await logCreate(...)`
- `await logUpdate(...)`
- `await logDelete(...)`
- `await logStatusChange(...)`

#### Pattern 3: Transaction Creates Missing shopId
Transaction prisma.transaction.create() calls need shopId.

**In files like:**
- `src/app/api/sales-orders/[id]/complete/route.ts`
- `src/app/api/sales-orders/[id]/payments/route.ts`
- `src/app/api/purchase-orders/[id]/payments/route.ts`

**Change:**
```typescript
await prisma.transaction.create({
  data: {
    transactionDate: new Date(),
    // ... other fields
  }
})
```

**To:**
```typescript
await prisma.transaction.create({
  data: {
    shopId: session!.shopId!,
    transactionDate: new Date(),
    // ... other fields
  }
})
```

#### Pattern 4: Nested Relations in Creates
For creates that use nested relations (customer, supplier, etc.), use customerId/supplierId instead.

**Example in `src/app/api/emi-payments/route.ts`:**
```typescript
// Change from:
customer: { connect: { id: customerId } }

// To:
customerId: customerId
```

**Example in `src/app/api/purchase-orders/route.ts`:**
```typescript
// Change from:
supplier: { connect: { id: supplierId } }

// To:
supplierId: supplierId
```

#### Pattern 5: BIS Compliance Creates
BIS compliance creates need shopId.

**In `src/app/api/bis-compliance/route.ts` and `bulk-import/route.ts`:**
```typescript
// Add shopId to create:
await prisma.bisCompliance.create({
  data: {
    shopId: session!.shopId!,
    // ... other fields
  }
})
```

#### Pattern 6: Customer Permission String
In `src/app/api/customers/[id]/route.ts` line 68:
```typescript
// Change:
hasPermission(session, 'CUSTOMER_UPDATE')

// To:
hasPermission(session, 'CUSTOMER_EDIT')
```

## Quick Fix Commands

### PowerShell Command to Find Remaining Issues
```powershell
# Find all audit log calls without shopId
Select-String -Path "src/**/*.ts" -Pattern "await logAudit\({" -Context 0,5 | 
  Where-Object { $_.Context.PostContext -notmatch "shopId" }

# Find repository lowercase usage
Select-String -Path "src/app/api/**/*.ts" -Pattern "(transaction|purchaseOrder|salesOrder)Repository\." 

# Find transaction creates without shopId  
Select-String -Path "src/app/api/**/*.ts" -Pattern "prisma\.transaction\.create" -Context 0,3
```

## Manual Fixes Required

Due to context-specific variations, these files need manual review:

1. **src/app/api/products/route.ts:134** - Fix supplierId filter type
2. **src/app/api/products/route.ts:190** - Fix session type for audit
3. **src/app/api/sales-orders/route.ts:227** - Add lines include to query
4. **src/app/api/bis-compliance/[id]/route.ts:82** - Use compound unique with shopId_huid
5. **src/app/api/bis-compliance/route.ts:132** - Use compound unique with shopId_huid

## Bulk Fix Script

Run this to fix most shopId issues in audit logs:
```powershell
$files = Get-ChildItem -Path "src/app/api" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Add shopId to logAudit calls (simple pattern)
    $content = $content -replace '(\s+await logAudit\(\{[^}]+)(}\);)', '$1  shopId: session!.shopId!,\n$2'
    
    # Save if changed
    if ($content -ne (Get-Content $file.FullName -Raw)) {
        Set-Content $file.FullName -Value $content
        Write-Host "Updated: $($file.FullName)"
    }
}
```

## Testing After Fixes

```powershell
npm run type-check
```

Expected result: Significant reduction in errors from 147 to < 50.
