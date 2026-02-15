'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { CampaignStepper } from '@/components/campaigns/campaign-stepper';
import { StageCard } from '@/components/campaigns/stage-card';
import { CampaignContext } from '@/types/campaign';
import { 
  Target, 
  PenTool, 
  Share2, 
  Palette, 
  BarChart3,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '@/lib/stores/notification-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

import { MonitoringDashboard, Metric } from '@/components/campaigns/monitoring-dashboard';

export default function CampaignCommandCenter() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [currentStageId, setCurrentStageId] = useState<string>('funnel');

  // Mock metrics for ST-11.17
  const [metrics] = useState<Metric[]>([
    { label: 'CTR Médio', value: 0.65, target: 1.2, unit: '%', status: 'danger', change: -12 },
    { label: 'CPC Médio', value: 2.45, target: 1.5, unit: 'currency', status: 'warning', change: 8 },
    { label: 'Conversão', value: 3.2, target: 5.0, unit: '%', status: 'warning', change: -5 },
    { label: 'ROAS', value: 2.1, target: 4.0, unit: 'ratio', status: 'danger', change: -15 },
  ]);

  const [anomalies] = useState<string[]>([
    "CTR < 0.8%: O Design não está parando o scroll no Meta Ads. O framework C.H.A.P.E.U sugere aumentar o Contraste e a Hierarquia Visual nos primeiros 3 segundos.",
    "CPC acima do benchmark: A segmentação de audiência pode estar muito ampla ou a Big Idea da copy não está ressonando com o público 'Inconsciente'."
  ]);

  useEffect(() => {
    if (!params.id) return;

    const funnelId = params.id as string;

    // Monitora a Campanha (Manifesto da Linha de Ouro)
    const unsubCampaign = onSnapshot(doc(db, 'campaigns', funnelId), async (docSnap) => {
      if (docSnap.exists()) {
        const campaignData = { ...docSnap.data(), id: docSnap.id } as CampaignContext;

        // Resilience: se o doc da campanha existe mas sem copywriting, scanner de copy aprovada
        if (!campaignData.copywriting && campaignData.funnelId) {
          try {
            const copyRef = collection(db, 'funnels', campaignData.funnelId, 'copyProposals');
            const copySnap = await getDocs(query(copyRef, where('status', '==', 'approved'), limit(1)));
            if (copySnap.docs.length > 0) {
              const approvedCopy = copySnap.docs[0].data();
              campaignData.copywriting = {
                bigIdea: approvedCopy.content?.primary?.slice(0, 500) || 'Big Idea aprovada',
                headlines: approvedCopy.content?.headlines || [],
                mainScript: approvedCopy.content?.primary || '',
                tone: approvedCopy.awarenessStage || 'problem_aware',
                keyBenefits: [],
                counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Conselho de Copy',
              };
            }
          } catch (err) {
            console.warn('[Campaign] Fallback copy scan failed:', err);
          }
        }

        updateUnifiedState(campaignData);
      } else {
        // Se a campanha não existe, tenta carregar do Funil
        loadFromFunnelFallback();
      }
    });

    // Fallback e Merge de Segurança
    async function loadFromFunnelFallback() {
      try {
        const funnelSnap = await getDoc(doc(db, 'funnels', funnelId));
        if (funnelSnap.exists()) {
          const funnelData = funnelSnap.data();
          
          // Scanner de Copy
          const copyRef = collection(db, 'funnels', funnelId, 'copyProposals');
          const copySnap = await getDocs(query(copyRef, where('status', '==', 'approved'), limit(1)));
          const approvedCopy = copySnap.docs.length > 0 ? copySnap.docs[0].data() : null;

          const virtualCampaign: CampaignContext = {
            id: funnelId,
            funnelId: funnelId,
            brandId: funnelData.brandId || '',
            userId: funnelData.userId || '',
            name: funnelData.name || 'Nova Campanha',
            status: 'active',
            funnel: {
              type: funnelData.type || 'Funnel',
              architecture: funnelData.architecture || '',
              targetAudience: funnelData.targetAudience || funnelData.context?.audience?.who || '',
              mainGoal: funnelData.mainGoal || funnelData.context?.objective || '',
              stages: funnelData.stages || [],
              summary: funnelData.summary || '',
            },
            copywriting: approvedCopy ? {
              bigIdea: approvedCopy.content.primary?.slice(0, 500) || 'Big Idea aprovada',
              headlines: approvedCopy.content.headlines || [],
              mainScript: approvedCopy.content.primary || '',
              tone: approvedCopy.awarenessStage || 'problem_aware',
              keyBenefits: [],
              counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Conselho de Copy',
            } : undefined,
            createdAt: funnelData.createdAt,
            updatedAt: funnelData.updatedAt,
          };
          updateUnifiedState(virtualCampaign);
        }
      } catch (err) {
        console.error('Erro no scanner de fallback:', err);
      }
    }

    function updateUnifiedState(data: CampaignContext) {
      // Se por algum motivo o objeto funnel estiver vindo vazio da coleção campaigns,
      // nós mantemos a estrutura básica para não quebrar a UI
      if (!data.funnel) {
        data.funnel = { type: 'Funnel', architecture: '', targetAudience: '', mainGoal: '', stages: [], summary: '' };
      }
      
      setCampaign(data);
      
      // Calculate completed stages
      const completed = [];
      if (data.funnel) completed.push('funnel');
      if (data.copywriting) completed.push('copy');
      if (data.social) completed.push('social');
      if (data.design) completed.push('design');
      if (data.ads) completed.push('ads');
      setCompletedStages(completed);

      // Determine current stage
      if (!data.copywriting) setCurrentStageId('copy');
      else if (!data.social) setCurrentStageId('social');
      else if (!data.design) setCurrentStageId('design');
      else if (!data.ads) setCurrentStageId('ads');
      else setCurrentStageId('ads');

      setLoading(false);
    }

    return () => unsubCampaign();
  }, [params.id]);

  const [generatingAds, setGeneratingAds] = useState(false);

  const handleAction = async (stageId: string) => {
    if (!campaign) return;

    notify.info(`Iniciando ${stageId}`, `O Conselho está sendo convocado...`);

    if (stageId === 'funnel') {
      router.push(`/funnels/${campaign.funnelId}?campaignId=${campaign.id}`);
    } else if (stageId === 'copy') {
      router.push(`/funnels/${campaign.funnelId}/copy?campaignId=${campaign.id}`);
    } else if (stageId === 'social') {
      router.push(`/funnels/${campaign.funnelId}/social?campaignId=${campaign.id}`);
    } else if (stageId === 'design') {
      router.push(`/chat?mode=design&funnelId=${campaign.funnelId}&campaignId=${campaign.id}`);
    } else if (stageId === 'ads') {
      // Se ads ainda não existe, auto-gerar via API dedicada (salva direto no Firestore)
      if (!campaign.ads) {
        setGeneratingAds(true);
        notify.info('Gerando Estratégia', 'O Conselho de Ads está projetando a escala...');
        try {
          const authHeaders = await getAuthHeaders();
          const res = await fetch(`/api/campaigns/${campaign.id}/generate-ads`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ userId: campaign.userId }),
          });
          if (res.ok) {
            notify.info('Estratégia Gerada', 'A Escala foi adicionada à Linha de Ouro!');
          } else {
            console.error('Erro ao gerar ads:', await res.text());
            notify.warning('Aviso', 'Não foi possível gerar automaticamente. Use o chat para criar a estratégia.');
          }
        } catch (err) {
          console.error('Erro na chamada generate-ads:', err);
        } finally {
          setGeneratingAds(false);
        }
      }
      // Navegar para o chat de Ads para refinamento
      router.push(`/chat?mode=ads&funnelId=${campaign.funnelId}&campaignId=${campaign.id}`);
    } else {
      notify.warning('Em desenvolvimento', `A etapa de ${stageId} está sendo preparada.`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <Header title="Carregando Comando..." showBack />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-12 w-12 text-emerald-500 opacity-20" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col bg-black">
        <Header title="Campanha não encontrada" showBack />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ShieldCheck className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Campanha Extraviada</h2>
            <p className="text-zinc-500 max-w-xs mx-auto">
              Não conseguimos localizar este manifesto estratégico no nosso banco de dados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden">
      <Header 
        title={campaign.name || "Campanha Sem Nome"} 
        showBack 
        subtitle="Campaign Command Center"
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
        {/* The Golden Thread Stepper */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
              The Golden Thread
            </h2>
          </div>
          <CampaignStepper 
            currentStageId={currentStageId} 
            completedStages={completedStages} 
          />
        </section>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          <StageCard
            title="O Cérebro"
            description="Arquitetura & Estratégia de Funil"
            icon={Target}
            status={campaign.funnel ? 'approved' : 'empty'}
            summary={campaign.funnel ? [
              `Tipo: ${campaign.funnel.type}`,
              `Objetivo: ${campaign.funnel.mainGoal}`,
              `Público: ${campaign.funnel.targetAudience}`
            ] : []}
            onAction={() => handleAction('funnel')}
            actionLabel={campaign.funnel ? "Ver Estratégia" : "Definir Funil"}
            isActive={currentStageId === 'funnel'}
          />

          <StageCard
            title="A Voz"
            description="Copywriting Persuasivo"
            icon={PenTool}
            status={campaign.copywriting ? 'approved' : campaign.funnel ? 'empty' : 'empty'}
            summary={campaign.copywriting ? [
              `Big Idea: ${campaign.copywriting.bigIdea.slice(0, 60)}...`,
              `Tom: ${campaign.copywriting.tone}`,
              `Base: ${campaign.copywriting.counselor_reference || 'Conselho'}`
            ] : []}
            onAction={() => handleAction('copy')}
            actionLabel={campaign.copywriting ? "Ver Copy" : "Gerar Copy"}
            isActive={currentStageId === 'copy'}
          />

          <StageCard
            title="A Atenção"
            description="Social Media & Hooks"
            icon={Share2}
            status={campaign.social ? 'approved' : campaign.copywriting ? 'empty' : 'empty'}
            summary={campaign.social ? [
              `${campaign.social.hooks?.length || 0} Hooks estratégicos`,
              `Plataformas: ${campaign.social.platforms?.join(', ') || 'Todas'}`
            ] : []}
            onAction={() => handleAction('social')}
            actionLabel={campaign.social ? "Ver Hooks" : "Gerar Hooks"}
            isActive={currentStageId === 'social'}
          />

          <StageCard
            title="O Visual"
            description="Design Intelligence (C.H.A.P.E.U)"
            icon={Palette}
            status={campaign.design ? 'approved' : campaign.social ? 'ready' : 'empty'}
            summary={campaign.design ? [
              `Estilo: ${campaign.design.visualStyle}`,
              `${campaign.design.assetsUrl?.length || 0} Criativo(s) na Linha de Ouro`,
              `Engine: NanoBanana Pro`
            ] : campaign.social ? ['Aguardando definição visual'] : []}
            onAction={() => handleAction('design')}
            actionLabel={campaign.design ? "Ver Design" : "Gerar Visuais"}
            isActive={currentStageId === 'design'}
          />

          <StageCard
            title="A Escala"
            description="Conselho de Ads & Tráfego"
            icon={BarChart3}
            status={campaign.ads ? 'approved' : generatingAds ? 'generating' : campaign.design ? 'ready' : 'empty'}
            summary={campaign.ads ? [
              `Canais: ${campaign.ads.channels.join(', ')}`,
              `Budget Sugerido: ${campaign.ads.suggestedBudget || 'A definir'}`,
              ...(campaign.ads.audiences?.length ? [`${campaign.ads.audiences.length} audiência(s) segmentada(s)`] : [])
            ] : generatingAds ? [
              'Conselho de Ads analisando o manifesto...',
              'Projetando audiências, canais e budget'
            ] : campaign.design ? [
              'Design & Copy sincronizados',
              'Pronto para definir canais e budget'
            ] : []}
            onAction={() => handleAction('ads')}
            actionLabel={campaign.ads ? "Ver Campanha" : generatingAds ? "Gerando..." : "Gerar Estrutura Ads"}
            isActive={currentStageId === 'ads'}
          />
        </div>

        {/* Monitoring Dashboard (ST-11.17 & ST-11.18) */}
        <section className="mt-12">
          <MonitoringDashboard 
            metrics={metrics} 
            anomalies={anomalies} 
            onRefresh={() => notify.info('Sincronizando', 'Buscando métricas da Meta Ads API...')}
          />
        </section>
      </div>
    </div>
  );
}
