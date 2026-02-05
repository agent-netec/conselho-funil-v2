'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandSelector } from '@/components/brands/brand-selector';
import { ContextIndicator } from '@/components/context/context-indicator';
import { useMobile } from '@/lib/hooks/use-mobile';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  showBrandSelector?: boolean; // Controla visibilidade do seletor de marca
}

export function Header({ title, subtitle, showBack, actions, showBrandSelector = true }: HeaderProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const activeBrand = useActiveBrand();

  const handleCopyBrandId = async () => {
    if (!activeBrand?.id || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(activeBrand.id);
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.02] bg-background/80 backdrop-blur-xl px-4 sm:px-6",
    )}>
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {showBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors flex-shrink-0 border border-white/[0.04]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </motion.button>
        )}
        
        <div className="min-w-0 flex-1 pl-10 md:pl-0">
          <motion.h1 
            className={cn(
              "font-semibold text-white tracking-tight truncate",
              isMobile ? "text-[14px]" : "text-base"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h1>
          {subtitle && !isMobile && (
            <motion.p 
              className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-auto">
        {/* Context Indicator - Visible on desktop */}
        {!isMobile && <ContextIndicator />}

        {/* Brand Selector - Visible on all devices */}
        {showBrandSelector && <BrandSelector />}

        {/* Active Brand ID (quick copy) */}
        {showBrandSelector && activeBrand?.id && (
          <button
            onClick={handleCopyBrandId}
            className={cn(
              'hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
              'bg-white/[0.03] border border-white/[0.06]',
              'text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            )}
            title={`Copiar brandId: ${activeBrand.id}`}
            aria-label="Copiar brandId"
            type="button"
          >
            <span className="uppercase tracking-wider text-[10px]">ID</span>
            <span className="font-mono">{activeBrand.id}</span>
          </button>
        )}
        
        {/* Actions Container - Adaptive spacing */}
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
