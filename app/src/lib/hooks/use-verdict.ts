'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface PreviousScores {
  positioning: number | null;
  offer: number | null;
  generatedAt: any;
}

interface UseVerdictResult {
  verdict: VerdictOutput | null;
  previousScores: PreviousScores | null;
  isLoading: boolean;
  version: number;
}

/**
 * Sprint 08.5: Real-time verdict hook reading from brands/{brandId}/verdicts/latest.
 * Uses onSnapshot for live updates (verdict appears as soon as it's generated).
 */
export function useVerdictForBrand(brandId: string | undefined): UseVerdictResult {
  const [verdict, setVerdict] = useState<VerdictOutput | null>(null);
  const [previousScores, setPreviousScores] = useState<PreviousScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!brandId) {
      setVerdict(null);
      setPreviousScores(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const verdictRef = doc(db, 'brands', brandId, 'verdicts', 'latest');

    const unsubscribe = onSnapshot(
      verdictRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const v: VerdictOutput = {
            brandName: data.brandName || '',
            scores: data.scores || { positioning: { value: 0, label: '' }, offer: { value: 0, label: '' } },
            analysis: data.analysis || { strengths: [], weaknesses: [] },
            actions: data.actions || [],
            followUpQuestion: data.followUpQuestion || '',
          };
          setVerdict(v);
          setPreviousScores(data.previousScores || null);
          setVersion(data.version || 1);
        } else {
          setVerdict(null);
          setPreviousScores(null);
          setVersion(0);
        }
        setIsLoading(false);
      },
      (error) => {
        const code = (error as { code?: string })?.code;
        if (code === 'permission-denied') {
          console.error(`[useVerdictForBrand] PERMISSION DENIED on brands/${brandId}/verdicts/latest — verify firestore.rules`);
        } else {
          console.warn('[useVerdictForBrand] Error:', error);
        }
        setVerdict(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [brandId]);

  return { verdict, previousScores, isLoading, version };
}
