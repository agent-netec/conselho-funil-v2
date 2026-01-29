import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OBJECTIVES } from './step-objective';

interface StepConfirmProps {
  formData: {
    name: string;
    objective: string;
    audience: string;
    product: string;
    ticket: string;
    primaryChannel: string;
    secondaryChannel: string;
  };
  onUpdate: (field: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepConfirm({ formData, onUpdate, onSubmit, isSubmitting }: StepConfirmProps) {
  const summaryItems = [
    { label: 'Objetivo', value: OBJECTIVES.find((o) => o.id === formData.objective)?.label },
    { label: 'Público', value: formData.audience },
    { label: 'Produto', value: formData.product },
    { label: 'Ticket', value: formData.ticket },
    { label: 'Canais', value: `${formData.primaryChannel}${formData.secondaryChannel ? ` + ${formData.secondaryChannel}` : ''}` },
  ];

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Revise e confirme
        </h3>
        <p className="text-sm text-zinc-500">
          Verifique os dados antes de criar seu funil
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Nome do funil
        </label>
        <Input
          value={formData.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder={`Funil ${formData.objective} - ${formData.primaryChannel}`}
          className="input-premium"
        />
      </div>

      <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex justify-between p-4">
            <span className="text-zinc-500">{item.label}</span>
            <span className="text-white font-medium max-w-[60%] text-right truncate">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full btn-accent h-12"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Criar Funil
          </>
        )}
      </Button>
    </motion.div>
  );
}

