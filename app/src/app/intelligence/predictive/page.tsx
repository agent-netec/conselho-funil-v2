"use client";

import React from 'react';
import { ScaleSimulator } from '@/components/intelligence/predictive/ScaleSimulator';
import { Sparkles, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * @fileoverview Página de Inteligência Preditiva (ST-22.4)
 */

export default function PredictiveIntelligencePage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 px-2">
              <Sparkles size={12} />
              Alpha v2.0
            </Badge>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Intelligence Wing</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Inteligência <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Preditiva</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
            Dashboard preditivo com visão de churn, LTV, forecast de audiência e simulador de escala.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-2 rounded-lg border border-white/5">
          <Info size={14} className="text-purple-400" />
          Modelos recalibrados há 4 horas
        </div>
      </div>

      {/* Main Content */}
      <ScaleSimulator />

      {/* Footer / Disclaimer */}
      <div className="pt-8 border-t border-white/5">
        <p className="text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em]">
          NETECMT Predictive Engine • Proprietary Algorithm • Sprint 22
        </p>
      </div>
    </div>
  );
}
