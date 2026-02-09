/**
 * @fileoverview Contract tests for Gemini AudienceScan response (S28-PS-02 / DT-03)
 *
 * Validates:
 * 1. Schema validation with correct data → passes
 * 2. Incorrect types (sophisticationLevel > 5) → fails
 * 3. Invalid JSON → fallback returned
 * 4. PII sanitization — AUDIENCE_SCAN_SYSTEM_PROMPT & buildAudienceScanPrompt
 *    must NOT include email/name/IP/phone (P5)
 *
 * @see _netecmt/packs/stories/sprint-28-hybrid-personalization/stories.md (PS-02)
 */

import {
  AudienceScanResponseSchema,
  FALLBACK_SCAN_RESPONSE,
  type AudienceScanAIResponse,
} from '@/lib/intelligence/personalization/schemas/audience-scan-schema';
import { AudienceIntelligenceEngine } from '@/lib/intelligence/personalization/engine';
import {
  AUDIENCE_SCAN_SYSTEM_PROMPT,
  buildAudienceScanPrompt,
} from '@/lib/ai/prompts/audience-scan';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A valid Gemini response that should pass Zod validation. */
const VALID_RESPONSE: AudienceScanAIResponse = {
  persona: {
    demographics: 'Mulheres 25-45, classe B/C, sudeste do Brasil',
    painPoints: ['Falta de tempo', 'Custo alto de tráfego pago'],
    desires: ['Escalar negócio online', 'Renda passiva'],
    objections: ['Será que funciona para mim?', 'Já tentei e não deu certo'],
    sophisticationLevel: 3,
  },
  propensity: {
    score: 0.72,
    segment: 'hot',
    reasoning: 'Alta interação com conteúdo de fundo de funil e múltiplos page views em 48h',
  },
  confidence: 0.85,
};

// ---------------------------------------------------------------------------
// 1. Schema Validation — correct data
// ---------------------------------------------------------------------------
describe('AudienceScanResponseSchema — contract validation', () => {
  it('should parse a valid response successfully', () => {
    const result = AudienceScanResponseSchema.safeParse(VALID_RESPONSE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.persona.sophisticationLevel).toBe(3);
      expect(result.data.propensity.segment).toBe('hot');
      expect(result.data.confidence).toBe(0.85);
    }
  });

  it('should accept boundary values (sophisticationLevel=1, score=0, confidence=0)', () => {
    const boundary: AudienceScanAIResponse = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, sophisticationLevel: 1 },
      propensity: { ...VALID_RESPONSE.propensity, score: 0, segment: 'cold' },
      confidence: 0,
    };
    const result = AudienceScanResponseSchema.safeParse(boundary);
    expect(result.success).toBe(true);
  });

  it('should accept boundary values (sophisticationLevel=5, score=1, confidence=1)', () => {
    const boundary: AudienceScanAIResponse = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, sophisticationLevel: 5 },
      propensity: { ...VALID_RESPONSE.propensity, score: 1 },
      confidence: 1,
    };
    const result = AudienceScanResponseSchema.safeParse(boundary);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Schema Validation — incorrect types
