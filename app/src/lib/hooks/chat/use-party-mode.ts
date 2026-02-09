'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatMode } from '@/components/chat/chat-mode-selector';

export interface UsePartyModeReturn {
  isPartyMode: boolean;
  selectedAgents: string[];
  intensity: 'debate' | 'consensus';
  togglePartyMode: () => void;
  setSelectedAgents: (agents: string[]) => void;
  setIntensity: (intensity: 'debate' | 'consensus') => void;
  hasMinimumAgents: boolean;
}

export function usePartyMode(
  mode: ChatMode,
  onModeChange: (mode: ChatMode) => void
): UsePartyModeReturn {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<'debate' | 'consensus'>('debate');

  const isPartyMode = mode === 'party';
  const hasMinimumAgents = !isPartyMode || selectedAgents.length >= 3;

  // Reset selected agents when leaving party mode
  useEffect(() => {
    if (!isPartyMode) {
      setSelectedAgents([]);
    } else {
      // Default selection for party mode if empty
      if (selectedAgents.length === 0) {
        setSelectedAgents([
          'russell_brunson',
          'eugene_schwartz',
          'dan_kennedy',
        ]);
      }
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePartyMode = useCallback(() => {
    onModeChange(isPartyMode ? 'general' : 'party');
  }, [isPartyMode, onModeChange]);

  return {
    isPartyMode,
    selectedAgents,
    intensity,
    togglePartyMode,
    setSelectedAgents,
    setIntensity,
    hasMinimumAgents,
  };
}
