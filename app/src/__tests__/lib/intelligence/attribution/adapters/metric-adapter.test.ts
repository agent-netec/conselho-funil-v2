import { Timestamp } from 'firebase/firestore';
import {
  adaptToPerformanceMetricDoc,
  mapSourceToPlatform,
} from '@/lib/intelligence/attribution/adapters/metric-adapter';

// Mock firebase/firestore Timestamp
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1000000, nanoseconds: 0 })),
    fromDate: jest.fn((d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })),
  },
}));

describe('metric-adapter (S28-CL-03 / DT-04)', () => {
  const mockTimestamp = { seconds: 1700000000, nanoseconds: 0 } as unknown as Timestamp;

  describe('mapSourceToPlatform', () => {
    it('should map known sources correctly', () => {
      expect(mapSourceToPlatform('meta')).toBe('meta');
      expect(mapSourceToPlatform('google')).toBe('google');
      expect(mapSourceToPlatform('organic')).toBe('organic');
      expect(mapSourceToPlatform('aggregated')).toBe('aggregated');
      expect(mapSourceToPlatform('tiktok')).toBe('tiktok');
    });

    it('should fallback to aggregated for unknown sources', () => {
      expect(mapSourceToPlatform('unknown')).toBe('aggregated');
      expect(mapSourceToPlatform('')).toBe('aggregated');
    });
  });

  describe('adaptToPerformanceMetricDoc', () => {
    it('should pass through legacy format unchanged', () => {
      const legacyDoc = {
        id: 'metric_1',
        brandId: 'brand_1',
        platform: 'meta',
        name: 'Campaign A',
        level: 'campaign',
        externalId: 'ext_1',
        metrics: {
          spend: 100,
          revenue: 500,
          roas: 5,
          cac: 20,
          ctr: 2.5,
          cpc: 1.5,
          conversions: 5,
          clicks: 200,
          impressions: 8000,
        },
        timestamp: mockTimestamp,
      };

      const result = adaptToPerformanceMetricDoc(legacyDoc as Record<string, unknown>);
      expect(result).toBe(legacyDoc); // Same reference — passthrough
      expect(result.platform).toBe('meta');
      expect(result.metrics.spend).toBe(100);
      expect(result.metrics.clicks).toBe(200);
    });

    it('should adapt modern format to legacy format', () => {
      const modernDoc = {
        id: 'metric_modern_1',
        brandId: 'brand_2',
        source: 'google',
        data: {
          spend: 250,
          revenue: 1000,
          roas: 4,
          cac: 25,
          ctr: 3.0,
          cpc: 2.0,
          conversions: 10,
        },
        period: 'daily',
        timestamp: mockTimestamp,
      };

      const result = adaptToPerformanceMetricDoc(modernDoc as Record<string, unknown>);

      expect(result.id).toBe('metric_modern_1');
      expect(result.brandId).toBe('brand_2');
      expect(result.platform).toBe('google');
      expect(result.name).toBe('');
      expect(result.level).toBe('campaign');
      expect(result.externalId).toBe('');
      expect(result.metrics.spend).toBe(250);
      expect(result.metrics.revenue).toBe(1000);
      expect(result.metrics.roas).toBe(4);
      expect(result.metrics.conversions).toBe(10);
      expect(result.metrics.clicks).toBe(0);
      expect(result.metrics.impressions).toBe(0);
      expect(result.timestamp).toBe(mockTimestamp);
    });

    it('should map modern source "meta" to platform "meta"', () => {
      const modernMeta = {
        id: 'metric_meta_1',
        brandId: 'brand_3',
        source: 'meta',
        data: {
          spend: 50,
          revenue: 200,
          roas: 4,
          cac: 10,
          ctr: 1.5,
          cpc: 0.5,
          conversions: 5,
        },
        timestamp: mockTimestamp,
      };

      const result = adaptToPerformanceMetricDoc(modernMeta as Record<string, unknown>);
      expect(result.platform).toBe('meta');
    });

    it('should throw for unknown format', () => {
      const unknownDoc = {
        id: 'metric_unknown',
        brandId: 'brand_4',
        value: 42,
      };

      expect(() => adaptToPerformanceMetricDoc(unknownDoc as Record<string, unknown>)).toThrow(
        'Unknown metric format'
      );
    });

    it('should throw for empty object', () => {
      expect(() => adaptToPerformanceMetricDoc({} as Record<string, unknown>)).toThrow(
        'Unknown metric format'
      );
    });

    it('should handle modern format with missing optional fields gracefully', () => {
      const minimalModern = {
        source: 'organic',
        data: {
          spend: 0,
          revenue: 0,
          roas: 0,
          cac: 0,
          ctr: 0,
          cpc: 0,
          conversions: 0,
        },
        timestamp: mockTimestamp,
      };

      const result = adaptToPerformanceMetricDoc(minimalModern as Record<string, unknown>);
      expect(result.id).toBe('');
      expect(result.brandId).toBe('');
      expect(result.platform).toBe('organic');
    });
  });
});
