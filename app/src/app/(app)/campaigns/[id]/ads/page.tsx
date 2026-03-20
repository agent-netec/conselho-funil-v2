'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { CampaignStageStepper } from '@/components/campaigns/campaign-stage-stepper';
import { Loader2 } from 'lucide-react';

/**
 * Sprint 04.3 — Unified namespace: /campaigns/[id]/ads
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignAdsPage({ params }: PageProps) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolve() {
      try {
        const snap = await getDoc(doc(db, 'campaigns', campaignId));
        if (snap.exists()) {
          const data = snap.data();
          const funnelId = data.funnelId;
          if (funnelId) {
            router.replace(`/chat?mode=ads&funnelId=${funnelId}&campaignId=${campaignId}`);
            return;
          }
        }
        router.replace('/campaigns');
      } catch (err) {
        console.error('[CampaignAds] Failed to resolve:', err);
        router.replace('/campaigns');
      } finally {
        setLoading(false);
      }
    }
    resolve();
  }, [campaignId, router]);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header title="Ads — Carregando..." showBack />
      <CampaignStageStepper campaignId={campaignId} currentStage="ads" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    </div>
  );
}
