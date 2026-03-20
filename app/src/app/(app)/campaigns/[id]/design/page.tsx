'use client';

import { use } from 'react';
import { Header } from '@/components/layout/header';
import { CampaignStageStepper } from '@/components/campaigns/campaign-stage-stepper';
import { DesignWizard } from '@/components/design/design-wizard';

/**
 * Sprint 06.1 — Unified Design route: /campaigns/[id]/design
 * Renders DesignWizard directly (no redirect).
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDesignPage({ params }: PageProps) {
  const { id: campaignId } = use(params);

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      <Header title="Design Director" showBack />
      <CampaignStageStepper campaignId={campaignId} currentStage="design" />
      <DesignWizard campaignId={campaignId} />
    </div>
  );
}
