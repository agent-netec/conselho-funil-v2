'use client';

import { motion } from 'framer-motion';
import { COUNSELORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink, Target, Info } from 'lucide-react';

interface Source {
  file: string;
  section?: string;
  content?: string;
  similarity?: number;
  rerankScore?: number;
  counselor?: string;
  type?: 'brand_asset' | 'upload' | 'url';
}

interface Counselor {
  name: string;
  icon: string;
  color: string;
  expertise: string;
  council: 'funnel' | 'copy';
}

interface CounselorBadgesProps {
  counselors?: string[];
  sources?: Source[];
  compact?: boolean;
}

// All counselors combined
const ALL_COUNSELORS: Record<string, Counselor> = {
  // Funnel Council
  russell_brunson: { ...COUNSELORS.russell_brunson, council: 'funnel' } as Counselor,
  dan_kennedy: { ...COUNSELORS.dan_kennedy, council: 'funnel' } as Counselor,
  frank_kern: { ...COUNSELORS.frank_kern, council: 'funnel' } as Counselor,
  sam_ovens: { ...COUNSELORS.sam_ovens, council: 'funnel' } as Counselor,
  ryan_deiss: { ...COUNSELORS.ryan_deiss, council: 'funnel' } as Counselor,
  perry_belcher: { ...COUNSELORS.perry_belcher, council: 'funnel' } as Counselor,
  // Copy Council
  eugene_schwartz: { name: 'Eugene Schwartz', icon: '🎯', color: '#6366f1', expertise: 'Consciência de Mercado', council: 'copy' },
  claude_hopkins: { name: 'Claude Hopkins', icon: '🔬', color: '#3b82f6', expertise: 'Método Científico', council: 'copy' },
  gary_halbert: { name: 'Gary Halbert', icon: '⚡', color: '#f59e0b', expertise: 'Headlines', council: 'copy' },
  joseph_sugarman: { name: 'Joseph Sugarman', icon: '📖', color: '#8b5cf6', expertise: 'Storytelling', council: 'copy' },
  david_ogilvy: { name: 'David Ogilvy', icon: '👔', color: '#64748b', expertise: 'Brand Premium', council: 'copy' },
  john_carlton: { name: 'John Carlton', icon: '🎤', color: '#ec4899', expertise: 'Voz Autêntica', council: 'copy' },
  drayton_bird: { name: 'Drayton Bird', icon: '✂️', color: '#14b8a6', expertise: 'Simplicidade', council: 'copy' },
  // Heuristics mapping
  copy_consciencia: { name: 'Eugene Schwartz', icon: '🎯', color: '#6366f1', expertise: 'Consciência de Mercado', council: 'copy' },
  copy_headline: { name: 'Gary Halbert', icon: '⚡', color: '#f59e0b', expertise: 'Headlines', council: 'copy' },
  copy_oferta: { name: 'Dan Kennedy', icon: '💰', color: '#10b981', expertise: 'Oferta & Urgência', council: 'copy' },
  copy_fluxo: { name: 'John Carlton', icon: '🎤', color: '#ec4899', expertise: 'Fluxo Natural', council: 'copy' },
  copy_premium: { name: 'David Ogilvy', icon: '👔', color: '#64748b', expertise: 'Brand Premium', council: 'copy' },
};

