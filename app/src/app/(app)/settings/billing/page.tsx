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
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Crown,
  X,
  Check,
  Star,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTier } from '@/lib/hooks/use-tier';
import { toast } from 'sonner';
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

type BillingPeriod = 'monthly' | 'yearly';

// ============================================
// PLAN DATA
// ============================================

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    description: 'Para quem esta comecando no marketing digital',
    icon: Zap,
    monthlyPrice: 97,
    yearlyPrice: 970,
    color: 'blue',
    features: [
      '1 marca',
      '1 funil ativo',
      '50 assets',
      '50 consultas/mes',
      '3 documentos RAG',
      '3 forensics/mes',
      '2 modos de chat',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    description: 'Acesso completo para profissionais de marketing',
    icon: Crown,
    monthlyPrice: 297,
    yearlyPrice: 2970,
    color: 'gold',
    popular: true,
    features: [
      '3 marcas',
      '5 funis ativos',
      '500 assets',
      '300 consultas/mes',
      '20 documentos RAG',
      '15 forensics/mes',
      'Todos os modos de chat',
      'Intelligence & Discovery',
      'Campanhas & Ads',
      'Social & Automacao',
    ],
  },
  {
    id: 'agency' as const,
    name: 'Agency',
    description: 'Para agencias e times de marketing',
    icon: Building2,
    monthlyPrice: 597,
    yearlyPrice: 5970,
    color: 'purple',
    features: [
      'Marcas ilimitadas',
      'Funis ilimitados',
      'Assets ilimitados',
      '1.000 consultas/mes',
      'RAG ilimitado',
      'Forensics ilimitado',
      'Todos os modos de chat',
      'Intelligence & Discovery',
      'Campanhas & Ads',
      'Social & Automacao',
    ],
  },
];

// ============================================
// COMPONENT
// ============================================

