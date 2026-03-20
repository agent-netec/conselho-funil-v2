'use client';

import { cn } from '@/lib/utils';
import { Zap, Target, Users } from 'lucide-react';
import { CHAT_MODES } from '@/lib/constants';

// Sprint 05.1: 3 core modes only
export type ChatMode = 'general' | 'campaign' | 'party';

// Legacy mode mapping — old modes map to general or campaign
export function mapLegacyMode(mode: string): ChatMode {
  if (mode === 'party') return 'party';
  if (['funnel', 'copy', 'social', 'ads', 'design', 'campaign'].includes(mode)) return 'campaign';
  return 'general';
}

interface ChatModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const MODE_CONFIG: { key: ChatMode; icon: typeof Zap; label: string }[] = [
  { key: 'general', icon: Zap, label: 'Geral' },
  { key: 'campaign', icon: Target, label: 'Campanha' },
  { key: 'party', icon: Users, label: 'Party' },
];

export function ChatModeSelector({
  mode,
  onModeChange
}: ChatModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
      {MODE_CONFIG.map(({ key, icon: Icon, label }) => {
        const isActive = mode === key;

        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              isActive
                ? key === 'campaign'
                  ? 'bg-amber-500/20 text-amber-400'
                  : key === 'party'
                  ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                  : 'bg-[#E6B447]/20 text-[#E6B447]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
