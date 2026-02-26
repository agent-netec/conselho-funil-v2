'use client';

import { motion } from 'framer-motion';

const verticalOptions = [
  'SaaS',
  'Infoprodutos',
  'E-commerce',
  'Serviços',
  'Consultoria',
  'Agência',
  'Educação',
  'Saúde',
  'Outro',
];

const voiceToneOptions = [
  { value: 'profissional', label: 'Profissional', emoji: '👔' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'autoritario', label: 'Autoritário', emoji: '🏛️' },
  { value: 'amigavel', label: 'Amigável', emoji: '🤝' },
  { value: 'inspiracional', label: 'Inspiracional', emoji: '✨' },
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
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Identidade da Marca</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Comece nos contando sobre a sua marca
        </p>
      </div>

      {/* Nome da marca */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Nome da Marca
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Ex: MKTHONEY"
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Descrição curta */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Descrição Curta
        </label>
        <textarea
          value={positioning}
          onChange={(e) => onUpdate('positioning', e.target.value)}
          placeholder="O que sua marca faz em 1 frase"
          rows={2}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Vertical/Nicho */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
          Vertical / Nicho
        </label>
        <select
          value={vertical}
          onChange={(e) => onUpdate('vertical', e.target.value)}
          className="w-full rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px',
          }}
        >
          <option value="" disabled className="bg-zinc-900">
            Selecione o nicho
          </option>
          {verticalOptions.map((option) => (
            <option key={option} value={option} className="bg-zinc-900">
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Tom de Voz */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Tom de Voz
        </label>
        <div className="flex flex-wrap gap-2">
          {voiceToneOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate('voiceTone', option.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                voiceTone === option.value
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/[0.06] bg-zinc-800/50 text-zinc-400 hover:border-white/[0.1] hover:text-white'
              }`}
            >
              <span>{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