// ---------------------------------------------------------------------------
describe('AudienceScanResponseSchema — rejection of invalid data', () => {
  it('should reject sophisticationLevel > 5', () => {
    const invalid = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, sophisticationLevel: 6 },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject sophisticationLevel < 1', () => {
    const invalid = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, sophisticationLevel: 0 },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer sophisticationLevel', () => {
    const invalid = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, sophisticationLevel: 2.5 },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject propensity score > 1', () => {
    const invalid = {
      ...VALID_RESPONSE,
      propensity: { ...VALID_RESPONSE.propensity, score: 1.5 },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject propensity score < 0', () => {
    const invalid = {
      ...VALID_RESPONSE,
      propensity: { ...VALID_RESPONSE.propensity, score: -0.1 },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid segment value', () => {
    const invalid = {
      ...VALID_RESPONSE,
      propensity: { ...VALID_RESPONSE.propensity, segment: 'lukewarm' },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject confidence > 1', () => {
    const invalid = { ...VALID_RESPONSE, confidence: 1.1 };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject empty painPoints array', () => {
    const invalid = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, painPoints: [] },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject empty demographics string', () => {
    const invalid = {
      ...VALID_RESPONSE,
      persona: { ...VALID_RESPONSE.persona, demographics: '' },
    };
    const result = AudienceScanResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject missing persona field entirely', () => {
    const { persona, ...noPersona } = VALID_RESPONSE;
    const result = AudienceScanResponseSchema.safeParse(noPersona);
    expect(result.success).toBe(false);
  });

  it('should reject missing propensity field entirely', () => {
    const { propensity, ...noPropensity } = VALID_RESPONSE;
    const result = AudienceScanResponseSchema.safeParse(noPropensity);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Engine parseAndValidate — invalid JSON → fallback
// ---------------------------------------------------------------------------
describe('AudienceIntelligenceEngine.parseAndValidate', () => {
  it('should return validated data for a valid JSON string', () => {
    const json = JSON.stringify(VALID_RESPONSE);
    const result = AudienceIntelligenceEngine.parseAndValidate(json);
    expect(result.persona.sophisticationLevel).toBe(3);
    expect(result.propensity.segment).toBe('hot');
    expect(result.confidence).toBe(0.85);
  });

  it('should return FALLBACK when Gemini returns invalid JSON', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = AudienceIntelligenceEngine.parseAndValidate('not-a-json{{{');
    expect(result).toEqual(FALLBACK_SCAN_RESPONSE);
    consoleSpy.mockRestore();
  });

  it('should return FALLBACK when Gemini returns empty string', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = AudienceIntelligenceEngine.parseAndValidate('');
    expect(result).toEqual(FALLBACK_SCAN_RESPONSE);
    consoleSpy.mockRestore();
  });

  it('should return FALLBACK when JSON is valid but schema fails', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const badSchema = JSON.stringify({
      persona: { demographics: 'ok', painPoints: ['x'], desires: ['y'], objections: ['z'], sophisticationLevel: 99 },
      propensity: { score: 0.5, segment: 'hot', reasoning: 'r' },
      confidence: 0.5,
    });
    const result = AudienceIntelligenceEngine.parseAndValidate(badSchema);
    expect(result).toEqual(FALLBACK_SCAN_RESPONSE);
    consoleSpy.mockRestore();
  });

  it('should return FALLBACK when Gemini wraps response in markdown code block', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const wrappedJson = '```json\n' + JSON.stringify(VALID_RESPONSE) + '\n```';
    const result = AudienceIntelligenceEngine.parseAndValidate(wrappedJson);
    expect(result).toEqual(FALLBACK_SCAN_RESPONSE);
    consoleSpy.mockRestore();
  });

  it('FALLBACK_SCAN_RESPONSE itself should be valid per schema', () => {
    const result = AudienceScanResponseSchema.safeParse(FALLBACK_SCAN_RESPONSE);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. PII Sanitization (P5) — prompts must NOT contain email/name/IP/phone
// ---------------------------------------------------------------------------
describe('PII sanitization in audience-scan prompts (P5)', () => {
  // PII patterns — same set used across the project for compliance
  const PII_PATTERNS = [
    { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
    { name: 'phone (BR)', regex: /\(\d{2}\)\s?\d{4,5}-?\d{4}/ },
    { name: 'phone (intl)', regex: /\+\d{1,3}\s?\d{6,14}/ },
    { name: 'IPv4', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  ];

  it('AUDIENCE_SCAN_SYSTEM_PROMPT should NOT contain PII patterns', () => {
    for (const { name, regex } of PII_PATTERNS) {
      expect(regex.test(AUDIENCE_SCAN_SYSTEM_PROMPT)).toBe(false);
    }
  });

  it('buildAudienceScanPrompt should NOT leak full lead IDs (PII proxy)', () => {
    const mockLeads = [
      {
        id: 'lead_abc123def456ghi789',
        brandId: 'brand_test',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      },
    ] as unknown as import('@/types/journey').JourneyLead[];

    const mockEvents = [
      {
        id: 'evt_1',
        leadId: 'lead_abc123def456ghi789',
        type: 'page_view',
        payload: { metadata: { page: '/checkout' } },
        timestamp: { seconds: 1700000000, nanoseconds: 0 },
      },
    ] as unknown as import('@/types/journey').JourneyEvent[];

    const prompt = buildAudienceScanPrompt(mockLeads, mockEvents);

    // Full lead ID must NOT appear (only truncated 8-char prefix allowed)
    expect(prompt).not.toContain('lead_abc123def456ghi789');

    // Email & name must NOT appear in the generated prompt
    expect(prompt).not.toContain('user@example.com');
    expect(prompt).not.toContain('John Doe');

    // PII patterns must not appear
    for (const { name, regex } of PII_PATTERNS) {
      expect(regex.test(prompt)).toBe(false);
    }
  });
});
