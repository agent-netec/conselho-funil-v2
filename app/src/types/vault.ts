import { Timestamp } from 'firebase/firestore';

export type VaultStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type DNAType = 'hook' | 'structure' | 'style_guide' | 'template';
import type { SocialPlatform as _SocialPlatform } from './social-platform';
export type SocialPlatform = _SocialPlatform;

export interface CopyDNA {
  id: string;
  brandId: string;
  name: string;
  type: DNAType;
  content: string;
  platform_optimization: SocialPlatform[];
  performance_metrics?: {
    avg_engagement: number;
    usage_count: number;
  };
  tags: string[];
  updatedAt: Timestamp;
}

export interface VaultAsset {
  id: string;
  brandId: string;
  name: string;
  type: 'image' | 'video' | 'logo' | 'document';
  url: string;
  storagePath: string;
  status: 'pending' | 'approved' | 'archived';
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}

export interface VaultContent {
  id: string;
  brandId: string;
  sourceInsightId?: string;
  status: VaultStatus;
  variants: {
    platform: SocialPlatform;
    copy: string;
    mediaRefs: string[]; // IDs de assets no vault
    metadata: Record<string, any>; // ex: thread sequence para X
  }[];
  approvalChain: {
    approvedBy?: string;
    approvedAt?: Timestamp;
  };
  createdAt: Timestamp;
}
