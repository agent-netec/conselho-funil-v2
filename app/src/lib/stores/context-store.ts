import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DataScope } from '@/types/scoped-data';

interface ContextState {
  // Escopo atual selecionado globalmente
  currentScope: DataScope;
  
  // Metadados para exibição (nomes)
  names: {
    brand?: string;
    funnel?: string;
    campaign?: string;
  };

  // Actions
  setScope: (scope: DataScope, names?: { brand?: string; funnel?: string; campaign?: string }) => void;
  setBrandScope: (brandId: string, name: string) => void;
  setFunnelScope: (brandId: string, funnelId: string, name: string, brandName?: string) => void;
  setCampaignScope: (brandId: string, funnelId: string, campaignId: string, name: string, funnelName?: string, brandName?: string) => void;
  clearScope: () => void;
}

/**
 * Store para gerenciar o contexto hierárquico atual (Marca > Funil > Campanha)
 */
export const useContextStore = create<ContextState>()(
  persist(
    (set) => ({
      currentScope: { level: 'universal' },
      names: {},

      setScope: (scope, names = {}) => set({ currentScope: scope, names }),

      setBrandScope: (brandId, name) => set({
        currentScope: { level: 'brand', brandId },
        names: { brand: name }
      }),

      setFunnelScope: (brandId, funnelId, name, brandName) => set((state) => ({
        currentScope: { level: 'funnel', brandId, funnelId },
        names: { ...state.names, brand: brandName || state.names.brand, funnel: name }
      })),

      setCampaignScope: (brandId, funnelId, campaignId, name, funnelName, brandName) => set((state) => ({
        currentScope: { level: 'campaign', brandId, funnelId, campaignId },
        names: { 
          ...state.names, 
          brand: brandName || state.names.brand, 
          funnel: funnelName || state.names.funnel, 
          campaign: name 
        }
      })),

      clearScope: () => set({ currentScope: { level: 'universal' }, names: {} }),
    }),
    {
      name: 'context-storage',
      skipHydration: true, // SSR-safe: rehydrate manualmente em client root
    }
  )
);
