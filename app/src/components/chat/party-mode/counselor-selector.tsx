'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Users, X, Sword, Handshake, MessageSquare } from 'lucide-react';

interface CounselorSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  intensity: 'debate' | 'consensus';
  onIntensityChange: (intensity: 'debate' | 'consensus') => void;
  onConfirm?: () => void;
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

const COUNCIL_LABELS: Record<string, string> = {
  funnel: '🏛️ Funil',
  copy: '✍️ Copy',
  social: '🚀 Social',
  ads: '📊 Ads',
};

export function CounselorSelector({
  selectedIds,
  onChange,
  intensity,
  onIntensityChange,
  onConfirm,
}: CounselorSelectorProps) {
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-4 pb-3 border-b border-white/[0.04] bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-fuchsia-500/20 text-fuchsia-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-none uppercase tracking-tighter">Alto Conselho</h3>
            <p className="text-[9px] text-zinc-500 mt-1 font-mono uppercase tracking-wider">Selecione até 3 especialistas</p>
          </div>
        </div>

        {/* Intensity toggle */}
        <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/[0.06] w-fit">
          <button
            onClick={() => onIntensityChange('debate')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all",
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
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all",
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

      {/* Quick combos — visible on all screens */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex flex-wrap gap-2">
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

      {/* Scrollable counselor grid — 2 columns */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
        <div className="space-y-4">
          {Object.entries(groupedCounselors).map(([council, counselors]) => (
            <div key={council}>
              <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] pl-1 mb-2">
                {COUNCIL_LABELS[council]}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {counselors.map((counselor) => {
                  const isSelected = selectedIds.includes(counselor.id);
                  const isLocked = isMaxSelected && !isSelected;

                  return (
                    <motion.button
                      key={counselor.id}
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                      whileTap={!isLocked ? { scale: 0.95 } : {}}
                      onClick={() => toggleCounselor(counselor.id)}
                      disabled={isLocked}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group relative overflow-hidden",
                        isSelected
                          ? "bg-white/[0.05] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                          : isLocked
                            ? "bg-transparent border-transparent opacity-10 grayscale pointer-events-none"
                            : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.1, 0.2, 0.1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: `radial-gradient(circle at center, ${counselor.color}40, transparent 70%)` }}
                        />
                      )}

                      <div
                        className={cn(
                          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-sm transition-all relative z-10",
                          isSelected ? "scale-100" : "scale-90 group-hover:scale-95"
                        )}
                        style={{
                          backgroundColor: isSelected ? `${counselor.color}30` : `${counselor.color}10`,
                          color: counselor.color,
                          border: isSelected ? `1px solid ${counselor.color}50` : `1px solid ${counselor.color}20`
                        }}
                      >
                        {isSelected ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          >
                            <Check className="h-4 w-4 stroke-[3px]" />
                          </motion.div>
                        ) : (
                          <span>{counselor.icon}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 relative z-10">
                        <p className={cn(
                          "text-[11px] font-black tracking-tighter truncate uppercase",
                          isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                        )}>
                          {counselor.name}
                        </p>
                        <p className={cn(
                          "text-[8px] truncate font-mono uppercase tracking-widest mt-0.5",
                          isSelected ? "text-white/60" : "text-zinc-600 group-hover:text-zinc-500"
                        )}>
                          {counselor.expertise}
                        </p>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — sticky at bottom */}
      <div className="shrink-0 px-4 py-3 bg-black/80 border-t border-white/[0.06] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <AnimatePresence mode="wait">
                {selectedIds.map((id) => {
                  const counselor = COUNSELORS_REGISTRY[id as CounselorId];
                  if (!counselor) return null;
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="h-9 w-9 rounded-full border-2 border-zinc-950 flex items-center justify-center text-sm shadow-xl relative z-10"
                      style={{
                        backgroundColor: counselor.color,
                        boxShadow: `0 0 15px ${counselor.color}30`
                      }}
                    >
                      <span>{counselor.icon}</span>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {selectedIds.length === 0 && (
                <div className="h-9 w-9 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-[10px] text-zinc-700 font-black">
                  0/3
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                selectedIds.length === 3 ? "text-emerald-400" : "text-zinc-500"
              )}>
                {selectedIds.length === 3 ? "Mesa Pronta" : "Convocando..."}
              </span>
              <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                {selectedIds.length === 0
                  ? "Aguardando seleção"
                  : `${selectedIds.length} de 3 estrategistas`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05, color: '#f87171' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange([])}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] transition-all"
              >
                <X className="h-3 w-3" />
                Limpar
              </motion.button>
            )}
            {selectedIds.length >= 3 && onConfirm && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Iniciar {intensity === 'debate' ? 'Debate' : 'Consenso'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
