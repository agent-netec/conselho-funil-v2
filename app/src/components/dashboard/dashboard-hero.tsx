'use client';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Brand } from '@/types/database';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

export type DashboardState = 'pre-briefing' | 'post-aha' | 'active' | 'loading' | 'welcome';

interface DashboardHeroProps {
  state: DashboardState;
  brand?: Brand | null;
  verdict?: VerdictOutput | null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getScoreClass(value: number) {
  if (value >= 8) return 'border-[#E6B447]/30 bg-[#E6B447]/5 text-[#E6B447]';
  if (value >= 5) return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
  return 'border-[#C45B3A]/30 bg-[#C45B3A]/5 text-[#C45B3A]';
}

export function DashboardHero({ state, brand, verdict }: DashboardHeroProps) {
  const greeting = getGreeting();

  const statusConfig: Record<DashboardState, { label: string; glow: boolean }> = {
    loading: { label: 'SYNC', glow: false },
    welcome: { label: 'SETUP', glow: false },
    'pre-briefing': { label: 'BRIEFING PENDENTE', glow: false },
    'post-aha': { label: 'VEREDITO PRONTO', glow: true },
    active: { label: 'OPERACIONAL', glow: true },
  };

  const { label, glow } = statusConfig[state];

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#2A2318] pb-5">
      <div className="flex items-center gap-3 min-w-0">
        {/* Status dot + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={`h-2 w-2 rounded-full transition-shadow ${
              glow
                ? 'bg-[#E6B447] shadow-[0_0_8px_rgba(230,180,71,0.4)]'
                : 'bg-[#6B5D4A]'
            }`}
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
            {label}
          </span>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-4 bg-[#2A2318]" />

        {/* Greeting */}
        <h2 className="text-base sm:text-lg font-semibold text-[#F5E8CE] tracking-tight truncate">
          {greeting}, <span className="text-[#E6B447]">Estrategista</span>.
        </h2>
      </div>

      {/* Right: status pills */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {state === 'post-aha' && verdict && (
          <>
            <Badge
              variant="outline"
              className={`font-mono text-[10px] rounded-md ${getScoreClass(verdict.scores.positioning.value)}`}
            >
              POS {verdict.scores.positioning.value}/10
            </Badge>
            <Badge
              variant="outline"
              className={`font-mono text-[10px] rounded-md ${getScoreClass(verdict.scores.offer.value)}`}
            >
              OFR {verdict.scores.offer.value}/10
            </Badge>
          </>
        )}

        {state === 'active' && (
          <Badge
            variant="outline"
            className="border-[#3D3428] text-[#6B5D4A] font-mono text-[10px] rounded-md"
          >
            GEMINI 2.5
          </Badge>
        )}
      </div>
    </div>
  );
}
