'use client';

import { Target, MessageSquare, Sparkles, Palette, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextReviewPanelProps {
  context: {
    objective?: string;
    targetAudience?: string;
    bigIdea?: string;
    tone?: string;
    hooks?: string[];
    mainScript?: string;
    visualStyle?: string;
    awareness?: string;
    brandColors?: string[];
  };
  className?: string;
}

export function ContextReviewPanel({ context, className }: ContextReviewPanelProps) {
  const items = [
    { icon: Target, label: 'Objetivo', value: context.objective },
    { icon: Users, label: 'Público-Alvo', value: context.targetAudience },
    { icon: Eye, label: 'Consciência', value: context.awareness },
    { icon: Sparkles, label: 'Big Idea', value: context.bigIdea },
    { icon: MessageSquare, label: 'Tom', value: context.tone },
    { icon: Palette, label: 'Estilo Visual', value: context.visualStyle },
  ].filter(item => item.value);

  return (
    <div className={cn('rounded-xl border border-white/[0.05] bg-white/[0.02] p-5', className)}>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-[#E6B447]" />
        Contexto Recebido (Linha de Ouro)
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/[0.03]">
              <div className="p-1.5 rounded-md bg-[#E6B447]/10 text-[#E6B447] shrink-0 mt-0.5">
                <Icon className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">{item.label}</p>
                <p className="text-[11px] text-zinc-300 leading-snug mt-0.5 line-clamp-2">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {context.hooks && context.hooks.length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-black/30 border border-white/[0.03]">
          <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider mb-1.5">Hooks Aprovados</p>
          <div className="flex flex-wrap gap-1.5">
            {context.hooks.slice(0, 5).map((hook, i) => (
              <span key={i} className="text-[10px] text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-white/[0.05] line-clamp-1">
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}

      {context.brandColors && context.brandColors.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <p className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Paleta:</p>
          <div className="flex gap-1">
            {context.brandColors.map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
