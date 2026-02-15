'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Target,
  ChevronLeft,
  ShieldCheck,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadTimeline } from '@/components/intelligence/journey/LeadTimeline';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import type { JourneyLead, JourneyEvent } from '@/types/journey';

/**
 * @fileoverview Página de Perfil do Lead com Timeline de Jornada.
 * @author Victor (UI) & Beto (UX)
 */
export default function LeadJourneyPage() {
  const params = useParams();
  const leadId = params.leadId as string;
  const activeBrand = useActiveBrand();
  const brandId = activeBrand?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ lead: JourneyLead; events: JourneyEvent[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId || !brandId) {
      if (!brandId) setLoading(false);
      return;
    }

    async function fetchJourney() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/intelligence/journey/${leadId}?brandId=${brandId}`);
        if (!response.ok) {
          const errJson = await response.json().catch(() => null);
          throw new Error(errJson?.error || 'Falha ao carregar jornada do lead');
        }
        const json = await response.json();
        // API uses createApiSuccess wrapper: { success: true, data: { lead, events } }
        const payload = json.data || json;
        setData(payload);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchJourney();
  }, [leadId, brandId]);

  if (loading) return <JourneySkeleton />;
  if (error || !data) return <JourneyError message={error || 'Lead não encontrado'} />;

  const { lead, events } = data;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/intelligence">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perfil do Lead</h1>
            <p className="text-muted-foreground text-sm">Rastreamento individual e inteligência de LTV</p>
          </div>
        </div>
        <Badge variant={lead.status === 'customer' ? 'default' : 'secondary'} className="px-4 py-1 text-sm font-semibold">
          {lead.status === 'customer' ? '💎 Cliente VIP' : '🎯 Lead Qualificado'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Lead Info & Metrics */}
        <div className="space-y-6">
          {/* Card: Perfil Principal */}
          <Card className="overflow-hidden border-primary/10">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {lead.pii.firstName ? `${lead.pii.firstName} ${lead.pii.lastName || ''}` : 'Lead Anônimo'}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span>Dados Protegidos (PII)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{lead.pii.email}</span>
                </div>
                {lead.pii.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{lead.pii.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Entrou em: {new Date(lead.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Badge variant="outline" className="w-full justify-center py-1 bg-slate-50 dark:bg-slate-900 border-dashed">
                  Safra: {lead.metrics.cohort || 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card: LTV Intelligence */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-80">
                <TrendingUp className="w-4 h-4" />
                LTV Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold">
                  {(lead.metrics.totalLtv / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Valor Vitalício Acumulado</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xl font-semibold">{lead.metrics.transactionCount}</div>
                  <p className="text-[10px] uppercase opacity-50">Transações</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-semibold">
                    {(lead.metrics.averageTicket / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-[10px] uppercase opacity-50">Ticket Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Atribuição de Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Atribuição de Origem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Primeiro Toque (First Touch)</p>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border text-xs font-mono">
                  {lead.attribution.firstSource} / {lead.attribution.firstMedium}
                </div>
                <p className="text-[10px] text-muted-foreground italic">{lead.attribution.firstCampaign}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Último Toque (Last Touch)</p>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border text-xs font-mono">
                  {lead.attribution.lastSource} / {lead.attribution.lastMedium}
                </div>
                <p className="text-[10px] text-muted-foreground italic">{lead.attribution.lastCampaign}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Timeline */}
        <div className="lg:col-span-2">
          <LeadTimeline events={events} />
        </div>
      </div>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    </div>
  );
}

function JourneyError({ message }: { message: string }) {
  return (
    <div className="container mx-auto py-20 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Ops! Algo deu errado</h2>
        <p className="text-muted-foreground">{message}</p>
        <Link href="/intelligence">
          <Button variant="outline">Voltar para Inteligência</Button>
        </Link>
      </div>
    </div>
  );
}
