import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Upload, Lock, Unlock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StepVisualLogoProps {
  colors: { primary: string; secondary: string; accent: string; background: string };
  visualStyle: string;
  typography: { primaryFont: string; secondaryFont: string };
  logoFile: File | null;
  logoLocked: boolean;
  onUpdate: (field: string, value: any) => void;
}

const COLOR_LABELS: Record<string, string> = {
  primary: 'Primária',
  secondary: 'Secundária',
  accent: 'Destaque',
  background: 'Fundo',
};

const VISUAL_STYLES = [
  { id: 'minimalist', label: 'Minimalista', desc: 'Clean e elegante' },
  { id: 'aggressive', label: 'Agressivo', desc: 'Bold e impactante' },
  { id: 'luxury', label: 'Luxo', desc: 'Sofisticado e premium' },
  { id: 'corporate', label: 'Corporativo', desc: 'Profissional e sério' },
  { id: 'modern', label: 'Moderno', desc: 'Atual e dinâmico' },
];

const FONT_CATALOG = [
  'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato',
  'Raleway', 'Playfair Display', 'Bebas Neue', 'Oswald', 'DM Sans',
  'Space Grotesk', 'Sora', 'Plus Jakarta Sans',
];

export function StepVisualLogo({ colors, visualStyle, typography, logoFile, logoLocked, onUpdate }: StepVisualLogoProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleColorChange = (key: string, value: string) => {
    onUpdate('colors', { ...colors, [key]: value });
  };

  const handleFileChange = (file: File) => {
    onUpdate('logoFile', file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    onUpdate('logoFile', null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Colors */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6B447]/10">
            <Palette className="h-5 w-5 text-[#E6B447]" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">Paleta de Cores</h3>
            <p className="text-xs text-zinc-500">As cores que a IA usará nos materiais</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label className="text-zinc-400 text-xs">{COLOR_LABELS[key] || key}</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-lg border border-white/[0.1] shrink-0" style={{ backgroundColor: value }} />
                <Input
                  value={value}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white font-mono text-sm h-9"
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
      <div className="space-y-3">
        <Label className="text-zinc-400 text-xs">Estilo Visual</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VISUAL_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onUpdate('visualStyle', style.id)}
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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Type className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">Tipografia</h3>
            <p className="text-xs text-zinc-500">Fontes para headlines e corpo</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Fonte Headlines</Label>
            <select
              value={typography.primaryFont}
              onChange={(e) => onUpdate('typography', { ...typography, primaryFont: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-white text-sm focus:border-[#E6B447] focus:outline-none"
            >
              {FONT_CATALOG.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Fonte Corpo</Label>
            <select
              value={typography.secondaryFont}
              onChange={(e) => onUpdate('typography', { ...typography, secondaryFont: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-white text-sm focus:border-[#E6B447] focus:outline-none"
            >
              {FONT_CATALOG.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-white">Logo</h3>
        <div
          className={cn(
            'relative aspect-[16/9] max-w-sm mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden',
            logoFile
              ? 'border-[#E6B447]/30 bg-black'
              : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
          )}
        >
          {logoFile && previewUrl ? (
            <>
              <img src={previewUrl} alt="Logo preview" className="max-h-[70%] max-w-[80%] object-contain" />
              <button type="button" onClick={handleRemoveLogo} className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400">Arraste ou clique</p>
              <p className="text-[10px] text-zinc-600">SVG, PNG ou WebP</p>
              <input
                type="file"
                accept=".svg,.png,.webp"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </>
          )}
        </div>

        {/* Logo Lock */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            {logoLocked ? <Lock className="h-4 w-4 text-[#E6B447]" /> : <Unlock className="h-4 w-4 text-zinc-500" />}
            <div>
              <p className="text-xs font-medium text-white">Logo Lock</p>
              <p className="text-[10px] text-zinc-500">IA não altera o logo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdate('logoLocked', !logoLocked)}
            className={cn('relative h-6 w-11 rounded-full transition-colors', logoLocked ? 'bg-[#E6B447]' : 'bg-zinc-700')}
          >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm', logoLocked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
