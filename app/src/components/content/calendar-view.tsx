'use client';

/**
 * CalendarView — Grid do calendario editorial (semanal / mensal)
 * Drag-and-drop HTML5 nativo (PA-03: ZERO biblioteca de D&D)
 *
 * @component
 * @story S33-CAL-03
 */

import { useMemo, useCallback, type DragEvent } from 'react';
import type { CalendarItem, CalendarItemStatus } from '@/types/content';
import { FileText, Image, Layers, Film } from 'lucide-react';

// === Format Icons ===

const FORMAT_ICONS: Record<string, typeof FileText> = {
  post: FileText,
  story: Image,
  carousel: Layers,
  reel: Film,
};

// === Status Colors ===

const STATUS_COLORS: Record<CalendarItemStatus, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border-l-4 border-l-zinc-600',
  pending_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30 border-l-4 border-l-amber-500',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border-l-4 border-l-green-500',
  scheduled: 'bg-purple-500/20 text-purple-400 border-purple-500/30 border-l-4 border-l-purple-500',
  published: 'bg-blue-500/20 text-blue-400 border-blue-500/30 border-l-4 border-l-blue-500',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30 border-l-4 border-l-red-500',
};

const STATUS_LABELS: Record<CalendarItemStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em Revisao',
  approved: 'Aprovado',
  scheduled: 'Agendado',
  published: 'Publicado',
  rejected: 'Rejeitado',
};

// === Helpers ===

function getWeekDates(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function getMonthDates(referenceDate: Date): Date[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday-based
  const dates: Date[] = [];

  for (let i = -startPad; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)); i++) {
    const date = new Date(year, month, i + 1);
    dates.push(date);
  }
  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

// === Props ===

interface CalendarViewProps {
  items: CalendarItem[];
  view: 'week' | 'month';
  referenceDate: Date;
  onReorder: (itemId: string, targetDate: Date, newOrder: number) => void;
  onItemClick: (item: CalendarItem) => void;
}

export function CalendarView({
  items,
  view,
  referenceDate,
  onReorder,
  onItemClick,
}: CalendarViewProps) {
  const dates = useMemo(
    () => (view === 'week' ? getWeekDates(referenceDate) : getMonthDates(referenceDate)),
    [view, referenceDate]
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const ms = item.scheduledDate?.toMillis?.() ?? item.scheduledDate?.seconds * 1000;
      if (!ms) continue;
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    // Sort by order within each day
    for (const [, dayItems] of map) {
      dayItems.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [items]);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, item: CalendarItem) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetDate: Date) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
    const existing = itemsByDate.get(key) ?? [];
    onReorder(itemId, targetDate, existing.length);
  }, [itemsByDate, onReorder]);

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isCurrentMonth = (date: Date) => date.getMonth() === referenceDate.getMonth();

  return (
    <div className="w-full">
      {/* Day header */}
      <div className={`grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-px bg-zinc-800/50 border border-zinc-700/50 rounded-t-lg`}>
        {DAY_NAMES.map((name) => (
          <div key={name} className="px-2 py-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-900/60">
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-7 gap-px bg-zinc-800/30 border-x border-b border-zinc-700/50 rounded-b-lg`}>
        {dates.map((date, idx) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const dayItems = itemsByDate.get(key) ?? [];

          return (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
              className={`
                ${view === 'week' ? 'min-h-[180px]' : 'min-h-[100px]'}
                p-1.5 bg-zinc-900/40 transition-colors
                hover:bg-zinc-800/50
                ${isToday(date) ? 'ring-1 ring-emerald-500/40 bg-emerald-500/5' : ''}
                ${!isCurrentMonth(date) && view === 'month' ? 'opacity-40' : ''}
              `}
            >
              {/* Date label */}
              <div className={`text-xs mb-1 px-1 ${isToday(date) ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                {date.getDate()}
              </div>

              {/* Items */}
              <div className="space-y-1">
                {dayItems.map((item) => {
                  const FormatIcon = FORMAT_ICONS[item.format] ?? FileText;
                  const statusClass = STATUS_COLORS[item.status] ?? STATUS_COLORS.draft;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => onItemClick(item)}
                      className={`
                        group cursor-grab active:cursor-grabbing
                        rounded-md border px-2 py-1.5 text-xs
                        hover:ring-1 hover:ring-white/20 transition-all
                        ${statusClass}
                      `}
                    >
                      <div className="flex items-center gap-1.5">
                        <FormatIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-medium">{item.title}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] opacity-70">
                        {STATUS_LABELS[item.status]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
