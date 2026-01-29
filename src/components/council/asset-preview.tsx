'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Copy, 
  Zap, 
  BarChart3, 
  ArrowRight, 
  FileText, 
  MessageSquare, 
  Layers, 
  Megaphone,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CouncilOutput {
  strategy: {
    summary: string;
    steps: string[];
    rationale: string;
  };
  market_data: {
    metric: string;
    label: string;
    value: string;
    benchmark_2026: string;
    unit: "%" | "currency" | "number" | "ratio";
    status: "success" | "warning" | "danger" | "neutral";
    source_context: string;
  }[];
  assets: {
    type: "DM_SCRIPT" | "STORY_SEQUENCE" | "AD_COPY" | "HOOK" | "VSL_OUTLINE";
    title: string;
    content: string;
    counselor_reference: string;
  }[];
}

interface AssetPreviewProps {
  data: CouncilOutput;
}

export function AssetPreview({ data }: AssetPreviewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // ST-11.24: Forçar atualização via build
  console.log('[AssetPreview] Build Version: 11.24.4 (Ultra-Resilient Parser Active)');

  // ST-11.6: Fail-safe para dados ausentes ou malformados (QA: INC-003)
  // US-11.24 Fix: Mapeamento resiliente para variações de JSON da IA
  const getNormalizedData = (raw: any): CouncilOutput | null => {
    if (!raw) return null;

    // Se já estiver no formato correto, retorna
    if (raw.strategy?.summary || raw.strategy?.steps) {
      return raw as CouncilOutput;
    }

    // Tentar normalizar variações comuns detectadas no console
    const normalized: Partial<CouncilOutput> = {
      strategy: {
        summary: raw.strategy?.summary || raw.funnel_strategy?.summary || raw.summary || 'Estratégia Sugerida',
        rationale: raw.strategy?.rationale || raw.funnel_strategy?.rationale || raw.rationale || '',
        steps: raw.strategy?.steps || raw.funnel_strategy?.steps || raw.steps || raw.estrategias_aumento_ltv || []
      },
      market_data: raw.market_data || raw.data || [],
      assets: raw.assets || []
    };

    // US-11.24 Ultra-Resiliência: Se temos passos mas o summary falhou, forçamos um summary padrão
    if (normalized.strategy && !normalized.strategy.summary && normalized.strategy.steps && normalized.strategy.steps.length > 0) {
      normalized.strategy.summary = 'Estratégia Detalhada';
    }

    // Se não tem nem passos nem resumo, não é um payload válido
    if (!normalized.strategy?.summary && (!normalized.strategy?.steps || normalized.strategy.steps.length === 0)) {
      return null;
    }

    return normalized as CouncilOutput;
  };

  const normalizedData = getNormalizedData(data);

  if (!normalizedData) {
    console.warn('[AssetPreview] Payload da IA não pôde ser normalizado. Chaves encontradas:', Object.keys(data || {}));
    return null;
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'DM_SCRIPT': return <MessageSquare className="h-4 w-4" />;
      case 'STORY_SEQUENCE': return <Layers className="h-4 w-4" />;
      case 'AD_COPY': return <Megaphone className="h-4 w-4" />;
      case 'HOOK': return <Zap className="h-4 w-4" />;
      case 'VSL_OUTLINE': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="mt-6 space-y-8 animate-in-up">
      {/* Strategy Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-wider text-xs">
          <Lightbulb className="h-4 w-4" />
          Estratégia Recomendada
        </div>
        <Card className="card-premium p-6">
          <h3 className="text-xl font-bold text-white mb-2">{normalizedData.strategy.summary}</h3>
          {normalizedData.strategy.rationale && (
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{normalizedData.strategy.rationale}</p>
          )}
          <div className="space-y-2">
            {normalizedData.strategy.steps?.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-zinc-300 text-sm">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                  {idx + 1}
                </div>
                <span>{typeof step === 'string' ? step : JSON.stringify(step)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Market Data Grid */}
      {normalizedData.market_data && normalizedData.market_data.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-wider text-xs">
            <BarChart3 className="h-4 w-4" />
            Benchmarks de 2026
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.market_data.map((item, idx) => (
              <Card key={idx} className="card-premium card-hover p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-tight">{item.label}</span>
                    <Badge className={cn(
                      "text-[10px] font-bold uppercase",
                      item.status === 'success' ? 'badge-success' : 
                      item.status === 'warning' ? 'badge-warning' : 
                      item.status === 'danger' ? 'badge-error' : 'bg-zinc-800'
                    )}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="stat-value text-2xl">
                      {item.value}
                      {item.unit === '%' ? '%' : ''}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <ArrowRight className="h-3 w-3" />
                      <span>Meta 2026: {item.benchmark_2026}{item.unit === '%' ? '%' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.04] text-[10px] text-zinc-600 italic">
                  {item.source_context}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assets Section */}
      {data.assets && data.assets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold uppercase tracking-wider text-xs">
            <Zap className="h-4 w-4" />
            Ativos Prontos para Uso
          </div>
          <div className="space-y-4">
            {data.assets.map((asset, idx) => (
              <div key={idx} className="group relative">
                <Card className="card-premium p-0 overflow-hidden border-white/[0.06] hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">{asset.title}</h4>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{asset.type}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => handleCopy(asset.content, idx)}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar Script
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-zinc-950/30">
                    <pre className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {asset.content}
                    </pre>
                  </div>
                  <div className="px-4 py-2 bg-white/[0.01] text-[10px] text-zinc-600 flex justify-between items-center">
                    <span>Referência: {asset.counselor_reference}</span>
                    <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="h-3 w-3 text-emerald-500" /> Pronto para disparar
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
