/**
 * Client-side Permission Utilities
 * Provides permission checking and UI visibility helpers for role-based access control
 */

import { PERMISSIONS } from '@/lib/auth';

export interface UserSession {
  userId: string;
  username: string;
  name: string;
  role: string;
  shopId: string | null;
  shopName: string | null;
}

/**
 * Fetch current user session
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data?.user || data.user || null;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(session: UserSession | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!session) return false;
  return PERMISSIONS[permission].includes(session.role);
}

/**
 * Check if user can perform multiple permissions (OR logic)
 */
export function hasAnyPermission(
  session: UserSession | null,
  permissions: (keyof typeof PERMISSIONS)[]
): boolean {
  if (!session) return false;
  return permissions.some(permission => PERMISSIONS[permission].includes(session.role));
}

/**
 * Check if user has all permissions (AND logic)
 */
export function hasAllPermissions(
  session: UserSession | null,
  permissions: (keyof typeof PERMISSIONS)[]
): boolean {
  if (!session) return false;
  return permissions.every(permission => PERMISSIONS[permission].includes(session.role));
}

/**
 * Show permission denied toast notification
 */
export function showPermissionDeniedNotification(action: string = 'action') {
  // Dynamic import to avoid issues in server components
  if (typeof window !== 'undefined') {
    import('@/utils/toast').then(({ toast }) => {
      toast.error(`You don't have permission to ${action}`);
    });
  }
}

/**
 * Hook to fetch and validate permissions (for use in components)
 * Returns { session, hasPermission, loading, error }
 */
export function usePermissions(requiredPermissions?: (keyof typeof PERMISSIONS)[]) {
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentSession();
      setSession(userData);
      
      if (userData && requiredPermissions) {
        const hasPermission = requiredPermissions.some(p => 
          PERMISSIONS[p].includes(userData.role)
        );
        
        if (!hasPermission) {
          setError('Insufficient permissions');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    hasPermission: (permission: keyof typeof PERMISSIONS) => 
      session ? PERMISSIONS[permission].includes(session.role) : false,
    hasAnyPermission: (permissions: (keyof typeof PERMISSIONS)[]) =>
      session ? permissions.some(p => PERMISSIONS[p].includes(session.role)) : false,
    hasAllPermissions: (permissions: (keyof typeof PERMISSIONS)[]) =>
      session ? permissions.every(p => PERMISSIONS[p].includes(session.role)) : false,
  };
}

// Note: usePermissions requires React import - use as client component
import React from 'react';
