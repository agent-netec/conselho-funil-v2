'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  TrendingUp,
  Crown,
  Shield,
  ArrowRight,
  Loader2,
  ShieldX,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useUser } from '@/lib/hooks/use-user';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  byTier: {
    free: number;
    trial: number;
    starter: number;
    pro: number;
    agency: number;
  };
  signups7d: number;
  signups30d: number;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Free', color: 'text-zinc-400', bg: 'bg-zinc-800/50' },
  trial: { label: 'Trial', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  starter: { label: 'Starter', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  pro: { label: 'Pro', color: 'text-[#E6B447]', bg: 'bg-[#E6B447]/10' },
  agency: { label: 'Agency', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export default function AdminDashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !user) return;
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/stats', { headers });
        if (!res.ok) throw new Error('Falha ao carregar estatisticas');
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error('[Admin] Error fetching stats:', err);
        toast.error('Erro ao carregar estatisticas do admin');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user, userLoading]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <>
        <Header title="Admin" showBrandSelector={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Acesso Negado</h2>
          <p className="text-zinc-500 text-sm text-center max-w-sm">
            Voce nao tem permissao para acessar o painel administrativo.
            Entre em contato com um administrador.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Admin" subtitle="PAINEL ADMINISTRATIVO" showBrandSelector={false} />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
          </div>
        ) : stats ? (
          <>
            {/* Top Row: Total Users + Signups */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="card-premium p-5 border border-white/[0.05]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10">
                    <Users className="h-5 w-5 text-[#E6B447]" />
                  </div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                    Total Usuarios
                  </span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">
                  {stats.totalUsers.toLocaleString('pt-BR')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="card-premium p-5 border border-white/[0.05]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                    <UserPlus className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                    Signups 7 dias
                  </span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">
                  {stats.signups7d.toLocaleString('pt-BR')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-premium p-5 border border-white/[0.05]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                    Signups 30 dias
                  </span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">
                  {stats.signups30d.toLocaleString('pt-BR')}
                </p>
              </motion.div>
            </div>

            {/* Tier Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-premium p-6 border border-white/[0.05]"
            >
              <div className="flex items-center gap-2 mb-5">
                <Crown className="h-4 w-4 text-[#E6B447]" />
                <h3 className="text-sm font-semibold text-white">Usuarios por Tier</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(stats.byTier).map(([tier, count]) => {
                  const config = TIER_CONFIG[tier];
                  const pct = stats.totalUsers > 0
                    ? ((count / stats.totalUsers) * 100).toFixed(1)
                    : '0';
                  return (
                    <div
                      key={tier}
                      className={`rounded-xl p-4 ${config.bg} border border-white/[0.04]`}
                    >
                      <p className={`text-xs font-mono uppercase tracking-wider ${config.color} mb-1`}>
                        {config.label}
                      </p>
                      <p className="text-2xl font-bold text-white font-mono">{count}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/admin/users"
                className="flex items-center justify-between card-premium p-5 border border-white/[0.05] hover:border-[#E6B447]/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10">
                    <Shield className="h-5 w-5 text-[#E6B447]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Gerenciar Usuarios</p>
                    <p className="text-xs text-zinc-500">
                      Visualizar, editar tiers, creditos e permissoes
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-[#E6B447] transition-colors" />
              </Link>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Nenhum dado disponivel
          </div>
        )}
      </div>
    </>
  );
}
