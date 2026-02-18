'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrandStore } from '@/lib/stores/brand-store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Webhook,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Save,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProviderConfig {
  id: 'hotmart' | 'kiwify' | 'stripe';
  name: string;
  icon: string;
  description: string;
  secretLabel: string;
  secretPlaceholder: string;
  docsUrl: string;
  instructions: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'hotmart',
    name: 'Hotmart',
    icon: '🔥',
    description: 'Receba postbacks de vendas, reembolsos e chargebacks do Hotmart.',
    secretLabel: 'Hottok (Token de Segurança)',
    secretPlaceholder: 'Seu hottok do Hotmart...',
    docsUrl: 'https://developers.hotmart.com/docs/pt-BR/postback/',
    instructions: [
      'No Hotmart, vá em Ferramentas > Webhooks (Postback)',
      'Cole a URL do webhook abaixo',
      'Selecione os eventos: PURCHASE_APPROVED, PURCHASE_REFUNDED, PURCHASE_CHARGEBACK',
      'Copie o hottok e cole no campo abaixo',
    ],
  },
  {
    id: 'kiwify',
    name: 'Kiwify',
    icon: '🥝',
    description: 'Receba notificações de vendas, reembolsos e chargebacks do Kiwify.',
    secretLabel: 'Signature Secret',
    secretPlaceholder: 'Seu secret da Kiwify...',
    docsUrl: 'https://help.kiwify.com.br/',
    instructions: [
      'Na Kiwify, vá em Configurações > Webhooks',
      'Cole a URL do webhook abaixo',
      'Selecione os eventos relevantes',
      'Copie o secret de assinatura e cole abaixo',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Receba eventos de checkout e reembolsos do Stripe.',
    secretLabel: 'Webhook Signing Secret',
    secretPlaceholder: 'whsec_...',
    docsUrl: 'https://docs.stripe.com/webhooks',
    instructions: [
      'No Stripe Dashboard, vá em Developers > Webhooks',
      'Clique em "Add endpoint" e cole a URL abaixo',
      'Selecione: checkout.session.completed, charge.refunded',
      'Copie o "Signing secret" e cole abaixo',
    ],
  },
];

export default function PaymentWebhooksPage() {
  const { activeBrand } = useBrandStore();
  const brandId = activeBrand?.id;
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [copiedProvider, setCopiedProvider] = useState<string | null>(null);

  const webhookUrl = brandId
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.vercel.app'}/api/webhooks/payments?brandId=${brandId}`
    : '';

  const handleCopy = async (provider: string) => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedProvider(provider);
      toast.success('URL copiada!');
      setTimeout(() => setCopiedProvider(null), 2000);
    } catch {
      toast.error('Erro ao copiar.');
    }
  };

  const handleSaveSecrets = async () => {
    if (!brandId) return;
    setIsSaving(true);
    try {
      const brandRef = doc(db, 'brands', brandId);
      await updateDoc(brandRef, { webhookSecrets: secrets });
      toast.success('Secrets salvos com sucesso!');
    } catch (err) {
      console.error('Error saving webhook secrets:', err);
      toast.error('Erro ao salvar secrets.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Webhooks de Pagamento" />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Configurações
        </Link>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Webhook className="h-6 w-6 text-emerald-500" />
              Webhooks de Pagamento
            </h2>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-2xl">
              Configure webhooks para receber automaticamente dados de vendas das suas plataformas de
              pagamento. As transações serão vinculadas aos leads na{' '}
              <Link href="/intelligence/journey" className="text-emerald-400 hover:underline">
                Jornada do Lead
              </Link>.
            </p>
          </div>

          {!brandId && (
            <div className="card-premium p-6 border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                Selecione uma brand no menu lateral para configurar webhooks.
              </p>
            </div>
          )}

          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="card-premium p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] text-2xl">
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                  <p className="text-sm text-zinc-500">{provider.description}</p>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  URL do Webhook
                </label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="input-premium text-xs font-mono"
                    placeholder="Selecione uma brand..."
                  />
                  <Button
                    variant="ghost"
                    className="btn-ghost h-10 px-3"
                    onClick={() => handleCopy(provider.id)}
                    disabled={!brandId}
                  >
                    {copiedProvider === provider.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Secret field */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  {provider.secretLabel}
                </label>
                <Input
                  type="password"
                  value={secrets[provider.id] || ''}
                  onChange={(e) => setSecrets({ ...secrets, [provider.id]: e.target.value })}
                  placeholder={provider.secretPlaceholder}
                  className="input-premium"
                />
              </div>

              {/* Instructions */}
              <div className="bg-zinc-950 border border-white/[0.04] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Como configurar
                </h4>
                <ol className="space-y-1.5">
                  {provider.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-zinc-500">
                      <span className="text-emerald-400 font-mono flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-500 hover:underline"
                >
                  Documentação oficial →
                </a>
              </div>
            </div>
          ))}

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSecrets}
              className="btn-accent"
              disabled={isSaving || !brandId}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Secrets
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
