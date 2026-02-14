'use client';

import { useState, useEffect } from 'react';
import { Brain, ArrowRight, Search, Zap, Target, TrendingUp, Lightbulb, Globe, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { KeywordsMiner } from "@/components/intelligence/discovery/keywords-miner";
import { SpyAgent } from "@/components/intelligence/discovery/spy-agent";
import { AssetsPanel } from "@/components/intelligence/discovery/assets-panel";
import { getUserBrands } from "@/lib/firebase/brands";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useIntelligenceAssets } from "@/lib/hooks/use-intelligence-assets";

export default function DiscoveryPage() {
  const { user } = useAuthStore();
  const [brandId, setBrandId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const { assets, loading: loadingAssets, error: assetsError, refetch: refetchAssets } = useIntelligenceAssets(brandId);

  useEffect(() => {
    async function loadBrand() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const brands = await getUserBrands(user.uid);
        if (brands.length > 0) {
          setBrandId(brands[0].id);
        }
      } catch (error) {
        console.error("Error loading brands:", error);
        toast.error("Erro ao carregar contexto da marca");
      } finally {
        setLoading(false);
      }
    }
    loadBrand();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 animate-pulse">Sincronizando com o Hub de Inteligência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Discovery Hub
        </h1>
        <p className="text-muted-foreground">
          O novo centro de mineração de insights e inteligência competitiva.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <KeywordsMiner brandId={brandId} />
        <SpyAgent brandId={brandId} />
      </div>

      {/* ── Guia de uso ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Miner — Como usar */}
        <Card className="bg-zinc-900/30 border-white/[0.05]">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
              <Search className="w-5 h-5 text-blue-500" />
              Como usar o Keywords Miner
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">1</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Digite o termo principal do nicho</strong> — ex: &quot;tráfego pago&quot;,
                  &quot;emagrecimento&quot;, &quot;investimentos&quot;
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">2</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Clique em &quot;Minerar&quot;</strong> — o sistema busca as sugestões reais do Google
                  Autocomplete em tempo real
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">3</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Analise os resultados</strong> — cada termo revela dores, objeções e
                  intenções de compra do público. Use para criar headlines, hooks e copys.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.05] space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Casos de uso</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <Target className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Descobrir dores:</strong> Minere &quot;nome do nicho&quot; e veja termos como
                    &quot;funciona?&quot;, &quot;vale a pena?&quot;, &quot;como começar&quot; — cada um é uma objeção real.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Criar headlines:</strong> Cada keyword é uma ideia de headline ou hook de vídeo.
                    &quot;Tráfego pago quanto investir&quot; → &quot;Comece com apenas R$10/dia&quot;.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Espionar concorrentes:</strong> Minere o nome de um concorrente para ver o que
                    as pessoas buscam sobre ele — reclamações, comparações e alternativas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spy Agent — Como usar */}
        <Card className="bg-zinc-900/30 border-white/[0.05]">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
              <Zap className="w-5 h-5 text-amber-500" />
              Como usar o Spy Agent
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">1</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Cole a URL de qualquer página de vendas</strong> — pode ser de um concorrente
                  ou do próprio cliente
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">2</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Clique em &quot;Scan&quot;</strong> — a IA (Gemini) faz uma autópsia completa analisando
                  hook, story, oferta, fricção e confiança
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">3</div>
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Receba o score (0-10)</strong> e recomendações priorizadas de melhorias.
                  O resultado fica salvo nos Assets de Inteligência abaixo.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.05] space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Casos de uso</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <Globe className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Benchmarking:</strong> Analise 3-5 concorrentes do mesmo nicho. Compare scores e
                    descubra o que os melhores estão fazendo que seu cliente não está.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Otimizar funil existente:</strong> Cole a URL do funil do seu cliente.
                    A IA identifica pontos fracos (hook fraco, falta de prova social) com ações concretas.
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-950/50">
                  <ArrowRight className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-400">Relatório para cliente:</strong> Use a autópsia como base para justificar mudanças.
                    &quot;O funil atual tem score 4.5/10. Aqui estão as 3 mudanças prioritárias.&quot;
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssetsPanel brandId={brandId} assets={assets} isLoading={loadingAssets} error={assetsError} onRefetch={refetchAssets} />

      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40 transition-colors">
        <CardContent className="py-10 text-center space-y-4">
          <Brain className="w-12 h-12 text-purple-500 mx-auto" />
          <h2 className="text-xl font-semibold">Predictive Engine</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Analise textos, preveja a probabilidade de conversão e gere anúncios otimizados com IA.
          </p>
          <Link href="/intelligence/predict">
            <Button className="gap-2 mt-2">
              <Brain className="h-4 w-4" />
              Abrir Predictive Engine
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

