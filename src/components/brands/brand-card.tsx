'use client';

import { motion } from 'framer-motion';
import { Edit2, Trash2, Sparkles, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Brand } from '@/types/database';

interface BrandCardProps {
  brand: Brand;
  onEdit: () => void;
  onDelete: () => void;
  delay?: number;
}

/**
 * Card de Marca - Componente de listagem
 * 
 * Exibe as informações resumidas de uma marca com ações de editar/deletar.
 */
export function BrandCard({ brand, onEdit, onDelete, delay = 0 }: BrandCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] transition-all"
    >
      {/* Gradient Overlay (visible on hover) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                aria-label="Editar marca"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              
              <button
                onClick={onDelete}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors"
                aria-label="Excluir marca"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            {brand.name}
          </h3>
          
          <p className="text-sm text-zinc-500">
            {brand.vertical}
          </p>
        </div>

        {/* Positioning */}
        <div className="mb-4">
          <p className="text-sm text-zinc-400 line-clamp-2">
            {brand.positioning}
          </p>
        </div>

        {/* Key Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-400 line-clamp-1">
              {brand.audience.who}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-400 line-clamp-1">
              {brand.offer.what}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Tom: {brand.voiceTone}</span>
            <span>R$ {brand.offer.ticket.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

