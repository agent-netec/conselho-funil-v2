import { FunnelTrackerUtils } from '../funnel-utils';

describe('FunnelTrackerUtils', () => {
  describe('identifyPageType', () => {
    it('should identify checkout pages', () => {
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/checkout')).toBe('checkout');
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/pay/order')).toBe('checkout');
    });

    it('should identify thank you pages', () => {
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/obrigado')).toBe('thank_you');
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/thank-you')).toBe('thank_you');
    });

    it('should identify VSL pages', () => {
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/vsl-video')).toBe('vsl');
    });

    it('should identify landing pages', () => {
      expect(FunnelTrackerUtils.identifyPageType('https://site.com/lp-vendas-2024')).toBe('landing_page');
    });
  });

  describe('sanitizeUrl', () => {
    it('should remove PII and tracking params', () => {
      const url = 'https://site.com/checkout?email=test@test.com&fbclid=123&utm_source=fb&token=xyz123';
      const sanitized = FunnelTrackerUtils.sanitizeUrl(url);
      expect(sanitized).toBe('https://site.com/checkout');
    });

    it('should keep harmless params', () => {
      const url = 'https://site.com/product?id=999';
      const sanitized = FunnelTrackerUtils.sanitizeUrl(url);
      expect(sanitized).toBe('https://site.com/product?id=999');
    });

    it('should remove trailing slash', () => {
      const url = 'https://site.com/page/';
      const sanitized = FunnelTrackerUtils.sanitizeUrl(url);
      expect(sanitized).toBe('https://site.com/page');
    });
  });

  describe('generateStoragePath', () => {
    it('should generate path following the contract', () => {
      const path = FunnelTrackerUtils.generateStoragePath('brand1', 'comp1', 'asset1');
      expect(path).toBe('brands/brand1/competitors/comp1/asset1.png');
    });
  });
});
