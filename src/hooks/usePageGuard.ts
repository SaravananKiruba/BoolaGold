/**
 * Page Guard Hook
 * Client-side protection for pages based on user permissions
 * Redirects unauthorized users attempting direct URL access
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  user: {
    userId: string;
    username: string;
    name: string;
    role: string;
    shopId: string | null;
    shopName: string | null;
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
        console.log('🚫 No session - redirecting to login');
        router.replace('/login');
        return;
      }

      const data: Session = await response.json();
      const userRole = data.user?.role;

      if (!requiredRoles.includes(userRole)) {
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
