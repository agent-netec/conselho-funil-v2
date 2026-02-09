'use client';

/**
 * Content Calendar Page — Calendario Editorial
 * View semanal (default) e mensal com drag-and-drop HTML5 nativo
 *
 * @page /content/calendar
 * @story S33-CAL-03
 */

import { useState, useEffect, useCallback } from 'react';
import { CalendarView } from '@/components/content/calendar-view';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { Calendar, ChevronLeft, ChevronRight, Plus, Columns, Grid } from 'lucide-react';
import type { CalendarItem } from '@/types/content';

type ViewMode = 'week' | 'month';

export default function ContentCalendarPage() {
  const { selectedBrand } = useBrandStore();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [view, setView] = useState<ViewMode>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // === Fetch items ===
  const fetchItems = useCallback(async () => {
    if (!selectedBrand?.id) return;
    setLoading(true);

    try {
      const now = new Date(referenceDate);
      let start: Date;
      let end: Date;

      if (view === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      }

      const params = new URLSearchParams({
        brandId: selectedBrand.id,
        start: start.getTime().toString(),
        end: end.getTime().toString(),
      });

      const headers = await getAuthHeaders();
      const res = await fetch(`/api/content/calendar?${params}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data?.items ?? []);
      }
    } catch (err) {
      console.error('[Calendar] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand?.id, referenceDate, view]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // === Navigation ===
  const navigate = (direction: -1 | 1) => {
    const d = new Date(referenceDate);
    if (view === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    setReferenceDate(d);
  };

  const goToday = () => setReferenceDate(new Date());

  // === Reorder (optimistic update) ===
  const handleReorder = useCallback(async (itemId: string, targetDate: Date, newOrder: number) => {
    if (!selectedBrand?.id) return;

    // Optimistic update
    setItems((prev) => prev.map((item) =>
      item.id === itemId
        ? { ...item, order: newOrder, scheduledDate: { seconds: Math.floor(targetDate.getTime() / 1000), toMillis: () => targetDate.getTime() } as CalendarItem['scheduledDate'] }
        : item
    ));

    try {
      const authHeaders = await getAuthHeaders();
      await fetch('/api/content/calendar/reorder', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          updates: [{
            itemId,
            order: newOrder,
            scheduledDate: targetDate.getTime(),
          }],
        }),
      });
    } catch {
      // Revert on error
      fetchItems();
    }
  }, [selectedBrand?.id, fetchItems]);

  // === Item click ===
  const handleItemClick = useCallback((item: CalendarItem) => {
    console.log('[Calendar] Item clicked:', item.id, item.title);
  }, []);

  // === Create item ===
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBrand?.id) return;

    const form = new FormData(e.currentTarget);
    const title = form.get('title') as string;
    const format = form.get('format') as string;
    const platform = form.get('platform') as string;
    const dateStr = form.get('scheduledDate') as string;

    if (!title || !format || !platform || !dateStr) return;

    try {
      const createHeaders = await getAuthHeaders();
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: createHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          title,
          format,
          platform,
          scheduledDate: new Date(dateStr).getTime(),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        fetchItems();
      }
    } catch (err) {
      console.error('[Calendar] Create error:', err);
    }
  };

  // === Date label ===
  const dateLabel = view === 'week'
    ? (() => {
      const d = new Date(referenceDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.getFullYear(), d.getMonth(), diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
    })()
    : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(referenceDate);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Calendario Editorial</h1>
            <p className="text-sm text-zinc-400">Gerencie e agende seu conteudo</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Conteudo
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-700/50 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1 rounded-md text-xs font-medium text-zinc-300 hover:bg-zinc-700/50 transition-colors">
            Hoje
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-white capitalize">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-800/80 rounded-md p-0.5">
          <button
            onClick={() => setView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'week' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Columns className="h-3.5 w-3.5" />
            Semanal
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${view === 'month' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Grid className="h-3.5 w-3.5" />
            Mensal
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Carregando...
        </div>
      ) : !selectedBrand?.id ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <Calendar className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Selecione uma marca para ver o calendario</p>
        </div>
      ) : (
        <CalendarView
          items={items}
          view={view}
          referenceDate={referenceDate}
          onReorder={handleReorder}
          onItemClick={handleItemClick}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Novo Conteudo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Titulo</label>
                <input name="title" required className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Formato</label>
                  <select name="format" required className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                    <option value="post">Post</option>
                    <option value="story">Story</option>
                    <option value="carousel">Carousel</option>
                    <option value="reel">Reel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Plataforma</label>
                  <select name="platform" required className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X (Twitter)</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Data Agendada</label>
                <input name="scheduledDate" type="date" required className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
