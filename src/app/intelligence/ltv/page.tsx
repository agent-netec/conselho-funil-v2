'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Info, 
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CohortDashboard } from '@/components/intelligence/ltv/CohortDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * @fileoverview Página Principal do Dashboard de LTV e Cohorts.
 * @author Victor (UI) & Beto (UX)
 */
export default function LTVDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchLtvData() {
    setLoading(true);
    try {
      const response = await fetch('/api/intelligence/ltv/cohorts');
      if (!response.ok) throw new Error('Falha ao carregar dados de LTV');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLtvData();
  }, []);

  if (loading) return <LtvSkeleton />;
  if (error || !data) return <LtvError message={error || 'Dados não disponíveis'} onRetry={fetchLtvData} />;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LTV & Cohort Intelligence</h1>
          <p className="text-muted-foreground">Análise de safra, retenção e tempo de payback</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="cohorts" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cohorts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise de Safra
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Retenção & Churn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cohorts" className="space-y-6">
          <CohortDashboard data={data.cohorts} />
        </TabsContent>

        <TabsContent value="retention">
          <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
            <div className="text-center space-y-2">
              <Info className="w-8 h-8 mx-auto opacity-20" />
              <p>Módulo de Análise de Retenção Detalhada em desenvolvimento.</p>
              <p className="text-xs">Disponível na Sprint 22.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
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
