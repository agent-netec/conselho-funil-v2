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
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AssetDetailModalProps {
  asset: AssetMetric | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailModal({ asset, isOpen, onOpenChange }: AssetDetailModalProps) {
  const router = useRouter();

  if (!asset) return null;

  const handleConsultCouncil = () => {
    // Redirecionar para o chat com contexto do ativo
    // Usamos o ID do ativo ou nome para o contexto
    const contextParam = encodeURIComponent(`Gostaria de um conselho sobre o ativo: ${asset.name || asset.assetType}. Ele tem um score de ${asset.score}.`);
    router.push(`/chat?mode=general&initialMessage=${contextParam}`);
    onOpenChange(false);
  };

  // Heurísticas extraídas do metadado (fallback para valores mockados se não existirem)
  const heuristics = [
    { label: 'Contraste', value: asset.metadata?.contrast || '85%', icon: Layout, color: 'text-purple-400' },
    { label: 'Legibilidade', value: asset.metadata?.readability || '92%', icon: Eye, color: 'text-blue-400' },
    { label: 'Hook Strength', value: asset.metadata?.hookStrength || '78%', icon: Zap, color: 'text-amber-400' },
    { label: 'Congruência', value: asset.metadata?.congruence || 'High', icon: Target, color: 'text-emerald-400' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950/90 backdrop-blur-2xl border-white/[0.08] text-white p-0 overflow-hidden shadow-2xl">
        <div className="relative">
          {/* Header Visual */}
          <div className="h-32 w-full bg-gradient-to-br from-purple-500/20 via-emerald-500/10 to-zinc-950 border-b border-white/[0.05]" />
          
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
                      asset.namespace === 'visual' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
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
                    {asset.assetType} • Score de Performance: <span className="text-emerald-400">{asset.score}</span>
                  </p>
                </div>

                {/* Heurísticas Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {heuristics.map((h, i) => (
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

                {/* Métricas de Conversão */}
                <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Métricas de Campanha</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">CTR</p>
                      <p className="text-lg font-black text-white">{asset.metrics.ctr}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Conversão</p>
                      <p className="text-lg font-black text-white">{asset.metrics.conversion}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">ROI</p>
                      <p className="text-lg font-black text-white">{asset.metrics.roi}x</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Ação */}
                <button 
                  onClick={handleConsultCouncil}
                  className="w-full group relative flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <MessageSquare className="h-4 w-4" />
                  Consultar Conselho sobre este Ativo
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>

            {/* Strategic Advice Section */}
            {asset.strategicAdvice && (
              <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.05] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Zap className="h-12 w-12 text-amber-500" />
                </div>
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Conselho Estratégico</h3>
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
