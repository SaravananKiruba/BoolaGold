-- Migration: Add SUPER_ADMIN role and make shopId nullable for User
-- Run this BEFORE running `npx prisma migrate dev`

-- This script is for reference only - Prisma will handle the migration
-- But you may need to manually update existing data if needed

-- Step 1: The enum will be updated by Prisma migration
-- Step 2: The User.shopId column will be made nullable by Prisma migration

-- After migration, you can create a SUPER_ADMIN user like this:
-- (Run this in your database client or use a seed script)

/*
-- Create a SUPER_ADMIN user (example)
INSERT INTO users (id, username, password, name, role, shopId, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'superadmin',
  -- Password: 'admin123' (bcrypt hashed with cost 10)
  -- You should generate this using: bcrypt.hash('admin123', 10)
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Super Administrator',
  'SUPER_ADMIN',
  NULL,  -- SUPER_ADMIN has no shop
  1,
  NOW(),
  NOW()
);
*/

-- After migration, verify:
-- SELECT * FROM users WHERE role = 'SUPER_ADMIN';
