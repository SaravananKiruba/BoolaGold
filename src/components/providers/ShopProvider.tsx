'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ShopBusinessType = 'RETAIL' | 'WHOLESALE';
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'SALES' | 'ACCOUNTS';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  shopId: string | null;
  shopName: string | null;
}

export interface SessionShop {
  id: string;
  name: string;
  shopBusinessType: ShopBusinessType;
  subscriptionType: string;
  isActive: boolean;
  primaryColor: string | null;
  logo: string | null;
}

interface ShopContextValue {
  user: SessionUser | null;
  shop: SessionShop | null;
  loading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  isWholesale: boolean;
  isRetail: boolean;
  refresh: () => Promise<void>;
}

const ShopContext = createContext<ShopContextValue | null>(null);

interface Payload {
  user: SessionUser;
  shop: SessionShop | null;
}

async function fetchSession(): Promise<Payload | null> {
  const res = await fetch('/api/auth/session', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  const body = await res.json();
  const payload = (body?.data ?? body) as Payload;
  if (!payload?.user) return null;
  return payload;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [shop, setShop] = useState<SessionShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchSession();
      if (!payload) {
        setUser(null);
        setShop(null);
      } else {
        setUser(payload.user);
        setShop(payload.shop);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<ShopContextValue>(() => {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isWholesale = shop?.shopBusinessType === 'WHOLESALE';
    const isRetail = !isWholesale && !!shop;
    return {
      user,
      shop,
      loading,
      error,
      isSuperAdmin,
      isWholesale,
      isRetail,
      refresh: load,
    };
  }, [user, shop, loading, error, load]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopContext(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('useShopContext must be used inside <ShopProvider>');
  }
  return ctx;
}

export function useOptionalShopContext(): ShopContextValue | null {
  return useContext(ShopContext);
}
