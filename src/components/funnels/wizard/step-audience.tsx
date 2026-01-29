import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const AWARENESS_LEVELS = [
  { id: 'unaware', label: 'Não sabe que tem problema', short: 'Inconsciente' },
  { id: 'problem', label: 'Sabe do problema', short: 'Problema' },
  { id: 'solution', label: 'Conhece soluções', short: 'Solução' },
  { id: 'product', label: 'Conhece seu produto', short: 'Produto' },
] as const;

interface StepAudienceProps {
  formData: {
    audience: string;
    pain: string;
    awareness: string;
    objection: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function StepAudience({ formData, onUpdate }: StepAudienceProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Descreva seu público-alvo
        </h3>
        <p className="text-sm text-zinc-500">
          Quanto mais específico, melhores as recomendações
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Cliente ideal *
          </label>
          <Textarea
            value={formData.audience}
            onChange={(e) => onUpdate('audience', e.target.value)}
            placeholder="Ex: Empresários de e-commerce faturando R$50-500k/mês que querem escalar"
            className="input-premium min-h-[100px]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Principal dor *
          </label>
          <Textarea
            value={formData.pain}
            onChange={(e) => onUpdate('pain', e.target.value)}
            placeholder="Ex: Gastam muito tempo em tarefas operacionais e não conseguem escalar"
            className="input-premium min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Nível de consciência
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AWARENESS_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => onUpdate('awareness', level.id)}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-center text-sm transition-all',
                  formData.awareness === level.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300'
                )}
              >
                {level.short}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Principal objeção
          </label>
          <Input
            value={formData.objection}
            onChange={(e) => onUpdate('objection', e.target.value)}
            placeholder="Ex: Não tenho tempo para implementar"
            className="input-premium"
          />
        </div>
      </div>
    </motion.div>
  );
}

