'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WarRoomDashboard } from '@/components/performance/war-room-dashboard';
import { AlertCenter } from '@/components/performance/alert-center';
import { SegmentFilter } from '@/components/performance/segment-filter';
import { SegmentBreakdown } from '@/components/performance/segment-breakdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCcw, WifiOff, Settings } from "lucide-react";
import { PerformanceMetric, PerformanceAnomaly } from '@/types/performance';
import { useSegmentPerformance } from '@/lib/hooks/use-segment-performance';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import Link from 'next/link';
import { Layers } from "lucide-react";

export default function PerformanceWarRoomPage() {
  const { selectedBrand } = useBrandStore();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [anomalies, setAnomalies] = useState<PerformanceAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [advisorSummary, setAdvisorSummary] = useState<string | null>(null);
  const [advisorInsights, setAdvisorInsights] = useState<string[]>([]);
  const [advisorRecommendations, setAdvisorRecommendations] = useState<string[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [hasIntegration, setHasIntegration] = useState<boolean | null>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [ltvData, setLtvData] = useState<{ totalLtv: number; avgPaybackMonths: number } | null>(null);
  const { breakdown, loading: segmentLoading, selectedSegment, setSelectedSegment } = useSegmentPerformance(
    selectedBrand?.id || null
  );

  const blendedMetrics = metrics.find(m => m.source === 'aggregated')?.data || {
    spend: 0, revenue: 0, roas: 0, cac: 0, ctr: 0, cpc: 0, cpa: 0, conversions: 0, clicks: 0, impressions: 0,
  };

  const platformMetrics = metrics
    .filter(m => m.source !== 'aggregated')
    .map(m => ({ ...m.data, platform: m.source as any, cpa: m.data.cac }));

  const segmentDataForAdvisor = React.useMemo(() => {
    if (!breakdown) return null;
    if (selectedSegment === 'all') return breakdown;
    return { selectedSegment, metrics: breakdown[selectedSegment] };
  }, [breakdown, selectedSegment]);

  const extractAdvisorSummary = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') return null;
    const d = payload as { data?: { summary?: string }; summary?: string };
    return typeof d.summary === 'string' ? d.summary : d.data?.summary ?? null;
  };

  const fetchData = async (forceFresh = false) => {
    const bid = selectedBrand?.id;
    if (!bid) return;
    setLoading(true);
    try {
      const h = await getAuthHeaders();
      const freshParam = forceFresh ? '&fresh=true' : '';
      const [mRes, aRes] = await Promise.all([
        fetch(`/api/performance/metrics?brandId=${bid}${freshParam}`, { headers: h }),
        fetch(`/api/performance/anomalies?brandId=${bid}`, { headers: h }),
      ]);
      const mJson = await mRes.json();
      const aJson = await aRes.json();
      setMetrics(Array.isArray(mJson.data?.metrics ?? mJson.data) ? (mJson.data?.metrics ?? mJson.data) : []);
      setAnomalies(Array.isArray(aJson.data?.anomalies ?? aJson.data) ? (aJson.data?.anomalies ?? aJson.data) : []);
      setHasIntegration(mRes.ok);
      setDiagnostic(mJson.data?.diagnostic || null);
    } catch (e) {
      console.error('Error fetching performance data:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchLtvSummary = async () => {
    const bid = selectedBrand?.id;
    if (!bid) return;
    try {
      const h = await getAuthHeaders();
      const res = await fetch(`/api/intelligence/ltv/cohorts?brandId=${bid}`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const s = json.data?.summary ?? json.summary;
        if (s) setLtvData({ totalLtv: s.totalLtv || 0, avgPaybackMonths: s.avgPaybackMonths || 0 });
      }
    } catch (err) {
      console.warn('[Performance] LTV unavailable:', err instanceof Error ? err.message : err);
    }
  };

  useEffect(() => { fetchData(); fetchLtvSummary(); }, [selectedBrand?.id]);

  // Sprint 08.6c: Debounced AI Insight with AbortController to prevent race conditions
  const abortRef = useRef<AbortController | null>(null);
  const insightCacheRef = useRef<Record<string, { summary: string; insights: string[]; recommendations: string[] }>>({});

  useEffect(() => {
    if (!breakdown || metrics.length === 0) return;

    const cacheKey = `${selectedBrand?.id}_${selectedSegment}`;
    const cached = insightCacheRef.current[cacheKey];
    if (cached) {
      setAdvisorSummary(cached.summary);
      setAdvisorInsights(cached.insights);
      setAdvisorRecommendations(cached.recommendations);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setAdvisorLoading(true);
      try {
        const h = await getAuthHeaders();
        const res = await fetch('/api/reporting/generate', {
          method: 'POST', headers: h,
          signal: controller.signal,
          body: JSON.stringify({
            metrics,
            context: {
              brandId: selectedBrand?.id ?? '', targetRoas: blendedMetrics.roas ?? 0,
              alerts: anomalies, segmentData: segmentDataForAdvisor, selectedSegment,
            },
          }),
        });
        if (controller.signal.aborted) return;
        const payload = await res.json();
        const summary = extractAdvisorSummary(payload);
        const d = payload?.data || payload;
        const result = {
          summary: summary || (res.ok ? '' : 'Insight indisponível no momento.'),
          insights: Array.isArray(d?.insights) ? d.insights : [],
          recommendations: Array.isArray(d?.recommendations) ? d.recommendations : [],
        };
        if (summary) setAdvisorSummary(result.summary);
        else if (!res.ok) setAdvisorSummary('Insight indisponível no momento.');
        setAdvisorInsights(result.insights);
        setAdvisorRecommendations(result.recommendations);
        // Cache result
        insightCacheRef.current[cacheKey] = result;
      } catch (e: unknown) {
        if ((e as Error)?.name !== 'AbortError') {
          setAdvisorSummary('Insight indisponível no momento.');
        }
      } finally {
        if (!controller.signal.aborted) setAdvisorLoading(false);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [segmentDataForAdvisor, selectedSegment, metrics, anomalies, selectedBrand?.id, blendedMetrics.roas]);

  const handleRefresh = async () => { setIsRefreshing(true); await fetchData(true); };

  const fmtCurrency = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ltvDisplay = ltvData ? fmtCurrency(ltvData.totalLtv) : 'N/A';
  const paybackDays = ltvData && ltvData.avgPaybackMonths > 0 ? Math.round(ltvData.avgPaybackMonths * 30) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-4">
              <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
                Performance
              </h1>
              <div className="flex items-center gap-2">
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#C45B3A] shadow-[0_0_12px_rgba(196,91,58,0.8)] animate-pulse" />
                <span className="text-[11px] font-mono text-[#C45B3A] tracking-wider">WAR ROOM</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#6B5D4A] tracking-wider">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                SYNC DATA
              </button>
            </div>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-4 border border-white/[0.06] divide-x divide-white/[0.06] mb-6">
            <KPI label="ROAS" value={blendedMetrics.roas?.toFixed(2) ?? '0.00'} unit="x" />
            <KPI label="Total Spend" value={`R$ ${((blendedMetrics.spend || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} isText />
            <KPI label="CAC" value={`R$ ${((blendedMetrics.cac || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} isText />
            <KPI
              label="Revenue"
              value={blendedMetrics.revenue > 0
                ? `R$ ${blendedMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                : blendedMetrics.conversions > 0 ? 'Pixel sem valor' : 'R$ 0'}
              isText highlight
              subtitle={blendedMetrics.revenue === 0 && blendedMetrics.conversions > 0 ? 'Configure o pixel com valor de compra' : undefined}
            />
          </div>

          {/* Sprint 12: Tab navigation — War Room / Cross-channel */}
          <div className="flex items-center gap-6 mb-4">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#E6B447] border-b-2 border-[#E6B447] pb-2">
              WAR ROOM
            </span>
            <Link
              href="/performance/cross-channel"
              className="text-[11px] font-mono font-bold tracking-wider text-[#6B5D4A] hover:text-[#CAB792] pb-2 border-b-2 border-transparent transition-colors flex items-center gap-1.5"
            >
              <Layers className="h-3 w-3" />
              CROSS-CHANNEL
            </Link>
          </div>

          {/* Segment filter inline */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 -mb-px">
            <SegmentFilter value={selectedSegment} onChange={setSelectedSegment} />
            <span className="text-[10px] font-mono text-[#6B5D4A] tracking-wider uppercase">
              Segment: {selectedSegment}
            </span>
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full space-y-6">
        {/* No integration state */}
        {!loading && hasIntegration === false && (
          <div className="border border-white/[0.06] bg-[#0D0B09] py-16 text-center">
            <WifiOff className="w-10 h-10 mx-auto mb-4 text-[#6B5D4A]" />
            <p className="text-lg font-bold text-[#F5E8CE] mb-1">Conecte uma Plataforma de Ads</p>
            <p className="text-sm text-[#6B5D4A] mb-6 max-w-md mx-auto">
              O War Room precisa de dados de Meta Ads ou Google Ads para exibir métricas reais.
            </p>
            <Link
              href="/integrations"
              className="text-[11px] font-mono font-bold tracking-wider text-[#E6B447] hover:text-[#F0C35C] transition-colors"
            >
              IR PARA INTEGRAÇÕES →
            </Link>
          </div>
        )}

        {/* Diagnostic */}
        {!loading && hasIntegration && diagnostic && blendedMetrics.spend === 0 && (
          <div className="border-l-2 border-[#E6B447] bg-[#0D0B09] p-6">
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#E6B447] mb-3">DIAGNÓSTICO</p>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B5D4A]">Meta Token</p>
                <p className={diagnostic.metaTokenFound ? 'text-[#7A9B5A] font-mono text-xs' : 'text-[#C45B3A] font-mono text-xs'}>
                  {diagnostic.metaTokenFound ? 'Encontrado' : 'Não encontrado'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B5D4A]">Ad Account</p>
                <p className="text-[#CAB792] font-mono text-xs">{diagnostic.metaAdAccountId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B5D4A]">Campanhas</p>
                <p className="text-[#CAB792] font-mono text-xs">{diagnostic.metaCampaigns ?? 0}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B5D4A]">Período</p>
                <p className="text-[#CAB792] font-mono text-xs">{diagnostic.dateRange?.start} → {diagnostic.dateRange?.end}</p>
              </div>
            </div>
            {diagnostic.metaPermissions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#6B5D4A] mb-2">Permissões</p>
                <div className="flex flex-wrap gap-1.5">
                  {diagnostic.metaPermissions.map((p: { permission: string; status: string }, i: number) => (
                    <span key={i} className={`text-[10px] font-mono px-2 py-0.5 ${
                      p.status === 'granted' ? 'text-[#7A9B5A] bg-[#7A9B5A]/10' :
                      p.status === 'declined' ? 'text-[#C45B3A] bg-[#C45B3A]/10' :
                      'text-[#6B5D4A] bg-white/[0.03]'
                    }`}>
                      {p.permission}: {p.status}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {diagnostic.errors?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#C45B3A]/20">
                {diagnostic.errors.map((err: string, i: number) => (
                  <p key={i} className="text-xs text-[#C45B3A] font-mono">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: metrics + LTV + segments */}
          <div className="lg:col-span-8 space-y-6">
            <WarRoomDashboard blended={blendedMetrics} platforms={platformMetrics} loading={loading} />

            {/* LTV / Payback */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.06]">
              <div className="bg-[#0D0B09] p-6">
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-2">LTV Total</p>
                <p className="text-[32px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">
                  {ltvDisplay}
                </p>
                {ltvData && (
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#7A9B5A] mt-1 inline-block">REAL DATA</span>
                )}
              </div>
              <div className="bg-[#0D0B09] p-6">
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-2">CAC Payback</p>
                <p className="text-[32px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">
                  {paybackDays ? `${paybackDays}` : 'N/A'}
                  {paybackDays && <span className="text-[11px] font-normal text-[#6B5D4A] ml-1">dias</span>}
                </p>
                <div className="flex justify-between text-[9px] font-mono text-[#6B5D4A] uppercase tracking-wider mt-1">
                  <span>Target: 90d</span>
                  {paybackDays && (
                    <span className={paybackDays <= 90 ? 'text-[#7A9B5A]' : 'text-[#E6B447]'}>
                      {paybackDays <= 90 ? 'OPTIMAL' : 'MONITOR'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-4">Segment Breakdown</p>
              <SegmentBreakdown data={breakdown} loading={segmentLoading} selectedSegment={selectedSegment} />
            </div>
          </div>

          {/* Right: alerts + insight */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sprint 12: Hide alert center when no real anomalies */}
            {anomalies.length > 0 && <AlertCenter
              alerts={anomalies.map(a => ({
                id: a.id, severity: a.severity,
                status: a.status === 'new' ? 'active' : 'acknowledged',
                message: a.aiInsight?.explanation || `Anomalia em ${a.metricType}`,
                metricType: a.metricType, createdAt: a.detectedAt,
                context: { platform: 'Aggregated', deviation: a.deviationPercentage, entityName: selectedBrand?.name || 'Brand' }
              })) as any}
              onAcknowledge={async (id) => {
                if (!selectedBrand?.id) return;
                try {
                  const h = await getAuthHeaders();
                  const res = await fetch('/api/performance/anomalies', {
                    method: 'PATCH',
                    headers: h,
                    body: JSON.stringify({ brandId: selectedBrand.id, anomalyId: id }),
                  });
                  if (res.ok) {
                    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' as any } : a));
                  }
                } catch (e) {
                  console.error('[Performance] Acknowledge error:', e);
                }
              }}
            />}

            {/* AI Insight — pull-quote style */}
            <div className="border-l-2 border-[#E6B447] bg-[#0D0B09] p-5">
              <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#E6B447] mb-3">
                AI STRATEGIC INSIGHT
              </p>
              <p className="text-[13px] text-[#CAB792] leading-relaxed">
                {advisorLoading
                  ? 'Gerando insight com base no segmento selecionado...'
                  : advisorSummary || 'Insight indisponível no momento.'}
              </p>
              <button
                className="text-[10px] font-mono tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors mt-3 disabled:opacity-30"
                onClick={() => setShowFullAnalysis(true)}
                disabled={advisorLoading || (!advisorSummary && advisorInsights.length === 0)}
              >
                VER ANÁLISE COMPLETA →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Full Analysis Dialog */}
      <Dialog open={showFullAnalysis} onOpenChange={setShowFullAnalysis}>
        <DialogContent className="bg-[#1A1612] border-white/[0.08] text-[#F5E8CE] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F5E8CE] font-mono text-sm uppercase tracking-wider">
              AI Strategic Insight — Análise Completa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {advisorSummary && (
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#E6B447] mb-2">Resumo</p>
                <p className="text-sm text-[#CAB792] leading-relaxed">{advisorSummary}</p>
              </div>
            )}
            {advisorInsights.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#E6B447] mb-2">Insights</p>
                <ul className="space-y-2">
                  {advisorInsights.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#CAB792]">
                      <span className="text-[#E6B447] mt-0.5">•</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {advisorRecommendations.length > 0 && (
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#E6B447] mb-2">Recomendações</p>
                <ul className="space-y-2">
                  {advisorRecommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#CAB792]">
                      <span className="text-[#E6B447] mt-0.5 font-mono">{i + 1}.</span><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!advisorSummary && advisorInsights.length === 0 && (
              <p className="text-sm text-[#6B5D4A] text-center py-4">Análise não disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ label, value, unit, isText, highlight, subtitle }: {
  label: string; value: string; unit?: string; isText?: boolean; highlight?: boolean; subtitle?: string;
}) {
  return (
    <div className="px-6 py-5 bg-[#0D0B09]">
      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">{label}</p>
      <p className={`leading-none ${isText ? 'text-lg font-bold truncate' : 'text-[36px] font-mono font-black tabular-nums'} ${highlight ? 'text-[#E6B447]' : 'text-[#F5E8CE]'}`}>
        {value}
        {unit && <span className="text-[11px] font-normal text-[#6B5D4A] ml-1">{unit}</span>}
      </p>
      {subtitle && <p className="text-[9px] font-mono text-[#C45B3A] mt-1 truncate">{subtitle}</p>}
    </div>
  );
}
