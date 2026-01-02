'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Header } from '@/components/layout/header';
import { FunnelAnalytics } from '@/components/analytics/funnel-analytics';
import { BarChart3, Loader2 } from 'lucide-react';
import type { Funnel, Decision } from '@/types/database';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        // Load funnels
        const funnelsQuery = query(
          collection(db, 'funnels'),
          where('userId', '==', user.uid)
        );
        const funnelsSnapshot = await getDocs(funnelsQuery);
        const funnelsData = funnelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Funnel[];
        setFunnels(funnelsData);

        // Load decisions
        const decisionsQuery = query(
          collection(db, 'decisions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const decisionsSnapshot = await getDocs(decisionsQuery);
        const decisionsData = decisionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Decision[];
        setDecisions(decisionsData);

      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Analytics" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Analytics" />
      
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-emerald-400" />
            Analytics de Funis
          </h2>
          <p className="mt-2 text-zinc-400">
            Visualize métricas e insights sobre seus funis
          </p>
        </motion.div>

        {funnels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-premium p-12 text-center"
          >
            <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Nenhum dado ainda
            </h3>
            <p className="text-zinc-500">
              Crie seu primeiro funil para começar a ver analytics
            </p>
          </motion.div>
        ) : (
          <FunnelAnalytics funnels={funnels} decisions={decisions} />
        )}
      </div>
    </div>
  );
}



