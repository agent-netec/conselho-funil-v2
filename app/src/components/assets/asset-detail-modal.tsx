'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AssetMetric } from '@/lib/hooks/use-asset-metrics';
import { motion } from 'framer-motion';
import {
  ImageIcon,
  FileText,
  TrendingUp,
  MessageSquare,
  Zap,
  Target,
  Layout,
  Eye,
  ArrowUpRight,
  Trash2,
  Loader2,
  Palette,
  ScanEye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

interface AssetDetailModalProps {
  asset: AssetMetric | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (assetId: string) => Promise<void>;
  onAnalyzeVisual?: (assetId: string, imageUri: string) => Promise<void>;
}

/** Parse heuristics_summary JSON from Pinecone metadata */
function parseHeuristics(metadata: any): {
  legibility: number | null;
  colorPsychology: number | null;
  visualHooks: string | null;
  hasData: boolean;
} {
  try {
    const raw = metadata?.heuristics_summary;
    if (!raw) return { legibility: null, colorPsychology: null, visualHooks: null, hasData: false };
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      legibility: parsed?.legibility?.score ?? null,
      colorPsychology: parsed?.colorPsychology?.score ?? null,
      visualHooks: parsed?.visualHooks?.effectiveness ?? (parsed?.visualHooks?.presence ? 'Presente' : null),
      hasData: true,
    };
  } catch {
    return { legibility: null, colorPsychology: null, visualHooks: null, hasData: false };
  }
}

export function AssetDetailModal({ asset, isOpen, onOpenChange, onDelete, onAnalyzeVisual }: AssetDetailModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const heuristics = useMemo(() => {
    if (!asset) return { legibility: null, colorPsychology: null, visualHooks: null, hasData: false };
    return parseHeuristics(asset.metadata);
  }, [asset]);

  if (!asset) return null;

  const isVisualAsset = asset.namespace === 'visual';
  const isImageAsset = !!asset.imageUri || asset.assetType?.toLowerCase().includes('image');
  const canAnalyze = isImageAsset && !isVisualAsset && onAnalyzeVisual;

  const handleConsultCouncil = () => {
    const contextParam = encodeURIComponent(`Gostaria de uma análise sobre o ativo: ${asset.name || asset.assetType}. Ele tem um score de ${asset.score}.`);
    router.push(`/chat?mode=general&initialMessage=${contextParam}`);
    onOpenChange(false);
  };

  const handleAnalyze = async () => {
    if (!onAnalyzeVisual) return;
    const uri = asset.imageUri || asset.url;
    if (!uri) return;
    setIsAnalyzing(true);
    try {
      await onAnalyzeVisual(asset.id, uri);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Build heuristics display items for visual assets
  const heuristicItems = isVisualAsset ? [
    { label: 'Psicologia de Cores', value: heuristics.colorPsychology !== null ? `${heuristics.colorPsychology}%` : 'Sem dados', icon: Palette, color: 'text-[#E6B447]' },
    { label: 'Legibilidade', value: heuristics.legibility !== null ? `${heuristics.legibility}%` : 'Sem dados', icon: Eye, color: 'text-blue-400' },
    { label: 'Hook Visual', value: heuristics.visualHooks || 'Sem dados', icon: Zap, color: 'text-amber-400' },
    { label: 'Score Geral', value: asset.score > 0 ? `${asset.score}/100` : 'N/A', icon: Target, color: 'text-[#E6B447]' },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950/90 backdrop-blur-2xl border-white/[0.08] text-white p-0 overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">
          {asset.name || asset.assetType}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes do ativo {asset.name || asset.assetType}
        </DialogDescription>
        <div className="relative">
          {/* Header Visual */}
          <div className="h-32 w-full bg-gradient-to-br from-[#E6B447]/20 via-[#E6B447]/10 to-zinc-950 border-b border-white/[0.05]" />

          <div className="px-6 pb-6 -mt-12 relative z-10">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Preview do Ativo */}
              <div className="w-full md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.1] shadow-2xl flex items-center justify-center group relative"
                >
                  {asset.imageUri ? (
                    <img
                      src={asset.imageUri}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                      <FileText className="h-12 w-12 opacity-20" />
                      <span className="text-xs font-mono uppercase tracking-widest">Documento de Texto</span>
                    </div>
                  )}

                  {/* Overlay Glass */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Preview em Alta Fidelidade</span>
                  </div>
                </motion.div>
              </div>

              {/* Informações e Heurísticas */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      isVisualAsset ? "bg-[#E6B447]/10 border-[#E6B447]/20 text-[#E6B447]" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}>
                      {asset.namespace}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                      {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter text-white leading-tight">
                    {asset.name || asset.assetType}
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1 font-medium">
                    {asset.assetType} • Score de Performance: <span className={asset.score > 0 ? "text-[#E6B447]" : "text-zinc-500"}>{asset.score > 0 ? asset.score : 'N/A'}</span>
                  </p>
                </div>

                {/* Heurísticas Grid — only for visual namespace assets (1.6.4) */}
                {isVisualAsset && (
                  <div className="grid grid-cols-2 gap-3">
                    {heuristicItems.map((h, i) => (
                      <motion.div
                        key={h.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h.icon className={cn("h-3.5 w-3.5", h.color)} />
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{h.label}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{h.value}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Knowledge asset info (1.6.4) */}
                {!isVisualAsset && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</span>
                      </div>
                      <span className="text-sm font-bold text-white">{asset.assetType}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-2 mb-1">
                        <Layout className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</span>
                      </div>
                      <span className="text-sm font-bold text-white capitalize">{asset.status || 'ready'}</span>
                    </div>
                  </div>
                )}

                {/* Métricas de Conversão */}
                <div className="p-4 rounded-xl bg-[#E6B447]/[0.03] border border-[#E6B447]/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-[#E6B447] uppercase tracking-widest">Métricas de Campanha</span>
                    <TrendingUp className="h-4 w-4 text-[#E6B447]" />
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">CTR</p>
                      <p className="text-lg font-black text-white">{asset.metrics?.ctr ?? '0'}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Conversão</p>
                      <p className="text-lg font-black text-white">{asset.metrics?.conversion ?? '0'}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">ROI</p>
                      <p className="text-lg font-black text-white">{asset.metrics?.roi ?? '0'}x</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {/* Analyze Visual button — for image assets not yet analyzed (1.6.2) */}
                  {canAnalyze && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 group relative flex items-center justify-center gap-3 h-12 rounded-xl bg-[#E6B447] text-white font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:bg-[#F0C35C] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</>
                      ) : (
                        <><ScanEye className="h-4 w-4" /> Analisar Visual</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleConsultCouncil}
                    className={cn(
                      "group relative flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]",
                      canAnalyze ? "flex-1" : "flex-1"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E6B447] to-[#AB8648] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <MessageSquare className="h-4 w-4" />
                    Consultar MKTHONEY
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  {onDelete && (
                    <button
                      onClick={async () => {
                        if (!confirm('Tem certeza? Isso remove o asset e todos os chunks vetorizados.')) return;
                        setIsDeleting(true);
                        try {
                          await onDelete(asset.id);
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                      className="h-12 w-12 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center disabled:opacity-50"
                      aria-label="Deletar asset"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Strategic Advice Section */}
            {asset.strategicAdvice && (
              <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.05] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Zap className="h-12 w-12 text-amber-500" />
                </div>
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Recomendação Estratégica</h3>
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  "{asset.strategicAdvice}"
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
