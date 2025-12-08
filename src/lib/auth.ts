/**
 * Authentication Utilities
 * Handles password hashing, JWT token generation, and user session management
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const JWT_EXPIRES_IN = '24h';

// Session cookie name
export const SESSION_COOKIE_NAME = 'auth_session';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Session payload interface
 */
export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
  shopId: string | null;  // NULL for SUPER_ADMIN
  shopName: string | null;  // NULL for SUPER_ADMIN
}

/**
 * Generate JWT token for user session
 */
export async function generateToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Validate if shop is active
 * Returns true if user is SUPER_ADMIN (no shop) or if their shop is active
 * Returns false if shop exists but is deactivated
 */
export async function isShopActive(session: SessionPayload | null): Promise<boolean> {
  if (!session) return false;
  
  // SUPER_ADMIN has no shop, always allow
  if (session.role === 'SUPER_ADMIN') return true;
  
  // If user has a shop, check if it's active
  if (session.shopId) {
    const prisma = (await import('@/lib/prisma')).default;
    const shop = await prisma.shop.findUnique({
      where: { id: session.shopId },
      select: { isActive: true, deletedAt: true },
    });
    
    // Shop must exist, be active, and not deleted
    return shop ? shop.isActive && !shop.deletedAt : false;
  }
  
  return false;
}

/**
 * Validate session and shop status
 * Use this in API routes to ensure shop users can only access if their shop is active
 */
export async function validateSession(): Promise<{ 
  session: SessionPayload | null; 
  isValid: boolean; 
  message?: string 
}> {
  const session = await getSession();
  
  if (!session) {
    return { session: null, isValid: false, message: 'Unauthorized: No session found' };
  }
  
  const shopActive = await isShopActive(session);
  
  if (!shopActive) {
    return { 
      session, 
      isValid: false, 
      message: 'Shop is deactivated. Please contact support.' 
    };
  }
  
  return { session, isValid: true };
}

/**
 * Check if user has required role
 */
export function hasRole(session: SessionPayload | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

/**
 * Check if user is SUPER_ADMIN (SaaS Provider)
 */
export function isSuperAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'SUPER_ADMIN';
}

/**
 * Check if user is OWNER (Shop Owner - full access within their shop)
 */
export function isOwner(session: SessionPayload | null): boolean {
  return session?.role === 'OWNER';
}

/**
 * Check if user has sales access
 */
export function hasSalesAccess(session: SessionPayload | null): boolean {
  if (!session) return false;
  return ['SUPER_ADMIN', 'OWNER', 'SALES'].includes(session.role);
}

/**
 * Check if user has accounts access
 */
export function hasAccountsAccess(session: SessionPayload | null): boolean {
  if (!session) return false;
  return ['SUPER_ADMIN', 'OWNER', 'ACCOUNTS'].includes(session.role);
}

/**
 * Role-based access control permissions
 */
export const PERMISSIONS = {
  // Customer Management
  CUSTOMER_CREATE: ['OWNER', 'SALES'],
  CUSTOMER_EDIT: ['OWNER', 'SALES'],
  CUSTOMER_DELETE: ['OWNER'],
  CUSTOMER_VIEW: ['OWNER', 'SALES', 'ACCOUNTS'],

  // Product & Stock Management
  PRODUCT_CREATE: ['OWNER', 'SALES'],
  PRODUCT_EDIT: ['OWNER', 'SALES'],
  PRODUCT_DELETE: ['OWNER'],
  PRODUCT_VIEW: ['OWNER', 'SALES', 'ACCOUNTS'],
  STOCK_MANAGE: ['OWNER', 'SALES'],

  // Sales Orders
  SALES_CREATE: ['OWNER', 'SALES'],
  SALES_EDIT: ['OWNER', 'SALES'],
  SALES_DELETE: ['OWNER'],
  SALES_VIEW: ['OWNER', 'SALES', 'ACCOUNTS'],

  // Purchase Orders
  PURCHASE_CREATE: ['OWNER', 'ACCOUNTS'],
  PURCHASE_EDIT: ['OWNER', 'ACCOUNTS'],
  PURCHASE_DELETE: ['OWNER'],
  PURCHASE_VIEW: ['OWNER', 'ACCOUNTS'],

  // Suppliers
  SUPPLIER_CREATE: ['OWNER', 'ACCOUNTS'],
  SUPPLIER_EDIT: ['OWNER', 'ACCOUNTS'],
  SUPPLIER_DELETE: ['OWNER'],
  SUPPLIER_VIEW: ['OWNER', 'ACCOUNTS', 'SALES'],

  // BIS Compliance
  BIS_COMPLIANCE_CREATE: ['OWNER', 'SALES'],
  BIS_COMPLIANCE_EDIT: ['OWNER', 'SALES'],
  BIS_COMPLIANCE_DELETE: ['OWNER'],
  BIS_COMPLIANCE_VIEW: ['OWNER', 'SALES', 'ACCOUNTS'],

  // Financial Management
  TRANSACTION_CREATE: ['OWNER', 'ACCOUNTS'],
  TRANSACTION_EDIT: ['OWNER', 'ACCOUNTS'],
  TRANSACTION_DELETE: ['OWNER'],
  TRANSACTION_VIEW: ['OWNER', 'ACCOUNTS'],
  EMI_MANAGE: ['OWNER', 'ACCOUNTS'],

  // Reports
  REPORTS_FINANCIAL: ['OWNER', 'ACCOUNTS'],
  REPORTS_INVENTORY: ['OWNER', 'SALES', 'ACCOUNTS'],
  REPORTS_SALES: ['OWNER', 'SALES', 'ACCOUNTS'],

  // Rate Master
  RATE_MASTER_EDIT: ['OWNER', 'ACCOUNTS'],
  RATE_MASTER_VIEW: ['OWNER', 'SALES', 'ACCOUNTS'],

  // Shop Configuration (Shop Owner only)
  SHOP_CONFIG: ['OWNER'],
  USER_MANAGE: ['OWNER'],

  // Audit Logs (Shop Owner only)
  AUDIT_VIEW: ['OWNER'],

  // ⭐ SUPER ADMIN ONLY - Multi-shop Management (SaaS Provider)
  SUPER_ADMIN_SHOPS_MANAGE: ['SUPER_ADMIN'],  // Create, view, edit all shops
  SUPER_ADMIN_USERS_MANAGE: ['SUPER_ADMIN'],  // Create users for any shop
  SUPER_ADMIN_SYSTEM_VIEW: ['SUPER_ADMIN'],   // View all system data
};

/**
 * Check if user has specific permission
 */
export function hasPermission(
  session: SessionPayload | null,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!session) return false;
  return PERMISSIONS[permission].includes(session.role);
}
