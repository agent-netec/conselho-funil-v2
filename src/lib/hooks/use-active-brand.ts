'use client';

import { useBrandStore } from '@/lib/stores/brand-store';
import type { Brand } from '@/types/database';

/**
 * Hook para acessar a marca ativa no contexto global.
 * 
 * Retorna a marca selecionada no BrandSelector.
 * Útil para vincular automaticamente entidades (funis, conversas, copies) à marca ativa.
 * 
 * @returns {Brand | null} A marca atualmente selecionada ou null
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const activeBrand = useActiveBrand();
 *   
 *   if (activeBrand) {
 *     console.log('Marca ativa:', activeBrand.name);
 *   }
 * }
 * ```
 */
export function useActiveBrand(): Brand | null {
  const { selectedBrand } = useBrandStore();
  return selectedBrand;
}

