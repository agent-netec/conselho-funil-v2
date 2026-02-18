'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Shield,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TrackingSettingsPage() {
  const activeBrand = useActiveBrand();
  const [copied, setCopied] = useState(false);
  const brandId = activeBrand?.id;

  const snippet = brandId
    ? `<!-- Conselho de Funil Tracking -->
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.vercel.app'}/api/tracking/script.js?brandId=${brandId}" defer></script>`
    : '';

  const handleCopy = async () => {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Snippet copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar. Selecione manualmente.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Tracking Script" />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Configurações
        </Link>

        <div className="space-y-6">
          {/* Header section */}
          <div>
            <h2 className="text-2xl font-bold text-white">Instalar Tracking Script</h2>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-2xl">
              Adicione o script abaixo no seu site ou página de vendas para rastrear a jornada
              dos seus leads automaticamente. Dados coletados aparecem na{' '}
              <Link href="/intelligence/journey" className="text-emerald-400 hover:underline">
                Jornada do Lead
              </Link>.
            </p>
          </div>

          {/* Snippet card */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-500" />
                Snippet de Instalação
              </h3>
              <Button
                variant="ghost"
                className="btn-ghost h-8 text-xs"
                onClick={handleCopy}
                disabled={!brandId}
              >
                {copied ? (
                  <Check className="mr-1.5 h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            {brandId ? (
              <div className="relative">
                <pre className="bg-zinc-950 border border-white/[0.06] rounded-xl p-4 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {snippet}
                </pre>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-yellow-500/20 rounded-xl p-6 text-center">
                <p className="text-sm text-yellow-400">
                  Selecione uma brand no menu lateral para gerar o snippet.
                </p>
              </div>
            )}

            <p className="mt-4 text-[11px] text-zinc-500">
              Cole antes do <code className="text-zinc-400">&lt;/body&gt;</code> do seu HTML.
              O script carrega de forma assíncrona e não afeta o tempo de carregamento da página.
            </p>
          </div>

          {/* Instructions */}
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Como instalar
            </h3>
            <ol className="space-y-4 text-sm text-zinc-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex-shrink-0">
                  1
                </span>
                <span>
                  Copie o snippet acima e cole no HTML da sua página de vendas, antes do{' '}
                  <code className="text-zinc-300 bg-zinc-800 px-1 rounded">&lt;/body&gt;</code>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex-shrink-0">
                  2
                </span>
                <span>
                  Para plataformas como Hotmart Pages, Elementor, WordPress — cole no campo de &quot;Scripts do Footer&quot;.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex-shrink-0">
                  3
                </span>
                <span>
                  Os eventos começam a ser coletados imediatamente. Visualize-os na{' '}
                  <Link href="/intelligence/journey" className="text-emerald-400 hover:underline">
                    Jornada do Lead
                  </Link>.
                </span>
              </li>
            </ol>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: BarChart3,
                title: 'Eventos capturados',
                items: ['Page views + referrer + UTM', 'Scroll depth & tempo na página', 'Captura de formulários (email)', 'Checkout & compra'],
              },
              {
                icon: Zap,
                title: 'Performance',
                items: ['Script <5KB', 'Carregamento assíncrono', 'Batch de eventos (1s)', 'Beacon API (sem bloquear)'],
              },
              {
                icon: Shield,
                title: 'Segurança',
                items: ['Email hasheado client-side', 'CORS habilitado', 'Rate limit: 100 evt/min', 'Sem cookies de terceiros'],
              },
            ].map((card) => (
              <div key={card.title} className="card-premium p-5">
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="h-1 w-1 rounded-full bg-emerald-500/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Custom events */}
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-emerald-500" />
              Eventos Customizados (Opcional)
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              Após instalar o script, use a API JavaScript para disparar eventos customizados:
            </p>
            <pre className="bg-zinc-950 border border-white/[0.06] rounded-xl p-4 text-xs text-zinc-300 font-mono overflow-x-auto">
{`// Checkout iniciado
CFTrack.checkout({ productId: "prod_123", amount: 297 });

// Compra concluída
CFTrack.purchase({ productId: "prod_123", amount: 297 });

// Evento genérico
CFTrack.event("webinar_signup", { webinarId: "w01" });`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
