export interface AdsActionResponse {
  success: boolean;
  externalId: string;
  platform: 'meta' | 'google';
  actionTaken: 'pause' | 'adjust_budget' | 'resume' | 'update_creative' | 'sync_audience' | 'get_status';
  newValue?: number;
  details?: Record<string, unknown>;  // S30-PRE-02 (DT-06): Ex: { audienceSize: 1500 }
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
