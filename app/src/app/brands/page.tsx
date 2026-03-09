'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { BrandCard } from '@/components/brands/brand-card';
import { motion } from 'framer-motion';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';

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
              Gerencie o contexto das suas marcas para personalizar as análises
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/brands/new')}
            className="bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C]"
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
          <GuidedEmptyState
            icon={Sparkles}
            title="Nenhuma marca criada ainda"
            description="Crie sua primeira marca para que o MKTHONEY possa personalizar estratégias, conteúdo e funis para o seu negócio."
            ctaLabel="Criar Primeira Marca"
            onCtaClick={() => router.push('/brands/new')}
            tips={[
              'O setup leva menos de 3 minutos',
              'Você pode configurar até 5 marcas no plano Starter',
              'Cada marca tem especialistas personalizados',
            ]}
          />
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
