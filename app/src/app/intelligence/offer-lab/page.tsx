"use client";

import React from 'react';
import { OfferLabWizard } from '@/components/intelligence/offer-lab/offer-lab-wizard';
import { Sparkles, Beaker, BrainCircuit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBrandStore } from '@/lib/stores/brand-store';

export default function OfferLabPage() {
  const { selectedBrand } = useBrandStore();
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1 px-2">
              <Beaker className="w-3 h-3" />
              Intelligence Wing
            </Badge>
            <span className="text-zinc-500 text-sm">/ Offer Lab</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            Offer Lab
            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Engenharia forense de ofertas. Transforme produtos comuns em propostas impossíveis de serem ignoradas usando os frameworks do Brain Council.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Conselheiro Ativo</div>
            <div className="text-sm font-bold text-white">Russell Brunson</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mt-8">
        <OfferLabWizard brandId={selectedBrand?.id || ''} />
      </main>

      {/* Footer Info */}
      <footer className="mt-20 pt-8 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-600">
          Framework de Oferta v1.0 • Baseado em "Expert Secrets" & "$100M Offers"
        </p>
      </footer>
    </div>
  );
}
