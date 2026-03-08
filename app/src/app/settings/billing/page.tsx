'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Calendar,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Crown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTier } from '@/lib/hooks/use-tier';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';

// ============================================
// TYPES
// ============================================

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: string;
  amountCents: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string;
}

// ============================================
// CONSTANTS
// ============================================

const TIER_DISPLAY: Record<string, { name: string; color: string; icon: typeof Zap }> = {
  free: { name: 'Free', color: 'text-zinc-400', icon: Zap },
  trial: { name: 'Trial PRO', color: 'text-amber-400', icon: Crown },
  starter: { name: 'Starter', color: 'text-blue-400', icon: Zap },
  pro: { name: 'Pro', color: 'text-[#E6B447]', icon: Crown },
  agency: { name: 'Agency', color: 'text-[#E6B447]', icon: Crown },
};

// ============================================
// COMPONENT
// ============================================

export default function BillingPage() {
  const { user } = useAuthStore();
  const { tier, effectiveTier, isTrial, trialDaysRemaining, limits, usage } = useTier();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check for success param (redirect from Stripe checkout)
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Pagamento confirmado! Seu plano foi atualizado.');
      // Clean up URL
      window.history.replaceState({}, '', '/settings/billing');
    }
  }, [searchParams]);

  // Fetch invoices
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const currentUser = auth?.currentUser;
        if (!currentUser) return;

        const idToken = await currentUser.getIdToken();
        const response = await fetch('/api/payments/invoices', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        const data = await response.json();
        setInvoices(data.data?.invoices || []);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    }

    fetchInvoices();
  }, []);

  // Handle checkout redirect
  const handleUpgrade = async (selectedTier: 'starter' | 'pro' | 'agency') => {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        toast.error('Sessao expirada. Faca login novamente.');
        return;
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tier: selectedTier,
          billingPeriod: 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao iniciar checkout');
        return;
      }

      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pagamento');
    }
  };

  // Handle cancel subscription
  const handleCancel = async (requestRefund: boolean = false) => {
    setCanceling(true);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        toast.error('Sessao expirada. Faca login novamente.');
        return;
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ requestRefund }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao cancelar assinatura');
        return;
      }

      toast.success(data.data?.message || 'Assinatura cancelada com sucesso');
      setShowCancelConfirm(false);

      // Refresh page to update tier info
      window.location.reload();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  const tierInfo = TIER_DISPLAY[tier] || TIER_DISPLAY.free;
  const TierIcon = tierInfo.icon;

  const isPaid = ['starter', 'pro', 'agency'].includes(tier);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Cobranca & Assinatura" />

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Plano Atual
                </h3>
                <p className="text-sm text-zinc-500">
                  Gerencie sua assinatura e metodo de pagamento
                </p>
              </div>
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', tierInfo.color, 'bg-white/[0.04]')}>
                <TierIcon className="h-4 w-4" />
                <span className="font-semibold">{tierInfo.name}</span>
              </div>
            </div>

            {/* Trial Badge */}
            {isTrial && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400">
                    Trial PRO ativo - {trialDaysRemaining} dias restantes
                  </p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Apos o trial, sua conta sera convertida para o plano Free
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleUpgrade('pro')}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                >
                  Assinar Pro
                </Button>
              </div>
            )}

            {/* Plan Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  {isPaid ? (
                    <CheckCircle2 className="h-4 w-4 text-[#E6B447]" />
                  ) : isTrial ? (
                    <Clock className="h-4 w-4 text-amber-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-zinc-500" />
                  )}
                  <span className="text-sm text-zinc-400">Status</span>
                </div>
                <p className={cn('font-semibold', isPaid ? 'text-[#E6B447]' : isTrial ? 'text-amber-400' : 'text-zinc-300')}>
                  {isPaid ? 'Ativo' : isTrial ? 'Em Trial' : 'Gratuito'}
                </p>
              </div>

              {/* Next Billing */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">Proxima cobranca</span>
                </div>
                <p className="font-semibold text-white">
                  {isPaid ? 'Ver fatura' : isTrial ? `Em ${trialDaysRemaining} dias` : '-'}
                </p>
              </div>

              {/* Payment Method */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">Metodo</span>
                </div>
                <p className="font-semibold text-white">
                  {isPaid ? 'Cartao' : '-'}
                </p>
              </div>
            </div>

            {/* Actions */}
            {isPaid && (
              <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancelar Assinatura
                </Button>
                {tier !== 'agency' && (
                  <Button
                    onClick={() => handleUpgrade(tier === 'starter' ? 'pro' : 'agency')}
                    className="btn-accent"
                  >
                    Fazer Upgrade
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {!isPaid && !isTrial && (
              <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-center gap-4">
                <Button onClick={() => handleUpgrade('starter')} variant="outline">
                  Starter - R$97/mes
                </Button>
                <Button onClick={() => handleUpgrade('pro')} className="btn-accent">
                  Pro - R$297/mes
                </Button>
                <Button onClick={() => handleUpgrade('agency')} variant="outline">
                  Agency - R$597/mes
                </Button>
              </div>
            )}
          </motion.div>

          {/* Usage Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">
              Uso do Plano
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Marcas', used: usage.brands, limit: limits.maxBrands },
                { label: 'Funis Ativos', used: usage.activeFunnels, limit: limits.maxActiveFunnels },
                { label: 'Assets', used: usage.totalAssets, limit: limits.maxAssetsTotal },
                { label: 'Consultas/mes', used: usage.monthlyQueries, limit: limits.monthlyQueries },
              ].map((item) => {
                const percentage = Math.min((item.used / item.limit) * 100, 100);
                const isWarning = percentage > 80;
                const isExceeded = percentage >= 100;

                return (
                  <div key={item.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-sm text-zinc-400 mb-2">{item.label}</p>
                    <p className="text-lg font-semibold text-white mb-2">
                      {item.used} <span className="text-zinc-500">/ {item.limit >= 100 ? '∞' : item.limit}</span>
                    </p>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[#E6B447]'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Invoices Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Historico de Faturas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={loadingInvoices}
              >
                <RefreshCw className={cn('h-4 w-4', loadingInvoices && 'animate-spin')} />
              </Button>
            </div>

            {loadingInvoices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma fatura encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white/[0.04]">
                        <FileText className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Fatura #{invoice.number}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {new Date(invoice.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-white">{invoice.amount}</p>
                        <p className={cn(
                          'text-xs',
                          invoice.status === 'paid' ? 'text-[#E6B447]' : 'text-amber-400'
                        )}>
                          {invoice.status === 'paid' ? 'Paga' : 'Pendente'}
                        </p>
                      </div>
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <Download className="h-4 w-4 text-zinc-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Cancelar Assinatura
                  </h3>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="p-1 rounded-lg hover:bg-white/[0.04]"
                  >
                    <X className="h-5 w-5 text-zinc-400" />
                  </button>
                </div>

                <p className="text-zinc-400 mb-6">
                  Tem certeza que deseja cancelar? Voce mantera acesso ate o fim do periodo atual.
                </p>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                  <p className="text-sm text-amber-400">
                    <strong>CDC Art. 49:</strong> Se voce assinou nos ultimos 7 dias,
                    pode solicitar reembolso total.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={canceling}
                  >
                    Manter Plano
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleCancel(false)}
                    disabled={canceling}
                  >
                    {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
