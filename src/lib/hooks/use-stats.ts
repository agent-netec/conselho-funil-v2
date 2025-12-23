'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserStats } from '@/lib/firebase/firestore';

interface Stats {
  activeFunnels: number;
  pendingEvaluations: number;
  decisionsThisMonth: number;
  totalConversations: number;
}

export function useStats() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    activeFunnels: 0,
    pendingEvaluations: 0,
    decisionsThisMonth: 0,
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserStats(user.uid);
        setStats(data);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [user]);

  return { stats, isLoading };
}


