'use client';

import { useState } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Target,
  FileSearch,
  ChevronRight,
  Eye,
  FileDown
} from 'lucide-react';
import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './markdown-renderer';
import { Button } from '@/components/ui/button';
import type { BrandAsset } from '@/types/database';

interface ActiveContextIndicatorProps {
  brandId: string | undefined;
  className?: string;
}

const typeIconMap = {
  guideline: BookOpen,
  brand_book: BookOpen,
  strategy: Target,
  reference: FileSearch,
  other: FileText,
  url: LinkIcon,
  image: ImageIcon,
};

export function ActiveContextIndicator({ brandId, className }: ActiveContextIndicatorProps) {
  const { assets, isLoading } = useBrandAssets(brandId);
  const [isOpen, setIsOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
        <span className="text-xs text-zinc-500 font-medium">Carregando...</span>
      </div>
    );
  }

  const activeCount = assets.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button 
            className={cn(
              "group flex items-center gap-2 px-3 h-9 sm:h-8 rounded-full transition-all duration-300",
              activeCount > 0 
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20" 
                : "bg-zinc-500/10 hover:bg-zinc-500/20 border border-zinc-500/10",
              className
            )}
          >
            <div className="relative shrink-0">
              <Sparkles 
                className={cn(
                  "h-4 w-4 sm:h-3.5 sm:w-3.5 transition-transform duration-500 group-hover:rotate-12",
                  activeCount > 0 ? "text-emerald-400" : "text-zinc-500"
                )} 
              />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            
            <span className={cn(
              "text-xs font-medium tracking-tight transition-colors",
              activeCount > 0 ? "text-emerald-400" : "text-zinc-500"
            )}>
              {activeCount > 0 ? `${activeCount} Ativos` : "Sem contexto"}
            </span>
            
            {activeCount > 0 && (
              <ChevronRight className="h-3 w-3 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
            )}
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/[0.04] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Contexto Ativo da Marca
            </DialogTitle>
            <p className="text-sm text-zinc-500">
              Documentos que personalizam as respostas da IA.
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] px-6 pb-6">
            <div className="space-y-3 mt-4">
              {activeCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-zinc-700" />
                  </div>
                  <p className="text-sm text-zinc-400">Nenhum asset encontrado.</p>
                </div>
              ) : (
                assets.map((asset) => {
                  const Icon = typeIconMap[asset.type] || FileText;
                  const hasText = !!asset.extractedText?.trim();
                  
                  return (
                    <div 
                      key={asset.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-white/[0.04] text-zinc-400 group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium text-white truncate" title={asset.name}>
                            {asset.name}
                          </h4>
                          {hasText && (
                            <button
                              onClick={() => setPreviewAsset(asset)}
                              className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                              title="Ver texto extraído"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-white/[0.02] text-zinc-500 border-white/[0.04] capitalize">
                            {asset.type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {asset.status === 'ready' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] text-emerald-500/80">Pronto</span>
                              </>
                            ) : asset.status === 'processing' ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                <span className="text-[10px] text-amber-500/80">Processando</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 text-red-500" />
                                <span className="text-[10px] text-red-500/80">Erro</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-2xl bg-zinc-950 border-white/[0.04] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-white text-base">
                    Preview: {previewAsset?.name}
                  </DialogTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Texto extraído e processado para o RAG
                  </p>
                </div>
              </div>
              <a 
                href={previewAsset?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <FileDown className="h-3.5 w-3.5" />
                Original
              </a>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[60vh] p-6 bg-zinc-900/30">
            {previewAsset?.extractedText ? (
              <MarkdownRenderer content={previewAsset.extractedText} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <AlertCircle className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Nenhum texto extraído disponível.</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t border-white/[0.04] bg-zinc-950/50 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setPreviewAsset(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            >
              Fechar Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

