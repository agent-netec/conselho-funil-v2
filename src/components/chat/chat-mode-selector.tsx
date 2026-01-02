'use client';

import { cn } from '@/lib/utils';
import { Zap, Target, Pencil, Share2 } from 'lucide-react';
import { CHAT_MODES } from '@/lib/constants';

export type ChatMode = 'general' | 'funnel' | 'copy' | 'social';

const MODE_ICONS = {
  general: Zap,
  funnel: Target,
  copy: Pencil,
  social: Share2,
} as const;

interface ChatModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatModeSelector({ 
  mode, 
  onModeChange 
}: ChatModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
      {(Object.entries(CHAT_MODES) as [ChatMode, typeof CHAT_MODES.general][]).map(([key, config]) => {
        const Icon = MODE_ICONS[key];
        const isActive = mode === key;
        
        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              isActive
                ? key === 'funnel' 
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : key === 'copy'
                  ? 'bg-amber-500/20 text-amber-400'
                  : key === 'social'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            )}
            title={config.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

