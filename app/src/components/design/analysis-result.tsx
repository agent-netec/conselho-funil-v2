'use client';

import { AlertTriangle, Lightbulb, BookOpen, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieceRoleBadge } from './piece-role-badge';
import type { DesignAnalysis, DesignPieceRole } from '@/types/design-system';

interface AnalysisResultProps {
  analysis: DesignAnalysis;
  className?: string;
}

export function AnalysisResult({ analysis, className }: AnalysisResultProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Context Summary */}
      <div className="p-4 rounded-xl bg-[#E6B447]/5 border border-[#E6B447]/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#E6B447]/10 text-[#E6B447] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#E6B447] tracking-wider mb-1">Análise do Diretor</p>
            <p className="text-sm text-zinc-200 leading-relaxed">{analysis.contextSummary}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-zinc-500">Perfil C.H.A.P.E.U:</span>
              <span className="text-[10px] font-bold text-[#E6B447] bg-[#E6B447]/10 px-2 py-0.5 rounded-full border border-[#E6B447]/20">
                {analysis.chapeuProfile}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges */}
      {analysis.challenges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Desafios Identificados
          </p>
          <div className="space-y-1.5">
            {analysis.challenges.map((challenge, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-[10px] font-bold text-amber-400 shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-[11px] text-zinc-300 leading-snug">{challenge}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-[#E6B447]" />
            Recomendações
          </p>
          <div className="space-y-1.5">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#E6B447]/5 border border-[#E6B447]/10">
                <CheckCircle2 className="w-3 h-3 text-[#E6B447] shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-300 leading-snug">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Pieces */}
      {analysis.recommendedPieces.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
            Sistema Visual Recomendado ({analysis.recommendedPieces.length} peças)
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {analysis.recommendedPieces.map((piece, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/30 border border-white/[0.05] space-y-2">
                <div className="flex items-center justify-between">
                  <PieceRoleBadge role={piece.role as DesignPieceRole} />
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {piece.platform} · {piece.format} · {piece.aspectRatio}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">{piece.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
