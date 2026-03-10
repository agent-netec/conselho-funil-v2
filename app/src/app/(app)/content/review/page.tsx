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
import { Inbox } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-6 max-w-[1440px] mx-auto">
          <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">Aprovacoes</h1>
          <p className="text-sm text-[#6B5D4A] font-mono mt-2">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'item aguardando' : 'items aguardando'} revisao`
              : 'Nenhum item pendente'}
          </p>
        </div>
      </header>

      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#6B5D4A] font-mono text-sm">
            Carregando...
          </div>
        ) : !selectedBrand?.id ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#6B5D4A]">
            <p className="text-sm font-mono">Selecione uma marca para ver aprovacoes pendentes</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#6B5D4A] border border-white/[0.06] rounded-lg">
            <Inbox className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-mono">Tudo limpo!</p>
            <p className="text-xs mt-1 opacity-70 font-mono">Nao ha conteudo aguardando revisao</p>
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
      </main>
    </div>
  );
}
