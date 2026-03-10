'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Type, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import type { Brand, BrandKit } from '@/types/database';
import { cn } from '@/lib/utils';

interface VisualIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
}

const COLOR_LABELS: Record<string, string> = {
  primary: 'Primaria',
  secondary: 'Secundaria',
  accent: 'Destaque',
  background: 'Fundo',
};

const VISUAL_STYLES = [
  { id: 'minimalist', label: 'Minimalista', desc: 'Clean e elegante' },
  { id: 'aggressive', label: 'Agressivo', desc: 'Bold e impactante' },
  { id: 'luxury', label: 'Luxo', desc: 'Sofisticado e premium' },
  { id: 'corporate', label: 'Corporativo', desc: 'Profissional e serio' },
  { id: 'modern', label: 'Moderno', desc: 'Atual e dinamico' },
];

export function VisualIdentityModal({ isOpen, onClose, brand }: VisualIdentityModalProps) {
  const { update } = useBrands();
  const { setSelectedBrand } = useBrandStore();

  const [colors, setColors] = useState({
    primary: brand.brandKit?.colors?.primary || '#E6B447',
    secondary: brand.brandKit?.colors?.secondary || '#3b82f6',
    accent: brand.brandKit?.colors?.accent || '#f59e0b',
    background: brand.brandKit?.colors?.background || '#09090b',
  });

  const [visualStyle, setVisualStyle] = useState<string>(
    brand.brandKit?.visualStyle || 'modern'
  );

  const [typography, setTypography] = useState({
    primaryFont: brand.brandKit?.typography?.primaryFont || 'Inter',
    secondaryFont: brand.brandKit?.typography?.secondaryFont || 'Inter',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypographyChange = (key: string, value: string) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!brand.id) {
      toast.error('Erro: marca nao encontrada');
      return;
    }

    setIsSaving(true);

    try {
      const updatedBrandKit: BrandKit = {
        ...brand.brandKit,
        colors: {
          ...colors,
          variants: brand.brandKit?.colors?.variants,
        },
        typography: {
          ...typography,
          systemFallback: brand.brandKit?.typography?.systemFallback || 'sans-serif',
        },
        visualStyle: visualStyle as BrandKit['visualStyle'],
        logoLock: brand.brandKit?.logoLock || {
          variants: { primary: { url: '', storagePath: '', format: 'png' } },
          locked: false,
        },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      };

      await update(brand.id, { brandKit: updatedBrandKit });

      setSelectedBrand({
        ...brand,
        brandKit: updatedBrandKit,
      });

      toast.success('Identidade visual atualizada!');
      onClose();
    } catch (error) {
      console.error('Error saving visual identity:', error);
      toast.error('Erro ao salvar identidade visual.');
    } finally {
      setIsSaving(false);
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
          className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-white/[0.06] p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Identidade Visual</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Cores, tipografia e estilo
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Colors Section */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6B447]/10">
                <Palette className="h-5 w-5 text-[#E6B447]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Paleta de Cores</h3>
                <p className="text-xs text-zinc-500">As cores usadas nos materiais</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs text-zinc-400 font-medium">
                    {COLOR_LABELS[key] || key}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="h-9 w-9 rounded-lg border border-white/[0.1] shrink-0"
                      style={{ backgroundColor: value }}
                    />
                    <input
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-white font-mono text-sm h-9 focus:border-[#E6B447] focus:outline-none"
                    />
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="h-9 w-9 rounded-lg cursor-pointer border border-white/[0.08] bg-transparent shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Style */}
          <div className="space-y-3 mb-6">
            <label className="text-xs text-zinc-400 font-medium">Estilo Visual</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setVisualStyle(style.id)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-left border transition-all',
                    visualStyle === style.id
                      ? 'bg-[#E6B447]/20 border-[#E6B447]/50 text-[#E6B447]'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <span className="text-xs font-medium block">{style.label}</span>
                  <span className="text-[10px] opacity-70">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Type className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Tipografia</h3>
                <p className="text-xs text-zinc-500">Fontes para headlines e corpo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Fonte Headlines</label>
                <input
                  value={typography.primaryFont}
                  onChange={(e) => handleTypographyChange('primaryFont', e.target.value)}
                  placeholder="Ex: Inter, Montserrat"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:border-[#E6B447] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Fonte Corpo</label>
                <input
                  value={typography.secondaryFont}
                  onChange={(e) => handleTypographyChange('secondaryFont', e.target.value)}
                  placeholder="Ex: Roboto, Open Sans"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:border-[#E6B447] focus:outline-none"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-dashed border-white/[0.08]">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Preview</p>
              <h4
                className="text-xl font-bold text-white mb-1"
                style={{ fontFamily: typography.primaryFont }}
              >
                Headline de Impacto
              </h4>
              <p
                className="text-sm text-zinc-400"
                style={{ fontFamily: typography.secondaryFont }}
              >
                O corpo de texto usara esta fonte nos materiais gerados.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.1] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors disabled:opacity-50"
            >
              {isSaving ? (
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
