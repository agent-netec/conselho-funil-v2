'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserConversations, getConversationMessages } from '@/lib/firebase/firestore';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';
import { parseVerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface UseVerdictResult {
  verdict: VerdictOutput | null;
  conversationId: string | null;
  isLoading: boolean;
}

/**
 * Hook to fetch the proactive verdict for a specific brand.
 * Searches conversations for the verdict message created during onboarding (R2.2).
 */
export function useVerdictForBrand(brandId: string | undefined): UseVerdictResult {
  const { user } = useAuthStore();
  const [verdict, setVerdict] = useState<VerdictOutput | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVerdict() {
      if (!user || !brandId) {
        setVerdict(null);
        setConversationId(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // 1. Get conversations for user (max 50, same as existing pattern)
        const conversations = await getUserConversations(user.uid);

        // 2. Find the verdict conversation for this brand
        const verdictConvo = conversations.find(
          (c) => c.title?.startsWith('Veredito -') && c.brandId === brandId
        );

        if (!verdictConvo) {
          setVerdict(null);
          setConversationId(null);
          setIsLoading(false);
          return;
        }

        setConversationId(verdictConvo.id);

        // 3. Get messages and find the verdict
        const messages = await getConversationMessages(verdictConvo.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const verdictMsg = messages.find(
          (m) => (m.metadata as any)?.type === 'verdict'
        );

        if (verdictMsg) {
          // Prefer parsedVerdict from metadata, fallback to parsing content
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed = (verdictMsg.metadata as any)?.parsedVerdict
            || parseVerdictOutput(verdictMsg.content);
          setVerdict(parsed);
        } else {
          setVerdict(null);
        }
      } catch (err) {
        console.error('[useVerdictForBrand] Error loading verdict:', err);
        setVerdict(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadVerdict();
  }, [user, brandId]);

  return { verdict, conversationId, isLoading };
}
