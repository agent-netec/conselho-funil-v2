'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Target, Plus, ArrowRight, MessageSquare, Compass } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useStats } from '@/lib/hooks/use-stats';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { useBrands } from '@/lib/hooks/use-brands';
import { useUser } from '@/lib/hooks/use-user';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useVerdictForBrand } from '@/lib/hooks/use-verdict';
import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { DashboardHero, type DashboardState } from '@/components/dashboard/dashboard-hero';
import { VerdictSummary } from '@/components/dashboard/verdict-summary';
import { BrandProgress } from '@/components/dashboard/brand-progress';
import { OnboardingModal } from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import {
  LogoUploadModal,
  VisualIdentityModal,
  RagAssetsModal,
  AiConfigModal,
} from '@/components/brand-config';
import type { ModalKey } from '@/lib/utils/brand-completeness';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// State resolution
// ---------------------------------------------------------------------------

function resolveDashboardState(params: {
  brands: unknown[];
  brandsLoading: boolean;
  onboardingComplete: boolean;
  userLoading: boolean;
  funnelsCount: number;
  funnelsLoading: boolean;
}): DashboardState {
  const { brands, brandsLoading, onboardingComplete, userLoading, funnelsCount, funnelsLoading } = params;

  if (brandsLoading || userLoading || funnelsLoading) return 'loading';

  const hasBrands = brands.length > 0;

  // No brands → welcome state (user needs to create first brand)
  if (!hasBrands) return 'welcome';

  // STATE 1: Has brands but onboarding not completed
  if (!onboardingComplete) return 'pre-briefing';

  // STATE 3: Has funnels → always active (no regression)
  if (funnelsCount > 0) return 'active';

  // STATE 2: Has brand + onboarding done + no funnels
  return 'post-aha';
}

// ---------------------------------------------------------------------------
// Pre-Briefing body
// ---------------------------------------------------------------------------

