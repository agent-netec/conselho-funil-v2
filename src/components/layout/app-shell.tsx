'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ToastNotifications } from '@/components/ui/toast-notifications';

interface AppShellProps {
  children: React.ReactNode;
}

// Pages that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup'];

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#09090b]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      
      {/* Radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.1),transparent)]" />
      
      <motion.div 
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-2xl animate-pulse" />
          
          <motion.div 
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20"
            animate={{ 
              boxShadow: [
                '0 20px 25px -5px rgba(16, 185, 129, 0.2)',
                '0 20px 25px -5px rgba(16, 185, 129, 0.4)',
                '0 20px 25px -5px rgba(16, 185, 129, 0.2)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </motion.div>
        </div>
        
        {/* Loading bar */}
        <div className="w-32 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        </div>
        
        <p className="text-sm text-zinc-500 font-medium">Carregando...</p>
      </motion.div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuthStore();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  useEffect(() => {
    if (!isInitialized) return;

    // Redirect to login if not authenticated and trying to access protected page
    if (!user && !isPublicPage) {
      router.push('/login');
    }

    // Redirect to home if authenticated and trying to access auth page
    if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, isInitialized, isPublicPage, isAuthPage, router]);

  // Show loading while checking auth
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Auth pages - no sidebar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        {/* Background effects */}
        <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />
        
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
      </div>
    );
  }

  // Protected pages - with sidebar
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Background effects */}
      <div className="fixed inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />
      
      <Sidebar />
      
      <main className="ml-[72px] min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Toast Notifications */}
      <ToastNotifications />
    </div>
  );
}
