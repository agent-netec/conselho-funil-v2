import { Timestamp } from 'firebase/firestore';
import { SocialPlatform } from './vault';

export type PublisherJobStatus = 'pending' | 'adapting' | 'validating' | 'completed' | 'failed';

export interface PublisherJob {
  id: string;
  brandId: string;
  insightId: string;
  status: PublisherJobStatus;
  outputContentId?: string; // ID no Vault Library
  config: {
    platforms: SocialPlatform[];
    toneOverride?: string;
  };
  errors?: string[];
  startedAt: Timestamp;
  completedAt?: Timestamp;
}
