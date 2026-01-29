'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Target,
  Users,
  Package,
  Radio,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronRight,
  Star,
  Zap,
  BookmarkPlus,
  Check,
  Download,
  FileText,
  Share2,
} from 'lucide-react';
import { doc, onSnapshot, collection, getDocs, orderBy, query, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Funnel, Proposal, ProposalScorecard } from '@/types/database';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { cn } from '@/lib/utils';
import { DecisionTimeline } from '@/components/decisions/decision-timeline';
import { VersionHistory } from '@/components/proposals/version-history';
import { notify } from '@/lib/stores/notification-store';
import { ShareDialog } from '@/components/funnels/share-dialog';
import { ExportDialog } from '@/components/funnels/export-dialog';

// Generate markdown from funnel data
function generateFunnelMarkdown(funnel: Funnel, proposals: Proposal[]): string {
  const ctx = funnel.context;
  const channel = ctx.channel?.main || ctx.channels?.primary || 'N/A';
  const date = new Date().toLocaleDateString('pt-BR');

  let md = `# ${funnel.name}

> Exportado em ${date} | Status: **${funnel.status}**

---

## 📋 Contexto do Negócio

- **Empresa:** ${ctx.company}
- **Mercado:** ${ctx.market}
- **Maturidade:** ${ctx.maturity}
- **Objetivo:** ${ctx.objective}

---

## 👥 Público-Alvo

**Quem é:** ${ctx.audience?.who || 'Não definido'}

**Dor Principal:** ${ctx.audience?.pain || 'Não definido'}

**Nível de Consciência:** ${ctx.audience?.awareness || 'N/A'}

---

## 💰 Oferta

- **Produto/Serviço:** ${ctx.offer?.what || 'N/A'}
- **Ticket:** ${ctx.offer?.ticket || 'N/A'}
- **Tipo:** ${ctx.offer?.type || 'N/A'}

---

## 📡 Canais

- **Principal:** ${channel}

---

`;

  if (proposals.length > 0) {
    md += `## 🎯 Propostas de Funil\n\n`;

    proposals.forEach((proposal, index) => {
      const scorecard = proposal.scorecard as any;
      const score = scorecard?.overall || 'N/A';

      md += `### Proposta ${index + 1}: ${proposal.name}

**Score Geral:** ${typeof score === 'number' ? score.toFixed(1) : score}/10

${proposal.summary || ''}

`;

      if (proposal.strategy?.rationale) {
        md += `#### 💡 Racional Estratégico

${proposal.strategy.rationale}

`;
      }

      if (proposal.architecture?.stages?.length) {
        md += `#### 🏗️ Arquitetura do Funil

`;
        proposal.architecture.stages.forEach(stage => {
          md += `- **${stage.order}. ${stage.name}** (${stage.type}) - ${stage.objective || ''}\n`;
        });
        md += '\n';
      }

      if (proposal.strategy?.risks?.length) {
        md += `#### ⚠️ Riscos

${proposal.strategy.risks.map(r => `- ${r}`).join('\n')}

`;
      }

      if (proposal.assets?.headlines?.length) {
        md += `#### 📝 Headlines

${proposal.assets.headlines.map(h => `- ${h}`).join('\n')}

`;
      }

      md += `---\n\n`;
    });
  }

  md += `\n*Documento gerado pelo Conselho de Funil*`;
  return md;
}

