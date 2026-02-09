'use client';

import { useState, useCallback } from 'react';
import { fileToBase64 } from '@/lib/utils';
import { uploadBrandAsset, validateBrandAssetFile } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';
import { Timestamp } from 'firebase/firestore';

export interface Attachment {
  file: File;
  id: string;
  status: 'uploading' | 'analyzing' | 'ready' | 'error';
  progress: number;
  previewUrl?: string;
  insight?: string;
  error?: string;
}

export interface UseFileUploadReturn {
  attachments: Attachment[];
  isUploading: boolean;
  handleFileSelect: (files: FileList | null) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export function useFileUpload(
  brandId: string | null,
  userId: string | null
): UseFileUploadReturn {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const isUploading = attachments.some(
    (a) => a.status === 'uploading' || a.status === 'analyzing'
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || !brandId || !userId) return;

      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: 'uploading' as const,
        progress: 0,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);

      // Process each file
      newAttachments.forEach(async (attachment) => {
        try {
          // 1. Validar
          const validation = validateBrandAssetFile(attachment.file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // 2. Upload para Storage
          const { url } = await uploadBrandAsset(
            attachment.file,
            brandId,
            userId,
            (progress) => {
              setAttachments((prev) =>
                prev.map((a) =>
                  a.id === attachment.id ? { ...a, progress } : a
                )
              );
            }
          );

          // 3. Criar registro no Firestore (US-21.2)
          await createAsset({
            brandId,
            userId,
            name: attachment.file.name,
            originalName: attachment.file.name,
            type: attachment.file.type.startsWith('image/')
              ? 'image'
              : 'reference',
            mimeType: attachment.file.type,
            size: attachment.file.size,
            url,
            status: 'ready',
            isApprovedForAI: true, // Auto-aprovado para chat (como solicitado)
            createdAt: Timestamp.now(),
            metadata: {
              sourceType: attachment.file.type.startsWith('image/')
                ? 'image'
                : 'pdf',
              originalName: attachment.file.name,
              isApprovedForAI: true,
              extractedAt: new Date().toISOString(),
              processingMethod: 'gemini-vision',
            },
          });

          // 4. Análise Multimodal (Insights Imediatos)
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id ? { ...a, status: 'analyzing' } : a
            )
          );

          const base64 = await fileToBase64(attachment.file);
          const prompt = attachment.file.type.startsWith('image/')
            ? 'Analise esta imagem sob a perspectiva de um estrategista de funis. Identifique elementos de conversão, copy, design e pontos de melhoria. Seja conciso e direto.'
            : 'Analise este documento PDF. Extraia os pontos estratégicos mais relevantes para um conselho de marketing. Seja conciso.';

          const insight = await analyzeMultimodalWithGemini(
            prompt,
            base64,
            attachment.file.type
          );

          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id ? { ...a, status: 'ready', insight } : a
            )
          );
        } catch (error) {
          console.error('Erro ao processar anexo:', error);
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? {
                    ...a,
                    status: 'error',
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Erro no upload',
                  }
                : a
            )
          );
        }
      });
    },
    [brandId, userId]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      // Clean up object URLs
      const removed = prev.find((a) => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      // Clean up all object URLs
      prev.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
      return [];
    });
  }, []);

  return {
    attachments,
    isUploading,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  };
}
