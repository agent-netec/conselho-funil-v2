'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Target,
  Lightbulb,
  AlertTriangle,
  FileText,
  Copy,
  Star,
  Zap,
  Users,
  TrendingUp,
  MessageSquare,
  Library,
  Loader2,
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Funnel, Proposal, ProposalScorecard, FunnelStage } from '@/types/database';
import { cn } from '@/lib/utils';
import { updateFunnel } from '@/lib/firebase/firestore';

const COUNSELOR_NAMES: Record<string, { name: string; role: string; color: string }> = {
  russell_brunson: { name: 'Russell Brunson', role: 'Arquitetura', color: 'text-blue-400' },
  dan_kennedy: { name: 'Dan Kennedy', role: 'Copy & Oferta', color: 'text-amber-400' },
  frank_kern: { name: 'Frank Kern', role: 'Psicologia', color: 'text-purple-400' },
  sam_ovens: { name: 'Sam Ovens', role: 'Aquisição', color: 'text-green-400' },
  ryan_deiss: { name: 'Ryan Deiss', role: 'LTV', color: 'text-rose-400' },
  perry_belcher: { name: 'Perry Belcher', role: 'Monetização', color: 'text-orange-400' },
};

const STAGE_ICONS: Record<string, string> = {
  ad: '📣',
  landing: '🎯',
  quiz: '❓',
  vsl: '🎬',
  checkout: '💳',
  email: '📧',
  call: '📞',
  webinar: '🎥',
  default: '📍',
};

function ScoreBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className={cn('font-semibold', color)}>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color.replace('text', 'bg'))}
        />
      </div>
    </div>
  );
}

