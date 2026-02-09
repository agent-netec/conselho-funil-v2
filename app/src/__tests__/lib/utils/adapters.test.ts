/**
 * Testes unitários para adapters de compatibilidade.
 * Sprint Sigma: SIG-PRE-TYP (RC-13 — Dandara)
 */
import { normalizePlatform, SocialPlatform } from '@/types/social-platform';
import { normalizeAwareness, SchwartzAwareness, LegacyAwareness } from '@/lib/utils/awareness-adapter';

describe('normalizePlatform', () => {
  it('deve converter PascalCase para lowercase', () => {
    expect(normalizePlatform('Instagram')).toBe('instagram');
    expect(normalizePlatform('LinkedIn')).toBe('linkedin');
    expect(normalizePlatform('X')).toBe('x');
    expect(normalizePlatform('TikTok')).toBe('tiktok');
    expect(normalizePlatform('WhatsApp')).toBe('whatsapp');
  });

  it('deve passar lowercase sem alteração (passthrough)', () => {
    const platforms: SocialPlatform[] = ['instagram', 'tiktok', 'linkedin', 'x', 'whatsapp'];
    platforms.forEach(p => {
      expect(normalizePlatform(p)).toBe(p);
    });
  });

  it('deve fazer fallback para lowercase em plataformas desconhecidas', () => {
    expect(normalizePlatform('YOUTUBE')).toBe('youtube');
    expect(normalizePlatform('Facebook')).toBe('facebook');
    expect(normalizePlatform('TWITTER')).toBe('twitter');
  });
});

describe('normalizeAwareness', () => {
  it('deve converter modelo PT legado para Schwartz', () => {
    const mappings: [LegacyAwareness, SchwartzAwareness][] = [
      ['fria', 'unaware'],
      ['morna', 'solution'],
      ['quente', 'product'],
    ];
    mappings.forEach(([legacy, expected]) => {
      expect(normalizeAwareness(legacy)).toBe(expected);
    });
  });

  it('deve passar Schwartz sem alteração (passthrough)', () => {
    const stages: SchwartzAwareness[] = ['unaware', 'problem', 'solution', 'product', 'most_aware'];
    stages.forEach(s => {
      expect(normalizeAwareness(s)).toBe(s);
    });
  });

  it('deve fazer fallback para valor original em awareness desconhecida', () => {
    expect(normalizeAwareness('custom_stage')).toBe('custom_stage');
    expect(normalizeAwareness('unknown')).toBe('unknown');
  });
});
