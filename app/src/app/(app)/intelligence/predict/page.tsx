'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { usePredictScore, useGenerateAds, useAnalyzeText } from '@/lib/hooks/use-intelligence-predict';

import { TextInput } from '@/components/intelligence/text-input';
import { PredictionPanel } from '@/components/intelligence/predictor/prediction-panel';
import { AdPreviewSystem } from '@/components/intelligence/ad-preview/ad-preview-system';

import type { TextInputType, TextInputFormat } from '@/types/text-analysis';

export default function PredictPage() {
  const activeBrand = useActiveBrand();
  const brandId = activeBrand?.id ?? '';
  const brandName = activeBrand?.name ?? 'Marca';

  const predictor = usePredictScore();
  const adsGenerator = useGenerateAds();
  const textAnalyzer = useAnalyzeText();

  const [step, setStep] = useState<'input' | 'results'>('input');

  /** Fluxo principal: Analyze Text → Predict Score → (opcionalmente) Generate Ads */
  const handleAnalyze = useCallback(async (params: {
    text: string;
    textType: TextInputType;
    format?: TextInputFormat;
  }) => {
    if (!brandId) {
      toast.error('Nenhuma marca ativa. Selecione uma marca para continuar.');
      return;
    }

    // Step 1: Analyze text
    const analysisResult = await textAnalyzer.analyze({
      brandId,
      text: params.text,
      textType: params.textType,
      format: params.format,
      options: {
        includeScoring: true,
        includeSuggestions: true,
        persistResult: true,
      },
    });

    if (!analysisResult) {
      toast.error('Erro na análise de texto. Tente novamente.');
      return;
    }

    setStep('results');

    // Step 2: Predict score (se não veio no analyze)
    if (!analysisResult.scoring) {
      await predictor.predict({
        brandId,
        funnelData: analysisResult.uxIntelligence,
        options: {
          includeRecommendations: true,
          includeBenchmark: true,
        },
      });
    }
  }, [brandId, textAnalyzer, predictor]);

  /** Gerar ads otimizados a partir do score */
  const handleGenerateAds = useCallback(async () => {
    if (!brandId) return;

    const sourceData = textAnalyzer.data?.uxIntelligence;
    if (!sourceData) {
      toast.error('Execute a análise de texto primeiro.');
      return;
    }

    await adsGenerator.generate({
      brandId,
      eliteAssets: sourceData,
      formats: ['meta_feed', 'meta_stories', 'google_search'],
      options: { maxVariations: 3 },
    });
  }, [brandId, textAnalyzer.data, adsGenerator]);

  /** Reset para novo input */
  const handleReset = useCallback(() => {
    setStep('input');
    predictor.reset();
    adsGenerator.reset();
    textAnalyzer.reset();
  }, [predictor, adsGenerator, textAnalyzer]);

  // Derivar score data (do analyze ou do predict separado)
  const scoreData = textAnalyzer.data?.scoring ?? predictor.data;
  const isScoring = textAnalyzer.loading || predictor.loading;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link href="/intelligence/discovery">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Predictive Engine
            </h1>
            <p className="text-muted-foreground text-sm">
              Analise textos, preveja conversão e gere anúncios otimizados.
            </p>
          </div>
          {brandId && (
            <Badge variant="outline" className="text-xs">
              {brandName}
            </Badge>
          )}
        </div>
      </div>

      {/* No brand guard */}
      {!brandId && (
        <div className="text-center py-16 space-y-4">
          <Brain className="h-12 w-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-500">Selecione uma marca para usar o Predictive Engine.</p>
        </div>
      )}

      {brandId && (
        <AnimatePresence mode="wait">
          {/* INPUT STEP */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TextInput
                onAnalyze={handleAnalyze}
                loading={textAnalyzer.loading}
              />
            </motion.div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Back + New Analysis */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Nova Análise
                </Button>

                {scoreData && !adsGenerator.data && (
                  <Button
                    onClick={handleGenerateAds}
                    disabled={adsGenerator.loading}
                    className="gap-2"
                  >
                    {adsGenerator.loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando Ads...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Gerar Anúncios Otimizados
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Error display */}
              {(textAnalyzer.error || predictor.error) && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {textAnalyzer.error || predictor.error}
                </div>
              )}

              {/* CPS Dashboard */}
              <PredictionPanel
                data={scoreData}
                loading={isScoring}
              />

              {/* Ad Previews */}
              {(adsGenerator.data || adsGenerator.loading) && (
                <AdPreviewSystem
                  ads={adsGenerator.data?.ads ?? []}
                  brandName={brandName}
                  loading={adsGenerator.loading}
                />
              )}

              {adsGenerator.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {adsGenerator.error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
