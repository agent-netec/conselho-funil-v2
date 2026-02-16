'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Edit,
  Trash2,
  Users,
  Package,
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Palette,
} from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import type { Brand } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandKitForm } from '@/components/brands/brand-kit-form';
import { ProjectList } from '@/components/brands/project-list';
import { BrandCompleteness } from '@/components/brands/brand-completeness';

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
};

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandId = params.id as string;
  const defaultTab = searchParams.get('tab') || 'overview';
  const { getById, remove } = useBrands();
  const { selectedBrand, setSelectedBrand } = useBrandStore();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  const loadBrand = async () => {
    setIsLoading(true);
    const data = await getById(brandId);
    setBrand(data);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!brand) return;
    
    if (confirm(`Tem certeza que deseja excluir a marca "${brand.name}"?\n\nEsta ação não pode ser desfeita e todos os vínculos com funis e copies serão removidos.`)) {
      await remove(brandId);
      // Se deletou a marca selecionada, limpa
      if (selectedBrand?.id === brandId) {
        setSelectedBrand(null);
      }
      router.push('/brands');
    }
  };

  const handleActivate = () => {
    if (brand) {
      setSelectedBrand(brand);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Carregando..." showBrandSelector={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
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
          <Button onClick={() => router.push('/brands')}>
            Voltar para Marcas
          </Button>
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
              <Button
                onClick={handleActivate}
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Ativar Marca
              </Button>
            )}
            <Button
              onClick={() => router.push(`/brands/${brandId}/edit`)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Badge de Status */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">
                Esta é a marca ativa no momento
              </span>
            </motion.div>
          )}

          {/* Brand Completeness */}
          <BrandCompleteness brand={brand} mode="detailed" brandId={brandId} />

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="brandhub" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Brand Hub
              </TabsTrigger>
              <TabsTrigger value="assets">Contexto (RAG)</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Identidade */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Identidade da Marca</h2>
                <p className="text-sm text-zinc-500">Informações básicas e posicionamento</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Nome</label>
                <p className="text-white font-medium">{brand.name}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Vertical</label>
                <p className="text-white">{brand.vertical}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Posicionamento</label>
                <p className="text-white">{brand.positioning}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Tom de Voz</label>
                <p className="text-white">{VOICE_TONE_LABELS[brand.voiceTone] || brand.voiceTone}</p>
              </div>
            </div>
          </div>

          {/* Público-Alvo */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Público-Alvo</h2>
                <p className="text-sm text-zinc-500">Cliente ideal e características</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Cliente Ideal</label>
                <p className="text-white">{brand.audience.who}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Dor Principal</label>
                <p className="text-white">{brand.audience.pain}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Nível de Consciência</label>
                <p className="text-white">{AWARENESS_LABELS[brand.audience.awareness] || brand.audience.awareness}</p>
              </div>
              {brand.audience.objections.length > 0 && (
                <div>
                  <label className="text-sm text-zinc-500">Objeções Principais</label>
                  <ul className="mt-2 space-y-1">
                    {brand.audience.objections.map((obj, i) => (
                      <li key={i} className="text-white flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Oferta */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Oferta Principal</h2>
                <p className="text-sm text-zinc-500">Produto/serviço e posicionamento</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">O que Vende</label>
                <p className="text-white">{brand.offer.what}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Ticket Médio</label>
                <p className="text-white font-semibold text-lg">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(brand.offer.ticket)}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Tipo de Oferta</label>
                <p className="text-white">{OFFER_TYPE_LABELS[brand.offer.type] || brand.offer.type}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Diferencial Competitivo</label>
                <p className="text-white">{brand.offer.differentiator}</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-200/90 mb-1">
                  <strong className="font-semibold">Contexto Compartilhado</strong>
                </p>
                <p className="text-sm text-emerald-200/70">
                  Todas estas informações são usadas automaticamente pelos Conselhos de Funil, Copy e Social 
                  para gerar estratégias personalizadas para esta marca.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

          <TabsContent value="brandhub">
            <BrandKitForm brand={brand} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectList brandId={brandId} />
          </TabsContent>

          <TabsContent value="assets">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-zinc-500 mb-4">Gerencie os arquivos de contexto e ativos desta marca.</p>
            <Button onClick={() => router.push(`/brands/${brandId}/assets`)}>
              Gerenciar Assets
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</div>
  );
}




