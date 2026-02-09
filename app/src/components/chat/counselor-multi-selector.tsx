'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Users, Sword, Handshake, X } from 'lucide-react';

interface CounselorMultiSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  intensity: 'debate' | 'consensus';
  onIntensityChange: (intensity: 'debate' | 'consensus') => void;
}

const SPECIALIST_COMBOS = [
  {
    name: "Direct Response Masters",
    ids: ['gary_halbert', 'dan_kennedy_copy', 'eugene_schwartz'],
    icon: "⚡",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    name: "The Big Three (Funnel)",
    ids: ['russell_brunson', 'frank_kern', 'ryan_deiss'],
    icon: "🎯",
    color: "from-indigo-500/20 to-blue-500/20"
  },
  {
    name: "Social Growth",
    ids: ['justin_welsh', 'nikita_beer', 'rachel_karten'],
    icon: "🚀",
    color: "from-fuchsia-500/20 to-rose-500/20"
  }
];

export function CounselorMultiSelector({
  selectedIds,
  onChange,
  intensity,
  onIntensityChange,
}: CounselorMultiSelectorProps) {
  const isMaxSelected = selectedIds.length >= 3;

  const toggleCounselor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else if (!isMaxSelected) {
      onChange([...selectedIds, id]);
    }
  };

  const applyCombo = (ids: string[]) => {
    onChange(ids);
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
      <div className="p-4 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">Convocação do Alto Conselho</h3>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Selecione até 3 especialistas para a mesa redonda</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            {SPECIALIST_COMBOS.map((combo) => (
              <button
                key={combo.name}
                onClick={() => applyCombo(combo.ids)}
                className={cn(
                  "group relative px-3 py-1.5 rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/20",
                  "bg-gradient-to-br",
                  combo.color
                )}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                <span className="relative z-10 text-[10px] font-bold text-zinc-300 group-hover:text-white flex items-center gap-1.5">
                  <span className="text-xs">{combo.icon}</span>
                  {combo.name}
                </span>
              </button>
            ))}
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
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto no-scrollbar">
        {Object.entries(groupedCounselors).map(([council, counselors]) => (
          <div key={council} className="space-y-3">
            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">
              {council === 'funnel' ? '🏛️ Funil' : 
               council === 'copy' ? '✍️ Copy' : 
               council === 'social' ? '🚀 Social' : '📊 Ads'}
            </h4>
            <div className="space-y-2">
              {counselors.map((counselor) => {
                const isSelected = selectedIds.includes(counselor.id);
                const isLocked = isMaxSelected && !isSelected;
                
                return (
                  <motion.button
                    key={counselor.id}
                    whileHover={!isLocked ? { y: -2, scale: 1.02 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                    onClick={() => toggleCounselor(counselor.id)}
                    disabled={isLocked}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group relative overflow-hidden",
                      isSelected
                        ? "bg-white/[0.1] border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        : isLocked
                          ? "bg-transparent border-transparent opacity-10 grayscale pointer-events-none"
                          : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 opacity-80 hover:opacity-100"
                    )}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.25 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 30% 50%, ${counselor.color}, transparent 100%)` }}
                      />
                    )}
                    
                    <div 
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center text-xl transition-all relative z-10",
                        isSelected ? "scale-100 shadow-[0_0_20px_rgba(0,0,0,0.3)]" : "scale-90 group-hover:scale-95"
                      )}
                      style={{ 
                        backgroundColor: isSelected ? `${counselor.color}50` : `${counselor.color}10`,
                        color: counselor.color,
                        boxShadow: isSelected ? `0 0 20px ${counselor.color}30, inset 0 0 10px ${counselor.color}40` : 'none',
                        border: isSelected ? `1px solid ${counselor.color}60` : `1px solid ${counselor.color}20`
                      }}
                    >
                      {isSelected ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                        >
                          <Check className="h-6 w-6 stroke-[3px]" />
                        </motion.div>
                      ) : (
                        <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{counselor.icon}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className={cn(
                        "text-[13px] font-black tracking-tight truncate",
                        isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                      )}>
                        {counselor.name}
                      </p>
                      <p className={cn(
                        "text-[10px] truncate font-bold uppercase tracking-widest mt-0.5",
                        isSelected ? "text-white/60" : "text-zinc-600 group-hover:text-zinc-500"
                      )}>
                        {counselor.expertise}
                      </p>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_white] animate-pulse" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 bg-black/60 border-t border-white/[0.06] flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            <AnimatePresence mode="wait">
              {selectedIds.map((id, i) => {
                const counselor = COUNSELORS_REGISTRY[id as CounselorId];
                if (!counselor) return null;
                return (
                  <motion.div
                    key={id}
                    initial={{ scale: 0, x: -20, rotate: -20 }}
                    animate={{ scale: 1, x: 0, rotate: 0 }}
                    exit={{ scale: 0, x: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="h-9 w-9 rounded-full border-2 border-zinc-950 flex items-center justify-center text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative z-10 group"
                    style={{ 
                      backgroundColor: counselor.color,
                      boxShadow: `0 0 15px ${counselor.color}40`
                    }}
                  >
                    <span className="group-hover:scale-125 transition-transform">{counselor.icon}</span>
                    <motion.div 
                      layoutId={`indicator-${id}`}
                      className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {selectedIds.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-9 w-9 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-xs text-zinc-700 font-black"
              >
                0/3
              </motion.div>
            )}
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-[11px] font-black uppercase tracking-[0.15em] transition-colors",
              selectedIds.length === 3 ? "text-emerald-400" : "text-zinc-400"
            )}>
              {selectedIds.length === 3 ? "Mesa Pronta" : "Convocação em curso"}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
              {selectedIds.length === 0 
                ? "Aguardando seleção..." 
                : `${selectedIds.length} de 3 estrategistas na mesa`}
            </span>
          </div>
        </div>
        
        {selectedIds.length > 0 && (
          <motion.button 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05, color: '#f87171' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange([])}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] transition-all"
          >
            <X className="h-3 w-3" />
            Despachar
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