// Simple markdown to HTML converter
function simpleMarkdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Tables (simple)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.some(c => c.includes('---'))) return '';
      const isHeader = cells.every(c => c.trim().startsWith('**') || cells.length <= 2);
      const tag = isHeader ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim().replace(/\*\*/g, '')}</${tag}>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return match;
    });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; description: string; glow: string }> = {
  draft: { 
    label: 'Rascunho', 
    color: 'text-zinc-400', 
    bg: 'bg-zinc-500/10',
    description: 'Aguardando geração pelo Conselho',
    glow: 'from-zinc-500/5 to-transparent'
  },
  generating: { 
    label: 'Gerando Propostas', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    description: 'O Conselho está analisando e criando propostas...',
    glow: 'from-blue-500/5 to-transparent'
  },
  review: { 
    label: 'Propostas Prontas', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    description: 'Avalie as propostas e decida: EXECUTAR, AJUSTAR ou MATAR',
    glow: 'from-amber-500/5 to-transparent'
  },
  approved: { 
    label: 'Aprovado', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    description: 'Pronto para execução estratégica',
    glow: 'from-emerald-500/5 to-transparent'
  },
  adjusting: { 
    label: 'Ajustando', 
    color: 'text-violet-400', 
    bg: 'bg-violet-500/10',
    description: 'Aplicando ajustes solicitados pelo Conselho',
    glow: 'from-violet-500/5 to-transparent'
  },
  executing: { 
    label: 'Executando', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    description: 'Funil em operação e monitoramento ativado',
    glow: 'from-blue-500/5 to-transparent'
  },
  completed: { 
    label: 'Concluído', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    description: 'Ciclo estratégico finalizado com sucesso',
    glow: 'from-emerald-500/5 to-transparent'
  },
  killed: { 
    label: 'Cancelado', 
    color: 'text-red-400', 
    bg: 'bg-red-500/10',
    description: 'Funil descontinuado após análise de viabilidade',
    glow: 'from-red-500/5 to-transparent'
  },
};

const AWARENESS_LABELS: Record<string, string> = {
  fria: 'Audiência Fria',
  morna: 'Audiência Morna',
  quente: 'Audiência Quente',
  unaware: 'Inconsciente',
  problem: 'Consciente do Problema',
  solution: 'Consciente da Solução',
  product: 'Consciente do Produto',
};

function ProposalCard({ proposal, index, onSelect }: { proposal: Proposal; index: number; onSelect: () => void }) {
  const scorecard = proposal.scorecard as ProposalScorecard | undefined;
  const overallScore = scorecard?.overall || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-premium p-6 hover:border-emerald-500/30 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm',
              index === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'
            )}>
              {index + 1}
            </div>
            <h4 className="font-semibold text-white text-lg">{proposal.name}</h4>
            {index === 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                <Star className="h-3 w-3" />
                Recomendado
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm line-clamp-2">{proposal.summary}</p>
        </div>
        
        {scorecard && (
          <div className="text-right ml-4">
            <div className={cn(
              'text-3xl font-bold',
              overallScore >= 7.5 ? 'text-emerald-400' :
              overallScore >= 6 ? 'text-amber-400' : 'text-red-400'
            )}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-xs text-zinc-500">Score</div>
          </div>
        )}
      </div>

      {/* Stages preview */}
      {proposal.architecture?.stages && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {proposal.architecture.stages.slice(0, 5).map((stage, i) => (
            <div key={i} className="flex items-center">
              <div className="px-3 py-1.5 bg-zinc-800/50 rounded-lg text-xs text-zinc-300 whitespace-nowrap">
                {stage.name}
              </div>
              {i < Math.min(proposal.architecture.stages.length - 1, 4) && (
                <ChevronRight className="h-4 w-4 text-zinc-600 mx-1" />
              )}
            </div>
          ))}
          {proposal.architecture.stages.length > 5 && (
            <span className="text-xs text-zinc-500">+{proposal.architecture.stages.length - 5}</span>
          )}
        </div>
      )}

      {/* Quick metrics */}
      {scorecard && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Clareza</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${(scorecard.clarity / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400">{scorecard.clarity}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Oferta</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${(scorecard.offerStrength / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400">{scorecard.offerStrength}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">ROI</div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(scorecard.expectedRoi / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400">{scorecard.expectedRoi}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hover indicator */}
      <div className="flex items-center justify-end mt-4 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
      </div>
    </motion.div>
  );
}

import { AutopsyReportView } from '@/components/funnel-autopsy/AutopsyReportView';
import { AutopsyRunResponse } from '@/types/autopsy';

