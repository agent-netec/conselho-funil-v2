'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Users, Sword, Handshake } from 'lucide-react';

interface CounselorMultiSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  intensity: 'debate' | 'consensus';
  onIntensityChange: (intensity: 'debate' | 'consensus') => void;
}

export function CounselorMultiSelector({
  selectedIds,
  onChange,
  intensity,
  onIntensityChange,
}: CounselorMultiSelectorProps) {
  const toggleCounselor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Group counselors by their expertise/council area
  const groupedCounselors = useMemo(() => {
    const registry = Object.values(COUNSELORS_REGISTRY);
    return {
      funnel: registry.filter(c => [
        'russell_brunson', 'dan_kennedy', 'frank_kern', 'sam_ovens', 'ryan_deiss', 'perry_belcher'
      ].includes(c.id)),
      copy: registry.filter(c => [
        'eugene_schwartz', 'claude_hopkins', 'gary_halbert', 'joseph_sugarman', 'david_ogilvy', 
        'john_carlton', 'drayton_bird', 'frank_kern_copy', 'dan_kennedy_copy'
      ].includes(c.id)),
      social: registry.filter(c => [
        'lia_haberman', 'rachel_karten', 'nikita_beer', 'justin_welsh'
      ].includes(c.id)),
      ads: registry.filter(c => [
        'justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez'
      ].includes(c.id)),
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl mb-4"
    >
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">Convocação do Alto Conselho</h3>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Selecione quem participa da mesa redonda</p>
          </div>
        </div>

        <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/[0.06]">
          <button
            onClick={() => onIntensityChange('debate')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
              intensity === 'debate' 
                ? "bg-fuchsia-500 text-white shadow-[0_0_10px_rgba(217,70,239,0.3)]" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Sword className="h-3 w-3" />
            DEBATE
          </button>
          <button
            onClick={() => onIntensityChange('consensus')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all",
              intensity === 'consensus' 
                ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Handshake className="h-3 w-3" />
            CONSENSO
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto no-scrollbar">
        {Object.entries(groupedCounselors).map(([council, counselors]) => (
          <div key={council} className="space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">
              {council === 'funnel' ? '🏛️ Funil' : 
               council === 'copy' ? '✍️ Copy' : 
               council === 'social' ? '🚀 Social' : '📊 Ads'}
            </h4>
            <div className="space-y-1">
              {counselors.map((counselor) => {
                const isSelected = selectedIds.includes(counselor.id);
                return (
                  <button
                    key={counselor.id}
                    onClick={() => toggleCounselor(counselor.id)}
                    className={cn(
                      "w-full flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left group",
                      isSelected
                        ? "bg-white/[0.05] border-white/10 shadow-sm"
                        : "bg-transparent border-transparent hover:bg-white/[0.02] opacity-60 hover:opacity-100"
                    )}
                  >
                    <div 
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center text-sm transition-all",
                        isSelected ? "scale-100" : "scale-90 group-hover:scale-95"
                      )}
                      style={{ 
                        backgroundColor: isSelected ? `${counselor.color}30` : `${counselor.color}10`,
                        color: counselor.color 
                      }}
                    >
                      {isSelected ? <Check className="h-4 w-4 stroke-[3px]" /> : counselor.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-semibold truncate",
                        isSelected ? "text-white" : "text-zinc-400"
                      )}>
                        {counselor.name}
                      </p>
                      <p className="text-[9px] text-zinc-600 truncate">{counselor.expertise}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 bg-black/20 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">
          {selectedIds.length} especialista{selectedIds.length !== 1 ? 's' : ''} convocado{selectedIds.length !== 1 ? 's' : ''}
        </span>
        {selectedIds.length > 0 && (
          <button 
            onClick={() => onChange([])}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Limpar seleção
          </button>
        )}
      </div>
    </motion.div>
  );
}
