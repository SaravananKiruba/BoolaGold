-- ============================================
-- BoolaGold Database Clean Script
-- ============================================
-- This script deletes all data from all tables
-- in the correct order to respect foreign key constraints
-- Run this script for a fresh start
-- ============================================

-- Disable foreign key checks temporarily for faster execution
SET FOREIGN_KEY_CHECKS = 0;

-- Delete data from tables (child tables first, then parent tables)

-- Audit and logging tables
DELETE FROM `audit_logs`;

-- EMI related tables
DELETE FROM `emi_installments`;
DELETE FROM `emi_payments`;

-- Sales related tables
DELETE FROM `sales_payments`;
DELETE FROM `sales_order_lines`;
DELETE FROM `sales_orders`;

-- Purchase related tables
DELETE FROM `purchase_payments`;
DELETE FROM `purchase_order_items`;
DELETE FROM `purchase_orders`;

-- Stock and products
DELETE FROM `stock_items`;
DELETE FROM `products`;
DELETE FROM `rate_master`;

-- BIS compliance
DELETE FROM `bis_compliance`;

-- Transactions
DELETE FROM `transactions`;

-- Customer related tables
DELETE FROM `family_members`;
DELETE FROM `customers`;

-- Supplier tables
DELETE FROM `suppliers`;

-- User tables
DELETE FROM `users`;

-- Shop tables (main parent table)
DELETE FROM `shops`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optional: Reset auto-increment counters (if you have any)
-- This is not needed for UUID primary keys, but included for completeness

-- Display completion message
SELECT 'Database cleaned successfully! All data has been deleted.' AS Status;

-- Optional: Verify all tables are empty
SELECT 
    'audit_logs' AS TableName, COUNT(*) AS RowCount FROM `audit_logs`
UNION ALL
SELECT 'emi_installments', COUNT(*) FROM `emi_installments`
UNION ALL
SELECT 'emi_payments', COUNT(*) FROM `emi_payments`
UNION ALL
SELECT 'sales_payments', COUNT(*) FROM `sales_payments`
UNION ALL
SELECT 'sales_order_lines', COUNT(*) FROM `sales_order_lines`
UNION ALL
SELECT 'sales_orders', COUNT(*) FROM `sales_orders`
UNION ALL
SELECT 'purchase_payments', COUNT(*) FROM `purchase_payments`
UNION ALL
SELECT 'purchase_order_items', COUNT(*) FROM `purchase_order_items`
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM `purchase_orders`
UNION ALL
SELECT 'stock_items', COUNT(*) FROM `stock_items`
UNION ALL
SELECT 'products', COUNT(*) FROM `products`
UNION ALL
SELECT 'rate_master', COUNT(*) FROM `rate_master`
UNION ALL
SELECT 'bis_compliance', COUNT(*) FROM `bis_compliance`
UNION ALL
SELECT 'transactions', COUNT(*) FROM `transactions`
UNION ALL
SELECT 'family_members', COUNT(*) FROM `family_members`
UNION ALL
SELECT 'customers', COUNT(*) FROM `customers`
UNION ALL
SELECT 'suppliers', COUNT(*) FROM `suppliers`
UNION ALL
SELECT 'users', COUNT(*) FROM `users`
UNION ALL
SELECT 'shops', COUNT(*) FROM `shops`;
