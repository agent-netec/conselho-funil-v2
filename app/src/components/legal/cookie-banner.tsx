'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, Check, X, Shield, ChartBar, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useConsent } from '@/lib/hooks/use-consent';
import { cn } from '@/lib/utils';

/**
 * Cookie consent banner for LGPD compliance.
 * Shows at the bottom of the screen for users who haven't consented yet.
 * Three categories: Essential (always on), Analytics (PostHog), Marketing (Meta Pixel).
 */
export function CookieBanner() {
  const { hasConsented, isLoading, acceptAll, rejectOptional, saveCustom } = useConsent();
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  // Don't render if loading or already consented
  if (isLoading || hasConsented) {
    return null;
  }

  const handleSaveCustom = async () => {
    await saveCustom(analyticsEnabled, marketingEnabled);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Main Banner */}
            {!showCustomize && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Icon & Text */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 flex-shrink-0">
                      <Cookie className="h-6 w-6 text-[#E6B447]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        Sua privacidade importa
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                        Usamos cookies para melhorar sua experiencia. Cookies essenciais sao
                        necessarios para o funcionamento do site. Voce pode personalizar suas
                        preferencias ou aceitar todos.{' '}
                        <Link href="/cookies" className="text-[#E6B447] hover:underline">
                          Saiba mais
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowCustomize(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] transition-colors text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      Personalizar
                    </button>
                    <button
                      onClick={rejectOptional}
                      className="px-4 py-2.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] transition-colors text-sm"
                    >
                      Rejeitar opcionais
                    </button>
                    <button
                      onClick={acceptAll}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Aceitar todos
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Customize Panel */}
            {showCustomize && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 sm:p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6B447]/10">
                      <Settings className="h-5 w-5 text-[#E6B447]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Preferencias de Cookies</h3>
                      <p className="text-xs text-zinc-500">Escolha quais cookies deseja permitir</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomize(false)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Cookie Categories */}
                <div className="space-y-3 mb-5">
                  {/* Essential - Always on */}
                  <CookieCategory
                    icon={<Shield className="h-4 w-4" />}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    title="Essenciais"
                    description="Necessarios para o funcionamento basico do site. Sempre ativos."
                    checked={true}
                    disabled={true}
                  />

                  {/* Analytics */}
                  <CookieCategory
                    icon={<ChartBar className="h-4 w-4" />}
                    iconColor="text-[#E6B447]"
                    iconBg="bg-[#E6B447]/10"
                    title="Analiticos"
                    description="Nos ajudam a entender como voce usa o site para melhorar a experiencia."
                    checked={analyticsEnabled}
                    onChange={setAnalyticsEnabled}
                  />

                  {/* Marketing */}
                  <CookieCategory
                    icon={<Megaphone className="h-4 w-4" />}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    title="Marketing"
                    description="Usados para personalizar anuncios e medir campanhas publicitarias."
                    checked={marketingEnabled}
                    onChange={setMarketingEnabled}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <Link
                    href="/cookies"
                    className="text-xs text-zinc-500 hover:text-[#E6B447] transition-colors"
                  >
                    Ver politica completa
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCustomize(false)}
                      className="px-4 py-2 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCustom}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#E6B447] text-white font-medium hover:bg-[#E6B447] transition-colors text-sm"
                    >
                      <Check className="h-4 w-4" />
                      Salvar preferencias
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Cookie Category Component
// ============================================

interface CookieCategoryProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CookieCategory({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  checked,
  disabled,
  onChange,
}: CookieCategoryProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-colors',
        checked
          ? 'bg-white/[0.02] border-white/[0.08]'
          : 'bg-transparent border-white/[0.04]'
      )}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0', iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-zinc-500 truncate">{description}</p>
      </div>
      <label className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors',
            disabled
              ? 'bg-zinc-700 cursor-not-allowed'
              : checked
                ? 'bg-[#E6B447] cursor-pointer'
                : 'bg-zinc-700 cursor-pointer'
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
            disabled && 'opacity-60'
          )}
        />
      </label>
    </div>
  );
}
