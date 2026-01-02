'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetUploader } from '@/components/brands/asset-uploader';
import { 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Loader2,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useBrands } from '@/lib/hooks/use-brands';
import { getBrandAssets, deleteAsset } from '@/lib/firebase/assets';
import type { BrandAsset } from '@/types/database';

/**
 * Página de Gerenciamento de Assets da Marca.
 * Permite upload, visualização e exclusão de arquivos.
 */
export default function BrandAssetsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  
  const { brands, isLoading: loadingBrands } = useBrands();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Erro ao deletar asset:', error);
      alert('Erro ao deletar arquivo. Tente novamente.');
    } finally {
      setDeletingAssetId(null);
    }
  };

  // Helper: Ícone do tipo de arquivo
  const getFileIcon = (mimeType: string) => {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📁 Arquivos da Marca
          </h1>
          <p className="text-zinc-500">
            {brand.name} • {assets.length} {assets.length === 1 ? 'arquivo' : 'arquivos'}
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <AssetUploader 
            brandId={brandId} 
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Assets List */}
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
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] text-emerald-500">
                    {getFileIcon(asset.mimeType)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-white truncate">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-zinc-500 truncate">
                          {asset.originalName}
                        </p>
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
      </main>
    </div>
  );
}

