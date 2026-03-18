'use client';

import { useState, useEffect } from 'react';
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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Sparkles,
  Palette,
  Layers,
  Target,
  ChevronRight,
  ChevronLeft,
  Zap,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Settings2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
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
import type { DesignAnalysis, BrandCharacter, InspirationRef } from '@/types/design-system';

type WizardStep = 'select' | 'analysis' | 'inputs' | 'planning' | 'generation';

export default function DesignStudioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedBrand } = useBrandStore();

  // Campaign selection
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState<any | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);

  // Brand data
  const [brand, setBrand] = useState<any | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');

  // Step: Analysis
  const [analysis, setAnalysis] = useState<DesignAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Step: Inputs
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [inspirations, setInspirations] = useState<InspirationRef[]>([]);
  const [campaignSystemEnabled, setCampaignSystemEnabled] = useState(true);

  // Step: Planning/Generation
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const brandId = selectedBrand?.id || '';

  // Load campaigns with copywriting ready
  useEffect(() => {
    async function loadCampaigns() {
      if (!user?.uid || !brandId) {
        setIsLoadingCampaigns(false);
        return;
      }
      try {
        // Simple query without orderBy to avoid composite index requirement
        const q = query(
          collection(db, 'campaigns'),
          where('userId', '==', user.uid),
          where('brandId', '==', brandId),
          limit(50)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter((c: any) => c.copywriting || c.social)
          .sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
          .slice(0, 20);
        setCampaigns(items);
      } catch (err) {
        console.error('[DesignStudio] Error loading campaigns:', err);
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, [user?.uid, brandId]);

  // Load brand data
  useEffect(() => {
    async function loadBrand() {
      if (!brandId) return;
      try {
        const brandDoc = await getDoc(doc(db, 'brands', brandId));
        if (brandDoc.exists()) {
          setBrand({ id: brandDoc.id, ...brandDoc.data() });
        }
      } catch (err) {
        console.error('[DesignStudio] Error loading brand:', err);
      }
    }
    loadBrand();
  }, [brandId]);

  // Select campaign and load funnel
  const handleSelectCampaign = async (campaign: any) => {
    setSelectedCampaign(campaign);
    // Load funnel
    if (campaign.funnelId) {
      try {
        const funnelDoc = await getDoc(doc(db, 'funnels', campaign.funnelId));
        if (funnelDoc.exists()) {
          setSelectedFunnel({ id: funnelDoc.id, ...funnelDoc.data() });
        }
      } catch (err) {
        console.error('[DesignStudio] Error loading funnel:', err);
      }
    }
    setCurrentStep('analysis');
    // Auto-analyze
    handleAnalyze(campaign);
  };

  // Analyze
  const handleAnalyze = async (campaign?: any) => {
    const camp = campaign || selectedCampaign;
    if (!camp?.copywriting && !camp?.social) return;
    setIsAnalyzing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: camp.funnelId || camp.id,
          campaignId: camp.id,
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

  // Plan
  const handlePlan = async () => {
    if (!selectedCampaign?.copywriting && !selectedCampaign?.social) return;
    setIsPlanning(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: selectedCampaign.funnelId || selectedCampaign.id,
          userId: user?.uid,
          brandId,
          campaignSystemEnabled,
          selectedCharacterIds,
          inspirationRefs: inspirations,
          analysis,
          context: {
            objective: selectedFunnel?.context?.objective || '',
            copy: selectedCampaign.copywriting?.mainScript || selectedCampaign.copywriting?.bigIdea || selectedCampaign.social?.hooks?.[0]?.content || '',
            hooks: selectedCampaign.social?.hooks || [],
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

  // Quick generate
  const handleQuickGenerate = async () => {
    if (!selectedCampaign?.copywriting && !selectedCampaign?.social) return;
    setIsPlanning(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/design/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: selectedCampaign.funnelId || selectedCampaign.id,
          userId: user?.uid,
          brandId,
          context: {
            objective: selectedFunnel?.context?.objective || '',
            copy: selectedCampaign.copywriting?.mainScript || selectedCampaign.copywriting?.bigIdea || selectedCampaign.social?.hooks?.[0]?.content || '',
            hooks: selectedCampaign.social?.hooks || [],
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data?.prompts ?? data.prompts ?? []);
        setCurrentStep('generation');
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao gerar');
    } finally {
      setIsPlanning(false);
    }
  };

  // Approve
  const handleApproveDesign = async () => {
    if (!selectedCampaign || prompts.length === 0) return;
    try {
      await updateCampaignManifesto(selectedCampaign.id, {
        design: {
          visualStyle: 'Modern Premium',
          preferredColors: brand?.brandKit?.colors ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary].filter(Boolean) : ['#E6B447', '#000000'],
          visualPrompts: prompts,
          aspectRatios: prompts.map((p: any) => p.aspectRatio || '1:1'),
          analysis: analysis || null,
          campaignSystem: campaignSystemEnabled ? {
            enabled: true,
            pieces: prompts.map((p: any, i: number) => ({ role: p.pieceRole || 'standalone', promptIndex: i })),
          } : null,
          inspirationRefs: inspirations.length > 0 ? inspirations : [],
          selectedCharacterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : [],
        }
      });
      notify.success('Sistema Visual Aprovado!');
      router.push(`/campaigns/${selectedCampaign.id}`);
    } catch (error) {
      notify.error('Erro', 'Falha ao salvar');
    }
  };

  const characters: BrandCharacter[] = brand?.brandKit?.characters || [];

  const contextData = selectedCampaign ? {
    objective: selectedFunnel?.context?.objective,
    targetAudience: selectedFunnel?.context?.audience?.who,
    bigIdea: selectedCampaign.copywriting?.bigIdea,
    tone: selectedCampaign.copywriting?.tone,
    hooks: (selectedCampaign.social?.hooks || []).map((h: any) => typeof h === 'string' ? h : h.content || ''),
    visualStyle: brand?.brandKit?.visualStyle,
    awareness: selectedFunnel?.context?.audience?.awareness,
    brandColors: brand?.brandKit?.colors ? [brand.brandKit.colors.primary, brand.brandKit.colors.secondary, brand.brandKit.colors.accent].filter(Boolean) : [],
  } : {};

  if (!brandId) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0D0B09]">
        <Header title="Design Studio" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Selecione uma marca</h2>
            <p className="text-sm text-zinc-500">Ative uma marca no menu para acessar o Design Studio.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      <Header title="Design Studio" />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-[#E6B447]/10 text-[#E6B447]">
            <Palette className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Design Studio</h1>
            <p className="text-zinc-500">Crie sistemas visuais completos com o Diretor de Arte</p>
          </div>
        </div>

        {/* ==================== STEP: Campaign Selection ==================== */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#E6B447]" />
                Selecione uma campanha
              </h2>
            </div>

            {isLoadingCampaigns && (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
              </div>
            )}

            {!isLoadingCampaigns && campaigns.length === 0 && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center">
                <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma campanha disponível</h3>
                <p className="text-sm text-zinc-500 mb-4">O Design Studio precisa de uma campanha com Copy ou Social aprovados.</p>
                <Button asChild className="bg-[#E6B447] hover:bg-[#F0C35C]">
                  <Link href="/campaigns">Ir para Campanhas</Link>
                </Button>
              </div>
            )}

            {!isLoadingCampaigns && campaigns.length > 0 && (
              <div className="grid gap-3">
                {campaigns.map((campaign: any) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleSelectCampaign(campaign)}
                    className="w-full p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#E6B447]/20 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{campaign.name || 'Campanha sem nome'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {campaign.copywriting?.bigIdea && (
                            <span className="text-[10px] text-zinc-500 truncate max-w-[300px]">
                              {campaign.copywriting.bigIdea}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                            Copy
                          </span>
                          {campaign.social && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Social
                            </span>
                          )}
                          {campaign.design && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E6B447]/10 text-[#E6B447] border border-[#E6B447]/20">
                              Design
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-[#E6B447] transition-colors shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== STEP: Analysis ==================== */}
        {currentStep === 'analysis' && selectedCampaign && (
          <div className="space-y-6">
            <button onClick={() => { setCurrentStep('select'); setSelectedCampaign(null); setAnalysis(null); setPrompts([]); }} className="text-zinc-500 hover:text-white text-sm flex items-center gap-1 mb-2">
              <ChevronLeft className="h-4 w-4" /> Trocar campanha
            </button>

            <ContextReviewPanel context={contextData} />

            {isAnalyzing && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6B447] mb-4" />
                <p className="text-sm font-bold text-white">O Diretor de Arte está analisando...</p>
              </div>
            )}

            {!isAnalyzing && analysis && (
              <>
                <AnalysisResult analysis={analysis} />
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleAnalyze()} className="border-zinc-700 text-zinc-400 hover:text-white">
                    <RefreshCw className="mr-2 h-4 w-4" /> Nova Análise
                  </Button>
                  <Button onClick={() => setCurrentStep('inputs')} className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold">
                    Aprovar Análise <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={handleQuickGenerate} disabled={isPlanning} className="text-zinc-500 hover:text-white ml-auto">
                    {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Gerar Rápido
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== STEP: Inputs ==================== */}
        {currentStep === 'inputs' && (
          <div className="space-y-6">
            <CharacterSelector characters={characters} selected={selectedCharacterIds} onSelectionChange={setSelectedCharacterIds} />

            <CampaignSystemView
              pieces={analysis?.recommendedPieces?.map(p => ({ role: p.role, platform: p.platform, format: p.format, aspectRatio: p.aspectRatio, rationale: p.rationale })) || []}
              enabled={campaignSystemEnabled}
              onToggle={setCampaignSystemEnabled}
            />

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('analysis')} className="border-zinc-700 text-zinc-400 hover:text-white">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => { setCurrentStep('planning'); handlePlan(); }} disabled={isPlanning} className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold">
                {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
                Planejar Visuais <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ==================== STEP: Planning ==================== */}
        {currentStep === 'planning' && (
          <div className="space-y-6">
            {isPlanning && (
              <div className="p-12 rounded-xl border border-white/[0.05] bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6B447] mb-4" />
                <p className="text-sm font-bold text-white">Planejando sistema visual...</p>
              </div>
            )}

            {!isPlanning && prompts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#E6B447]" /> Criativos Planejados
                  </h2>
                  <Button variant="ghost" onClick={handlePlan} className="text-zinc-500 hover:text-white">
                    <RefreshCw className="h-4 w-4 mr-2" /> Replanejar
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
                      </div>
                      {prompt.assets?.headline && <p className="text-sm text-white font-bold">"{prompt.assets.headline}"</p>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('inputs')} className="border-zinc-700 text-zinc-400 hover:text-white">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={() => setCurrentStep('generation')} className="bg-[#E6B447] hover:bg-[#F0C35C] font-bold">
                    <ImageIcon className="mr-2 h-4 w-4" /> Gerar Imagens <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== STEP: Generation ==================== */}
        {currentStep === 'generation' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#E6B447]" /> Criativos NanoBanana
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setCurrentStep('planning')} className="text-zinc-500 hover:text-white">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button variant="ghost" onClick={handleQuickGenerate} disabled={isPlanning} className="text-zinc-500 hover:text-white">
                  <RefreshCw className={cn("h-4 w-4 mr-2", isPlanning && "animate-spin")} /> Recriar
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {prompts.map((prompt, i) => (
                <div key={i} className="space-y-2">
                  {prompt.pieceRole && <PieceRoleBadge role={prompt.pieceRole} size="md" />}
                  <DesignGenerationCard
                    promptData={prompt}
                    conversationId={selectedCampaign?.funnelId || selectedCampaign?.id || ''}
                    campaignId={selectedCampaign?.id}
                  />
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/[0.05] flex justify-end">
              <Button onClick={handleApproveDesign} className="bg-[#E6B447] hover:bg-[#F0C35C] h-12 px-12 text-lg font-bold shadow-[0_0_30px_rgba(230,180,71,0.3)]">
                Aprovar Sistema Visual <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
