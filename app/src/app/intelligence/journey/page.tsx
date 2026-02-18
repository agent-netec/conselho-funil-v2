'use client';

import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Search, Users, Code2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useAuthStore } from '@/lib/stores/auth-store';
import Link from 'next/link';

interface RecentLead {
  id: string;
  maskedEmail: string;
  status: 'lead' | 'customer' | 'churned';
  metrics: { totalLtv: number; transactionCount: number; averageTicket: number };
  updatedAt: { seconds: number } | null;
}

interface HeatmapStage {
  stage: string;
  label: string;
  events: number;
  uniqueLeads: number;
  conversionFromTop: number;
  dropOffFromPrevious: number;
}

export default function JourneyPage() {
  const [leadId, setLeadId] = useState('');
  const router = useRouter();
  const activeBrand = useActiveBrand();
  const { user } = useAuthStore();
  const brandId = activeBrand?.id;

  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [heatmapStages, setHeatmapStages] = useState<HeatmapStage[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadId.trim()) {
      router.push(`/intelligence/journey/${leadId.trim()}`);
    }
  };

  useEffect(() => {
    if (!brandId || !user) return;

    const fetchData = async () => {
      const token = await (user as any).getIdToken?.();
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch recent leads
      setLoadingLeads(true);
      try {
        const res = await fetch(`/api/intelligence/journey/recent?brandId=${brandId}&limit=10`, { headers });
        if (res.ok) {
          const json = await res.json();
          setRecentLeads(json.data?.leads || []);
          setHasData((json.data?.leads?.length || 0) > 0);
        }
      } catch (err) {
        console.error('Error fetching recent leads:', err);
      } finally {
        setLoadingLeads(false);
      }

      // Fetch heatmap
      setLoadingHeatmap(true);
      try {
        const res = await fetch(`/api/intelligence/journey/heatmap?brandId=${brandId}`, { headers });
        if (res.ok) {
          const json = await res.json();
          setHeatmapStages(json.data?.stages || []);
          if ((json.data?.totalEvents || 0) > 0) setHasData(true);
        }
      } catch (err) {
        console.error('Error fetching heatmap:', err);
      } finally {
        setLoadingHeatmap(false);
      }
    };

    fetchData();
  }, [brandId, user]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      lead: 'bg-blue-500/10 text-blue-400',
      customer: 'bg-emerald-500/10 text-emerald-400',
      churned: 'bg-red-500/10 text-red-400',
    };
    const labels: Record<string, string> = {
      lead: 'Lead',
      customer: 'Cliente',
      churned: 'Churned',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.lead}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Header title="Jornada do Lead" />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="grid gap-6">
          {/* Search */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-500" />
                Rastrear Jornada
              </CardTitle>
              <CardDescription>
                Insira o ID do Lead ou e-mail para visualizar o mapa completo de interações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  placeholder="Ex: lead_123 ou email@cliente.com"
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Analisar Mapa
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Empty state — no data yet */}
          {hasData === false && !loadingLeads && !loadingHeatmap && (
            <Card className="bg-zinc-900/50 border-emerald-500/20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Code2 className="h-12 w-12 text-emerald-500/50 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Instale o Tracking Script
                </h3>
                <p className="text-sm text-zinc-400 max-w-md mb-4">
                  Para ver dados reais de leads e conversões, instale o tracking script no seu site.
                  Os dados começam a aparecer aqui automaticamente.
                </p>
                <Link href="/settings/tracking">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Code2 className="mr-2 h-4 w-4" />
                    Instalar Tracking Script
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-emerald-500" />
                  Leads Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLeads ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : recentLeads.length > 0 ? (
                  <div className="space-y-3">
                    {recentLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => router.push(`/intelligence/journey/${lead.id}?brandId=${brandId}`)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-white/[0.04] hover:border-emerald-500/20 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                            {lead.maskedEmail[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm text-zinc-300 font-mono">{lead.maskedEmail}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {statusBadge(lead.status)}
                              {lead.metrics.totalLtv > 0 && (
                                <span className="text-[10px] text-emerald-400">
                                  LTV: {formatCurrency(lead.metrics.totalLtv)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-10 w-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">Nenhum lead registrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Heatmap de Conversão */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Map className="h-5 w-5 text-emerald-500" />
                  Heatmap de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHeatmap ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : heatmapStages.length > 0 && heatmapStages[0].events > 0 ? (
                  <div className="space-y-3">
                    {heatmapStages.map((stage, i) => {
                      const maxWidth = stage.conversionFromTop;
                      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-400">{stage.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-zinc-300">
                                {stage.uniqueLeads} leads
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                ({stage.conversionFromTop}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-6 rounded-lg bg-zinc-950 overflow-hidden">
                            <div
                              className={`h-full rounded-lg ${colors[i] || colors[0]} transition-all duration-500`}
                              style={{ width: `${Math.max(maxWidth, 2)}%` }}
                            />
                          </div>
                          {i > 0 && stage.dropOffFromPrevious > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <AlertCircle className="h-3 w-3 text-red-400/60" />
                              <span className="text-[10px] text-red-400/60">
                                -{stage.dropOffFromPrevious}% drop-off
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-[10px] text-zinc-600">
                        Total de eventos: {heatmapStages.reduce((s, st) => s + st.events, 0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Map className="h-10 w-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-500">Dados insuficientes para o funil.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
