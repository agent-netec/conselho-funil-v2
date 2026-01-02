import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const OFFER_TYPES = [
  { id: 'course', label: 'Curso/Infoproduto', emoji: '📚' },
  { id: 'saas', label: 'SaaS/Software', emoji: '💻' },
  { id: 'service', label: 'Serviço', emoji: '🛠️' },
  { id: 'mentorship', label: 'Mentoria/Consultoria', emoji: '🎯' },
  { id: 'physical', label: 'Produto Físico', emoji: '📦' },
  { id: 'subscription', label: 'Assinatura', emoji: '🔄' },
];

interface StepOfferProps {
  what: string;
  ticket: string;
  type: string;
  differentiator: string;
  onUpdate: (field: string, value: string) => void;
}

export function StepOffer({ what, ticket, type, differentiator, onUpdate }: StepOfferProps) {
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
          Oferta Principal
        </h3>
        <p className="text-sm text-zinc-500">
          Descreva o que sua marca vende e por quanto
        </p>
      </div>

      {/* O que vende */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          O que você vende? *
        </label>
        <Textarea
          value={what}
          onChange={(e) => onUpdate('what', e.target.value)}
          placeholder="Ex: Plataforma de automação de marketing com IA para agências"
          rows={3}
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 resize-none"
        />
      </div>

      {/* Ticket Médio */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Ticket Médio (R$) *
        </label>
        <Input
          type="number"
          value={ticket}
          onChange={(e) => onUpdate('ticket', e.target.value)}
          placeholder="Ex: 997, 2500, 15000"
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600"
        />
        <p className="text-xs text-zinc-600 mt-1">
          Valor médio da principal oferta em reais
        </p>
      </div>

      {/* Tipo de Oferta */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tipo de Oferta *
        </label>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
          {OFFER_TYPES.map((offerType) => (
            <button
              key={offerType.id}
              type="button"
              onClick={() => onUpdate('type', offerType.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                type === offerType.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
              }`}
            >
              <span className="text-xl block mb-1">{offerType.emoji}</span>
              <span className="text-sm text-white">{offerType.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diferencial */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Diferencial Competitivo *
        </label>
        <Textarea
          value={differentiator}
          onChange={(e) => onUpdate('differentiator', e.target.value)}
          placeholder="Ex: Única plataforma com IA treinada especificamente para agências brasileiras"
          rows={3}
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 resize-none"
        />
        <p className="text-xs text-zinc-600 mt-1">
          O que torna sua oferta única no mercado?
        </p>
      </div>
    </motion.div>
  );
}

