'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Star,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Proposal, ProposalScorecard } from '@/types/database';

interface VersionHistoryProps {
  proposals: Proposal[];
  onSelectProposal: (proposalId: string) => void;
  className?: string;
}

interface ProposalGroup {
  original: Proposal;
  versions: Proposal[];
}

function groupProposalsByFamily(proposals: Proposal[]): ProposalGroup[] {
  const groups: Map<string, ProposalGroup> = new Map();
  
  // First pass: identify originals (no parentProposalId)
  proposals.forEach(p => {
    if (!p.parentProposalId) {
      groups.set(p.id, { original: p, versions: [] });
    }
  });
  
  // Second pass: add versions to their parents
  proposals.forEach(p => {
    if (p.parentProposalId && groups.has(p.parentProposalId)) {
      groups.get(p.parentProposalId)!.versions.push(p);
    } else if (p.parentProposalId) {
      // Parent not found, treat as standalone
      groups.set(p.id, { original: p, versions: [] });
    }
  });
  
  // Sort versions by version number
  groups.forEach(group => {
    group.versions.sort((a, b) => (b.version || 0) - (a.version || 0));
  });
  
  return Array.from(groups.values());
}

function VersionCard({ 
  proposal, 
  isOriginal,
  isLatest,
  onSelect 
}: { 
  proposal: Proposal;
  isOriginal: boolean;
  isLatest: boolean;
  onSelect: () => void;
}) {
  const scorecard = proposal.scorecard as ProposalScorecard | undefined;
  const score = scorecard?.overall || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-white/[0.04]',
        isLatest ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.02]'
      )}
      onClick={onSelect}
    >
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
        isLatest ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300'
      )}>
        v{proposal.version || 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {proposal.name}
          </span>
          {isLatest && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
              ATUAL
            </span>
          )}
          {isOriginal && !isLatest && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded">
              ORIGINAL
            </span>
          )}
        </div>
        
        {proposal.appliedAdjustments && proposal.appliedAdjustments.length > 0 && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            Ajustes: {proposal.appliedAdjustments.slice(0, 2).join(', ')}
            {proposal.appliedAdjustments.length > 2 && '...'}
          </p>
        )}
      </div>
      
      <div className={cn(
        'text-sm font-semibold',
        score >= 7.5 ? 'text-emerald-400' :
        score >= 6 ? 'text-amber-400' : 'text-red-400'
      )}>
        {score.toFixed(1)}
      </div>
    </motion.div>
  );
}

function ProposalGroupCard({ 
  group, 
  onSelectProposal 
}: { 
  group: ProposalGroup;
  onSelectProposal: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(group.versions.length > 0);
  const hasVersions = group.versions.length > 0;
  const latestVersion = hasVersions 
    ? group.versions[0] 
    : group.original;
  const allVersions = [group.original, ...group.versions];
  
  const scorecard = latestVersion.scorecard as ProposalScorecard | undefined;
  const score = scorecard?.overall || 0;

  return (
    <div className="card-premium overflow-hidden">
      {/* Main Card Header */}
      <div 
        className={cn(
          'p-4 cursor-pointer transition-colors',
          hasVersions && 'hover:bg-white/[0.02]'
        )}
        onClick={() => hasVersions ? setIsExpanded(!isExpanded) : onSelectProposal(group.original.id)}
      >
        <div className="flex items-start gap-4">
          {/* Score Circle */}
          <div className={cn(
            'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
            score >= 7.5 ? 'bg-emerald-500/10' :
            score >= 6 ? 'bg-amber-500/10' : 'bg-red-500/10'
          )}>
            <div className="text-center">
              <div className={cn(
                'text-xl font-bold',
                score >= 7.5 ? 'text-emerald-400' :
                score >= 6 ? 'text-amber-400' : 'text-red-400'
              )}>
                {score.toFixed(1)}
              </div>
              <div className="text-[10px] text-zinc-500">SCORE</div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white truncate">
                {latestVersion.name}
              </h4>
              {hasVersions && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <GitBranch className="h-3 w-3" />
                  {allVersions.length} versões
                </span>
              )}
            </div>
            
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
              {latestVersion.summary}
            </p>
            
            {/* Status badges */}
            <div className="flex items-center gap-2 mt-2">
              {latestVersion.status === 'selected' && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="h-3 w-3" />
                  Selecionada
                </span>
              )}
              {hasVersions && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  <RefreshCw className="h-3 w-3" />
                  Iterada
                </span>
              )}
            </div>
          </div>
          
          {/* Expand button */}
          {hasVersions ? (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-zinc-500"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Button
              size="sm"
              className="btn-accent"
              onClick={() => onSelectProposal(group.original.id)}
            >
              Ver Detalhes
            </Button>
          )}
        </div>
      </div>
      
      {/* Expanded Version History */}
      <AnimatePresence>
        {isExpanded && hasVersions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06]"
          >
            <div className="p-4 bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-400">
                  Histórico de Versões
                </span>
              </div>
              
              <div className="space-y-2 pl-2 border-l-2 border-zinc-800">
                {allVersions.map((version, idx) => (
                  <VersionCard
                    key={version.id}
                    proposal={version}
                    isOriginal={idx === allVersions.length - 1}
                    isLatest={idx === 0}
                    onSelect={() => onSelectProposal(version.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function VersionHistory({ proposals, onSelectProposal, className }: VersionHistoryProps) {
  const groups = groupProposalsByFamily(proposals);
  
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => (
        <ProposalGroupCard
          key={group.original.id}
          group={group}
          onSelectProposal={onSelectProposal}
        />
      ))}
    </div>
  );
}

