'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Loader2, ArrowLeft, Share2, Megaphone,
  Palette, CalendarPlus, Copy, Check, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { usePredictScore, useGenerateAds, useAnalyzeText } from '@/lib/hooks/use-intelligence-predict';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

import { TextInput } from '@/components/intelligence/text-input';
import { PredictionPanel } from '@/components/intelligence/predictor/prediction-panel';
import { AdPreviewSystem } from '@/components/intelligence/ad-preview/ad-preview-system';

import type { TextInputType, TextInputFormat } from '@/types/text-analysis';
import type { GeneratedAd } from '@/types/creative-ads';

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

  // Gap 2: Action state
  const router = useRouter();
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSendingToCalendar, setIsSendingToCalendar] = useState(false);
  const [calendarCount, setCalendarCount] = useState(0);

  /** Gap 2: Build ad text for clipboard */
  const buildAdText = (ad: GeneratedAd): string => {
    const c = ad.content;
    if (c.type === 'meta_feed') return [c.headline, c.body, c.description, c.cta].filter(Boolean).join('\n\n');
    if (c.type === 'meta_stories') return [c.hook, c.body, c.ctaOverlay].filter(Boolean).join('\n\n');
    if (c.type === 'google_search') return [...c.headlines, ...c.descriptions].filter(Boolean).join('\n');
    return '';
  };

  /** Gap 2: Copy all ads to clipboard */
  const handleCopyAll = useCallback(() => {
    const ads = adsGenerator.data?.ads;
    if (!ads?.length) return;
    const text = ads.map((ad, i) => `--- Ad ${i + 1} (${ad.format}) ---\n${buildAdText(ad)}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success('Todos os ads copiados!');
    setTimeout(() => setCopiedAll(false), 2000);
  }, [adsGenerator.data]);

  /** Gap 2: Use in Social — navigate to Social with ad text pre-filled */
  const handleUseInSocial = useCallback((ad?: GeneratedAd) => {
    const ads = ad ? [ad] : adsGenerator.data?.ads;
    if (!ads?.length) return;
    const text = buildAdText(ads[0]);
    router.push(`/social?topic=${encodeURIComponent(text.slice(0, 200))}`);
  }, [adsGenerator.data, router]);

  /** Gap 2: Send ads to calendar as drafts */
  const handleSendToCalendar = useCallback(async () => {
    const ads = adsGenerator.data?.ads;
    if (!ads?.length || !brandId) return;
    setIsSendingToCalendar(true);
    try {
      const headers = await getAuthHeaders();
      const hooks = ads.map(ad => {
        const c = ad.content;
        const content = c.type === 'meta_feed' ? c.headline :
                        c.type === 'meta_stories' ? c.hook :
                        c.type === 'google_search' ? c.headlines[0] : '';
        const body = c.type === 'meta_feed' ? c.body :
                     c.type === 'meta_stories' ? c.body :
                     c.type === 'google_search' ? c.descriptions.join('\n') : '';
        const cta = c.type === 'meta_feed' ? c.cta :
                    c.type === 'meta_stories' ? c.ctaOverlay : '';
        return {
          content,
          body,
          cta,
          hashtags: [],
          style: `${ad.format} — ${ad.framework}`,
          platform: ad.format.startsWith('meta') ? 'Instagram' : 'Google',
          postType: 'post',
          fullPost: true,
        };
      });
      const res = await fetch('/api/content/calendar/from-social', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, hooks, campaignType: 'conversion' }),
      });
      if (!res.ok) throw new Error('Falha ao enviar');
      const data = await res.json();
      setCalendarCount(data.data?.count || hooks.length);
      toast.success(`${data.data?.count || hooks.length} ads enviados ao calendário!`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar ao calendário.');
    } finally {
      setIsSendingToCalendar(false);
    }
  }, [adsGenerator.data, brandId]);

  /** Gap 2: Export as text file */
  const handleExport = useCallback(() => {
    const ads = adsGenerator.data?.ads;
    if (!ads?.length) return;
    const text = ads.map((ad, i) =>
      `=== Ad ${i + 1} ===\nFormato: ${ad.format}\nFramework: ${ad.framework}\nCPS: ${ad.estimatedCPS}\n\n${buildAdText(ad)}`
    ).join('\n\n' + '='.repeat(40) + '\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ads-${brandName}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Ads exportados!');
  }, [adsGenerator.data, brandName]);

  // Derivar score data (do analyze ou do predict separado)
  const scoreData = textAnalyzer.data?.scoring ?? predictor.data;
  const isScoring = textAnalyzer.loading || predictor.loading;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link href="/intelligence/discovery">
            <Button variant="ghost" size="icon-sm" aria-label="Voltar">
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

              {/* Gap 2: Action Buttons — Ações Pós-Geração */}
              {adsGenerator.data?.ads && adsGenerator.data.ads.length > 0 && (
                <Card className="p-5 border-zinc-800 bg-zinc-900/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#E6B447]" />
                    <h3 className="text-sm font-bold text-zinc-100">Próximos Passos</h3>
                    <span className="text-[10px] text-zinc-500 ml-auto">{adsGenerator.data.ads.length} ads gerados</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {/* Usar no Social */}
                    <button
                      onClick={() => handleUseInSocial()}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-rose-500/30 hover:bg-rose-500/5 transition-all group"
                    >
                      <Share2 className="h-5 w-5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 text-center">Usar no Social</span>
                    </button>

                    {/* Criar Campanha */}
                    <Link href="/campaigns">
                      <button className="w-full flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                        <Megaphone className="h-5 w-5 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 text-center">Criar Campanha</span>
                      </button>
                    </Link>

                    {/* Gerar Imagem */}
                    <Link href="/intelligence/creative">
                      <button className="w-full flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                        <Palette className="h-5 w-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 text-center">Gerar Imagem</span>
                      </button>
                    </Link>

                    {/* Agendar no Calendário */}
                    <button
                      onClick={handleSendToCalendar}
                      disabled={isSendingToCalendar || calendarCount > 0}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-[#E6B447]/30 hover:bg-[#E6B447]/5 transition-all group disabled:opacity-50"
                    >
                      {isSendingToCalendar ? (
                        <Loader2 className="h-5 w-5 text-[#E6B447] animate-spin" />
                      ) : calendarCount > 0 ? (
                        <Check className="h-5 w-5 text-[#E6B447]" />
                      ) : (
                        <CalendarPlus className="h-5 w-5 text-zinc-500 group-hover:text-[#E6B447] transition-colors" />
                      )}
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 text-center">
                        {calendarCount > 0 ? `${calendarCount} agendados` : 'Agendar'}
                      </span>
                    </button>

                    {/* Exportar */}
                    <button
                      onClick={handleExport}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                    >
                      <Download className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 text-center">Exportar</span>
                    </button>
                  </div>

                  {/* Copy all row */}
                  <div className="flex items-center justify-center pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={handleCopyAll}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#E6B447] transition-colors"
                    >
                      {copiedAll ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedAll ? 'Copiados!' : 'Copiar todos os ads'}
                    </button>
                  </div>

                  {calendarCount > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E6B447]/5 border border-[#E6B447]/10">
                      <Check className="h-4 w-4 text-[#E6B447] shrink-0" />
                      <p className="text-xs text-zinc-400">
                        <span className="text-[#E6B447] font-medium">{calendarCount} ads</span> enviados ao calendário como rascunhos.{' '}
                        <Link href="/social?tab=calendar" className="text-[#E6B447] hover:underline">Ver no Calendário →</Link>
                      </p>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
