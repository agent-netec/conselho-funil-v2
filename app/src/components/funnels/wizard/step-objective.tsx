import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OBJECTIVES = [
  { id: 'leads', label: 'Captar Leads', description: 'Crescer lista, gerar awareness', icon: '📧' },
  { id: 'sales', label: 'Vender Direto', description: 'Converter em compra imediata', icon: '💰' },
  { id: 'calls', label: 'Agendar Calls', description: 'Qualificar e levar para conversa', icon: '📞' },
  { id: 'retention', label: 'Reter/Upsell', description: 'Aumentar LTV de clientes', icon: '🔄' },
] as const;

interface StepObjectiveProps {
  objective: string;
  onUpdate: (value: string) => void;
}

export function StepObjective({ objective, onUpdate }: StepObjectiveProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Qual é o objetivo deste funil?
        </h3>
        <p className="text-sm text-zinc-500">
          Isso define a estrutura e métricas do seu funil
        </p>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {OBJECTIVES.map((obj) => (
          <motion.button
            key={obj.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpdate(obj.id)}
            className={cn(
              'relative rounded-xl border p-5 text-left transition-all',
              objective === obj.id
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
            )}
          >
            {objective === obj.id && (
              <div className="absolute top-3 right-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            <span className="text-2xl mb-3 block">{obj.icon}</span>
            <div className="font-medium text-white">{obj.label}</div>
            <div className="text-sm text-zinc-500 mt-1">{obj.description}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

