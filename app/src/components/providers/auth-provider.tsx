'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';
import { useContextStore } from '@/lib/stores/context-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Rehydrate persisted stores (skipHydration: true) — SIG-SEC-03
    useBrandStore.persist.rehydrate();
    useContextStore.persist.rehydrate();

    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return <>{children}</>;
}


