'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { useAssetMetrics } from '@/lib/hooks/use-asset-metrics';
import { AssetMetricsSummary } from '@/components/assets/metrics-summary';
import { AssetMetricsTable } from '@/components/assets/metrics-table';
import { 
  RefreshCw, 
  Filter, 
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Plus,
  Loader2,
  FileText,
  Globe,
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
import { Button } from '@/components/ui/button';
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
      asset.metrics.ctr,
      asset.metrics.conversion,
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
    <div className="flex min-h-screen flex-col">
      <Header title="Ativos & Performance" />

      <div className="flex-1 p-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Inteligência de Ativos
            </h2>
            <p className="text-sm text-zinc-400">
              {activeBrand 
                ? `Monitorando performance da marca ${activeBrand.name}`
                : 'Selecione uma marca para ver as métricas'
              }
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogTrigger asChild>
                <button 
                  disabled={!activeBrand}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-sm font-bold text-black hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Ativo</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/[0.05] sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
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
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                      <p className="text-sm text-emerald-200">Processando conhecimento...</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div className="h-8 w-px bg-white/[0.05] mx-1" />

            <button 
              onClick={async () => {
                const id = toast.loading('Sincronizando ativos...');
                await refresh();
                toast.success('Ativos atualizados', { id });
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all border border-white/[0.05]"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span>Sincronizar</span>
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all border border-white/[0.05]"
            >
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <AssetMetricsSummary summary={summary} isLoading={isLoading} />

        {/* Filters & Actions Bar */}
        <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/80 border border-white/[0.04]">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filterType === 'all' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('visual')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filterType === 'visual' ? "bg-purple-500/20 text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Visual
            </button>
            <button
              onClick={() => setFilterType('knowledge')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filterType === 'knowledge' ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Conhecimento
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Buscar por nome ou heurística..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-white/[0.05] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.04] bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Ativos Vectorizados</h3>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                {filteredAssets.length}
              </span>
            </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
