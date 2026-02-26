import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthChange, signOut as authSignOut } from '@/lib/firebase/auth';

// R5.2: Cookie name for auth presence detection (matches middleware.ts)
const AUTH_COOKIE = 'mkthoney_auth';

/**
 * Set auth presence cookie (client-side).
 * Used by middleware to detect if user might be authenticated.
 */
function setAuthCookie() {
  if (typeof document !== 'undefined') {
    // Set cookie with 30-day expiry, SameSite=Lax for security
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}

/**
 * Remove auth presence cookie (client-side).
 */
function removeAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

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
        // R5.2: Sync auth cookie with Firebase auth state
        if (user) {
          setAuthCookie();
        } else {
          removeAuthCookie();
        }
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
    // R5.2: Remove auth cookie on logout
    removeAuthCookie();
    set({ user: null, isLoading: false });
  },
}));


