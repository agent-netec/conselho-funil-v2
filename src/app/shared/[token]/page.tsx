'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  Lock, 
  Clock, 
  AlertTriangle,
  Target,
  Users,
  DollarSign,
  CheckCircle2,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Funnel, Proposal, ProposalScorecard } from '@/types/database';

interface SharedFunnel extends Funnel {
  sharing?: {
    enabled: boolean;
    token: string | null;
    createdAt: Timestamp | null;
    expiresAt: Timestamp | null;
  };
}

export default function SharedFunnelPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [funnel, setFunnel] = useState<SharedFunnel | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedFunnel() {
      try {
        // Query funnel by share token
        const funnelsRef = collection(db, 'funnels');
        const q = query(funnelsRef, where('sharing.token', '==', token));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Link inválido ou expirado');
          setIsLoading(false);
          return;
        }

        const funnelDoc = snapshot.docs[0];
        const funnelData = { id: funnelDoc.id, ...funnelDoc.data() } as SharedFunnel;

        // Check if sharing is enabled
        if (!funnelData.sharing?.enabled) {
          setError('Compartilhamento desativado');
          setIsLoading(false);
          return;
        }

        // Check expiration
        if (funnelData.sharing.expiresAt) {
          const expiresAt = funnelData.sharing.expiresAt.toDate();
          if (expiresAt < new Date()) {
            setError('Link expirado');
            setIsLoading(false);
            return;
          }
        }

        setFunnel(funnelData);

        // Load proposals
        const proposalsRef = collection(db, 'funnels', funnelDoc.id, 'proposals');
        const proposalsSnap = await getDocs(proposalsRef);
        const proposalsData = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proposal));
        setProposals(proposalsData.sort((a, b) => (a.version || 0) - (b.version || 0)));

      } catch (err) {
        console.error('Error loading shared funnel:', err);
        setError('Erro ao carregar funil');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadSharedFunnel();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">{error}</h1>
          <p className="text-zinc-500">
            Este link não está disponível.
          </p>
        </div>
      </div>
    );
  }

  if (!funnel) return null;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Background */}
      <div className="fixed inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
            <Zap className="h-4 w-4" />
            Conselho de Funil
          </div>
          <h1 className="text-3xl font-bold text-white">{funnel.name}</h1>
          {funnel.context?.objective && (
            <p className="text-zinc-400 mt-2">Objetivo: {funnel.context.objective}</p>
          )}
        </motion.div>

        {/* Context Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3 mb-8"
        >
          <div className="card-premium p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Target className="h-4 w-4" />
              Objetivo
            </div>
            <p className="text-white font-medium capitalize">{funnel.context.objective}</p>
          </div>
          
          <div className="card-premium p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Users className="h-4 w-4" />
              Audiência
            </div>
            <p className="text-white font-medium">{funnel.context.audience.who}</p>
          </div>
          
          <div className="card-premium p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <DollarSign className="h-4 w-4" />
              Ticket
            </div>
            <p className="text-white font-medium">{funnel.context.offer.ticket}</p>
          </div>
        </motion.div>

        {/* Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Propostas do Conselho
          </h2>
          
          <div className="space-y-4">
            {proposals.map((proposal, index) => {
              const scorecard = proposal.scorecard as ProposalScorecard | undefined;
              const score = scorecard?.overall || 0;
              
              return (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="card-premium p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                      score >= 7.5 ? 'bg-emerald-500/10' :
                      score >= 6 ? 'bg-amber-500/10' : 'bg-red-500/10'
                    )}>
                      <span className={cn(
                        'text-lg font-bold',
                        score >= 7.5 ? 'text-emerald-400' :
                        score >= 6 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{proposal.name}</h3>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                          v{proposal.version || 1}
                        </span>
                        {proposal.status === 'selected' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" />
                            Aprovada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{proposal.summary}</p>
                      
                      {/* Stages */}
                      {proposal.architecture?.stages && proposal.architecture.stages.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {proposal.architecture.stages.slice(0, 5).map((stage, i) => (
                            <span 
                              key={i}
                              className="text-xs bg-zinc-800/50 text-zinc-400 px-2 py-1 rounded"
                            >
                              {stage.name}
                            </span>
                          ))}
                          {proposal.architecture.stages.length > 5 && (
                            <span className="text-xs text-zinc-500">
                              +{proposal.architecture.stages.length - 5} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-6 border-t border-zinc-800 text-center text-zinc-500 text-sm"
        >
          <p>
            Compartilhado via <span className="text-emerald-400">Conselho de Funil</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}


