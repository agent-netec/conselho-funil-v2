'use client';

// A página depende de dados dinâmicos (brandId, assets, uploads).
// Forçamos rendering dinâmico para evitar prerender estático incorreto.
export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssetUploader } from '@/components/brands/asset-uploader';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Loader2,
  File,
  CheckCircle,
  Clock,
  Eye,
  FileDown,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Palette
} from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getBrandAssets, deleteAsset, toggleAssetApproval, createAsset } from '@/lib/firebase/assets';
import { Timestamp } from 'firebase/firestore';
import type { BrandAsset } from '@/types/database';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Página de Gerenciamento de Assets da Marca.
 * Permite upload, visualização e exclusão de arquivos.
 */
export default function BrandAssetsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const { brands, isLoading: loadingBrands } = useBrands();
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [upscalingAssetId, setUpscalingAssetId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<BrandAsset | null>(null);

  const brand = brands.find(b => b.id === brandId);

  // Carrega assets da marca
  const loadAssets = async () => {
    try {
      setIsLoadingAssets(true);
      const data = await getBrandAssets(brandId);
      setAssets(data);
    } catch (error) {
      console.error('Erro ao carregar assets:', error);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (brandId) {
      loadAssets();
    }
  }, [brandId]);

  // Handler de upload completo
  const handleUploadComplete = (asset: BrandAsset) => {
    setAssets(prev => [asset, ...prev]);
  };

  // Handler de delete
  const handleDelete = async (assetId: string, storageUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      setDeletingAssetId(assetId);
      await deleteAsset(assetId, storageUrl);
      setAssets(prev => prev.filter(a => a.id !== assetId));
      toast.success('Arquivo excluído com sucesso');
    } catch (error) {
      console.error('Erro ao deletar asset:', error);
      toast.error('Erro ao deletar arquivo');
    } finally {
      setDeletingAssetId(null);
    }
  };

  // Handler de aprovação para IA
  const handleToggleApproval = async (asset: BrandAsset) => {
    if (!user) return;

    try {
      const newStatus = !asset.isApprovedForAI;
      await toggleAssetApproval(asset.id, newStatus, user.uid);
      
      setAssets(prev => prev.map(a => 
        a.id === asset.id ? { ...a, isApprovedForAI: newStatus } : a
      ));

      toast.success(newStatus ? 'Asset liberado para a IA' : 'Asset removido da IA');
    } catch (error) {
      console.error('Erro ao alternar aprovação:', error);
      toast.error('Erro ao atualizar status de aprovação');
    }
  };

  const handleUpscale = async (asset: BrandAsset) => {
    try {
      setUpscalingAssetId(asset.id);
      
      const response = await fetch('/api/design/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: asset.url,
          factor: 2
        }),
      });

      if (!response.ok) throw new Error('Falha no Upscale');

      const data = await response.json();
      if (data.success) {
        // Criar novo asset com versão HD
        const newAsset: Omit<BrandAsset, 'id'> = {
          brandId: asset.brandId,
          userId: asset.userId,
          name: `${asset.name} (HD 2x)`,
          originalName: `hd_${asset.originalName}`,
          type: 'image',
          mimeType: 'image/webp',
          size: 0,
          url: data.upscaledUrl,
          status: 'ready',
          isApprovedForAI: false, // US-18.3: Gate de governança (false por padrão, requer nova aprovação)
          createdAt: Timestamp.now(),
          description: `Versão HD gerada via Upscale 2x. Original: ${asset.name}`,
          tags: [...(asset.tags || []), 'upscaled']
        };

        const newId = await createAsset(newAsset);
        const fullNewAsset = { ...newAsset, id: newId } as BrandAsset;
        
        setAssets(prev => [fullNewAsset, ...prev]);
        toast.success('Versão HD gerada com sucesso!');
      }
    } catch (error) {
      console.error('Upscale error:', error);
      toast.error('Erro ao processar upscale da imagem');
    } finally {
      setUpscalingAssetId(null);
    }
  };

  // Helper: Ícone do tipo de arquivo
  const getFileIcon = (mimeType: string, assetType?: string) => {
    // URLs têm ícone especial
    if (assetType === 'url') {
      return <LinkIcon className="h-5 w-5" />;
    }
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  // Helper: Badge de status
  const getStatusBadge = (status: BrandAsset['status']) => {
    switch (status) {
      case 'uploaded':
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            Processando
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pronto
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return null;
    }
  };

  // Helper: Formata tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading
  if (loadingBrands || isLoadingAssets) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Carregando arquivos...</p>
        </div>
      </div>
    );
  }

  // Marca não encontrada
  if (!brand) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Marca não encontrada</h2>
          <Button onClick={() => router.push('/brands')}>
            Voltar para Marcas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header showBrandSelector={false} />
      
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/brands')}
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Marcas
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              📁 Arquivos da Marca
            </h1>
            <p className="text-zinc-500">
              {brand.name} • {assets.length} {assets.length === 1 ? 'arquivo' : 'arquivos'}
            </p>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => router.push(`/brands/${brandId}`)}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 shrink-0"
          >
            <Palette className="mr-2 h-4 w-4" />
            Configurar Identidade (BrandKit)
          </Button>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <ErrorBoundary>
            <AssetUploader 
              brandId={brandId} 
              onUploadComplete={handleUploadComplete}
            />
          </ErrorBoundary>
        </div>

        {/* Assets List */}
        <ErrorBoundary>
          <div className="space-y-4">
          {assets.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
              <File className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum arquivo ainda
              </h3>
              <p className="text-sm text-zinc-500">
                Faça upload de guidelines, brand books ou outros documentos da marca.
              </p>
            </div>
          ) : (
            assets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-emerald-500 overflow-hidden relative group/img">
                    {asset.type === 'image' || asset.mimeType.startsWith('image/') ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className={cn(
                            "h-12 w-12 object-cover transition-opacity",
                            upscalingAssetId === asset.id ? "opacity-30" : "opacity-100"
                          )}
                          loading="lazy"
                        />
                        {upscalingAssetId === asset.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      getFileIcon(asset.mimeType, asset.type)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-white truncate">
                          {asset.name}
                        </h3>
                        {asset.type === 'url' && asset.sourceUrl ? (
                          <a
                            href={asset.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-500 hover:text-emerald-400 truncate block"
                          >
                            {asset.sourceUrl}
                          </a>
                        ) : (
                          <p className="text-sm text-zinc-500 truncate">
                            {asset.originalName}
                          </p>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      {getStatusBadge(asset.status)}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-zinc-600">
                      <span>{formatFileSize(asset.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{asset.type.replace('_', ' ')}</span>
                      {asset.chunkCount !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-500/80 font-medium">
                            {asset.chunkCount} chunks
                          </span>
                        </>
                      )}
                      {asset.createdAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(asset.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Error Message */}
                    {asset.status === 'error' && asset.processingError && (
                      <p className="mt-2 text-sm text-red-400">
                        {asset.processingError}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(asset.type === 'image' || asset.mimeType.startsWith('image/')) && !asset.name.includes('(HD') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleUpscale(asset)}
                              disabled={upscalingAssetId === asset.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:text-purple-300 hover:border-purple-500/40 transition-colors disabled:opacity-50"
                              aria-label="Gerar versão HD"
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gerar versão HD (Upscale 2x)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleToggleApproval(asset)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                              asset.isApprovedForAI 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-white'
                            }`}
                            aria-label={asset.isApprovedForAI ? "Remover da IA" : "Aprovar para IA"}
                          >
                            <CheckCircle className={`h-4 w-4 ${asset.isApprovedForAI ? 'fill-emerald-500/20' : ''}`} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{asset.isApprovedForAI ? 'Aprovado para IA' : 'Clique para aprovar para IA'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {asset.extractedText && (
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                        aria-label="Ver preview"
                        title="Ver texto extraído"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(asset.id, asset.url)}
                      disabled={deletingAssetId === asset.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors disabled:opacity-50"
                      aria-label="Deletar arquivo"
                    >
                      {deletingAssetId === asset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </ErrorBoundary>
      </main>

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-3xl bg-zinc-950 border-white/[0.04] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-white text-base">
                    Preview: {previewAsset?.name}
                  </DialogTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Conteúdo extraído para inteligência do RAG
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={previewAsset?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Abrir Original
                </a>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[65vh] p-8 bg-zinc-900/30">
            {previewAsset?.extractedText ? (
              <div className="max-w-none">
                <MarkdownRenderer content={previewAsset.extractedText} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <AlertCircle className="h-10 w-10 text-zinc-800 mb-3" />
                <p className="text-zinc-500 font-medium">Texto extraído não disponível.</p>
                <p className="text-xs text-zinc-700 mt-1">O arquivo pode ainda estar sendo processado ou não contém texto extraível.</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t border-white/[0.04] bg-zinc-950/50 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setPreviewAsset(null)}
              className="text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            >
              Fechar Visualização
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

