"use client";

/**
 * Sprint O: Deep Research v2 — Full page with templates, audience analysis,
 * chat refinement, and RAG integration.
 */

import { useEffect, useMemo, useState } from 'react';
import { useBrandStore } from '@/lib/stores/brand-store';
import { ResearchForm } from '@/components/intelligence/research/research-form';
import { DossierViewer } from '@/components/intelligence/research/dossier-viewer';
import type { MarketDossier, ResearchDepth, ResearchTemplateId, ResearchChatMessage, AudiencePersona } from '@/types/research';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import {
  Clock, RefreshCw, ShieldCheck, Save, MessageSquare, Send,
  Users, BookOpen, Loader2, CheckSquare, Square, Database,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TabId = 'dossier' | 'audience' | 'chat';

export default function ResearchPage() {
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketDossier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [savingInsights, setSavingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dossier');

  // O-2: Audience Analysis
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [persona, setPersona] = useState<AudiencePersona | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<any>(null);

  // O-3: Chat refinement
  const [chatMessages, setChatMessages] = useState<ResearchChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // O-3.3: RAG section selection
  const [ragSections, setRagSections] = useState<Set<string>>(new Set());
  const [ragSaving, setRagSaving] = useState(false);

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

  useEffect(() => { loadList(); }, [brandId]);

  // Load chat history when selecting a dossier
  useEffect(() => {
    if (selected?.chatHistory) {
      setChatMessages(selected.chatHistory);
    } else {
      setChatMessages([]);
    }
    setPersona(selected?.audiencePersona ?? null);
    setVoiceAnalysis(null);
    setRagSections(new Set());
  }, [selectedId]);

  const handleSubmit = async (payload: {
    topic: string;
    marketSegment?: string;
    competitors?: string[];
    depth: ResearchDepth;
    templateId?: ResearchTemplateId;
    customUrls?: string[];
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

  // O-2: Audience Analysis
  const handleAudienceAnalysis = async () => {
    if (!selected || !brandId) return;
    setAudienceLoading(true);
    try {
      const headers = await getAuthHeaders();
      const urls = selected.customUrls || selected.sources?.map(s => s.url).slice(0, 3) || [];
      const res = await fetch('/api/intelligence/research/audience', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, urls, topic: selected.topic }),
      });
      if (!res.ok) throw new Error('Falha na análise de audiência');
      const data = await res.json();
      setVoiceAnalysis(data.data?.voiceAnalysis);
      setPersona(data.data?.persona);

      // Save persona to dossier
      try {
        const dossierRef = doc(db, 'brands', brandId, 'research', selected.id);
        await updateDoc(dossierRef, { audiencePersona: data.data?.persona });
      } catch { /* non-critical */ }

      toast.success('Análise de audiência concluída!');
      setActiveTab('audience');
    } catch (err) {
      toast.error('Erro na análise de audiência.');
    } finally {
      setAudienceLoading(false);
    }
  };

  // O-3.1: Chat refinement
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selected || !brandId) return;
    setChatLoading(true);
    const userMsg = chatInput.trim();
    setChatInput('');

    // Optimistic add
    const tempHistory: ResearchChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMsg, timestamp: new Date().toISOString() },
    ];
    setChatMessages(tempHistory);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/research/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          dossierId: selected.id,
          message: userMsg,
          chatHistory: chatMessages,
        }),
      });
      if (!res.ok) throw new Error('Chat error');
      const data = await res.json();
      setChatMessages(data.data?.chatHistory || tempHistory);
    } catch {
      toast.error('Erro no chat de refinamento.');
    } finally {
      setChatLoading(false);
    }
  };

  // O-3.3: Toggle RAG section
  const toggleRagSection = (key: string) => {
    setRagSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // O-3.3/O-3.4: Add selected sections to RAG
  const handleAddToRag = async () => {
    if (!selected || !brandId || ragSections.size === 0) return;
    setRagSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/research/add-to-rag', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          dossierId: selected.id,
          sections: Array.from(ragSections),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar');
      }
      const data = await res.json();
      toast.success(`${data.data?.chunksAdded || 0} seções adicionadas ao Conselho!`);
      setRagSections(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar ao Conselho.');
    } finally {
      setRagSaving(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const ms = ts?.toMillis?.() ?? ts?.seconds * 1000;
    if (!ms) return '';
    return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const displayedItems = showAll ? items : items.slice(0, 5);
  const SECTION_KEYS = ['marketOverview', 'marketSize', 'trends', 'opportunities', 'threats', 'recommendations'] as const;
  const SECTION_LABELS: Record<string, string> = {
    marketOverview: 'Visão Geral', marketSize: 'Tamanho', trends: 'Tendências',
    opportunities: 'Oportunidades', threats: 'Ameaças', recommendations: 'Recomendações',
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-white">Deep Research</h1>
      <ResearchForm onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div className="border border-red-800 bg-red-900/20 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar: Previous Dossiers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Dossiês Anteriores
            </h2>
            <button onClick={loadList} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors" title="Recarregar">
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
                  className={cn(
                    'w-full text-left p-3 border rounded-lg transition-colors',
                    selectedId === item.id ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40'
                  )}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="text-sm text-zinc-100">{item.topic}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px] font-medium uppercase',
                        item.status === 'completed' ? 'text-emerald-400' : item.status === 'failed' ? 'text-red-400' : 'text-zinc-500'
                      )}>{item.status}</span>
                      {item.templateId && (
                        <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500">{item.templateId}</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600">{formatDate(item.generatedAt)}</span>
                  </div>
                  {/* O-3.6: RAG indicator */}
                  {item.ragChunkIds && item.ragChunkIds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Database className="w-3 h-3 text-violet-400" />
                      <span className="text-[9px] text-violet-400">No Conselho</span>
                    </div>
                  )}
                </button>
              ))}
              {items.length > 5 && !showAll && (
                <button onClick={() => setShowAll(true)} className="w-full text-center text-xs text-zinc-400 hover:text-zinc-200 py-2 transition-colors">
                  Ver todos ({items.length} dossiês)
                </button>
              )}
            </>
          )}

          <div className="flex items-center gap-2 px-2 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
            <span className="text-[10px] text-zinc-600">Dossiês são salvos permanentemente na sua marca.</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                {([
                  { id: 'dossier' as TabId, label: 'Dossiê', icon: BookOpen },
                  { id: 'audience' as TabId, label: 'Audiência', icon: Users },
                  { id: 'chat' as TabId, label: 'Chat', icon: MessageSquare },
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                        activeTab === tab.id
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {tab.label}
                    </button>
                  );
                })}

                {/* O-3.6: Research context indicator */}
                {selected.ragChunkIds && selected.ragChunkIds.length > 0 && (
                  <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <Database className="h-3 w-3 text-violet-400" />
                    <span className="text-[10px] text-violet-400">
                      Usando insights de Deep Research: {selected.topic}
                    </span>
                  </div>
                )}
              </div>

              {/* Dossier Tab */}
              {activeTab === 'dossier' && (
                <div className="space-y-4">
                  <DossierViewer dossier={selected} />

                  {/* O-3.3: Add to Council checkboxes */}
                  <Card className="p-4 bg-zinc-900/30 border-zinc-800 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-violet-400" />
                      Adicionar ao Conselho (RAG)
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Selecione seções para que os conselheiros usem como contexto ao gerar conteúdo.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SECTION_KEYS.map(key => {
                        const isChecked = ragSections.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleRagSection(key)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all',
                              isChecked
                                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                                : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                            )}
                          >
                            {isChecked ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                            {SECTION_LABELS[key]}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleAddToRag}
                      disabled={ragSaving || ragSections.size === 0}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                    >
                      {ragSaving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Database className="mr-1.5 h-3 w-3" />}
                      Adicionar ao Conselho ({ragSections.size} seção{ragSections.size !== 1 ? 'ões' : ''})
                    </Button>
                  </Card>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleSaveInsights}
                      disabled={savingInsights}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                    >
                      <Save className="mr-1.5 h-3 w-3" />
                      {savingInsights ? 'Salvando...' : 'Salvar Insights na Marca'}
                    </Button>
                    <Button
                      onClick={handleAudienceAnalysis}
                      disabled={audienceLoading}
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 text-xs"
                    >
                      {audienceLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Users className="mr-1.5 h-3 w-3" />}
                      Analisar Audiência
                    </Button>
                  </div>
                </div>
              )}

              {/* Audience Tab (O-2) */}
              {activeTab === 'audience' && (
                <div className="space-y-4">
                  {!persona && !voiceAnalysis ? (
                    <Card className="p-8 bg-zinc-900/30 border-zinc-800 text-center space-y-4">
                      <Users className="h-10 w-10 text-zinc-600 mx-auto" />
                      <p className="text-sm text-zinc-400">Nenhuma análise de audiência ainda.</p>
                      <Button
                        onClick={handleAudienceAnalysis}
                        disabled={audienceLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {audienceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                        Gerar Análise de Audiência
                      </Button>
                    </Card>
                  ) : (
                    <>
                      {/* Voice Analysis */}
                      {voiceAnalysis && (
                        <Card className="p-4 bg-zinc-900/30 border-zinc-800 space-y-3">
                          <h3 className="text-sm font-bold text-zinc-200">Voz Ativa da Audiência</h3>
                          <div className="text-xs text-zinc-400 space-y-2">
                            <p><span className="text-zinc-300 font-medium">Tom:</span> {voiceAnalysis.tone}</p>
                            {voiceAnalysis.pains?.length > 0 && (
                              <div>
                                <span className="text-red-400 font-medium">Dores:</span>
                                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                  {voiceAnalysis.pains.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            )}
                            {voiceAnalysis.desires?.length > 0 && (
                              <div>
                                <span className="text-emerald-400 font-medium">Desejos:</span>
                                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                  {voiceAnalysis.desires.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                </ul>
                              </div>
                            )}
                            {voiceAnalysis.questions?.length > 0 && (
                              <div>
                                <span className="text-blue-400 font-medium">Perguntas:</span>
                                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                  {voiceAnalysis.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                                </ul>
                              </div>
                            )}
                            {voiceAnalysis.triggers?.length > 0 && (
                              <div>
                                <span className="text-amber-400 font-medium">Gatilhos:</span>
                                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                  {voiceAnalysis.triggers.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}

                      {/* O-2.3: Persona Card */}
                      {persona && (
                        <Card className="p-4 bg-gradient-to-br from-violet-500/5 to-emerald-500/5 border-violet-500/20 space-y-3">
                          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                            <Users className="h-4 w-4 text-violet-400" />
                            Persona: {persona.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] border-violet-500/20 text-violet-400">
                            {persona.age}
                          </Badge>
                          <p className="text-xs text-zinc-400 italic">&ldquo;{persona.summary}&rdquo;</p>
                          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
                            <div>
                              <span className="text-red-400 font-medium text-[10px] uppercase">Dores</span>
                              <ul className="list-disc ml-4 mt-1 space-y-0.5">{persona.pains.map((p, i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                            <div>
                              <span className="text-emerald-400 font-medium text-[10px] uppercase">Desejos</span>
                              <ul className="list-disc ml-4 mt-1 space-y-0.5">{persona.desires.map((d, i) => <li key={i}>{d}</li>)}</ul>
                            </div>
                            <div>
                              <span className="text-blue-400 font-medium text-[10px] uppercase">Perguntas</span>
                              <ul className="list-disc ml-4 mt-1 space-y-0.5">{persona.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
                            </div>
                            <div>
                              <span className="text-amber-400 font-medium text-[10px] uppercase">Gatilhos</span>
                              <ul className="list-disc ml-4 mt-1 space-y-0.5">{persona.triggers.map((t, i) => <li key={i}>{t}</li>)}</ul>
                            </div>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Chat Tab (O-3.1) */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <Card className="p-4 bg-zinc-900/30 border-zinc-800 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-zinc-500 text-sm py-12">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                        Faça perguntas para refinar o dossiê.<br />
                        O assistente tem acesso ao conteúdo completo.
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[80%] rounded-xl px-3 py-2 text-xs',
                            msg.role === 'user'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100'
                              : 'bg-zinc-800/60 border border-zinc-700 text-zinc-300'
                          )}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className="text-[9px] text-zinc-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                      </div>
                    )}
                  </Card>
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pergunte algo sobre o dossiê..."
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                    <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="bg-emerald-600 hover:bg-emerald-500">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
