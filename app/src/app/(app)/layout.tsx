'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { sendEmailVerification } from '@/lib/firebase/auth';
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#09090b]">
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.1),transparent)]" />
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-[#E6B447]/20 blur-2xl animate-pulse" />
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center"
            animate={{
              filter: [
                'drop-shadow(0 0 8px rgba(230, 180, 71, 0.2))',
                'drop-shadow(0 0 20px rgba(230, 180, 71, 0.5))',
                'drop-shadow(0 0 8px rgba(230, 180, 71, 0.2))',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image
              src="/logo-mkthoney-icon.svg"
              alt="MKTHONEY"
              width={40}
              height={57}
              priority
              className="h-14 w-auto"
            />
          </motion.div>
        </div>
        <div className="w-32 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full bg-[#E6B447] rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Carregando...</p>
      </motion.div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  const { isExpanded } = useSidebarStore();

  const user = auth?.user;
  const isLoading = auth?.isLoading;
  const isInitialized = auth?.isInitialized;
  const isFirebaseAvailable = !((auth as any)?._isMock);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  // Loading while auth initializes
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Firebase not configured
  if (!isFirebaseAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-500 mb-4">Erro de Configuracao</h1>
          <p className="text-zinc-400 mb-6">
            O Firebase nao foi inicializado corretamente. Verifique se as variaveis de ambiente
            (API Keys) estao configuradas no painel da Vercel.
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

  // Not authenticated — redirect already triggered in useEffect
  if (!user) return <LoadingScreen />;

  const showVerificationBanner = !user.emailVerified;

  return (
    <div className="min-h-screen bg-background selection:bg-[#E6B447]/20 selection:text-[#F5E8CE]">
      {/* Background effects */}
      <div className="fixed inset-0 bg-dot-pattern opacity-[0.15] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.08),transparent)] pointer-events-none" />

      <Sidebar />

      <main
        className={cn(
          'min-h-screen relative flex flex-col transition-[margin-left] duration-200 ease-in-out',
          isExpanded ? 'md:ml-[256px]' : 'md:ml-[72px]'
        )}
      >
        {showVerificationBanner && (
          <EmailVerificationBanner onResend={() => sendEmailVerification(user)} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
