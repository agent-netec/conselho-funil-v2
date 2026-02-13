'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Mail,
  DollarSign,
  Video,
  Megaphone,
  Layout,
  ChevronDown,
  ChevronRight,
  Target,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Copy,
  Check,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/guards/resolve-icon';
import { useAuthStore } from '@/lib/stores/auth-store';
import { notify } from '@/lib/stores/notification-store';
import { COPY_TYPES, COPY_COUNSELORS, AWARENESS_STAGES } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';
import type { 
  Funnel, 
  Proposal, 
  CopyProposal, 
  CopyType, 
  AwarenessStage,
  CopyScorecard,
} from '@/types/database';

// Icon mapping for copy types
const COPY_TYPE_ICONS: Record<CopyType, any> = {
  headline: FileText,
  email_sequence: Mail,
  offer_copy: DollarSign,
  vsl_script: Video,
  ad_creative: Megaphone,
  landing_page: Layout,
};

// Scorecard display component
function CopyScoreDisplay({ scorecard }: { scorecard: CopyScorecard }) {
  const dimensions = [
    { key: 'headlines', label: 'Headlines', weight: '20%' },
    { key: 'structure', label: 'Estrutura', weight: '20%' },
    { key: 'benefits', label: 'Benefícios', weight: '20%' },
    { key: 'offer', label: 'Oferta', weight: '20%' },
    { key: 'proof', label: 'Prova', weight: '20%' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-2">
      {dimensions.map(dim => {
        const score = scorecard[dim.key as keyof CopyScorecard] as number;
        return (
          <div key={dim.key} className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">{dim.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score * 10}%` }}
                  className={cn(
                    'h-full rounded-full',
                    score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                />
              </div>
              <span className={cn('font-medium', getScoreColor(score))}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
        <span className="font-medium text-white">Score Geral</span>
        <span className={cn('text-lg font-bold', getScoreColor(scorecard.overall))}>
          {scorecard.overall.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// Copy proposal card component
function CopyProposalCard({ 
  copyProposal, 
  onDecision,
  isExpanded,
  onToggle,
}: { 
  copyProposal: CopyProposal;
  onDecision: (type: 'approve' | 'adjust' | 'kill', adjustments?: string[]) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustmentText, setAdjustmentText] = useState('');
  
  const TypeIcon = resolveIcon(COPY_TYPE_ICONS, copyProposal.type, FileText, 'CopyProposal type');
  const typeInfo = COPY_TYPES[copyProposal.type];

  const handleCopy = async () => {
    const textToCopy = copyProposal.content.primary;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify.success('Copiado!');
  };

  const handleAdjust = () => {
    if (adjustmentText.trim()) {
      onDecision('adjust', [adjustmentText]);
      setShowAdjustDialog(false);
      setAdjustmentText('');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-hidden"
      >
        {/* Header */}
        <div 
          className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              copyProposal.status === 'approved' ? 'bg-emerald-500/10' :
              copyProposal.status === 'rejected' ? 'bg-red-500/10' :
              'bg-blue-500/10'
            )}>
              <TypeIcon className={cn(
                'h-6 w-6',
                copyProposal.status === 'approved' ? 'text-emerald-400' :
                copyProposal.status === 'rejected' ? 'text-red-400' :
                'text-blue-400'
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate">{copyProposal.name}</h3>
                {copyProposal.status === 'approved' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <CheckCircle2 className="h-3 w-3" />
                    Aprovado
                  </span>
                )}
                {copyProposal.status === 'rejected' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    <XCircle className="h-3 w-3" />
                    Descartado
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                {typeInfo.description} • v{copyProposal.version}
              </p>
            </div>

            {/* Score */}
            <div className={cn(
              'text-lg font-bold',
              copyProposal.scorecard.overall >= 8 ? 'text-emerald-400' :
              copyProposal.scorecard.overall >= 6 ? 'text-amber-400' :
              'text-red-400'
            )}>
              {copyProposal.scorecard.overall.toFixed(1)}
            </div>

            {/* Toggle */}
            <Button variant="ghost" size="sm" className="text-zinc-500">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/[0.06]"
            >
              <div className="p-4 space-y-4">
                {/* Copy content */}
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-400">Copy</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-zinc-500 hover:text-white"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-sm text-white max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    <MarkdownRenderer content={copyProposal.content.primary} />
                  </div>
                  
                  {/* Emails Sequence */}
                  {copyProposal.content.emails && copyProposal.content.emails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400 block mb-3">
                        📧 Sequência de Emails ({copyProposal.content.emails.length})
                      </span>
                      <div className="space-y-4">
                        {copyProposal.content.emails.map((email: { subject?: string; body?: string; delay?: string }, i: number) => (
                          <div key={i} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-emerald-400 font-medium">Email {i + 1}</span>
                              {email.delay && (
                                <span className="text-xs text-zinc-500">⏱️ {email.delay}</span>
                              )}
                            </div>
                            {email.subject && (
                              <div className="mb-2">
                                <span className="text-xs text-zinc-500">Assunto:</span>
                                <p className="text-sm font-medium text-white">{email.subject}</p>
                              </div>
                            )}
                            {email.body && (
                              <div>
                                <span className="text-xs text-zinc-500">Corpo:</span>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap mt-1">{email.body}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VSL Sections */}
                  {copyProposal.content.vslSections && copyProposal.content.vslSections.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400 block mb-3">
                        🎬 Seções do VSL ({copyProposal.content.vslSections.length})
                      </span>
                      <div className="space-y-3">
                        {copyProposal.content.vslSections.map((section: { name?: string; content?: string; duration?: string }, i: number) => (
                          <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-violet-400 font-medium">{section.name || `Seção ${i + 1}`}</span>
                              {section.duration && (
                                <span className="text-xs text-zinc-500">⏱️ {section.duration}</span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{section.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Variations */}
                  {copyProposal.content.variations && copyProposal.content.variations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400 block mb-2">
                        Variações ({copyProposal.content.variations.length})
                      </span>
                      <div className="space-y-2">
                        {copyProposal.content.variations.map((v: string, i: number) => (
                          <div key={i} className="text-sm text-zinc-300 bg-zinc-800/50 p-2 rounded">
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Scorecard */}
                <div>
                  <span className="text-sm font-medium text-zinc-400 block mb-2">Scorecard</span>
                  <CopyScoreDisplay scorecard={copyProposal.scorecard} />
                </div>

                {/* Reasoning */}
                {copyProposal.reasoning && (
                  <div>
                    <span className="text-sm font-medium text-zinc-400 block mb-2">Raciocínio</span>
                    <p className="text-sm text-zinc-300">{copyProposal.reasoning}</p>
                  </div>
                )}

                {/* Copywriter insights */}
                {copyProposal.copywriterInsights && copyProposal.copywriterInsights.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-zinc-400 block mb-2">
                      Insights dos Copywriters
                    </span>
                    <div className="space-y-2">
                      {copyProposal.copywriterInsights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-lg">
                            {COPY_COUNSELORS[insight.copywriterId as keyof typeof COPY_COUNSELORS]?.icon || '✍️'}
                          </span>
                          <div>
                            <span className="font-medium text-white">{insight.copywriterName}</span>
                            <span className="text-zinc-500"> ({insight.expertise})</span>
                            <p className="text-zinc-400 mt-0.5">{insight.insight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {copyProposal.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => onDecision('approve')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => setShowAdjustDialog(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Ajustar
                    </Button>
                    <Button
                      onClick={() => onDecision('kill')}
                      variant="outline"
                      className="text-red-400 hover:text-red-300"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Adjust Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Ajuste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Descreva o que você gostaria de ajustar nesta copy:
            </p>
            <textarea
              value={adjustmentText}
              onChange={(e) => setAdjustmentText(e.target.value)}
              placeholder="Ex: Usar tom mais informal, incluir mais urgência, focar mais na dor..."
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAdjust}
                disabled={!adjustmentText.trim()}
                className="flex-1 btn-accent"
              >
                Solicitar Ajuste
              </Button>
              <Button
                onClick={() => setShowAdjustDialog(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CopyCouncilPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const funnelId = params.id as string;
  const campaignId = searchParams.get('campaignId');
  const urlProposalId = searchParams.get('proposalId');

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]); // Adicionado para auto-seleção
  const [copyProposals, setCopyProposals] = useState<CopyProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<CopyType | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Efetivamente usamos urlProposalId ou a proposta auto-selecionada
  const activeProposalId = urlProposalId || proposal?.id;

  // Load funnel and proposals
  useEffect(() => {
    async function loadData() {
      if (!funnelId) return;
      
      try {
        // Load funnel
        const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
        if (!funnelDoc.exists()) {
          router.push('/funnels');
          return;
        }
        setFunnel({ id: funnelDoc.id, ...funnelDoc.data() } as Funnel);

        // Load all proposals to find the best match (ST-11.6: Auto-selection resilience)
        const proposalsRef = collection(db, 'funnels', funnelId, 'proposals');
        const proposalsSnap = await getDocs(query(proposalsRef, orderBy('version', 'desc')));
        const proposalsData = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proposal));
        setAllProposals(proposalsData);

        // Auto-select logic
        if (urlProposalId) {
          const found = proposalsData.find(p => p.id === urlProposalId);
          if (found) setProposal(found);
        } else if (proposalsData.length > 0) {
          // Se não tem ID na URL, pega a aprovada ou a mais recente
          const approved = proposalsData.find(p => p.status === 'selected' || (p as any).selected);
          setProposal(approved || proposalsData[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [funnelId, urlProposalId, router]);

  // Subscribe to copy proposals
  useEffect(() => {
    if (!funnelId) return;

    const copyProposalsRef = collection(db, 'funnels', funnelId, 'copyProposals');
    const q = activeProposalId 
      ? query(copyProposalsRef, where('proposalId', '==', activeProposalId))
      : copyProposalsRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CopyProposal[];
      setCopyProposals(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => unsubscribe();
  }, [funnelId, activeProposalId]);

  // Generate copy
  const handleGenerateCopy = async (copyType: CopyType) => {
    if (!funnel || !activeProposalId) {
      notify.error('Erro', 'Selecione uma proposta estratégica antes de gerar copy');
      return;
    }

    setIsGenerating(copyType);
    try {
      const conversationId = searchParams.get('id');
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/copy/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          funnelId,
          proposalId: activeProposalId,
          copyType,
          userId: user?.uid,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        notify.success(`${COPY_TYPES[copyType].label} gerado!`, 'O Conselho de Copy terminou');
        // Auto-expand the new card
        if (data.copyProposal?.id) {
          setExpandedCards(prev => new Set([...prev, data.copyProposal.id]));
        }
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      notify.error('Erro', 'Falha ao gerar copy');
    } finally {
      setIsGenerating(null);
    }
  };

  // Handle decision
  const handleDecision = async (copyProposalId: string, type: 'approve' | 'adjust' | 'kill', adjustments?: string[]) => {
    setIsLoading(true); // Bloqueia a tela para garantir o save
    try {
      const decHeaders = await getAuthHeaders();
      const response = await fetch('/api/copy/decisions', {
        method: 'POST',
        headers: decHeaders,
        body: JSON.stringify({
          funnelId,
          campaignId, // ST-11.15: Passa o campaignId único para a persistência atômica
          copyProposalId,
          type,
          userId: user?.uid,
          adjustments,
        }),
      });

      const data = await response.json();

      if (data.success) {
        notify.success(data.message);
        // ST-11.15: Se aprovou, navega de volta para o Golden Thread garantindo o save
        if (type === 'approve') {
          const docId = campaignId || funnelId;
          router.push(`/campaigns/${docId}`);
        }
      } else {
        notify.error('Erro', data.error);
      }
    } catch (error) {
      console.error('Decision Error:', error);
      notify.error('Erro', 'Falha ao processar decisão');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle card expansion
  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Conselho de Copy" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Conselho de Copy" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Funil não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Conselho de Copy" />

      <div className="flex-1 p-8">
        {/* Back link */}
        <Link href={`/campaigns/${campaignId || funnelId}`} className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Comando
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conselho de Copywriting</h1>
              <p className="text-zinc-400">{funnel.name}</p>
            </div>
          </div>
          {proposal && (
            <p className="text-sm text-zinc-500 mt-2">
              Proposta: <span className="text-zinc-300">{proposal.name}</span>
            </p>
          )}
        </motion.div>

        {/* Copy Types Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            Gerar Copy
          </h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {(Object.entries(COPY_TYPES) as [CopyType, typeof COPY_TYPES[CopyType]][]).map(([type, info]) => {
              const Icon = resolveIcon(COPY_TYPE_ICONS, type, FileText, 'CopyType grid');
              const existing = copyProposals.filter(cp => cp.type === type);
              const hasApproved = existing.some(cp => cp.status === 'approved');
              
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGenerateCopy(type)}
                  disabled={isGenerating !== null || !activeProposalId}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all relative overflow-hidden',
                    hasApproved 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700',
                    (isGenerating !== null || !activeProposalId) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isGenerating === type && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <Icon className={cn(
                    'h-6 w-6 mb-2',
                    hasApproved ? 'text-emerald-400' : 'text-zinc-500'
                  )} />
                  <p className="font-medium text-white text-sm">{info.label}</p>
                  <p className="text-xs text-zinc-500 mt-1">{info.description}</p>
                  {existing.length > 0 && (
                    <p className="text-xs text-zinc-600 mt-2">
                      {existing.length} gerado{existing.length > 1 ? 's' : ''}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
          {!activeProposalId && (
            <p className="text-sm text-amber-400 mt-3">
              ⚠️ Selecione uma proposta aprovada para gerar copy
            </p>
          )}
          {activeProposalId && (
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 bg-white/[0.02] border border-white/[0.04] w-fit px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Baseado na Estratégia: <span className="text-zinc-300 font-bold">{proposal?.name}</span>
              {allProposals.length > 1 && (
                <button 
                  onClick={() => setProposal(null)} // Força re-seleção se houver outras
                  className="ml-2 text-emerald-400 hover:underline"
                >
                  Trocar base
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Strategic Proposal Selector (if not selected) */}
        {!activeProposalId && allProposals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"
          >
            <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <AlertCircle className="h-4 w-4" />
              Selecione a base estratégica para esta copy
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allProposals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProposal(p)}
                  className="text-left p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-500">v{p.version}</span>
                    {p.status === 'selected' && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold">Aprovada</span>}
                  </div>
                  <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors truncate">{p.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.summary}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Copy Proposals List */}
        {copyProposals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Propostas de Copy ({copyProposals.length})
              </h2>
            </div>
            <div className="space-y-4">
              {copyProposals.map((cp) => (
                <CopyProposalCard
                  key={cp.id}
                  copyProposal={cp}
                  onDecision={(type, adjustments) => handleDecision(cp.id, type, adjustments)}
                  isExpanded={expandedCards.has(cp.id)}
                  onToggle={() => toggleCard(cp.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {copyProposals.length === 0 && activeProposalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-premium p-12 text-center"
          >
            <Sparkles className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhuma copy gerada ainda
            </h3>
            <p className="text-zinc-500 mb-6">
              Clique em um tipo de copy acima para o Conselho de Copywriting gerar propostas
            </p>
          </motion.div>
        )}

        {/* Copywriters showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Os 9 Copywriters do Conselho
          </h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-9">
            {Object.values(COPY_COUNSELORS).map((copywriter) => (
              <div
                key={copywriter.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"
              >
                <span className="text-2xl">{copywriter.icon}</span>
                <p className="text-sm font-medium text-white mt-2 truncate">
                  {copywriter.name.split(' ').slice(-1)[0]}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {copywriter.expertise}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}


