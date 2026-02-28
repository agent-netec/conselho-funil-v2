'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, Loader2, Check, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useBrands } from '@/lib/hooks/use-brands';
import { useBrandStore } from '@/lib/stores/brand-store';
import type { Brand } from '@/types/database';
import { cn } from '@/lib/utils';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
}

const AI_PRESETS = [
  {
    id: 'equilibrado',
    label: 'Equilibrado',
    emoji: '⚖️',
    desc: 'Balanco entre criatividade e precisao. Ideal para a maioria dos casos.',
    temp: 0.6,
    topP: 0.85,
    color: 'gold',
  },
  {
    id: 'criativo',
    label: 'Criativo',
    emoji: '🎨',
    desc: 'Mais liberdade para a IA. Otimo para brainstorming e ideias fora da caixa.',
    temp: 0.8,
    topP: 0.9,
    color: 'purple',
  },
  {
    id: 'agressivo',
    label: 'Agressivo',
    emoji: '🔥',
    desc: 'Maxima ousadia. Copies provocadoras e CTAs de alto impacto.',
    temp: 0.9,
    topP: 0.95,
    color: 'red',
  },
  {
    id: 'sobrio',
    label: 'Sobrio',
    emoji: '🎯',
    desc: 'Minima variacao. Textos precisos, formais e conservadores.',
    temp: 0.3,
    topP: 0.7,
    color: 'blue',
  },
] as const;

type ProfileId = typeof AI_PRESETS[number]['id'];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  gold: { bg: 'bg-[#E6B447]/15', border: 'border-[#E6B447]/40', text: 'text-[#E6B447]' },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400' },
  red: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400' },
  blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400' },
};

export function AiConfigModal({ isOpen, onClose, brand }: AiConfigModalProps) {
  const { update } = useBrands();
  const { setSelectedBrand } = useBrandStore();

  const [profile, setProfile] = useState<ProfileId>(
    (brand.aiConfiguration?.profile as ProfileId) || 'equilibrado'
  );
  const [temperature, setTemperature] = useState(
    brand.aiConfiguration?.temperature ?? 0.6
  );
  const [topP, setTopP] = useState(
    brand.aiConfiguration?.topP ?? 0.85
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePresetSelect = (preset: typeof AI_PRESETS[number]) => {
    setProfile(preset.id);
    setTemperature(preset.temp);
    setTopP(preset.topP);
  };

  const handleSave = async () => {
    if (!brand.id) {
      toast.error('Erro: marca nao encontrada');
      return;
    }

    setIsSaving(true);

    try {
      const aiConfiguration = {
        temperature,
        topP,
        profile: profile as 'agressivo' | 'sobrio' | 'equilibrado' | 'criativo',
      };

      await update(brand.id, { aiConfiguration });

      setSelectedBrand({
        ...brand,
        aiConfiguration,
      });

      toast.success('Configuracao de IA atualizada!');
      onClose();
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast.error('Erro ao salvar configuracao de IA.');
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
              <h2 className="text-xl font-bold text-white">Personalidade da IA</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Como a IA gera conteudo para sua marca
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Profile Selection */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <BrainCircuit className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Perfil de Geracao</h3>
                <p className="text-xs text-zinc-500">Selecione o estilo da IA</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {AI_PRESETS.map((preset) => {
                const colors = COLOR_MAP[preset.color];
                const isSelected = profile === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      isSelected
                        ? `${colors.bg} ${colors.border} ring-1 ring-inset ring-white/[0.05]`
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{preset.emoji}</span>
                      <span className={cn(
                        'text-sm font-semibold',
                        isSelected ? colors.text : 'text-white'
                      )}>
                        {preset.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{showAdvanced ? 'Ocultar' : 'Mostrar'} configuracoes avancadas</span>
          </button>

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 mb-6 overflow-hidden"
              >
                {/* Temperature Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 font-medium">Temperature</label>
                    <span className="text-xs font-mono text-[#E6B447]">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#E6B447]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>

                {/* Top P Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-400 font-medium">Top P</label>
                    <span className="text-xs font-mono text-[#E6B447]">{topP.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#E6B447]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>Focado</span>
                    <span>Diverso</span>
                  </div>
                </div>

                {/* Info box */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    <strong className="text-zinc-400">Temperature</strong> controla a aleatoriedade das respostas.
                    Valores altos = mais criativo. <br />
                    <strong className="text-zinc-400">Top P</strong> controla a diversidade de palavras escolhidas.
                    Valores altos = vocabulario mais variado.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Settings Preview */}
          <div className="p-4 rounded-xl bg-white/[0.01] border border-dashed border-white/[0.08] mb-6">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Configuracao atual</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {AI_PRESETS.find(p => p.id === profile)?.emoji || '⚖️'}
                </span>
                <span className="text-sm font-medium text-white">
                  {AI_PRESETS.find(p => p.id === profile)?.label || 'Equilibrado'}
                </span>
              </div>
              <div className="flex gap-3 text-[10px] text-zinc-500 font-mono">
                <span>Temp: {temperature.toFixed(2)}</span>
                <span>TopP: {topP.toFixed(2)}</span>
              </div>
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
