'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Brand } from '@/types/database';

interface RagAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
  assetCount: number;
}

export function RagAssetsModal({ isOpen, onClose, brand, assetCount }: RagAssetsModalProps) {
  const router = useRouter();

  const handleGoToAssets = () => {
    onClose();
    router.push('/assets');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-zinc-900 border border-white/[0.06] p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Documentos RAG</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Enriqueça a IA com seus documentos
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-[#E6B447]/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#E6B447]" />
              </div>
            </div>

            {/* Description */}
            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-300">
                Adicione PDFs, documentos e referencias para que a IA
                entenda melhor sua marca e gere conteudo mais preciso.
              </p>

              {assetCount > 0 ? (
                <p className="text-xs text-[#E6B447]">
                  Voce ja tem {assetCount} asset{assetCount > 1 ? 's' : ''} cadastrado{assetCount > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Nenhum documento adicionado ainda
                </p>
              )}
            </div>

            {/* Supported formats */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                Formatos aceitos
              </p>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'DOC', 'DOCX', 'TXT', 'MD', 'URL'].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.01]">
                <div className="h-5 w-5 rounded-full bg-[#E6B447]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] text-[#E6B447]">1</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Brand Guidelines</p>
                  <p className="text-[10px] text-zinc-500">Manual de marca, tom de voz</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.01]">
                <div className="h-5 w-5 rounded-full bg-[#E6B447]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] text-[#E6B447]">2</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Pesquisas de Mercado</p>
                  <p className="text-[10px] text-zinc-500">Dados de audiencia, concorrentes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.01]">
                <div className="h-5 w-5 rounded-full bg-[#E6B447]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] text-[#E6B447]">3</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">Copies Aprovadas</p>
                  <p className="text-[10px] text-zinc-500">Exemplos de textos que funcionam</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.1] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGoToAssets}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors"
            >
              <Upload className="h-4 w-4" />
              Ir para Assets
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
