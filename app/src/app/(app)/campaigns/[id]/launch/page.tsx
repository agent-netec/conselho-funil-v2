'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { CampaignStageStepper } from '@/components/campaigns/campaign-stage-stepper';
import type { CampaignContext } from '@/types/campaign';
import {
  Rocket,
  FileText,
  Type,
  Share2,
  Palette,
  Download,
  BarChart3,
  CheckSquare,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Loader2,
  Plus,
  TrendingUp,
  Sparkles,
  Zap,
  Stethoscope,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { toast } from 'sonner';
import JSZip from 'jszip';

type LaunchTab = 'kit' | 'checklist' | 'diary' | 'iterate' | 'feedback';

const TABS: { id: LaunchTab; label: string; icon: typeof Rocket }[] = [
  { id: 'kit', label: 'Kit de Campanha', icon: Download },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'diary', label: 'Diário', icon: BookOpen },
  { id: 'iterate', label: 'Iteração', icon: RefreshCw },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function LaunchPadPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [campaign, setCampaign] = useState<CampaignContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LaunchTab>('kit');

  const campaignId = params.id as string;

  useEffect(() => {
    if (!campaignId || !user?.uid) return;
    const unsub = onSnapshot(doc(db, 'campaigns', campaignId), (snap) => {
      if (snap.exists()) {
        setCampaign({ ...snap.data(), id: snap.id } as CampaignContext);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [campaignId, user?.uid]);

  const isCampaignComplete = !!(
    campaign?.funnel &&
    campaign?.copywriting &&
    campaign?.social &&
    campaign?.design &&
    campaign?.ads
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#E6B447] animate-spin" />
      </div>
    );
  }

  if (!campaign || !isCampaignComplete) {
    return (
      <div className="min-h-screen bg-[#0A0908]">
        <Header />
        <CampaignStageStepper campaignId={campaignId} currentStage="launch" />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Rocket className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-zinc-400">Launch Pad</h2>
          <p className="text-sm text-zinc-600 mt-2">
            Complete todos os 5 estágios da Linha de Ouro antes de acessar o Launch Pad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0908]">
      <Header />
      <CampaignStageStepper campaignId={campaignId} currentStage="launch" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/20">
            <Rocket className="h-5 w-5 text-[#E6B447]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{campaign.name}</h1>
            <p className="text-xs text-zinc-500">Launch Pad — Tudo pronto para decolar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto scrollbar-none border-b border-zinc-800 pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActive
                    ? 'border-[#E6B447] text-[#E6B447]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'kit' && (
          <KitTab campaign={campaign} />
        )}
        {activeTab === 'checklist' && (
          <ChecklistTab campaign={campaign} campaignId={campaignId} />
        )}
        {activeTab === 'diary' && (
          <DiaryTab campaign={campaign} campaignId={campaignId} />
        )}
        {activeTab === 'iterate' && (
          <IterateTab campaign={campaign} />
        )}
        {activeTab === 'feedback' && (
          <FeedbackTab campaign={campaign} campaignId={campaignId} />
        )}
      </div>
    </div>
  );
}

/* ─── Helper: CSV download ─── */
function downloadCsv(filename: string, content: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(val: string) {
  return `"${(val || '').replace(/"/g, '""')}"`;
}

/* ─── CSV Builders (shared by individual exports and ZIP) ─── */
function buildCopyCsv(c: NonNullable<CampaignContext['copywriting']>): string {
  const rows: string[] = ['Tipo,Conteúdo'];
  rows.push(`Big Idea,${esc(c.bigIdea)}`);
  rows.push(`Tom,${esc(c.tone)}`);
  c.headlines?.forEach((h, i) => rows.push(`Headline ${i + 1},${esc(h)}`));
  c.keyBenefits?.forEach((b, i) => rows.push(`Benefício ${i + 1},${esc(b)}`));
  if (c.structured) {
    rows.push(`Headline Principal,${esc(c.structured.headline)}`);
    rows.push(`Subheadline,${esc(c.structured.subheadline)}`);
    rows.push(`Body,${esc(c.structured.body)}`);
    rows.push(`CTA,${esc(c.structured.cta)}`);
    rows.push(`Prova Social,${esc(c.structured.proof)}`);
  }
  if (c.mainScript) rows.push(`Script Principal,${esc(c.mainScript)}`);
  return rows.join('\n');
}

function buildSocialCsv(s: NonNullable<CampaignContext['social']>): string {
  const rows: string[] = ['Plataforma,Conteúdo,Estilo,Framework,Score,Aprovado'];
  s.hooks?.forEach((h) => {
    rows.push(
      `${esc(h.platform)},${esc(h.content)},${esc(h.style)},${esc(h.framework || '')},${h.score ?? ''},${h.approved ? 'Sim' : 'Não'}`
    );
  });
  if (s.contentPlan?.calendar?.length) {
    rows.push('');
    rows.push('Dia,Pilar,Formato');
    s.contentPlan.calendar.forEach((c) => {
      rows.push(`${esc(c.day)},${esc(c.pillar)},${esc(c.format)}`);
    });
  }
  if (s.contentPlan?.posts?.length) {
    rows.push('');
    rows.push('Título,Hook,Plataforma,Formato,Aprovado');
    s.contentPlan.posts.forEach((p) => {
      rows.push(
        `${esc(p.title)},${esc(p.hook)},${esc(p.platform)},${esc(p.format)},${p.approved ? 'Sim' : 'Não'}`
      );
    });
  }
  return rows.join('\n');
}

function buildMediaCsv(ads: NonNullable<CampaignContext['ads']>, funnel?: CampaignContext['funnel']): string {
  const rows: string[] = ['Campo,Valor'];
  rows.push(`Canais,${esc(ads.channels?.join(', ') || '')}`);
  rows.push(`Audiências,${esc(ads.audiences?.join(', ') || '')}`);
  rows.push(`Budget Sugerido,${esc(ads.suggestedBudget || 'Não definido')}`);
  if (ads.performanceBenchmarks) {
    rows.push(`Target CPC,R$ ${ads.performanceBenchmarks.targetCPC ?? '-'}`);
    rows.push(`Target CTR,${ads.performanceBenchmarks.targetCTR ?? '-'}%`);
    rows.push(`Target CPA,R$ ${ads.performanceBenchmarks.targetCPA ?? '-'}`);
  }
  if (funnel) {
    rows.push('');
    rows.push('Contexto do Funil,');
    rows.push(`Tipo,${esc(funnel.type)}`);
    rows.push(`Público-alvo,${esc(funnel.targetAudience)}`);
    rows.push(`Objetivo,${esc(funnel.mainGoal)}`);
    rows.push(`Canal Primário,${esc(funnel.primaryChannel || '')}`);
  }
  return rows.join('\n');
}

/* ─── Kit Tab ─── */
function KitTab({ campaign }: { campaign: CampaignContext }) {
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  // 1. PDF Executivo — reuses existing briefing API
  async function handlePdf() {
    const newTab = window.open('', '_blank');
    if (!newTab) {
      toast.error('Popup bloqueado. Permita popups para este site.');
      return;
    }
    newTab.document.write(
      '<html><body style="background:#111;color:#999;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p>Gerando briefing com IA... aguarde.</p></body></html>'
    );
    setLoadingItem('pdf');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/campaigns/${campaign.id}/generate-briefing`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro' }));
        newTab.document.write(`<p style="color:#f87171;">${err.error || 'Falha'}</p>`);
        toast.error(err.error || 'Falha ao gerar briefing');
        return;
      }
      const { html } = await res.json();
      newTab.document.open();
      newTab.document.write(html);
      newTab.document.close();
      toast.success('Briefing PDF gerado!');
    } catch {
      newTab.document.write('<p style="color:#f87171;">Falha. Feche e tente novamente.</p>');
      toast.error('Falha ao gerar briefing');
    } finally {
      setLoadingItem(null);
    }
  }

  // 2. Pack de Copy — CSV
  function handleCopy() {
    if (!campaign.copywriting) return;
    downloadCsv(`copy-${campaign.name.replace(/\s+/g, '-')}.csv`, buildCopyCsv(campaign.copywriting));
    toast.success('Pack de Copy exportado!');
  }

  // 3. Pack de Social — CSV (hooks + calendar)
  function handleSocial() {
    if (!campaign.social) return;
    downloadCsv(`social-${campaign.name.replace(/\s+/g, '-')}.csv`, buildSocialCsv(campaign.social));
    toast.success('Pack de Social exportado!');
  }

  // 4. Pack de Design — download URLs
  function handleDesign() {
    const urls = campaign.design?.assetsUrl;
    if (!urls || urls.length === 0) {
      toast.error('Nenhum asset de design encontrado');
      return;
    }
    // Open each asset URL for download
    urls.forEach((url, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `design-asset-${i + 1}`;
        a.click();
      }, i * 300);
    });
    toast.success(`${urls.length} assets de design baixados!`);
  }

  // 5. Plano de Mídia — CSV
  function handleMedia() {
    if (!campaign.ads) return;
    downloadCsv(`plano-midia-${campaign.name.replace(/\s+/g, '-')}.csv`, buildMediaCsv(campaign.ads, campaign.funnel));
    toast.success('Plano de Mídia exportado!');
  }

  // 6. Kit Completo — ZIP with all CSVs
  async function handleFullKit() {
    setLoadingItem('zip');
    try {
      const zip = new JSZip();
      const slug = campaign.name.replace(/\s+/g, '-');

      if (campaign.copywriting) {
        zip.file(`copy-${slug}.csv`, '\uFEFF' + buildCopyCsv(campaign.copywriting));
      }
      if (campaign.social) {
        zip.file(`social-${slug}.csv`, '\uFEFF' + buildSocialCsv(campaign.social));
      }
      if (campaign.ads) {
        zip.file(`plano-midia-${slug}.csv`, '\uFEFF' + buildMediaCsv(campaign.ads, campaign.funnel));
      }

      // Design asset URLs as text reference
      if (campaign.design?.assetsUrl?.length) {
        zip.file(
          `design-assets-${slug}.txt`,
          `Assets de Design — ${campaign.name}\n\n${campaign.design.assetsUrl.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
        );
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kit-campanha-${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Kit Completo baixado!');
    } catch {
      toast.error('Falha ao gerar ZIP');
    } finally {
      setLoadingItem(null);
    }
  }

  const KIT_ITEMS = [
    {
      id: 'pdf',
      title: 'PDF Executivo',
      description: 'Briefing completo formatado com logo da marca (3 créditos)',
      icon: FileText,
      onClick: handlePdf,
    },
    {
      id: 'copy',
      title: 'Pack de Copy',
      description: `${campaign.copywriting?.headlines?.length || 0} headlines + copy estruturada`,
      icon: Type,
      onClick: handleCopy,
    },
    {
      id: 'social',
      title: 'Pack de Social',
      description: `${campaign.social?.hooks?.length || 0} hooks + calendário`,
      icon: Share2,
      onClick: handleSocial,
    },
    {
      id: 'design',
      title: 'Pack de Design',
      description: `${campaign.design?.assetsUrl?.length || 0} assets aprovados`,
      icon: Palette,
      onClick: handleDesign,
    },
    {
      id: 'media',
      title: 'Plano de Mídia',
      description: `${campaign.ads?.channels?.join(', ') || 'Canais'} — ${campaign.ads?.suggestedBudget || 'Budget'}`,
      icon: BarChart3,
      onClick: handleMedia,
    },
    {
      id: 'zip',
      title: 'Kit Completo',
      description: 'Copy + Social + Mídia + Design em um ZIP',
      icon: Download,
      onClick: handleFullKit,
      primary: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {KIT_ITEMS.map((item) => {
        const Icon = item.icon;
        const isLoading = loadingItem === item.id;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={isLoading}
            className={`text-left p-5 rounded-xl border transition-all ${
              item.primary
                ? 'border-[#E6B447]/30 bg-[#E6B447]/5 hover:bg-[#E6B447]/10'
                : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 className={`h-5 w-5 mb-3 animate-spin ${item.primary ? 'text-[#E6B447]' : 'text-zinc-400'}`} />
            ) : (
              <Icon className={`h-5 w-5 mb-3 ${item.primary ? 'text-[#E6B447]' : 'text-zinc-400'}`} />
            )}
            <h3 className="text-sm font-semibold text-zinc-200">{item.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Checklist Tab ─── */
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link?: string;
}

function generateChecklist(campaign: CampaignContext): ChecklistItem[] {
  const channel = campaign.funnel?.primaryChannel || 'Meta';
  const hooksCount = campaign.social?.hooks?.filter((h) => h.approved).length || campaign.social?.hooks?.length || 0;
  const assetsCount = campaign.design?.assetsUrl?.length || 0;
  const audience = campaign.funnel?.targetAudience || 'seu público';

  return [
    {
      id: 'pixel',
      title: `Configurar pixel do ${channel} na landing page`,
      description: `Instale o pixel de rastreamento do ${channel} para medir conversões`,
      completed: false,
      link: channel.toLowerCase().includes('meta') || channel.toLowerCase().includes('facebook')
        ? 'https://business.facebook.com/events-manager'
        : channel.toLowerCase().includes('google')
          ? 'https://ads.google.com'
          : undefined,
    },
    {
      id: 'creatives',
      title: 'Subir criativos no Ads Manager',
      description: `${assetsCount} assets de design prontos para upload`,
      completed: false,
    },
    {
      id: 'copy_review',
      title: 'Revisar copy final na landing page',
      description: `Headline: "${campaign.copywriting?.structured?.headline || campaign.copywriting?.headlines?.[0] || ''}"`,
      completed: false,
    },
    {
      id: 'schedule_posts',
      title: 'Agendar posts da semana 1',
      description: `${hooksCount} hooks prontos para publicação`,
      completed: false,
    },
    {
      id: 'audiences',
      title: 'Configurar audiências',
      description: `Público: ${audience}`,
      completed: false,
    },
    {
      id: 'budget',
      title: 'Definir budget inicial',
      description: `Sugerido: ${campaign.ads?.suggestedBudget || 'Consulte o Plano de Mídia'}`,
      completed: false,
    },
    {
      id: 'tracking',
      title: 'Testar UTMs e tracking',
      description: 'Verifique que todos os links estão rastreados corretamente',
      completed: false,
    },
    {
      id: 'activate',
      title: 'Ativar campanha!',
      description: `Canais: ${campaign.ads?.channels?.join(', ') || channel}`,
      completed: false,
    },
  ];
}

function ChecklistTab({ campaign, campaignId }: { campaign: CampaignContext; campaignId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [healthCheckUrl, setHealthCheckUrl] = useState('');
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);
  const healthCheck = campaign.launch?.healthCheck;

  useEffect(() => {
    // Load from campaign.launch.checklist or generate fresh
    const saved = campaign.launch?.checklist;
    if (saved && saved.length > 0) {
      setItems(saved);
    } else {
      setItems(generateChecklist(campaign));
    }
    setInitialized(true);
  }, [campaign]);

  async function toggleItem(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);

    // Persist to Firestore
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), {
        'launch.checklist': updated,
      });
    } catch (err) {
      console.error('[Checklist] Save error:', err);
    }
  }

  async function runHealthCheck() {
    if (!healthCheckUrl.trim()) {
      toast.error('Cole a URL da sua landing page');
      return;
    }
    setRunningHealthCheck(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/autopsy/run', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: campaign.brandId,
          url: healthCheckUrl.trim(),
          depth: 'deep',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro' }));
        toast.error(err.error || 'Falha no diagnóstico');
        return;
      }
      const data = await res.json();
      const report = data.data?.report || data.report;
      if (!report) {
        toast.error('Resposta inesperada do diagnóstico');
        return;
      }

      const hc = {
        url: healthCheckUrl.trim(),
        score: report.score ?? 0,
        summary: report.summary ?? '',
        heuristics: {
          hook: report.heuristics?.hook?.score ?? 0,
          story: report.heuristics?.story?.score ?? 0,
          offer: report.heuristics?.offer?.score ?? 0,
          friction: report.heuristics?.friction?.score ?? 0,
          trust: report.heuristics?.trust?.score ?? 0,
        },
        recommendations: (report.recommendations ?? []).map((r: any) => ({
          priority: r.priority,
          action: r.action,
          impact: r.impact,
        })),
        checkedAt: new Date(),
      };

      await updateDoc(doc(db, 'campaigns', campaignId), {
        'launch.healthCheck': hc,
      });
      toast.success(`Health Check: ${hc.score}/10`);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setRunningHealthCheck(false);
    }
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (!initialized) return null;

  return (
    <div className="space-y-6">
      {/* Health Check — Sprint 11 */}
      <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-emerald-400">Health Check Pré-Lançamento</h3>
          <span className="text-[10px] text-zinc-500 ml-auto">2 créditos</span>
        </div>

        {healthCheck ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-black font-mono" style={{
                  color: healthCheck.score >= 7 ? '#4ade80' : healthCheck.score >= 4 ? '#E6B447' : '#f87171'
                }}>
                  {healthCheck.score}<span className="text-sm text-zinc-600">/10</span>
                </div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">Score</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-300">{healthCheck.summary}</p>
                <p className="text-[10px] text-zinc-600 mt-1 truncate">{healthCheck.url}</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Hook', score: healthCheck.heuristics.hook },
                { label: 'Story', score: healthCheck.heuristics.story },
                { label: 'Offer', score: healthCheck.heuristics.offer },
                { label: 'Friction', score: healthCheck.heuristics.friction },
                { label: 'Trust', score: healthCheck.heuristics.trust },
              ].map((h) => (
                <div key={h.label} className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-zinc-600 font-bold">{h.label}</p>
                  <p className="text-sm font-bold font-mono" style={{
                    color: h.score >= 7 ? '#4ade80' : h.score >= 4 ? '#E6B447' : '#f87171'
                  }}>{h.score}</p>
                </div>
              ))}
            </div>

            {healthCheck.recommendations.length > 0 && (
              <div className="space-y-1">
                {healthCheck.recommendations.slice(0, 3).map((rec, i) => {
                  const RecIcon = rec.priority === 'high' ? XCircle : rec.priority === 'medium' ? AlertTriangle : CheckCircle;
                  const recColor = rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-amber-400' : 'text-green-400';
                  return (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <RecIcon className={`h-3 w-3 shrink-0 mt-0.5 ${recColor}`} />
                      <span className="text-zinc-400"><strong className="text-zinc-300">{rec.action}</strong> — {rec.impact}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => { setHealthCheckUrl(healthCheck.url); }}
              className="text-[10px] text-emerald-400 hover:underline"
            >
              Refazer diagnóstico
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="url"
                placeholder="https://sua-landing-page.com.br"
                value={healthCheckUrl}
                onChange={(e) => setHealthCheckUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runHealthCheck()}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                disabled={runningHealthCheck}
              />
            </div>
            <button
              onClick={runHealthCheck}
              disabled={runningHealthCheck || !healthCheckUrl.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {runningHealthCheck ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
              Diagnosticar
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E6B447] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
          {completedCount}/{items.length} ({progress}%)
        </span>
      </div>

      {progress === 100 && (
        <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/30 text-center">
          <p className="text-sm font-bold text-green-400">Checklist completo! Campanha pronta para decolar.</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border transition-all ${
              item.completed
                ? 'border-[#E6B447]/20 bg-[#E6B447]/5'
                : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                item.completed
                  ? 'border-[#E6B447] bg-[#E6B447]'
                  : 'border-zinc-600'
              }`}
            >
              {item.completed && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-mono">{i + 1}</span>
                <h4 className={`text-sm font-medium ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                  {item.title}
                </h4>
              </div>
              <p className={`text-xs mt-0.5 ${item.completed ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {item.description}
              </p>
            </div>
            {item.link && !item.completed && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-[#E6B447] hover:underline shrink-0 mt-1"
              >
                Abrir
              </a>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Diary Tab ─── */
interface DiaryEntry {
  week: number;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  notes?: string;
  aiInsight?: string;
  createdAt?: unknown;
}

function DiaryTab({ campaign, campaignId }: { campaign: CampaignContext; campaignId: string }) {
  const [entries, setEntries] = useState<DiaryEntry[]>(campaign.launch?.diary ?? []);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [form, setForm] = useState({ spend: 0, clicks: 0, impressions: 0, conversions: 0, notes: '' });
  const [generatingInsight, setGeneratingInsight] = useState<number | null>(null);

  function addEntry() {
    const nextWeek = entries.length + 1;
    setEditingWeek(nextWeek);
    setForm({ spend: 0, clicks: 0, impressions: 0, conversions: 0, notes: '' });
  }

  async function saveEntry() {
    if (editingWeek === null) return;
    const entry: DiaryEntry = {
      week: editingWeek,
      ...form,
      createdAt: new Date().toISOString(),
    };
    const existing = entries.findIndex((e) => e.week === editingWeek);
    const updated = existing >= 0
      ? entries.map((e) => (e.week === editingWeek ? entry : e))
      : [...entries, entry];

    setEntries(updated);
    setEditingWeek(null);

    try {
      await updateDoc(doc(db, 'campaigns', campaignId), { 'launch.diary': updated });
      toast.success(`Semana ${entry.week} salva!`);
    } catch {
      toast.error('Erro ao salvar entrada');
    }
  }

  async function generateInsight(entry: DiaryEntry) {
    setGeneratingInsight(entry.week);
    try {
      const headers = await getAuthHeaders();
      const cpa = entry.conversions > 0 ? (entry.spend / entry.conversions).toFixed(2) : 'N/A';
      const ctr = entry.impressions > 0 ? ((entry.clicks / entry.impressions) * 100).toFixed(2) : 'N/A';
      const avgTicket = campaign.offer?.score ? campaign.offer.score : 100;
      const roas = entry.spend > 0 && entry.conversions > 0
        ? ((entry.conversions * avgTicket) / entry.spend).toFixed(2)
        : 'N/A';

      const targetCPA = campaign.ads?.performanceBenchmarks?.targetCPA;
      const targetCTR = campaign.ads?.performanceBenchmarks?.targetCTR;

      const prompt = `Analise as métricas da semana ${entry.week} desta campanha de ${campaign.funnel?.type || 'marketing digital'} para ${campaign.funnel?.targetAudience || 'público geral'}:
- Spend: R$ ${entry.spend}
- Clicks: ${entry.clicks}
- Impressões: ${entry.impressions}
- Conversões: ${entry.conversions}
- CPA: R$ ${cpa}
- CTR: ${ctr}%
- ROAS estimado: ${roas}
${targetCPA ? `- Target CPA: R$ ${targetCPA}` : ''}
${targetCTR ? `- Target CTR: ${targetCTR}%` : ''}
${entry.notes ? `- Notas: ${entry.notes}` : ''}

Dê 1 insight prático e acionável em 2-3 frases. Seja direto. Compare com os benchmarks se disponíveis.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          brandId: campaign.brandId,
          mode: 'strategy',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const insight = data.data?.response || data.response || 'Sem insight disponível';
        const updated = entries.map((e) =>
          e.week === entry.week ? { ...e, aiInsight: insight } : e
        );
        setEntries(updated);
        await updateDoc(doc(db, 'campaigns', campaignId), { 'launch.diary': updated });
        toast.success('Insight gerado!');
      } else {
        toast.error('Erro ao gerar insight');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setGeneratingInsight(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-300">Métricas Semanais</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Semana
        </button>
      </div>

      {/* Entry form */}
      {editingWeek !== null && (
        <div className="p-5 rounded-xl border border-[#E6B447]/20 bg-zinc-900/80 space-y-4">
          <h4 className="text-sm font-bold text-[#E6B447]">Semana {editingWeek}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['spend', 'clicks', 'impressions', 'conversions'] as const).map((field) => (
              <div key={field}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                  {field === 'spend' ? 'Spend (R$)' : field === 'clicks' ? 'Clicks' : field === 'impressions' ? 'Impressões' : 'Conversões'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E6B447] focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E6B447] focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEntry} className="px-4 py-2 bg-[#AB8648] hover:bg-[#E6B447] text-white rounded-lg text-sm font-medium transition-colors">
              Salvar
            </button>
            <button onClick={() => setEditingWeek(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {entries.length === 0 && editingWeek === null && (
        <div className="border border-zinc-800/50 rounded-xl p-12 text-center bg-zinc-900/20">
          <BookOpen className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">Nenhuma entrada ainda</p>
          <p className="text-xs text-zinc-600 mt-1">Adicione métricas semanais para acompanhar sua campanha</p>
        </div>
      )}

      {entries.map((entry) => {
        const cpa = entry.conversions > 0 ? (entry.spend / entry.conversions).toFixed(2) : '-';
        const ctr = entry.impressions > 0 ? ((entry.clicks / entry.impressions) * 100).toFixed(1) : '-';
        // ROAS = conversions * avg ticket / spend (use offer score as proxy, fallback R$100)
        const avgTicket = campaign.offer?.score ? campaign.offer.score : 100;
        const roas = entry.spend > 0 && entry.conversions > 0
          ? ((entry.conversions * avgTicket) / entry.spend).toFixed(2)
          : '-';

        return (
          <div key={entry.week} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-200">Semana {entry.week}</h4>
              <button
                onClick={() => {
                  setEditingWeek(entry.week);
                  setForm({
                    spend: entry.spend,
                    clicks: entry.clicks,
                    impressions: entry.impressions,
                    conversions: entry.conversions,
                    notes: entry.notes || '',
                  });
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Editar
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {[
                { label: 'Spend', value: `R$ ${entry.spend}` },
                { label: 'Clicks', value: entry.clicks },
                { label: 'Impressões', value: entry.impressions.toLocaleString() },
                { label: 'Conversões', value: entry.conversions },
                { label: 'CPA', value: cpa === '-' ? '-' : `R$ ${cpa}` },
                { label: 'CTR', value: ctr === '-' ? '-' : `${ctr}%` },
                { label: 'ROAS', value: roas === '-' ? '-' : `${roas}x` },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">{m.label}</p>
                  <p className="text-sm text-zinc-300 font-medium mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            {entry.notes && (
              <p className="text-xs text-zinc-500 italic">{entry.notes}</p>
            )}

            {/* AI Insight */}
            {entry.aiInsight ? (
              <div className="p-3 rounded-lg bg-[#E6B447]/5 border border-[#E6B447]/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-[#E6B447]" />
                  <span className="text-[10px] text-[#E6B447] font-bold uppercase tracking-wider">Insight IA</span>
                </div>
                <p className="text-xs text-zinc-300">{entry.aiInsight}</p>
              </div>
            ) : (
              <button
                onClick={() => generateInsight(entry)}
                disabled={generatingInsight === entry.week}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#E6B447] transition-colors disabled:opacity-50"
              >
                {generatingInsight === entry.week ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Gerar insight com IA
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Iterate Tab ─── */
function IterateTab({ campaign }: { campaign: CampaignContext }) {
  const paths = [
    {
      title: 'Não performou?',
      description: 'Crie uma variação ajustando os pontos fracos da campanha original',
      icon: RefreshCw,
      cta: 'Criar variação',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/5 border-orange-400/10 hover:bg-orange-400/10',
      action: () => {
        toast.info('Dica: Volte ao estágio que quer ajustar (Copy, Social ou Design) e gere uma nova versão mantendo o mesmo funil.');
      },
    },
    {
      title: 'Performou bem?',
      description: `Escale: aumente budget de ${campaign.ads?.suggestedBudget || 'R$ X'}, teste novos canais e expanda audiências`,
      icon: TrendingUp,
      cta: 'Ver sugestões de escala',
      color: 'text-green-400',
      bgColor: 'bg-green-400/5 border-green-400/10 hover:bg-green-400/10',
      action: () => {
        const channels = campaign.ads?.channels?.join(', ') || 'seus canais';
        toast.success(
          `Sugestões: 1) Aumente o budget em 20-30%. 2) Teste ${channels} com novas audiências. 3) Crie lookalike audiences dos compradores.`,
          { duration: 8000 }
        );
      },
    },
    {
      title: 'Outro ângulo?',
      description: 'Nova campanha com o mesmo funil mas abordagem, copy e criativos diferentes',
      icon: Zap,
      cta: 'Criar campanha v2',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/5 border-purple-400/10 hover:bg-purple-400/10',
      action: () => {
        toast.info('Dica: Vá para a página de Campanhas e crie uma nova campanha usando o mesmo funil. O conselheiro já terá o contexto.');
      },
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        Baseado nos resultados do diário, escolha o próximo passo:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.map((path) => {
          const Icon = path.icon;
          return (
            <button
              key={path.title}
              onClick={path.action}
              className={`text-left p-6 rounded-xl border transition-all ${path.bgColor}`}
            >
              <Icon className={`h-6 w-6 mb-4 ${path.color}`} />
              <h3 className={`text-sm font-bold ${path.color} mb-2`}>{path.title}</h3>
              <p className="text-xs text-zinc-500 mb-4">{path.description}</p>
              <span className="text-xs font-medium text-zinc-400">{path.cta} →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Feedback Tab ─── */
const FEEDBACK_OPTIONS = [
  { value: 'success' as const, label: 'Sucesso', emoji: '🎯', color: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-400', selected: 'border-green-500 bg-green-500/20' },
  { value: 'mediocre' as const, label: 'Mediocre', emoji: '😐', color: 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-400', selected: 'border-yellow-500 bg-yellow-500/20' },
  { value: 'failure' as const, label: 'Fracasso', emoji: '💀', color: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400', selected: 'border-red-500 bg-red-500/20' },
];

function FeedbackTab({ campaign, campaignId }: { campaign: CampaignContext; campaignId: string }) {
  const saved = campaign.launch?.feedback;
  const [result, setResult] = useState<'success' | 'failure' | 'mediocre' | null>(saved?.result ?? null);
  const [notes, setNotes] = useState(saved?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(!!saved);

  async function saveFeedback() {
    if (!result) return;
    setSaving(true);
    try {
      const feedback = {
        result,
        notes: notes.trim() || undefined,
        savedAt: new Date(),
      };

      await updateDoc(doc(db, 'campaigns', campaignId), {
        'launch.feedback': feedback,
      });

      // Fire-and-forget: index feedback into RAG via existing endpoint
      const headers = await getAuthHeaders();
      fetch('/api/campaigns/index-decision', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          brandId: campaign.brandId,
          section: 'ads', // closest match — indexes campaign context
        }),
      }).catch(() => {});

      setFeedbackSaved(true);
      toast.success('Feedback salvo! Futuras campanhas aprenderão com este resultado.');
    } catch {
      toast.error('Erro ao salvar feedback');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-bold text-zinc-200">Como foi essa campanha?</h3>
        <p className="text-sm text-zinc-500 mt-1">Seu feedback alimenta futuras campanhas</p>
      </div>

      {/* Result options */}
      <div className="grid grid-cols-3 gap-4">
        {FEEDBACK_OPTIONS.map((opt) => {
          const isSelected = result === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => { setResult(opt.value); setFeedbackSaved(false); }}
              className={`p-5 rounded-xl border-2 transition-all text-center ${
                isSelected ? opt.selected : opt.color
              }`}
            >
              <span className="text-3xl block mb-2">{opt.emoji}</span>
              <span className="text-sm font-bold">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notes */}
      {result && (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setFeedbackSaved(false); }}
            placeholder="O que funcionou/não funcionou? (opcional)"
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#E6B447] focus:outline-none resize-none"
          />

          <button
            onClick={saveFeedback}
            disabled={saving || feedbackSaved}
            className="w-full py-3 bg-[#AB8648] hover:bg-[#E6B447] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
          >
            {saving ? 'Salvando...' : feedbackSaved ? 'Feedback salvo!' : 'Salvar Feedback'}
          </button>

          {feedbackSaved && (
            <p className="text-xs text-zinc-500 text-center">
              Futuras campanhas para {campaign.funnel?.targetAudience || 'este público'} usarão este aprendizado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