export default function BillingPage() {
  const { user } = useAuthStore();
  const { tier, effectiveTier, isTrial, trialDaysRemaining, limits, usage } = useTier();
  const searchParams = useSearchParams();

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Check for success param (redirect from Stripe checkout)
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast.success('Pagamento confirmado! Seu plano foi atualizado.');
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
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!response.ok) throw new Error('Failed to fetch invoices');
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

  // Handle checkout
  const handleUpgrade = async (selectedTier: 'starter' | 'pro' | 'agency') => {
    setCheckoutLoading(selectedTier);
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
        body: JSON.stringify({ tier: selectedTier, billingPeriod }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Erro ao iniciar checkout');
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle cancel
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
      window.location.reload();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        toast.error('Sessao expirada. Faca login novamente.');
        return;
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Erro ao abrir portal');
        return;
      }

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal de assinatura');
    } finally {
      setPortalLoading(false);
    }
  };

  const isPaid = ['starter', 'pro', 'agency'].includes(tier);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Cobranca & Assinatura" />

      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Current Plan Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  isPaid ? 'bg-[#E6B447]/10' : isTrial ? 'bg-[#E6B447]/10' : 'bg-zinc-800'
                )}>
                  {isPaid || isTrial ? (
                    <Crown className="h-6 w-6 text-[#E6B447]" />
                  ) : (
                    <Zap className="h-6 w-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {isPaid ? `Plano ${tier.charAt(0).toUpperCase() + tier.slice(1)}` : isTrial ? 'Trial PRO' : 'Plano Free'}
                    </h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-semibold',
                      isPaid ? 'bg-[#E6B447]/15 text-[#E6B447]' : isTrial ? 'bg-[#E6B447]/15 text-[#E6B447]' : 'bg-zinc-800 text-zinc-400'
                    )}>
                      {isPaid ? 'Ativo' : isTrial ? `${trialDaysRemaining}d restantes` : 'Gratuito'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {isTrial
                      ? 'Voce esta testando todas as funcionalidades PRO gratuitamente'
                      : isPaid
                        ? 'Gerencie sua assinatura e metodo de pagamento'
                        : 'Faca upgrade para desbloquear mais recursos'}
                  </p>
                </div>
              </div>

              {isPaid && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-3.5 w-3.5" />
                    )}
                    Gerenciar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          {!isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className={cn('text-sm font-medium', billingPeriod === 'monthly' ? 'text-white' : 'text-zinc-500')}>
                  Mensal
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    billingPeriod === 'yearly' ? 'bg-[#E6B447]' : 'bg-zinc-700'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                  )} />
                </button>
                <span className={cn('text-sm font-medium', billingPeriod === 'yearly' ? 'text-white' : 'text-zinc-500')}>
                  Anual
                </span>
                {billingPeriod === 'yearly' && (
                  <span className="px-2 py-0.5 rounded-md bg-[#E6B447]/15 text-[#E6B447] text-xs font-semibold">
                    2 meses gratis
                  </span>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map((plan) => {
                  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                  const monthlyEquivalent = billingPeriod === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
                  const isCurrentTier = tier === plan.id;
                  const PlanIcon = plan.icon;

                  const colorMap = {
                    blue: {
                      border: 'border-blue-500/20 hover:border-blue-500/40',
                      iconBg: 'bg-blue-500/10',
                      iconColor: 'text-blue-400',
                      badge: 'bg-blue-500/15 text-blue-400',
                    },
                    gold: {
                      border: 'border-[#E6B447]/30 hover:border-[#E6B447]/60',
                      iconBg: 'bg-[#E6B447]/10',
                      iconColor: 'text-[#E6B447]',
                      badge: 'bg-[#E6B447]/15 text-[#E6B447]',
                    },
                    purple: {
                      border: 'border-purple-500/20 hover:border-purple-500/40',
                      iconBg: 'bg-purple-500/10',
                      iconColor: 'text-purple-400',
                      badge: 'bg-purple-500/15 text-purple-400',
                    },
                  };

                  const colors = colorMap[plan.color as keyof typeof colorMap];

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'relative rounded-2xl border bg-white/[0.02] p-6 transition-all',
                        colors.border,
                        plan.popular && 'ring-1 ring-[#E6B447]/30'
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 rounded-full bg-[#E6B447] text-black text-xs font-bold uppercase tracking-wider">
                            Mais Popular
                          </span>
                        </div>
                      )}

                      <div className="mb-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.iconBg)}>
                            <PlanIcon className={cn('h-5 w-5', colors.iconColor)} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-500">{plan.description}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">
                            R${monthlyEquivalent}
                          </span>
                          <span className="text-zinc-500">/mes</span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <p className="text-xs text-zinc-500 mt-1">
                            R${price}/ano (cobrado anualmente)
                          </p>
                        )}
                      </div>

                      <Button
                        className={cn(
                          'w-full mb-6',
                          plan.popular
                            ? 'bg-[#E6B447] hover:bg-[#AB8648] text-black font-semibold'
                            : ''
                        )}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={!!checkoutLoading || isCurrentTier}
                      >
                        {checkoutLoading === plan.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isCurrentTier ? (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                        )}
                        {isCurrentTier ? 'Plano Atual' : 'Assinar'}
                      </Button>

                      <div className="space-y-2.5">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2.5">
                            <Check className={cn('h-4 w-4 mt-0.5 shrink-0', colors.iconColor)} />
                            <span className="text-sm text-zinc-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Usage & Invoices Row */}
          <div className={cn('grid gap-6', isPaid ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
            {/* Usage Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-premium p-6"
            >
              <h3 className="text-base font-semibold text-white mb-4">
                Uso do Plano
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Marcas', used: usage.brands, limit: limits.maxBrands },
                  { label: 'Funis', used: usage.activeFunnels, limit: limits.maxActiveFunnels },
                  { label: 'Assets', used: usage.totalAssets, limit: limits.maxAssetsTotal },
                  { label: 'Consultas', used: usage.monthlyQueries, limit: limits.monthlyQueries },
                ].map((item) => {
                  const percentage = item.limit >= 100 ? 0 : Math.min((item.used / item.limit) * 100, 100);
                  const isExceeded = percentage >= 100;

                  return (
                    <div key={item.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-white">
                        {item.used} <span className="text-zinc-600 font-normal">/ {item.limit >= 100 ? '∞' : item.limit}</span>
                      </p>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isExceeded ? 'bg-red-500' : 'bg-[#E6B447]'
                          )}
                          style={{ width: `${item.limit >= 100 ? 0 : percentage}%` }}
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
              transition={{ delay: 0.3 }}
              className="card-premium p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">
                  Faturas
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  disabled={loadingInvoices}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loadingInvoices && 'animate-spin')} />
                </Button>
              </div>

              {loadingInvoices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-zinc-600">
                  <FileText className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma fatura</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-zinc-500" />
                        <div>
                          <p className="text-sm font-medium text-white">#{invoice.number}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(invoice.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{invoice.amount}</p>
                          <p className={cn(
                            'text-xs',
                            invoice.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          )}>
                            {invoice.status === 'paid' ? 'Paga' : 'Pendente'}
                          </p>
                        </div>
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
                          >
                            <Download className="h-3.5 w-3.5 text-zinc-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

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

                <div className="p-4 rounded-xl bg-[#E6B447]/10 border border-[#E6B447]/20 mb-6">
                  <p className="text-sm text-[#E6B447]">
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
