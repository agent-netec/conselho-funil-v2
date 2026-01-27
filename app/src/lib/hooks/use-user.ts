'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUser, createUser, updateUserLastLogin } from '@/lib/firebase/firestore';
import type { User } from '@/types/database';

export function useUser() {
  const { user: authUser, isLoading: authLoading } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (authLoading) return;
      
      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Try to get existing user
        let userData = await getUser(authUser.uid);

        // If user doesn't exist in Firestore, create it
        if (!userData) {
          const newUserData: any = {
            email: authUser.email || '',
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Usuário',
            role: 'admin', // First user is admin
          };
          
          // Só adiciona avatar se existir
          if (authUser.photoURL) {
            newUserData.avatar = authUser.photoURL;
          }
          
          await createUser(authUser.uid, newUserData);
          userData = await getUser(authUser.uid);
        } else {
          // Update last login
          await updateUserLastLogin(authUser.uid);
        }

        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Erro ao carregar usuário');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [authUser, authLoading]);

  return { user, isLoading: isLoading || authLoading, error };
}


