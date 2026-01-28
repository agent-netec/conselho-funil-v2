'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, Building2, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * Componente de seleção de marca para o header global.
 * Permite trocar entre marcas e criar novas.
 */
export function BrandSelector() {
  const router = useRouter();
  const brandsData = useBrands();
  const brands = brandsData?.brands || [];
  const isLoading = brandsData?.isLoading;
  
  const brandStore = useBrandStore();
  const selectedBrand = brandStore?.selectedBrand;
  const setSelectedBrand = brandStore?.setSelectedBrand;
  
  const [isOpen, setIsOpen] = useState(false);

  // Auto-seleciona primeira marca se nenhuma estiver selecionada
  useEffect(() => {
    if (!selectedBrand && brands.length > 0 && !isLoading) {
      setSelectedBrand(brands[0]);
    }
  }, [brands, selectedBrand, isLoading, setSelectedBrand]);

  const handleSelectBrand = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
      setIsOpen(false);
    }
  };

  const handleNewBrand = () => {
    setIsOpen(false);
    router.push('/brands/new');
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <div className="h-4 w-4 rounded bg-zinc-700 animate-pulse" />
        <div className="h-4 w-24 rounded bg-zinc-700 animate-pulse" />
      </div>
    );
  }

  // Sem marcas - botão para criar primeira
  if (brands.length === 0) {
    return (
      <Button
        onClick={handleNewBrand}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Criar Primeira Marca
      </Button>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
          'bg-white/[0.03] border border-white/[0.06]',
          'hover:bg-white/[0.06] hover:border-white/[0.1]',
          isOpen && 'bg-white/[0.06] border-white/[0.1]'
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-blue-600">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs text-zinc-500">Marca</span>
          <span className="text-sm font-medium text-white truncate max-w-[120px]">
            {selectedBrand?.name || 'Selecione'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl border border-white/[0.06] bg-zinc-900 shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Suas Marcas
                </p>
              </div>

              {/* Lista de Marcas */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand.id)}
                    className={cn(
                      'w-full px-4 py-3 flex items-start gap-3 transition-colors',
                      'hover:bg-white/[0.04]',
                      selectedBrand?.id === brand.id && 'bg-emerald-500/5'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      selectedBrand?.id === brand.id
                        ? 'bg-gradient-to-br from-emerald-500 to-blue-600'
                        : 'bg-white/[0.06]'
                    )}>
                      <Building2 className={cn(
                        'h-5 w-5',
                        selectedBrand?.id === brand.id ? 'text-white' : 'text-zinc-400'
                      )} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          selectedBrand?.id === brand.id ? 'text-emerald-400' : 'text-white'
                        )}>
                          {brand.name}
                        </span>
                        {selectedBrand?.id === brand.id && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {brand.vertical}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer - Nova Marca */}
              <div className="px-2 py-2 border-t border-white/[0.06]">
                <button
                  onClick={handleNewBrand}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Nova Marca</span>
                  <Sparkles className="h-3.5 w-3.5 ml-auto" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}






