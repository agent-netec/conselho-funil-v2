import { Timestamp } from 'firebase/firestore';

export interface UsageLog {
  id?: string;
  userId: string;
  brandId?: string;
  model: string;
  provider: 'google' | 'jina';
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  feature: string;
  timestamp: Timestamp;
}

export interface BrandUsageLimit {
  dailyLimit: number; // Em USD ou créditos equivalentes
  currentDailyUsage: number;
  lastReset: Timestamp;
}

// Estendendo o tipo Brand existente no database.ts se necessário, 
// mas idealmente adicionamos ao aiConfiguration da Brand.
