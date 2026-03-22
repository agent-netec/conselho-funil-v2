'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Target, ArrowRight, Shield, Zap, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';
import Image from 'next/image';

interface VerdictFullscreenProps {
  brandId: string;
  brandName: string;
}

// ---------------------------------------------------------------------------
// Animated score counter
// ---------------------------------------------------------------------------

function AnimatedScore({ value, max = 10, delay = 0 }: { value: number; max?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200;
      const start = Date.now();
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * value);
        if (current !== ref.current) {
          ref.current = current;
          setDisplayed(current);
        }
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const color = displayed >= 7 ? '#E6B447' : displayed >= 5 ? '#CAB792' : '#C45B3A';

  return (
    <div className="text-center">
      <span
        className="font-mono text-6xl font-black tabular-nums leading-none"
        style={{
          color,
          textShadow: displayed >= 7
            ? '0 0 32px rgba(230,180,71,0.35), 0 0 12px rgba(230,180,71,0.2)'
            : 'none',
        }}
      >
        {displayed}
      </span>
      <span className="text-2xl font-mono text-[#6B5D4A] font-bold">/{max}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score dimension card
// ---------------------------------------------------------------------------

function ScoreCard({ name, score, feedback, delay }: {
  name: string; score: number; feedback: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-[#2A2318] bg-[#1A1612] p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
          {name}
        </span>
        <AnimatedScore value={score} delay={delay * 1000 + 500} />
      </div>
      <div className="h-1.5 bg-[#241F19] rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: score >= 5 ? '#E6B447' : '#C45B3A' }}
        />
      </div>
      <p className="text-xs text-[#CAB792] leading-relaxed">{feedback}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading state — real work happening
// ---------------------------------------------------------------------------

function VerdictLoading({ brandName }: { brandName: string }) {
  const [step, setStep] = useState(0);
  const steps = [
    'Analisando posicionamento...',
    'Avaliando proposta de valor...',
    'Identificando oportunidades...',
    'Preparando diagnostico...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0B09]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06)_0%,transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.div
          className="relative mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute rounded-full bg-[#E6B447]/10 blur-xl animate-pulse"
            style={{ width: 120, height: 120, top: -20, left: -20 }} />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E6B447] to-[#AB8648] shadow-lg shadow-[#E6B447]/20">
            <Brain className="h-10 w-10 text-[#0D0B09]" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-[#F5E8CE] mb-2">
          Diagnosticando: {brandName}
        </h2>

        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-[#CAB792] mb-6"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>

        <Loader2 className="h-5 w-5 text-[#E6B447] animate-spin" />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main fullscreen verdict
// ---------------------------------------------------------------------------

export function VerdictFullscreen({ brandId, brandName }: VerdictFullscreenProps) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<VerdictOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const h = await getAuthHeaders();
        const res = await fetch(`/api/brands/${brandId}/verdict`, {
          method: 'POST',
          headers: h,
        });
        if (cancelled) return;
        const json = await res.json();
        if (json.data?.verdict) {
          setVerdict(json.data.verdict);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [brandId]);

  if (loading) return <VerdictLoading brandName={brandName} />;

  if (error || !verdict) {
    // Fallback: skip to dashboard
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0B09]"
      >
        <div className="text-center px-6">
          <p className="text-[#CAB792] mb-4">Diagnostico sera gerado em instantes.</p>
          <Button onClick={() => router.push('/home')} className="btn-accent">
            Ir para o Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  const overallScore = Math.round(
    (verdict.scores.positioning.value + verdict.scores.offer.value) / 2
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0D0B09]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,180,71,0.04)_0%,transparent_60%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="mb-4 mx-auto flex items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E6B447]/10 overflow-hidden flex-shrink-0">
                <Image src="/counselors/david_ogilvy.svg" alt="David Ogilvy" width={40} height={40} className="rounded-xl" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-[#E6B447]">David Ogilvy</span>
                <span className="block text-[10px] text-[#6B5D4A] font-mono uppercase tracking-wider">Conselheiro de Posicionamento</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#F5E8CE] mb-1">
              Diagnostico: {verdict.brandName}
            </h1>
            <p className="text-sm text-[#6B5D4A]">Seus conselheiros analisaram sua marca</p>
          </motion.div>

          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center"
          >
            <div className="rounded-2xl border border-[#2A2318] bg-[#1A1612] px-12 py-8 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B5D4A] block mb-2">
                Score Geral
              </span>
              <AnimatedScore value={overallScore} max={10} delay={800} />
            </div>
          </motion.div>

          {/* Dimension Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScoreCard
              name="Posicionamento"
              score={verdict.scores.positioning.value}
              feedback={verdict.scores.positioning.label}
              delay={1}
            />
            <ScoreCard
              name="Oferta"
              score={verdict.scores.offer.value}
              feedback={verdict.scores.offer.label}
              delay={1.2}
            />
          </div>

          {/* Strengths & Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="rounded-xl border border-[#2A2318] bg-[#1A1612] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-[#7A9B5A]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A9B5A]">
                  Pontos Fortes
                </span>
              </div>
              <ul className="space-y-2">
                {verdict.analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#CAB792]">
                    <span className="text-[#7A9B5A] mt-0.5 flex-shrink-0">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#2A2318] bg-[#1A1612] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-[#E6B447]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#E6B447]">
                  Oportunidades
                </span>
              </div>
              <ul className="space-y-2">
                {verdict.analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#CAB792]">
                    <span className="text-[#E6B447] mt-0.5 flex-shrink-0">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Top Action */}
          {verdict.actions?.[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8 }}
              className="rounded-xl border border-[#E6B447]/20 bg-[#E6B447]/5 p-5"
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#E6B447] block mb-1">
                Recomendacao principal
              </span>
              <p className="text-sm font-medium text-[#F5E8CE]">{verdict.actions[0].title}</p>
              <p className="text-xs text-[#CAB792] mt-1">{verdict.actions[0].description}</p>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.1 }}
            className="text-center space-y-3 pt-4"
          >
            <Button
              size="lg"
              onClick={() => router.push('/funnels/new')}
              className="bg-gradient-to-r from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold hover:from-[#F0C35C] hover:to-[#E6B447] px-8 py-3 text-base"
            >
              Criar seu primeiro funil
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-[#6B5D4A]">
              Baseado no seu diagnostico, recomendamos comecar por aqui
            </p>
            <button
              onClick={() => router.push('/home')}
              className="text-[11px] text-[#6B5D4A] hover:text-[#AB8648] transition-colors"
            >
              Ir para o Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
