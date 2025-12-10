/**
 * Use Permissions Hook
 * Client-side permission checking for conditional UI rendering
 * 
 * Usage:
 * const { session, hasPermission } = usePermissions();
 * 
 * if (hasPermission('SALES_CREATE')) {
 *   // Show create button
 * }
 */

'use client';

import { useState, useEffect } from 'react';

interface UserSession {
  userId: string;
  username: string;
  name: string;
  role: string;
  shopId: string | null;
  shopName: string | null;
}

const PERMISSIONS: Record<string, string[]> = {
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

  // ⭐ SUPER ADMIN ONLY
  SUPER_ADMIN_SHOPS_MANAGE: ['SUPER_ADMIN'],
  SUPER_ADMIN_USERS_MANAGE: ['SUPER_ADMIN'],
  SUPER_ADMIN_SYSTEM_VIEW: ['SUPER_ADMIN'],
};

export function usePermissions() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        setSession(null);
        setError('Session expired');
        return;
      }

      const data = await response.json();
      const userData = data.data?.user || data.user;
      setSession(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!session || !PERMISSIONS[permission]) return false;
    return PERMISSIONS[permission].includes(session.role);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!session) return false;
    return permissions.some(p => PERMISSIONS[p]?.includes(session.role) || false);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!session) return false;
    return permissions.every(p => PERMISSIONS[p]?.includes(session.role) || false);
  };

  return {
    session,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * Guard Component for permission-based rendering
 * Only renders children if user has the required permission
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { session, loading } = usePermissions();

  if (loading) return null;

  if (!session || !PERMISSIONS[permission]?.includes(session.role)) {
    return fallback;
  }

  return children;
}

/**
 * Hook to show toast on unauthorized access
 */
export function usePermissionAlert() {
  return async (permission: string, action: string = 'action') => {
    // Dynamic import to avoid issues
    const { toast } = await import('@/utils/toast');
    toast.error(`You don't have permission to ${action}`);
  };
}
