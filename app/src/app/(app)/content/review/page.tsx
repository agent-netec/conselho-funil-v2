'use client';

/**
 * Content Review Dashboard — Lista items pending_review para aprovacao
 *
 * @page /content/review
 * @story S33-APR-03
 */

import { useState, useEffect, useCallback } from 'react';
import { ReviewCard } from '@/components/content/review-card';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { ClipboardCheck, Inbox } from 'lucide-react';
import type { CalendarItem } from '@/types/content';

export default function ContentReviewPage() {
  const { selectedBrand } = useBrandStore();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch items em pending_review
  const fetchItems = useCallback(async () => {
    if (!selectedBrand?.id) return;
    setLoading(true);

    try {
      // Buscar amplo range para pegar todos pending_review
      const now = Date.now();
      const past30d = now - 30 * 24 * 60 * 60 * 1000;
      const future90d = now + 90 * 24 * 60 * 60 * 1000;

      const params = new URLSearchParams({
        brandId: selectedBrand.id,
        start: past30d.toString(),
        end: future90d.toString(),
      });

      const headers = await getAuthHeaders();
      const res = await fetch(`/api/content/calendar?${params}`, { headers });
      if (res.ok) {
        const json = await res.json();
        const allItems: CalendarItem[] = json.data?.items ?? [];
        // Filtrar apenas pending_review
        setItems(allItems.filter((item) => item.status === 'pending_review'));
      }
    } catch (err) {
      console.error('[Review] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Approve handler
  const handleApprove = useCallback(async (itemId: string) => {
    if (!selectedBrand?.id) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/content/calendar/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          itemId,
          action: 'approve',
        }),
      });

      if (res.ok) {
        // Remove da lista local (optimistic)
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      console.error('[Review] Approve error:', err);
    }
  }, [selectedBrand?.id]);

  // Reject handler
  const handleReject = useCallback(async (itemId: string, comment: string) => {
    if (!selectedBrand?.id) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/content/calendar/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          itemId,
          action: 'reject',
          comment,
        }),
      });

      if (res.ok) {
        // Remove da lista local (optimistic)
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      console.error('[Review] Reject error:', err);
    }
  }, [selectedBrand?.id]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Aprovacoes</h1>
          <p className="text-sm text-zinc-400">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'item aguardando' : 'items aguardando'} revisao`
              : 'Nenhum item pendente'}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Carregando...
        </div>
      ) : !selectedBrand?.id ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <ClipboardCheck className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Selecione uma marca para ver aprovacoes pendentes</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <Inbox className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Tudo limpo!</p>
          <p className="text-xs mt-1 opacity-70">Nao ha conteudo aguardando revisao</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
