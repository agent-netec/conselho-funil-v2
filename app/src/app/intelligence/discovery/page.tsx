'use client';

import { useState, useEffect } from 'react';
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KeywordsMiner } from "@/components/intelligence/discovery/keywords-miner";
import { SpyAgent } from "@/components/intelligence/discovery/spy-agent";
import { getUserBrands } from "@/lib/firebase/brands";
import { toast } from "sonner";

export default function DiscoveryPage() {
  const [brandId, setBrandId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrand() {
      try {
        // No MVP, pegamos a primeira marca do usuário
        // Em produção, isso viria de um seletor global ou contexto
        const brands = await getUserBrands("user_123"); // Mock user ID
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
  }, []);

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

      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="py-10 text-center space-y-4">
          <Brain className="w-12 h-12 text-purple-500 mx-auto opacity-50" />
          <h2 className="text-xl font-semibold">Inteligência Preditiva</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Em breve: O Athos está calibrando os modelos de IA para antecipar movimentos do mercado e tendências de busca.
          </p>
          <div className="flex justify-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-purple-500/30">
              Sprint 22
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

