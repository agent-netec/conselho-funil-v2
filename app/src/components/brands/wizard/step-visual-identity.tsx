import { motion } from 'framer-motion';
import { Palette, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StepVisualIdentityProps {
  colors: { primary: string; secondary: string; accent: string; background: string };
  visualStyle: string;
  typography: { primaryFont: string; secondaryFont: string };
  onUpdate: (field: string, value: any) => void;
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

export function StepVisualIdentity({ colors, visualStyle, typography, onUpdate }: StepVisualIdentityProps) {
  const handleColorChange = (key: string, value: string) => {
    onUpdate('colors', { ...colors, [key]: value });
  };

  const handleTypographyChange = (key: string, value: string) => {
    onUpdate('typography', { ...typography, [key]: value });
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Colors Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Palette className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">Paleta de Cores</h3>
            <p className="text-xs text-zinc-500">As cores que a IA usara nos materiais</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label className="text-zinc-400 text-xs">{COLOR_LABELS[key] || key}</Label>
              <div className="flex gap-2">
                <div
                  className="h-9 w-9 rounded-lg border border-white/[0.1] shrink-0"
                  style={{ backgroundColor: value }}
                />
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
        <Label className="text-zinc-400 text-xs">Estilo Visual Dominante</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VISUAL_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onUpdate('visualStyle', style.id)}
              className={cn(
                'px-3 py-2.5 rounded-xl text-left border transition-all',
                visualStyle === style.id
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
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
            <Input
              value={typography.primaryFont}
              onChange={(e) => handleTypographyChange('primaryFont', e.target.value)}
              placeholder="Ex: Inter, Montserrat"
              className="bg-white/[0.03] border-white/[0.08] text-white h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Fonte Corpo</Label>
            <Input
              value={typography.secondaryFont}
              onChange={(e) => handleTypographyChange('secondaryFont', e.target.value)}
              placeholder="Ex: Roboto, Open Sans"
              className="bg-white/[0.03] border-white/[0.08] text-white h-9"
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
            O corpo de texto usara esta fonte nos materiais gerados pela IA.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
