import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Lock, Unlock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepLogoProps {
  logoFile: File | null;
  logoLocked: boolean;
  onUpdate: (field: string, value: any) => void;
}

export function StepLogo({ logoFile, logoLocked, onUpdate }: StepLogoProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    onUpdate('logoFile', file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemove = () => {
    onUpdate('logoFile', null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h3 className="text-base font-medium text-white mb-1">Logo da Marca</h3>
        <p className="text-xs text-zinc-500">
          Faca upload do logo principal. Voce pode adicionar variantes depois no Brand Hub.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'relative aspect-[16/9] max-w-md mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden',
          logoFile
            ? 'border-emerald-500/30 bg-black'
            : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.01] bg-white/[0.02]'
        )}
      >
        {logoFile && previewUrl ? (
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

      {/* Logo Lock Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {logoLocked ? (
            <Lock className="h-5 w-5 text-emerald-500" />
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
          onClick={() => onUpdate('logoLocked', !logoLocked)}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            logoLocked ? 'bg-emerald-500' : 'bg-zinc-700'
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

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 max-w-md mx-auto">
        <p className="text-[11px] text-amber-200/70 text-center">
          O upload real acontece ao criar a marca. Voce pode adicionar variantes (horizontal, icone) depois.
        </p>
      </div>
    </motion.div>
  );
}
