'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserStats } from '@/lib/firebase/firestore';
import { DashboardStats } from '@/types';

export function useStats() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeFunnels: 0,
    pendingEvaluations: 0,
    decisionsThisMonth: 0,
    totalConversations: 0,
    performance_benchmarks: [],
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


