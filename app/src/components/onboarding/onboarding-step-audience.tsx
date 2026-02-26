'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const awarenessOptions = [
  { value: 'unaware', label: 'Não sabe que tem o problema' },
  { value: 'problem', label: 'Sabe do problema' },
  { value: 'solution', label: 'Conhece soluções' },
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
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Sua Audiência</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Quem você quer alcançar com sua marca
        </p>
      </div>

      {/* Cliente ideal */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Quem é seu cliente ideal?
        </label>
        <textarea
          value={who}
          onChange={(e) => onUpdate('who', e.target.value)}
          placeholder="Ex: Empreendedores digitais com faturamento entre R$10k-50k/mês que querem escalar"
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Maior frustração */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Qual a maior frustração dele?
        </label>
        <textarea
          value={pain}
          onChange={(e) => onUpdate('pain', e.target.value)}
          placeholder="Ex: Gasta muito em tráfego pago mas não consegue converter"
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Nível de consciência */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Nível de Consciência
        </label>
        <div className="grid grid-cols-2 gap-2">
          {awarenessOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('awareness', option.value)}
              className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                awareness === option.value
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/[0.06] bg-zinc-800/50 text-zinc-400 hover:border-white/[0.1] hover:text-white'
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Objeções principais */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Objeções Principais
          <span className="text-zinc-600 ml-2">({objections.length}/5)</span>
        </label>

        {/* Input para adicionar */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newObjection}
            onChange={(e) => setNewObjection(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: É muito caro"
            disabled={objections.length >= 5}
            className="flex-1 rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleAddObjection}
            disabled={!newObjection.trim() || objections.length >= 5}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/[0.06] bg-zinc-800/50 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de objeções */}
        {objections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {objections.map((objection, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/[0.06] text-sm text-zinc-300"
              >
                <span>{objection}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveObjection(index)}
                  className="p-0.5 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
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
