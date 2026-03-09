'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const INPUT_CLASS = 'h-11 bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20';
const TEXTAREA_CLASS = 'bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20 resize-none min-h-0';
const LABEL_CLASS = 'text-xs font-medium text-[#AB8648] uppercase tracking-wider';

const verticalOptions = [
  'SaaS',
  'Infoprodutos',
  'E-commerce',
  'Servicos',
  'Consultoria',
  'Agencia',
  'Educacao',
  'Saude',
  'Outro',
];

const voiceToneOptions = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'casual', label: 'Casual' },
  { value: 'autoritario', label: 'Autoritario' },
  { value: 'amigavel', label: 'Amigavel' },
  { value: 'inspiracional', label: 'Inspiracional' },
];

interface OnboardingStepIdentityProps {
  name: string;
  positioning: string;
  vertical: string;
  voiceTone: string;
  onUpdate: (field: string, value: string) => void;
}

export function OnboardingStepIdentity({
  name,
  positioning,
  vertical,
  voiceTone,
  onUpdate,
}: OnboardingStepIdentityProps) {
  return (
    <motion.div
      key="step-identity"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#F5E8CE]">Identidade da Marca</h2>
        <p className="text-sm text-[#CAB792] mt-1">
          Comece nos contando sobre a sua marca
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Nome da Marca</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Ex: MKTHONEY"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Descricao Curta</Label>
        <Textarea
          value={positioning}
          onChange={(e) => onUpdate('positioning', e.target.value)}
          placeholder="O que sua marca faz em 1 frase"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Vertical / Nicho</Label>
        <select
          value={vertical}
          onChange={(e) => onUpdate('vertical', e.target.value)}
          className="w-full h-11 rounded-md border bg-[#241F19] border-[#2A2318] px-3 text-sm text-[#F5E8CE] focus:border-[#E6B447]/50 focus:outline-none focus:ring-[3px] focus:ring-[#E6B447]/20 transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B5D4A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px',
          }}
        >
          <option value="" disabled className="bg-[#1A1612]">
            Selecione o nicho
          </option>
          {verticalOptions.map((option) => (
            <option key={option} value={option} className="bg-[#1A1612]">
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className={LABEL_CLASS}>Tom de Voz</Label>
        <div className="flex flex-wrap gap-2">
          {voiceToneOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('voiceTone', option.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                voiceTone === option.value
                  ? 'border-[#E6B447] bg-[#E6B447]/15 text-[#E6B447]'
                  : 'border-[#2A2318] bg-[#241F19] text-[#CAB792] hover:border-[#3D3428] hover:text-[#F5E8CE]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
