'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Lock, Unlock, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLogo } from '@/lib/firebase/storage';
import { useBrands } from '@/lib/hooks/use-brands';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBrandStore } from '@/lib/stores/brand-store';
import type { Brand, BrandKit, LogoAsset } from '@/types/database';
import { cn } from '@/lib/utils';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
}

export function LogoUploadModal({ isOpen, onClose, brand }: LogoUploadModalProps) {
  const { user } = useAuthStore();
  const { update } = useBrands();
  const { setSelectedBrand } = useBrandStore();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    brand.brandKit?.logoLock?.variants?.primary?.url || null
  );
  const [logoLocked, setLogoLocked] = useState(brand.brandKit?.logoLock?.locked ?? false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['image/svg+xml', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato invalido. Use SVG, PNG ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Maximo: 5MB.');
      return;
    }

    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleRemove = useCallback(() => {
    setLogoFile(null);
    if (previewUrl && !previewUrl.includes('firebasestorage')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleSave = async () => {
    if (!user || !brand.id) {
      toast.error('Erro de autenticacao');
      return;
    }

    setIsUploading(true);

    try {
      let logoUrl = brand.brandKit?.logoLock?.variants?.primary?.url || '';
      let storagePath = brand.brandKit?.logoLock?.variants?.primary?.storagePath || '';

      // Upload new logo if file selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, brand.id, user.uid);
        storagePath = `brands/${user.uid}/${brand.id}/logos/${logoFile.name}`;
      }

      // Determine format from file or existing
      const format = logoFile
        ? (logoFile.type === 'image/svg+xml' ? 'svg' : logoFile.type === 'image/png' ? 'png' : 'webp')
        : (brand.brandKit?.logoLock?.variants?.primary?.format || 'png');

      // Build updated brandKit
      const primaryLogo: LogoAsset = {
        url: logoUrl,
        storagePath,
        format: format as 'svg' | 'png' | 'webp',
      };

      const updatedBrandKit: BrandKit = {
        ...brand.brandKit,
        colors: brand.brandKit?.colors || {
          primary: '#E6B447',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          background: '#09090b',
        },
        typography: brand.brandKit?.typography || {
          primaryFont: 'Inter',
          secondaryFont: 'Inter',
          systemFallback: 'sans-serif',
        },
        visualStyle: brand.brandKit?.visualStyle || 'modern',
        logoLock: {
          variants: {
            ...brand.brandKit?.logoLock?.variants,
            primary: primaryLogo,
          },
          locked: logoLocked,
        },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      };

      // Update brand
      await update(brand.id, { brandKit: updatedBrandKit });

      // Update selected brand in store
      setSelectedBrand({
        ...brand,
        brandKit: updatedBrandKit,
      });

      toast.success('Logo atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload do logo.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-zinc-900 border border-white/[0.06] p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Logo da Marca</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Faca upload do logo oficial
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload Area */}
          <div
            className={cn(
              'relative aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden mb-6',
              previewUrl
                ? 'border-[#E6B447]/30 bg-black'
                : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.01] bg-white/[0.02]'
            )}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-h-[70%] max-w-[80%] object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-zinc-500" />
                </div>
                <p className="text-sm text-zinc-400 mb-1">Arraste ou clique para upload</p>
                <p className="text-[10px] text-zinc-600">SVG, PNG ou WebP (max 5MB)</p>
                <input
                  type="file"
                  accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </>
            )}
          </div>

          {/* Logo Lock Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
            <div className="flex items-center gap-3">
              {logoLocked ? (
                <Lock className="h-5 w-5 text-[#E6B447]" />
              ) : (
                <Unlock className="h-5 w-5 text-zinc-500" />
              )}
              <div>
                <p className="text-sm font-medium text-white">Logo Lock</p>
                <p className="text-[10px] text-zinc-500">A IA nao podera alterar o logo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLogoLocked(!logoLocked)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                logoLocked ? 'bg-[#E6B447]' : 'bg-zinc-700'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  logoLocked ? 'translate-x-[22px]' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.1] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading || (!logoFile && !previewUrl)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
