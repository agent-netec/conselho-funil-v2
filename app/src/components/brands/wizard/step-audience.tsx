import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AWARENESS_LEVELS = [
  { id: 'unaware', label: 'Não sabe que tem problema', emoji: '😴' },
  { id: 'problem_aware', label: 'Sabe que tem problema', emoji: '🤔' },
  { id: 'solution_aware', label: 'Busca soluções', emoji: '🔍' },
  { id: 'product_aware', label: 'Conhece seu produto', emoji: '👀' },
];

interface StepAudienceProps {
  who: string;
  pain: string;
  awareness: string;
  objections: string[];
  onUpdate: (field: string, value: any) => void;
}

export function StepAudience({ who, pain, awareness, objections, onUpdate }: StepAudienceProps) {
  const addObjection = () => {
    if (objections.length < 5) {
      onUpdate('objections', [...objections, '']);
    }
  };

  const updateObjection = (index: number, value: string) => {
    const newObjections = [...objections];
    newObjections[index] = value;
    onUpdate('objections', newObjections);
  };

  const removeObjection = (index: number) => {
    const newObjections = objections.filter((_, i) => i !== index);
    onUpdate('objections', newObjections);
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">
          Público-Alvo
        </h3>
        <p className="text-sm text-zinc-500">
          Defina quem é o cliente ideal desta marca
        </p>
      </div>

      {/* Quem */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Quem é seu cliente ideal? *
        </label>
        <Textarea
          value={who}
          onChange={(e) => onUpdate('who', e.target.value)}
          placeholder="Ex: Donos de agências de marketing digital com equipe entre 5-20 pessoas"
          rows={3}
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 resize-none"
        />
      </div>

      {/* Dor Principal */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Qual a maior dor desse público? *
        </label>
        <Textarea
          value={pain}
          onChange={(e) => onUpdate('pain', e.target.value)}
          placeholder="Ex: Dificuldade em escalar operações sem perder qualidade no atendimento"
          rows={3}
          className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 resize-none"
        />
      </div>

      {/* Nível de Consciência */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Nível de Consciência *
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {AWARENESS_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => onUpdate('awareness', level.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                awareness === level.id
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
              }`}
            >
              <span className="text-xl block mb-1">{level.emoji}</span>
              <span className="text-sm text-white">{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Objeções */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Principais Objeções (opcional)
        </label>
        <p className="text-xs text-zinc-600 mb-3">
          Quais são as principais barreiras para a compra? (até 5)
        </p>
        
        <div className="space-y-2">
          {objections.map((objection, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objection}
                onChange={(e) => updateObjection(index, e.target.value)}
                placeholder={`Objeção ${index + 1}: Ex: "É muito caro", "Não tenho tempo"`}
                className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-zinc-600 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeObjection(index)}
                className="text-zinc-500 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {objections.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addObjection}
              className="w-full border-white/[0.06] text-zinc-400 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Objeção
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}






