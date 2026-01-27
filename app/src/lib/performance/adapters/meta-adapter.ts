import { AdsPlatformAdapter, RawAdsData } from './base-adapter';
import { AdPlatform } from '../../../types/performance';

export class MetaAdsAdapter extends AdsPlatformAdapter {
  platform: AdPlatform = 'meta';

  async fetchMetrics(credentials: any, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
    // TODO: Implementar integração real com Meta Graph API
    console.log(`Fetching Meta Ads data from ${period.start} to ${period.end}`);
    
    // Mock para fins de desenvolvimento inicial
    return [
      {
        platform: 'meta',
        externalId: 'meta_camp_1',
        name: 'Campanha de Teste Meta',
        spend: 150.50,
        clicks: 1200,
        impressions: 50000,
        conversions: 45
      }
    ];
  }
}
