'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Palette,
  Layers,
  ChevronRight,
  ChevronLeft,
  Zap,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Settings2,
  CheckCircle2,
  MessageSquare,
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
import { InspirationUploader } from '@/components/design/inspiration-uploader';
import { PieceRoleBadge } from '@/components/design/piece-role-badge';
import type { Funnel } from '@/types/database';
import type { DesignAnalysis, BrandCharacter, InspirationRef } from '@/types/design-system';

// ── Constants ────────────────────────────────────────────────────────

const VISUAL_STYLES = [
  { id: 'photography', label: 'Fotografia', desc: 'Realista, editorial, lifestyle', gradient: 'from-amber-900/40 to-stone-900/40', icon: '📷' },
  { id: 'minimal', label: 'Minimalista', desc: 'Clean, espaço negativo, tipografia', gradient: 'from-zinc-800/40 to-white/5', icon: '◻️' },
  { id: 'bold', label: 'Bold/Impactante', desc: 'Cores fortes, contraste, tipo grande', gradient: 'from-red-900/40 to-yellow-900/40', icon: '⚡' },
  { id: 'illustration', label: 'Ilustração', desc: 'Flat, vetorial, cartoon', gradient: 'from-blue-900/40 to-purple-900/40', icon: '🎨' },
  { id: '3d-render', label: '3D Render', desc: 'Objetos 3D, gradientes, futurista', gradient: 'from-cyan-900/40 to-indigo-900/40', icon: '🧊' },
  { id: 'collage', label: 'Colagem', desc: 'Mix de fotos, texturas, layers', gradient: 'from-orange-900/40 to-rose-900/40', icon: '🗂️' },
  { id: 'cinematic', label: 'Cinemático', desc: 'Luz dramática, moody, grain', gradient: 'from-slate-900/40 to-amber-900/20', icon: '🎬' },
  { id: 'neon', label: 'Neon/Cyber', desc: 'Neon, escuro, vibrante', gradient: 'from-fuchsia-900/40 to-cyan-900/40', icon: '💜' },
] as const;

const BRAND_REFERENCES = [
  { id: 'apple', label: 'Estilo Apple', desc: 'Clean, produto isolado, fundo limpo, tipografia fina', gradient: 'from-gray-800/40 to-gray-600/20', icon: '🍎' },
  { id: 'nike', label: 'Estilo Nike', desc: 'Contraste alto, P&B, atleta em ação, tipografia bold', gradient: 'from-black/60 to-red-900/20', icon: '✔️' },
  { id: 'nubank', label: 'Estilo Nubank', desc: 'Roxo, flat, ilustrações geométricas, friendly', gradient: 'from-purple-900/40 to-purple-700/20', icon: '💜' },
  { id: 'luxury', label: 'Luxury/Premium', desc: 'Dourado, serif, textura, minimalismo premium', gradient: 'from-yellow-900/40 to-amber-800/20', icon: '👑' },
  { id: 'fitness', label: 'Fitness Agressivo', desc: 'Vermelho/preto, ângulos, urgência, antes/depois', gradient: 'from-red-900/40 to-black/40', icon: '💪' },
  { id: 'tech-saas', label: 'Tech/SaaS', desc: 'Gradientes modernos, glassmorphism, dashboards', gradient: 'from-blue-900/40 to-violet-900/40', icon: '💻' },
  { id: 'organic', label: 'Orgânico/Natural', desc: 'Tons terra, texturas naturais, handwritten', gradient: 'from-green-900/40 to-amber-900/20', icon: '🌿' },
] as const;

