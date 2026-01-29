'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Decision } from '@/types/database';

interface DecisionTimelineProps {
  funnelId: string;
  className?: string;
}

const DECISION_CONFIG = {
  EXECUTAR: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Aprovado para Execução',
  },
  AJUSTAR: {
    icon: RefreshCw,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Ajustes Solicitados',
  },
  MATAR: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Descartado',
  },
};

interface DecisionWithMetadata extends Decision {
  metadata?: {
    userName?: string;
    proposalName?: string;
    proposalVersion?: number;
    funnelName?: string;
  };
}

function DecisionCard({ decision, isLast }: { decision: DecisionWithMetadata; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = DECISION_CONFIG[decision.type] ?? DECISION_CONFIG.EXECUTAR;
  if (!DECISION_CONFIG[decision.type] && process.env.NODE_ENV !== 'production') {
    console.warn(`[DecisionTimeline] Tipo desconhecido: "${decision.type}". Usando fallback EXECUTAR.`);
  }
  const Icon = config.icon;

  const createdAt = decision.createdAt?.toDate?.() || new Date();
  const formattedDate = createdAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-px bg-zinc-800" />
      )}

      {/* Icon */}
      <div className={cn(
        'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
        config.bg,
        config.border,
        'border'
      )}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div 
          className={cn(
            'rounded-xl border p-4 transition-all cursor-pointer',
            'border-white/[0.06] bg-white/[0.02]',
            'hover:border-white/[0.1] hover:bg-white/[0.04]'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold', config.color)}>
                  {config.label}
                </span>
                {decision.metadata?.proposalVersion && (
                  <span className="text-xs text-zinc-500 px-2 py-0.5 bg-zinc-800 rounded">
                    v{decision.metadata.proposalVersion}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                {decision.parecer?.summary || 'Sem descrição'}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-500">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {decision.metadata?.userName || 'Usuário'}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formattedDate}
            </div>
            {decision.metadata?.proposalName && (
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {decision.metadata.proposalName}
              </div>
            )}
          </div>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/[0.06]"
              >
                {/* Next Steps */}
                {decision.parecer?.nextSteps && decision.parecer.nextSteps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">Próximos Passos</h4>
                    <ul className="space-y-1">
                      {decision.parecer.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Adjustments (for AJUSTAR) */}
                {decision.type === 'AJUSTAR' && decision.adjustments && decision.adjustments.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-amber-400 mb-2">Ajustes Solicitados</h4>
                    <ul className="space-y-1">
                      {decision.adjustments.map((adj, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-zinc-400">
                          <RefreshCw className="h-3 w-3 text-amber-400" />
                          {adj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Score if available */}
                {decision.parecer?.consolidated?.totalScore && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-zinc-400">Score do Conselho:</span>
                    <span className="font-semibold text-white">
                      {typeof decision.parecer.consolidated.totalScore === 'number' 
                        ? decision.parecer.consolidated.totalScore.toFixed(1) 
                        : decision.parecer.consolidated.totalScore}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function DecisionTimeline({ funnelId, className }: DecisionTimelineProps) {
  const [decisions, setDecisions] = useState<DecisionWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDecisions();
  }, [funnelId]);

  const loadDecisions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/decisions?funnelId=${funnelId}`);
      const data = await response.json();
      setDecisions(data.decisions || []);
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-zinc-800" />
            <div className="flex-1">
              <div className="h-24 rounded-xl bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 mb-3">
          <Clock className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">Nenhuma decisão registrada</p>
        <p className="text-xs text-zinc-600 mt-1">
          Avalie uma proposta para registrar a primeira decisão
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-0">
        {decisions.map((decision, index) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            isLast={index === decisions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

