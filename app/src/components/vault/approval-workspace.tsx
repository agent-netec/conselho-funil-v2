'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  X as XIcon,
  Linkedin,
  Instagram,
  Edit3,
  Sparkles,
  Info,
  Loader2,
  CalendarPlus,
  MessageSquare,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import type { VaultContent } from '@/types/vault';

interface ApprovalWorkspaceProps {
  content: VaultContent;
  insightText: string;
  onApprove: (platform: string, copy: string) => void;
  onEdit: (platform: string, copy: string) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: typeof XIcon; color: string; bg: string; label: string }> = {
  x: { icon: XIcon, color: 'text-white', bg: 'bg-zinc-900', label: 'X (Twitter)' },
  linkedin: { icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'LinkedIn' },
  instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-900/20', label: 'Instagram' },
};

export function ApprovalWorkspace({ content, insightText, onApprove, onEdit }: ApprovalWorkspaceProps) {
  const activeBrand = useActiveBrand();
  const [activePlatform, setActivePlatform] = useState<string>('x');

  // X-2.3: Inline edit
  const [editMode, setEditMode] = useState(false);
  const [editedCopies, setEditedCopies] = useState<Record<string, string>>({});
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // X-2.4: Scheduling
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // X-2.5: Council review
  const [councilReview, setCouncilReview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Initialize edited copies from content
  useEffect(() => {
    const copies: Record<string, string> = {};
    content.variants.forEach(v => { copies[v.platform] = v.copy; });
    setEditedCopies(copies);
  }, [content]);

  // X-2.3: Auto-save debounce (5s)
  const handleCopyChange = useCallback((platform: string, newCopy: string) => {
    setEditedCopies(prev => ({ ...prev, [platform]: newCopy }));
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      onEdit(platform, newCopy);
    }, 5000);
  }, [onEdit]);

  // X-2.4: Schedule publication
  const handleSchedule = async (platform: string) => {
    if (!activeBrand?.id || !scheduleDate) return;
    setIsScheduling(true);
    try {
      const headers = await getAuthHeaders();
      const copy = editedCopies[platform] || content.variants.find(v => v.platform === platform)?.copy || '';
      const res = await fetch('/api/content/calendar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          title: `Vault: ${platform}`,
          date: scheduleDate,
          platform,
          content: copy,
          status: 'scheduled',
        }),
      });
      if (res.ok) {
        notify.success(`Agendado para ${platform} em ${scheduleDate}`);
        setShowScheduler(false);
      } else {
        notify.error('Erro ao agendar');
      }
    } catch {
      notify.error('Erro de conexão');
    } finally {
      setIsScheduling(false);
    }
  };

  // X-2.5: Council review before approve
  const handleCouncilReview = async () => {
    if (!activeBrand?.id) return;
    setIsReviewing(true);
    try {
      const headers = await getAuthHeaders();
      const currentCopy = editedCopies[activePlatform] || content.variants.find(v => v.platform === activePlatform)?.copy || '';
      const res = await fetch('/api/vault/council-review', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          content: currentCopy,
          platform: activePlatform,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.review) {
        setCouncilReview(data.data.review);
        notify.success('Parecer do Conselho recebido!');
      } else {
        notify.error(data.error || 'Erro ao consultar conselho');
      }
    } catch {
      notify.error('Erro de conexão');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Esquerda: Insight Original + Council Review */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <Info className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Insight Original</h3>
        </div>
        <Card className="flex-1 p-6 bg-zinc-900/50 border-white/[0.03] overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
              {insightText}
            </p>
          </ScrollArea>
          <div className="mt-6 pt-6 border-t border-white/[0.03] flex items-center justify-between">
            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
              Alta Relevância
            </Badge>
          </div>
        </Card>

        {/* X-2.5: Council Review Panel */}
        {councilReview && (
          <Card className="p-4 bg-violet-500/5 border-violet-500/10 max-h-[300px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-violet-400" />
              <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Parecer do Conselho</h4>
            </div>
            <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed prose prose-invert prose-xs max-w-none">
              {councilReview}
            </div>
          </Card>
        )}
      </div>

      {/* Direita: Variantes e Aprovação */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Variantes Geradas</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCouncilReview}
              disabled={isReviewing}
              className="h-7 text-[10px] border-violet-500/20 text-violet-400 hover:bg-violet-500/10"
            >
              {isReviewing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquare className="mr-1 h-3 w-3" />}
              Consultar Conselho
            </Button>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Aguardando Revisão</Badge>
          </div>
        </div>

        <Card className="flex-1 bg-zinc-900/50 border-white/[0.03] flex flex-col overflow-hidden">
          <Tabs
            value={activePlatform}
            onValueChange={(v) => setActivePlatform(v as any)}
            className="flex flex-col h-full"
          >
            <div className="px-6 pt-6 border-b border-white/[0.03]">
              <TabsList className="bg-zinc-800/50 border border-white/[0.05]">
                {content.variants.map((v) => {
                  const Config = PLATFORM_CONFIG[v.platform];
                  if (!Config) return null;
                  return (
                    <TabsTrigger
                      key={v.platform}
                      value={v.platform}
                      className="data-[state=active]:bg-zinc-700/50"
                    >
                      <Config.icon className={cn("h-3.5 w-3.5 mr-2", Config.color)} />
                      {v.platform}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {content.variants.map((v) => (
                <TabsContent
                  key={v.platform}
                  value={v.platform}
                  className="h-full m-0 p-6 flex flex-col"
                >
                  {/* X-2.3: Inline edit or read-only */}
                  <div className="flex-1 bg-black/20 rounded-xl border border-white/[0.03] p-6 relative group">
                    {editMode ? (
                      <textarea
                        value={editedCopies[v.platform] || v.copy}
                        onChange={(e) => handleCopyChange(v.platform, e.target.value)}
                        className="w-full h-full bg-transparent text-zinc-200 leading-relaxed resize-none focus:outline-none"
                      />
                    ) : (
                      <ScrollArea className="h-full pr-4">
                        <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {editedCopies[v.platform] || v.copy}
                        </p>
                      </ScrollArea>
                    )}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-zinc-800/80 hover:bg-zinc-700"
                        onClick={() => setEditMode(!editMode)}
                      >
                        {editMode ? <Save className="h-4 w-4 text-emerald-400" /> : <Edit3 className="h-4 w-4 text-zinc-400" />}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Brand Voice: OK
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Otimizado para {v.platform}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* X-2.4: Schedule toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-ghost border-white/[0.05] h-8"
                        onClick={() => setShowScheduler(!showScheduler)}
                      >
                        <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                        Agendar
                      </Button>
                      <Button
                        variant="outline"
                        className="btn-ghost border-white/[0.05]"
                        onClick={() => onEdit(v.platform, editedCopies[v.platform] || v.copy)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        className="btn-accent shadow-lg shadow-emerald-500/10"
                        onClick={() => onApprove(v.platform, editedCopies[v.platform] || v.copy)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </div>
                  </div>

                  {/* X-2.4: Date picker for scheduling */}
                  {showScheduler && (
                    <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 border border-white/[0.04] flex items-center gap-3">
                      <CalendarPlus className="h-4 w-4 text-emerald-400 shrink-0" />
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSchedule(v.platform)}
                        disabled={isScheduling || !scheduleDate}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {isScheduling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirmar'}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
