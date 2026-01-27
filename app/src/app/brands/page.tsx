'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { BrandCard } from '@/components/brands/brand-card';
import { motion } from 'framer-motion';

/**
 * Página de Gerenciamento de Marcas
 * 
 * Permite ao usuário visualizar, editar e excluir marcas existentes.
 * Exibe estado de loading e empty state com CTA para criar primeira marca.
 */
export default function BrandsPage() {
  const router = useRouter();
  const { brands, isLoading, remove } = useBrands();

  const handleDelete = async (brandId: string, brandName: string) => {
    const confirmed = confirm(
      `Tem certeza que deseja excluir a marca "${brandName}"?\n\n⚠️ Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        await remove(brandId);
      } catch (error) {
        console.error('Error deleting brand:', error);
        alert('Erro ao excluir marca. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header showBrandSelector={false} />
      
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Minhas Marcas
            </h1>
            <p className="text-zinc-500">
              Gerencie o contexto das suas marcas para personalizar os conselhos
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/brands/new')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Marca
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && brands.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Nenhuma marca criada ainda
            </h2>
            
            <p className="text-zinc-500 max-w-md mb-8">
              Crie sua primeira marca para contextualizar os conselhos da IA 
              com o tom de voz, audiência e oferta do seu negócio.
            </p>
            
            <Button
              onClick={() => router.push('/brands/new')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Criar Primeira Marca
            </Button>
          </motion.div>
        )}

        {/* Brands Grid */}
        {!isLoading && brands.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {brands.map((brand, index) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onEdit={() => router.push(`/brands/${brand.id}/edit`)}
                onDelete={() => handleDelete(brand.id, brand.name)}
                delay={index * 0.1}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
