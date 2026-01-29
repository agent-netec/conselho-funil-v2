import { SocialIngestionNormalizer } from '../../../../lib/intelligence/social/normalizer';
import { SocialIngestionMocks } from '../../../../lib/intelligence/social/mocks';

describe('SocialIngestion (ST-17.1)', () => {
  describe('Normalization', () => {
    it('should normalize Instagram comments correctly', () => {
      const interaction = SocialIngestionMocks.simulateInstagramComment(0.9);
      
      expect(interaction.platform).toBe('instagram');
      expect(interaction.type).toBe('comment');
      expect(interaction.author.username).toBe('cliente_feliz');
      expect(interaction.requires_human_review).toBe(false);
    });

    it('should normalize WhatsApp messages correctly', () => {
      const interaction = SocialIngestionMocks.simulateWhatsAppMessage();
      
      expect(interaction.platform).toBe('whatsapp');
      expect(interaction.type).toBe('dm');
      expect(interaction.author.id).toBe('5511999999999');
    });
  });

  describe('Sentiment Gate', () => {
    it('should flag interactions with sentiment < 0.3 for human review', () => {
      const interaction = SocialIngestionMocks.simulateInstagramComplaint();
      
      expect(interaction.author.sentiment).toBeLessThan(0.3);
      expect(interaction.requires_human_review).toBe(true);
    });

    it('should NOT flag interactions with sentiment >= 0.3', () => {
      const interaction = SocialIngestionMocks.simulateInstagramComment(0.3);
      
      expect(interaction.author.sentiment).toBe(0.3);
      expect(interaction.requires_human_review).toBe(false);
    });

    it('should use default neutral sentiment if none provided', () => {
      const raw = {
        id: 'ig_123',
        item_type: 'dm',
        user_id: 'user_1',
        username: 'test',
        text: 'Hello',
        timestamp: new Date().toISOString()
      };
      
      const interaction = SocialIngestionNormalizer.normalizeInstagram(raw);
      expect(interaction.requires_human_review).toBe(false); // Default 0.5 >= 0.3
    });
  });
});
