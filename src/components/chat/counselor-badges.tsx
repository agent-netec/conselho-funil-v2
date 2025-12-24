'use client';

import { motion } from 'framer-motion';
import { COUNSELORS, COPY_COUNSELORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CounselorBadgesProps {
  counselors?: string[];
  sources?: Array<{ file: string; counselor?: string; similarity?: number }>;
  compact?: boolean;
}

// All counselors combined
const ALL_COUNSELORS: Record<string, { name: string; icon: string; color: string; expertise: string; council: 'funnel' | 'copy' }> = {
  // Funnel Council
  russell_brunson: { ...COUNSELORS.russell_brunson, council: 'funnel' },
  dan_kennedy: { ...COUNSELORS.dan_kennedy, council: 'funnel' },
  frank_kern: { ...COUNSELORS.frank_kern, council: 'funnel' },
  sam_ovens: { ...COUNSELORS.sam_ovens, council: 'funnel' },
  ryan_deiss: { ...COUNSELORS.ryan_deiss, council: 'funnel' },
  perry_belcher: { ...COUNSELORS.perry_belcher, council: 'funnel' },
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
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border"
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
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border"
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

// Source files list
export function SourcesList({ sources }: { sources?: Array<string | { file?: string; section?: string; similarity?: number }> }) {
  if (!sources || sources.length === 0) return null;

  // Filter and normalize sources
  const validSources = sources
    .map(source => {
      if (typeof source === 'string') {
        return { file: source, section: undefined, similarity: undefined };
      }
      return source;
    })
    .filter(source => source?.file);

  if (validSources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <span className="text-xs text-zinc-600">Fontes:</span>
      {validSources.slice(0, 5).map((source, i) => {
        const fileName = (source.file || 'unknown').split(/[/\\]/).pop()?.replace('.md', '') || 'unknown';
        const similarity = source.similarity ? Math.round(source.similarity * 100) : null;
        
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-400"
            title={`${source.file || 'unknown'}${source.section ? ` > ${source.section}` : ''}`}
          >
            📄 {fileName}
            {similarity && <span className="text-zinc-600">({similarity}%)</span>}
          </span>
        );
      })}
      {validSources.length > 5 && (
        <span className="text-[10px] text-zinc-500">+{validSources.length - 5} mais</span>
      )}
    </div>
  );
}

