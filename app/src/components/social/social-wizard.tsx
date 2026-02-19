'use client';

/**
 * SocialWizard — 4-step social content generation flow
 * Step 1: Config (campaign type + formats + platform + topic)
 * Step 2: Generation (hooks + content plan)
 * Step 3: Debate (4 counselors discuss hooks)
 * Step 4: Evaluation (calibrated scorecard)
 *
 * Sprint M — M-1.1, M-1.2, M-2.4
 */

import { useState } from 'react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Share2, Smartphone, Instagram, Twitter, Linkedin, Youtube,
  Loader2, Check, Copy, Lightbulb, FileText, ArrowLeft, ArrowRight,
  Trophy, Sparkles, MessageSquare, Target, Megaphone, Building2,
  TrendingUp, CalendarPlus, LayoutGrid, BookmarkPlus, FlaskConical,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/stores/notification-store';
import { StructureViewer } from './structure-viewer';
import { ScorecardViewer } from './scorecard-viewer';
import { DebateViewer } from './debate-viewer';
import { TrendPanel } from './trend-panel';
import { ProfileAnalyzer } from './profile-analyzer';

// === Constants ===

const PLATFORMS = [
  { id: 'TikTok', icon: Smartphone, label: 'TikTok', color: 'text-zinc-100' },
  { id: 'Instagram (Reels)', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  { id: 'YouTube Shorts', icon: Youtube, label: 'Shorts', color: 'text-red-500' },
  { id: 'X (Twitter)', icon: Twitter, label: 'X', color: 'text-zinc-400' },
  { id: 'LinkedIn', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-500' },
];

const CAMPAIGN_TYPES = [
  { id: 'organic' as const, label: 'Orgânico', icon: TrendingUp, desc: 'Engajamento natural, comunidade' },
  { id: 'viral' as const, label: 'Viral', icon: Zap, desc: 'Máximo compartilhamento, emoção forte' },
  { id: 'institutional' as const, label: 'Institucional', icon: Building2, desc: 'Autoridade, confiança, bastidores' },
  { id: 'conversion' as const, label: 'Conversão', icon: Target, desc: 'Qualificar leads, direcionar ao funil' },
];

const CONTENT_FORMATS = [
  { id: 'reel', label: 'Reels/Vídeo Curto' },
  { id: 'carousel', label: 'Carrossel' },
  { id: 'post', label: 'Post Estático' },
  { id: 'story', label: 'Stories' },
  { id: 'thread', label: 'Thread/Texto Longo' },
];

type CampaignType = 'organic' | 'viral' | 'institutional' | 'conversion';

const STEPS = [
  { id: 'config', label: 'Configuração', icon: LayoutGrid },
  { id: 'generation', label: 'Geração', icon: Sparkles },
  { id: 'debate', label: 'Debate', icon: MessageSquare },
  { id: 'evaluation', label: 'Avaliação', icon: Trophy },
];

interface Hook {
  style: string;
  content: string;
  reasoning: string;
  postType?: string;
}

interface GenerationResult {
  platform: string;
  campaignType?: string;
  hooks: Hook[];
  best_practices: string[];
  content_plan?: {
    pillars: string[];
    suggested_calendar: { day: string; pillar: string; format: string }[];
  };
}

export function SocialWizard() {
  const activeBrand = useActiveBrand();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Config
  const [platform, setPlatform] = useState(PLATFORMS[0].id);
  const [topic, setTopic] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('organic');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['reel', 'carousel', 'post']);

  // Step 2: Generation
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [selectedHookIdx, setSelectedHookIdx] = useState<number | null>(null);
  const [structure, setStructure] = useState<any | null>(null);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Step 3: Debate
  const [isDebating, setIsDebating] = useState(false);
  const [debate, setDebate] = useState<string | null>(null);

  // Step 4: Evaluation
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scorecard, setScorecard] = useState<any | null>(null);

  // Calendar integration
  const [isSendingToCalendar, setIsSendingToCalendar] = useState(false);

  // X-1.1: Case study
  const [isSavingCase, setIsSavingCase] = useState(false);

  // X-1.2: A/B variations
  const [abVariations, setAbVariations] = useState<any>(null);
  const [isGeneratingAB, setIsGeneratingAB] = useState(false);

  // === Handlers ===

  const handleGenerate = async () => {
    if (!topic.trim()) {
      notify.error('Por favor, informe um tema ou assunto.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStructure(null);
    setScorecard(null);
    setDebate(null);
    setSelectedHookIdx(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/social/hooks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          topic,
          campaignType,
          contentFormats: selectedFormats,
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar hooks');

      const data = await response.json();
      setResult(data.data);
      setCurrentStep(1);
      notify.success('Hooks gerados com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao gerar hooks. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStructure = async (hook: string, index: number) => {
    setIsGeneratingStructure(true);
    setSelectedHookIdx(index);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/social/structure', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          hook,
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar estrutura');

      const data = await response.json();
      setStructure(data.data);
      notify.success('Estrutura gerada!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao gerar estrutura.');
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  const handleDebate = async () => {
    if (!result?.hooks) return;
    setIsDebating(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/social/debate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          hooks: result.hooks,
          campaignType,
          topic,
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar debate');

      const data = await response.json();
      setDebate(data.data?.debate);
      setCurrentStep(2);
      notify.success('Debate do Conselho gerado!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao gerar debate. Tente novamente.');
    } finally {
      setIsDebating(false);
    }
  };

  const handleEvaluate = async () => {
    const contentToEvaluate = structure || (result?.hooks && selectedHookIdx !== null ? result.hooks[selectedHookIdx] : result?.hooks?.[0]);
    if (!contentToEvaluate) return;
    setIsEvaluating(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/social/scorecard', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          content: contentToEvaluate,
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar scorecard');

      const data = await response.json();
      setScorecard(data.data);
      setCurrentStep(3);
      notify.success('Avaliação calibrada gerada!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao avaliar conteúdo.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSendToCalendar = async (hook: Hook) => {
    if (!activeBrand?.id) return;
    setIsSendingToCalendar(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/content/calendar/from-social', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          hooks: [{ ...hook, platform }],
          campaignType,
        }),
      });

      if (!response.ok) throw new Error('Falha ao enviar ao calendário');
      notify.success('Hook adicionado ao calendário!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao enviar ao calendário.');
    } finally {
      setIsSendingToCalendar(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    notify.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // X-1.1: Save as case study
  const handleSaveCase = async (outcome: 'success' | 'failure') => {
    if (!activeBrand?.id || !result?.hooks) return;
    setIsSavingCase(true);
    try {
      const headers = await getAuthHeaders();
      const hookContent = selectedHookIdx !== null ? result.hooks[selectedHookIdx].content : result.hooks[0].content;
      const res = await fetch('/api/social/cases', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          content: hookContent,
          platform,
          outcome,
          analysis: scorecard ? JSON.stringify(scorecard) : debate || 'Sem análise disponível',
          tags: [campaignType, platform],
        }),
      });
      if (res.ok) {
        notify.success(`Conteúdo marcado como ${outcome === 'success' ? 'sucesso' : 'fracasso'}!`);
      } else {
        notify.error('Erro ao salvar case study');
      }
    } catch {
      notify.error('Erro de conexão');
    } finally {
      setIsSavingCase(false);
    }
  };

  // X-1.2: Generate A/B variations
  const handleGenerateAB = async () => {
    if (!activeBrand?.id || !result?.hooks) return;
    setIsGeneratingAB(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/social/ab-variations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          hooks: result.hooks,
          platform,
          campaignType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAbVariations(data.data);
        notify.success('Variações A/B geradas!');
      } else {
        notify.error(data.error || 'Erro ao gerar variações');
      }
    } catch {
      notify.error('Erro de conexão');
    } finally {
      setIsGeneratingAB(false);
    }
  };

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev =>
      prev.includes(formatId) ? prev.filter(f => f !== formatId) : [...prev, formatId]
    );
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setResult(null);
    setStructure(null);
    setScorecard(null);
    setDebate(null);
    setSelectedHookIdx(null);
    setTopic('');
  };

  // === Step Progress Bar ===
  const StepProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                // Allow going back to completed steps
                if (idx <= currentStep) setCurrentStep(idx);
              }}
              disabled={idx > currentStep}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                isActive ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                'bg-zinc-800/50 border-white/[0.04] text-zinc-600'
              )}
            >
              {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={cn('w-6 h-[2px] mx-1', isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800')} />
            )}
          </div>
        );
      })}
    </div>
  );

  // === STEP 0: Config ===
  if (currentStep === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <StepProgress />

        {/* Campaign Type */}
        <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Objetivo da Campanha</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CAMPAIGN_TYPES.map(ct => {
              const Icon = ct.icon;
              const isActive = campaignType === ct.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setCampaignType(ct.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl text-sm transition-all border',
                    isActive
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]'
                      : 'bg-zinc-800/50 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-rose-400' : 'text-zinc-500')} />
                  <span className="font-medium">{ct.label}</span>
                  <span className="text-[10px] text-center opacity-70">{ct.desc}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content Formats */}
        <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Formatos de Conteúdo</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONTENT_FORMATS.map(f => {
              const isActive = selectedFormats.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFormat(f.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                    isActive
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                      : 'bg-zinc-800/50 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  )}
                >
                  {isActive && <Check className="inline h-3 w-3 mr-1.5" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Platform + Topic */}
        <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Plataforma e Tema</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                      isActive
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]'
                        : 'bg-zinc-800/50 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-rose-400' : p.color)} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ex: Como estruturar um funil de vendas direto no Instagram..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="bg-zinc-800/50 border-white/[0.04] focus:border-rose-500/50 h-12"
              />
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="h-12 px-6 bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4 fill-current" />Gerar Hooks</>
                )}
              </Button>
            </div>
            {activeBrand && (
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 px-1">
                <Check className="h-3 w-3 text-emerald-500" />
                Marca: <span className="text-zinc-300 font-medium">{activeBrand.name}</span>
              </p>
            )}
          </div>
        </Card>

        {/* Sprint O — O-4: Trend Research & Profile Analysis (before generation) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendPanel />
          <ProfileAnalyzer />
        </div>
      </div>
    );
  }

  // === STEP 1: Generation Results ===
  if (currentStep === 1 && result) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <StepProgress />

        {/* Content Plan (if available) */}
        {result.content_plan && (
          <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-4">
              <Megaphone className="h-4 w-4" />
              Plano de Conteúdo Sugerido
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.content_plan.pillars.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pilares</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.content_plan.pillars.map((pillar, i) => (
                      <Badge key={i} variant="outline" className="border-rose-500/20 text-rose-400 bg-rose-500/5">
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.content_plan.suggested_calendar?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Calendário Sugerido</span>
                  <div className="space-y-1 mt-2">
                    {result.content_plan.suggested_calendar.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="font-medium text-zinc-300 w-16">{item.day}</span>
                        <span className="text-rose-400">{item.pillar}</span>
                        <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px]">{item.format}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Hooks */}
        <div className="grid gap-4">
          {result.hooks.map((hook, index) => (
            <Card
              key={index}
              className={cn(
                'overflow-hidden bg-zinc-900/40 border-white/[0.04] group hover:border-rose-500/30 transition-all',
                selectedHookIdx === index && 'border-rose-500/50 ring-1 ring-rose-500/20'
              )}
            >
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] uppercase tracking-wider">
                      {hook.style}
                    </Badge>
                    {hook.postType && (
                      <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px]">
                        {hook.postType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendToCalendar(hook)}
                      disabled={isSendingToCalendar}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors p-1"
                      title="Enviar ao Calendário"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(hook.content, index)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                    >
                      {copiedIndex === index ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                  &ldquo;{hook.content}&rdquo;
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.02] flex-1">
                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 italic">{hook.reasoning}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateStructure(hook.content, index)}
                    disabled={isGeneratingStructure}
                    className="shrink-0 bg-white/[0.05] hover:bg-rose-500 hover:text-white border border-white/[0.05] transition-all text-zinc-300 gap-2"
                  >
                    {isGeneratingStructure && selectedHookIdx === index ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    Estruturar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Structure preview */}
        {structure && (
          <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-rose-400" />
              Estrutura do Conteúdo
            </h3>
            <StructureViewer structure={structure} />
          </Card>
        )}

        {/* Best Practices */}
        {result.best_practices.length > 0 && (
          <Card className="p-6 bg-rose-500/5 border-rose-500/10">
            <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-4">
              <Check className="h-4 w-4" />
              Melhores Práticas para {result.platform}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.best_practices.map((practice, idx) => (
                <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500/40 mt-1.5 shrink-0" />
                  {practice}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Debate Loading State */}
        {isDebating && (
          <Card className="p-6 bg-violet-500/5 border-violet-500/20 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-violet-300">Conselheiros em debate...</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  4 especialistas estão analisando seus hooks. Isso pode levar até 1 minuto e meio.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
          <Button variant="ghost" onClick={() => setCurrentStep(0)} className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={handleDebate}
            disabled={isDebating}
            className="bg-violet-500 hover:bg-violet-600 text-white font-semibold gap-2"
          >
            {isDebating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            {isDebating ? 'Conselheiros Debatendo...' : 'Debate do Conselho'}
          </Button>
        </div>
      </div>
    );
  }

  // === STEP 2: Debate ===
  if (currentStep === 2 && debate) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <StepProgress />

        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-bold text-zinc-100">Debate do Conselho Social</h2>
        </div>

        <DebateViewer debate={debate} />

        {/* Evaluation Loading State */}
        {isEvaluating && (
          <Card className="p-6 bg-amber-500/5 border-amber-500/20 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">Avaliação em andamento...</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  O conselho está calibrando a nota do conteúdo. Isso pode levar até 1 minuto.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
          <Button variant="ghost" onClick={() => setCurrentStep(1)} className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Hooks
          </Button>
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2"
          >
            {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
            {isEvaluating ? 'Avaliando...' : 'Avaliação Calibrada'}
          </Button>
        </div>
      </div>
    );
  }

  // === STEP 3: Evaluation ===
  if (currentStep === 3 && scorecard) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <StepProgress />

        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-bold text-zinc-100">Avaliação Calibrada</h2>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5 text-[10px]">
            4 Conselheiros
          </Badge>
        </div>

        <ScorecardViewer scorecard={scorecard} />

        {/* X-1.1: Case Study Actions */}
        <Card className="p-4 bg-zinc-900/50 border-white/[0.04]">
          <div className="flex items-center gap-2 mb-3">
            <BookmarkPlus className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Marcar como Case Study</h3>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => handleSaveCase('success')}
              disabled={isSavingCase}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
            >
              <ThumbsUp className="mr-1.5 h-3.5 w-3.5" /> Sucesso
            </Button>
            <Button
              size="sm"
              onClick={() => handleSaveCase('failure')}
              disabled={isSavingCase}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" /> Fracasso
            </Button>
            {isSavingCase && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
          </div>
        </Card>

        {/* X-1.2: A/B Variations */}
        <Card className="p-4 bg-zinc-900/50 border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Variações A/B</h3>
            </div>
            <Button
              size="sm"
              onClick={handleGenerateAB}
              disabled={isGeneratingAB}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
            >
              {isGeneratingAB ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-1.5 h-3.5 w-3.5" />}
              {isGeneratingAB ? 'Gerando...' : 'Gerar Variações'}
            </Button>
          </div>
          {abVariations?.variations?.map((group: any, gi: number) => (
            <div key={gi} className="mb-4">
              <p className="text-[10px] text-zinc-500 uppercase font-medium mb-2">Hook {group.originalHookIndex + 1}</p>
              <div className="space-y-2">
                {group.variants?.map((v: any, vi: number) => (
                  <div key={vi} className="p-3 rounded-lg bg-zinc-800/30 border border-white/[0.03]">
                    <p className="text-xs text-zinc-200">&ldquo;{v.content}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 bg-blue-500/5">
                        {v.angle}
                      </Badge>
                      <span className="text-[10px] text-zinc-500">Score: {v.predictedScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/[0.05]">
          <Button variant="ghost" onClick={() => setCurrentStep(2)} className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Debate
          </Button>
          <Button variant="outline" onClick={resetWizard} className="border-white/[0.08] text-zinc-400 hover:text-zinc-100">
            Nova Geração
          </Button>
        </div>
      </div>
    );
  }

  // Fallback — show config
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <StepProgress />
      <Card className="p-12 text-center bg-zinc-900/40 border-white/[0.04]">
        <p className="text-zinc-500">Carregando...</p>
      </Card>
    </div>
  );
}
