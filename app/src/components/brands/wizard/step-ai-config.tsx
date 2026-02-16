import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepAiConfigProps {
  aiProfile: string;
  onUpdate: (field: string, value: any) => void;
}

const AI_PRESETS = [
  {
    id: 'equilibrado',
    label: 'Equilibrado',
    emoji: '⚖️',
    desc: 'Balanço entre criatividade e precisão. Ideal para a maioria dos casos.',
    temp: 0.6,
    topP: 0.85,
    color: 'emerald',
  },
  {
    id: 'criativo',
    label: 'Criativo',
    emoji: '🎨',
    desc: 'Mais liberdade para a IA. Ótimo para brainstorming e ideias fora da caixa.',
    temp: 0.8,
    topP: 0.9,
    color: 'purple',
  },
  {
    id: 'agressivo',
    label: 'Agressivo',
    emoji: '🔥',
    desc: 'Máxima ousadia. Copies provocadoras e CTAs de alto impacto.',
    temp: 0.9,
    topP: 0.95,
    color: 'red',
  },
  {
    id: 'sobrio',
    label: 'Sóbrio',
    emoji: '🎯',
    desc: 'Mínima variação. Textos precisos, formais e conservadores.',
    temp: 0.3,
    topP: 0.7,
    color: 'blue',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400' },
  red: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400' },
  blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' },
};

export function StepAiConfig({ aiProfile, onUpdate }: StepAiConfigProps) {
  return (
    <motion.div
      key="step6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 mb-3">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-white mb-1">Personalidade da IA</h3>
        <p className="text-xs text-zinc-500">
          Como a IA deve se comportar ao gerar conteúdo para esta marca?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AI_PRESETS.map((preset) => {
          const colors = COLOR_MAP[preset.color];
          const isSelected = aiProfile === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onUpdate('aiProfile', preset.id)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                isSelected
                  ? `${colors.bg} ${colors.border} ring-1 ring-inset ring-white/[0.05]`
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{preset.emoji}</span>
                <span className={cn(
                  'text-sm font-semibold',
                  isSelected ? colors.text : 'text-white'
                )}>
                  {preset.label}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {preset.desc}
              </p>
              <div className="mt-3 flex gap-3 text-[10px] text-zinc-600">
                <span>Temp: {preset.temp}</span>
                <span>TopP: {preset.topP}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[11px] text-zinc-500 text-center">
          Você pode ajustar temperatura e top-p com mais precisão depois no Brand Hub.
        </p>
      </div>
    </motion.div>
  );
}
