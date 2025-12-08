-- ============================================
-- TRUNCATE ALL TABLES - FRESH START SCRIPT
-- ============================================
-- WARNING: This will DELETE ALL DATA from all tables!
-- Use this only when you want to start fresh with empty tables
-- ============================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data from tables (DELETE works better with foreign keys than TRUNCATE)
-- Order: Most dependent (child) tables first, then parent tables

-- Level 5: Deepest child tables
DELETE FROM `family_members`;
DELETE FROM `emi_installments`;
DELETE FROM `sales_payments`;
DELETE FROM `sales_order_lines`;
DELETE FROM `purchase_payments`;
DELETE FROM `purchase_order_items`;
DELETE FROM `audit_logs`;

-- Level 4: Child tables with foreign keys to Level 3
DELETE FROM `stock_items`;
DELETE FROM `transactions`;
DELETE FROM `emi_payments`;
DELETE FROM `sales_orders`;
DELETE FROM `purchase_orders`;
DELETE FROM `bis_compliance`;

-- Level 3: Tables referencing Level 2
DELETE FROM `products`;
DELETE FROM `customers`;

-- Level 2: Tables referencing Level 1
DELETE FROM `rate_master`;
DELETE FROM `suppliers`;
DELETE FROM `users`;

-- Level 1: Root table
DELETE FROM `shops`;

-- Reset auto-increment counters (optional - uncomment if needed)
-- ALTER TABLE `family_members` AUTO_INCREMENT = 1;
-- ALTER TABLE `emi_installments` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_order_lines` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_order_items` AUTO_INCREMENT = 1;
-- ALTER TABLE `audit_logs` AUTO_INCREMENT = 1;
-- ALTER TABLE `stock_items` AUTO_INCREMENT = 1;
-- ALTER TABLE `transactions` AUTO_INCREMENT = 1;
-- ALTER TABLE `emi_payments` AUTO_INCREMENT = 1;
-- ALTER TABLE `sales_orders` AUTO_INCREMENT = 1;
-- ALTER TABLE `purchase_orders` AUTO_INCREMENT = 1;
-- ALTER TABLE `bis_compliance` AUTO_INCREMENT = 1;
-- ALTER TABLE `products` AUTO_INCREMENT = 1;
-- ALTER TABLE `customers` AUTO_INCREMENT = 1;
-- ALTER TABLE `rate_master` AUTO_INCREMENT = 1;
-- ALTER TABLE `suppliers` AUTO_INCREMENT = 1;
-- ALTER TABLE `users` AUTO_INCREMENT = 1;
-- ALTER TABLE `shops` AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Display confirmation message
SELECT 'All tables have been cleared successfully! Database is now empty and ready for fresh start.' AS Status;
