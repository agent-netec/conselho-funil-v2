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

    let verifyInterval: ReturnType<typeof setInterval> | null = null;

    // Safety timeout: force initialization after 5s to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state.isInitialized) {
        console.warn('[AuthStore] Safety timeout: forcing initialization after 5s');
        set({ user: null, isLoading: false, isInitialized: true });
      }
    }, 5000);

    try {
      const unsubscribe = onAuthChange(async (user) => {
        clearTimeout(safetyTimeout);
        // R5.2: Sync auth cookie with Firebase auth state
        if (user) {
          setAuthCookie();
          // Wait for Firestore SDK's internal credentialsProvider to receive the auth token.
          // Firebase Auth notifies observers in this order:
          //   1. authStateObservers (our onAuthStateChanged callback — fires FIRST)
          //   2. idTokenObservers (Firestore's internal observer — fires AFTER)
          // Publishing the user immediately causes all hooks to set up Firestore queries
          // before Firestore has the token → "Missing or insufficient permissions".
          // getIdToken(false) returns instantly (cached), then we wait 150ms for
          // Firestore's internal observer to process and update credentialsProvider.
          // See: firebase/firebase-js-sdk#1981, #6964, #8201
          try {
            await user.getIdToken(false);
            await new Promise(resolve => setTimeout(resolve, 150));
          } catch { /* ignore — still publish user */ }
        } else {
          removeAuthCookie();
        }
        set({ user, isLoading: false, isInitialized: true });

        // Clear previous interval if any
        if (verifyInterval) {
          clearInterval(verifyInterval);
          verifyInterval = null;
        }

        // Auto-refresh emailVerified via visibility change + polling
        if (user && !user.emailVerified) {
          const checkVerified = async () => {
            try {
              await user.reload();
              if (user.emailVerified) {
                set({ user: { ...user } as typeof user });
                if (verifyInterval) {
                  clearInterval(verifyInterval);
                  verifyInterval = null;
                }
              }
            } catch {
              // Silently ignore reload errors
            }
          };

          // Poll every 10s while tab is active
          verifyInterval = setInterval(checkVerified, 10_000);

          // Also check on tab focus
          if (typeof document !== 'undefined') {
            const onVisibility = () => {
              if (document.visibilityState === 'visible') checkVerified();
            };
            document.addEventListener('visibilitychange', onVisibility);
          }
        }
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