const OUTPUT_FORMATS = [
  { id: 'feed-square', label: 'Feed Quadrado', ratio: '1:1', platform: 'Instagram/Facebook' },
  { id: 'stories', label: 'Stories/Reels', ratio: '9:16', platform: 'Instagram/TikTok' },
  { id: 'carousel', label: 'Carrossel', ratio: '4:5', platform: 'Instagram', multi: true },
  { id: 'feed-portrait', label: 'Feed Retrato', ratio: '4:5', platform: 'Instagram/Facebook' },
  { id: 'wide', label: 'Wide/Banner', ratio: '16:9', platform: 'YouTube/LinkedIn' },
  { id: 'pinterest', label: 'Pinterest', ratio: '3:4', platform: 'Pinterest' },
] as const;

type WizardStep = 'analysis' | 'inputs' | 'planning' | 'generation';

const STEPS: { key: WizardStep; label: string; icon: typeof Eye }[] = [
  { key: 'analysis', label: 'Análise', icon: Eye },
  { key: 'inputs', label: 'Inputs', icon: Settings2 },
  { key: 'planning', label: 'Planejamento', icon: Layers },
  { key: 'generation', label: 'Geração', icon: ImageIcon },
];

// ── Props ────────────────────────────────────────────────────────────

interface DesignWizardProps {
  campaignId: string;
}

// ── Component ────────────────────────────────────────────────────────

