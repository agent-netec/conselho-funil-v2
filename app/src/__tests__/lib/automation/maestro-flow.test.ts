import { PersonalizationMaestro, LeadContext } from '@/lib/intelligence/personalization/maestro';
import { EventNormalizer } from '@/lib/automation/normalizer';
import { Timestamp } from 'firebase/firestore';

// Mock do Firebase para evitar chamadas reais durante o teste unitário/integração simulado
jest.mock('@/lib/firebase/config', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() })
  }
}));

describe('ST-20.4: Testes de Fluxo de Automação (Maestro & Webhooks)', () => {
  const brandId = 'test-brand-123';
  const leadId = 'lead-meta-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Deve normalizar um evento de Lead Gen da Meta e atualizar o Maestro', async () => {
    const metaPayload = {
      entry: [{
        changes: [{
          field: 'leadgen',
          value: {
            leadgen_id: leadId,
            form_id: 'form-789'
          }
        }]
      }]
    };

    // 1. Testar Normalização
    const { leadId: normalizedLeadId, interaction } = EventNormalizer.normalize({
      platform: 'meta',
      brandId,
      payload: metaPayload
    });

    expect(normalizedLeadId).toBe(leadId);
    expect(interaction.type).toBe('ad_click');
    expect(interaction.platform).toBe('meta');

    // 2. Simular Processamento no Maestro
    const mockGetDoc = require('firebase/firestore').getDoc;
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false // Simula lead novo
    });

    const processSpy = jest.spyOn(PersonalizationMaestro, 'processInteraction');
    await PersonalizationMaestro.processInteraction(brandId, leadId, interaction);

    expect(processSpy).toHaveBeenCalledWith(brandId, leadId, interaction);
    
    const setDoc = require('firebase/firestore').setDoc;
    expect(setDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
      currentAwareness: 'UNAWARE', // Começa como Unaware
      score: 10
    }));
  });

  it('Deve progredir o nível de consciência do lead após múltiplas interações', async () => {
    const mockGetDoc = require('firebase/firestore').getDoc;
    
    // Simula lead já existente com score 35 (quase SOLUTION_AWARE)
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: leadId,
      data: () => ({
        brandId,
        currentAwareness: 'PROBLEM_AWARE',
        score: 35,
        tags: [],
        metadata: {}
      })
    });

    const dmInteraction: LeadContext['lastInteraction'] = {
      type: 'dm_received',
      platform: 'instagram',
      timestamp: Timestamp.now() as any,
      contentId: 'quero-saber-mais'
    };

    await PersonalizationMaestro.processInteraction(brandId, leadId, dmInteraction);

    const updateDoc = require('firebase/firestore').updateDoc;
    // Score anterior 35 + DM (15) = 50. 50 > 40 -> SOLUTION_AWARE
    expect(updateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
      currentAwareness: 'SOLUTION_AWARE',
      score: 50
    }));
  });

  it('Deve falhar ao normalizar payload malformado (Resiliência)', () => {
    const badPayload = { invalid: 'data' };
    
    expect(() => {
      EventNormalizer.normalize({
        platform: 'meta',
        brandId,
        payload: badPayload
      });
    }).toThrow('Payload Meta Ads inválido ou não reconhecido.');
  });
});
