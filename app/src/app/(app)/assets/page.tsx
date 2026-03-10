'use client';

import { useState } from 'react';
import { useAssetMetrics } from '@/lib/hooks/use-asset-metrics';
import { AssetMetricsSummary } from '@/components/assets/metrics-summary';
import { AssetMetricsTable } from '@/components/assets/metrics-table';
import {
  RefreshCw,
  Filter,
  Search,
  LayoutGrid,
  List,
  Plus,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { AssetUploader } from '@/components/brands/asset-uploader';
import { useAuthStore } from '@/lib/stores/auth-store';
import { uploadBrandAsset } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { Timestamp } from 'firebase/firestore';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

export default function AssetsPage() {
  const { user } = useAuthStore();
  const { assets, summary, isLoading, refresh, activeBrand } = useAssetMetrics();
  const [filterType, setFilterType] = useState<'all' | 'visual' | 'knowledge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === 'all' || asset.namespace === filterType;
    const matchesSearch = searchQuery === '' ||
      (asset.name || asset.assetType).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.strategicAdvice || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleProcessAsset = async (assetId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/ingest/process-worker', {
        method: 'POST',
        headers,
        body: JSON.stringify({ assetId, namespace: `brand_${activeBrand?.id}` }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erro no processamento remoto.');
      }

      await refresh();
      toast.success('Arquivo vetorizado com sucesso!');
    } catch (err) {
      console.error('Erro ao processar asset:', err);
      // Always refresh so the newly created asset appears in the list
      await refresh();
      toast.error('O upload foi feito, mas o processamento falhou.');
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!user || !activeBrand) return;

    const toastId = toast.loading(`Fazendo upload de ${file.name}...`);
    setIsProcessing(true);

    try {
      const { url } = await uploadBrandAsset(file, activeBrand.id, user.uid);

      const assetId = await createAsset({
        brandId: activeBrand.id,
        userId: user.uid,
        name: file.name,
        originalName: file.name,
        type: file.type.includes('pdf') ? 'guideline' : (file.type.startsWith('image/') ? 'image' : 'other'),
        mimeType: file.type,
        size: file.size,
        url,
        status: 'uploaded',
        isApprovedForAI: true,
        createdAt: Timestamp.now(),
      });

      toast.loading('Iniciando extração e vetorização...', { id: toastId });
      await handleProcessAsset(assetId);
      setIsUploadModalOpen(false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Erro no upload:', err);
      toast.error('Falha ao subir arquivo.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddUrl = async (url: string) => {
    if (!user || !activeBrand) return;

    const toastId = toast.loading(`Adicionando URL estratégica...`);
    setIsProcessing(true);

    try {
      const assetId = await createAsset({
        brandId: activeBrand.id,
        userId: user.uid,
        name: url.replace(/^https?:\/\//, '').split('/')[0],
        originalName: url,
        type: 'url',
        mimeType: 'text/html',
        size: 0,
        url,
        sourceUrl: url,
        status: 'uploaded',
        isApprovedForAI: true,
        createdAt: Timestamp.now(),
      });

      toast.loading('Fazendo scraping e vetorização...', { id: toastId });
      await handleProcessAsset(assetId);
      setIsUploadModalOpen(false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Erro ao adicionar URL:', err);
      toast.error('Falha ao adicionar URL.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/assets/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ assetId, brandId: activeBrand?.id }),
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar asset');
      }

      await refresh();
      toast.success('Asset removido com sucesso');
    } catch (err) {
      console.error('Erro ao deletar asset:', err);
      toast.error('Erro ao deletar asset');
    }
  };

  const handleAnalyzeVisual = async (assetId: string, imageUri: string) => {
    if (!user || !activeBrand) return;
    const toastId = toast.loading('Analisando visual com IA...');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/ai/analyze-visual', {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageUri, brandId: activeBrand.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erro na análise visual');
      }
      await refresh();
      toast.success('Análise visual concluída! (-2 créditos)', { id: toastId });
    } catch (err: any) {
      console.error('[Visual] Erro:', err);
      toast.error(err.message || 'Falha na análise visual', { id: toastId });
    }
  };

  const handleExport = () => {
    if (filteredAssets.length === 0) {
      toast.error('Nenhum ativo para exportar');
      return;
    }

    const headers = ['Nome', 'Tipo', 'Score', 'CTR', 'Conversão', 'Namespace', 'Data'];
    const rows = filteredAssets.map(asset => [
      asset.name || asset.assetType,
      asset.assetType,
      asset.score,
      asset.metrics?.ctr ?? '0',
      asset.metrics?.conversion ?? '0',
      asset.namespace,
      new Date(asset.createdAt).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ativos-performance-${activeBrand?.name || 'geral'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exportação concluída');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      {/* Bloomberg inline header */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-6 max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[42px] font-bold tracking-tight text-[#F5E8CE] leading-none">
                Ativos & Performance
              </h1>
              <p className="mt-2 text-[13px] font-mono text-[#6B5D4A]">
                {activeBrand
                  ? `Monitorando performance da marca ${activeBrand.name}`
                  : 'Selecione uma marca para ver as métricas'
                }
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <button
                    disabled={!activeBrand}
                    className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    ADICIONAR ATIVO
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-[#1A1612] border-white/[0.06] sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-[#F5E8CE] flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#E6B447]" />
                      Alimentar Inteligência
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Faça upload de arquivos ou adicione URLs para enriquecer a inteligência da marca.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <AssetUploader
                      brandId={activeBrand?.id || ''}
                      onUploadFile={handleUploadFile}
                      onAddUrl={handleAddUrl}
                    />
                    {isProcessing && (
                      <div className="mt-4 p-4 bg-[#E6B447]/10 border border-[#E6B447]/20 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-[#E6B447] animate-spin" />
                        <p className="text-sm text-[#E6B447]/70 font-mono">Processando conhecimento...</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="h-6 w-px bg-white/[0.06]" />

              <button
                onClick={async () => {
                  const id = toast.loading('Sincronizando ativos...');
                  await refresh();
                  toast.success('Ativos atualizados', { id });
                }}
                disabled={isLoading}
                className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-3 py-2 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                SINCRONIZAR
              </button>
              <button
                onClick={handleExport}
                className="text-[11px] font-mono font-bold tracking-wider text-[#CAB792] border border-white/[0.06] hover:text-[#F5E8CE] px-3 py-2 transition-colors"
              >
                EXPORTAR
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {/* Summary Stats */}
        <AssetMetricsSummary summary={summary} isLoading={isLoading} />

        {/* Filters & Actions Bar */}
        <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border border-white/[0.06]",
                filterType === 'all'
                  ? "bg-white/[0.06] text-[#F5E8CE]"
                  : "text-[#6B5D4A] hover:text-[#CAB792]"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('visual')}
              className={cn(
                "px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border border-white/[0.06] -ml-px",
                filterType === 'visual'
                  ? "bg-[#E6B447]/10 text-[#E6B447]"
                  : "text-[#6B5D4A] hover:text-[#CAB792]"
              )}
            >
              Visual
            </button>
            <button
              onClick={() => setFilterType('knowledge')}
              className={cn(
                "px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border border-white/[0.06] -ml-px",
                filterType === 'knowledge'
                  ? "bg-[#AB8648]/10 text-[#AB8648]"
                  : "text-[#6B5D4A] hover:text-[#CAB792]"
              )}
            >
              Conhecimento
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5D4A]" />
              <input
                type="text"
                placeholder="Buscar por nome ou heurística..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-6 pr-4 bg-transparent border-b border-white/[0.06] text-sm font-mono text-[#F5E8CE] placeholder:text-[#6B5D4A]/60 focus:outline-none focus:border-[#E6B447]/50 transition-colors"
              />
            </div>
            <button className="flex h-10 w-10 items-center justify-center text-[#6B5D4A] hover:text-[#CAB792] transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="border border-white/[0.06] bg-[#1A1612]/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <h3 className="text-[11px] font-mono font-bold text-[#CAB792] uppercase tracking-widest">Ativos Vectorizados</h3>
              <span className="text-[10px] font-mono text-[#6B5D4A]">
                {filteredAssets.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'list' ? "text-[#E6B447]" : "text-[#6B5D4A] hover:text-[#CAB792]"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'grid' ? "text-[#E6B447]" : "text-[#6B5D4A] hover:text-[#CAB792]"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-2">
            <AssetMetricsTable
              assets={filteredAssets}
              isLoading={isLoading}
              viewMode={viewMode}
              onDelete={handleDeleteAsset}
              onAnalyzeVisual={handleAnalyzeVisual}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
