"use client";

import React from 'react';
import { ClientPerformanceCard } from '@/components/agency/ClientPerformanceCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * @fileoverview Dashboard Macro da Agência (ST-23.2)
 * @description Visão consolidada de todos os clientes para o dono da agência.
 */

const MOCK_CLIENTS = [
  {
    id: '1',
    name: 'Infoproduto X - Escala High Ticket',
    adSpend: 150000,
    roi: 4.2,
    healthScore: 92,
    status: 'active' as const,
    alerts: 0,
    trend: 'up' as const,
    predictiveROI: 4.8
  },
  {
    id: '2',
    name: 'E-commerce de Moda Masculina',
    adSpend: 85000,
    roi: 2.8,
    healthScore: 74,
    status: 'active' as const,
    alerts: 2,
    trend: 'down' as const,
    predictiveROI: 3.1
  },
  {
    id: '3',
    name: 'SaaS - Gestão de Clínicas',
    adSpend: 45000,
    roi: 3.5,
    healthScore: 88,
    status: 'active' as const,
    alerts: 0,
    trend: 'stable' as const,
    predictiveROI: 3.6
  },
  {
    id: '4',
    name: 'Lançamento - Expert em Finanças',
    adSpend: 320000,
    roi: 1.2,
    healthScore: 45,
    status: 'active' as const,
    alerts: 5,
    trend: 'down' as const,
    predictiveROI: 1.8
  }
];

export default function AgencyDashboardPage() {
  const totalAdSpend = MOCK_CLIENTS.reduce((acc, curr) => acc + curr.adSpend, 0);
  const avgROI = MOCK_CLIENTS.reduce((acc, curr) => acc + curr.roi, 0) / MOCK_CLIENTS.length;
  const avgHealth = MOCK_CLIENTS.reduce((acc, curr) => acc + curr.healthScore, 0) / MOCK_CLIENTS.length;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2">
              Agency Mode
            </Badge>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Macro Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Centro de Comando</h1>
          <p className="text-zinc-400 text-sm">Gerencie a performance consolidada de todos os seus clientes.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
            <Plus size={18} />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Ad Spend Consolidado</p>
              <h2 className="text-2xl font-bold text-white font-mono">
                R$ {totalAdSpend.toLocaleString()}
              </h2>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">ROI Médio Agência</p>
              <h2 className="text-2xl font-bold text-white font-mono">
                {avgROI.toFixed(2)}x
              </h2>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Health Score Médio</p>
              <h2 className="text-2xl font-bold text-white font-mono">
                {avgHealth.toFixed(0)}%
              </h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input 
            placeholder="Buscar cliente por nome ou ID..." 
            className="pl-10 bg-zinc-900/50 border-white/5 focus:border-emerald-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/5 text-zinc-400 gap-2">
            <Filter size={16} />
            Filtros
          </Button>
          <div className="flex bg-zinc-900/50 rounded-lg p-1 border border-white/5">
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-zinc-800 text-white">
              <LayoutGrid size={16} />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500">
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {MOCK_CLIENTS.map((client) => (
          <ClientPerformanceCard key={client.id} client={client} />
        ))}
      </div>

      {/* Footer Insight */}
      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-emerald-400/80">
            <span className="font-bold">Insight Macro:</span> O ROI médio da agência subiu 12% após a implementação das otimizações preditivas da Sprint 22.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs">
          Ver Relatório Completo
        </Button>
      </div>
    </div>
  );
}