function StageCard({ stage, index }: { stage: FunnelStage; index: number }) {
  const icon = STAGE_ICONS[stage.type?.toLowerCase()] || STAGE_ICONS.default;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4"
    >
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 text-2xl">
          {icon}
        </div>
        {index < 6 && <div className="w-0.5 h-8 bg-zinc-800 my-2" />}
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-zinc-500 font-mono">ETAPA {stage.order}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
            {stage.type}
          </span>
        </div>
        <h4 className="text-white font-medium mb-1">{stage.name}</h4>
        {stage.objective && (
          <p className="text-sm text-zinc-400 mb-2">{stage.objective}</p>
        )}
        {stage.description && (
          <p className="text-sm text-zinc-500">{stage.description}</p>
        )}
        {stage.metrics && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            {stage.metrics.expectedConversion && (
              <span className="text-emerald-400">
                Conv: {stage.metrics.expectedConversion}
              </span>
            )}
            {stage.metrics.kpi && (
              <span className="text-zinc-500">
                KPI: {stage.metrics.kpi}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!params.id || !params.proposalId) return;

      try {
        // Load funnel
        const funnelDoc = await getDoc(doc(db, 'funnels', params.id as string));
        if (funnelDoc.exists()) {
          setFunnel({ id: funnelDoc.id, ...funnelDoc.data() } as Funnel);
        }

        // Load proposal
        const proposalDoc = await getDoc(
          doc(db, 'funnels', params.id as string, 'proposals', params.proposalId as string)
        );
        if (proposalDoc.exists()) {
          setProposal({ id: proposalDoc.id, ...proposalDoc.data() } as Proposal);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id, params.proposalId]);

  const handleDecision = async (decision: 'execute' | 'adjust' | 'kill') => {
    if (!funnel || !proposal) return;
    
    // Opcional: pedir justificativa para AJUSTAR ou MATAR
    let reason = '';
    let adjustments: string[] = [];
    
    if (decision === 'adjust') {
      const input = prompt('Quais ajustes são necessários? (separe por vírgula)');
      if (!input) return;
      adjustments = input.split(',').map(a => a.trim()).filter(Boolean);
      reason = `Ajustes solicitados: ${adjustments.join(', ')}`;
    } else if (decision === 'kill') {
      const input = prompt('Por que esta proposta deve ser descartada?');
      if (!input) return;
      reason = input;
    } else {
      reason = 'Proposta aprovada para execução';
    }
    
    setIsActioning(true);
    try {
      // Registrar decisão via API
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: funnel.id,
          proposalId: proposal.id,
          type: decision,
          userId: funnel.userId || 'anonymous',
          userName: 'Você',
          reason,
          adjustments: decision === 'adjust' ? adjustments : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to save decision');
      }

      // Redirect to funnel page
      router.push(`/funnels/${funnel.id}`);
    } catch (error) {
      console.error('Error updating decision:', error);
      alert('Erro ao salvar decisão. Tente novamente.');
    } finally {
      setIsActioning(false);
    }
  };

  const copyAssets = (type: 'headlines' | 'hooks' | 'ctas') => {
    const assets = proposal?.assets?.[type];
    if (assets) {
      navigator.clipboard.writeText(assets.join('\n'));
      alert(`${type} copiados!`);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!funnel || !proposal) return;
    
    setIsSavingToLibrary(true);
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: funnel.id,
          proposalId: proposal.id,
          name: proposal.name,
          description: proposal.summary,
          tags: [funnel.context.objective, funnel.context.channel?.main].filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to library');
      }

      setSavedToLibrary(true);
      alert('✅ Salvo na biblioteca com sucesso!');
    } catch (error) {
      console.error('Error saving to library:', error);
      alert('Erro ao salvar na biblioteca. Tente novamente.');
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Carregando..." showBack />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
            <div className="h-32 rounded-xl bg-zinc-800/50" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 rounded-xl bg-zinc-800/50" />
              <div className="h-64 rounded-xl bg-zinc-800/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal || !funnel) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Proposta não encontrada" showBack />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 mb-4">
              <FileText className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white">Proposta não encontrada</h3>
            <Link href={`/funnels/${params.id}`}>
              <Button className="mt-6 btn-accent">Voltar para o Funil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scorecard = proposal.scorecard as ProposalScorecard | undefined;
  const overallScore = scorecard?.overall || 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={proposal.name}
        subtitle={funnel.name}
        showBack
        actions={
          <Link href={`/chat?funnelId=${funnel.id}&proposalId=${proposal.id}`}>
            <Button variant="outline" className="btn-ghost">
              <MessageSquare className="mr-2 h-4 w-4" />
              Perguntar ao Conselho
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Summary & Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                  {proposal.summary}
                </p>
                
                {proposal.strategy?.rationale && (
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      Racional Estratégico
                    </div>
                    <p className="text-zinc-300 text-sm">{proposal.strategy.rationale}</p>
                  </div>
                )}
              </div>

              {scorecard && (
                <div className="md:w-64 p-5 bg-zinc-800/30 rounded-xl">
                  <div className="text-center mb-4">
                    <div className={cn(
                      'text-5xl font-bold',
                      overallScore >= 7.5 ? 'text-emerald-400' :
                      overallScore >= 6 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-zinc-500">Score Geral</div>
                  </div>
                  
                  <div className="space-y-3">
                    <ScoreBar label="Clareza" value={scorecard.clarity} color="text-blue-400" />
                    <ScoreBar label="Força da Oferta" value={scorecard.offerStrength} color="text-amber-400" />
                    <ScoreBar label="Qualificação" value={scorecard.qualification} color="text-green-400" />
                    <ScoreBar label="Fricção" value={10 - scorecard.friction} color="text-purple-400" />
                    <ScoreBar label="Potencial LTV" value={scorecard.ltvPotential} color="text-rose-400" />
                    <ScoreBar label="ROI Esperado" value={scorecard.expectedRoi} color="text-emerald-400" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Architecture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-premium p-6"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-emerald-400" />
                Arquitetura do Funil
              </h3>
              
              <div className="space-y-0">
                {proposal.architecture?.stages?.map((stage, index) => (
                  <StageCard key={index} stage={stage} index={index} />
                ))}
              </div>
            </motion.div>

            {/* Insights & Risks */}
            <div className="space-y-6">
              {/* Counselor Insights */}
              {proposal.strategy?.counselorInsights && proposal.strategy.counselorInsights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="card-premium p-6"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-blue-400" />
                    Insights dos Conselheiros
                  </h3>
                  
                  <div className="space-y-4">
                    {proposal.strategy.counselorInsights.map((insight, index) => {
                      const counselor = COUNSELOR_NAMES[insight.counselor] || {
                        name: insight.counselor,
                        role: '',
                        color: 'text-zinc-400'
                      };
                      
                      return (
                        <div key={index} className="p-4 bg-zinc-800/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn('font-medium', counselor.color)}>
                              {counselor.name}
                            </span>
                            {counselor.role && (
                              <span className="text-xs text-zinc-500">
                                ({counselor.role})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-300">{insight.insight}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Risks & Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-premium p-6"
              >
                <div className="grid gap-6">
                  {proposal.strategy?.risks && proposal.strategy.risks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        Riscos Identificados
                      </h4>
                      <ul className="space-y-2">
                        {proposal.strategy.risks.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
                            <span className="text-red-400/50">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {proposal.strategy?.recommendations && proposal.strategy.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4" />
                        Recomendações
                      </h4>
                      <ul className="space-y-2">
                        {proposal.strategy.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
                            <span className="text-emerald-400/50">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Assets */}
          {proposal.assets && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-premium p-6 mt-8"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <Zap className="h-5 w-5 text-amber-400" />
                Assets Gerados
              </h3>

              <div className="grid gap-6 md:grid-cols-3">
                {proposal.assets.headlines && proposal.assets.headlines.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-400">Headlines</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyAssets('headlines')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {proposal.assets.headlines.map((headline, index) => (
                        <div key={index} className="p-3 bg-zinc-800/30 rounded-lg text-sm text-zinc-300">
                          {headline}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proposal.assets.hooks && proposal.assets.hooks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-400">Hooks</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyAssets('hooks')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {proposal.assets.hooks.map((hook, index) => (
                        <div key={index} className="p-3 bg-zinc-800/30 rounded-lg text-sm text-zinc-300">
                          {hook}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proposal.assets.ctas && proposal.assets.ctas.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-400">CTAs</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyAssets('ctas')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {proposal.assets.ctas.map((cta, index) => (
                        <div key={index} className="p-3 bg-zinc-800/30 rounded-lg text-sm text-zinc-300 font-medium">
                          {cta}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Decision Actions */}
          {funnel.status === 'review' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-premium p-6 mt-8"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Sua Decisão</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Analise a proposta e decida se quer executar, solicitar ajustes ou descartar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => handleDecision('execute')}
                  disabled={isActioning}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  EXECUTAR
                </Button>
                <Button
                  onClick={() => handleDecision('adjust')}
                  disabled={isActioning}
                  variant="outline"
                  className="flex-1 h-12 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  AJUSTAR
                </Button>
                <Button
                  onClick={() => handleDecision('kill')}
                  disabled={isActioning}
                  variant="outline"
                  className="flex-1 h-12 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  MATAR
                </Button>
              </div>
            </motion.div>
          )}

          {/* Save to Library (for approved funnels) */}
          {funnel.status === 'approved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-premium p-6 mt-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <Library className="h-5 w-5 text-emerald-400" />
                    Salvar na Biblioteca
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Transforme este funil em um template reutilizável para criar novos funis mais rápido.
                  </p>
                </div>
                <Button
                  onClick={handleSaveToLibrary}
                  disabled={isSavingToLibrary || savedToLibrary}
                  className={cn(
                    "h-11",
                    savedToLibrary 
                      ? "bg-emerald-600 text-white" 
                      : "btn-accent"
                  )}
                >
                  {isSavingToLibrary ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : savedToLibrary ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Library className="mr-2 h-4 w-4" />
                      Salvar Template
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

