"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Copy,
  Star,
  Archive,
  TrendingUp,
  Loader2,
  GitCompareArrows,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { OfferDocument } from '@/types/offer';

interface OfferListProps {
  brandId: string;
  onEditOffer?: (offer: OfferDocument) => void;
  onCompare?: (offerA: OfferDocument, offerB: OfferDocument) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  draft: { label: 'Rascunho', color: 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30' },
  archived: { label: 'Arquivada', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OfferList({ brandId, onEditOffer, onCompare }: OfferListProps) {
  const [offers, setOffers] = useState<OfferDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const fetchOffers = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/intelligence/offer/list?brandId=${brandId}`, { headers });
      if (!res.ok) throw new Error('Falha ao carregar ofertas');
      const data = await res.json();
      setOffers(data.data?.offers ?? []);
    } catch {
      toast.error('Erro ao carregar histórico de ofertas.');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleAction = async (offerId: string, action: 'activate' | 'archive' | 'duplicate') => {
    setActing(offerId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/offer/list', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ brandId, offerId, action }),
      });
      if (!res.ok) throw new Error('Falha na ação');
      const actionLabels = { activate: 'ativada', archive: 'arquivada', duplicate: 'duplicada' };
      toast.success(`Oferta ${actionLabels[action]} com sucesso!`);
      await fetchOffers();
    } catch {
      toast.error('Erro ao executar ação.');
    } finally {
      setActing(null);
    }
  };

  const toggleCompare = (offerId: string) => {
    setCompareSelection(prev => {
      if (prev.includes(offerId)) return prev.filter(id => id !== offerId);
      if (prev.length >= 2) return [prev[1], offerId];
      return [...prev, offerId];
    });
  };

  const handleCompare = () => {
    if (compareSelection.length !== 2 || !onCompare) return;
    const a = offers.find(o => o.id === compareSelection[0]);
    const b = offers.find(o => o.id === compareSelection[1]);
    if (a && b) onCompare(a, b);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando histórico...
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 text-sm">
        Nenhuma oferta salva ainda. Crie sua primeira oferta acima.
      </div>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-300">
            <History className="w-4 h-4" />
            Histórico de Ofertas ({offers.length})
          </CardTitle>
          {onCompare && compareSelection.length === 2 && (
            <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={handleCompare}>
              <GitCompareArrows className="w-3 h-3" />
              Comparar Selecionadas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {offers.map((offer) => {
          const sc = statusConfig[offer.status] || statusConfig.draft;
          const isSelected = compareSelection.includes(offer.id);
          return (
            <div
              key={offer.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Compare checkbox */}
                {onCompare && (
                  <button
                    onClick={() => toggleCompare(offer.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                    title="Selecionar para comparação"
                  >
                    {isSelected && <span className="text-[10px] font-bold">{compareSelection.indexOf(offer.id) + 1}</span>}
                  </button>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {offer.name || offer.components?.coreProduct?.promise?.substring(0, 40) || 'Oferta sem nome'}
                    </span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${sc.color}`}>
                      {sc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Score: {offer.scoring?.total ?? '—'}
                      {offer.aiEvaluation?.overallQuality ? ` / AI: ${offer.aiEvaluation.overallQuality}` : ''}
                    </span>
                    <span className="text-[10px] text-zinc-600">{formatDate(offer.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {offer.status !== 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-green-400"
                    title="Ativar como principal"
                    disabled={acting === offer.id}
                    onClick={() => handleAction(offer.id, 'activate')}
                  >
                    {acting === offer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                  </Button>
                )}
                {offer.status !== 'archived' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-amber-400"
                    title="Arquivar"
                    disabled={acting === offer.id}
                    onClick={() => handleAction(offer.id, 'archive')}
                  >
                    <Archive className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-zinc-500 hover:text-blue-400"
                  title="Duplicar e editar"
                  disabled={acting === offer.id}
                  onClick={() => handleAction(offer.id, 'duplicate')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
