'use client';

import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { BrandCard } from '@/components/brands/brand-card';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';

/**
 * Brand management page — Bloomberg terminal pattern
 *
 * Allows user to view, edit and delete existing brands.
 * Shows loading state and empty state with CTA to create first brand.
 */
export default function BrandsPage() {
  const router = useRouter();
  const { brands, isLoading, remove } = useBrands();

  const handleDelete = async (brandId: string, brandName: string) => {
    const confirmed = confirm(
      `Tem certeza que deseja excluir a marca "${brandName}"?\n\nEsta ação não pode ser desfeita.`
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
    <div className="min-h-screen bg-[#0D0B09]">
      {/* Bloomberg inline header */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-6 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[42px] font-bold tracking-tight text-[#F5E8CE] leading-none">
                Minhas Marcas
              </h1>
              <p className="mt-2 text-[13px] font-mono text-[#6B5D4A]">
                Gerencie o contexto das suas marcas para personalizar as análises
              </p>
            </div>

            <button
              onClick={() => router.push('/brands/new')}
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              NOVA MARCA
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 border border-white/[0.06] bg-[#1A1612]/50 animate-pulse"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand, index) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onEdit={() => router.push(`/brands/${brand.id}/edit`)}
                onDelete={() => handleDelete(brand.id, brand.name)}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
