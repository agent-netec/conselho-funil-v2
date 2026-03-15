"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OfferLabWizard } from '@/components/intelligence/offer-lab/offer-lab-wizard';
import { OfferList } from '@/components/intelligence/offer-lab/offer-list';
import { OfferCompare } from '@/components/intelligence/offer-lab/offer-compare';
import { Sparkles, Beaker, BrainCircuit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBrandStore } from '@/lib/stores/brand-store';
import type { OfferDocument } from '@/types/offer';

export default function OfferLabPage() {
  const { selectedBrand } = useBrandStore();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [compareOffers, setCompareOffers] = useState<[OfferDocument, OfferDocument] | null>(null);
  const [listKey, setListKey] = useState(0);

  if (compareOffers) {
    return (
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <OfferCompare
          offerA={compareOffers[0]}
          offerB={compareOffers[1]}
          onBack={() => setCompareOffers(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20 gap-1 px-2">
              <Beaker className="w-3 h-3" />
              Intelligence Wing
            </Badge>
            <span className="text-[#A89B84] text-sm">/ Offer Lab</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            Offer Lab
            <Sparkles className="w-8 h-8 text-[#E6B447] animate-pulse" />
          </h1>
          <p className="text-[#A89B84] max-w-2xl">
            Engenharia forense de ofertas. Transforme produtos comuns em propostas impossíveis de serem ignoradas usando os frameworks do Brain Council.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
          <div className="p-3 bg-[#E6B447]/10 rounded-xl">
            <BrainCircuit className="w-6 h-6 text-[#E6B447]" />
          </div>
          <div>
            <div className="text-xs text-[#6B5F4D] uppercase font-bold tracking-wider">Especialista Ativo</div>
            <div className="text-sm font-bold text-white">Russell Brunson</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mt-8">
        <OfferLabWizard brandId={selectedBrand?.id || ''} campaignId={campaignId} onSaved={() => setListKey(k => k + 1)} />
      </main>

      {/* F4-1: Offer History + F4-2: Compare */}
      {selectedBrand?.id && (
        <section className="mt-12">
          <OfferList
            key={listKey}
            brandId={selectedBrand.id}
            onCompare={(a, b) => setCompareOffers([a, b])}
          />
        </section>
      )}

      {/* Footer Info */}
      <footer className="mt-20 pt-8 border-t border-white/[0.06] text-center">
        <p className="text-xs text-zinc-600">
          Framework de Oferta v1.0 • Baseado em "Expert Secrets" & "$100M Offers"
        </p>
      </footer>
    </div>
  );
}
