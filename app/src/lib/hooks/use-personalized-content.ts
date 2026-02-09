'use client';

import { useState, useEffect, useRef } from 'react';

interface PersonalizedContentResult {
  variations: Record<string, unknown>[];
  segment: string;
  fallback: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para consumir conteúdo personalizado via /api/personalization/resolve.
 * Cache local: não re-fetcha se brandId+leadId não mudar.
 *
 * @param brandId - ID da marca (null = skip)
 * @param leadId - ID do lead (null = skip)
 * @returns variations, segment, fallback, isLoading, error
 *
 * @story S31-RT-03
 */
export function usePersonalizedContent(
  brandId: string | null,
  leadId: string | null
): PersonalizedContentResult {
  const [variations, setVariations] = useState<Record<string, unknown>[]>([]);
  const [segment, setSegment] = useState('unknown');
  const [fallback, setFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef('');

  useEffect(() => {
    if (!brandId || !leadId) return;

    const key = `${brandId}:${leadId}`;
    if (key === lastKey.current) return; // Cache: não re-fetch se mesmos params
    lastKey.current = key;

    setIsLoading(true);
    setError(null);

    fetch('/api/personalization/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, leadId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVariations(data.data.variations || []);
          setSegment(data.data.segment || 'unknown');
          setFallback(data.data.fallback ?? true);
        } else {
          setError(data.error || 'Failed to resolve personalization');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [brandId, leadId]);

  return { variations, segment, fallback, isLoading, error };
}
