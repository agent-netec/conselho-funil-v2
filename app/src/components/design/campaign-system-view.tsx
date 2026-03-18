'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, Layers } from 'lucide-react';
import { PieceRoleBadge } from './piece-role-badge';
import type { DesignPieceRole } from '@/types/design-system';

interface CampaignPiece {
  role: DesignPieceRole;
  platform: string;
  format: string;
  aspectRatio: string;
  rationale: string;
  visualPrompt?: string;
}

interface CampaignSystemViewProps {
  pieces: CampaignPiece[];
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function CampaignSystemView({ pieces, enabled, onToggle, className }: CampaignSystemViewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#E6B447]/10 text-[#E6B447]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Sistema de Campanha Visual</p>
            <p className="text-[10px] text-zinc-500">Peças interconectadas com DNA visual compartilhado</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors',
            enabled ? 'bg-[#E6B447]' : 'bg-zinc-700'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
              enabled && 'translate-x-5'
            )}
          />
        </button>
      </div>

      {/* Pieces flow */}
      {enabled && pieces.length > 0 && (
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {pieces.map((piece, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="w-52 p-3 rounded-xl bg-black/30 border border-white/[0.05] space-y-2">
                <div className="flex items-center justify-between">
                  <PieceRoleBadge role={piece.role} size="md" />
                  <span className="text-[9px] text-zinc-600 font-mono">#{i + 1}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">
                    {piece.platform} · {piece.format} · {piece.aspectRatio}
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-snug line-clamp-3">{piece.rationale}</p>
                </div>
              </div>
              {i < pieces.length - 1 && (
                <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {enabled && pieces.length === 0 && (
        <div className="p-6 rounded-xl border border-dashed border-white/10 text-center">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">O sistema de peças será gerado na etapa de planejamento</p>
        </div>
      )}
    </div>
  );
}
