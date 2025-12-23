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
    const unsubscribe = onAuthChange((user) => {
      set({ user, isLoading: false, isInitialized: true });
    });
    return unsubscribe;
  },
  
  signOut: async () => {
    set({ isLoading: true });
    await authSignOut();
    set({ user: null, isLoading: false });
  },
}));


