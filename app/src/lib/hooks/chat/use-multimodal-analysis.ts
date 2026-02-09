'use client';

import { useState, useCallback } from 'react';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';

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
        const result = await analyzeMultimodalWithGemini(
          prompt,
          imageUrl,
          'image/png'
        );
        return result;
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
