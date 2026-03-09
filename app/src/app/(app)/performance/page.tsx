'use client';

import React, { useState, useEffect } from 'react';
import { WarRoomDashboard } from '@/components/performance/war-room-dashboard';
import { AlertCenter } from '@/components/performance/alert-center';
import { SegmentFilter } from '@/components/performance/segment-filter';
import { SegmentBreakdown } from '@/components/performance/segment-breakdown';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutDashboard,
  RefreshCcw,
  Calendar,
  Download,
  Zap,
  Activity,
  WifiOff,
  Settings
} from "lucide-react";
import { PerformanceMetric, PerformanceAnomaly } from '@/types/performance';
import { useSegmentPerformance } from '@/lib/hooks/use-segment-performance';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

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
  // Sprint T-2.1/T-3: Real LTV/Payback from cohort API
  const [ltvData, setLtvData] = useState<{ totalLtv: number; avgPaybackMonths: number } | null>(null);
  const { breakdown, loading: segmentLoading, selectedSegment, setSelectedSegment } = useSegmentPerformance(
    selectedBrand?.id || null
  );

  // Process blended metrics from the metrics array
  const blendedMetrics = metrics.find(m => m.source === 'aggregated')?.data || {
    spend: 0,
    revenue: 0,
    roas: 0,
    cac: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
    conversions: 0,
    clicks: 0,
    impressions: 0,
  };

  const platformMetrics = metrics
    .filter(m => m.source !== 'aggregated')
    .map(m => ({
      ...m.data,
      platform: m.source as any,
      cpa: m.data.cac
    }));

  const segmentDataForAdvisor = React.useMemo(() => {
    if (!breakdown) return null;
    if (selectedSegment === 'all') return breakdown;
    return {
      selectedSegment,
      metrics: breakdown[selectedSegment],
    };
  }, [breakdown, selectedSegment]);

  const extractAdvisorSummary = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') return null;
    const dataPayload = payload as { data?: { summary?: string }; summary?: string };
    if (typeof dataPayload.summary === 'string') return dataPayload.summary;
    if (dataPayload.data && typeof dataPayload.data.summary === 'string') {
      return dataPayload.data.summary;
    }
    return null;
  };

  const fetchData = async (forceFresh = false) => {
    const bid = selectedBrand?.id;
    if (!bid) return;
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const freshParam = forceFresh ? '&fresh=true' : '';
      const metricsRes = await fetch(`/api/performance/metrics?brandId=${bid}${freshParam}`, { headers: authHeaders });
      const anomaliesRes = await fetch(`/api/performance/anomalies?brandId=${bid}`, { headers: authHeaders });

      const metricsJson = await metricsRes.json();
      const anomaliesJson = await anomaliesRes.json();

      const metricsData = metricsJson.data?.metrics ?? metricsJson.data ?? [];
      const anomaliesData = anomaliesJson.data?.anomalies ?? anomaliesJson.data ?? [];

      setMetrics(Array.isArray(metricsData) ? metricsData : []);
      setAnomalies(Array.isArray(anomaliesData) ? anomaliesData : []);

      // Sprint T-3.5: Detect if integration exists
      // API returns 200 when tokens found (even if no campaign data yet)
      // API returns 502 when no tokens available and no cache
      setHasIntegration(metricsRes.ok);
      setDiagnostic(metricsJson.data?.diagnostic || null);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Sprint T-3: Fetch real LTV data for sidebar cards
  const fetchLtvSummary = async () => {
    const bid = selectedBrand?.id;
    if (!bid) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/intelligence/ltv/cohorts?brandId=${bid}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const summary = json.data?.summary ?? json.summary;
        if (summary) {
          setLtvData({
            totalLtv: summary.totalLtv || 0,
            avgPaybackMonths: summary.avgPaybackMonths || 0,
          });
        }
      }
    } catch (err) {
      console.warn('[Performance] LTV summary unavailable:', err instanceof Error ? err.message : err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLtvSummary();
  }, [selectedBrand?.id]);

  useEffect(() => {
    const fetchAdvisorInsight = async () => {
      if (!breakdown || metrics.length === 0) return;
      setAdvisorLoading(true);
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch('/api/reporting/generate', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            metrics,
            context: {
              brandId: selectedBrand?.id ?? 'TEST',
              targetRoas: blendedMetrics.roas ?? 0,
              alerts: anomalies,
              segmentData: segmentDataForAdvisor,
              selectedSegment,
            },
          }),
        });
        const payload = await response.json();
        const summary = extractAdvisorSummary(payload);
        if (summary) {
          setAdvisorSummary(summary);
        } else if (!response.ok) {
          setAdvisorSummary('Insight indisponível no momento.');
        }
        // Store full analysis data (insights + recommendations)
        const d = payload?.data || payload;
        setAdvisorInsights(Array.isArray(d?.insights) ? d.insights : []);
        setAdvisorRecommendations(Array.isArray(d?.recommendations) ? d.recommendations : []);
      } catch (error) {
        console.error('Error fetching advisor insight:', error);
        setAdvisorSummary('Insight indisponível no momento.');
      } finally {
        setAdvisorLoading(false);
      }
    };

    fetchAdvisorInsight();
  }, [segmentDataForAdvisor, selectedSegment, metrics, anomalies, selectedBrand?.id, blendedMetrics.roas]);

  // Sprint T-3.2: SYNC DATA forces fresh fetch bypassing 15min cache
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(true);
  };

  // Sprint T-3: Real LTV display values
  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ltvDisplay = ltvData ? formatCurrency(ltvData.totalLtv) : 'N/A';
  const paybackDisplay = ltvData && ltvData.avgPaybackMonths > 0
    ? `${Math.round(ltvData.avgPaybackMonths * 30)} Days`
    : 'N/A';

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 space-y-8">
      {/* War Room Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-rose-500/50 animate-pulse delay-75" />
            </div>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 font-black tracking-tighter uppercase text-[10px]">
              Live Ops
            </Badge>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Performance War Room</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <Activity className="w-10 h-10 text-rose-600" />
            COMMAND CENTER
          </h1>
          <p className="text-zinc-500 text-sm font-medium max-w-md">
            Monitoramento em tempo real de ROAS, CAC e anomalias críticas multicanal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 mr-4 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">System Status</p>
              <p className={`text-xs font-black ${hasIntegration === false ? 'text-amber-500' : 'text-[#E6B447]'}`}>
                {hasIntegration === false ? 'NO ADS CONNECTED' : 'ALL SYSTEMS NOMINAL'}
              </p>
            </div>
            <Zap className={`w-5 h-5 ${hasIntegration === false ? 'text-amber-500' : 'text-[#E6B447]'}`} />
          </div>

          <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white gap-2 h-11">
            <Calendar size={18} />
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-rose-600 hover:bg-rose-500 text-white gap-2 h-11 px-6 font-bold shadow-lg shadow-rose-900/20"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            SYNC DATA
          </Button>
        </div>
      </div>

      {/* Sprint T-3.5: Empty state if no ads integration */}
      {!loading && hasIntegration === false && (
        <Card className="bg-zinc-900/40 border-zinc-800 border-dashed border-2">
          <div className="py-16 text-center">
            <WifiOff className="w-16 h-16 mx-auto mb-6 text-zinc-700" />
            <h2 className="text-2xl font-black text-white mb-2">Conecte uma Plataforma de Ads</h2>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">
              O War Room precisa de dados de Meta Ads ou Google Ads para exibir métricas reais.
              Configure sua integração para ativar o monitoramento.
            </p>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white"
              onClick={() => window.location.href = '/integrations'}
            >
              <Settings size={16} className="mr-2" />
              Ir para Integrações
            </Button>
          </div>
        </Card>
      )}

      {/* Diagnostic panel: shows when integration found but no real spend */}
      {!loading && hasIntegration && diagnostic && blendedMetrics.spend === 0 && (
        <Card className="bg-amber-950/20 border-amber-500/20 p-6">
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-3">
            Diagnóstico da Conexão
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs">Meta Token</p>
              <p className={diagnostic.metaTokenFound ? 'text-[#E6B447]' : 'text-red-400'}>
                {diagnostic.metaTokenFound ? 'Encontrado' : 'Não encontrado'}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Ad Account</p>
              <p className="text-zinc-300 font-mono text-xs">{diagnostic.metaAdAccountId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Campanhas (365 dias)</p>
              <p className="text-zinc-300">{diagnostic.metaCampaigns ?? 0}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Período</p>
              <p className="text-zinc-300 text-xs">{diagnostic.dateRange?.start} → {diagnostic.dateRange?.end}</p>
            </div>
          </div>
          {/* Token permissions diagnostic */}
          {diagnostic.metaPermissions && diagnostic.metaPermissions.length > 0 && (
            <div className="mt-3 p-3 bg-zinc-900/50 rounded border border-zinc-700/30">
              <p className="text-xs text-zinc-400 font-bold mb-2">Permissões do Token:</p>
              <div className="flex flex-wrap gap-1.5">
                {diagnostic.metaPermissions.map((p: { permission: string; status: string }, i: number) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      p.status === 'granted'
                        ? 'bg-[#E6B447]/15 text-[#E6B447] border border-[#E6B447]/20'
                        : p.status === 'declined'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                        : 'bg-zinc-700/30 text-zinc-500 border border-zinc-600/20'
                    }`}
                  >
                    {p.permission}: {p.status}
                  </span>
                ))}
              </div>
              {!diagnostic.metaPermissions.some((p: { permission: string; status: string }) => p.permission === 'ads_read' && p.status === 'granted') && (
                <p className="mt-2 text-xs text-red-400">
                  ads_read NÃO concedido! Use &quot;Token Manual&quot; em Integrações para resolver.
                </p>
              )}
            </div>
          )}
          {diagnostic.errors?.length > 0 && (
            <div className="mt-3 p-3 bg-red-950/30 rounded border border-red-500/20">
              <p className="text-xs text-red-400 font-bold mb-1">Erros:</p>
              {diagnostic.errors.map((err: string, i: number) => (
                <p key={i} className="text-xs text-red-300 font-mono">{err}</p>
              ))}
            </div>
          )}
          {diagnostic.metaTokenFound && diagnostic.metaCampaigns === 0 && diagnostic.errors?.length === 0 && (
            <p className="mt-3 text-xs text-amber-400/70">
              Token válido mas nenhuma campanha encontrada nos últimos 365 dias. Verifique se a conta de anúncios (Ad Account) está correta.
            </p>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between">
        <SegmentFilter value={selectedSegment} onChange={setSelectedSegment} />
        <span className="text-xs text-zinc-500">Segment insights: {selectedSegment.toUpperCase()}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics & Comparison */}
        <div className="lg:col-span-8 space-y-6">
          <WarRoomDashboard
            blended={blendedMetrics}
            platforms={platformMetrics}
            loading={loading}
          />

          {/* Sprint T-3: Real LTV & Payback (replaces hardcoded values) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/40 border-zinc-800 p-6">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">LTV Total (All Cohorts)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{ltvDisplay}</span>
                {ltvData && (
                  <Badge className="bg-[#E6B447]/10 text-[#E6B447] border-none">Real</Badge>
                )}
              </div>
              <div className="mt-4 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#E6B447] w-[75%]" />
              </div>
            </Card>

            <Card className="bg-zinc-900/40 border-zinc-800 p-6">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">CAC Payback Period</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{paybackDisplay}</span>
                {ltvData && ltvData.avgPaybackMonths > 0 && (
                  <Badge className="bg-[#E6B447]/10 text-[#E6B447] border-none">
                    {Math.round(ltvData.avgPaybackMonths * 30) <= 90 ? 'Optimal' : 'Monitor'}
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex justify-between text-[10px] font-bold text-zinc-600 uppercase">
                <span>Target: 90 Days</span>
                <span>Current: {paybackDisplay}</span>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Segment Breakdown</h3>
            <SegmentBreakdown
              data={breakdown}
              loading={segmentLoading}
              selectedSegment={selectedSegment}
            />
          </div>
        </div>

        {/* Right Column: Alerts & Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <AlertCenter
            alerts={anomalies.map(a => ({
              id: a.id,
              severity: a.severity,
              status: a.status === 'new' ? 'active' : 'acknowledged',
              message: a.aiInsight?.explanation || `Anomalia detectada em ${a.metricType}`,
              metricType: a.metricType,
              createdAt: a.detectedAt,
              context: {
                platform: 'Aggregated',
                deviation: a.deviationPercentage,
                entityName: selectedBrand?.name || 'Brand'
              }
            })) as any}
            onAcknowledge={(id) => console.log('Acknowledge alert:', id)}
          />

          <Card className="bg-zinc-900/40 border-zinc-800 p-6 border-l-4 border-l-[#E6B447]">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#E6B447]" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Strategic Insight</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {advisorLoading
                ? 'Gerando insight com base no segmento selecionado...'
                : advisorSummary || 'Insight indisponível no momento.'}
            </p>
            <Button
              variant="link"
              className="text-[#E6B447] p-0 h-auto mt-4 text-xs font-bold uppercase tracking-tighter"
              onClick={() => setShowFullAnalysis(true)}
              disabled={advisorLoading || (!advisorSummary && advisorInsights.length === 0)}
            >
              Ver análise completa →
            </Button>
          </Card>
        </div>
      </div>

      {/* Full Analysis Dialog */}
      <Dialog open={showFullAnalysis} onOpenChange={setShowFullAnalysis}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-[#E6B447]" />
              AI Strategic Insight — Análise Completa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Summary */}
            {advisorSummary && (
              <div>
                <h4 className="text-xs font-black text-[#E6B447] uppercase tracking-widest mb-2">Resumo</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{advisorSummary}</p>
              </div>
            )}

            {/* Insights */}
            {advisorInsights.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-[#E6B447] uppercase tracking-widest mb-2">Insights</h4>
                <ul className="space-y-2">
                  {advisorInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-[#E6B447] mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {advisorRecommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Recomendações</h4>
                <ul className="space-y-2">
                  {advisorRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-amber-500 mt-0.5">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state */}
            {!advisorSummary && advisorInsights.length === 0 && advisorRecommendations.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                Análise não disponível. Aguarde os dados de performance.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}