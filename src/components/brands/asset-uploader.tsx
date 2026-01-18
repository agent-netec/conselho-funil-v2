'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Globe, Loader2, Plus } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadBrandAsset, validateBrandAssetFile } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { BrandAsset } from '@/types/database';

interface AssetUploaderProps {
  brandId: string;
  onUploadComplete?: (asset: BrandAsset) => void;
  onUploadFile?: (file: File) => Promise<void>;
  onAddUrl?: (url: string) => Promise<void>;
}

export function AssetUploader({ brandId, onUploadComplete, onUploadFile, onAddUrl }: AssetUploaderProps) {
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const buildAssetPayload = (file: File, storageUrl: string): Omit<BrandAsset, 'id'> => {
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|webp|svg)$/i);
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const sourceType = isImage ? 'image' : isPdf ? 'pdf' : 'text';

    return {
      brandId,
      userId: user?.uid ?? '',
      name: file.name,
      originalName: file.name,
      type: isImage ? 'image' : 'reference',
      mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
      size: file.size,
      url: storageUrl,
      status: 'uploaded',
      isApprovedForAI: false,
      createdAt: Timestamp.now(),
      metadata: {
        sourceType,
        originalName: file.name,
        isApprovedForAI: false,
        extractedAt: new Date().toISOString(),
        processingMethod: isImage ? 'gemini-vision' : 'readability',
      },
    };
  };

  const handleFilesUpload = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || isUploading) return;
    if (!user) {
      toast.error('Você precisa estar autenticado para enviar arquivos.');
      return;
    }
    if (!brandId) {
      toast.error('Marca não identificada para o upload.');
      return;
    }

    setIsUploading(true);
    try {
      if (onUploadFile) {
        for (const file of acceptedFiles) {
          await onUploadFile(file);
        }
        return;
      }

      for (const file of acceptedFiles) {
        const validation = validateBrandAssetFile(file);
        if (!validation.valid) {
          toast.error(validation.error ?? 'Arquivo inválido para upload.');
          continue;
        }

        const { url: storageUrl } = await uploadBrandAsset(
          file,
          brandId,
          user.uid,
          (progress) => setUploadProgress(progress)
        );

        const assetPayload = buildAssetPayload(file, storageUrl);
        const assetId = await createAsset(assetPayload);

        onUploadComplete?.({ ...assetPayload, id: assetId });
        toast.success(`${file.name} enviado com sucesso`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Falha ao fazer upload do arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [brandId, isUploading, onUploadComplete, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/x-pdf': ['.pdf'],
      'application/vnd.pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isAddingUrl) return;
    if (!user) {
      toast.error('Você precisa estar autenticado para adicionar uma URL.');
      return;
    }
    if (!brandId) {
      toast.error('Marca não identificada para associar a URL.');
      return;
    }

    setIsAddingUrl(true);
    try {
      if (onAddUrl) {
        await onAddUrl(url);
        setUrl('');
        return;
      }

      const assetPayload: Omit<BrandAsset, 'id'> = {
        brandId,
        userId: user.uid,
        name: url,
        originalName: url,
        type: 'url',
        mimeType: 'text/html',
        size: 0,
        url,
        sourceUrl: url,
        status: 'uploaded',
        isApprovedForAI: false,
        createdAt: Timestamp.now(),
        metadata: {
          sourceType: 'url',
          sourceUrl: url,
          originalName: url,
          isApprovedForAI: false,
          extractedAt: new Date().toISOString(),
          processingMethod: 'readability',
        },
      };

      const assetId = await createAsset(assetPayload);
      onUploadComplete?.({ ...assetPayload, id: assetId });
      setUrl('');
      toast.success('URL adicionada com sucesso');
    } catch (error) {
      console.error('URL error:', error);
      toast.error('Não foi possível adicionar a URL.');
    } finally {
      setIsAddingUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload de Arquivos */}
      <div
        {...getRootProps()}
        className={cn(
          "relative group aspect-[21/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
          isDragActive 
            ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]" 
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center p-6">
          <div className={cn(
            "h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
            isDragActive && "bg-emerald-500/10"
          )}>
            {isUploading ? (
              <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
            ) : (
              <Upload className={cn("h-7 w-7 text-zinc-500", isDragActive && "text-emerald-500")} />
            )}
          </div>
          <h3 className="text-white font-medium">Upload de Documentos Estratégicos</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-[300px]">
            Arraste PDFs, Manuais ou Assets para alimentar o cérebro da sua marca.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">PDF, DOCX</span>
            <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">TXT, MD</span>
            <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">Máx 10MB</span>
          </div>
          {uploadProgress !== null && (
            <p className="mt-3 text-xs text-emerald-400">Progresso: {uploadProgress}%</p>
          )}
        </div>
      </div>

      {/* Adicionar URL */}
      <form onSubmit={handleUrlSubmit} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Globe className="h-5 w-5 text-zinc-500" />
        </div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sua-landing-page.com/sobre-nos"
          className="pl-12 pr-32 h-14 bg-white/[0.03] border-white/[0.08] text-white rounded-xl focus:ring-emerald-500/20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button 
            type="submit"
            disabled={!url || isAddingUrl}
            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg h-10"
          >
            {isAddingUrl ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar URL
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
