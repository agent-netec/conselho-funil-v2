import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';

// 03.5 — Offer types expandido com "Outro" + texto livre
const OFFER_TYPES = [
  { id: 'course', label: 'Curso Online', emoji: '📚' },
  { id: 'mentorship', label: 'Mentoria', emoji: '🎯' },
  { id: 'consultancy', label: 'Consultoria', emoji: '💼' },
  { id: 'saas', label: 'SaaS/App', emoji: '💻' },
  { id: 'ebook', label: 'E-book/Digital', emoji: '📱' },
  { id: 'service', label: 'Serviço', emoji: '🛠️' },
  { id: 'physical', label: 'Produto Físico', emoji: '📦' },
  { id: 'community', label: 'Comunidade', emoji: '👥' },
  { id: 'event', label: 'Evento/Workshop', emoji: '🎤' },
  { id: 'subscription', label: 'Assinatura', emoji: '🔄' },
  { id: 'franchise', label: 'Franquia', emoji: '🏢' },
  { id: 'other', label: 'Outro', emoji: '✏️' },
];

interface StepOfferProps {
  what: string;
  ticket: string;
  type: string;
  differentiator: string;
  onUpdate: (field: string, value: string) => void;
}

export function StepOffer({ what, ticket, type, differentiator, onUpdate }: StepOfferProps) {
  const knownIds = OFFER_TYPES.map(t => t.id);
  const isCustomType = type && !knownIds.includes(type) && type !== 'other';
  const [showCustom, setShowCustom] = useState(isCustomType);

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

      {/* Ticket Médio — 03.6: Currency mask R$ */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Ticket Médio *
        </label>
        <CurrencyInput
          value={ticket}
          onChange={(val) => onUpdate('ticket', val != null ? String(val) : '')}
          placeholder="997,00"
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600"
        />
        <p className="text-xs text-zinc-600 mt-1">
          Valor médio da principal oferta em reais
        </p>
      </div>

      {/* Tipo de Oferta — 12 chips + "Outro" com texto livre */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tipo de Oferta *
        </label>
        <div className="flex flex-wrap gap-2">
          {OFFER_TYPES.map((offerType) => {
            const isSelected = offerType.id === 'other'
              ? (showCustom || isCustomType)
              : type === offerType.id;
            return (
              <button
                key={offerType.id}
                type="button"
                onClick={() => {
                  if (offerType.id === 'other') {
                    setShowCustom(true);
                    onUpdate('type', '');
                  } else {
                    setShowCustom(false);
                    onUpdate('type', offerType.id);
                  }
                }}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-all flex items-center gap-1.5',
                  isSelected
                    ? 'border-[#E6B447]/50 bg-[#E6B447]/5 text-[#E6B447]'
                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-white/[0.1]'
                )}
              >
                <span>{offerType.emoji}</span>
                <span>{offerType.label}</span>
              </button>
            );
          })}
        </div>
        {(showCustom || isCustomType) && (
          <Input
            value={isCustomType ? type : ''}
            onChange={(e) => onUpdate('type', e.target.value)}
            placeholder="Descreva o tipo da sua oferta..."
            className="mt-2 bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600"
            autoFocus
          />
        )}
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






