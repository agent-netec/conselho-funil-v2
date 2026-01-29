'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCcw, 
  Check, 
  Copy, 
  Zap,
  Target,
  BrainCircuit,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CopyVariation {
  id: string;
  headline: string;
  hook: string;
  justification: string;
  impactScore: number;
}

interface CopyRefactorWizardProps {
  frictionPoint: string;
  originalCopy: string;
  variations: CopyVariation[];
  onApply: (variation: CopyVariation) => void;
  onRegenerate: () => void;
}

export function CopyRefactorWizard({ 
  frictionPoint, 
  originalCopy, 
  variations, 
  onApply, 
  onRegenerate 
}: CopyRefactorWizardProps) {
  const [selectedId, setSelectedId] = useState<string>(variations[0]?.id || '');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const selectedVariation = variations.find(v => v.id === selectedId);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <Card className="bg-zinc-900/50 border-white/[0.03] overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-white/[0.03] bg-zinc-900/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Copy Refactor Wizard</h2>
              <p className="text-xs text-zinc-500">Otimização baseada em fricção detectada pelo Autopsy</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/[0.05] bg-zinc-800/50 hover:bg-zinc-700"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCcw className={cn("mr-2 h-3.5 w-3.5", isRegenerating && "animate-spin")} />
            Regerar Sugestões
          </Button>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Ponto de Fricção Detectado</span>
          </div>
          <p className="text-sm text-zinc-300 italic">"{frictionPoint}"</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Variações */}
        <div className="w-1/3 border-r border-white/[0.03] bg-black/20">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {variations.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group",
                    selectedId === v.id 
                      ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20" 
                      : "bg-zinc-900/50 border-white/[0.03] hover:border-white/[0.1]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase",
                      selectedId === v.id ? "border-emerald-500/30 text-emerald-400" : "text-zinc-500"
                    )}>
                      Variação {idx + 1}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Zap className={cn("h-3 w-3", selectedId === v.id ? "text-amber-400" : "text-zinc-600")} />
                      <span className={cn("text-[10px] font-bold", selectedId === v.id ? "text-white" : "text-zinc-500")}>
                        {v.impactScore}%
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-medium line-clamp-2",
                    selectedId === v.id ? "text-white" : "text-zinc-400"
                  )}>
                    {v.headline}
                  </p>
                  {selectedId === v.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 w-1 h-full bg-emerald-500" 
                    />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detalhes da Variação */}
        <div className="flex-1 bg-zinc-900/20">
          <AnimatePresence mode="wait">
            {selectedVariation ? (
              <motion.div
                key={selectedVariation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <ScrollArea className="flex-1">
                  <div className="p-8 space-y-8">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-400" />
                          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Headline Sugerida</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(selectedVariation.headline)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-6 bg-black/40 rounded-2xl border border-white/[0.03] text-xl font-bold text-white leading-tight">
                        {selectedVariation.headline}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-400" />
                          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Hook / Abertura</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(selectedVariation.hook)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="p-6 bg-black/40 rounded-2xl border border-white/[0.03] text-zinc-300 leading-relaxed italic">
                        "{selectedVariation.hook}"
                      </div>
                    </section>

                    <section className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-emerald-400">Justificativa Técnica (IA)</h3>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {selectedVariation.justification}
                      </p>
                    </section>
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-white/[0.03] bg-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Estimated CVR Lift</span>
                      <span className="text-lg font-bold text-emerald-400">+{selectedVariation.impactScore}%</span>
                    </div>
                  </div>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-900/20"
                    onClick={() => onApply(selectedVariation)}
                  >
                    Aplicar Refatoração
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Selecione uma variação para visualizar
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
