/**
 * Page Guard Hook
 * Client-side protection for pages based on user permissions
 * Redirects unauthorized users attempting direct URL access
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      name: string;
      role: string;
      shopId: string | null;
      shopName: string | null;
    };
  };
}

export function usePageGuard(requiredRoles: string[]) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      console.log('🔍 usePageGuard - Response status:', response.status);
      
      if (!response.ok) {
        console.log('🚫 No session - redirecting to login');
        router.replace('/login');
        return;
      }

      const responseData = await response.json();
      console.log('🔍 usePageGuard - Full response:', JSON.stringify(responseData, null, 2));
      
      // Handle both response formats: direct data or wrapped in data property
      const userData = responseData.data || responseData;
      const userRole = userData.user?.role;
      
      console.log('🔍 usePageGuard - User role:', userRole);
      console.log('🔍 usePageGuard - Required roles:', requiredRoles);

      if (!userRole || !requiredRoles.includes(userRole)) {
        console.log(`🚫 Access denied - User role: ${userRole}, Required: ${requiredRoles.join(', ')}`);
        
        // Redirect based on role
        if (userRole === 'SUPER_ADMIN') {
          router.replace('/super-admin');
        } else if (userRole === 'SALES') {
          router.replace('/dashboard'); // Sales can access dashboard
        } else if (userRole === 'ACCOUNTS') {
          router.replace('/transactions'); // Accounts main page
        } else {
          router.replace('/dashboard');
        }
        return;
      }

      console.log(`✅ Access granted - User role: ${userRole}`);
      setIsAuthorized(true);
    } catch (error) {
      console.error('❌ Authorization check failed:', error);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthorized, isLoading };
}
