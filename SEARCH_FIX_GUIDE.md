# Product Search Issue - Diagnosis and Fix

## Issue Description
Product search is not working in the Sales Order creation form.

## Changes Made

### 1. Stock Search API (`src/app/api/stock/search/route.ts`)
- ✅ Improved MySQL query compatibility
- ✅ Added detailed console logging with `[Stock Search]` prefix
- ✅ Fixed WHERE clause structure for better MySQL performance
- ✅ Enhanced error handling

### 2. Sales Order Page (`src/app/sales-orders/page.tsx`)
- ✅ Added console logging to track search requests
- ✅ Enhanced error feedback in the UI
- ✅ Improved search result display

### 3. Test Endpoint (`src/app/api/stock/test/route.ts`)
- ✅ Created diagnostic endpoint to verify stock data exists
- Access at: `http://localhost:3001/api/stock/test`

## How to Test

### Step 1: Verify Stock Data Exists
Open your browser and navigate to:
```
http://localhost:3001/api/stock/test
```

This will show:
- Total stock items count
- Available stock items count
- Sample items from database
- Test search results

### Step 2: Test Search Functionality
1. Go to Sales Orders page: `http://localhost:3001/sales-orders`
2. Click "Create Order" button
3. Try searching for products in the search box
4. Check browser console (F12 → Console tab) for logs prefixed with `[Sales Order]`
5. Check terminal/server console for logs prefixed with `[Stock Search]`

### Step 3: Diagnose Issues

#### If test endpoint shows 0 stock items:
**Problem**: No stock data in database
**Solution**: Add stock items first via:
- Purchase Orders page
- Direct database insertion

#### If test endpoint shows items but search returns nothing:
**Problem**: Search query might not match data
**Solution**: 
- Check the sample items from test endpoint
- Try searching with exact product name, tagId, or barcode from sample
- Verify MySQL collation is case-insensitive (utf8mb4_general_ci)

#### If search returns "No items found":
**Problem**: Search term doesn't match any available stock
**Solutions**:
1. Verify items are marked as `AVAILABLE` status
2. Try partial search (e.g., "Ring" instead of "Gold Ring")
3. Check if items have `deletedAt = null`

#### If getting errors in console:
**Problem**: API or database connection issue
**Solution**: Check logs for:
- Database connection errors
- Prisma query errors
- Network errors (check if API is accessible)

## Common Search Patterns

The search supports:
- Product name: "Ring", "Necklace", "Bracelet"
- Tag ID: "G001", "S100"
- Barcode: Full or partial barcode
- Metal type: "GOLD", "SILVER", "PLATINUM"
- Purity: "22K", "18K", "24K"

## Database Query Details

### MySQL Collation
The search uses `contains` which relies on MySQL's default case-insensitive collation (`utf8mb4_general_ci`). This means:
- "gold" matches "GOLD", "Gold", "gold"
- "ring" matches "Ring", "RING", "ring"

### Search Fields
The query searches across:
1. `stock_items.tagId`
2. `stock_items.barcode`
3. `products.name`
4. `products.metalType`
5. `products.purity`

All with `LIKE '%search%'` pattern.

## Troubleshooting Checklist

- [ ] Server is running (check terminal output)
- [ ] Database is accessible (check `.env` file)
- [ ] Stock items exist in database (use test endpoint)
- [ ] Stock items have status = 'AVAILABLE'
- [ ] Stock items have deletedAt = null
- [ ] Product data is properly linked to stock items
- [ ] Browser console shows no errors
- [ ] Server console shows search is being triggered
- [ ] Search term matches data in database

## Quick Fix: Add Sample Data

If you need sample data for testing, run these SQL commands in your MySQL database:

```sql
-- Check existing stock
SELECT COUNT(*) as total_stock FROM stock_items WHERE deletedAt IS NULL;
SELECT COUNT(*) as available_stock FROM stock_items WHERE deletedAt IS NULL AND status = 'AVAILABLE';

-- View sample items
SELECT 
  si.tagId, 
  si.barcode, 
  si.status,
  p.name as product_name,
  p.metalType,
  p.purity
FROM stock_items si
JOIN products p ON si.productId = p.id
WHERE si.deletedAt IS NULL
LIMIT 10;
```

## Next Steps

1. Access test endpoint to verify data
2. Check console logs for detailed information
3. Try exact matches first (copy tagId from test endpoint)
4. Then try partial searches
5. If still not working, check database connection and query logs

## Support

If issue persists:
1. Share test endpoint output
2. Share browser console logs (with `[Sales Order]` prefix)
3. Share server console logs (with `[Stock Search]` prefix)
4. Provide sample search term you're using
