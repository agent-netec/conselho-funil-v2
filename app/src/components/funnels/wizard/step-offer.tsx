import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const BUDGET_OPTIONS = [
  { value: '', label: 'Selecione (opcional)' },
  { value: 'Não invisto em tráfego', label: 'Não invisto em tráfego' },
  { value: 'Até R$ 1.000/mês', label: 'Até R$ 1.000/mês' },
  { value: 'R$ 1.000 - R$ 5.000/mês', label: 'R$ 1.000 - R$ 5.000/mês' },
  { value: 'R$ 5.000 - R$ 20.000/mês', label: 'R$ 5.000 - R$ 20.000/mês' },
  { value: 'R$ 20.000 - R$ 50.000/mês', label: 'R$ 20.000 - R$ 50.000/mês' },
  { value: 'R$ 50.000+/mês', label: 'R$ 50.000+/mês' },
];

interface StepOfferProps {
  formData: {
    product: string;
    ticket: string;
    productType: string;
    differential: string;
    budget: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function StepOffer({ formData, onUpdate }: StepOfferProps) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Descreva sua oferta
        </h3>
        <p className="text-sm text-zinc-500">
          O que você está vendendo e qual o diferencial
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Produto/Serviço *
          </label>
          <Input
            value={formData.product}
            onChange={(e) => onUpdate('product', e.target.value)}
            placeholder="Ex: Sistema de automação de marketing"
            className="input-premium"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Ticket *
            </label>
            <Input
              value={formData.ticket}
              onChange={(e) => onUpdate('ticket', e.target.value)}
              placeholder="R$ 497"
              className="input-premium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tipo
            </label>
            <Input
              value={formData.productType}
              onChange={(e) => onUpdate('productType', e.target.value)}
              placeholder="SaaS, Curso, Mentoria..."
              className="input-premium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Diferencial
          </label>
          <Textarea
            value={formData.differential}
            onChange={(e) => onUpdate('differential', e.target.value)}
            placeholder="Ex: Integração com 50+ plataformas, setup em 15min"
            className="input-premium min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Budget de Tráfego
          </label>
          <select
            value={formData.budget}
            onChange={(e) => onUpdate('budget', e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0D0B09] px-3 py-2.5 text-sm text-zinc-300 focus:border-[#E6B447]/50 focus:outline-none focus:ring-1 focus:ring-[#E6B447]/30"
          >
            {BUDGET_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

