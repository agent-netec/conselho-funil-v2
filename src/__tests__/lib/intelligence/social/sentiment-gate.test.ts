import { SocialIngestionNormalizer } from '../../../../lib/intelligence/social/normalizer';

describe('Sentiment Gate - Teste de Estresse (Dandara Validation)', () => {
  it('deve bloquear interações de crise extrema (sentimento 0.0)', () => {
    const raw = {
      id: 'crisis_001',
      item_type: 'comment',
      user_id: 'hater_1',
      username: 'hater',
      text: 'ESTE PRODUTO É UM LIXO! QUERO MEU DINHEIRO DE VOLTA AGORA!',
      sentiment_score: 0.0,
      timestamp: new Date().toISOString()
    };

    const interaction = SocialIngestionNormalizer.normalizeInstagram(raw);
    expect(interaction.requires_human_review).toBe(true);
  });

  it('deve bloquear interações no limite do gate (sentimento 0.29)', () => {
    const raw = {
      id: 'border_001',
      item_type: 'dm',
      user_id: 'user_2',
      username: 'user2',
      text: 'Não gostei muito do atendimento hoje.',
      sentiment_score: 0.29,
      timestamp: new Date().toISOString()
    };

    const interaction = SocialIngestionNormalizer.normalizeInstagram(raw);
    expect(interaction.requires_human_review).toBe(true);
  });

  it('deve liberar interações exatamente no limite aceitável (sentimento 0.3)', () => {
    const raw = {
      id: 'border_002',
      item_type: 'dm',
      user_id: 'user_3',
      username: 'user3',
      text: 'Pode ser melhor, mas ok.',
      sentiment_score: 0.3,
      timestamp: new Date().toISOString()
    };

    const interaction = SocialIngestionNormalizer.normalizeInstagram(raw);
    expect(interaction.requires_human_review).toBe(false);
  });

  it('deve assumir neutralidade segura (0.5) quando o score é omitido', () => {
    const raw = {
      id: 'neutral_001',
      item_type: 'comment',
      user_id: 'user_4',
      username: 'user4',
      text: 'Qual o horário de funcionamento?',
      timestamp: new Date().toISOString()
    };

    const interaction = SocialIngestionNormalizer.normalizeInstagram(raw);
    expect(interaction.requires_human_review).toBe(false);
  });
});
