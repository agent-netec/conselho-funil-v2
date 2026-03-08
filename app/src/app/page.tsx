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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  if (!hasBrands) return 'welcome';
  if (!onboardingComplete) return 'pre-briefing';
  if (funnelsCount > 0) return 'active';
  return 'post-aha';
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-20 bg-[#241F19] mb-4" />
              <Skeleton className="h-9 w-14 bg-[#241F19] mb-3" />
              <Skeleton className="h-3 w-24 bg-[#1A1612]" />
            </CardContent>
          </Card>
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

  const actions = [
    {
      key: 'create',
      icon: Sparkles,
      label: 'Criar sua marca',
      description: 'Configure o contexto da sua marca para personalizar todos os conselhos.',
      onClick: onCreateBrand,
      accent: 'gold' as const,
    },
    {
      key: 'chat',
      icon: MessageSquare,
      label: 'Consultar o MKTHONEY',
      description: 'Fale com 23 especialistas de marketing ao mesmo tempo.',
      onClick: () => router.push('/chat'),
      accent: 'blue' as const,
    },
    {
      key: 'explore',
      icon: Compass,
      label: 'Explorar a plataforma',
      description: 'Veja funis, campanhas, calendario e mais.',
      onClick: () => router.push('/funnels'),
      accent: 'gold' as const,
    },
  ];

  const accentColors = {
    gold: {
      icon: 'text-[#E6B447]',
      bg: 'bg-[#E6B447]/10',
      hover: 'hover:border-[#E6B447]/20',
    },
    blue: {
      icon: 'text-[#5B8EC4]',
      bg: 'bg-[#5B8EC4]/10',
      hover: 'hover:border-[#5B8EC4]/20',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
        <img src="/logo-mkthoney-icon.svg" alt="MKTHONEY" className="h-10 w-10" />
      </div>

      <h1 className="mb-2 text-xl font-bold text-[#F5E8CE] text-center">
        Bem-vindo ao <span className="text-[#E6B447]">MKTHONEY</span>
      </h1>
      <p className="mb-8 max-w-md text-sm text-[#6B5D4A] text-center">
        23 especialistas de marketing com IA, prontos para sua marca.
      </p>

      <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
        Por onde comecar?
      </span>

      <div className="flex w-full max-w-lg flex-col gap-2">
        {actions.map((action) => {
          const colors = accentColors[action.accent];
          return (
            <button
              key={action.key}
              onClick={action.onClick}
              className={`group flex items-center gap-3 rounded-xl border border-[#2A2318] bg-[#1A1612] px-4 py-3.5 text-left transition-all ${colors.hover} hover:bg-[#241F19]`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                <action.icon className={`h-4 w-4 ${colors.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[#F5E8CE]">{action.label}</span>
                <span className="block text-[11px] text-[#6B5D4A]">{action.description}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[#3D3428] group-hover:text-[#AB8648] transition-colors" />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => router.push('/chat')}
        className="mt-6 text-[11px] text-[#6B5D4A] hover:text-[#AB8648] transition-colors"
      >
        Pular e ir para o dashboard
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pre-Briefing body
// ---------------------------------------------------------------------------

function PreBriefingBody({ onStartBriefing }: { onStartBriefing: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none border-l-2 border-l-[#E6B447]/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 flex-shrink-0">
              <Sparkles className="h-6 w-6 text-[#E6B447]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-[#F5E8CE] mb-1">
                Seu MKTHONEY esta pronto
              </h3>
              <p className="text-xs text-[#6B5D4A] max-w-lg">
                Complete o briefing da sua marca para receber seu primeiro veredito estrategico.
                Em 3 minutos, 23 especialistas analisam seu posicionamento e oferta.
              </p>
            </div>
            <Button onClick={onStartBriefing} className="btn-accent flex-shrink-0 text-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Comecar Briefing
            </Button>
          </div>
        </CardContent>
      </Card>
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
    <div className="space-y-5">
      {/* Verdict Summary — full width */}
      <VerdictSummary
        verdict={verdict}
        conversationId={verdictConversationId}
        isLoading={verdictLoading}
      />

      {/* Two columns: Brand Progress + Next Actions */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BrandProgress brand={brand} assetCount={assetCount} onOpenModal={onOpenModal} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648] flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            Proximo passo
          </span>

          <Link href="/funnels/new" className="block">
            <Card className="group border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none hover:border-[#E6B447]/20 hover:bg-[#241F19] transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6B447]/10">
                    <Plus className="h-4 w-4 text-[#E6B447]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors">
                      Criar seu primeiro funil
                    </span>
                    <span className="block text-[11px] text-[#6B5D4A]">
                      O MKTHONEY propoe arquiteturas baseadas na sua marca
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#3D3428] group-hover:text-[#E6B447] transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat" className="block">
            <Card className="group border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none hover:border-[#5B8EC4]/20 hover:bg-[#241F19] transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B8EC4]/10">
                    <MessageSquare className="h-4 w-4 text-[#5B8EC4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors">
                      Continuar conversa com o MKTHONEY
                    </span>
                    <span className="block text-[11px] text-[#6B5D4A]">
                      Aprofunde o diagnostico e receba recomendacoes
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#3D3428] group-hover:text-[#E6B447] transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
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

  // State machine
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
          <LogoUploadModal isOpen={openModal === 'logo'} onClose={handleCloseModal} brand={activeBrand} />
          <VisualIdentityModal isOpen={openModal === 'visual'} onClose={handleCloseModal} brand={activeBrand} />
          <RagAssetsModal isOpen={openModal === 'rag'} onClose={handleCloseModal} brand={activeBrand} assetCount={assetsLoading ? 0 : assets.length} />
          <AiConfigModal isOpen={openModal === 'ai'} onClose={handleCloseModal} brand={activeBrand} />
        </>
      )}

      <Header title={dashboardState === 'welcome' ? 'Inicio' : 'Dashboard'} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
        {/* Command status bar — all states except welcome/loading */}
        {dashboardState !== 'welcome' && dashboardState !== 'loading' && (
          <DashboardHero
            state={dashboardState}
            brand={activeBrand}
            verdict={verdict}
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

            {/* Two-column bento: Recent Funnels + Quick Actions */}
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <RecentActivity funnels={funnels} isLoading={funnelsLoading} />
              </div>
              <div className="lg:col-span-2">
                <QuickActions />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
