'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TEXTAREA_CLASS = 'bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20 resize-none min-h-0';
const LABEL_CLASS = 'text-xs font-medium text-[#AB8648] uppercase tracking-wider';

const awarenessOptions = [
  { value: 'unaware', label: 'Nao sabe que tem o problema' },
  { value: 'problem', label: 'Sabe do problema' },
  { value: 'solution', label: 'Conhece solucoes' },
  { value: 'product', label: 'Conhece seu produto' },
];

interface OnboardingStepAudienceProps {
  who: string;
  pain: string;
  awareness: string;
  objections: string[];
  onUpdate: (field: string, value: string | string[]) => void;
}

export function OnboardingStepAudience({
  who,
  pain,
  awareness,
  objections,
  onUpdate,
}: OnboardingStepAudienceProps) {
  const [newObjection, setNewObjection] = useState('');

  const handleAddObjection = () => {
    if (newObjection.trim() && objections.length < 5) {
      onUpdate('objections', [...objections, newObjection.trim()]);
      setNewObjection('');
    }
  };

  const handleRemoveObjection = (index: number) => {
    const updated = objections.filter((_, i) => i !== index);
    onUpdate('objections', updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddObjection();
    }
  };

  return (
    <motion.div
      key="step-audience"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#F5E8CE]">Sua Audiencia</h2>
        <p className="text-sm text-[#CAB792] mt-1">
          Quem voce quer alcancar com sua marca
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Quem e seu cliente ideal?</Label>
        <Textarea
          value={who}
          onChange={(e) => onUpdate('who', e.target.value)}
          placeholder="Ex: Empreendedores digitais com faturamento entre R$10k-50k/mes que querem escalar"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label className={LABEL_CLASS}>Qual a maior frustracao dele?</Label>
        <Textarea
          value={pain}
          onChange={(e) => onUpdate('pain', e.target.value)}
          placeholder="Ex: Gasta muito em trafego pago mas nao consegue converter"
          rows={2}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="space-y-2">
        <Label className={LABEL_CLASS}>Nivel de Consciencia</Label>
        <div className="grid grid-cols-2 gap-2">
          {awarenessOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('awareness', option.value)}
              className={`px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-all ${
                awareness === option.value
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
        <Label className={LABEL_CLASS}>
          Objecoes Principais
          <span className="text-[#6B5D4A] ml-2">({objections.length}/5)</span>
        </Label>

        <div className="flex gap-2">
          <Input
            type="text"
            value={newObjection}
            onChange={(e) => setNewObjection(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: E muito caro"
            disabled={objections.length >= 5}
            className="h-10 bg-[#241F19] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20"
          />
          <button
            type="button"
            onClick={handleAddObjection}
            disabled={!newObjection.trim() || objections.length >= 5}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#2A2318] bg-[#241F19] text-[#6B5D4A] hover:border-[#E6B447] hover:text-[#E6B447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {objections.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {objections.map((objection, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#241F19] border border-[#2A2318] text-sm text-[#CAB792]"
              >
                <span>{objection}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveObjection(index)}
                  className="p-0.5 rounded hover:bg-[#1A1612] text-[#6B5D4A] hover:text-[#CAB792] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
