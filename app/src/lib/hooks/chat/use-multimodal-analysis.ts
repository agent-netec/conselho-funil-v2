'use client';

import { useState, useCallback } from 'react';

export interface UseMultimodalAnalysisReturn {
  isAnalyzing: boolean;
  analyzeImage: (imageUrl: string, prompt: string) => Promise<string>;
}

export function useMultimodalAnalysis(): UseMultimodalAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = useCallback(
    async (imageUrl: string, prompt: string): Promise<string> => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/intelligence/analyze/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            fileBase64: imageUrl,
            mimeType: 'image/png',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
          throw new Error(err.error || `Analysis HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.insight || '';
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return {
    isAnalyzing,
    analyzeImage,
  };
}
