import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthChange, signOut as authSignOut } from '@/lib/firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  
  initialize: () => {
    set({ isLoading: true });
    
    // US-28.01: Se o Firebase Auth não estiver disponível (ex: falha de config), 
    // marcamos como inicializado para evitar loading infinito.
    if (!onAuthChange) {
      console.error('[AuthStore] onAuthChange not available');
      set({ isLoading: false, isInitialized: true });
      return () => {};
    }

    try {
      const unsubscribe = onAuthChange((user) => {
        set({ user, isLoading: false, isInitialized: true });
      });

      // Se o unsubscribe for uma função vazia (string representation check ou similar)
      // ou se o Firebase Auth for null, forçamos a inicialização.
      if (unsubscribe.toString() === '() => {}' || unsubscribe.toString().includes('noop')) {
        console.warn('[AuthStore] Firebase Auth not available, forcing initialization.');
        set({ user: null, isLoading: false, isInitialized: true });
      }

      return unsubscribe;
    } catch (error) {
      console.error('[AuthStore] Error during initialization:', error);
      set({ isLoading: false, isInitialized: true });
      return () => {};
    }
  },
  
  signOut: async () => {
    set({ isLoading: true });
    await authSignOut();
    set({ user: null, isLoading: false });
  },
}));


