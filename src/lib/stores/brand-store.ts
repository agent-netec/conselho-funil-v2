import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Brand } from '@/types/database';

interface BrandState {
  selectedBrand: Brand | null;
  brands: Brand[];
  isLoading: boolean;
  
  // Actions
  setSelectedBrand: (brand: Brand | null) => void;
  setBrands: (brands: Brand[]) => void;
  setLoading: (loading: boolean) => void;
  clearBrand: () => void;
}

/**
 * Zustand store para gerenciar o contexto da marca selecionada.
 * Persiste a última marca selecionada no localStorage.
 */
export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      selectedBrand: null,
      brands: [],
      isLoading: false,
      
      setSelectedBrand: (brand) => set({ selectedBrand: brand }),
      setBrands: (brands) => set({ brands }),
      setLoading: (isLoading) => set({ isLoading }),
      clearBrand: () => set({ selectedBrand: null }),
    }),
    {
      name: 'brand-storage', // Nome da chave no localStorage
      partialize: (state) => ({ 
        selectedBrand: state.selectedBrand, // Apenas persiste a marca selecionada
      }),
    }
  )
);

