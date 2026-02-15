"use client";

import { useMemo, useState } from 'react';
import { useBrandStore } from '@/lib/stores/brand-store';
import { ResearchForm } from '@/components/intelligence/research/research-form';
import { DossierViewer } from '@/components/intelligence/research/dossier-viewer';
import type { MarketDossier, ResearchDepth } from '@/types/research';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

export default function ResearchPage() {
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketDossier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const loadList = async () => {
    if (!brandId) return;
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/intelligence/research?brandId=${brandId}`, { headers });
    if (!res.ok) return;
    const payload = await res.json();
    const list = (payload?.data ?? payload) as MarketDossier[];
    setItems(Array.isArray(list) ? list : []);
  };

  const handleSubmit = async (payload: {
    topic: string;
    marketSegment?: string;
    competitors?: string[];
    depth: ResearchDepth;
  }) => {
    if (!brandId) {
      setError('Selecione uma brand antes de gerar o dossiê.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/research', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, ...payload }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        setError(`Erro ${res.status}: ${body || res.statusText}`);
        return;
      }
      const result = await res.json();
      const dossier = result?.data ?? result;
      if (dossier?.status === 'failed') {
        const failMsg = dossier?.sections?.marketOverview || 'Dossiê retornou com status failed.';
        setError(typeof failMsg === 'string' ? failMsg : 'Falha ao gerar dossiê.');
      }
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao gerar dossiê.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-white">Deep Research</h1>
      <ResearchForm onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div className="border border-red-800 bg-red-900/20 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <button className="text-xs text-zinc-400 underline" onClick={loadList}>
            Recarregar dossiês
          </button>
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full text-left p-3 border border-zinc-800 rounded bg-zinc-900/20 hover:bg-zinc-900/40"
              onClick={() => setSelectedId(item.id)}
            >
              <div className="text-sm text-zinc-100">{item.topic}</div>
              <div className="text-xs text-zinc-500">{item.status}</div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">{selected ? <DossierViewer dossier={selected} /> : null}</div>
      </div>
    </div>
  );
}
