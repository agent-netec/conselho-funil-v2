'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const INPUT_CLASS = 'h-11 bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20';
const TEXTAREA_CLASS = 'bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20 resize-none min-h-0';
const LABEL_CLASS = 'text-xs font-medium text-[#AB8648] uppercase tracking-wider';

const offerTypeOptions = [
  { value: 'curso', label: 'Curso' },
  { value: 'saas', label: 'SaaS' },
  { value: 'servico', label: 'Servico' },
  { value: 'mentoria', label: 'Mentoria' },
  { value: 'produto_fisico', label: 'Produto Fisico' },
  { value: 'assinatura', label: 'Assinatura' },
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#F5E8CE]">Sua Oferta</h2>
        <p className="text-sm text-[#CAB792] mt-1">
          O que voce vende e como se diferencia
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>O que voce vende?</Label>
        <Textarea
          value={what}
          onChange={(e) => onUpdate('what', e.target.value)}
          placeholder="Ex: Mentoria de 12 semanas para donos de e-commerce"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Ticket Medio</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D4A] font-medium text-sm">
            R$
          </span>
          <Input
            type="text"
            inputMode="numeric"
            value={formatTicket(ticket)}
            onChange={handleTicketChange}
            placeholder="0"
            className={`${INPUT_CLASS} pl-10`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className={LABEL_CLASS}>Tipo da Oferta</Label>
        <div className="grid grid-cols-3 gap-2">
          {offerTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('type', option.value)}
              className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                type === option.value
                  ? 'border-[#E6B447] bg-[#E6B447]/15 text-[#E6B447]'
                  : 'border-[#2A2318] bg-[#241F19] text-[#CAB792] hover:border-[#3D3428] hover:text-[#F5E8CE]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Diferencial Principal</Label>
        <Textarea
          value={differentiator}
          onChange={(e) => onUpdate('differentiator', e.target.value)}
          placeholder="O que torna sua oferta unica vs concorrentes?"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>
    </motion.div>
  );
}
