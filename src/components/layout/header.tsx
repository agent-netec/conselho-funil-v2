'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, showBack, actions }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}
        
        <div>
          <motion.h1 
            className="text-lg font-semibold text-white tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              className="text-sm text-zinc-500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick search hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <Search className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Buscar...</span>
          <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-medium">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
        
        {actions}
      </div>
    </header>
  );
}
