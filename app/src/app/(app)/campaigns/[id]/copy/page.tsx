'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { CampaignStageStepper } from '@/components/campaigns/campaign-stage-stepper';
import { Loader2 } from 'lucide-react';

/**
 * Sprint 04.3 — Unified namespace: /campaigns/[id]/copy
 * Loads campaign doc, extracts funnelId, redirects to existing copy page
 * with campaignId in query params (until copy engine is fully migrated).
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignCopyPage({ params }: PageProps) {
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
            // Redirect to existing copy page with campaignId
            router.replace(`/funnels/${funnelId}/copy?campaignId=${campaignId}`);
            return;
          }
        }
        // Campaign not found or no funnelId
        router.replace('/campaigns');
      } catch (err) {
        console.error('[CampaignCopy] Failed to resolve:', err);
        router.replace('/campaigns');
      } finally {
        setLoading(false);
      }
    }
    resolve();
  }, [campaignId, router]);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header title="Copy — Carregando..." showBack />
      <CampaignStageStepper campaignId={campaignId} currentStage="copy" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    </div>
  );
}
