'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Building2, Edit, Trash2, Users, Package, TrendingUp,
  AlertTriangle, Sparkles,
} from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { BrandCompleteness } from '@/components/brands/brand-completeness';
import type { Brand } from '@/types/database';

const VOICE_TONE_LABELS: Record<string, string> = {
  professional: 'Profissional 👔',
  casual: 'Casual 😊',
  authoritative: 'Autoritário 🎯',
  friendly: 'Amigável 🤝',
  inspirational: 'Inspirador ✨',
};

const AWARENESS_LABELS: Record<string, string> = {
  unaware: 'Não sabe que tem problema',
  problem_aware: 'Sabe que tem problema',
  solution_aware: 'Busca soluções',
  product_aware: 'Conhece seu produto',
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  course: 'Curso/Infoproduto',
  saas: 'SaaS/Software',
  service: 'Serviço',
  mentorship: 'Mentoria/Consultoria',
  physical: 'Produto Físico',
  subscription: 'Assinatura',
  consultancy: 'Consultoria',
  ebook: 'E-book/Digital',
  community: 'Comunidade',
  event: 'Evento/Workshop',
  franchise: 'Franquia',
};

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const { remove } = useBrands();
  const { selectedBrand, setSelectedBrand } = useBrandStore();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { assets: brandAssets } = useBrandAssets(brandId);

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  const loadBrand = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/brands/${brandId}`, { headers });
      if (res.status === 404) { setBrand(null); setIsLoading(false); return; }
      if (!res.ok) { setIsLoading(false); return; }
      const json = await res.json();
      setBrand(json.data.brand);
    } catch (err) {
      console.error('[BrandDetail] loadBrand failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!brand) return;
    if (confirm(`Tem certeza que deseja excluir a marca "${brand.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      await remove(brandId);
      if (selectedBrand?.id === brandId) setSelectedBrand(null);
      router.push('/brands');
    }
  };

  const handleActivate = () => {
    if (brand) setSelectedBrand(brand);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Carregando..." showBrandSelector={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E6B447]" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Marca não encontrada" showBrandSelector={false} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Marca não encontrada</h2>
          <p className="text-zinc-500 mb-6">Esta marca pode ter sido removida</p>
          <Button onClick={() => router.push('/brands')}>Voltar para Marcas</Button>
        </div>
      </div>
    );
  }

  const isActive = selectedBrand?.id === brandId;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={brand.name}
        subtitle={brand.vertical}
        showBack
        showBrandSelector={false}
        actions={
          <div className="flex items-center gap-2">
            {!isActive && (
              <Button onClick={handleActivate} variant="outline" size="sm" className="border-[#E6B447]/30 text-[#E6B447] hover:bg-[#E6B447]/10">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ativar Marca
              </Button>
            )}
            <Button onClick={() => router.push(`/brands/${brandId}/edit`)} size="sm" className="bg-[#E6B447] hover:bg-[#AB8648]">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button onClick={handleDelete} variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E6B447]/10 border border-[#E6B447]/30"
            >
              <div className="h-2 w-2 rounded-full bg-[#E6B447] animate-pulse" />
              <span className="text-sm font-medium text-[#E6B447]">Esta é a marca ativa no momento</span>
            </motion.div>
          )}

          <BrandCompleteness brand={brand} mode="detailed" brandId={brandId} assetCount={brandAssets.length} />

          {/* Overview — read-only summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Identity */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-[#E6B447]" />
                <h3 className="text-sm font-semibold text-white">Identidade</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div><span className="text-zinc-500">Vertical:</span> <span className="text-white ml-1">{brand.vertical}</span></div>
                <div><span className="text-zinc-500">Tom:</span> <span className="text-white ml-1">{VOICE_TONE_LABELS[brand.voiceTone] || brand.voiceTone}</span></div>
                {brand.positioning && <p className="text-zinc-400 line-clamp-2">{brand.positioning}</p>}
              </div>
            </div>

            {/* Audience */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#E6B447]" />
                <h3 className="text-sm font-semibold text-white">Audiência</h3>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-zinc-300 line-clamp-2">{brand.audience?.who}</p>
                <div><span className="text-zinc-500">Awareness:</span> <span className="text-white ml-1">{AWARENESS_LABELS[brand.audience?.awareness] || brand.audience?.awareness}</span></div>
                {(brand.audience?.objections?.length || 0) > 0 && (
                  <div className="text-zinc-500">{brand.audience.objections.length} objeção(ões)</div>
                )}
              </div>
            </div>

            {/* Offer */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-[#E6B447]" />
                <h3 className="text-sm font-semibold text-white">Oferta</h3>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-zinc-300 line-clamp-2">{brand.offer?.what}</p>
                <div>
                  <span className="text-zinc-500">Ticket:</span>
                  <span className="text-white ml-1 font-semibold">
                    {brand.offer?.ticket ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(brand.offer.ticket) : '—'}
                  </span>
                </div>
                <div><span className="text-zinc-500">Tipo:</span> <span className="text-white ml-1">{OFFER_TYPE_LABELS[brand.offer?.type] || brand.offer?.type}</span></div>
              </div>
            </div>
          </div>

          {/* Context info */}
          <div className="rounded-xl border border-[#E6B447]/20 bg-[#E6B447]/5 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-[#E6B447] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-300 mb-1"><strong>Contexto Compartilhado</strong></p>
                <p className="text-xs text-zinc-400">
                  Todas estas informações são usadas pelos conselheiros (Copy, Social, Design, Ads) para gerar estratégias personalizadas.
                  Para editar, clique em <button onClick={() => router.push(`/brands/${brandId}/edit`)} className="text-[#E6B447] underline">Editar</button>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
