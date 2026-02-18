'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Info,
  RefreshCw,
  BarChart3,
  PieChart,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CohortDashboard } from '@/components/intelligence/ltv/CohortDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

/**
 * @fileoverview Página Principal do Dashboard de LTV e Cohorts.
 * Sprint T-2: KPIs reais, aba Retenção ativa, alert-generator, badges Real/Estimado.
 */
export default function LTVDashboardPage() {
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  async function fetchLtvData() {
    if (!brandId) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/intelligence/ltv/cohorts?brandId=${brandId}`, { headers });
      if (!response.ok) throw new Error('Falha ao carregar dados de LTV');
      const json = await response.json();
      setData(json?.data ?? json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Sprint T-2.2: Fetch retention/churn data
  async function fetchRetentionData() {
    if (!brandId) return;
    setRetentionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/intelligence/predictive/churn?brandId=${brandId}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setRetentionData(json?.data ?? json);
      }
    } catch (err) {
      console.warn('[LTV] Retention data unavailable:', err instanceof Error ? err.message : err);
    } finally {
      setRetentionLoading(false);
    }
  }

  useEffect(() => {
    fetchLtvData();
  }, [brandId]);

  // Sprint T-2.6: Generate alerts from data thresholds
  useEffect(() => {
    if (!data?.summary || !brandId) return;
    const generatedAlerts: any[] = [];
    const summary = data.summary;

    // Churn spike: if estimated churn > 20% of leads
    if (retentionData?.atRisk && summary.totalLeads > 0) {
      const churnRate = retentionData.atRisk / summary.totalLeads;
      if (churnRate > 0.2) {
        generatedAlerts.push({
          id: 'alert_churn_spike',
          severity: 'critical',
          title: 'Churn Spike Detectado',
          description: `${retentionData.atRisk} leads em risco de churn (${(churnRate * 100).toFixed(0)}% da base).`,
        });
      }
    }

    // LTV drop: if avgPaybackMonths > 6 (slow recovery)
    if (summary.avgPaybackMonths > 6) {
      generatedAlerts.push({
        id: 'alert_ltv_drop',
        severity: 'warning',
        title: 'Payback Lento',
        description: `Payback médio de ${(summary.avgPaybackMonths * 30).toFixed(0)} dias está acima do recomendado (180 dias).`,
      });
    }

    // ROI negativo
    const totalSpend = data.cohorts?.reduce((acc: number, c: any) => acc + (c.adSpend || 0), 0) || 0;
    if (totalSpend > 0 && summary.totalLtv < totalSpend) {
      generatedAlerts.push({
        id: 'alert_roi_negative',
        severity: 'critical',
        title: 'ROI Negativo',
        description: `LTV total (R$ ${(summary.totalLtv / 100).toFixed(2)}) está abaixo do Ad Spend (R$ ${(totalSpend / 100).toFixed(2)}).`,
      });
    }

    setAlerts(generatedAlerts);
  }, [data, retentionData, brandId]);

  if (loading) return <LtvSkeleton />;
  if (error || !data) return <LtvError message={error || 'Dados não disponíveis'} onRetry={fetchLtvData} />;

  const summary = data.summary;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LTV & Cohort Intelligence</h1>
          <p className="text-muted-foreground">Análise de safra, retenção e tempo de payback</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sprint T-2.4: Data quality badge */}
          {summary && (
            <Badge
              variant="outline"
              className={
                !summary.isEstimated && !summary.isSimulated
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }
            >
              {!summary.isEstimated && !summary.isSimulated ? 'Dados Reais' : 'Parcialmente Estimado'}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchLtvData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Dados
          </Button>
          <Button size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Sprint T-2.6: Alert banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card
              key={alert.id}
              className={
                alert.severity === 'critical'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-amber-200 bg-amber-50/50'
              }
            >
              <CardContent className="py-3 text-sm flex items-center gap-2">
                {alert.severity === 'critical' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <span className={alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}>
                  <strong>{alert.title}:</strong> {alert.description}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="cohorts" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cohorts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise de Safra
          </TabsTrigger>
          <TabsTrigger
            value="retention"
            className="flex items-center gap-2"
            onClick={() => { if (!retentionData && !retentionLoading) fetchRetentionData(); }}
          >
            <PieChart className="w-4 h-4" />
            Retenção & Churn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cohorts" className="space-y-6">
          <CohortDashboard data={data.cohorts} summary={summary} />
        </TabsContent>

        {/* Sprint T-2.2: Aba Retenção ativada */}
        <TabsContent value="retention" className="space-y-6">
          {retentionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : retentionData ? (
            <RetentionPanel data={retentionData} />
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold mb-2">Dados de Retenção Indisponíveis</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  A análise de retenção requer pelo menos 50 leads e 30 dias de dados.
                  Continue capturando leads para desbloquear este módulo.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>Leads atuais: {summary?.totalLeads ?? 0}</span>
                  <span>|</span>
                  <span>Mínimo: 50 leads</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Sprint T-2.2: Retention & Churn panel */
function RetentionPanel({ data }: { data: any }) {
  const predictions = data.predictions || [];
  const totalLeads = data.totalLeads || 0;
  const atRisk = data.atRisk || 0;
  const safeRate = totalLeads > 0 ? ((totalLeads - atRisk) / totalLeads * 100).toFixed(1) : '0';

  const riskBuckets = {
    critical: predictions.filter((p: any) => p.riskLevel === 'critical').length,
    warning: predictions.filter((p: any) => p.riskLevel === 'warning').length,
    safe: predictions.filter((p: any) => p.riskLevel === 'safe').length,
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total de Leads</p>
            <p className="text-2xl font-bold">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Em Risco de Churn</p>
            <p className="text-2xl font-bold text-red-600">{atRisk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Taxa de Retenção</p>
            <p className="text-2xl font-bold text-emerald-600">{safeRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Risco Crítico</p>
            <p className="text-2xl font-bold text-red-600">{riskBuckets.critical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Risco</CardTitle>
          <CardDescription>Classificação dos leads por nível de risco de churn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Crítico (>70% risco)', count: riskBuckets.critical, color: 'bg-red-500', textColor: 'text-red-600' },
              { label: 'Atenção (30-70% risco)', count: riskBuckets.warning, color: 'bg-amber-500', textColor: 'text-amber-600' },
              { label: 'Seguro (<30% risco)', count: riskBuckets.safe, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
            ].map(bucket => {
              const pct = totalLeads > 0 ? (bucket.count / totalLeads * 100) : 0;
              return (
                <div key={bucket.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={bucket.textColor}>{bucket.label}</span>
                    <span className="font-bold">{bucket.count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${bucket.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top at-risk leads */}
      {predictions.filter((p: any) => p.riskLevel === 'critical').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads em Risco Crítico</CardTitle>
            <CardDescription>Leads com maior probabilidade de churn nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-4 py-3">Lead ID</th>
                    <th className="px-4 py-3">Segmento</th>
                    <th className="px-4 py-3">Risco (%)</th>
                    <th className="px-4 py-3">Dias sem Atividade</th>
                    <th className="px-4 py-3">Tendência</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions
                    .filter((p: any) => p.riskLevel === 'critical')
                    .slice(0, 10)
                    .map((p: any) => (
                      <tr key={p.leadId} className="hover:bg-muted/10">
                        <td className="px-4 py-3 font-mono text-xs">{p.leadId.slice(0, 12)}...</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">{p.currentSegment}</Badge>
                        </td>
                        <td className="px-4 py-3 text-red-600 font-bold">{(p.churnRisk * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3">{p.daysSinceLastEvent}d</td>
                        <td className="px-4 py-3 capitalize">{p.engagementTrend}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LtvSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

function LtvError({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="container mx-auto py-20 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Falha na Inteligência</h2>
        <p className="text-muted-foreground">{message}</p>
        <Button onClick={onRetry}>Tentar Novamente</Button>
      </div>
    </div>
  );
}
