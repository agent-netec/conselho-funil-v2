"use client";

import { useEffect, useMemo, useState } from 'react';
import { useBrandStore } from '@/lib/stores/brand-store';
import { ResearchForm } from '@/components/intelligence/research/research-form';
import { DossierViewer } from '@/components/intelligence/research/dossier-viewer';
import type { MarketDossier, ResearchDepth } from '@/types/research';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { Clock, RefreshCw, ShieldCheck, Save } from 'lucide-react';

export default function ResearchPage() {
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketDossier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [savingInsights, setSavingInsights] = useState(false);

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

  // K-4.1: Auto-load dossiers when brandId changes
  useEffect(() => {
    loadList();
  }, [brandId]);

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

  // K-4.3: Save insights to brand
  const handleSaveInsights = async () => {
    if (!selected || !brandId) return;
    setSavingInsights(true);
    try {
      await updateDoc(doc(db, 'brands', brandId), {
        researchInsights: {
          topic: selected.topic,
          trends: selected.sections?.trends || [],
          opportunities: selected.sections?.opportunities || [],
          recommendations: selected.sections?.recommendations || [],
          savedAt: new Date().toISOString(),
          dossierId: selected.id,
        },
      });
      toast.success('Insights salvos na marca com sucesso!');
    } catch (err) {
      console.error('[Research] Save insights error:', err);
      toast.error('Erro ao salvar insights na marca.');
    } finally {
      setSavingInsights(false);
    }
  };

  // Format Firestore timestamp for display
  const formatDate = (ts: any) => {
    if (!ts) return '';
    const ms = ts?.toMillis?.() ?? ts?.seconds * 1000;
    if (!ms) return '';
    return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const displayedItems = showAll ? items : items.slice(0, 5);

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
        {/* K-4.2: Previous Dossiers section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Dossiês Anteriores
            </h2>
            <button
              onClick={loadList}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Recarregar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/20 text-center">
              <p className="text-sm text-zinc-500">Nenhum dossiê encontrado para esta marca.</p>
            </div>
          ) : (
            <>
              {displayedItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    selectedId === item.id
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40'
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="text-sm text-zinc-100">{item.topic}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-medium uppercase ${
                      item.status === 'completed' ? 'text-emerald-400' : item.status === 'failed' ? 'text-red-400' : 'text-zinc-500'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-zinc-600">{formatDate(item.generatedAt)}</span>
                  </div>
                </button>
              ))}
              {items.length > 5 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 py-2 transition-colors"
                >
                  Ver todos ({items.length} dossiês)
                </button>
              )}
            </>
          )}

          {/* K-4.4: Persistence note */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
            <span className="text-[10px] text-zinc-600">Dossiês são salvos permanentemente na sua marca.</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <DossierViewer dossier={selected} />
              {/* K-4.3: Save insights button */}
              <button
                onClick={handleSaveInsights}
                disabled={savingInsights}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {savingInsights ? 'Salvando...' : 'Salvar Insights na Marca'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
              <p className="text-sm">Selecione um dossiê para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