function PreBriefingBody({ onStartBriefing }: { onStartBriefing: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border-l-4 border-l-[#E6B447] border border-white/[0.06] bg-white/[0.02] p-8 text-center sm:text-left"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10 flex-shrink-0">
          <Sparkles className="h-8 w-8 text-[#E6B447]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">
            Seu MKTHONEY esta pronto
          </h3>
          <p className="text-sm text-[#A89B84] max-w-lg">
            Complete o briefing da sua marca para receber seu primeiro veredito estrategico.
            Em 3 minutos, 23 especialistas vao analisar seu posicionamento e oferta.
          </p>
        </div>
        <Button
          onClick={onStartBriefing}
          className="btn-accent flex-shrink-0"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Começar Briefing
        </Button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Post-Aha body
// ---------------------------------------------------------------------------

function PostAhaBody({
  brand,
  verdict,
  verdictLoading,
  verdictConversationId,
  assetCount,
  onOpenModal,
}: {
  brand: import('@/types/database').Brand;
  verdict: import('@/lib/ai/prompts/verdict-prompt').VerdictOutput | null;
  verdictLoading: boolean;
  verdictConversationId: string | null;
  assetCount: number;
  onOpenModal: (modalKey: ModalKey) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Verdict Summary — full width */}
      <VerdictSummary
        verdict={verdict}
        conversationId={verdictConversationId}
        isLoading={verdictLoading}
      />

      {/* Two columns: Brand Progress + Next Actions */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brand Progress */}
        <div className="lg:col-span-3">
          <BrandProgress brand={brand} assetCount={assetCount} onOpenModal={onOpenModal} />
        </div>

        {/* Next actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-[#E6B447]" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E6B447]">
              Proximo passo
            </h3>
          </div>

          <Link href="/funnels/new">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 hover:border-[#E6B447]/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10">
                  <Plus className="h-5 w-5 text-[#E6B447]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#E6B447] transition-colors">
                    Criar seu primeiro funil
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    O MKTHONEY vai propor arquiteturas baseadas na sua marca
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-[#E6B447] transition-colors" />
              </div>
            </motion.div>
          </Link>

          <Link href="/chat">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 hover:border-[#E6B447]/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#E6B447] transition-colors">
                    Continuar conversa com o MKTHONEY
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Aprofunde o diagnostico e receba recomendacoes
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-[#E6B447] transition-colors" />
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 h-32">
            <div className="h-10 w-10 rounded-xl bg-zinc-800 mb-4" />
            <div className="h-5 w-16 rounded bg-zinc-800 mb-2" />
            <div className="h-3 w-24 rounded bg-zinc-800/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome body
// ---------------------------------------------------------------------------

function WelcomeBody({ onCreateBrand }: { onCreateBrand: () => void }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Logo icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E6B447]/10">
        <img src="/logo-mkthoney-icon.svg" alt="MKTHONEY" className="h-12 w-12" />
      </div>

      {/* Title */}
      <h1 className="mb-3 text-2xl font-bold text-white text-center">
        Bem-vindo ao <span className="text-[#E6B447]">MKTHONEY</span>
      </h1>
      <p className="mb-10 max-w-lg text-sm text-zinc-400 text-center">
        Sua plataforma de marketing com IA. 23 especialistas prontos
        para criar estratégias personalizadas para sua marca.
      </p>

      {/* Section Label */}
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
        Por onde você quer começar?
      </p>

      {/* Card Stack — vertical full-width, horizontal layout per card */}
      <div className="flex w-full max-w-xl flex-col gap-3">
        {/* Card 1: Criar Marca */}
        <button
          onClick={onCreateBrand}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.03]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E6B447]/10 transition-transform group-hover:scale-110">
            <Sparkles className="h-5 w-5 text-[#E6B447]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-white">Criar sua marca</span>
            <span className="block text-xs text-zinc-500">Configure o contexto da sua marca para personalizar todos os conselhos.</span>
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
        </button>

        {/* Card 2: Consultar MKTHONEY */}
        <button
          onClick={() => router.push('/chat')}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.03]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-transform group-hover:scale-110">
            <MessageSquare className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-white">Consultar o MKTHONEY</span>
            <span className="block text-xs text-zinc-500">Fale com 23 especialistas de marketing ao mesmo tempo.</span>
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
        </button>

        {/* Card 3: Explorar */}
        <button
          onClick={() => router.push('/funnels')}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-purple-500/20 hover:bg-purple-500/[0.03]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/10 transition-transform group-hover:scale-110">
            <Compass className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-white">Explorar a plataforma</span>
            <span className="block text-xs text-zinc-500">Veja funis, campanhas, calendário e mais.</span>
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
        </button>
      </div>

      {/* Skip link */}
      <button
        onClick={() => router.push('/chat')}
        className="mt-8 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        Pular e ir para o dashboard
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const statsData = useStats();
  const stats = statsData?.stats;
  const statsLoading = statsData?.isLoading;

  const funnelsData = useFunnels();
  const funnels = funnelsData?.funnels;
  const funnelsLoading = funnelsData?.isLoading;

  const brandsData = useBrands();
  const brands = brandsData?.brands;
  const brandsLoading = brandsData?.isLoading;

  // Sprint R2.1: Onboarding wizard check
  const { user: firestoreUser, isLoading: userLoading } = useUser();
  const onboardingComplete = firestoreUser?.preferences?.onboardingPhase1AComplete === true;

  // Sprint R2.3: Active brand for verdict + progress
  const activeBrand = useActiveBrand();
  const { verdict, conversationId: verdictConversationId, isLoading: verdictLoading } =
    useVerdictForBrand(activeBrand?.id);
  const { assets, isLoading: assetsLoading } = useBrandAssets(activeBrand?.id);

  // Tri-state resolution
  const dashboardState = resolveDashboardState({
    brands: brands || [],
    brandsLoading: !!brandsLoading,
    onboardingComplete,
    userLoading,
    funnelsCount: funnels?.length || 0,
    funnelsLoading: !!funnelsLoading,
  });

  // Onboarding modal: triggered manually from WelcomeBody or pre-briefing CTA
  const [manualOnboarding, setManualOnboarding] = useState(false);
  const showOnboarding = manualOnboarding;

  // Sprint R2.4: Brand config modals state
  const [openModal, setOpenModal] = useState<ModalKey | null>(null);
  const handleOpenModal = (modalKey: ModalKey) => setOpenModal(modalKey);
  const handleCloseModal = () => setOpenModal(null);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Onboarding Wizard Modal */}
      {showOnboarding && <OnboardingModal />}

      {/* Sprint R2.4: Brand Config Modals */}
      {activeBrand && (
        <>
          <LogoUploadModal
            isOpen={openModal === 'logo'}
            onClose={handleCloseModal}
            brand={activeBrand}
          />
          <VisualIdentityModal
            isOpen={openModal === 'visual'}
            onClose={handleCloseModal}
            brand={activeBrand}
          />
          <RagAssetsModal
            isOpen={openModal === 'rag'}
            onClose={handleCloseModal}
            brand={activeBrand}
            assetCount={assetsLoading ? 0 : assets.length}
          />
          <AiConfigModal
            isOpen={openModal === 'ai'}
            onClose={handleCloseModal}
            brand={activeBrand}
          />
        </>
      )}

      <Header title={dashboardState === 'welcome' ? 'Inicio' : 'Dashboard'} />

      <div className="flex-1 p-4 sm:p-8">
        {/* Hero — only for non-welcome states */}
        {dashboardState !== 'welcome' && dashboardState !== 'loading' && (
          <DashboardHero
            state={dashboardState}
            brand={activeBrand}
            verdict={verdict}
            onStartBriefing={() => setManualOnboarding(true)}
          />
        )}

        {/* Body — switches per state */}
        {dashboardState === 'loading' && <DashboardSkeleton />}

        {dashboardState === 'welcome' && (
          <WelcomeBody onCreateBrand={() => setManualOnboarding(true)} />
        )}

        {dashboardState === 'pre-briefing' && (
          <PreBriefingBody onStartBriefing={() => setManualOnboarding(true)} />
        )}

        {dashboardState === 'post-aha' && activeBrand && (
          <PostAhaBody
            brand={activeBrand}
            verdict={verdict}
            verdictLoading={verdictLoading}
            verdictConversationId={verdictConversationId}
            assetCount={assetsLoading ? 0 : assets.length}
            onOpenModal={handleOpenModal}
          />
        )}

        {dashboardState === 'active' && (
          <>
            <StatsCards stats={stats} isLoading={statsLoading} />
            <QuickActions />
            <RecentActivity funnels={funnels} isLoading={funnelsLoading} />
          </>
        )}
      </div>
    </div>
  );
}
