'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUser, createUser, updateUserLastLogin } from '@/lib/firebase/firestore';
import type { User } from '@/types/database';

export function useUser() {
  const { user: authUser, isLoading: authLoading } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async (retries = 0) => {
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      let userData = await getUser(authUser.uid);

      if (!userData) {
        const newUserData: any = {
          email: authUser.email || '',
          name: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
          role: 'admin',
        };
        if (authUser.photoURL) {
          newUserData.avatar = authUser.photoURL;
        }
        await createUser(authUser.uid, newUserData);
        userData = await getUser(authUser.uid);
      } else {
        await updateUserLastLogin(authUser.uid);
      }

      setUser(userData);
      setError(null);
      setIsLoading(false);
    } catch (err: any) {
      if (err?.code === 'permission-denied' && retries < 4) {
        setTimeout(() => loadUser(retries + 1), 300 * Math.pow(2, retries));
      } else {
        console.error('[useUser] Error loading user:', err);
        setError('Erro ao carregar usuário');
        setIsLoading(false);
      }
    }
  }, [authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authLoading) return;
    setIsLoading(true);
    loadUser(0);
  }, [authLoading, loadUser]);

  return { user, isLoading: isLoading || authLoading, error };
}


