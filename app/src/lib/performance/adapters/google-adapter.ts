import { AdsPlatformAdapter, RawAdsData } from './base-adapter';
import { AdPlatform } from '../../../types/performance';

export class GoogleAdsAdapter extends AdsPlatformAdapter {
  platform: AdPlatform = 'google';

  async fetchMetrics(credentials: any, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
    // TODO: Implementar integração real com Google Ads API
    console.log(`Fetching Google Ads data from ${period.start} to ${period.end}`);
    
    // Mock para fins de desenvolvimento inicial
    return [
      {
        platform: 'google',
        externalId: 'google_camp_1',
        name: 'Campanha de Teste Google',
        spend: 320.00,
        clicks: 850,
        impressions: 12000,
        conversions: 12
      }
    ];
  }
}