const GeneratingState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-premium p-12 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-0" />
      <div className="relative z-10">
        <div className="relative mx-auto mb-8 w-24 h-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-500"
          />
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent flex items-center justify-center">
            <Zap className="h-8 w-8 text-purple-400 animate-pulse" />
          </div>
        </div>
        
        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-widest">
          Iniciando Autópsia Forense...
        </h3>
        
        <p className="text-zinc-400 mb-6 max-w-md mx-auto text-sm italic">
          "O Agente Monara está escaneando a estrutura do funil enquanto o Conselho de Estrategistas prepara o diagnóstico."
        </p>
        
        <div className="flex flex-col items-center gap-4 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-purple-500 animate-ping" />
            <span>[SCRAPING_ENGINE]: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-purple-500 animate-ping delay-75" />
            <span>[HEURISTIC_ANALYSIS]: GEMINI_1.5_PRO_READY</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function FunnelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { remove, update } = useFunnels();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [autopsyReport, setAutopsyReport] = useState<AutopsyRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutopsying, setIsAutopsying] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Subscribe to funnel updates
  useEffect(() => {
    if (!params.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'funnels', params.id as string),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Funnel;
          setFunnel(data);
          
          // Check if status changed from generating to review (proposals ready)
          if (funnel?.status === 'generating' && data.status === 'review') {
            notify.success('🎯 Propostas Prontas!', `O Conselho terminou de analisar "${data.name}"`);
          }
          
          // Load proposals for all statuses except draft and generating
          if (data.status !== 'draft' && data.status !== 'generating') {
            loadProposals(params.id as string);
          }
        } else {
          setFunnel(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [params.id]);

  // Load proposals
  const loadProposals = async (funnelId: string) => {
    try {
      const q = query(
        collection(db, 'funnels', funnelId, 'proposals'),
        orderBy('version', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  };

  // Autopsy Execution
  const handleRunAutopsy = async () => {
    if (!funnel || !funnel.context.url) {
      notify.error('Erro', 'URL do funil não encontrada no contexto.');
      return;
    }
    
    setIsAutopsying(true);
    try {
      const response = await fetch('/api/intelligence/autopsy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandId: funnel.brandId || 'default',
          url: funnel.context.url,
          depth: 'deep',
          context: {
            targetAudience: funnel.context.audience?.who,
            mainOffer: funnel.context.offer?.what
          }
        }),
      });
      
      if (!response.ok) throw new Error('Falha na autópsia');
      
      const data = await response.json();
      setAutopsyReport(data);
      notify.success('Autópsia Completa!', 'O diagnóstico forense está pronto.');
    } catch (error) {
      console.error('Autopsy error:', error);
      notify.error('Erro na Autópsia', 'Não foi possível completar o diagnóstico.');
    } finally {
      setIsAutopsying(false);
    }
  };

  // Generate proposals
  const handleGenerate = async () => {
    if (!funnel) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/funnels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelId: funnel.id, context: funnel.context }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate proposals');
      }
      
      // Status will be updated via onSnapshot
    } catch (error) {
      console.error('Error generating proposals:', error);
      alert('Erro ao gerar propostas. Tente novamente.');
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!funnel || !confirm('Tem certeza que deseja excluir este funil?')) return;
    await remove(funnel.id);
    router.push('/funnels');
  };

  const handleExport = async (format: 'markdown' | 'pdf') => {
    if (!funnel) return;
    
    try {
      // Generate markdown locally
      const markdown = generateFunnelMarkdown(funnel, proposals);
      
      if (format === 'markdown') {
        // Download markdown file
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${funnel.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // For PDF, convert markdown to HTML and open in new tab
        const html = simpleMarkdownToHtml(markdown);
        
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${funnel.name} - Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #1a1a1a; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; }
    h4 { color: #6b7280; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f9fafb; }
    blockquote { border-left: 3px solid #10b981; padding-left: 15px; color: #6b7280; margin: 15px 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 30px 0; }
    ul, ol { padding-left: 25px; }
    li { margin: 5px 0; }
    strong { color: #111; }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; z-index: 1000; }
    .print-btn:hover { background: #059669; }
    @media print { .print-btn { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimir PDF</button>
  ${html}
</body>
</html>`;

        // Use Blob URL instead of document.write
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar. Tente novamente.');
    }
  };

  const handleSelectProposal = (proposalId: string) => {
    router.push(`/funnels/${funnel?.id}/proposals/${proposalId}`);
  };

  const handleActivateGoldenThread = async () => {
    if (!funnel) return;
    
    setIsLoading(true);
    try {
      // US-21: Garantir CampaignId único (funnelId + timestamp + random)
      const timestamp = Date.now();
      const shortId = Math.random().toString(36).substring(2, 7);
      const campaignId = `${funnel.id}_${timestamp}_${shortId}`;
      
      const campaignRef = doc(db, 'campaigns', campaignId);
      
      // Busca a proposta selecionada para injetar o contexto inicial
      const selectedProposal = proposals.find(p => p.status === 'selected') || proposals[0];

      const campaignData: any = {
        id: campaignId,
        funnelId: funnel.id,
        brandId: funnel.brandId || '',
        userId: funnel.userId || '',
        name: funnel.name,
        status: 'active',
        funnel: {
          type: funnel.context.objective || 'Funnel',
          architecture: selectedProposal?.strategy?.rationale || '',
          targetAudience: funnel.context.audience?.who || '',
          mainGoal: funnel.context.objective || '',
          stages: selectedProposal?.architecture?.stages?.map(s => s.name) || [],
          summary: selectedProposal?.summary || '',
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(campaignRef, campaignData);
      
      notify.success('Linha de Ouro Ativada!', 'Seu manifesto estratégico foi criado.');
      router.push(`/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error activating Golden Thread:', error);
      notify.error('Erro', 'Falha ao ativar a Linha de Ouro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!funnel || proposals.length === 0) return;
    
    const selectedProposal = proposals.find(p => p.status === 'selected') || proposals[0];
    
    setIsSavingToLibrary(true);
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId: funnel.id,
          proposalId: selectedProposal.id,
          name: `Template: ${funnel.name}`,
          description: selectedProposal.summary,
          tags: [funnel.context.objective, funnel.context.channel?.main].filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      setSavedToLibrary(true);
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
          <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
            <div className="h-20 rounded-xl bg-zinc-800/50" />
            <div className="grid gap-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-zinc-800/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Funil não encontrado" showBack />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50 mb-4">
              <Target className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-white">Funil não encontrado</h3>
            <p className="mt-2 text-zinc-500">O funil pode ter sido excluído ou não existe.</p>
            <Link href="/funnels">
              <Button className="mt-6 btn-accent">Voltar para Funis</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
  const isStatusGenerating = funnel.status === 'generating' || isGenerating;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={funnel.name}
        showBack
        actions={
          <div className="flex items-center gap-2">
            {funnel.context.url && (
              <Button 
                onClick={handleRunAutopsy}
                disabled={isAutopsying}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {isAutopsying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Executar Autópsia
              </Button>
            )}
            {funnel.status === 'approved' && (
              <Button 
                onClick={handleActivateGoldenThread}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                <Zap className="mr-2 h-4 w-4" />
                Ativar Linha de Ouro
              </Button>
            )}
            {funnel.status === 'approved' && proposals.length > 0 && (
              <Button
                variant="outline"
                className={cn(
                  'btn-ghost',
                  savedToLibrary && 'text-emerald-400 border-emerald-500/50'
                )}
                onClick={handleSaveToLibrary}
                disabled={isSavingToLibrary || savedToLibrary}
              >
                {savedToLibrary ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvo
                  </>
                ) : isSavingToLibrary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="mr-2 h-4 w-4" />
                    Salvar na Biblioteca
                  </>
                )}
              </Button>
            )}
            <Button variant="ghost" className="btn-ghost" onClick={() => setIsExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="ghost" className="btn-ghost" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="ghost" className="btn-ghost" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            <Link href={`/chat?funnelId=${funnel.id}`}>
              <Button className="btn-accent">
                <MessageSquare className="mr-2 h-4 w-4" />
                Consultar Conselho
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'card-premium p-5 sm:p-6 mb-6 sm:mb-8 border-l-4 relative overflow-hidden',
              status.color.replace('text', 'border')
            )}
          >
            {/* Background Glow */}
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-20 pointer-events-none", status.glow)} />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={cn(
                  'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl shrink-0',
                  status.bg
                )}>
                  {funnel.status === 'approved' && <CheckCircle2 className={cn("h-5 w-5 sm:h-6 sm:w-6", status.color)} />}
                  {funnel.status === 'review' && <AlertCircle className={cn("h-5 w-5 sm:h-6 sm:w-6", status.color)} />}
                  {funnel.status === 'killed' && <XCircle className={cn("h-5 w-5 sm:h-6 sm:w-6", status.color)} />}
                  {funnel.status === 'generating' && <Loader2 className={cn("h-5 w-5 sm:h-6 sm:w-6 animate-spin", status.color)} />}
                  {['draft', 'adjusting', 'executing', 'completed'].includes(funnel.status) && <Clock className={cn("h-5 w-5 sm:h-6 sm:w-6", status.color)} />}
                </div>
                <div>
                  <div className={cn(
                    'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2',
                    status.color, status.bg, "border border-white/[0.05]"
                  )}>
                    {status.label}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Status Estratégico</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed">{status.description}</p>
                </div>
              </div>
              
              {funnel.status === 'draft' && !isGenerating && (
                <Button className="btn-accent w-full md:w-auto shadow-lg shadow-emerald-500/20" onClick={handleGenerate}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Propostas
                </Button>
              )}
            </div>
          </motion.div>

          {/* Generating State */}
          <AnimatePresence>
            {isStatusGenerating && <GeneratingState />}
          </AnimatePresence>

          {/* Autopsy Report Section */}
          <AnimatePresence>
            {isAutopsying && <GeneratingState />}
            {autopsyReport && !isAutopsying && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-400" />
                    </div>
                    Relatório de Autópsia Forense
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-zinc-800 text-zinc-500 hover:text-white"
                    onClick={() => setAutopsyReport(null)}
                  >
                    Fechar Relatório
                  </Button>
                </div>
                <AutopsyReportView report={autopsyReport.report} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proposals Section */}
          {proposals.length > 0 && !isStatusGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  Propostas do Conselho
                  <span className="text-sm font-normal text-zinc-500">
                    ({proposals.length} {proposals.length === 1 ? 'proposta' : 'propostas'})
                  </span>
                </h3>
              </div>
              
              <VersionHistory
                proposals={proposals}
                onSelectProposal={handleSelectProposal}
              />
            </motion.div>
          )}

          {/* Context Info Grid */}
          {!isStatusGenerating && (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
              {/* Objetivo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Target className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Contexto</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-zinc-500">Objetivo</span>
                    <p className="text-white font-medium capitalize">{funnel.context.objective}</p>
                  </div>
                  {funnel.context.company && (
                    <div>
                      <span className="text-sm text-zinc-500">Empresa</span>
                      <p className="text-zinc-300">{funnel.context.company}</p>
                    </div>
                  )}
                  {funnel.context.market && (
                    <div>
                      <span className="text-sm text-zinc-500">Mercado</span>
                      <p className="text-zinc-300">{funnel.context.market}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Público */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Público</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-zinc-500">Quem é</span>
                    <p className="text-zinc-300">{funnel.context.audience?.who}</p>
                  </div>
                  <div>
                    <span className="text-sm text-zinc-500">Dor principal</span>
                    <p className="text-zinc-300">{funnel.context.audience?.pain}</p>
                  </div>
                  <div>
                    <span className="text-sm text-zinc-500">Nível de consciência</span>
                    <p className="text-white font-medium">
                      {AWARENESS_LABELS[funnel.context.audience?.awareness || ''] || funnel.context.audience?.awareness}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Oferta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Package className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Oferta</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-zinc-500">Produto</span>
                    <p className="text-white font-medium">{funnel.context.offer?.what}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-zinc-500">Ticket</span>
                      <p className="text-emerald-400 font-semibold text-lg">
                        {funnel.context.offer?.ticket}
                      </p>
                    </div>
                    {funnel.context.offer?.type && (
                      <div>
                        <span className="text-sm text-zinc-500">Tipo</span>
                        <p className="text-zinc-300 capitalize">{funnel.context.offer.type}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Canais */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card-premium p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <Radio className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Canais</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-zinc-500">Principal</span>
                    <p className="text-white font-medium capitalize">{funnel.context.channel?.main}</p>
                  </div>
                  {funnel.context.channel?.secondary && (
                    <div>
                      <span className="text-sm text-zinc-500">Secundário</span>
                      <p className="text-zinc-300 capitalize">{funnel.context.channel.secondary}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* CTA for draft */}
          {funnel.status === 'draft' && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-8 card-premium p-8 text-center"
            >
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Pronto para criar propostas?
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                O Conselho vai analisar seu contexto e gerar propostas de funil
                com arquitetura, copy e métricas.
              </p>
              <Button className="btn-accent" onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Propostas com o Conselho
              </Button>
            </motion.div>
          )}

          {/* Decision History */}
          {!isStatusGenerating && funnel.status !== 'draft' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-400" />
                Histórico de Decisões
              </h3>
              <DecisionTimeline funnelId={funnel.id} />
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        funnelId={funnel.id}
        funnelName={funnel.name}
      />
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        funnel={funnel}
        proposals={proposals}
      />
    </div>
  );
}
