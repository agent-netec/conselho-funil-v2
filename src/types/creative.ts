import { Timestamp } from 'firebase/firestore';

/**
 * Representa a performance de um ativo criativo (imagem ou vídeo)
 * Integrado ao motor MTA (Sprint 25)
 */
export interface CreativePerformance {
  id: string; // Hash do arquivo ou ID do anúncio
  assetUrl: string;
  type: 'image' | 'video';
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpa: number;
    ltvAttributed: number; // Calculado via MTA Engine (Sprint 25)
  };
  profitScore: number; // 0-100 (Calculado via algoritmo de scoring)
  fatigueIndex: number; // 0-1 (Probabilidade de saturação visual)
  updatedAt: Timestamp;
}

/**
 * Inputs para a geração de variantes de copy via AI
 */
export interface CopyGenerationInput {
  baseCopy: string;
  angle: 'fear' | 'greed' | 'authority' | 'curiosity';
  brandVoice: string; // Referência ao BrandKit
  targetAudience: string;
}

/**
 * Resultado da variação de copy gerada
 */
export interface CopyVariant {
  headline: string;
  primaryText: string;
  angle: string;
  generatedAt: Timestamp;
}
