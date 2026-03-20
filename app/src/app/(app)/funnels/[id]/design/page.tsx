'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

/**
 * Sprint 06.1 — Legacy redirect: /funnels/[id]/design → /campaigns/[campaignId]/design
 * Resolves campaignId from searchParams or funnelId fallback.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FunnelDesignRedirect({ params }: PageProps) {
  const { id: funnelId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function resolve() {
      const rawCampaignId = searchParams.get('campaignId');
      const campaignId = rawCampaignId && rawCampaignId !== 'undefined' && rawCampaignId !== 'null'
        ? rawCampaignId
        : null;

      if (campaignId) {
        router.replace(`/campaigns/${campaignId}/design`);
        return;
      }

      // Try to find a campaign linked to this funnel
      try {
        const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
        if (funnelDoc.exists()) {
          // Check if a campaign exists with this funnelId
          const campaignDoc = await getDoc(doc(db, 'campaigns', funnelId));
          if (campaignDoc.exists()) {
            router.replace(`/campaigns/${funnelId}/design`);
            return;
          }
        }
      } catch (err) {
        console.error('[FunnelDesignRedirect] Error:', err);
      }

      // Fallback: use funnelId as campaignId (legacy behavior)
      router.replace(`/campaigns/${funnelId}/design`);
    }
    resolve();
  }, [funnelId, searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B09]">
      <Header title="Design — Redirecionando..." showBack />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6B447]" />
      </div>
    </div>
  );
}
