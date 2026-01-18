'use client';

import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { AssetUploader } from './asset-uploader';
import { 
  FileText, 
  Globe, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Trash2,
  FileIcon,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BrandAsset } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/lib/stores/auth-store';
import { uploadBrandAsset } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

interface StrategicContextProps {
  brandId: string;
}

export function StrategicContext({ brandId }: StrategicContextProps) {
  const { assets, isLoading } = useBrandAssets(brandId);
  const { user } = useAuthStore();

  const handleProcessAsset = async (assetId: string) => {
    try {
      const response = await fetch('/api/ingest/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, namespace: `brand-${brandId}` }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no processamento remoto.');
      }

      toast.success('Arquivo vetorizado com sucesso!');
    } catch (err) {
      console.error('Erro ao processar asset:', err);
      toast.error('O upload foi feito, mas o processamento falhou.');
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!user) return;

    const toastId = toast.loading(`Fazendo upload de ${file.name}...`);

    try {
      // 1. Upload para Storage
      const { url } = await uploadBrandAsset(file, brandId, user.uid);
      
      // 2. Criar registro no Firestore
      const assetId = await createAsset({
        brandId,
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

      // 3. Disparar Worker
      await handleProcessAsset(assetId);
      
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Erro no upload/processamento:', err);
      toast.error('Falha ao subir arquivo.', { id: toastId });
    }
  };

  const handleAddUrl = async (url: string) => {
    if (!user) return;

    const toastId = toast.loading(`Adicionando URL estratégica...`);

    try {
      // 1. Criar registro no Firestore para URL
      const assetId = await createAsset({
        brandId,
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

      // 2. Disparar Worker (o worker lidará com o scraping se necessário)
      await handleProcessAsset(assetId);
      
      toast.dismiss(toastId);
    } catch (err) {
      console.error('Erro ao adicionar URL:', err);
      toast.error('Falha ao adicionar URL.', { id: toastId });
    }
  };

  const getStatusBadge = (status: BrandAsset['status']) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1.5">
            <Clock className="h-3 w-3 animate-pulse" /> Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5">
            <AlertCircle className="h-3 w-3" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
            Uploaded
          </Badge>
        );
    }
  };

  const getAssetIcon = (type: BrandAsset['type']) => {
    switch (type) {
      case 'url':
        return <Globe className="h-5 w-5 text-blue-400" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-purple-400" />;
      case 'brand_book':
        return <BookOpen className="h-5 w-5 text-amber-400" />;
      default:
        return <FileText className="h-5 w-5 text-zinc-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Esquerda: Ingestão */}
      <div className="lg:col-span-1 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-medium text-lg">Cérebro da Marca</h3>
              <p className="text-zinc-500 text-sm">Alimente a IA com o contexto estratégico.</p>
            </div>
          </div>
          
          <AssetUploader 
            brandId={brandId}
            onUploadFile={handleUploadFile}
            onAddUrl={handleAddUrl}
          />
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Como funciona?</h4>
          <ul className="space-y-3">
            {[
              "Documentos são transformados em vetores (Embeddings).",
              "A IA consulta estes arquivos antes de cada resposta.",
              "Urls são processadas para extrair apenas o texto relevante.",
              "Máxima fidelidade à voz e estratégia da sua marca."
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-xs text-zinc-500 leading-relaxed">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Direita: Lista de Assets */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Assets Indexados ({assets.length})</h3>
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
            Ver Tudo
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full bg-white/[0.02] rounded-xl" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl text-center">
            <div className="h-12 w-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4 text-zinc-600">
              <FileIcon className="h-6 w-6" />
            </div>
            <p className="text-zinc-500 text-sm">Nenhum asset encontrado.</p>
            <p className="text-zinc-600 text-xs mt-1">Comece subindo um PDF ou adicionando uma URL.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {assets.map((asset) => (
              <Card key={asset.id} className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                      {getAssetIcon(asset.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white truncate">{asset.name}</h4>
                        {getStatusBadge(asset.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                        <span className="capitalize">{asset.type}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(asset.createdAt.toDate(), { addSuffix: true, locale: ptBR })}</span>
                        {asset.chunkCount && (
                          <>
                            <span>•</span>
                            <span>{asset.chunkCount} chunks</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.type === 'url' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" asChild>
                          <a href={asset.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/[0.1] text-zinc-300">
                          <DropdownMenuItem 
                            className="hover:bg-white/[0.05] cursor-pointer"
                            onClick={() => handleProcessAsset(asset.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" /> Reprocessar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/[0.05] cursor-pointer">
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" /> Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
