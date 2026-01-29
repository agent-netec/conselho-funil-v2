export interface AdsActionResponse {
  success: boolean;
  externalId: string;
  platform: 'meta' | 'google';
  actionTaken: 'pause' | 'adjust_budget' | 'resume';
  newValue?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface IAdsAdapter {
  pauseAdEntity(entityId: string, type: 'campaign' | 'adset'): Promise<AdsActionResponse>;
  adjustBudget(entityId: string, type: 'campaign' | 'adset', newBudget: number): Promise<AdsActionResponse>;
  getEntityStatus(entityId: string): Promise<{ status: string; currentBudget: number }>;
}
