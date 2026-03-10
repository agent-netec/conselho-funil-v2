'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Crown,
  Shield,
  Coins,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  Loader2,
  ShieldX,
  Save,
  History,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  tier: string;
  role: string;
  credits: number;
  status: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  avatar?: string;
  usage?: number;
  auditLog?: AuditEntry[];
}

interface AuditEntry {
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  by: string;
  at: string;
}

const TIERS = ['free', 'trial', 'starter', 'pro', 'agency'] as const;
const ROLES = ['admin', 'member', 'viewer'] as const;

const TIER_BADGE: Record<string, { label: string; classes: string }> = {
  free: { label: 'Free', classes: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' },
  trial: { label: 'Trial', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  starter: { label: 'Starter', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pro: { label: 'Pro', classes: 'bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20' },
  agency: { label: 'Agency', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser, isLoading: userLoading } = useUser();

  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action states
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [creditsAmount, setCreditsAmount] = useState('');
  const [tierReason, setTierReason] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    if (userLoading || !currentUser) return;
    if (currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/admin/users/${userId}`, { headers });
        if (!res.ok) throw new Error('Falha ao carregar usuario');
        const data: UserDetail = await res.json();
        setUserData(data);
        setSelectedTier(data.tier);
        setSelectedRole(data.role);
      } catch (err) {
        console.error('[AdminUserDetail] Error:', err);
        toast.error('Erro ao carregar dados do usuario');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId, currentUser, userLoading]);

  const handleAction = async (field: string, value: string | number | boolean, reason: string) => {
    if (!reason.trim()) {
      toast.error('Informe um motivo para a alteracao');
      return;
    }

    setActionLoading(field);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ field, value, reason: reason.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha na operacao');
      }

      const updated: UserDetail = await res.json();
      setUserData(updated);
      setSelectedTier(updated.tier);
      setSelectedRole(updated.role);

      // Clear reason inputs
      if (field === 'tier') setTierReason('');
      if (field === 'role') setRoleReason('');
      if (field === 'credits') {
        setCreditsReason('');
        setCreditsAmount('');
      }
      if (field === 'status') setStatusReason('');

      toast.success(`Campo "${field}" atualizado com sucesso`);
    } catch (err: any) {
      console.error('[AdminUserDetail] Action error:', err);
      toast.error(err.message || 'Erro ao executar acao');
    } finally {
      setActionLoading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <>
        <Header title="Usuario" showBack showBrandSelector={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Acesso Negado</h2>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="Usuario" showBack showBrandSelector={false} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Header title="Usuario" showBack showBrandSelector={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <AlertCircle className="h-8 w-8 text-zinc-500" />
          <p className="text-zinc-500">Usuario nao encontrado</p>
        </div>
      </>
    );
  }

  const badge = TIER_BADGE[userData.tier] || TIER_BADGE.free;

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--';

  return (
    <>
      <Header title={userData.name || 'Usuario'} subtitle={userData.email} showBack showBrandSelector={false} />

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 border border-white/[0.05]"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A1612] to-[#241F19] text-lg font-bold text-[#AB8648] ring-1 ring-white/[0.06] shrink-0">
              {userData.name
                ? userData.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">{userData.name}</h2>
              <p className="text-sm text-zinc-400 font-mono truncate">{userData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider border ${badge.classes}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-zinc-500 capitalize">{userData.role}</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase border ${
                    userData.status
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {userData.status ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem icon={Coins} label="Creditos" value={String(userData.credits)} />
            <InfoItem icon={Calendar} label="Criado em" value={formatDate(userData.createdAt)} />
            <InfoItem icon={Clock} label="Ultimo Login" value={formatDate(userData.lastLogin)} />
            <InfoItem icon={UserIcon} label="ID" value={userData.id.slice(0, 8) + '...'} mono />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Change Tier */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-premium p-5 border border-white/[0.05] space-y-3"
          >
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#E6B447]" />
              <h3 className="text-sm font-semibold text-white">Alterar Tier</h3>
            </div>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white px-3 focus:border-[#E6B447]/30 focus:outline-none"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <Input
              placeholder="Motivo da alteracao..."
              value={tierReason}
              onChange={(e) => setTierReason(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 text-xs"
            />
            <Button
              onClick={() => handleAction('tier', selectedTier, tierReason)}
              disabled={actionLoading === 'tier' || selectedTier === userData.tier}
              className="w-full bg-[#E6B447]/10 text-[#E6B447] border border-[#E6B447]/20 hover:bg-[#E6B447]/20"
              size="sm"
            >
              {actionLoading === 'tier' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Tier
            </Button>
          </motion.div>

          {/* Change Role */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-5 border border-white/[0.05] space-y-3"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Alterar Role</h3>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white px-3 focus:border-[#E6B447]/30 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <Input
              placeholder="Motivo da alteracao..."
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 text-xs"
            />
            <Button
              onClick={() => handleAction('role', selectedRole, roleReason)}
              disabled={actionLoading === 'role' || selectedRole === userData.role}
              className="w-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
              size="sm"
            >
              {actionLoading === 'role' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Role
            </Button>
          </motion.div>

          {/* Give Credits */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-premium p-5 border border-white/[0.05] space-y-3"
          >
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Dar Creditos</h3>
            </div>
            <Input
              type="number"
              placeholder="Quantidade de creditos"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              min={1}
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 text-sm font-mono"
            />
            <Input
              placeholder="Motivo..."
              value={creditsReason}
              onChange={(e) => setCreditsReason(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 text-xs"
            />
            <Button
              onClick={() => handleAction('credits', Number(creditsAmount), creditsReason)}
              disabled={actionLoading === 'credits' || !creditsAmount || Number(creditsAmount) <= 0}
              className="w-full bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
              size="sm"
            >
              {actionLoading === 'credits' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              Adicionar Creditos
            </Button>
          </motion.div>

          {/* Toggle Active */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-5 border border-white/[0.05] space-y-3"
          >
            <div className="flex items-center gap-2">
              {userData.status ? (
                <ToggleRight className="h-4 w-4 text-green-400" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-red-400" />
              )}
              <h3 className="text-sm font-semibold text-white">Status da Conta</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Status atual:{' '}
              <span className={userData.status ? 'text-green-400' : 'text-red-400'}>
                {userData.status ? 'Ativo' : 'Inativo'}
              </span>
            </p>
            <Input
              placeholder="Motivo da alteracao..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 text-xs"
            />
            <Button
              onClick={() => handleAction('status', !userData.status, statusReason)}
              disabled={actionLoading === 'status'}
              className={`w-full border ${
                userData.status
                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
              }`}
              size="sm"
            >
              {actionLoading === 'status' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : userData.status ? (
                <ToggleLeft className="h-4 w-4 mr-2" />
              ) : (
                <ToggleRight className="h-4 w-4 mr-2" />
              )}
              {userData.status ? 'Desativar Conta' : 'Ativar Conta'}
            </Button>
          </motion.div>
        </div>

        {/* Audit Log */}
        {userData.auditLog && userData.auditLog.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-premium p-6 border border-white/[0.05]"
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-[#E6B447]" />
              <h3 className="text-sm font-semibold text-white">Historico de Alteracoes</h3>
            </div>

            <div className="space-y-3">
              {userData.auditLog.map((entry, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-white/[0.03] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white">
                      <span className="text-[#E6B447] font-mono">{entry.field}</span>
                      {' : '}
                      <span className="text-zinc-500 line-through">{entry.oldValue}</span>
                      {' → '}
                      <span className="text-green-400">{entry.newValue}</span>
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      Motivo: {entry.reason}
                    </p>
                  </div>
                  <div className="text-[10px] text-zinc-600 font-mono shrink-0">
                    {formatDate(entry.at)} por {entry.by}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
      <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono">{label}</p>
        <p className={`text-xs text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
