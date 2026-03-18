import { Timestamp } from 'firebase/firestore';

// ============================================
// DESIGN SYSTEM — Design Director Types
// ============================================

export type DesignPieceRole = 'hook' | 'development' | 'proof' | 'retargeting' | 'standalone';

export interface DesignAnalysis {
  contextSummary: string;
  awarenessStage: string;
  recommendedPieces: DesignPieceRecommendation[];
  challenges: string[];
  recommendations: string[];
  chapeuProfile: string;
}

export interface DesignPieceRecommendation {
  role: DesignPieceRole;
  platform: string;
  format: string;
  safeZone: string;
  aspectRatio: string;
  rationale: string;
}

export interface DesignPreferences {
  userId: string;
  brandId: string;
  styleHistory: StyleSelection[];
  preferredStyles: string[];
  preferredCompositions: string[];
  avoidPatterns: string[];
  totalSelections: number;
  updatedAt: Timestamp;
}

export interface StyleSelection {
  selectedStyle: string;
  rejectedStyles: string[];
  platform: string;
  composition: string;
  createdAt: Timestamp;
}

export interface InspirationRef {
  id: string;
  url: string;
  assetId: string;
  extractedTraits: string[];
}

export interface BrandCharacter {
  id: string;
  name: string;
  role: 'ambassador' | 'founder' | 'customer' | 'mascot' | 'model';
  photoAssetId: string;
  photoUrl: string;
  description?: string;
  useFrequency: 'always' | 'sometimes' | 'rarely';
  createdAt: Timestamp;
}
