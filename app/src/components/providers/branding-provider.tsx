"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AgencyBranding } from '@/types/agency';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserPreferences } from '@/lib/firebase/firestore';

interface BrandingContextType {
  branding: AgencyBranding;
  updateBranding: (newBranding: Partial<AgencyBranding>) => void;
}

const DEFAULT_BRANDING: AgencyBranding = {
  logoUrl: '',
  colors: {
    primary: '#10b981', // emerald-500
    secondary: '#8b5cf6', // violet-500
  }
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({
  children,
  initialBranding
}: {
  children: React.ReactNode;
  initialBranding?: AgencyBranding;
}) {
  const { user: authUser } = useAuthStore();

  const [branding, setBranding] = useState<AgencyBranding>(() => {
    // Load from localStorage cache for instant display (avoids flash)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cf-branding');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore parse errors
      }
    }
    return initialBranding || DEFAULT_BRANDING;
  });

  // Load from Firestore (source of truth) once auth is ready
  useEffect(() => {
    async function loadFromFirestore() {
      if (!authUser?.uid) return;
      try {
        const prefs = await getUserPreferences(authUser.uid);
        if (prefs?.branding) {
          setBranding(prev => {
            const next: AgencyBranding = {
              ...prev,
              logoUrl: prefs.branding.logoUrl || prev.logoUrl,
              colors: {
                ...prev.colors,
                ...prefs.branding.colors,
              },
            };
            // Sync cache
            localStorage.setItem('cf-branding', JSON.stringify(next));
            return next;
          });
        }
      } catch {
        // Graceful degradation: keep localStorage/default values
      }
    }
    loadFromFirestore();
  }, [authUser?.uid]);

  useEffect(() => {
    // Injeta as variáveis CSS no :root
    const root = document.documentElement;
    if (branding.colors.primary) {
      root.style.setProperty('--primary-brand', branding.colors.primary);
      // Gera uma versão com opacidade para anéis e fundos sutis
      root.style.setProperty('--primary-brand-rgb', hexToRgb(branding.colors.primary));
    }
    if (branding.colors.secondary) {
      root.style.setProperty('--secondary-brand', branding.colors.secondary);
      root.style.setProperty('--secondary-brand-rgb', hexToRgb(branding.colors.secondary));
    }
  }, [branding]);

  const updateBranding = useCallback((newBranding: Partial<AgencyBranding>) => {
    setBranding(prev => ({
      ...prev,
      ...newBranding,
      colors: {
        ...prev.colors,
        ...(newBranding.colors || {})
      }
    }));
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// Helper para converter HEX para RGB (usado para opacidade em Tailwind)
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '16, 185, 129'; // fallback emerald
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
