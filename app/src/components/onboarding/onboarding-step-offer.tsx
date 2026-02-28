'use client';

import { motion } from 'framer-motion';

const offerTypeOptions = [
  { value: 'curso', label: 'Curso', emoji: '📚' },
  { value: 'saas', label: 'SaaS', emoji: '💻' },
  { value: 'servico', label: 'Serviço', emoji: '🛠️' },
  { value: 'mentoria', label: 'Mentoria', emoji: '🎯' },
  { value: 'produto_fisico', label: 'Produto Físico', emoji: '📦' },
  { value: 'assinatura', label: 'Assinatura', emoji: '🔄' },
];

interface OnboardingStepOfferProps {
  what: string;
  ticket: number;
  type: string;
  differentiator: string;
  onUpdate: (field: string, value: string | number) => void;
}

export function OnboardingStepOffer({
  what,
  ticket,
  type,
  differentiator,
  onUpdate,
}: OnboardingStepOfferProps) {
  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    onUpdate('ticket', value ? parseInt(value, 10) : 0);
  };

  const formatTicket = (value: number) => {
    if (!value) return '';
    return value.toLocaleString('pt-BR');
  };

  return (
    <motion.div
      key="step-offer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Sua Oferta</h2>
        <p className="text-sm text-zinc-400 mt-1">
          O que você vende e como se diferencia
        </p>
      </div>

      {/* O que você vende */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          O que você vende?
        </label>
        <textarea
          value={what}
          onChange={(e) => onUpdate('what', e.target.value)}
          placeholder="Ex: Mentoria de 12 semanas para donos de e-commerce"
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#E6B447] focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Ticket médio */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Ticket Médio
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
            R$
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatTicket(ticket)}
            onChange={handleTicketChange}
            placeholder="0"
            className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#E6B447] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Tipo da oferta */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Tipo da Oferta
        </label>
        <div className="grid grid-cols-3 gap-2">
          {offerTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('type', option.value)}
              className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all ${
                type === option.value
                  ? 'border-[#E6B447] bg-[#E6B447]/20 text-[#E6B447]'
                  : 'border-white/[0.06] bg-zinc-800/50 text-zinc-400 hover:border-white/[0.1] hover:text-white'
              }`}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diferencial principal */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Diferencial Principal
        </label>
        <textarea
          value={differentiator}
          onChange={(e) => onUpdate('differentiator', e.target.value)}
          placeholder="O que torna sua oferta única vs concorrentes?"
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#E6B447] focus:outline-none transition-colors resize-none"
        />
      </div>
    </motion.div>
  );
}
