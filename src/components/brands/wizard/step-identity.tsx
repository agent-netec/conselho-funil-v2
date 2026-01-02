import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const VERTICALS = [
  'SaaS', 'Infoprodutos', 'E-commerce', 'Serviços', 
  'Consultoria', 'Agência', 'Educação', 'Saúde', 'Outro'
];

const VOICE_TONES = [
  { id: 'professional', label: 'Profissional', emoji: '👔' },
  { id: 'casual', label: 'Casual', emoji: '😊' },
  { id: 'authoritative', label: 'Autoritário', emoji: '🎯' },
  { id: 'friendly', label: 'Amigável', emoji: '🤝' },
  { id: 'inspirational', label: 'Inspirador', emoji: '✨' },
];

interface StepIdentityProps {
  name: string;
  vertical: string;
  positioning: string;
  voiceTone: string;
  onUpdate: (field: string, value: string) => void;
}

export function StepIdentity({ name, vertical, positioning, voiceTone, onUpdate }: StepIdentityProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Identidade da Marca
        </h3>
        <p className="text-sm text-zinc-500">
          Defina o nome, vertical de atuação e posicionamento da sua marca
        </p>
      </div>

      {/* Nome da Marca */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Nome da Marca *
        </label>
        <Input
          value={name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Ex: Acme SaaS, Escola do Marketing, Loja X"
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600"
        />
      </div>

      {/* Vertical */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Vertical *
        </label>
        <select
          value={vertical}
          onChange={(e) => onUpdate('vertical', e.target.value)}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="" className="bg-zinc-900">Selecione...</option>
          {VERTICALS.map(v => (
            <option key={v} value={v} className="bg-zinc-900">{v}</option>
          ))}
        </select>
      </div>

      {/* Posicionamento */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Posicionamento *
        </label>
        <Textarea
          value={positioning}
          onChange={(e) => onUpdate('positioning', e.target.value)}
          placeholder="Em uma frase, como sua marca se posiciona no mercado? Ex: A melhor plataforma de automação para PMEs"
          rows={3}
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 resize-none"
        />
        <p className="text-xs text-zinc-600 mt-1">
          Seja específico sobre o diferencial da sua marca
        </p>
      </div>

      {/* Tom de Voz */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tom de Voz *
        </label>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
          {VOICE_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => onUpdate('voiceTone', tone.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                voiceTone === tone.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
              }`}
            >
              <span className="text-xl block mb-1">{tone.emoji}</span>
              <span className="text-sm text-white">{tone.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

