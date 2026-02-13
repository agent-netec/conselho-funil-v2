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
  Download,
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Funnel, Proposal, ProposalScorecard, FunnelStage } from '@/types/database';
import { cn } from '@/lib/utils';
import { updateFunnel } from '@/lib/firebase/firestore';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

// Generate markdown for a single proposal
function generateProposalMarkdown(funnel: Funnel, proposal: Proposal): string {
  const scorecard = proposal.scorecard as any;
  const score = scorecard?.overall || 'N/A';
  const date = new Date().toLocaleDateString('pt-BR');

  let md = `# ${proposal.name}

> Funil: ${funnel.name} | Exportado em ${date}

---

**Score Geral:** ${typeof score === 'number' ? score.toFixed(1) : score}/10

${proposal.summary || ''}

`;

  if (proposal.strategy?.rationale) {
    md += `## 💡 Racional Estratégico

${proposal.strategy.rationale}

`;
  }

  if (proposal.architecture?.stages?.length) {
    md += `## 🏗️ Arquitetura do Funil

`;
    proposal.architecture.stages.forEach(stage => {
      md += `- **${stage.order}. ${stage.name}** (${stage.type}) - ${stage.objective || ''}\n`;
    });
    md += '\n';
  }

  if (scorecard) {
    md += `## 📊 Scorecard

- Clareza: ${scorecard.clarity || '-'}
- Força da Oferta: ${scorecard.offerStrength || '-'}
- Qualificação: ${scorecard.qualification || '-'}
- Fricção: ${scorecard.friction || '-'}
- Potencial LTV: ${scorecard.ltvPotential || '-'}
- ROI Esperado: ${scorecard.expectedRoi || '-'}

`;
  }

  if (proposal.strategy?.risks?.length) {
    md += `## ⚠️ Riscos

${proposal.strategy.risks.map(r => `- ${r}`).join('\n')}

`;
  }

  if (proposal.strategy?.recommendations?.length) {
    md += `## ✅ Recomendações

${proposal.strategy.recommendations.map(r => `- ${r}`).join('\n')}

`;
  }

  if (proposal.assets?.headlines?.length) {
    md += `## 📝 Headlines

${proposal.assets.headlines.map(h => `- ${h}`).join('\n')}

`;
  }

  if (proposal.assets?.hooks?.length) {
    md += `## 🎣 Hooks

${proposal.assets.hooks.map(h => `- ${h}`).join('\n')}

`;
  }

  if (proposal.assets?.ctas?.length) {
    md += `## 🎯 CTAs

${proposal.assets.ctas.map(c => `- ${c}`).join('\n')}

`;
  }

  md += `---\n\n*Documento gerado pelo Conselho de Funil*`;
  return md;
}

// Simple markdown to HTML converter
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.some(c => c.includes('---'))) return '';
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim().replace(/\*\*/g, '')}</${tag}>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '<br><br>');
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'adjust' | 'kill' | null>(null);
  const [dialogInput, setDialogInput] = useState('');

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
    
    // Para AJUSTAR ou MATAR, abrir dialog
    if (decision === 'adjust' || decision === 'kill') {
      setDialogType(decision);
      setDialogInput('');
      setDialogOpen(true);
      return;
    }
    
    // EXECUTAR vai direto
    await submitDecision('execute', 'Proposta aprovada para execução', []);
  };

  const submitDecision = async (decision: 'execute' | 'adjust' | 'kill', reason: string, adjustments: string[]) => {
    if (!funnel || !proposal) return;
    
    setIsActioning(true);
    setDialogOpen(false);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId: funnel.id,
          proposalId: proposal.id,
          type: decision,
          userId: funnel.userId || 'anonymous',
          userName: 'Você',
          reason,
          adjustments: decision === 'adjust' ? adjustments : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to save decision');
      }

      router.push(`/funnels/${funnel.id}`);
    } catch (error) {
      console.error('Error updating decision:', error);
      alert('Erro ao salvar decisão. Tente novamente.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogInput.trim() || !dialogType) return;
    
    if (dialogType === 'adjust') {
      const adjustments = dialogInput.split(',').map(a => a.trim()).filter(Boolean);
      submitDecision('adjust', `Ajustes: ${adjustments.join(', ')}`, adjustments);
    } else {
      submitDecision('kill', dialogInput, []);
    }
  };

  const copyAssets = (type: 'headlines' | 'hooks' | 'ctas') => {
    const assets = proposal?.assets?.[type];
    if (assets) {
      navigator.clipboard.writeText(assets.join('\n'));
      alert(`${type} copiados!`);
    }
  };

  const handleExport = async (format: 'markdown' | 'pdf') => {
    if (!funnel || !proposal) return;
    
    try {
      // Generate markdown locally
      const markdown = generateProposalMarkdown(funnel, proposal);
      
      if (format === 'markdown') {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${proposal.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Generate markdown locally for this proposal
        const markdown = generateProposalMarkdown(funnel, proposal);
        const html = simpleMarkdownToHtml(markdown);
        
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${proposal.name} - Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #1a1a1a; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; }
    h4 { color: #6b7280; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f9fafb; }
    blockquote { border-left: 3px solid #10b981; padding-left: 15px; color: #6b7280; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 30px 0; }
    ul { padding-left: 25px; }
    li { margin: 5px 0; }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; z-index: 1000; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir PDF</button>
  ${html}
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar. Tente novamente.');
    }
  };

  const handleSaveToLibrary = async () => {
    if (!funnel || !proposal) return;
    
    setIsSavingToLibrary(true);
    try {
      const libHeaders = await getAuthHeaders();
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: libHeaders,
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="btn-ghost" onClick={() => handleExport('markdown')}>
              <FileText className="mr-2 h-4 w-4" />
              MD
            </Button>
            <Button variant="ghost" className="btn-ghost" onClick={() => handleExport('pdf')}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Link href={`/chat?funnelId=${funnel.id}&proposalId=${proposal.id}`}>
              <Button variant="outline" className="btn-ghost">
                <MessageSquare className="mr-2 h-4 w-4" />
                Perguntar ao Conselho
              </Button>
            </Link>
          </div>
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

          {/* Generate Copy (for approved funnels) */}
          {funnel.status === 'approved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card-premium p-6 mt-4 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    Gerar Copy
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Ative o Conselho de Copywriting para criar headlines, emails, ofertas, VSL e mais.
                  </p>
                </div>
                <Link href={`/funnels/${funnel.id}/copy?proposalId=${proposal.id}`}>
                  <Button className="h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Conselho de Copy
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Dialog para AJUSTAR ou MATAR */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {dialogType === 'adjust' ? 'Solicitar Ajustes' : 'Descartar Proposta'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={dialogInput}
              onChange={(e) => setDialogInput(e.target.value)}
              placeholder={
                dialogType === 'adjust'
                  ? 'Quais ajustes são necessários? (separe por vírgula)'
                  : 'Por que esta proposta deve ser descartada?'
              }
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={!dialogInput.trim()}
              className={dialogType === 'adjust' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'}
            >
              {dialogType === 'adjust' ? 'Solicitar Ajustes' : 'Descartar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

