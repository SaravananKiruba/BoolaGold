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
      
      if (!response.ok) {
        router.replace('/login');
        return;
      }

      const responseData = await response.json();
      
      // Handle both response formats: direct data or wrapped in data property
      const userData = responseData.data || responseData;
      const userRole = userData.user?.role;

      if (!userRole || !requiredRoles.includes(userRole)) {
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

      setIsAuthorized(true);
    } catch (error) {
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthorized, isLoading };
}
