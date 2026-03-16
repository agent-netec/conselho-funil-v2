'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc, collection, query, where, getDocs, limit, orderBy, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
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
  TrendingUp,
  Trophy,
  FileText,
  Presentation,
  CheckSquare,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '@/lib/stores/notification-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';

import { MonitoringDashboard, Metric } from '@/components/campaigns/monitoring-dashboard';

export default function CampaignCommandCenter() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [campaign, setCampaign] = useState<CampaignContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [currentStageId, setCurrentStageId] = useState<string>('funnel');

  const [metrics] = useState<Metric[]>([]);

  const [anomalies] = useState<string[]>([]);

  useEffect(() => {
    if (!params.id || !user?.uid) return;

    const funnelId = params.id as string;

    // Monitora a Campanha (Manifesto da Linha de Ouro) — with retry on permission-denied
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentUnsub: (() => void) | null = null;
    let retryCount = 0;
    const MAX_LISTENER_RETRIES = 5;

    const setupCampaignListener = () => {
    currentUnsub = onSnapshot(doc(db, 'campaigns', funnelId), async (docSnap) => {
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
                counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Copywriting',
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
    }, (error) => {
      if (error.code === 'permission-denied' && active && retryCount < MAX_LISTENER_RETRIES) {
        retryCount++;
        console.warn(`[CampaignPage] Snapshot permission-denied, retry ${retryCount}/${MAX_LISTENER_RETRIES}...`);
        retryTimer = setTimeout(setupCampaignListener, 2000);
      } else if (error.code === 'permission-denied') {
        console.error('[CampaignPage] Snapshot permission-denied after max retries — giving up.');
      }
    });
    };
    setupCampaignListener();

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
              counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Copywriting',
            } : undefined,
            createdAt: funnelData.createdAt,
            updatedAt: funnelData.updatedAt,
          };

          // CRITICAL: Persist virtual campaign to Firestore so subsequent updates work
          // Without this, the campaign only exists in UI and all update() calls fail
          try {
            const campaignDocData: Record<string, any> = {
              funnelId: virtualCampaign.funnelId,
              brandId: virtualCampaign.brandId,
              userId: virtualCampaign.userId,
              name: virtualCampaign.name,
              status: virtualCampaign.status,
              funnel: virtualCampaign.funnel,
              updatedAt: Timestamp.now(),
            };
            if (virtualCampaign.copywriting) {
              campaignDocData.copywriting = virtualCampaign.copywriting;
            }
            await setDoc(doc(db, 'campaigns', funnelId), campaignDocData, { merge: true });
            console.log('[Campaign] Virtual campaign persisted to Firestore:', funnelId);
          } catch (persistErr) {
            console.warn('[Campaign] Failed to persist virtual campaign:', persistErr);
          }

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
      if (data.offer) completed.push('offer');
      if (data.copywriting) completed.push('copy');
      if (data.social) completed.push('social');
      if (data.design) completed.push('design');
      if (data.ads) completed.push('ads');
      setCompletedStages(completed);

      // Determine current stage (offer is optional — skip if not present)
      if (!data.offer && !data.copywriting) setCurrentStageId('offer');
      else if (!data.copywriting) setCurrentStageId('copy');
      else if (!data.social) setCurrentStageId('social');
      else if (!data.design) setCurrentStageId('design');
      else if (!data.ads) setCurrentStageId('ads');
      else setCurrentStageId('ads');

      setLoading(false);
    }

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (currentUnsub) currentUnsub();
    };
  }, [params.id, user?.uid]);

  const [generatingAds, setGeneratingAds] = useState(false);
  const [generatingBriefing, setGeneratingBriefing] = useState<'pdf' | 'slides' | null>(null);
  const [loadingOffer] = useState(false);

  // K-2.1: Detect campaign complete
  const isCampaignComplete = !!(campaign?.funnel && campaign?.copywriting && campaign?.social && campaign?.design && campaign?.ads);

  // Campaign Briefing (PDF / Slides) — abre HTML numa nova aba
  const downloadBriefing = async (format: 'pdf' | 'slides') => {
    if (!campaign || generatingBriefing) return;
    setGeneratingBriefing(format);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/campaigns/${campaign.id}/generate-briefing`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        toast.error(err.error || 'Falha ao gerar briefing');
        return;
      }

      const { html } = await res.json();

      // Abre o HTML numa nova aba
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(html);
        newTab.document.close();
      } else {
        toast.error('Popup bloqueado pelo navegador. Permita popups para este site.');
      }

      toast.success(format === 'slides' ? 'Apresentação gerada!' : 'Briefing gerado!');
    } catch (err) {
      console.error('[Briefing] Generation failed:', err);
      toast.error('Falha ao gerar briefing. Tente novamente.');
    } finally {
      setGeneratingBriefing(null);
    }
  };

  const handleAction = async (stageId: string) => {
    if (!campaign) return;

    notify.info(`Iniciando ${stageId}`, `O MKTHONEY está sendo convocado...`);

    if (stageId === 'funnel') {
      router.push(`/funnels/${campaign.funnelId}?campaignId=${campaign.id}`);
    } else if (stageId === 'offer') {
      // Navigate to Offer Lab — save API auto-links offer to campaign via campaignId
      router.push(`/intelligence/offer-lab?campaignId=${campaign.id}`);
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
        notify.info('Gerando Estratégia', 'Ads & Tráfego está projetando a escala...');
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
            <Sparkles className="h-12 w-12 text-[#E6B447] opacity-20" />
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
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#E6B447]" />
            <h2 className="text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
              The Golden Thread
            </h2>
          </div>
          <CampaignStepper 
            currentStageId={currentStageId} 
            completedStages={completedStages} 
          />
        </section>

        {/* K-2.2: Campaign Completion Card */}
        <AnimatePresence>
          {isCampaignComplete && (
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="relative overflow-hidden rounded-2xl border border-[#E6B447]/20 bg-gradient-to-br from-[#E6B447]/10 via-[#AB8648]/5 to-zinc-900/50 p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/20">
                    <Trophy className="h-6 w-6 text-[#E6B447]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Campanha Completa!</h2>
                    <p className="text-sm text-zinc-400 mt-1">Todos os 5 stages da Linha de Ouro foram concluídos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Funil</p>
                    <p className="text-xs text-zinc-300 mt-1 truncate">{campaign?.funnel?.type} — {campaign?.funnel?.mainGoal?.slice(0, 30)}</p>
                  </div>
                  {campaign?.offer && (
                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Oferta</p>
                      <p className="text-xs text-zinc-300 mt-1 truncate">{campaign.offer.promise?.slice(0, 40)} — Score {campaign.offer.score}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Copy</p>
                    <p className="text-xs text-zinc-300 mt-1 truncate">{campaign?.copywriting?.bigIdea?.slice(0, 40)}...</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Social</p>
                    <p className="text-xs text-zinc-300 mt-1">{campaign?.social?.hooks?.length || 0} hooks</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Design</p>
                    <p className="text-xs text-zinc-300 mt-1 truncate">{campaign?.design?.visualStyle || 'Definido'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Ads</p>
                    <p className="text-xs text-zinc-300 mt-1 truncate">{campaign?.ads?.channels?.join(', ')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadBriefing('pdf')}
                    disabled={generatingBriefing !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-[#AB8648] hover:bg-[#E6B447] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {generatingBriefing === 'pdf' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {generatingBriefing === 'pdf' ? 'Gerando...' : 'Gerar Briefing PDF'}
                  </button>
                  <button
                    onClick={() => downloadBriefing('slides')}
                    disabled={generatingBriefing !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    {generatingBriefing === 'slides' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Presentation className="h-4 w-4" />
                    )}
                    {generatingBriefing === 'slides' ? 'Gerando...' : 'Gerar Apresentação'}
                  </button>
                </div>

                {generatingBriefing && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Gerando briefing estratégico com IA... isso pode levar até 1 minuto.
                  </p>
                )}

                {/* K-2.4: Next Steps */}
                <div className="mt-6 pt-6 border-t border-zinc-800/50">
                  <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                    Próximos Passos
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Configurar pixel de rastreamento', href: '/settings' },
                      { label: 'Criar anúncios nas plataformas', href: null },
                      { label: 'Agendar conteúdo social no Calendário', href: '/content/calendar' },
                      { label: 'Monitorar métricas no Dashboard', href: '/intelligence' },
                      { label: 'Configurar automações de otimização', href: '/automation' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-zinc-500">{i + 1}</span>
                        </div>
                        {step.href ? (
                          <a href={step.href} className="text-zinc-400 hover:text-[#E6B447] transition-colors flex items-center gap-1">
                            {step.label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-400">{step.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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
            title="A Oferta"
            description="Engenharia de Oferta Irresistível"
            icon={Sparkles}
            status={campaign.offer ? 'approved' : campaign.funnel ? 'ready' : 'empty'}
            summary={campaign.offer ? [
              `Promessa: ${campaign.offer.promise?.slice(0, 50)}...`,
              `Score: ${campaign.offer.score}/100`,
            ] : []}
            onAction={() => handleAction('offer')}
            actionLabel={campaign.offer ? "Ver Oferta" : loadingOffer ? "Vinculando..." : "Vincular Oferta"}
            isActive={currentStageId === 'offer'}
          />

          <StageCard
            title="A Voz"
            description="Copywriting Persuasivo"
            icon={PenTool}
            status={campaign.copywriting ? 'approved' : campaign.funnel ? 'empty' : 'empty'}
            summary={campaign.copywriting ? [
              `Big Idea: ${campaign.copywriting.bigIdea.slice(0, 60)}...`,
              `Tom: ${campaign.copywriting.tone}`,
              `Base: ${campaign.copywriting.counselor_reference || 'MKTHONEY'}`
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
            description="Ads & Tráfego"
            icon={BarChart3}
            status={campaign.ads ? 'approved' : generatingAds ? 'generating' : campaign.design ? 'ready' : 'empty'}
            summary={campaign.ads ? [
              `Canais: ${campaign.ads.channels?.join(', ') || 'A definir'}`,
              `Budget Sugerido: ${campaign.ads.suggestedBudget || 'A definir'}`,
              ...(campaign.ads.audiences?.length ? [`${campaign.ads.audiences.length} audiência(s) segmentada(s)`] : [])
            ] : generatingAds ? [
              'Ads & Tráfego analisando o manifesto...',
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
