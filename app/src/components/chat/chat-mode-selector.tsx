'use client';

import { cn } from '@/lib/utils';
import { Zap, Target, Pencil, Share2, BarChart3, Palette, Users } from 'lucide-react';
import { CHAT_MODES } from '@/lib/constants';

export type ChatMode = 'general' | 'funnel' | 'copy' | 'social' | 'ads' | 'design' | 'party';

interface ChatModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const MODE_ICONS = {
  general: Zap,
  funnel: Target,
  copy: Pencil,
  social: Share2,
  ads: BarChart3,
  design: Palette,
  party: Users,
} as const;

export function ChatModeSelector({ 
  mode, 
  onModeChange 
}: ChatModeSelectorProps) {
  // Debug: console.log('Available modes:', Object.keys(CHAT_MODES));
  
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/50 border border-white/[0.04] max-w-full overflow-x-auto no-scrollbar">
      {(Object.entries(CHAT_MODES) as [ChatMode, any][]).map(([key, config]) => {
        const Icon = MODE_ICONS[key] || Zap;
        const isActive = mode === key;
        
        return (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-all flex-shrink-0',
              isActive
                ? key === 'funnel' 
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : key === 'copy'
                  ? 'bg-amber-500/20 text-amber-400'
                  : key === 'social'
                  ? 'bg-rose-500/20 text-rose-400'
                  : key === 'design'
                  ? 'bg-purple-500/20 text-purple-400'
                  : key === 'party'
                  ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.1)]'
                  : 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            )}
            title={config.label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className={cn("hidden xs:inline", isActive && "inline")}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

