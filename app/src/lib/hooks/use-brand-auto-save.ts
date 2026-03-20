'use client';

import { useCallback, useRef, useState } from 'react';
import { updateBrand } from '@/lib/firebase/brands';
import { toast } from 'sonner';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Auto-save hook with 2s debounce for brand editing.
 * Returns a function that queues partial updates.
 */
export function useBrandAutoSave(brandId: string) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, any>>({});

  const flush = useCallback(async () => {
    const data = { ...pendingRef.current };
    pendingRef.current = {};

    if (Object.keys(data).length === 0) return;

    setStatus('saving');
    try {
      await updateBrand(brandId, data);
      setStatus('saved');
      // Reset to idle after 2s
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (err) {
      console.error('[auto-save] Error:', err);
      setStatus('error');
      toast.error('Erro ao salvar alterações');
    }
  }, [brandId]);

  const queueSave = useCallback(
    (field: string, value: any) => {
      // Merge into pending updates
      pendingRef.current[field] = value;
      setStatus('saving');

      // Reset debounce timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), 2000);
    },
    [flush],
  );

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flush();
  }, [flush]);

  return { queueSave, saveNow, status };
}