export function CounselorBadges({ counselors, sources, compact = false }: CounselorBadgesProps) {
  // Gather unique counselors
  const uniqueCounselors = new Set<string>();
  
  counselors?.forEach(c => uniqueCounselors.add(c));
  sources?.forEach(s => {
    if (s.counselor) uniqueCounselors.add(s.counselor);
  });

  if (uniqueCounselors.size === 0) return null;

  const counselorList = Array.from(uniqueCounselors)
    .map(id => ALL_COUNSELORS[id])
    .filter(Boolean);

  if (counselorList.length === 0) return null;

  // Group by council
  const funnelCounselors = counselorList.filter(c => c.council === 'funnel');
  const copyCounselors = counselorList.filter(c => c.council === 'copy');

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {counselorList.map((counselor, i) => {
          const lastName = counselor.name?.split(' ').pop() || counselor.name || 'Unknown';
          return (
            <motion.span
              key={(counselor.name || 'counselor') + i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${counselor.color}15`, color: counselor.color }}
            >
              <span>{counselor.icon}</span>
              <span className="font-medium">{lastName}</span>
            </motion.span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-zinc-500 font-medium">Conselheiros consultados</span>
      </div>
      
      <div className="space-y-2">
        {funnelCounselors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider mr-1">Funil:</span>
            {funnelCounselors.map((counselor, i) => (
              <motion.span
                key={counselor.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border cursor-default"
                style={{ 
                  backgroundColor: `${counselor.color}10`, 
                  borderColor: `${counselor.color}30`,
                  color: counselor.color 
                }}
                title={counselor.expertise}
              >
                <span>{counselor.icon}</span>
                <span className="font-medium">{counselor.name}</span>
              </motion.span>
            ))}
          </div>
        )}
        
        {copyCounselors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider mr-1">Copy:</span>
            {copyCounselors.map((counselor, i) => (
              <motion.span
                key={counselor.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border cursor-default"
                style={{ 
                  backgroundColor: `${counselor.color}10`, 
                  borderColor: `${counselor.color}30`,
                  color: counselor.color 
                }}
                title={counselor.expertise}
              >
                <span>{counselor.icon}</span>
                <span className="font-medium">{counselor.name}</span>
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourcePopover({ source }: { source: Source }) {
  const fileName = source.file.split(/[/\\]/).pop()?.replace('.md', '') || 'Documento';
  const score = source.rerankScore || source.similarity || 0;
  const scorePercentage = Math.round(score * 100);
  const isBrandAsset = source.type === 'brand_asset';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-all",
            "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
            "border border-transparent",
            isBrandAsset && "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/90 hover:bg-emerald-500/10"
          )}
        >
          <FileText className="size-3" />
          {fileName}
          {score > 0 && (
            <span className={cn("text-[9px] opacity-60 ml-0.5", isBrandAsset ? "text-emerald-500" : "text-zinc-500")}>
              {scorePercentage}%
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-80 bg-zinc-900 border-zinc-800 p-0 overflow-hidden shadow-2xl"
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded",
              isBrandAsset ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-400"
            )}>
              <FileText className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-200 truncate max-w-[180px]">
                {fileName}
              </h4>
              <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">
                {source.type || 'Documento'} {source.section && `• ${source.section}`}
              </p>
            </div>
          </div>
          <a 
            href="#" 
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        <div className="p-3 space-y-3">
          {source.content && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Info className="size-3" />
                <span>Snippet extraído</span>
              </div>
              <ScrollArea className="h-24 w-full rounded border border-zinc-800/50 bg-black/20 p-2">
                <p className="text-[11px] leading-relaxed text-zinc-400 italic">
                  "{source.content.length > 300 ? `${source.content.substring(0, 300)}...` : source.content}"
                </p>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Target className="size-3" />
                <span>Relevância Contextual</span>
              </div>
              <span className={cn(
                "font-mono font-medium",
                score > 0.8 ? "text-emerald-500" : "text-zinc-400"
              )}>
                {scorePercentage}%
              </span>
            </div>
            <Progress 
              value={scorePercentage} 
              className="h-1 bg-zinc-800"
              indicatorClassName={cn(
                score > 0.8 ? "bg-emerald-500" : "bg-zinc-500"
              )}
            />
          </div>

          {source.counselor && (
            <div className="pt-1 flex items-center gap-2">
               <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Associado a:</span>
               <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-[10px]">{ALL_COUNSELORS[source.counselor]?.icon}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {ALL_COUNSELORS[source.counselor]?.name.split(' ').pop()}
                  </span>
               </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Source files list
export function SourcesList({ sources }: { sources?: Array<string | Source> }) {
  if (!sources || sources.length === 0) return null;

  // Filter and normalize sources
  const validSources = sources
    .map(source => {
      if (typeof source === 'string') {
        return { file: source } as Source;
      }
      return source;
    })
    .filter(source => source?.file);

  if (validSources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
      <span className="text-xs text-zinc-600 font-medium mr-0.5">Fontes:</span>
      {validSources.slice(0, 6).map((source, i) => (
        <SourcePopover key={i} source={source} />
      ))}
      {validSources.length > 6 && (
        <span className="text-[10px] text-zinc-500 ml-1">
          +{validSources.length - 6} mais
        </span>
      )}
    </div>
  );
}

