'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadBrandAsset } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { useUser } from '@/lib/hooks/use-user';
import { Timestamp } from 'firebase/firestore';
import type { InspirationRef } from '@/types/design-system';

interface InspirationUploaderProps {
  brandId: string;
  inspirations: InspirationRef[];
  onUpdate: (refs: InspirationRef[]) => void;
  maxItems?: number;
}

const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function InspirationUploader({
  brandId,
  inspirations,
  onUpdate,
  maxItems = 5,
}: InspirationUploaderProps) {
  const { user } = useUser();
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user?.id) {
        toast.error('Você precisa estar logado para enviar referências.');
        return;
      }

      const remaining = maxItems - inspirations.length;
      if (remaining <= 0) {
        toast.error(`Limite de ${maxItems} referências atingido.`);
        return;
      }

      const filesToProcess = acceptedFiles.slice(0, remaining);
      if (filesToProcess.length < acceptedFiles.length) {
        toast.warning(`Apenas ${remaining} arquivo(s) serão enviados (limite: ${maxItems}).`);
      }

      for (const file of filesToProcess) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" excede 5MB. Arquivo ignorado.`);
          continue;
        }

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setUploadingIds((prev) => new Set(prev).add(tempId));

        try {
          // 1. Upload to Firebase Storage
          const { url } = await uploadBrandAsset(file, brandId, user.id);

          // 2. Create asset record in Firestore
          const assetId = await createAsset({
            brandId,
            userId: user.id,
            name: file.name,
            originalName: file.name,
            type: 'image',
            mimeType: file.type,
            size: file.size,
            url,
            status: 'ready',
            isApprovedForAI: true,
            createdAt: Timestamp.now(),
          });

          // 3. Analyze inspiration via API
          let extractedTraits: string[] = [];
          try {
            const headers = await getAuthHeaders();
            const analyzeRes = await fetch('/api/design/analyze-inspiration', {
              method: 'POST',
              headers,
              body: JSON.stringify({ imageUrl: url, brandId }),
            });

            if (analyzeRes.ok) {
              const analyzeData = await analyzeRes.json();
              extractedTraits = analyzeData.data?.traits || analyzeData.traits || [];
            } else {
              console.warn('[InspirationUploader] Análise falhou, continuando sem traits.');
            }
          } catch (analyzeErr) {
            console.warn('[InspirationUploader] Erro na análise de inspiração:', analyzeErr);
          }

          // 4. Build InspirationRef and update parent
          const newRef: InspirationRef = {
            id: `insp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            url,
            assetId,
            extractedTraits,
          };

          onUpdate([...inspirations, newRef]);
          toast.success(`Referência "${file.name}" adicionada.`);
        } catch (err) {
          console.error('[InspirationUploader] Upload failed:', err);
          toast.error(`Falha ao enviar "${file.name}".`);
        } finally {
          setUploadingIds((prev) => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
          });
        }
      }
    },
    [brandId, user?.id, inspirations, onUpdate, maxItems]
  );

  const removeInspiration = useCallback(
    (idToRemove: string) => {
      onUpdate(inspirations.filter((ref) => ref.id !== idToRemove));
      toast.info('Referência removida.');
    },
    [inspirations, onUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: inspirations.length >= maxItems || uploadingIds.size > 0,
    multiple: true,
  });

  const isUploading = uploadingIds.size > 0;
  const isFull = inspirations.length >= maxItems;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
          ${isDragActive
            ? 'border-[#E6B447] bg-[#E6B447]/10'
            : isFull || isUploading
              ? 'border-zinc-700 bg-zinc-900/50 cursor-not-allowed opacity-60'
              : 'border-zinc-700 bg-zinc-900/50 hover:border-[#E6B447]/60 hover:bg-zinc-800/50'
          }
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-[#E6B447] animate-spin" />
            <p className="text-sm text-zinc-400">Enviando e analisando...</p>
          </>
        ) : isFull ? (
          <>
            <ImagePlus className="h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">Limite de {maxItems} referências atingido</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-8 w-8 text-[#E6B447]" />
            <p className="text-sm text-[#E6B447]">Solte as imagens aqui...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              Arraste imagens de referência ou clique para selecionar
            </p>
            <p className="text-xs text-zinc-600">
              PNG, JPG, WEBP — até 5MB cada — {inspirations.length}/{maxItems}
            </p>
          </>
        )}
      </div>

      {/* Thumbnails Grid */}
      {inspirations.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {inspirations.map((ref) => (
            <div
              key={ref.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square">
                <img
                  src={ref.url}
                  alt="Referência de inspiração"
                  className="h-full w-full object-cover"
                />
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInspiration(ref.id)}
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/70 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-900/80"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </Button>
              </div>

              {/* Extracted Traits */}
              {ref.extractedTraits.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2">
                  {ref.extractedTraits.map((trait, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-[#E6B447]/15 px-2 py-0.5 text-[10px] font-medium text-[#E6B447]"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
