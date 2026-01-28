/**
 * @fileoverview Tipos para recuperação de dados e contexto
 * @module types/retrieval
 * @version 1.0.0
 */

import { ScopeLevel } from './scoped-data';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  namespace: string;
  metadata: {
    scopeLevel: ScopeLevel;
    brandId?: string;
    funnelId?: string;
    campaignId?: string;
    dataType: string;
    isApprovedForAI: boolean;
    [key: string]: any;
  };
}

export interface MergedChunk extends RetrievedChunk {
  namespacePriority: number;
  finalScore: number;
}
