'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Target,
  MessageSquare,
  BarChart3,
  Plus,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { COUNSELORS } from '@/lib/constants';
import { useUser } from '@/lib/hooks/use-user';
import { useStats } from '@/lib/hooks/use-stats';
import { useFunnels } from '@/lib/hooks/use-funnels';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  generating: { label: 'Gerando', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  review: { label: 'Avaliar', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  adjusting: { label: 'Ajustando', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  executing: { label: 'Executando', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  killed: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string;
  icon: any; 
  trend?: { value: string; positive: boolean };
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-premium card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.positive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-value">{value}</p>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <p className="mt-3 text-xs text-zinc-600">{title}</p>
    </motion.div>
  );
}

function ActionCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay = 0 
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4 }}
        className="group relative h-full"
      >
        <div className="card-premium card-hover h-full p-6">
          {/* Gradient glow on hover */}
          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} blur-2xl -z-10`} />
          
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient.replace('blur-2xl', '')} bg-opacity-20`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </div>
          
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Acessar
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useUser();
  const { stats, isLoading: statsLoading } = useStats();
  const { funnels, isLoading: funnelsLoading } = useFunnels();

  const recentFunnels = funnels.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Dashboard" />

      <div className="flex-1 p-8">
        {/* Welcome Section */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {getGreeting()}
          </h2>
          <p className="mt-2 text-zinc-400 max-w-lg">
            Crie, avalie e governe seus funis com a inteligência do Conselho.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Funis Ativos"
            value={statsLoading ? '—' : stats.activeFunnels}
            subtitle={stats.activeFunnels === 0 ? 'Crie seu primeiro' : 'Em andamento'}
            icon={Target}
            delay={0.1}
          />
          <StatCard
            title="Avaliações"
            value={statsLoading ? '—' : stats.pendingEvaluations}
            subtitle={stats.pendingEvaluations === 0 ? 'Nenhuma pendente' : 'Aguardando'}
            icon={BarChart3}
            trend={stats.pendingEvaluations > 0 ? { value: `${stats.pendingEvaluations} pendente${stats.pendingEvaluations > 1 ? 's' : ''}`, positive: false } : undefined}
            delay={0.15}
          />
          <StatCard
            title="Decisões"
            value={statsLoading ? '—' : stats.decisionsThisMonth}
            subtitle="Este mês"
            icon={CheckCircle2}
            delay={0.2}
          />
          <StatCard
            title="Conversas"
            value={statsLoading ? '—' : stats.totalConversations}
            subtitle="Com o Conselho"
            icon={MessageSquare}
            delay={0.25}
          />
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
          </div>
          
          <div className="grid gap-5 md:grid-cols-3">
            <ActionCard
              href="/funnels/new"
              icon={Plus}
              title="Novo Funil"
              description="Crie um funil do zero com ajuda do Conselho"
              gradient="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20"
              delay={0.3}
            />
            <ActionCard
              href="/chat"
              icon={MessageSquare}
              title="Consultar Conselho"
              description="Tire dúvidas com os 6 especialistas"
              gradient="bg-gradient-to-br from-blue-500/20 to-blue-600/20"
              delay={0.35}
            />
            <ActionCard
              href="/library"
              icon={Zap}
              title="Biblioteca"
              description="Acesse templates e cases de sucesso"
              gradient="bg-gradient-to-br from-amber-500/20 to-amber-600/20"
              delay={0.4}
            />
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Recent Funnels */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Funis Recentes</h3>
              <Link href="/funnels" className="btn-ghost text-zinc-400 hover:text-emerald-400">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {funnelsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card-premium p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                      <div className="flex-1">
                        <div className="h-4 w-32 rounded bg-zinc-800" />
                        <div className="mt-2 h-3 w-48 rounded bg-zinc-800/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentFunnels.length === 0 ? (
              <div className="card-premium p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                  <Target className="h-8 w-8 text-zinc-600" />
                </div>
                <h4 className="mt-4 text-lg font-medium text-zinc-300">
                  Nenhum funil ainda
                </h4>
                <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
                  Crie seu primeiro funil para começar a usar o Conselho
                </p>
                <Link href="/funnels/new">
                  <Button className="mt-6 btn-accent">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Funil
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFunnels.map((funnel, index) => {
                  const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
                  return (
                    <motion.div
                      key={funnel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    >
                      <Link href={`/funnels/${funnel.id}`}>
                        <div className="card-premium card-hover p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <Target className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{funnel.name}</h4>
                                <p className="text-sm text-zinc-500">
                                  {funnel.context.objective} • {funnel.context.channels.primary}
                                </p>
                              </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                              {status.label}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Council */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">O Conselho</h3>
            </div>

            <div className="card-premium p-5">
              <div className="grid grid-cols-2 gap-3">
                {Object.values(COUNSELORS).map((counselor, index) => (
                  <motion.div
                    key={counselor.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.6 + index * 0.05 }}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-default"
                  >
                    <div 
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-base transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${counselor.color}15` }}
                    >
                      {counselor.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {counselor.name.split(' ').slice(-1)[0]}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {counselor.expertise.split(' ').slice(0, 2).join(' ')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <Link href="/chat">
                  <Button variant="ghost" className="w-full justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Consultar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
