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
  shopId: string;
  shopName: string;
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
 * Check if user has required role
 */
export function hasRole(session: SessionPayload | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

/**
 * Check if user is OWNER (has full access)
 */
export function isOwner(session: SessionPayload | null): boolean {
  return session?.role === 'OWNER';
}

/**
 * Check if user has sales access
 */
export function hasSalesAccess(session: SessionPayload | null): boolean {
  if (!session) return false;
  return ['OWNER', 'SALES'].includes(session.role);
}

/**
 * Check if user has accounts access
 */
export function hasAccountsAccess(session: SessionPayload | null): boolean {
  if (!session) return false;
  return ['OWNER', 'ACCOUNTS'].includes(session.role);
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

  // Shop Configuration (OWNER only)
  SHOP_CONFIG: ['OWNER'],
  USER_MANAGE: ['OWNER'],

  // Audit Logs (OWNER only)
  AUDIT_VIEW: ['OWNER'],
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
