'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Lightbulb, MessageCircle, CheckCircle2 } from 'lucide-react';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface VerdictCardProps {
  data: VerdictOutput;
  onFollowUpClick?: (question: string) => void;
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  // Color based on score
  const getColor = (score: number) => {
    if (score >= 8) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    if (score >= 5) return { bar: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bar: 'bg-red-500', text: 'text-red-400' };
  };

  const colors = getColor(value);
  const percentage = (value / 10) * 100;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-2xl font-bold ${colors.text}`}>{value}/10</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">{label}</p>
    </div>
  );
}

export function VerdictCard({ data, onFollowUpClick }: VerdictCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full rounded-2xl bg-zinc-900 border border-emerald-500/20 border-l-4 border-l-emerald-500 p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
          <Target className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            Veredito Estratégico
          </h3>
          <p className="text-sm text-zinc-400">{data.brandName}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-6 mb-6 p-4 rounded-xl bg-zinc-800/50 border border-white/[0.04]">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Posicionamento
          </p>
          <ScoreBar
            value={data.scores.positioning.value}
            label={data.scores.positioning.label}
          />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Oferta
          </p>
          <ScoreBar
            value={data.scores.offer.value}
            label={data.scores.offer.label}
          />
        </div>
      </div>

      {/* Analysis */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Pontos Fortes</h4>
        </div>
        <ul className="space-y-2 pl-1">
          {data.analysis.strengths.map((strength, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{strength}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-yellow-400" />
          <h4 className="text-sm font-semibold text-white">Pontos de Melhoria</h4>
        </div>
        <ul className="space-y-2 pl-1">
          {data.analysis.weaknesses.map((weakness, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span>{weakness}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-semibold text-white">Ações Recomendadas</h4>
        </div>
        <div className="space-y-3">
          {data.actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.15 }}
              className="p-3 rounded-lg bg-zinc-800/50 border border-white/[0.04]"
            >
              <p className="text-sm font-medium text-white mb-1">
                {index + 1}. {action.title}
              </p>
              <p className="text-xs text-zinc-400">{action.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Follow-up Question */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Continue a conversa
          </span>
        </div>
        <p className="text-sm text-zinc-200 mb-3">
          "{data.followUpQuestion}"
        </p>
        {onFollowUpClick && (
          <button
            onClick={() => onFollowUpClick(data.followUpQuestion)}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Responder esta pergunta &rarr;
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
