'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  ChevronLeft,
  Zap,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Settings2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import { DesignGenerationCard } from '@/components/chat/design-generation-card';
import { ContextReviewPanel } from '@/components/design/context-review-panel';
import { AnalysisResult } from '@/components/design/analysis-result';
import { CharacterSelector } from '@/components/design/character-selector';
import { CampaignSystemView } from '@/components/design/campaign-system-view';
import { PieceRoleBadge } from '@/components/design/piece-role-badge';
import type { Funnel } from '@/types/database';
import type { DesignAnalysis, BrandCharacter, InspirationRef } from '@/types/design-system';

type WizardStep = 'analysis' | 'inputs' | 'planning' | 'generation';

const STEPS: { key: WizardStep; label: string; icon: typeof Eye }[] = [
  { key: 'analysis', label: 'Análise', icon: Eye },
  { key: 'inputs', label: 'Inputs', icon: Settings2 },
  { key: 'planning', label: 'Planejamento', icon: Layers },
  { key: 'generation', label: 'Geração', icon: ImageIcon },
];

export default function DesignCouncilPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();

  const funnelId = params.id as string;
  const _rawCampaignId = searchParams.get('campaignId');
  const campaignId = _rawCampaignId && _rawCampaignId !== 'undefined' && _rawCampaignId !== 'null' ? _rawCampaignId : null;

  // Data state
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [brand, setBrand] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('analysis');

  // Step 1: Analysis
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisApproved, setAnalysisApproved] = useState(false);

  // Step 2: Inputs
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [inspirations, setInspirations] = useState<InspirationRef[]>([]);
  const [campaignSystemEnabled, setCampaignSystemEnabled] = useState(true);

  // Step 3: Planning
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!funnelId) return;
      try {
        const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
        if (funnelDoc.exists()) {
          setFunnel({ id: funnelDoc.id, ...funnelDoc.data() } as Funnel);
        }

        // Load brand
        const brandId = funnelDoc.data()?.brandId || selectedBrand?.id;
        if (brandId) {
          const brandDoc = await getDoc(doc(db, 'brands', brandId));
          if (brandDoc.exists()) {
            setBrand({ id: brandDoc.id, ...brandDoc.data() });
          }
        }

        const docId = campaignId || funnelId;
        const campaignDoc = await getDoc(doc(db, 'campaigns', docId));
        let campaignData = campaignDoc.exists() ? campaignDoc.data() : null;

        // Context Guard
        const funnelBrandId = funnelDoc.exists() ? funnelDoc.data()?.brandId : null;
        if (campaignData && campaignData.brandId && funnelBrandId && campaignData.brandId !== funnelBrandId) {
          campaignData = { ...campaignData, design: undefined };
        }

        // Copy fallback scanner
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
                keyBenefits: approvedCopy.content?.structure?.bullets || [],
                counselor_reference: approvedCopy.copywriterInsights?.[0]?.copywriterName || 'Copywriting',
              }
            };
          }
        }

        setCampaign(campaignData);

        // If there's an existing analysis, restore it
        if (campaignData?.design?.analysis) {
          setAnalysis(campaignData.design.analysis);
          setAnalysisApproved(true);
        }
        // If there's existing prompts, restore them
        if (campaignData?.design?.visualPrompts && Array.isArray(campaignData.design.visualPrompts) && campaignData.design.visualPrompts.length > 0) {
          const existingPrompts = campaignData.design.visualPrompts;
          if (typeof existingPrompts[0] === 'object') {
            setPrompts(existingPrompts);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [funnelId, campaignId, selectedBrand?.id]);

  // Auto-analyze on load
  useEffect(() => {
    if (!isLoading && campaign?.copywriting && !analysis && !isAnalyzing) {
      handleAnalyze();
    }
  }, [isLoading, campaign]);

  const brandId = funnel?.brandId || selectedBrand?.id || '';

  // Step 1: Analyze
  const handleAnalyze = async () => {
    if (!funnel || !campaign?.copywriting) return;
    setIsAnalyzing(true);
    setAnalysisApproved(false);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          campaignId: campaignId || funnelId,
          brandId,
          userId: user?.uid,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAnalysis(data.data);
      } else {
        notify.error('Erro na análise', data.error || 'Falha ao analisar contexto');
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao conectar com o Diretor de Arte');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3: Plan
  const handlePlan = async () => {
    if (!funnel || !campaign?.copywriting) {
      notify.error('Erro', 'Copywriting pendente.');
      return;
    }
    setIsPlanning(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          userId: user?.uid,
          brandId,
          campaignSystemEnabled,
          selectedCharacterIds,
          inspirationRefs: inspirations,
          analysis,
          context: {
            objective: funnel.context?.objective || '',
            copy: campaign.copywriting.mainScript || '',
            hooks: campaign.social?.hooks || [],
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data?.prompts ?? data.prompts ?? []);
        notify.success('Planejamento visual concluído!');
        setCurrentStep('generation');
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao planejar visuais');
    } finally {
      setIsPlanning(false);
    }
  };

  // Legacy plan (quick generate without wizard)
  const handleQuickGenerate = async () => {
    if (!funnel || !campaign?.copywriting) {
      notify.error('Erro', 'Copywriting pendente.');
      return;
    }
    setIsPlanning(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          userId: user?.uid,
          brandId,
          context: {
            objective: funnel.context?.objective || '',
            copy: campaign.copywriting.mainScript || '',
            hooks: campaign.social?.hooks || [],
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data?.prompts ?? data.prompts ?? []);
        setCurrentStep('generation');
        notify.success('Estratégia visual gerada!');
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao convocar Design');
    } finally {
      setIsPlanning(false);
    }
  };

  // Step 4: Approve
  const handleApproveDesign = async () => {
    if (!funnelId || prompts.length === 0) return;
    setIsLoading(true);
    try {
      const docId = campaignId || funnelId;
      await updateCampaignManifesto(docId, {
        design: {
          visualStyle: 'Modern Premium',
          preferredColors: brand?.brandKit?.colors ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary].filter(Boolean) : ['#E6B447', '#000000'],
          visualPrompts: prompts,
          aspectRatios: prompts.map((p: any) => p.aspectRatio || '1:1'),
          analysis: analysis || undefined,
          campaignSystem: campaignSystemEnabled ? {
            enabled: true,
            pieces: prompts.map((p: any, i: number) => ({ role: p.pieceRole || 'standalone', promptIndex: i })),
          } : undefined,
          inspirationRefs: inspirations.length > 0 ? inspirations : undefined,
          selectedCharacterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
        }
      });
      notify.success('Sistema Visual Aprovado!');
      router.push(`/campaigns/${docId}`);
    } catch (error) {
      notify.error('Erro', 'Falha ao salvar estratégia visual');
    } finally {
      setIsLoading(false);
    }
  };

  const characters: BrandCharacter[] = brand?.brandKit?.characters || [];
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const contextData = {
    objective: funnel?.context?.objective,
    targetAudience: funnel?.context?.audience?.who,
    bigIdea: campaign?.copywriting?.bigIdea,
    tone: campaign?.copywriting?.tone,
    hooks: (campaign?.social?.hooks || []).map((h: any) => typeof h === 'string' ? h : h.content || ''),
    mainScript: campaign?.copywriting?.mainScript,
    visualStyle: brand?.brandKit?.visualStyle,
    awareness: funnel?.context?.audience?.awareness,
    brandColors: brand?.brandKit?.colors ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.accent].filter(Boolean) : [],
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0D0B09]">
        <Header title="Design" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      <Header title="Design Intelligence" showBack />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Link href={`/campaigns/${campaignId || funnelId}`} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Comando
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-[#E6B447]/10 text-[#E6B447]">
            <Palette className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Design Director</h1>
            <p className="text-zinc-500">Sistema visual inteligente com C.H.A.P.E.U</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-8 p-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isPast = i < currentStepIndex;
            return (
              <button
                key={step.key}
                onClick={() => {
                  if (isPast || isActive) setCurrentStep(step.key);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                  isActive && 'bg-[#E6B447]/10 text-[#E6B447] border border-[#E6B447]/20',
                  isPast && !isActive && 'text-zinc-400 hover:text-white hover:bg-white/[0.03] cursor-pointer',
                  !isActive && !isPast && 'text-zinc-600 cursor-default'
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== STEP 1: Analysis ==================== */}
        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <ContextReviewPanel context={contextData} />

            {isAnalyzing && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6B447] mb-4" />
                <p className="text-sm font-bold text-white">O Diretor de Arte está analisando...</p>
                <p className="text-xs text-zinc-500 mt-1">Avaliando contexto, desafios e oportunidades visuais</p>
              </div>
            )}

            {!isAnalyzing && analysis && (
              <>
                <AnalysisResult analysis={analysis} />
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleAnalyze}
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Nova Análise
                  </Button>
                  <Button
                    onClick={() => {
                      setAnalysisApproved(true);
                      setCurrentStep('inputs');
                    }}
                    className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold"
                  >
                    Aprovar Análise
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleQuickGenerate}
                    disabled={isPlanning}
                    className="text-zinc-500 hover:text-white ml-auto"
                  >
                    {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Gerar Rápido (2 peças)
                  </Button>
                </div>
              </>
            )}

            {!isAnalyzing && !analysis && !campaign?.copywriting && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center">
                <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Copywriting Pendente</h3>
                <p className="text-sm text-zinc-500">O Diretor de Arte precisa da copy aprovada para iniciar a análise.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== STEP 2: Creative Inputs ==================== */}
        {currentStep === 'inputs' && (
          <div className="space-y-6">
            {/* Characters */}
            <CharacterSelector
              characters={characters}
              selected={selectedCharacterIds}
              onSelectionChange={setSelectedCharacterIds}
            />

            {/* Inspiration Upload Placeholder — uses InspirationUploader when available */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-[#E6B447]" />
                Referências de Inspiração
              </p>
              {inspirations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {inspirations.map((ref) => (
                    <div key={ref.id} className="relative group rounded-lg overflow-hidden border border-white/[0.05]">
                      <img src={ref.url} alt="Inspiração" className="w-full aspect-square object-cover" />
                      <div className="p-1.5 bg-black/60">
                        <div className="flex flex-wrap gap-0.5">
                          {ref.extractedTraits.slice(0, 3).map((trait, i) => (
                            <span key={i} className="text-[8px] text-[#E6B447] bg-[#E6B447]/10 px-1 py-0.5 rounded">{trait}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setInspirations(inspirations.filter(r => r.id !== ref.id))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-white/10 text-center">
                  <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Arraste imagens de referência ou clique para fazer upload</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Até 5 imagens de inspiração visual</p>
                </div>
              )}
            </div>

            {/* Campaign System Toggle */}
            <CampaignSystemView
              pieces={analysis?.recommendedPieces?.map(p => ({
                role: p.role,
                platform: p.platform,
                format: p.format,
                aspectRatio: p.aspectRatio,
                rationale: p.rationale,
              })) || []}
              enabled={campaignSystemEnabled}
              onToggle={setCampaignSystemEnabled}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('analysis')}
                className="border-zinc-700 text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep('planning');
                  handlePlan();
                }}
                disabled={isPlanning}
                className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold"
              >
                {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
                Planejar Visuais
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: Planning ==================== */}
        {currentStep === 'planning' && (
          <div className="space-y-6">
            {isPlanning && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6B447] mb-4" />
                <p className="text-sm font-bold text-white">Planejando sistema visual...</p>
                <p className="text-xs text-zinc-500 mt-1">Criando prompts estratégicos com C.H.A.P.E.U</p>
              </div>
            )}

            {!isPlanning && prompts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#E6B447]" />
                    Criativos Planejados
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={handlePlan}
                    disabled={isPlanning}
                    className="text-zinc-500 hover:text-white"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isPlanning && "animate-spin")} />
                    Replanejar
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {prompts.map((prompt, i) => (
                    <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/[0.05] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {prompt.pieceRole && <PieceRoleBadge role={prompt.pieceRole} />}
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">
                            {prompt.platform} · {prompt.safeZone} · {prompt.aspectRatio}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-600">#{i + 1}</span>
                      </div>
                      {prompt.assets?.headline && (
                        <p className="text-sm text-white font-bold leading-snug">"{prompt.assets.headline}"</p>
                      )}
                      {prompt.strategy?.unityTheme && (
                        <p className="text-[10px] text-zinc-400">{prompt.strategy.unityTheme}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('inputs')}
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('generation')}
                    className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Gerar Imagens
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {!isPlanning && prompts.length === 0 && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center">
                <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">Nenhum plano gerado</h3>
                <Button
                  onClick={handlePlan}
                  disabled={isPlanning}
                  className="bg-[#E6B447] hover:bg-[#F0C35C] h-12 px-8 font-bold"
                >
                  <Palette className="mr-2 h-5 w-5" />
                  Planejar Ativos Visuais
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ==================== STEP 4: Generation ==================== */}
        {currentStep === 'generation' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#E6B447]" />
                Criativos NanoBanana
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('planning')}
                  className="text-zinc-500 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar ao Plano
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleQuickGenerate}
                  disabled={isPlanning}
                  className="text-zinc-500 hover:text-white"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isPlanning && "animate-spin")} />
                  Recriar
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {prompts.map((prompt, i) => (
                <div key={i} className="space-y-2">
                  {prompt.pieceRole && (
                    <PieceRoleBadge role={prompt.pieceRole} size="md" />
                  )}
                  <DesignGenerationCard
                    promptData={prompt}
                    conversationId={funnelId}
                    campaignId={campaignId}
                  />
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/[0.05] flex justify-end">
              <Button
                onClick={handleApproveDesign}
                className="bg-[#E6B447] hover:bg-[#F0C35C] h-12 px-12 text-lg font-bold shadow-[0_0_30px_rgba(230,180,71,0.3)]"
              >
                Aprovar Sistema Visual
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