export function DesignWizard({ campaignId }: DesignWizardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();

  // Data state
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [brand, setBrand] = useState<any | null>(null);
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('analysis');

  // Step 1: Analysis
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisApproved, setAnalysisApproved] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState<string>('');

  // Step 2: Inputs
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [inspirations, setInspirations] = useState<InspirationRef[]>([]);
  const [campaignSystemEnabled, setCampaignSystemEnabled] = useState(true);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBrandRefs, setSelectedBrandRefs] = useState<string[]>([]);
  const [freeStyleText, setFreeStyleText] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['feed-square']);
  const [selectedHookIndices, setSelectedHookIndices] = useState<number[]>([]);
  const [customPalette, setCustomPalette] = useState<string[]>([]);
  const [paletteOverride, setPaletteOverride] = useState(false);

  // Step 3: Planning/Generation
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const brandId = funnel?.brandId || selectedBrand?.id || '';

  // ── Data Loading ──────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      if (!campaignId) return;
      try {
        // Load campaign
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
        let campaignData: any = campaignDoc.exists() ? { id: campaignDoc.id, ...campaignDoc.data() } : null;
        if (!campaignData) {
          setIsLoading(false);
          return;
        }

        const resolvedFunnelId = campaignData.funnelId || campaignId;
        setFunnelId(resolvedFunnelId);

        // Load funnel
        const funnelDoc = await getDoc(doc(db, 'funnels', resolvedFunnelId));
        if (funnelDoc.exists()) {
          setFunnel({ id: funnelDoc.id, ...funnelDoc.data() } as Funnel);
        }

        // Load brand
        const resolvedBrandId = funnelDoc.data()?.brandId || campaignData.brandId || selectedBrand?.id;
        if (resolvedBrandId) {
          const brandDoc = await getDoc(doc(db, 'brands', resolvedBrandId));
          if (brandDoc.exists()) {
            setBrand({ id: brandDoc.id, ...brandDoc.data() });
          }
        }

        // Context guard: brand mismatch
        const funnelBrandId = funnelDoc.exists() ? funnelDoc.data()?.brandId : null;
        if (campaignData && campaignData.brandId && funnelBrandId && campaignData.brandId !== funnelBrandId) {
          campaignData = { ...campaignData, design: undefined };
        }

        // Copy fallback: load from copyProposals subcollection
        if (!campaignData.copywriting) {
          const copyRef = collection(db, 'funnels', resolvedFunnelId, 'copyProposals');
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
              },
            };
          }
        }

        setCampaign(campaignData);

        // Restore existing analysis
        if (campaignData?.design?.analysis) {
          setAnalysis(campaignData.design.analysis);
          setAnalysisApproved(true);
        }

        // Restore existing prompts
        const existingPrompts = campaignData?.design?.visualPrompts;
        if (Array.isArray(existingPrompts) && existingPrompts.length > 0 && typeof existingPrompts[0] === 'object') {
          setPrompts(existingPrompts);
        }
      } catch (error) {
        console.error('[DesignWizard] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [campaignId, selectedBrand?.id]);

  // Auto-analyze on load
  useEffect(() => {
    if (!isLoading && campaign?.copywriting && !analysis && !isAnalyzing) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, campaign]);

  // ── Hooks helpers ─────────────────────────────────────────────────

  const allHooks: { content: string; index: number }[] = (campaign?.social?.hooks || []).map((h: any, i: number) => ({
    content: typeof h === 'string' ? h : h.content || h.text || '',
    index: i,
  }));

  const getSelectedCopy = useCallback(() => {
    if (selectedHookIndices.length > 0 && allHooks.length > 0) {
      return selectedHookIndices.map(i => allHooks[i]?.content).filter(Boolean).join('\n\n---\n\n');
    }
    return campaign?.copywriting?.mainScript || campaign?.copywriting?.bigIdea || allHooks[0]?.content || '';
  }, [selectedHookIndices, allHooks, campaign]);

  const getSelectedFormatDetails = useCallback(() => {
    return selectedFormats.map(fId => OUTPUT_FORMATS.find(f => f.id === fId)).filter(Boolean);
  }, [selectedFormats]);

  // ── Step 1: Analyze ───────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!campaign?.copywriting && !campaign?.social) return;
    setIsAnalyzing(true);
    setAnalysisApproved(false);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: funnelId || campaignId,
          campaignId,
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
    } catch {
      notify.error('Erro', 'Falha ao conectar com o Diretor de Arte');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Step 3: Plan ──────────────────────────────────────────────────

  const handlePlan = async () => {
    if (!campaign?.copywriting && !campaign?.social) {
      notify.error('Erro', 'Copywriting pendente.');
      return;
    }
    setIsPlanning(true);
    try {
      const headers = await getAuthHeaders();
      const formatDetails = getSelectedFormatDetails();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: funnelId || campaignId,
          campaignId,
          userId: user?.uid,
          brandId,
          campaignSystemEnabled,
          selectedCharacterIds,
          inspirationRefs: inspirations,
          analysis,
          selectedApproach: selectedApproach || undefined,
          selectedStyles,
          selectedBrandRefs,
          freeStyleText: freeStyleText.trim() || undefined,
          selectedFormats: formatDetails.length > 0
            ? formatDetails.map(f => ({
                id: f!.id,
                label: f!.label,
                ratio: f!.ratio,
                platform: f!.platform,
                multi: 'multi' in f! ? f!.multi : false,
              }))
            : undefined,
          customPalette: paletteOverride ? customPalette : [],
          context: {
            objective: funnel?.context?.objective || '',
            copy: getSelectedCopy(),
            hooks: selectedHookIndices.length > 0
              ? selectedHookIndices.map(i => allHooks[i]).filter(Boolean)
              : (campaign.social?.hooks || []),
          },
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
    } catch {
      notify.error('Erro', 'Falha ao planejar visuais');
    } finally {
      setIsPlanning(false);
    }
  };

  // Quick generate (skip wizard inputs)
  const handleQuickGenerate = async () => {
    if (!campaign?.copywriting && !campaign?.social) {
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
          funnelId: funnelId || campaignId,
          userId: user?.uid,
          brandId,
          context: {
            objective: funnel?.context?.objective || '',
            copy: campaign.copywriting?.mainScript || '',
            hooks: campaign.social?.hooks || [],
          },
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
    } catch {
      notify.error('Erro', 'Falha ao gerar');
    } finally {
      setIsPlanning(false);
    }
  };

  // ── Step 4: Approve ───────────────────────────────────────────────

  const handleApproveDesign = async () => {
    if (!campaignId || prompts.length === 0) return;
    setIsLoading(true);
    try {
      await updateCampaignManifesto(campaignId, {
        design: {
          visualStyle: 'Modern Premium',
          preferredColors: brand?.brandKit?.colors
            ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary].filter(Boolean)
            : ['#E6B447', '#000000'],
          visualPrompts: prompts,
          aspectRatios: prompts.map((p: any) => p.aspectRatio || '1:1'),
          analysis: analysis || undefined,
          campaignSystem: campaignSystemEnabled
            ? {
                enabled: true,
                pieces: prompts.map((p: any, i: number) => ({ role: p.pieceRole || 'standalone', promptIndex: i })),
              }
            : undefined,
          inspirationRefs: inspirations.length > 0 ? inspirations : [],
          selectedCharacterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : [],
        },
      });
      notify.success('Sistema Visual Aprovado!');
      router.push(`/campaigns/${campaignId}`);
    } catch {
      notify.error('Erro', 'Falha ao salvar estratégia visual');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────

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
    brandColors: brand?.brandKit?.colors
      ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.accent].filter(Boolean)
      : [],
  };

  // ── Loading ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <Link
        href={`/campaigns/${campaignId}`}
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
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
          <p className="text-zinc-500">Sistema visual inteligente para sua campanha</p>
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
              <AnalysisResult
                analysis={analysis}
                selectedApproach={selectedApproach}
                onApproachSelect={setSelectedApproach}
              />
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
                  {isPlanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Gerar Rápido (2 peças)
                  <span className="ml-1.5 text-[10px] text-zinc-600">(2 créditos)</span>
                </Button>
              </div>
            </>
          )}

          {!isAnalyzing && !analysis && !campaign?.copywriting && (
            <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center">
              <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Copywriting Pendente</h3>
              <p className="text-sm text-zinc-500">
                O Diretor de Arte precisa da copy aprovada para iniciar a análise.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== STEP 2: Creative Inputs ==================== */}
      {currentStep === 'inputs' && (
        <div className="space-y-8">
          {/* 1. Social Post Selector */}
          {allHooks.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#E6B447]" />
                Selecione os posts para criar design
              </p>
              <div className="grid gap-2">
                {allHooks.map((hook, i) => {
                  const isSelected = selectedHookIndices.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        setSelectedHookIndices(
                          isSelected ? selectedHookIndices.filter(idx => idx !== i) : [...selectedHookIndices, i]
                        )
                      }
                      className={cn(
                        'w-full p-3 rounded-xl border text-left transition-all',
                        isSelected ? 'border-[#E6B447]/50 bg-[#E6B447]/5' : 'border-white/[0.05] bg-black/30 hover:border-white/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5',
                            isSelected ? 'border-[#E6B447] bg-[#E6B447]' : 'border-zinc-600'
                          )}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">Post #{i + 1}</p>
                          <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 mt-0.5">{hook.content}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedHookIndices.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic">Nenhum selecionado = usa toda a copy disponível</p>
              )}
            </div>
          )}

          {/* 2. Format Selector */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#E6B447]" />
              Formatos de saída
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OUTPUT_FORMATS.map(fmt => {
                const isSelected = selectedFormats.includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    onClick={() =>
                      setSelectedFormats(isSelected ? selectedFormats.filter(f => f !== fmt.id) : [...selectedFormats, fmt.id])
                    }
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      isSelected ? 'border-[#E6B447]/50 bg-[#E6B447]/5' : 'border-white/[0.05] bg-black/30 hover:border-white/10'
                    )}
                  >
                    <p className="text-[11px] font-bold text-white">{fmt.label}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">
                      {fmt.ratio} · {fmt.platform}
                    </p>
                    {'multi' in fmt && fmt.multi && (
                      <span className="inline-block mt-1 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Multi-slide
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedFormats.length === 0 && <p className="text-[10px] text-red-400">Selecione pelo menos um formato</p>}
          </div>

          {/* 3. Style Selector */}
          <div className="space-y-5">
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#E6B447]" />
              Estilo visual
            </p>

            {/* General Styles */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase text-zinc-600 tracking-wider">Estilos gerais</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VISUAL_STYLES.map(style => {
                  const isSelected = selectedStyles.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      onClick={() =>
                        setSelectedStyles(isSelected ? selectedStyles.filter(s => s !== style.id) : [...selectedStyles, style.id])
                      }
                      className={cn(
                        'relative p-3 rounded-xl border text-left transition-all overflow-hidden',
                        isSelected ? 'border-[#E6B447]/50 shadow-[0_0_12px_rgba(230,180,71,0.15)]' : 'border-white/[0.05] hover:border-white/10'
                      )}
                    >
                      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', style.gradient)} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{style.icon}</span>
                          <p className="text-[11px] font-bold text-white">{style.label}</p>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-snug">{style.desc}</p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#E6B447] flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand References */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase text-zinc-600 tracking-wider">Referências de marca</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BRAND_REFERENCES.map(ref => {
                  const isSelected = selectedBrandRefs.includes(ref.id);
                  return (
                    <button
                      key={ref.id}
                      onClick={() =>
                        setSelectedBrandRefs(
                          isSelected ? selectedBrandRefs.filter(r => r !== ref.id) : [...selectedBrandRefs, ref.id]
                        )
                      }
                      className={cn(
                        'relative p-3 rounded-xl border text-left transition-all overflow-hidden',
                        isSelected ? 'border-[#E6B447]/50 shadow-[0_0_12px_rgba(230,180,71,0.15)]' : 'border-white/[0.05] hover:border-white/10'
                      )}
                    >
                      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', ref.gradient)} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{ref.icon}</span>
                          <p className="text-[11px] font-bold text-white">{ref.label}</p>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-snug">{ref.desc}</p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#E6B447] flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free-text style */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase text-zinc-600 tracking-wider">Descreva seu estilo (opcional)</p>
              <textarea
                value={freeStyleText}
                onChange={e => setFreeStyleText(e.target.value)}
                placeholder="Ex: Quero algo parecido com os anúncios da Empiricus, fundo escuro, números grandes, sensação de urgência..."
                rows={3}
                className="w-full rounded-xl border border-white/[0.05] bg-black/30 p-3 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:border-[#E6B447]/30 focus:outline-none focus:ring-1 focus:ring-[#E6B447]/20 resize-none"
              />
            </div>

            {/* Selection Summary */}
            {(selectedStyles.length > 0 || selectedBrandRefs.length > 0 || freeStyleText.trim()) && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-[#E6B447]/5 border border-[#E6B447]/10">
                <span className="text-[9px] text-zinc-500 font-bold uppercase self-center mr-1">Mix:</span>
                {selectedStyles.map(id => {
                  const style = VISUAL_STYLES.find(s => s.id === id);
                  return style ? (
                    <span key={id} className="text-[9px] px-2 py-0.5 rounded-full bg-[#E6B447]/15 text-[#E6B447] font-medium">
                      {style.icon} {style.label}
                    </span>
                  ) : null;
                })}
                {selectedBrandRefs.map(id => {
                  const ref = BRAND_REFERENCES.find(r => r.id === id);
                  return ref ? (
                    <span key={id} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
                      {ref.icon} {ref.label}
                    </span>
                  ) : null;
                })}
                {freeStyleText.trim() && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-medium truncate max-w-[200px]">
                    ✏️ {freeStyleText.trim().slice(0, 40)}...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. Color Palette */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-[#E6B447]" />
                Paleta de cores
              </p>
              <button
                onClick={() => {
                  setPaletteOverride(!paletteOverride);
                  if (!paletteOverride && customPalette.length === 0) {
                    const brandColors = brand?.brandKit?.colors
                      ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.accent].filter(Boolean)
                      : ['#E6B447', '#000000', '#FFFFFF'];
                    setCustomPalette(brandColors);
                  }
                }}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-md border transition-all',
                  paletteOverride ? 'border-[#E6B447]/50 bg-[#E6B447]/10 text-[#E6B447]' : 'border-zinc-700 text-zinc-500 hover:text-white'
                )}
              >
                {paletteOverride ? 'Personalizada' : 'Usar da marca'}
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-black/30">
              {(paletteOverride
                ? customPalette
                : brand?.brandKit?.colors
                  ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.accent].filter(Boolean)
                  : ['#E6B447', '#000000']
              ).map((color: string, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  {paletteOverride ? (
                    <label className="cursor-pointer">
                      <input
                        type="color"
                        value={color}
                        onChange={e => {
                          const updated = [...customPalette];
                          updated[i] = e.target.value;
                          setCustomPalette(updated);
                        }}
                        className="sr-only"
                      />
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-[#E6B447] transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                  )}
                  <span className="text-[8px] text-zinc-600 font-mono">{color}</span>
                </div>
              ))}
              {paletteOverride && customPalette.length < 5 && (
                <button
                  onClick={() => setCustomPalette([...customPalette, '#888888'])}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-[#E6B447] transition-colors"
                >
                  <span className="text-zinc-500 text-lg leading-none">+</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Inspiration References */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3 text-[#E6B447]" />
              Referências de inspiração
            </p>
            <InspirationUploader brandId={brandId} inspirations={inspirations} onUpdate={setInspirations} maxItems={5} />
          </div>

          {/* 6. Characters */}
          <CharacterSelector characters={characters} selected={selectedCharacterIds} onSelectionChange={setSelectedCharacterIds} />

          {/* 7. Campaign System */}
          <CampaignSystemView
            pieces={
              analysis?.recommendedPieces?.map(p => ({
                role: p.role,
                platform: p.platform,
                format: p.format,
                aspectRatio: p.aspectRatio,
                rationale: p.rationale,
              })) || []
            }
            enabled={campaignSystemEnabled}
            onToggle={setCampaignSystemEnabled}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
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
              disabled={isPlanning || selectedFormats.length === 0}
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
              <p className="text-xs text-zinc-500 mt-1">Criando prompts estratégicos de direção de arte</p>
            </div>
          )}

          {!isPlanning && prompts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#E6B447]" />
                  Criativos Planejados
                </h2>
                <Button variant="ghost" onClick={handlePlan} disabled={isPlanning} className="text-zinc-500 hover:text-white">
                  <RefreshCw className={cn('h-4 w-4 mr-2', isPlanning && 'animate-spin')} />
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
                      <p className="text-sm text-white font-bold leading-snug">&quot;{prompt.assets.headline}&quot;</p>
                    )}
                    {prompt.strategy?.unityTheme && <p className="text-[10px] text-zinc-400">{prompt.strategy.unityTheme}</p>}
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
                <Button onClick={() => setCurrentStep('generation')} className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold">
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
              <Button onClick={handlePlan} disabled={isPlanning} className="bg-[#E6B447] hover:bg-[#F0C35C] h-12 px-8 font-bold">
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
              <Button variant="ghost" onClick={() => setCurrentStep('planning')} className="text-zinc-500 hover:text-white">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar ao Plano
              </Button>
              <Button variant="ghost" onClick={handleQuickGenerate} disabled={isPlanning} className="text-zinc-500 hover:text-white">
                <RefreshCw className={cn('h-4 w-4 mr-2', isPlanning && 'animate-spin')} />
                Recriar
                <span className="ml-1.5 text-[10px] text-zinc-600">(2 créd)</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {prompts.map((prompt, i) => (
              <div key={i} className="space-y-2">
                {prompt.pieceRole && <PieceRoleBadge role={prompt.pieceRole} size="md" />}
                <DesignGenerationCard
                  promptData={prompt}
                  conversationId={funnelId || campaignId}
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
  );
}
