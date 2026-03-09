'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastNotifications } from '@/components/ui/toast-notifications';

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_PATHS = ['/login', '/signup'];

/**
 * AppShell — Thin wrapper (T3 refactor)
 *
 * Auth guard, sidebar, loading screen, and email banner are now in (app)/layout.tsx.
 * AppShell only handles:
 * - Auth/welcome pages: background effects without sidebar
 * - Everything else: render children directly
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some(p => pathname?.startsWith(p));
  const isWelcomePage = pathname === '/welcome';

  // Auth & welcome pages — background effects, no sidebar
  if (isAuthPage || isWelcomePage) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.08),transparent)] pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <ToastNotifications />
      </div>
    );
  }

  // All other pages — render directly
  // Protected pages get chrome from (app)/layout.tsx
  // Public pages (landing, legal) render without chrome
  return (
    <>
      {children}
      <ToastNotifications />
    </>
  );
}
