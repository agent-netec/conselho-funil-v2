'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { CampaignContext } from '@/types/campaign';

export function useCampaigns() {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<CampaignContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      const snap = await getDocs(
        query(
          collection(db, 'campaigns'),
          where('userId', '==', user.uid),
          where('status', 'in', ['planning', 'active']),
        ),
      );
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CampaignContext[];
      data.sort((a, b) => ((b.updatedAt as any)?.seconds || 0) - ((a.updatedAt as any)?.seconds || 0));
      setCampaigns(data);
    } catch (e) {
      console.error('[useCampaigns] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [load]);

  return { campaigns, isLoading, refresh: load };
}
