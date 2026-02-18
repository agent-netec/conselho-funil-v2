'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ToastNotifications } from '@/components/ui/toast-notifications';
import { sendEmailVerification } from '@/lib/firebase/auth';

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
  const auth = useAuthStore();
  
  // Destructuring com segurança
  const user = auth?.user;
  const isLoading = auth?.isLoading;
  const isInitialized = auth?.isInitialized;

  // US-28.01: Check if Firebase is properly configured
  const isFirebaseAvailable = !((auth as any)?._isMock);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const isWelcomePage = pathname === '/welcome';

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

  // US-28.01: Show error if Firebase is not available
  if (!isFirebaseAvailable && !isPublicPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-500 mb-4">Erro de Configuração</h1>
          <p className="text-zinc-400 mb-6">
            O Firebase não foi inicializado corretamente. Verifique se as variáveis de ambiente (API Keys) estão configuradas no painel da Vercel.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Welcome page & Auth pages - no sidebar
  if (isAuthPage || isWelcomePage) {
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

  // R-1.7: Email verification banner
  const [verificationSent, setVerificationSent] = useState(false);
  const showVerificationBanner = user && !user.emailVerified && !isAuthPage && !isWelcomePage;

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(user);
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch {
      // Rate limited or other error — silently ignore
    }
  };

  // Protected pages - with sidebar
  return (
    <div className="min-h-screen bg-background selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* Background effects */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)] pointer-events-none" />

      <Sidebar />

      <main className="md:ml-[72px] min-h-screen relative flex flex-col">
        {/* R-1.7: Email verification banner */}
        {showVerificationBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-amber-200">
              Verifique seu email para ativar todas as funcionalidades.
            </span>
            <button
              onClick={handleResendVerification}
              disabled={verificationSent}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors disabled:opacity-50"
            >
              {verificationSent ? 'Email enviado!' : 'Reenviar email'}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1"
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
