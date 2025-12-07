-- ============================================
-- TRUNCATE DATABASE SCRIPT
-- Jewelry Store Management System
-- ============================================
-- WARNING: This will delete ALL data from ALL tables
-- Use with caution - this action cannot be undone
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- Audit & Compliance
DELETE FROM `audit_logs`;
DELETE FROM `bis_compliance`;

-- EMI Management (child first)
DELETE FROM `emi_installments`;
DELETE FROM `emi_payments`;

-- Financial Transactions
DELETE FROM `transactions`;

-- Sales Management (child first)
DELETE FROM `sales_payments`;
DELETE FROM `sales_order_lines`;
DELETE FROM `sales_orders`;

-- Purchase Management (child first)
DELETE FROM `purchase_payments`;
DELETE FROM `purchase_order_items`;
DELETE FROM `stock_items`;
DELETE FROM `purchase_orders`;

-- Product Management
DELETE FROM `products`;

-- Rate Master
DELETE FROM `rate_master`;

-- Customer Management (child first)
DELETE FROM `family_members`;
DELETE FROM `customers`;

-- Supplier Management
DELETE FROM `suppliers`;

SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters (optional)
-- ALTER TABLE `audit_logs` AUTO_INCREMENT = 1;
-- ALTER TABLE `bis_compliance` AUTO_INCREMENT = 1;
-- ALTER TABLE `emi_installments` AUTO_INCREMENT = 1;
-- ALTER TABLE `emi_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `transactions` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_order_lines` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_orders` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_order_items` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_orders` AUTO_INCREMENT = 1;
-- ALTER TABLE `stock_items` AUTO_INCREMENT = 1;
-- ALTER TABLE `products` AUTO_INCREMENT = 1;
-- ALTER TABLE `rate_master` AUTO_INCREMENT = 1;
-- ALTER TABLE `family_members` AUTO_INCREMENT = 1;
-- ALTER TABLE `customers` AUTO_INCREMENT = 1;
-- ALTER TABLE `suppliers` AUTO_INCREMENT = 1;

-- ============================================
-- VERIFICATION QUERIES (Run these to confirm)
-- ============================================
-- SELECT 'audit_logs' AS table_name, COUNT(*) AS count FROM `audit_logs`
-- UNION ALL SELECT 'bis_compliance', COUNT(*) FROM `bis_compliance`
-- UNION ALL SELECT 'emi_installments', COUNT(*) FROM `emi_installments`
-- UNION ALL SELECT 'emi_payments', COUNT(*) FROM `emi_payments`
-- UNION ALL SELECT 'transactions', COUNT(*) FROM `transactions`
-- UNION ALL SELECT 'sales_payments', COUNT(*) FROM `sales_payments`
-- UNION ALL SELECT 'sales_order_lines', COUNT(*) FROM `sales_order_lines`
-- UNION ALL SELECT 'sales_orders', COUNT(*) FROM `sales_orders`
-- UNION ALL SELECT 'purchase_payments', COUNT(*) FROM `purchase_payments`
-- UNION ALL SELECT 'purchase_order_items', COUNT(*) FROM `purchase_order_items`
-- UNION ALL SELECT 'purchase_orders', COUNT(*) FROM `purchase_orders`
-- UNION ALL SELECT 'stock_items', COUNT(*) FROM `stock_items`
-- UNION ALL SELECT 'products', COUNT(*) FROM `products`
-- UNION ALL SELECT 'rate_master', COUNT(*) FROM `rate_master`
-- UNION ALL SELECT 'family_members', COUNT(*) FROM `family_members`
-- UNION ALL SELECT 'customers', COUNT(*) FROM `customers`
-- UNION ALL SELECT 'suppliers', COUNT(*) FROM `suppliers`;
