'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  isMobile?: boolean;
}

export function OnboardingChecklist({ isMobile = false }: OnboardingChecklistProps) {
  const { steps, completedSteps, dismissed, dismiss } = useOnboardingStore();

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
  }, []);

  if (dismissed) return null;

  const progress = steps.length > 0
    ? Math.round((completedSteps.length / steps.length) * 100)
    : 0;

  // Auto-dismiss when all steps complete
  if (completedSteps.length >= steps.length) return null;

  if (isMobile) {
    return (
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Primeiros Passos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-bold">{progress}%</span>
            <button onClick={dismiss} className="p-1 text-zinc-600 hover:text-zinc-400">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-1.5">
          {steps.map((step) => {
            const isComplete = completedSteps.includes(step.id);
            return (
              <Link
                key={step.id}
                href={step.href}
                className={cn(
                  'flex items-center gap-2 text-xs py-1 transition-colors',
                  isComplete ? 'text-zinc-600 line-through' : 'text-zinc-400 hover:text-emerald-400'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                )}
                {step.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: compact progress indicator
  return (
    <div className="w-full px-3 py-2">
      <div
        className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 cursor-pointer group"
        title={`Primeiros Passos: ${progress}% completo`}
      >
        <Rocket className="h-4 w-4 text-emerald-400" />
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[9px] text-emerald-400/70 font-bold">{progress}%</span>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-2.5 w-2.5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
