'use client';

import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, File, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/stores/auth-store';
import { uploadBrandAsset, validateBrandAssetFile } from '@/lib/firebase/storage';
import { createAsset, processAsset } from '@/lib/firebase/assets';
import type { BrandAsset } from '@/types/database';

interface AssetUploaderProps {
  brandId: string;
  onUploadComplete?: (asset: BrandAsset) => void;
  onUploadError?: (error: Error) => void;
}

/**
 * Componente de upload de arquivos para brand assets.
 * Suporta drag & drop e seleção por click.
 */
export function AssetUploader({ brandId, onUploadComplete, onUploadError }: AssetUploaderProps) {
  const { user } = useAuthStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers de Drag & Drop
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handler de Click
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Upload do arquivo
  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validação do arquivo
    const validation = validateBrandAssetFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo inválido');
      onUploadError?.(new Error(validation.error));
      return;
    }

    try {
      setIsUploading(true);
      setUploadingFileName(file.name);
      setUploadProgress(0);

      // Upload para o Storage
      const { url } = await uploadBrandAsset(
        file,
        brandId,
        user.uid,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Criar registro no Firestore
      const assetData: Omit<BrandAsset, 'id'> = {
        brandId,
        userId: user.uid,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
        originalName: file.name,
        type: 'other', // Default, usuário pode editar depois
        mimeType: file.type,
        size: file.size,
        url,
        status: 'uploaded',
        createdAt: Timestamp.now(),
      };

      const assetId = await createAsset(assetData);

      // Callback de sucesso
      const createdAsset: BrandAsset = { id: assetId, ...assetData };
      onUploadComplete?.(createdAsset);

      toast.success('Arquivo enviado com sucesso!');
      
      // Disparar processamento automático para PDFs (não bloqueia a UI)
      if (file.type === 'application/pdf') {
        toast.info('Processando PDF...', { duration: 2000 });
        processAsset(assetId).catch((error) => {
          console.error('Erro ao processar PDF:', error);
          // Não exibe toast de erro aqui pois o status 'error' já estará no Firestore
        });
      }
      
      // Reset do estado
      setUploadProgress(0);
      setUploadingFileName('');
      
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
      onUploadError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-500/5' 
            : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.24] hover:bg-white/[0.04]'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10"
            >
              <Upload className="h-6 w-6 text-emerald-500 animate-pulse" />
            </motion.div>
          ) : (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <Upload className="h-6 w-6 text-zinc-400" />
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-white">
              {isUploading ? 'Enviando arquivo...' : 'Arraste ou clique para selecionar'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              PDF, DOC, DOCX, TXT, MD, PNG, JPG, WEBP
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Máximo: 10MB (docs) / 5MB (imagens)
            </p>
          </div>
        </div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center"
            >
              <p className="text-emerald-400 font-medium">Solte o arquivo aqui</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <File className="h-5 w-5 text-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {uploadingFileName}
                </p>
                <p className="text-xs text-zinc-500">
                  {uploadProgress}% concluído
                </p>
              </div>
            </div>
            
            <Progress value={uploadProgress} className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

