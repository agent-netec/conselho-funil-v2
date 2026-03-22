'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, Plus, ArrowRight, MessageSquare, Zap, BarChart3 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useStats } from '@/lib/hooks/use-stats';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { useBrands } from '@/lib/hooks/use-brands';
import { useCampaigns } from '@/lib/hooks/use-campaigns';
import { useUser } from '@/lib/hooks/use-user';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useVerdictForBrand } from '@/lib/hooks/use-verdict';
import { useBrandAssets } from '@/lib/hooks/use-brand-assets';
import { StatsCards } from '@/components/dashboard/stats-cards';
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
import type { CampaignContext } from '@/types/campaign';
import type { Brand, Funnel } from '@/types/database';
import type { DashboardStats } from '@/types';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';
import Link from 'next/link';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// State resolution — Sprint 08.4: expanded 7-state machine
// ---------------------------------------------------------------------------

function resolveDashboardState(params: {
  brands: unknown[];
  brandsLoading: boolean;
  onboardingComplete: boolean;
  userLoading: boolean;
  funnelsCount: number;
  funnelsLoading: boolean;
  campaigns: CampaignContext[];
  campaignsLoading: boolean;
}): DashboardState {
  const {
    brands, brandsLoading, onboardingComplete, userLoading,
    funnelsCount, funnelsLoading, campaigns, campaignsLoading,
  } = params;

  if (brandsLoading || userLoading || funnelsLoading || campaignsLoading) return 'loading';

  const hasBrands = brands.length > 0;
  if (!hasBrands) return 'welcome';
  if (!onboardingComplete) return 'pre-briefing';
  if (funnelsCount === 0) return 'post-aha';

  // Has funnels — check campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'planning');
  if (activeCampaigns.length === 0) return 'has-funnels';

  // Has campaign — check if ads connected (has ads stage data or metrics)
  const topCampaign = activeCampaigns[0];
  if (topCampaign && (topCampaign.ads || topCampaign.metrics)) return 'has-ads';

  return 'has-campaign';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10">
        <Image src="/logo-mkthoney-icon.svg" alt="MKTHONEY" width={40} height={40} className="h-10 w-10" />
      </div>

      <h1 className="mb-2 text-xl font-bold text-[#F5E8CE] text-center">
        Bem-vindo ao <span className="text-[#E6B447]">MKTHONEY</span>
      </h1>
      <p className="mb-8 max-w-md text-sm text-[#6B5D4A] text-center">
        23 especialistas de marketing com IA, prontos para sua marca.
        Configure sua marca em 2 minutos e receba seu primeiro diagnostico estrategico.
      </p>

      <Button
        onClick={onCreateBrand}
        className="bg-gradient-to-r from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold hover:from-[#F0C35C] hover:to-[#E6B447] px-8 py-3 text-base"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Criar sua marca
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="mt-4 text-[11px] text-[#6B5D4A] max-w-xs text-center">
        Em 2 minutos, 23 conselheiros analisam seu posicionamento e oferta
      </p>
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
// Post-Aha body (has brand, no funnels)
// ---------------------------------------------------------------------------

function PostAhaBody({
  brand,
  verdict,
  verdictLoading,
  previousScores,
  assetCount,
  onOpenModal,
}: {
  brand: Brand;
  verdict: VerdictOutput | null;
  verdictLoading: boolean;
  previousScores?: { positioning: number | null; offer: number | null } | null;
  assetCount: number;
  onOpenModal: (modalKey: ModalKey) => void;
}) {
  return (
    <div className="space-y-5">
      <VerdictSummary
        verdict={verdict}
        previousScores={previousScores}
        brandId={brand.id}
        isLoading={verdictLoading}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BrandProgress brand={brand} assetCount={assetCount} onOpenModal={onOpenModal} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <NextActionHeader />
          <NextActionCard
            href="/funnels/new"
            icon={<Plus className="h-4 w-4 text-[#E6B447]" />}
            iconBg="bg-[#E6B447]/10"
            title="Criar seu primeiro funil"
            description="O MKTHONEY propoe arquiteturas baseadas na sua marca"
          />
          <NextActionCard
            href="/chat"
            icon={<MessageSquare className="h-4 w-4 text-[#5B8EC4]" />}
            iconBg="bg-[#5B8EC4]/10"
            title="Continuar conversa com o MKTHONEY"
            description="Aprofunde o diagnostico e receba recomendacoes"
            hoverColor="hover:border-[#5B8EC4]/20"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Has-Funnels body (has funnels, no campaign yet)
// ---------------------------------------------------------------------------

function HasFunnelsBody({
  verdict,
  verdictLoading,
  previousScores,
  brandId,
  funnels,
  funnelsLoading,
  stats,
  statsLoading,
}: {
  verdict: VerdictOutput | null;
  verdictLoading: boolean;
  previousScores?: { positioning: number | null; offer: number | null } | null;
  brandId?: string;
  funnels: Funnel[] | undefined;
  funnelsLoading: boolean | undefined;
  stats?: DashboardStats;
  statsLoading?: boolean;
}) {
  return (
    <>
      <div className="mb-5">
        <VerdictSummary
          verdict={verdict}
          previousScores={previousScores}
          brandId={brandId}
          isLoading={verdictLoading}
        />
      </div>

      <StatsCards stats={stats} isLoading={!!statsLoading} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity funnels={funnels || []} isLoading={!!funnelsLoading} />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <NextActionHeader />
          <NextActionCard
            href="/campaigns"
            icon={<Zap className="h-4 w-4 text-[#E6B447]" />}
            iconBg="bg-[#E6B447]/10"
            title="Iniciar campanha"
            description="Transforme seu funil aprovado em uma campanha completa"
          />
          <NextActionCard
            href="/funnels/new"
            icon={<Plus className="h-4 w-4 text-[#AB8648]" />}
            iconBg="bg-[#AB8648]/10"
            title="Criar outro funil"
            description="Explore novas estrategias para sua marca"
            hoverColor="hover:border-[#AB8648]/20"
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Has-Campaign body (active campaign, no ads yet)
// ---------------------------------------------------------------------------

function HasCampaignBody({
  verdict,
  verdictLoading,
  previousScores,
  brandId,
  campaign,
  funnels,
  funnelsLoading,
  stats,
  statsLoading,
}: {
  verdict: VerdictOutput | null;
  verdictLoading: boolean;
  previousScores?: { positioning: number | null; offer: number | null } | null;
  brandId?: string;
  campaign: CampaignContext;
  funnels: Funnel[] | undefined;
  funnelsLoading: boolean | undefined;
  stats?: DashboardStats;
  statsLoading?: boolean;
}) {
  const stages = [
    { key: 'funnel', label: 'Funil', done: Boolean(campaign.funnel) },
    { key: 'copy', label: 'Copy', done: Boolean(campaign.copywriting) },
    { key: 'social', label: 'Social', done: Boolean(campaign.social) },
    { key: 'design', label: 'Design', done: Boolean(campaign.design) },
    { key: 'ads', label: 'Ads', done: Boolean(campaign.ads) },
  ];
  const completed = stages.filter((s) => s.done).length;
  const nextStage = stages.find((s) => !s.done);

  return (
    <>
      <div className="mb-5">
        <VerdictSummary
          verdict={verdict}
          previousScores={previousScores}
          brandId={brandId}
          isLoading={verdictLoading}
        />
      </div>

      {/* Campaign progress card */}
      <Link href={`/campaigns/${campaign.id}`} className="block mb-5">
        <Card className="group border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none hover:border-[#E6B447]/20 transition-all cursor-pointer border-l-2 border-l-[#5B8EC4]/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#5B8EC4]">
                  Campanha Ativa
                </span>
                <h3 className="text-sm font-semibold text-[#F5E8CE] mt-0.5">{campaign.name}</h3>
              </div>
              <span className="font-mono text-xs text-[#AB8648]">{completed}/{stages.length}</span>
            </div>

            {/* Mini stepper */}
            <div className="flex gap-1.5 mb-3">
              {stages.map((s) => (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      s.done ? 'bg-[#E6B447]' : 'bg-[#241F19]'
                    }`}
                  />
                  <span className={`text-[9px] font-mono ${s.done ? 'text-[#CAB792]' : 'text-[#3D3428]'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {nextStage && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B5D4A]">
                  Proximo: <span className="text-[#CAB792] font-medium">{nextStage.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#3D3428] group-hover:text-[#E6B447] transition-colors" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      <StatsCards stats={stats} isLoading={!!statsLoading} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity funnels={funnels || []} isLoading={!!funnelsLoading} />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <NextActionHeader />
          {nextStage ? (
            <NextActionCard
              href={`/campaigns/${campaign.id}`}
              icon={<Zap className="h-4 w-4 text-[#E6B447]" />}
              iconBg="bg-[#E6B447]/10"
              title={`Proximo: ${nextStage.label}`}
              description={`Continue sua campanha — etapa ${nextStage.label} aguardando`}
            />
          ) : (
            <NextActionCard
              href={`/campaigns/${campaign.id}`}
              icon={<Zap className="h-4 w-4 text-[#7A9B5A]" />}
              iconBg="bg-[#7A9B5A]/10"
              title="Campanha completa"
              description="Revise todas as etapas e lance sua campanha"
            />
          )}
          <NextActionCard
            href="/funnels/new"
            icon={<Plus className="h-4 w-4 text-[#AB8648]" />}
            iconBg="bg-[#AB8648]/10"
            title="Criar outro funil"
            description="Explore novas estrategias para sua marca"
            hoverColor="hover:border-[#AB8648]/20"
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Has-Ads body (campaign with ads/metrics connected)
// ---------------------------------------------------------------------------

function HasAdsBody({
  verdict,
  verdictLoading,
  previousScores,
  brandId,
  campaign,
  funnels,
  funnelsLoading,
  stats,
  statsLoading,
}: {
  verdict: VerdictOutput | null;
  verdictLoading: boolean;
  previousScores?: { positioning: number | null; offer: number | null } | null;
  brandId?: string;
  campaign: CampaignContext;
  funnels: Funnel[] | undefined;
  funnelsLoading: boolean | undefined;
  stats?: DashboardStats;
  statsLoading?: boolean;
}) {
  const metrics = campaign.metrics;

  return (
    <>
      <div className="mb-5">
        <VerdictSummary
          verdict={verdict}
          previousScores={previousScores}
          brandId={brandId}
          isLoading={verdictLoading}
        />
      </div>

      {/* Ads KPI strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Impressoes" value={metrics.impressions.toLocaleString('pt-BR')} />
          <KpiCard label="Cliques" value={metrics.clicks.toLocaleString('pt-BR')} />
          <KpiCard
            label="Investimento"
            value={`R$ ${metrics.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <KpiCard
            label="Conversoes"
            value={metrics.conversions.toLocaleString('pt-BR')}
            highlight
          />
        </div>
      )}

      <StatsCards stats={stats} isLoading={!!statsLoading} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity funnels={funnels || []} isLoading={!!funnelsLoading} />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <NextActionHeader />
          <NextActionCard
            href="/performance"
            icon={<BarChart3 className="h-4 w-4 text-[#E6B447]" />}
            iconBg="bg-[#E6B447]/10"
            title="Analisar performance"
            description="Metricas detalhadas, anomalias e insights de IA"
          />
          <NextActionCard
            href={`/campaigns/${campaign.id}`}
            icon={<Zap className="h-4 w-4 text-[#5B8EC4]" />}
            iconBg="bg-[#5B8EC4]/10"
            title="Ver campanha completa"
            description={campaign.name}
            hoverColor="hover:border-[#5B8EC4]/20"
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared: KPI card + Next action helpers
// ---------------------------------------------------------------------------

function KpiCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-4">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B5D4A] block mb-1">
          {label}
        </span>
        <span className={`text-lg font-bold tabular-nums ${highlight ? 'text-[#E6B447]' : 'text-[#F5E8CE]'}`}>
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function NextActionHeader() {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648] flex items-center gap-2">
      <Target className="h-3.5 w-3.5" />
      Proximo passo
    </span>
  );
}

function NextActionCard({
  href,
  icon,
  iconBg,
  title,
  description,
  hoverColor = 'hover:border-[#E6B447]/20',
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  hoverColor?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className={`group border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none ${hoverColor} hover:bg-[#241F19] transition-all cursor-pointer`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors">
                {title}
              </span>
              <span className="block text-[11px] text-[#6B5D4A] truncate">
                {description}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#3D3428] group-hover:text-[#E6B447] transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
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

  // Sprint 08.4: Campaign data for state machine
  const { campaigns, isLoading: campaignsLoading } = useCampaigns();

  // Sprint R2.1: Onboarding wizard check
  const { user: firestoreUser, isLoading: userLoading } = useUser();
  const onboardingComplete = firestoreUser?.preferences?.onboardingPhase1AComplete === true;

  // Sprint R2.3 + 08.5: Active brand for verdict + progress
  const activeBrand = useActiveBrand();
  const { verdict, previousScores, isLoading: verdictLoading } =
    useVerdictForBrand(activeBrand?.id);
  const { assets, isLoading: assetsLoading } = useBrandAssets(activeBrand?.id);

  // Sprint 08.4: Expanded state machine
  const dashboardState = resolveDashboardState({
    brands: brands || [],
    brandsLoading: !!brandsLoading,
    onboardingComplete,
    userLoading,
    funnelsCount: funnels?.length || 0,
    funnelsLoading: !!funnelsLoading,
    campaigns,
    campaignsLoading,
  });

  // Top campaign for has-campaign / has-ads states
  const topCampaign = campaigns.filter((c) => c.status === 'active' || c.status === 'planning')[0];

  // Onboarding modal: auto-trigger for new users (welcome state), or manual from pre-briefing CTA
  const [manualOnboarding, setManualOnboarding] = useState(false);
  const showOnboarding = manualOnboarding;

  // Sprint 08.2: Auto-open wizard for new users after initial load
  useEffect(() => {
    if (dashboardState === 'welcome') {
      setManualOnboarding(true);
    }
  }, [dashboardState]);

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
            campaignName={topCampaign?.name}
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
            previousScores={previousScores}
            assetCount={assetsLoading ? 0 : assets.length}
            onOpenModal={handleOpenModal}
          />
        )}

        {dashboardState === 'has-funnels' && (
          <HasFunnelsBody
            verdict={verdict}
            verdictLoading={verdictLoading}
            previousScores={previousScores}
            brandId={activeBrand?.id}
            funnels={funnels}
            funnelsLoading={funnelsLoading}
            stats={stats}
            statsLoading={statsLoading}
          />
        )}

        {dashboardState === 'has-campaign' && topCampaign && (
          <HasCampaignBody
            verdict={verdict}
            verdictLoading={verdictLoading}
            previousScores={previousScores}
            brandId={activeBrand?.id}
            campaign={topCampaign}
            funnels={funnels}
            funnelsLoading={funnelsLoading}
            stats={stats}
            statsLoading={statsLoading}
          />
        )}

        {dashboardState === 'has-ads' && topCampaign && (
          <HasAdsBody
            verdict={verdict}
            verdictLoading={verdictLoading}
            previousScores={previousScores}
            brandId={activeBrand?.id}
            campaign={topCampaign}
            funnels={funnels}
            funnelsLoading={funnelsLoading}
            stats={stats}
            statsLoading={statsLoading}
          />
        )}
      </div>
    </div>
  );
}
