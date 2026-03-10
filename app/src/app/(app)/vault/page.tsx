'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Play, Clock, Dna, Upload, PenLine, Bell, CheckCircle2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ApprovalWorkspace } from '@/components/vault/approval-workspace';
import { VaultExplorer } from '@/components/vault/vault-explorer';
import { toast } from 'sonner';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import {
  queryVaultLibrary, getBrandDNA, getVaultAssets, saveVaultContent
} from '@/lib/firebase/vault';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { VaultContent, CopyDNA, VaultAsset } from '@/types/vault';
import { DNAWizard } from '@/components/vault/dna-wizard';
import { cn } from '@/lib/utils';

interface VaultSettings {
  autoApproveThreshold?: number;
  notifyOnNewContent?: boolean;
  autopilotEnabled?: boolean;
}

const TABS = [
  { id: 'review', label: 'Review Queue' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'settings', label: 'Config' },
] as const;

export default function VaultPage() {
  const activeBrand = useActiveBrand();
  const { user } = useAuthStore();
  const router = useRouter();
  const brandId = activeBrand?.id;
  const [tab, setTab] = useState('review');
  const [reviewItems, setReviewItems] = useState<VaultContent[]>([]);
  const [libraryItems, setLibraryItems] = useState<VaultContent[]>([]);
  const [dnaItems, setDnaItems] = useState<CopyDNA[]>([]);
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [showDNAWizard, setShowDNAWizard] = useState(false);
  const [showNewAssetMenu, setShowNewAssetMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<VaultContent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [vaultSettings, setVaultSettings] = useState<VaultSettings>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const loadVaultData = useCallback(async () => {
    if (!brandId) return;
    try {
      setIsLoading(true);
      const [approved, dna, media] = await Promise.all([queryVaultLibrary(brandId, 'approved'), getBrandDNA(brandId), getVaultAssets(brandId)]);
      setLibraryItems(approved); setDnaItems(dna); setAssets(media);
    } catch (e) { console.error('Error loading vault:', e); }
    finally { setIsLoading(false); }
  }, [brandId]);

  useEffect(() => { if (brandId) loadVaultData(); }, [brandId, loadVaultData]);

  const handleApprove = async (platform: string, copy: string) => {
    if (!brandId) return;
    try {
      const item = reviewItems[0];
      await saveVaultContent(brandId, { ...item, status: 'approved', approvalChain: { approvedBy: user?.uid || 'unknown', approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any } });
      toast.success('Conteúdo aprovado!'); setReviewItems([]); loadVaultData();
    } catch { toast.error('Erro ao aprovar.'); }
  };

  const handleEdit = (platform: string, copy: string) => { toast.info(`Abrindo editor para ${platform}...`); };

  const handleRunAutopilot = async () => {
    if (!brandId) { toast.error('Selecione uma marca.'); return; }
    setRunningAutopilot(true);
    try {
      const h = await getAuthHeaders();
      const res = await fetch('/api/content/autopilot', { method: 'POST', headers: h, body: JSON.stringify({ brandId }) });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Autopilot: ${data.data?.contentAdapted || data.data?.adapted || 0} conteúdo(s) gerado(s).`);
        if (data.data?.creditWarning) toast.warning(data.data.creditWarning);
        if (data.data?.contentAdapted > 0 || data.data?.adapted > 0) loadVaultData();
      } else toast.error(data.error || 'Erro no autopilot.');
    } catch { toast.error('Erro de conexão.'); }
    finally { setRunningAutopilot(false); }
  };

  const loadHistory = useCallback(async () => {
    if (!brandId) return;
    setLoadingHistory(true);
    try {
      const snap = await getDocs(query(collection(db, 'brands', brandId, 'vault_library'), where('status', 'in', ['approved', 'rejected']), orderBy('createdAt', 'desc'), limit(50)));
      setHistoryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as VaultContent)));
    } catch (e) { console.error('[Vault] History error:', e); }
    finally { setLoadingHistory(false); }
  }, [brandId]);

  useEffect(() => {
    if (!brandId) return;
    (async () => { try { const d = await getDoc(doc(db, 'brands', brandId)); if (d.exists()) setVaultSettings(d.data()?.vaultSettings || {}); } catch {} })();
  }, [brandId]);

  const saveSettings = async (updated: VaultSettings) => {
    if (!brandId) return;
    setSavingSettings(true);
    try { await updateDoc(doc(db, 'brands', brandId), { vaultSettings: updated }); setVaultSettings(updated); toast.success('Salvo!'); }
    catch { toast.error('Erro ao salvar.'); }
    finally { setSavingSettings(false); }
  };

  const toggleSetting = (key: keyof VaultSettings, value: boolean | number) => saveSettings({ ...vaultSettings, [key]: value });

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
              Vault
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={handleRunAutopilot} disabled={runningAutopilot} className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-3 py-2 transition-colors disabled:opacity-50 flex items-center gap-2">
                {runningAutopilot ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {runningAutopilot ? 'PROCESSANDO' : 'AUTOPILOT'}
              </button>
              <button onClick={() => { setShowHistory(true); loadHistory(); }} className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-3 py-2 transition-colors">
                HISTÓRICO
              </button>
              <button onClick={() => setShowDNAWizard(true)} className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-3 py-2 transition-colors">
                NOVO DNA
              </button>
              <Popover open={showNewAssetMenu} onOpenChange={setShowNewAssetMenu}>
                <PopoverTrigger asChild>
                  <button className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors">
                    + NOVO ATIVO
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 bg-[#1A1612] border-white/[0.06] p-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono text-[#CAB792] hover:text-[#F5E8CE] hover:bg-white/[0.04] transition-colors" onClick={() => { setShowNewAssetMenu(false); setShowDNAWizard(true); }}>
                    DNA Template
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono text-[#CAB792] hover:text-[#F5E8CE] hover:bg-white/[0.04] transition-colors" onClick={() => { setShowNewAssetMenu(false); router.push('/assets'); }}>
                    Upload de Mídia
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono text-[#CAB792] hover:text-[#F5E8CE] hover:bg-white/[0.04] transition-colors" onClick={async () => {
                    setShowNewAssetMenu(false); if (!brandId) { toast.error('Selecione uma marca.'); return; }
                    try { await saveVaultContent(brandId, { id: '', sourceInsightId: '', status: 'draft' as const, variants: [{ platform: 'instagram' as any, copy: '', mediaRefs: [], metadata: {} }], approvalChain: {} }); toast.success('Rascunho criado.'); loadVaultData(); } catch { toast.error('Erro.'); }
                  }}>
                    Post Manual
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 border border-white/[0.06] divide-x divide-white/[0.06] mb-8">
            <div className="px-6 py-4 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Aprovados</p>
              <p className="text-[28px] font-mono font-black tabular-nums text-[#E6B447] leading-none">{libraryItems.length}</p>
            </div>
            <div className="px-6 py-4 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">DNA Templates</p>
              <p className="text-[28px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{dnaItems.length}</p>
            </div>
            <div className="px-6 py-4 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Review</p>
              <p className="text-[28px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{reviewItems.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-0 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-5 py-3 text-[11px] font-mono tracking-wider transition-colors border-b-2',
                  tab === t.id ? 'text-[#E6B447] border-[#E6B447] font-bold' : 'text-[#6B5D4A] border-transparent hover:text-[#CAB792]'
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {tab === 'review' && (
          reviewItems.length > 0 ? (
            <ApprovalWorkspace content={reviewItems[0]} insightText="" onApprove={handleApprove} onEdit={handleEdit} />
          ) : (
            <div className="border border-white/[0.06] bg-[#0D0B09] py-16 text-center">
              <p className="text-lg font-bold text-[#F5E8CE] mb-1">Tudo em ordem</p>
              <p className="text-sm text-[#6B5D4A] max-w-md mx-auto mb-6">
                Nenhum conteúdo aguardando revisão. Use o Autopilot para gerar novos.
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setTab('explorer')} className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-4 py-2 transition-colors">
                  EXPLORAR BIBLIOTECA
                </button>
                <button onClick={handleRunAutopilot} disabled={runningAutopilot} className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {runningAutopilot && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  RUN AUTOPILOT
                </button>
              </div>
            </div>
          )
        )}

        {tab === 'explorer' && (
          <VaultExplorer dnaItems={dnaItems} libraryItems={libraryItems} assets={assets} onUseItem={() => toast.info('Preparando conteúdo...')} />
        )}

        {tab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.06]">
            {/* Autopilot */}
            <div className="bg-[#0D0B09] p-6 space-y-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Content Autopilot</p>
              <p className="text-[13px] text-[#CAB792]">
                Coleta insights do Social Monitor, Spy Agent e Keywords Miner para gerar conteúdo adaptado.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="text-[12px] text-[#F5E8CE]">Execução Manual</span>
                  <span className="text-[10px] font-mono text-[#E6B447]">ATIVO</span>
                </div>
                <button onClick={() => toggleSetting('autopilotEnabled', !vaultSettings.autopilotEnabled)} disabled={savingSettings} className="flex items-center justify-between w-full py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors text-left">
                  <span className="text-[12px] text-[#F5E8CE]">CRON Automático (6h)</span>
                  <span className={cn("text-[10px] font-mono", vaultSettings.autopilotEnabled ? "text-[#E6B447]" : "text-[#6B5D4A]")}>
                    {vaultSettings.autopilotEnabled ? 'ATIVO' : 'OFF'}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-[#6B5D4A]">2 créditos por conteúdo adaptado.</p>
            </div>

            {/* Preferences */}
            <div className="bg-[#0D0B09] p-6 space-y-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Preferências</p>
              <div className="space-y-2">
                <button onClick={() => toggleSetting('autoApproveThreshold', !vaultSettings.autoApproveThreshold ? 80 as any : 0 as any)} disabled={savingSettings} className="flex items-center justify-between w-full py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors text-left">
                  <span className="text-[12px] text-[#F5E8CE]">
                    Aprovação automática {Number(vaultSettings.autoApproveThreshold) > 0 ? `(≥${vaultSettings.autoApproveThreshold}%)` : ''}
                  </span>
                  <span className={cn("text-[10px] font-mono", Number(vaultSettings.autoApproveThreshold) > 0 ? "text-[#E6B447]" : "text-[#6B5D4A]")}>
                    {Number(vaultSettings.autoApproveThreshold) > 0 ? 'ATIVO' : 'OFF'}
                  </span>
                </button>
                <button onClick={() => toggleSetting('notifyOnNewContent', !vaultSettings.notifyOnNewContent)} disabled={savingSettings} className="flex items-center justify-between w-full py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors text-left">
                  <span className="text-[12px] text-[#F5E8CE]">Notificar novo conteúdo</span>
                  <span className={cn("text-[10px] font-mono", vaultSettings.notifyOnNewContent ? "text-[#E6B447]" : "text-[#6B5D4A]")}>
                    {vaultSettings.notifyOnNewContent ? 'ATIVO' : 'OFF'}
                  </span>
                </button>
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04] opacity-40">
                  <span className="text-[12px] text-[#F5E8CE]">Publicação direta</span>
                  <span className="text-[10px] font-mono text-[#6B5D4A]">REQUER OAUTH</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showDNAWizard && <DNAWizard onClose={() => setShowDNAWizard(false)} onSaved={() => loadVaultData()} />}

      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent className="bg-[#0D0B09] border-white/[0.06] w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-[#F5E8CE] text-sm font-mono uppercase tracking-wider">Histórico</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
            {loadingHistory ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#6B5D4A]" /></div>
            ) : historyItems.length === 0 ? (
              <p className="text-sm text-[#6B5D4A] text-center py-12">Nenhum item.</p>
            ) : (
              historyItems.map((item) => (
                <div key={item.id} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#F5E8CE] truncate max-w-[240px]">
                      {item.variants?.[0]?.copy?.slice(0, 60) || 'Sem texto'}{(item.variants?.[0]?.copy?.length || 0) > 60 ? '...' : ''}
                    </span>
                    <span className={cn("text-[9px] font-mono uppercase tracking-wider", item.status === 'approved' ? 'text-[#E6B447]' : 'text-[#C45B3A]')}>
                      {item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B5D4A] font-mono">
                    <span>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'}</span>
                    {item.variants?.map(v => <span key={v.platform} className="uppercase">{v.platform}</span>)}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
