'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreativePerformance, CopyVariant } from '@/types/creative';
import { Sparkles, BrainCircuit, Target, ShieldCheck, Loader2, Copy as CopyIcon, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface CopyLabModalProps {
  creative: CreativePerformance | null;
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
}

type Angle = 'fear' | 'greed' | 'authority' | 'curiosity';

export function CopyLabModal({ creative, isOpen, onClose, brandId }: CopyLabModalProps) {
  const [activeAngle, setActiveAngle] = useState<Angle>('greed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!creative) return;
    
    try {
      setIsGenerating(true);
      setVariants([]);
      
      const response = await fetch('/api/intelligence/creative/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          baseCopy: "Adicione aqui a copy base do anúncio original ou extraída via OCR", // No futuro virá do creative.metadata
          angle: activeAngle,
        })
      });

      if (!response.ok) throw new Error('Falha na geração');
      const data = await response.json();
      setVariants(data.variants);
      
      toast.success("Variantes Geradas!", {
        description: `3 novas opções baseadas em ${activeAngle} estão prontas.`,
      });
    } catch (error) {
      toast.error("Erro na Geração", {
        description: "Não foi possível conectar ao motor de IA.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.info("Copiado!", {
      description: "Conteúdo pronto para colar no Gerenciador de Anúncios.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-white/[0.1] text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">AI Copy Variation Lab</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Gere variações persuasivas baseadas em ganchos psicológicos para este criativo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Sidebar de Configuração */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ângulo Psicológico</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'fear', label: 'Medo (FOMO)', icon: AlertTriangle, color: 'text-rose-400' },
                  { id: 'greed', label: 'Ganância (ROI)', icon: TrendingUp, color: 'text-emerald-400' },
                  { id: 'authority', label: 'Autoridade', icon: ShieldCheck, color: 'text-blue-400' },
                  { id: 'curiosity', label: 'Curiosidade', icon: Sparkles, color: 'text-amber-400' },
                ].map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => setActiveAngle(angle.id as Angle)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      activeAngle === angle.id 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-transparent border-white/[0.05] text-zinc-500 hover:border-white/10'
                    }`}
                  >
                    <angle.icon className={`h-4 w-4 ${activeAngle === angle.id ? angle.color : ''}`} />
                    <span className="text-sm font-bold">{angle.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black rounded-xl gap-2 shadow-lg shadow-purple-500/20"
            >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              GERAR VARIANTES
            </Button>
          </div>

          {/* Área de Resultados */}
          <div className="md:col-span-2 bg-zinc-900/50 rounded-2xl border border-white/[0.05] p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <BrainCircuit className="h-8 w-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-zinc-400 font-medium animate-pulse">Consultando o motor criativo...</p>
                </motion.div>
              ) : variants.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {variants.map((variant, idx) => (
                    <div key={idx} className="group relative bg-zinc-950 border border-white/[0.05] rounded-xl p-4 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-white/10">Opção {idx + 1}</Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-white"
                          onClick={() => copyToClipboard(`${variant.headline}\n\n${variant.primaryText}`, idx)}
                        >
                          {copiedIndex === idx ? <Check className="h-4 w-4 text-emerald-400" /> : <CopyIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                      <h4 className="text-sm font-black text-white mb-2">{variant.headline}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{variant.primaryText}</p>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Target className="h-12 w-12" />
                  <div>
                    <p className="font-bold">Nenhuma variante gerada</p>
                    <p className="text-xs">Escolha um ângulo e clique em Gerar para começar.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
