'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useEffect } from 'react';

const ACTIONS = [
  {
    icon: Sparkles,
    title: 'Criar sua marca',
    desc: 'Configure o contexto da sua marca para personalizar todos os conselhos.',
    href: '/brands/new',
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    icon: MessageSquare,
    title: 'Consultar o Conselho',
    desc: 'Fale com 23 especialistas de marketing ao mesmo tempo.',
    href: '/chat',
    color: 'blue',
    gradient: 'from-blue-500/20 to-blue-600/10',
  },
  {
    icon: Target,
    title: 'Explorar a plataforma',
    desc: 'Veja funis, campanhas, calendario e mais.',
    href: '/',
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-600/10',
  },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
};

export default function WelcomePage() {
  const router = useRouter();
  const { dismissWelcome } = useOnboardingStore();

  useEffect(() => {
    useOnboardingStore.persist.rehydrate();
  }, []);

  const handleAction = (href: string) => {
    dismissWelcome();
    router.push(href);
  };

  const handleSkip = () => {
    dismissWelcome();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20"
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

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo ao <span className="text-emerald-400">Conselho de Funil</span>
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              Sua plataforma de marketing com IA. 23 especialistas prontos para criar estrategias
              personalizadas para sua marca.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold text-center">
            Por onde voce quer comecar?
          </p>

          <div className="grid gap-3">
            {ACTIONS.map((action, i) => (
              <motion.button
                key={action.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => handleAction(action.href)}
                className="group flex items-center gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left w-full"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient}`}>
                  <action.icon className={`h-6 w-6 ${COLOR_MAP[action.color]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-1" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Skip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={handleSkip}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Pular e ir para o dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
