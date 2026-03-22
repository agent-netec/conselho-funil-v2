"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Layers,
  Gift,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Info,
  RefreshCw,
  Megaphone,
  MousePointerClick,
  ShieldCheck,
  Plus,
  X,
  Crown,
  FlaskConical,
} from 'lucide-react';

import {
  OfferWizardState,
} from '@/types/offer';
import { OfferLabEngine } from '@/lib/intelligence/offer/calculator';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { useRouter } from 'next/navigation';
import { CompletionBanner } from '@/components/ui/completion-banner';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

interface AIInsight {
  counselorId: string;
  counselorName: string;
  frameworkUsed: string;
  score: number;
  opinion: string;
  redFlagsTriggered: string[];
  goldStandardsHit: string[];
}

interface OfferQualityResult {
  overallQuality: number;
  insights: AIInsight[];
  summary: string;
}

interface ActionableTip {
  text: string;
  action?: { label: string; apply: () => void };
}

// ═══════════════════════════════════════════════════════
// Circular Score Gauge
// ═══════════════════════════════════════════════════════

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = (s: number) => {
    if (s < 40) return { stroke: '#C45B3A', glow: 'rgba(196,91,58,0.3)', label: 'Oferta Fraca' };
    if (s < 70) return { stroke: '#E6B447', glow: 'rgba(230,180,71,0.3)', label: 'Oferta Promissora' };
    if (s < 90) return { stroke: '#7A9B5A', glow: 'rgba(122,155,90,0.3)', label: 'Oferta Irresistível' };
    return { stroke: '#E6B447', glow: 'rgba(230,180,71,0.5)', label: 'Oferta Lendária' };
  };

  const { stroke, glow, label } = getColor(score);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={6}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 8px ${glow})`,
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-black tracking-tighter"
          style={{ fontSize: size * 0.28, color: stroke, transition: 'color 0.5s ease' }}
        >
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#CAB792] mt-0.5">
          /100
        </span>
      </div>
      <Badge
        className="mt-3 text-[10px] font-mono uppercase tracking-wider border-0 px-3 py-1"
        style={{
          backgroundColor: `${stroke}15`,
          color: stroke,
        }}
      >
        {label}
      </Badge>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step Feedback — Actionable Tips
// ═══════════════════════════════════════════════════════

function StepFeedback({ step, offer, onUpdate }: { step: number; offer: OfferWizardState; onUpdate: (o: OfferWizardState) => void }) {
  const tips: ActionableTip[] = [];

  if (step === 1) {
    if (offer.promise.length > 0 && offer.promise.length <= 20)
      tips.push({ text: 'Sua promessa está muito curta. Seja mais específico sobre o resultado.' });
    if (offer.promise.length > 20 && !/\d/.test(offer.promise))
      tips.push({
        text: 'Adicione um número à promessa. Promessas mensuráveis convertem mais.',
        action: { label: 'Adicionar "R$10k em 30 dias"', apply: () => onUpdate({ ...offer, promise: offer.promise + ' — R$10k em 30 dias' }) },
      });
    if (offer.promise.length > 20 && !/dia|semana|mes|mês|hora/i.test(offer.promise))
      tips.push({
        text: 'Inclua um prazo. Urgência aumenta o desejo.',
        action: { label: 'Adicionar "em 30 dias"', apply: () => onUpdate({ ...offer, promise: offer.promise + ' em 30 dias' }) },
      });
    if (offer.corePrice > 0 && offer.perceivedValue > 0 && offer.perceivedValue / offer.corePrice < 5)
      tips.push({
        text: 'Valor percebido está baixo. O ideal é pelo menos 10x o preço.',
        action: { label: `Ajustar para ${(offer.corePrice * 10).toLocaleString('pt-BR')}`, apply: () => onUpdate({ ...offer, perceivedValue: offer.corePrice * 10 }) },
      });
  }

  if (step === 2) {
    if (offer.stacking.length > 0 && offer.stacking.length < 3) {
      const missing = 3 - offer.stacking.length;
      tips.push({
        text: `Você tem ${offer.stacking.length} item(ns). Adicione pelo menos 3 para maximizar ancoragem.`,
        action: {
          label: `Adicionar ${missing} item(ns)`,
          apply: () => {
            const newItems = Array.from({ length: missing }, () => ({ id: crypto.randomUUID(), name: '', value: 0, description: '' }));
            onUpdate({ ...offer, stacking: [...offer.stacking, ...newItems] });
          },
        },
      });
    }
    if (offer.stacking.some(s => s.name.length === 0 || s.value === 0))
      tips.push({ text: 'Preencha nome E valor de todos os itens do stack para pontuar mais.' });
  }

  if (step === 3) {
    if (offer.bonuses.length < 2) {
      const missing = 2 - offer.bonuses.length;
      tips.push({
        text: `Adicione pelo menos 2 bônus. Cada bônus deve resolver uma objeção específica do cliente.`,
        action: {
          label: `Adicionar ${missing} bônus`,
          apply: () => {
            const newBonuses = Array.from({ length: missing }, () => ({ id: crypto.randomUUID(), name: '', value: 0, description: '' }));
            onUpdate({ ...offer, bonuses: [...offer.bonuses, ...newBonuses] });
          },
        },
      });
    }
    if (offer.bonuses.some(b => !b.description || b.description.length === 0))
      tips.push({ text: 'Descreva qual objeção cada bônus resolve. Bônus sem objeção valem menos no score.' });
  }

  if (step === 4) {
    if (offer.riskReversal.length > 0 && offer.riskReversal.length <= 50)
      tips.push({
        text: 'Sua garantia está curta. Detalhe: tipo, prazo, e o que acontece se pedir reembolso.',
        action: {
          label: 'Expandir garantia',
          apply: () => onUpdate({ ...offer, riskReversal: offer.riskReversal + '. Garantia incondicional de 30 dias — se não gostar, devolvemos 100% do valor sem perguntas.' }),
        },
      });
    if (offer.riskReversal.length > 0 && !/dia|garantia|devolv|reembols/i.test(offer.riskReversal))
      tips.push({
        text: 'Mencione "garantia", prazo em dias ou política de devolução para mais credibilidade.',
        action: {
          label: 'Inserir garantia 30 dias',
          apply: () => onUpdate({ ...offer, riskReversal: offer.riskReversal + ' — Garantia de 30 dias com reembolso total.' }),
        },
      });
    if (offer.scarcity.length === 0)
      tips.push({
        text: 'Sem escassez não há urgência. Adicione limite de vagas, prazo ou edição limitada.',
        action: { label: 'Inserir escassez', apply: () => onUpdate({ ...offer, scarcity: 'Apenas 50 vagas disponíveis' }) },
      });
  }

  if (tips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 p-4 rounded-xl border border-[#E6B447]/15 bg-[#E6B447]/[0.03] backdrop-blur-sm space-y-2.5"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full bg-[#E6B447]/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#E6B447]" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#E6B447]/70">Dicas do Conselho</span>
      </div>
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2.5 text-[12px] text-[#CAB792] leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E6B447]/50" />
          <div className="flex-1">
            <span>{tip.text}</span>
            {tip.action && (
              <button
                onClick={tip.action.apply}
                className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6B447]/10 hover:bg-[#E6B447]/20 text-[#E6B447] text-[11px] font-medium transition-all duration-200 border border-[#E6B447]/10 hover:border-[#E6B447]/25"
              >
                <MousePointerClick className="w-3 h-3" />
                {tip.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// Value Equation Guide (Collapsible)
// ═══════════════════════════════════════════════════════

function ValueEquationGuide() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-[12px] font-medium text-[#CAB792] hover:text-[#F5E8CE] transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#E6B447]/60" />
          Como funciona a Equação de Valor?
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="p-3 bg-black/30 rounded-lg border border-white/[0.04]">
                <p className="text-[12px] text-[#F5E8CE] font-mono text-center">
                  Score = (Resultado Desejado × Probabilidade) / (Tempo + Esforço)
                </p>
              </div>
              <div className="space-y-2 text-[11px] text-[#CAB792] leading-relaxed">
                <div className="flex gap-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#7A9B5A] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F5E8CE]">Aumente o numerador:</strong> Prometa um resultado ambicioso + demonstre que é alcançável</span>
                </div>
                <div className="flex gap-2.5">
                  <Zap className="w-3.5 h-3.5 text-[#E6B447] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F5E8CE]">Diminua o denominador:</strong> Mostre que é rápido e fácil de implementar</span>
                </div>
              </div>
              <p className="text-[10px] text-[#6B5D4A] italic">
                Baseado no framework "$100M Offers" de Alex Hormozi.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Premium Slider
// ═══════════════════════════════════════════════════════

function PremiumSlider({ label, value, onChange, hint }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: { low: string; high: string };
}) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A] group-hover:text-[#CAB792] transition-colors">{label}</span>
        <span className="text-[13px] font-mono font-bold text-[#F5E8CE]">{value}<span className="text-[#6B5D4A]">/10</span></span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 h-1.5 rounded-full bg-white/[0.04] top-1/2 -translate-y-1/2" />
        <div
          className="absolute h-1.5 rounded-full top-1/2 -translate-y-1/2 transition-all duration-200"
          style={{
            width: `${(value / 10) * 100}%`,
            background: `linear-gradient(90deg, #AB8648, #E6B447)`,
            boxShadow: '0 0 12px rgba(230,180,71,0.2)',
          }}
        />
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#E6B447]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0D0B09]
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(230,180,71,0.4)]
            [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:shadow-[0_0_16px_rgba(230,180,71,0.6)]
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#E6B447]
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0D0B09]
          "
        />
      </div>
      {hint && (
        <div className="flex justify-between text-[9px] text-[#6B5D4A] font-mono">
          <span>{hint.low}</span>
          <span>{hint.high}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Wizard
// ═══════════════════════════════════════════════════════

export function OfferLabWizard({ brandId, onSaved, campaignId }: { brandId: string; onSaved?: () => void; campaignId?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [offer, setOffer] = useState<OfferWizardState>({
    promise: '',
    corePrice: 0,
    perceivedValue: 0,
    stacking: [],
    bonuses: [],
    scarcity: '',
    riskReversal: '',
    scoringFactors: {
      dreamOutcome: 8,
      perceivedLikelihood: 8,
      timeDelay: 2,
      effortSacrifice: 2
    }
  });
  const [result, setResult] = useState<{ total: number; analysis: string[] }>({ total: 0, analysis: [] });
  const [saved, setSaved] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<OfferQualityResult | null>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  useEffect(() => {
    const calculation = OfferLabEngine.calculateScore(offer);
    setResult(calculation);
  }, [offer]);

  const handleAiEvaluation = async () => {
    if (!brandId) {
      toast.error('Selecione uma marca antes de avaliar a oferta.');
      return;
    }
    setIsEvaluating(true);
    try {
      const headers = await getAuthHeaders();
      const offerData = {
        components: {
          coreProduct: {
            name: offer.promise.substring(0, 50),
            promise: offer.promise,
            price: offer.corePrice,
            perceivedValue: offer.perceivedValue,
          },
          stacking: offer.stacking,
          bonuses: offer.bonuses,
          riskReversal: offer.riskReversal,
          scarcity: offer.scarcity,
        },
        scoring: {
          total: result.total,
          factors: offer.scoringFactors,
          analysis: result.analysis,
        },
      };
      const response = await fetch('/api/intelligence/offer/calculate-score', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, offerData }),
      });
      if (!response.ok) throw new Error('Falha na avaliação AI');
      const data = await response.json();
      setAiEvaluation(data.data?.aiEvaluation ?? null);
      setShowAiResult(true);
    } catch {
      toast.error('Avaliação AI indisponível. Você pode salvar a oferta mesmo assim.');
      setShowAiResult(true);
      setAiEvaluation(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSave = async () => {
    if (!brandId) {
      toast.error('Selecione uma marca antes de salvar a oferta.');
      return;
    }
    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/offer/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, state: offer, aiEvaluation: aiEvaluation ?? undefined, campaignId: campaignId || undefined })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao salvar');
      }
      setSaved(true);
      onSaved?.();
      toast.success('Oferta salva com sucesso!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar oferta.');
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 4) {
      handleAiEvaluation();
    } else {
      setStep(s => Math.min(s + 1, 4));
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const steps = [
    { id: 1, name: 'Promessa', icon: Target, desc: 'A Grande Promessa' },
    { id: 2, name: 'Stacking', icon: Layers, desc: 'Empilhamento de Valor' },
    { id: 3, name: 'Bônus', icon: Gift, desc: 'Bônus Irresistíveis' },
    { id: 4, name: 'Fechamento', icon: ShieldCheck, desc: 'Escassez & Garantia' },
  ];

  // Checklist items
  const checklist = useMemo(() => [
    { label: 'Promessa com resultado mensurável', met: offer.promise.length > 20 && /\d/.test(offer.promise) },
    { label: 'Promessa com prazo definido', met: /dia|semana|mes|mês|hora/i.test(offer.promise) },
    { label: 'Ancoragem 10x (valor vs preço)', met: offer.corePrice > 0 && (offer.perceivedValue + offer.stacking.reduce((a, b) => a + b.value, 0) + offer.bonuses.reduce((a, b) => a + b.value, 0)) / offer.corePrice >= 10 },
    { label: 'Stack com 3+ itens completos', met: offer.stacking.length >= 3 && offer.stacking.every(s => s.name.length > 0 && s.value > 0) },
    { label: '2+ bônus com objeção descrita', met: offer.bonuses.length >= 2 && offer.bonuses.every(b => b.description && b.description.length > 0) },
    { label: 'Garantia detalhada (tipo + prazo)', met: offer.riskReversal.length > 50 && /dia|garantia|devolv|reembols/i.test(offer.riskReversal) },
    { label: 'Gatilho de escassez ativo', met: offer.scarcity.length > 10 },
  ], [offer]);

  const checklistDone = checklist.filter(c => c.met).length;

  // ─── AI Evaluation Result Screen ───────────────────
  if (showAiResult && !saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-8 py-6"
      >
        {/* Header with dual scores */}
        <div className="relative rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent p-8 overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E6B447]/10 blur-[80px] pointer-events-none" />

          <div className="relative text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <FlaskConical className="w-3.5 h-3.5 text-[#E6B447]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#CAB792]">Avaliação Completa</span>
            </div>

            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <ScoreGauge score={result.total} size={140} />
                <p className="text-[11px] font-mono text-[#6B5D4A] mt-2 uppercase tracking-wider">Fórmula Hormozi</p>
              </div>
              {aiEvaluation && aiEvaluation.overallQuality > 0 && (
                <div className="text-center">
                  <ScoreGauge score={aiEvaluation.overallQuality} size={140} />
                  <p className="text-[11px] font-mono text-[#6B5D4A] mt-2 uppercase tracking-wider">Conselho AI</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights (Counselors) */}
        {aiEvaluation && aiEvaluation.insights.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-1">
              <Crown className="w-4 h-4 text-[#E6B447]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B5D4A]">Parecer dos Conselheiros</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {aiEvaluation.insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 space-y-4 overflow-hidden group hover:border-white/[0.08] transition-colors duration-300"
                >
                  {/* Top bar accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E6B447]/30 to-transparent" />

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#F5E8CE] flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#E6B447]" />
                        {insight.counselorName}
                      </h4>
                      <p className="text-[10px] font-mono text-[#6B5D4A] mt-0.5">{insight.frameworkUsed}</p>
                    </div>
                    <div
                      className="text-[18px] font-mono font-black px-2.5 py-0.5 rounded-lg"
                      style={{
                        color: insight.score >= 70 ? '#7A9B5A' : insight.score >= 40 ? '#E6B447' : '#C45B3A',
                        backgroundColor: insight.score >= 70 ? 'rgba(122,155,90,0.1)' : insight.score >= 40 ? 'rgba(230,180,71,0.1)' : 'rgba(196,91,58,0.1)',
                      }}
                    >
                      {insight.score}
                    </div>
                  </div>

                  <p className="text-[13px] text-[#CAB792] italic leading-relaxed border-l-2 border-[#E6B447]/20 pl-3">
                    &ldquo;{insight.opinion}&rdquo;
                  </p>

                  {insight.redFlagsTriggered.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#C45B3A]/70">Alertas</p>
                      {insight.redFlagsTriggered.map((flag, j) => (
                        <div key={j} className="flex gap-2 text-[11px] text-[#C45B3A]/80 leading-tight">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {insight.goldStandardsHit.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#7A9B5A]/70">Pontos Fortes</p>
                      {insight.goldStandardsHit.map((gs, j) => (
                        <div key={j} className="flex gap-2 text-[11px] text-[#7A9B5A]/80 leading-tight">
                          <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{gs}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Executive Summary */}
            {aiEvaluation.summary && (
              <div className="relative rounded-xl border border-[#E6B447]/10 bg-[#E6B447]/[0.03] p-5 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E6B447]/20 to-transparent" />
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#E6B447]/60 mb-2">Resumo Executivo</p>
                <p className="text-[13px] text-[#CAB792] leading-relaxed">{aiEvaluation.summary}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-white/[0.04] bg-white/[0.02] text-center">
            <p className="text-[13px] text-[#6B5D4A]">
              {isEvaluating ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#E6B447]" />
                  Avaliando com o Conselho...
                </span>
              ) : 'Avaliação AI indisponível. Você pode salvar a oferta normalmente.'}
            </p>
          </div>
        )}

        {/* Formula Insights */}
        {result.analysis.length > 0 && (
          <div className="space-y-2 px-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B5D4A]">Insights da Fórmula</p>
            {result.analysis.map((insight, i) => (
              <div key={i} className="flex gap-2.5 text-[12px] text-[#CAB792] leading-relaxed">
                <Info className="w-3.5 h-3.5 text-[#5B8EC4] shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        {!campaignId && (
          <CompletionBanner
            title="Oferta avaliada!"
            description="Sua oferta foi analisada. Crie uma campanha para colocá-la em ação."
            cta="Criar Campanha"
            href="/campaigns"
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => { setShowAiResult(false); setStep(1); }}
            className="text-[#CAB792] hover:text-[#F5E8CE] hover:bg-white/[0.04] gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Ajustar Oferta
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setAiEvaluation(null); handleAiEvaluation(); }}
            disabled={isEvaluating}
            className="text-[#E6B447] hover:bg-[#E6B447]/10 border border-[#E6B447]/20 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Reavaliando...' : 'Reavaliar'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C] px-8 font-semibold shadow-[0_0_20px_rgba(230,180,71,0.3)] hover:shadow-[0_0_30px_rgba(230,180,71,0.5)] gap-2"
          >
            {isSaving ? 'Salvando...' : 'Salvar Oferta'}
            <CheckCircle2 className="w-4 h-4" />
          </Button>
          {campaignId && (
            <Button
              onClick={async () => { await handleSave(); router.push(`/campaigns/${campaignId}`); }}
              disabled={isSaving}
              className="bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C] px-6 font-semibold gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Salvar e Ir para Campanha
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── Saved Success Screen ──────────────────────────
  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-[#7A9B5A]/20 blur-[40px] rounded-full" />
          <div className="relative w-20 h-20 rounded-full bg-[#7A9B5A]/15 border border-[#7A9B5A]/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#7A9B5A]" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-[#F5E8CE]">Oferta Salva!</h2>
          <p className="text-[14px] text-[#CAB792] max-w-md leading-relaxed">
            Score de irresistibilidade: <span className="font-mono font-bold text-[#F5E8CE]">{result.total}</span>
            {aiEvaluation && aiEvaluation.overallQuality > 0 && (
              <> · Score AI: <span className="font-mono font-bold text-[#E6B447]">{aiEvaluation.overallQuality}</span></>
            )}
          </p>
        </div>
        <div className="flex gap-3 pt-4">
          {campaignId && (
            <Button
              onClick={() => router.push(`/campaigns/${campaignId}`)}
              className="bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C] px-8 font-semibold gap-2"
            >
              Voltar para Linha de Ouro
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setSaved(false);
              setShowAiResult(false);
              setAiEvaluation(null);
              setStep(1);
              setOffer({
                promise: '', corePrice: 0, perceivedValue: 0, stacking: [], bonuses: [],
                scarcity: '', riskReversal: '',
                scoringFactors: { dreamOutcome: 8, perceivedLikelihood: 8, timeDelay: 2, effortSacrifice: 2 },
              });
            }}
            className="text-[#CAB792] hover:text-[#F5E8CE] hover:bg-white/[0.04] border border-white/[0.06]"
          >
            Criar Nova Oferta
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Main Wizard ───────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {/* Left — Form */}
      <div className="space-y-8">
        {/* Step Indicator — Premium horizontal stepper */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-5 left-[40px] right-[40px] h-px bg-white/[0.06]" />
          <div
            className="absolute top-5 left-[40px] h-px transition-all duration-500 ease-out"
            style={{
              width: `${((step - 1) / 3) * (100 - 10)}%`,
              background: 'linear-gradient(90deg, #E6B447, #AB8648)',
              boxShadow: '0 0 8px rgba(230,180,71,0.3)',
            }}
          />

          <div className="relative flex justify-between">
            {steps.map((s) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { if (isDone) setStep(s.id); }}
                  className={`flex flex-col items-center gap-2 transition-all duration-300 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive
                      ? 'border-[#E6B447] bg-[#E6B447]/15 shadow-[0_0_16px_rgba(230,180,71,0.25)]'
                      : isDone
                        ? 'border-[#7A9B5A] bg-[#7A9B5A]/15'
                        : 'border-white/[0.08] bg-white/[0.02]'
                    }
                  `}>
                    {isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#7A9B5A]" />
                    ) : (
                      <s.icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#E6B447]' : 'text-[#6B5D4A]'}`} />
                    )}
                  </div>
                  <span className={`text-[11px] font-mono tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-[#F5E8CE]' : isDone ? 'text-[#7A9B5A]' : 'text-[#6B5D4A]'
                  }`}>
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6B447]/60 mb-2">Passo 1 de 4</p>
                  <h2 className="text-[22px] font-bold text-[#F5E8CE] leading-tight">A Grande Promessa</h2>
                  <p className="text-[13px] text-[#6B5D4A] mt-1.5">O que seu cliente vai alcançar? Seja específico e audacioso.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-[#CAB792]">Sua Headline / Promessa Principal</label>
                    <Textarea
                      placeholder="Ex: Como faturar R$ 10k em 30 dias sem precisar de anúncios pagos..."
                      className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 min-h-[120px] text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl transition-all duration-200"
                      value={offer.promise}
                      onChange={(e) => setOffer({ ...offer, promise: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-[#CAB792]">Preço da Oferta (R$)</label>
                      <Input
                        type="number"
                        placeholder="497"
                        className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                        value={offer.corePrice || ''}
                        onChange={(e) => setOffer({ ...offer, corePrice: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-[#CAB792]">Valor Percebido (R$)</label>
                      <Input
                        type="number"
                        placeholder="2997"
                        className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                        value={offer.perceivedValue || ''}
                        onChange={(e) => setOffer({ ...offer, perceivedValue: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Value ratio indicator */}
                  {offer.corePrice > 0 && offer.perceivedValue > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <TrendingUp className={`w-4 h-4 ${offer.perceivedValue / offer.corePrice >= 10 ? 'text-[#7A9B5A]' : 'text-[#E6B447]'}`} />
                      <span className="text-[12px] text-[#CAB792]">
                        Ratio: <span className="font-mono font-bold text-[#F5E8CE]">{(offer.perceivedValue / offer.corePrice).toFixed(1)}x</span>
                        {offer.perceivedValue / offer.corePrice < 10 && (
                          <span className="text-[#6B5D4A] ml-1">(ideal: 10x+)</span>
                        )}
                      </span>
                    </motion.div>
                  )}
                </div>
                <StepFeedback step={1} offer={offer} onUpdate={setOffer} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6B447]/60 mb-2">Passo 2 de 4</p>
                  <h2 className="text-[22px] font-bold text-[#F5E8CE] leading-tight">Empilhamento de Valor</h2>
                  <p className="text-[13px] text-[#6B5D4A] mt-1.5">Empilhe os componentes do produto para que o preço pareça insignificante.</p>
                </div>

                {offer.stacking.length > 0 && (
                  <div className="space-y-3">
                    {offer.stacking.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 group hover:border-white/[0.1] transition-colors duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#E6B447]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[12px] font-mono font-bold text-[#E6B447]">{idx + 1}</span>
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nome do módulo/entregável"
                              className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                              value={item.name}
                              onChange={(e) => {
                                const updated = offer.stacking.map(s => s.id === item.id ? { ...s, name: e.target.value } : s);
                                setOffer({ ...offer, stacking: updated });
                              }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Valor percebido (R$)</label>
                                <Input
                                  type="number"
                                  placeholder="997"
                                  className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                                  value={item.value || ''}
                                  onChange={(e) => {
                                    const updated = offer.stacking.map(s => s.id === item.id ? { ...s, value: Number(e.target.value) } : s);
                                    setOffer({ ...offer, stacking: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Descrição (opcional)</label>
                                <Input
                                  placeholder="Ex: 12 aulas em vídeo"
                                  className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const updated = offer.stacking.map(s => s.id === item.id ? { ...s, description: e.target.value } : s);
                                    setOffer({ ...offer, stacking: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOffer({ ...offer, stacking: offer.stacking.filter(s => s.id !== item.id) })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B5D4A] hover:text-[#C45B3A] hover:bg-[#C45B3A]/10 transition-all duration-200 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {/* Total value */}
                    <div className="flex justify-end items-center gap-2 px-1">
                      <span className="text-[11px] font-mono text-[#6B5D4A] uppercase tracking-wider">Valor empilhado:</span>
                      <span className="text-[14px] font-mono font-bold text-[#F5E8CE]">
                        R$ {offer.stacking.reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setOffer({
                    ...offer,
                    stacking: [...offer.stacking, { id: crypto.randomUUID(), name: '', value: 0, description: '' }]
                  })}
                  className="w-full py-5 rounded-xl border-2 border-dashed border-white/[0.06] hover:border-[#E6B447]/20 bg-transparent hover:bg-[#E6B447]/[0.02] transition-all duration-200 flex items-center justify-center gap-2 text-[13px] text-[#6B5D4A] hover:text-[#E6B447]"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item ao Stack
                </button>
                <StepFeedback step={2} offer={offer} onUpdate={setOffer} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6B447]/60 mb-2">Passo 3 de 4</p>
                  <h2 className="text-[22px] font-bold text-[#F5E8CE] leading-tight">Bônus Irresistíveis</h2>
                  <p className="text-[13px] text-[#6B5D4A] mt-1.5">Bônus devem resolver as próximas objeções ou acelerar o resultado.</p>
                </div>

                {/* Expert tip */}
                <div className="relative rounded-xl border border-[#E6B447]/10 bg-[#E6B447]/[0.03] p-4 flex items-start gap-4 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E6B447]/20 to-transparent" />
                  <div className="w-9 h-9 rounded-lg bg-[#E6B447]/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-[#E6B447]" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#F5E8CE]">Dica do Especialista</h4>
                    <p className="text-[12px] text-[#CAB792] mt-1 leading-relaxed italic">
                      &ldquo;O bônus não deve ser apenas mais conteúdo. Ele deve resolver um problema que o produto principal cria.&rdquo;
                    </p>
                    <p className="text-[10px] text-[#6B5D4A] mt-1">— Russell Brunson</p>
                  </div>
                </div>

                {offer.bonuses.length > 0 && (
                  <div className="space-y-3">
                    {offer.bonuses.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 group hover:border-white/[0.1] transition-colors duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#E6B447]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Gift className="w-4 h-4 text-[#E6B447]" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nome do bônus"
                              className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                              value={item.name}
                              onChange={(e) => {
                                const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, name: e.target.value } : b);
                                setOffer({ ...offer, bonuses: updated });
                              }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Valor percebido (R$)</label>
                                <Input
                                  type="number"
                                  placeholder="497"
                                  className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                                  value={item.value || ''}
                                  onChange={(e) => {
                                    const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, value: Number(e.target.value) } : b);
                                    setOffer({ ...offer, bonuses: updated });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Qual objeção resolve?</label>
                                <Input
                                  placeholder="Ex: Não tenho tempo"
                                  className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const updated = offer.bonuses.map(b => b.id === item.id ? { ...b, description: e.target.value } : b);
                                    setOffer({ ...offer, bonuses: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOffer({ ...offer, bonuses: offer.bonuses.filter(b => b.id !== item.id) })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B5D4A] hover:text-[#C45B3A] hover:bg-[#C45B3A]/10 transition-all duration-200 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    <div className="flex justify-end items-center gap-2 px-1">
                      <span className="text-[11px] font-mono text-[#6B5D4A] uppercase tracking-wider">Total em bônus:</span>
                      <span className="text-[14px] font-mono font-bold text-[#F5E8CE]">
                        R$ {offer.bonuses.reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setOffer({
                    ...offer,
                    bonuses: [...offer.bonuses, { id: crypto.randomUUID(), name: '', value: 0, description: '' }]
                  })}
                  className="w-full py-5 rounded-xl border-2 border-dashed border-white/[0.06] hover:border-[#E6B447]/20 bg-transparent hover:bg-[#E6B447]/[0.02] transition-all duration-200 flex items-center justify-center gap-2 text-[13px] text-[#6B5D4A] hover:text-[#E6B447]"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Bônus
                </button>
                <StepFeedback step={3} offer={offer} onUpdate={setOffer} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6B447]/60 mb-2">Passo 4 de 4</p>
                  <h2 className="text-[22px] font-bold text-[#F5E8CE] leading-tight">Escassez & Garantia</h2>
                  <p className="text-[13px] text-[#6B5D4A] mt-1.5">Por que devem comprar AGORA e por que o risco é ZERO?</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-[#CAB792] flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#E6B447]" />
                      Gatilho de Escassez / Urgência
                    </label>
                    <Input
                      placeholder="Ex: Apenas 50 vagas ou disponível até domingo..."
                      className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl"
                      value={offer.scarcity}
                      onChange={(e) => setOffer({ ...offer, scarcity: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-[#CAB792] flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#7A9B5A]" />
                      Reversão de Risco (Garantia)
                    </label>
                    <Textarea
                      placeholder="Ex: 30 dias de garantia incondicional + Desafio de 90 dias..."
                      className="bg-white/[0.03] border-white/[0.06] focus:border-[#E6B447]/50 focus:ring-1 focus:ring-[#E6B447]/20 min-h-[120px] text-[#F5E8CE] placeholder:text-[#6B5D4A] rounded-xl transition-all duration-200"
                      value={offer.riskReversal}
                      onChange={(e) => setOffer({ ...offer, riskReversal: e.target.value })}
                    />
                  </div>
                </div>
                <StepFeedback step={4} offer={offer} onUpdate={setOffer} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-white/[0.04]">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className="text-[#6B5D4A] hover:text-[#F5E8CE] hover:bg-white/[0.04] disabled:opacity-30 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={nextStep}
            disabled={isSaving || isEvaluating}
            className="bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C] px-8 font-semibold shadow-[0_1px_3px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(230,180,71,0.4)] gap-2 transition-all duration-200"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Avaliando...
              </>
            ) : step === 4 ? (
              <>
                Avaliar com o Conselho
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Próximo Passo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right — Sidebar */}
      <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        {/* Score Gauge */}
        <div className="rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent p-6 text-center overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-[#E6B447]/5 blur-[60px] pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B5D4A] mb-4 flex items-center justify-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Score de Irresistibilidade
            </p>
            <ScoreGauge score={result.total} size={150} />

            {/* Low score contextual feedback */}
            {result.total > 0 && result.total < 60 && (
              <div className="space-y-1.5 mt-5 text-left">
                {offer.scoringFactors.dreamOutcome < 5 && (
                  <div className="flex gap-2 text-[11px] text-[#E6B447]/70 leading-tight">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Resultado desejado baixo — defina um sonho mais ambicioso</span>
                  </div>
                )}
                {offer.scoringFactors.perceivedLikelihood < 5 && (
                  <div className="flex gap-2 text-[11px] text-[#E6B447]/70 leading-tight">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Probabilidade percebida baixa — adicione provas e garantias</span>
                  </div>
                )}
                {offer.scoringFactors.timeDelay > 5 && (
                  <div className="flex gap-2 text-[11px] text-[#E6B447]/70 leading-tight">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Tempo percebido alto — adicione bônus de aceleração</span>
                  </div>
                )}
                {offer.scoringFactors.effortSacrifice > 5 && (
                  <div className="flex gap-2 text-[11px] text-[#E6B447]/70 leading-tight">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>Esforço percebido alto — simplifique o processo</span>
                  </div>
                )}
              </div>
            )}

            {/* Insights */}
            {result.analysis.length > 0 && (
              <div className="space-y-1.5 mt-5 text-left">
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Insights</p>
                {result.analysis.map((insight, i) => (
                  <div key={i} className="flex gap-2 text-[11px] text-[#CAB792] leading-tight">
                    <Sparkles className="w-3 h-3 text-[#E6B447]/50 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hormozi Factors */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-4 h-4 text-[#E6B447]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Fatores de Valor</span>
          </div>

          <div className="flex gap-2 p-2.5 bg-[#E6B447]/[0.04] border border-[#E6B447]/10 rounded-lg">
            <Info className="w-3.5 h-3.5 text-[#E6B447]/60 shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#E6B447]/60 leading-relaxed">
              Estes sliders controlam ~40% do score. Os outros 60% vêm do conteúdo dos steps.
            </p>
          </div>

          <div className="space-y-4">
            <PremiumSlider
              label="Resultado Desejado"
              value={offer.scoringFactors.dreamOutcome}
              onChange={(v) => setOffer({ ...offer, scoringFactors: { ...offer.scoringFactors, dreamOutcome: v } })}
            />
            <PremiumSlider
              label="Probabilidade Percebida"
              value={offer.scoringFactors.perceivedLikelihood}
              onChange={(v) => setOffer({ ...offer, scoringFactors: { ...offer.scoringFactors, perceivedLikelihood: v } })}
            />
            <PremiumSlider
              label="Velocidade do Resultado"
              value={11 - offer.scoringFactors.timeDelay}
              onChange={(v) => setOffer({ ...offer, scoringFactors: { ...offer.scoringFactors, timeDelay: 11 - v } })}
              hint={{ low: 'Lento', high: 'Rápido' }}
            />
            <PremiumSlider
              label="Facilidade de Execução"
              value={11 - offer.scoringFactors.effortSacrifice}
              onChange={(v) => setOffer({ ...offer, scoringFactors: { ...offer.scoringFactors, effortSacrifice: 11 - v } })}
              hint={{ low: 'Difícil', high: 'Fácil' }}
            />
          </div>
        </div>

        {/* Value Equation Guide */}
        <ValueEquationGuide />

        {/* Checklist */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#7A9B5A]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#6B5D4A]">Checklist</span>
            </div>
            <span className="text-[11px] font-mono text-[#6B5D4A]">
              <span className="text-[#F5E8CE] font-bold">{checklistDone}</span>/{checklist.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px]">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                  item.met
                    ? 'bg-[#7A9B5A]/15 text-[#7A9B5A]'
                    : 'bg-white/[0.04] text-[#6B5D4A]'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className={`transition-colors duration-300 ${item.met ? 'text-[#CAB792]' : 'text-[#6B5D4A]'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(checklistDone / checklist.length) * 100}%`,
                background: checklistDone === checklist.length
                  ? 'linear-gradient(90deg, #7A9B5A, #9BC77B)'
                  : 'linear-gradient(90deg, #E6B447, #AB8648)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
