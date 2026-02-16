'use client';

import { motion } from 'framer-motion';
import { Edit2, Trash2, Sparkles, Users, Target, Building2, ChevronRight, Activity, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Brand } from '@/types/database';
import { cn } from '@/lib/utils';
import { calculateBrandCompleteness } from '@/lib/utils/brand-completeness';

interface BrandCardProps {
  brand: Brand;
  onEdit: () => void;
  onDelete: () => void;
  delay?: number;
}

export function BrandCard({ brand, onEdit, onDelete, delay = 0 }: BrandCardProps) {
  const completeness = calculateBrandCompleteness(brand);
  const ahiScore = completeness.score;
  const ahiStatus = ahiScore > 85 ? 'winner' : ahiScore < 60 ? 'critical' : 'stable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group card-premium p-0 overflow-hidden h-full flex flex-col relative"
    >
      {/* Visual Identity Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-600/10 border border-white/[0.05] group-hover:border-emerald-500/30 transition-all">
              <Building2 className="h-6 w-6 text-emerald-400 group-hover:text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {brand.name}
                </h3>
                <Badge className={cn(
                  "text-[9px] px-1.5 h-4 font-bold border-none",
                  ahiStatus === 'winner' ? "bg-emerald-500/20 text-emerald-400" : 
                  ahiStatus === 'critical' ? "bg-red-500/20 text-red-400" : 
                  "bg-amber-500/20 text-amber-400"
                )}>
                  AHI {ahiScore}%
                </Badge>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                {brand.vertical}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Brand Core Context */}
        <div className="space-y-4 mb-8 flex-1">
          <div className="relative p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">
              "{brand.positioning}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-emerald-500/70" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Audiência</span>
              </div>
              <span className="text-xs text-zinc-300 font-medium truncate">{brand.audience.who}</span>
            </div>
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-blue-500/70" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Oferta</span>
              </div>
              <span className="text-xs text-zinc-300 font-medium truncate">{brand.offer.what}</span>
            </div>
          </div>
        </div>

        {/* Intelligence Stats */}
        <div className="pt-4 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>Completude</span>
            </div>
            <span className={ahiScore >= 80 ? 'text-emerald-500' : ahiScore >= 50 ? 'text-amber-500' : 'text-red-500'}>{ahiScore}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ahiScore}%` }}
              className={cn(
                'h-full rounded-full',
                ahiScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : ahiScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              )}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">R$ {Number(brand.offer.ticket).toLocaleString('pt-BR')}</span>
              <span className="text-[10px] text-zinc-600 uppercase font-bold">Ticket</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <span className="text-[10px] font-bold uppercase tracking-tighter">Brand Hub</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}






