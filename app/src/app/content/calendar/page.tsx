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
import { Calendar, ChevronLeft, ChevronRight, Plus, Columns, Grid, X, Clock, Eye, CheckCircle, XCircle, Send, Shield, Sparkles, Loader2, BookmarkPlus, Repeat, Tag, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import type { CalendarItem, CalendarItemStatus, ContentTemplate } from '@/types/content';

type ViewMode = 'week' | 'month';

export default function ContentCalendarPage() {
  const { selectedBrand } = useBrandStore();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [view, setView] = useState<ViewMode>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [approving, setApproving] = useState(false);
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  // C1: Live preview state
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState('instagram');
  const [previewDate, setPreviewDate] = useState('');
  const [previewTime, setPreviewTime] = useState('');

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
    setSelectedItem(item);
  }, []);

  // === Approval actions ===
  const handleApproval = async (action: 'submit_review' | 'approve' | 'reject' | 'schedule' | 're_edit') => {
    if (!selectedItem || !selectedBrand?.id) return;
    setApproving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/content/calendar/approve', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          itemId: selectedItem.id,
          action,
        }),
      });
      if (res.ok) {
        const actionLabels: Record<string, string> = {
          submit_review: 'Enviado para revisão',
          approve: 'Aprovado',
          reject: 'Rejeitado',
          schedule: 'Agendado',
          re_edit: 'Voltou para rascunho',
        };
        toast.success(actionLabels[action] || 'Ação concluída');
        setSelectedItem(null);
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao processar ação');
      }
    } catch {
      toast.error('Falha na comunicação com o servidor');
    } finally {
      setApproving(false);
    }
  };

  // === Status-based approval actions ===
  const getAvailableActions = (status: CalendarItemStatus) => {
    switch (status) {
      case 'draft': return [{ action: 'submit_review' as const, label: 'Enviar para Revisão', icon: Send, color: 'bg-amber-600 hover:bg-amber-500' }];
      case 'pending_review': return [
        { action: 'approve' as const, label: 'Aprovar', icon: CheckCircle, color: 'bg-emerald-600 hover:bg-emerald-500' },
        { action: 'reject' as const, label: 'Rejeitar', icon: XCircle, color: 'bg-red-600 hover:bg-red-500' },
      ];
      case 'approved': return [{ action: 'schedule' as const, label: 'Agendar Publicação', icon: Clock, color: 'bg-purple-600 hover:bg-purple-500' }];
      case 'rejected': return [{ action: 're_edit' as const, label: 'Voltar para Rascunho', icon: ArrowLeft, color: 'bg-amber-600 hover:bg-amber-500' }];
      default: return [];
    }
  };

  // === Create item ===
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBrand?.id) return;

    const form = new FormData(e.currentTarget);
    const title = form.get('title') as string;
    const content = form.get('content') as string;
    const format = form.get('format') as string;
    const platform = form.get('platform') as string;
    const dateStr = form.get('scheduledDate') as string;
    const timeStr = form.get('scheduledTime') as string;

    if (!title || !format || !platform || !dateStr) return;

    const scheduledDate = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
    }

    try {
      const createHeaders = await getAuthHeaders();
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: createHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          title,
          content,
          format,
          platform,
          scheduledDate: scheduledDate.getTime(),
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

  // === Generate week ===
  const handleGenerateWeek = async () => {
    if (!selectedBrand?.id) return;
    setGeneratingWeek(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/content/calendar/generate-week', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          platform: 'instagram',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.data?.count || 0} posts gerados para a semana!`);
        fetchItems();
      } else {
        toast.error('Erro ao gerar semana');
      }
    } catch {
      toast.error('Falha ao gerar conteúdo semanal');
    } finally {
      setGeneratingWeek(false);
    }
  };

  // === Save as template ===
  const handleSaveAsTemplate = async (item: CalendarItem) => {
    if (!selectedBrand?.id) return;
    setSavingTemplate(true);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/content/calendar/templates', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          title: item.title,
          format: item.format,
          platform: item.platform,
          content: item.content,
          pillar: item.metadata?.promptParams?.pillar || '',
        }),
      });
      if (res.ok) {
        toast.success('Salvo como template!');
      } else {
        toast.error('Erro ao salvar template');
      }
    } catch {
      toast.error('Falha ao salvar template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // === Fetch templates ===
  const fetchTemplates = useCallback(async () => {
    if (!selectedBrand?.id) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/content/calendar/templates?brandId=${selectedBrand.id}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data?.templates || []);
      }
    } catch (err) {
      console.error('[Calendar] Templates fetch error:', err);
    }
  }, [selectedBrand?.id]);

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateWeek}
            disabled={generatingWeek || !selectedBrand?.id}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generatingWeek ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar Semana
          </button>
          <button
            onClick={() => { setShowTemplates(!showTemplates); if (!showTemplates) fetchTemplates(); }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <BookmarkPlus className="h-4 w-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Conteudo
          </button>
        </div>
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

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-violet-400" />
              Templates Salvos
            </h3>
            <button onClick={() => setShowTemplates(false)} className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          {templates.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhum template salvo. Aprove um post e use &ldquo;Salvar como Template&rdquo;.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white truncate">{tpl.title}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 capitalize">{tpl.format}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 capitalize">{tpl.platform}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{tpl.content}</p>
                  {tpl.pillar && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] text-violet-400">{tpl.pillar}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Carregando...
        </div>
      ) : !selectedBrand?.id ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <Calendar className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm mb-1">Selecione uma marca para ver o calendario</p>
          <p className="text-xs text-zinc-600">Crie conteudo para redes sociais com datas e horarios otimizados pela IA.</p>
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Novo Conteudo</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Titulo</label>
                <input name="title" required value={previewTitle} onChange={(e) => setPreviewTitle(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Conteudo / Descrição</label>
                <textarea name="content" rows={4} placeholder="Texto do post, legenda, roteiro..." value={previewContent} onChange={(e) => setPreviewContent(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
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
                  <select name="platform" required value={previewPlatform} onChange={(e) => setPreviewPlatform(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm">
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X (Twitter)</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Data Agendada</label>
                  <input name="scheduledDate" type="date" required value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-zinc-400 mb-1">
                    <Clock className="h-3.5 w-3.5" /> Horário
                  </label>
                  <input name="scheduledTime" type="time" value={previewTime} onChange={(e) => setPreviewTime(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>

              {/* C1: Live Preview */}
              {(previewTitle || previewContent) && (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Preview</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{selectedBrand?.name || 'Marca'}</span>
                      <span className="text-[10px] text-zinc-500 block capitalize">{previewPlatform}</span>
                    </div>
                  </div>
                  {previewTitle && <p className="text-sm font-bold text-white mb-1">{previewTitle}</p>}
                  {previewContent && <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{previewContent}</p>}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      previewPlatform === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                      previewPlatform === 'linkedin' ? 'bg-blue-500/20 text-blue-400' :
                      previewPlatform === 'x' ? 'bg-zinc-500/20 text-zinc-300' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {previewPlatform === 'x' ? 'X (Twitter)' : previewPlatform.charAt(0).toUpperCase() + previewPlatform.slice(1)}
                    </span>
                    {previewDate && (
                      <span className="text-[10px] text-zinc-500">
                        {new Date(previewDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {previewTime && ` ${previewTime}`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setPreviewTitle(''); setPreviewContent(''); setPreviewDate(''); setPreviewTime(''); }} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
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

      {/* Item Detail / Approval Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Item Details */}
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500 text-xs block mb-1">Formato</span>
                  <span className="text-white capitalize">{selectedItem.format}</span>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500 text-xs block mb-1">Plataforma</span>
                  <span className="text-white capitalize">{selectedItem.platform}</span>
                </div>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <span className="text-zinc-500 text-xs block mb-1">Status</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  selectedItem.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedItem.status === 'published' ? 'bg-blue-500/20 text-blue-400' :
                  selectedItem.status === 'pending_review' ? 'bg-amber-500/20 text-amber-400' :
                  selectedItem.status === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
                  selectedItem.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {selectedItem.status === 'draft' ? 'Rascunho' :
                   selectedItem.status === 'pending_review' ? 'Em Revisão' :
                   selectedItem.status === 'approved' ? 'Aprovado' :
                   selectedItem.status === 'scheduled' ? 'Agendado' :
                   selectedItem.status === 'published' ? 'Publicado' :
                   selectedItem.status === 'rejected' ? 'Rejeitado' : selectedItem.status}
                </span>
              </div>
              {selectedItem.content && (
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500 text-xs block mb-1">Conteudo</span>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedItem.content}</p>
                </div>
              )}
            </div>

            {/* Approval Actions */}
            {getAvailableActions(selectedItem.status).length > 0 && (
              <div className="border-t border-zinc-700/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ações de Aprovação</span>
                </div>
                <div className="flex gap-2">
                  {getAvailableActions(selectedItem.status).map(({ action, label, icon: Icon, color }) => (
                    <button
                      key={action}
                      onClick={() => handleApproval(action)}
                      disabled={approving}
                      className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save as Template */}
            {(selectedItem.status === 'approved' || selectedItem.status === 'published') && (
              <div className="border-t border-zinc-700/50 pt-4 mt-4">
                <button
                  onClick={() => handleSaveAsTemplate(selectedItem)}
                  disabled={savingTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                  Salvar como Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
