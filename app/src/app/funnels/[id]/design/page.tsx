'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  Palette,
  Layers,
  Shield,
  Target,
  ChevronRight,
  Zap,
  Info,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import { DesignGenerationCard } from '@/components/chat/design-generation-card';
import type { Funnel } from '@/types/database';

export default function DesignCouncilPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();
  
  const funnelId = params.id as string;
  const campaignId = searchParams.get('campaignId');
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!funnelId) return;
      try {
        const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
        if (funnelDoc.exists()) {
          setFunnel({ id: funnelDoc.id, ...funnelDoc.data() } as Funnel);
        }

        const docId = campaignId || funnelId;
        const campaignDoc = await getDoc(doc(db, 'campaigns', docId));
        let campaignData = campaignDoc.exists() ? campaignDoc.data() : null;

        // Context Guard: ignorar dados de design se a campanha pertence a outra marca
        const funnelBrandId = (funnelDoc.exists() ? funnelDoc.data()?.brandId : null);
        if (campaignData && campaignData.brandId && funnelBrandId && campaignData.brandId !== funnelBrandId) {
          console.warn(`[Context Guard] Campanha ${docId} pertence à marca ${campaignData.brandId}, funil à marca ${funnelBrandId}. Ignorando design.`);
          campaignData = { ...campaignData, design: undefined };
        }

        // Scanner de Copy Fallback: se a campanha não tem copywriting, busca na subcoleção copyProposals
        if (!campaignData || !campaignData.copywriting) {
          const copyRef = collection(db, 'funnels', funnelId, 'copyProposals');
          const copySnap = await getDocs(query(copyRef, where('status', '==', 'approved'), limit(1)));
          if (copySnap.docs.length > 0) {
            const approvedCopy = copySnap.docs[0].data();
            campaignData = {
              ...campaignData,
              copywriting: {
                bigIdea: approvedCopy.content?.primary?.slice(0, 500) || 'Big Idea aprovada',
                headlines: approvedCopy.content?.headlines || [],
                mainScript: approvedCopy.content?.primary || '',
                tone: approvedCopy.awarenessStage || 'problem_aware',
                counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Conselho de Copy',
              }
            };
          }
        }

        setCampaign(campaignData);
        if (campaignData?.design?.visualPrompts) {
          setPrompts(campaignData.design.visualPrompts.map((p: any) => ({
            ...p,
            brandContext: campaignData?.funnel?.mainGoal
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [funnelId]);

  const handleGenerateDesign = async () => {
    if (!funnel || !campaign?.copywriting) {
      notify.error('Erro', 'Copywriting pendente.');
      return;
    }

    setIsGenerating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          userId: user?.uid,
          brandId: funnel?.brandId || selectedBrand?.id,
          context: {
            objective: funnel.context?.objective || '',
            copy: campaign.copywriting.mainScript || '',
            hooks: campaign.social?.hooks || []
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(data.data?.prompts ?? data.prompts ?? []);
        notify.success('Estratégia visual gerada!');
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao convocar Conselho de Design');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!funnelId || prompts.length === 0) return;
    
    setIsLoading(true);
    try {
      const docId = campaignId || funnelId;
      await updateCampaignManifesto(docId, {
        design: {
          visualStyle: 'Modern Premium',
          preferredColors: ['#10b981', '#000000'],
          visualPrompts: prompts,
          aspectRatios: ['1:1', '9:16'],
        }
      });

      notify.success('Diretriz Visual Aprovada!');
      router.push(`/campaigns/${docId}`);
    } catch (error) {
      notify.error('Erro', 'Falha ao salvar estratégia visual');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <Header title="Conselho de Design" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header title="Design Intelligence" showBack />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Link href={`/campaigns/${campaignId || funnelId}`} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Comando
        </Link>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <Palette className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Conselho de Design</h1>
              <p className="text-zinc-500">Framework C.H.A.P.E.U: Contraste, Hierarquia, Antropomorfismo, Prova, Emoção, Urgência.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="card-premium p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Base Estratégica</p>
                <p className="text-sm text-zinc-200 font-medium truncate">Copy & Hooks Aprovados</p>
              </div>
            </div>
            <div className="card-premium p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Framework</p>
                <p className="text-sm text-zinc-200 font-medium">C.H.A.P.E.U v2.0</p>
              </div>
            </div>
            <div className="card-premium p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Segurança</p>
                <p className="text-sm text-zinc-200 font-medium">Safe Zones (Meta/LI)</p>
              </div>
            </div>
          </div>

          {prompts.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Pronto para criar o impacto visual?</h3>
              <Button 
                onClick={handleGenerateDesign} 
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-500 h-12 px-8 font-bold"
              >
                {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Palette className="mr-2 h-5 w-5" />}
                Planejar Ativos Visuais
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  Criativos NanoBanana
                </h2>
                <Button variant="ghost" onClick={handleGenerateDesign} disabled={isGenerating} className="text-zinc-500 hover:text-white">
                  <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                  Recriar Estratégia
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {prompts.map((prompt, i) => (
                  <DesignGenerationCard
                    key={i}
                    promptData={prompt}
                    conversationId={funnelId}
                    campaignId={campaignId}
                  />
                ))}
              </div>

              <div className="pt-8 border-t border-white/[0.05] flex justify-end">
                <Button onClick={handleApproveDesign} className="bg-purple-600 hover:bg-purple-500 h-12 px-12 text-lg font-bold shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  Concluir Etapa Visual
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
