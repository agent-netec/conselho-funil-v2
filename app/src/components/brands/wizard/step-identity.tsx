import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// 03.2 — Vertical: Autocomplete + Texto Livre (30+ sugestões por categoria)
export const VERTICAL_GROUPS = [
  { group: 'Digital', items: ['SaaS', 'Infoprodutos', 'E-commerce', 'App/Mobile', 'Marketplace'] },
  { group: 'Serviços', items: ['Consultoria', 'Agência', 'Freelancer', 'Advocacia', 'Contabilidade', 'Arquitetura'] },
  { group: 'Saúde & Bem-estar', items: ['Saúde', 'Fitness', 'Nutrição', 'Estética', 'Psicologia', 'Odontologia'] },
  { group: 'Lifestyle', items: ['Moda', 'Beleza', 'Gastronomia', 'Viagens', 'Pets', 'Decoração'] },
  { group: 'Finanças', items: ['Finanças', 'Investimentos', 'Seguros', 'Imobiliário', 'Contabilidade'] },
  { group: 'Educação', items: ['Educação', 'Cursos Online', 'Coaching', 'Mentoria', 'Idiomas'] },
  { group: 'Outros', items: ['Personal Brand', 'Mídia', 'Varejo Físico', 'Indústria', 'ONG', 'Eventos'] },
];
const ALL_VERTICALS = VERTICAL_GROUPS.flatMap(g => g.items);
// Remove duplicates
const UNIQUE_VERTICALS = [...new Set(ALL_VERTICALS)];

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

/** Autocomplete with free text for verticals */
function VerticalAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return VERTICAL_GROUPS;
    const q = query.toLowerCase();
    return VERTICAL_GROUPS
      .map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [query]);

  const handleSelect = (item: string) => {
    setQuery(item);
    onChange(item);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v); // Accept any text (free form)
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Vertical *
      </label>
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Busque ou digite seu segmento..."
        className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#1A1612] shadow-xl">
          {filtered.map(group => (
            <div key={group.group}>
              <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#AB8648]">
                {group.group}
              </p>
              {group.items.map(item => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    item === value ? 'text-[#E6B447] bg-[#E6B447]/5' : 'text-zinc-300 hover:bg-white/[0.03]'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

      {/* Vertical — Autocomplete + Texto Livre */}
      <VerticalAutocomplete value={vertical} onChange={(v) => onUpdate('vertical', v)} />

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
                  ? 'border-[#E6B447]/50 bg-[#E6B447]/5'
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






