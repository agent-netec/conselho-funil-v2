'use client';

/**
 * ReviewCard — Card para exibir item em review com acoes approve/reject
 *
 * @component
 * @story S33-APR-03
 */

import { useState } from 'react';
import { StatusBadge } from './status-badge';
import { FileText, Image, Layers, Film, Check, X, Calendar } from 'lucide-react';
import type { CalendarItem } from '@/types/content';

const FORMAT_ICONS: Record<string, typeof FileText> = {
  post: FileText,
  story: Image,
  carousel: Layers,
  reel: Film,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
};

interface ReviewCardProps {
  item: CalendarItem;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string, comment: string) => void;
}

export function ReviewCard({ item, onApprove, onReject }: ReviewCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [isActing, setIsActing] = useState(false);

  const FormatIcon = FORMAT_ICONS[item.format] ?? FileText;

  const scheduledMs = item.scheduledDate?.toMillis?.()
    ?? (item.scheduledDate?.seconds ? item.scheduledDate.seconds * 1000 : 0);
  const scheduledLabel = scheduledMs
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(scheduledMs))
    : '—';

  const contentPreview = item.content?.length > 150
    ? item.content.slice(0, 150) + '...'
    : item.content || 'Sem conteudo';

  const handleApprove = async () => {
    setIsActing(true);
    await onApprove(item.id);
    setIsActing(false);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) return;
    setIsActing(true);
    await onReject(item.id, rejectComment);
    setIsActing(false);
    setShowRejectModal(false);
    setRejectComment('');
  };

  return (
    <>
      <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-xl p-5 hover:border-zinc-600/50 transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/50">
              <FormatIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{item.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-500">{PLATFORM_LABELS[item.platform] ?? item.platform}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-500 capitalize">{item.format}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Content preview */}
        <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-zinc-400 leading-relaxed">{contentPreview}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Calendar className="h-3.5 w-3.5" />
            {scheduledLabel}
          </div>
          {item.metadata?.generatedBy === 'ai' && (
            <span className="text-xs text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded">IA</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={isActing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Aprovar
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isActing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Rejeitar
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Rejeitar Conteudo</h3>
            <p className="text-sm text-zinc-400 mb-4">Informe o motivo da rejeicao (obrigatorio):</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Motivo da rejeicao..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm min-h-[100px] focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectComment(''); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectComment.trim() || isActing}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Confirmar Rejeicao
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
