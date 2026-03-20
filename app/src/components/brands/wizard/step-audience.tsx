import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, X, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 03.3 — Awareness: classificação automática por 3 perguntas simples
const AWARENESS_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  unaware: { label: 'Inconsciente', description: 'Seu público não sabe que tem o problema', emoji: '😴' },
  problem_aware: { label: 'Consciente do Problema', description: 'Sabem do problema, mas não buscam soluções', emoji: '🤔' },
  solution_aware: { label: 'Consciente da Solução', description: 'Buscam soluções ativamente', emoji: '🔍' },
  product_aware: { label: 'Consciente do Produto', description: 'Já conhecem sua marca/produto', emoji: '👀' },
};

function classifyAwareness(answers: { knowsProblem: boolean | null; seeksSolutions: boolean | null; knowsProduct: boolean | null }): string | null {
  const { knowsProblem, seeksSolutions, knowsProduct } = answers;
  if (knowsProblem === null) return null;
  if (!knowsProblem) return 'unaware';
  if (!seeksSolutions && !knowsProduct) return 'problem_aware';
  if (seeksSolutions && !knowsProduct) return 'solution_aware';
  if (knowsProduct) return 'product_aware';
  return 'solution_aware';
}

interface StepAudienceProps {
  who: string;
  pain: string;
  awareness: string;
  objections: string[];
  onUpdate: (field: string, value: any) => void;
}

/** 03.3 — Awareness via 3 Yes/No questions with auto-classification */
function AwarenessQuestions({ awareness, onUpdate }: { awareness: string; onUpdate: (field: string, value: any) => void }) {
  const [answers, setAnswers] = useState<{ knowsProblem: boolean | null; seeksSolutions: boolean | null; knowsProduct: boolean | null }>({
    knowsProblem: null,
    seeksSolutions: null,
    knowsProduct: null,
  });

  // If awareness already set (e.g. editing), infer answers
  useEffect(() => {
    if (awareness && answers.knowsProblem === null) {
      const inferred = {
        knowsProblem: awareness !== 'unaware',
        seeksSolutions: awareness === 'solution_aware' || awareness === 'product_aware',
        knowsProduct: awareness === 'product_aware',
      };
      setAnswers(inferred);
    }
  }, [awareness]);

  const handleAnswer = (field: keyof typeof answers, value: boolean) => {
    const next = { ...answers, [field]: value };
    setAnswers(next);
    const level = classifyAwareness(next);
    if (level) onUpdate('awareness', level);
  };

  const currentLevel = classifyAwareness(answers);
  const levelInfo = currentLevel ? AWARENESS_LABELS[currentLevel] : null;

  const questions = [
    { key: 'knowsProblem' as const, text: 'Seu público sabe que tem o problema que você resolve?' },
    { key: 'seeksSolutions' as const, text: 'Seu público já procura soluções ativamente?' },
    { key: 'knowsProduct' as const, text: 'Seu público já conhece seu produto/marca?' },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Nível de Consciência do Público *
      </label>
      <p className="text-xs text-zinc-600 mb-3">
        Responda 3 perguntas simples para classificar automaticamente
      </p>
      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.key} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <span className="text-sm text-zinc-300 flex-1 mr-3">{q.text}</span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleAnswer(q.key, true)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  answers[q.key] === true
                    ? 'bg-[#E6B447]/20 text-[#E6B447] border border-[#E6B447]/40'
                    : 'bg-white/[0.02] text-zinc-500 border border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(q.key, false)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  answers[q.key] === false
                    ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600/50'
                    : 'bg-white/[0.02] text-zinc-500 border border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                Não
              </button>
            </div>
          </div>
        ))}
      </div>
      {levelInfo && (
        <div className="mt-3 rounded-lg border border-[#E6B447]/20 bg-[#E6B447]/5 p-3 flex items-center gap-3">
          <span className="text-xl">{levelInfo.emoji}</span>
          <div>
            <p className="text-sm font-medium text-[#E6B447]">{levelInfo.label}</p>
            <p className="text-xs text-zinc-400">{levelInfo.description}</p>
          </div>
        </div>
      )}
    </div>
  );
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

      {/* Nível de Consciência — 3 perguntas simples */}
      <AwarenessQuestions awareness={awareness} onUpdate={onUpdate} />

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






