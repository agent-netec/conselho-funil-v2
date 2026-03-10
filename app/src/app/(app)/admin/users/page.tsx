'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldX,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/use-user';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  name: string;
  email: string;
  tier: string;
  role: string;
  credits: number;
  lastLogin: string | null;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

const TIER_BADGE: Record<string, { label: string; classes: string }> = {
  free: { label: 'Free', classes: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' },
  trial: { label: 'Trial', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  starter: { label: 'Starter', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pro: { label: 'Pro', classes: 'bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20' },
  agency: { label: 'Agency', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());
      if (tierFilter !== 'all') params.set('tier', tierFilter);

      const res = await fetch(`/api/admin/users?${params}`, { headers });
      if (!res.ok) throw new Error('Falha ao carregar usuarios');
      const data: UsersResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error('[AdminUsers] Error:', err);
      toast.error('Erro ao carregar lista de usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    if (userLoading || !user) return;
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [user, userLoading, fetchUsers]);

  // Reset page on search/filter change
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
        <Header title="Admin - Usuarios" showBack showBrandSelector={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Acesso Negado</h2>
          <p className="text-zinc-500 text-sm">Permissao de administrador necessaria.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Usuarios" subtitle="GERENCIAMENTO" showBack showBrandSelector={false} />

      <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-zinc-600 focus:border-[#E6B447]/30"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:border-[#E6B447]/30 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os tiers</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="agency">Agency</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-premium border border-white/[0.05] overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#E6B447]" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500">Nenhum usuario encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Role
                    </th>
                    <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Creditos
                    </th>
                    <th className="text-right px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 hidden sm:table-cell">
                      Ultimo Login
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const badge = TIER_BADGE[u.tier] || TIER_BADGE.free;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium truncate max-w-[180px]">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs truncate max-w-[220px]">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs capitalize">
                          {u.role}
                        </td>
                        <td className="px-4 py-3 text-right text-white font-mono text-xs">
                          {u.credits}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500 text-xs font-mono hidden sm:table-cell">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-mono">
              {total} usuario{total !== 1 ? 's' : ''} - Pagina {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.03]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
