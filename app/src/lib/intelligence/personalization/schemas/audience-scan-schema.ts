/**
 * @fileoverview Zod schema for Gemini AudienceScan response validation (S28-PS-02 / DT-03)
 *
 * Validates the JSON response from Gemini against the expected AudienceScan shape.
 * Used via safeParse in engine.ts to prevent corrupted data propagation.
 *
 * @see _netecmt/packs/stories/sprint-28-hybrid-personalization/stories.md (PS-02)
 */
import { z } from 'zod';

/**
 * Schema validating the raw AI response from Gemini's AudienceScan prompt.
 *
 * Fields mirror the `SAÍDA ESPERADA` section of AUDIENCE_SCAN_SYSTEM_PROMPT
 * in `lib/ai/prompts/audience-scan.ts`.
 */
export const AudienceScanResponseSchema = z.object({
  persona: z.object({
    demographics: z.string().min(1),
    painPoints: z.array(z.string()).min(1),
    desires: z.array(z.string()).min(1),
    objections: z.array(z.string()).min(1),
    sophisticationLevel: z.union([
      z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
    ]),
  }),
  propensity: z.object({
    score: z.number().min(0).max(1),
    segment: z.enum(['hot', 'warm', 'cold']),
    reasoning: z.string().min(1),
  }),
  confidence: z.number().min(0).max(1),
});

/** Typed inference of a valid Gemini AudienceScan response. */
export type AudienceScanAIResponse = z.infer<typeof AudienceScanResponseSchema>;

/**
 * Safe fallback returned when Gemini's response fails Zod validation.
 * All values are neutral/safe defaults — prevents crash propagation (DT-03).
 */
export const FALLBACK_SCAN_RESPONSE: AudienceScanAIResponse = {
  persona: {
    demographics: 'Dados indisponíveis — resposta do modelo falhou na validação',
    painPoints: ['Não identificado'],
    desires: ['Não identificado'],
    objections: ['Não identificado'],
    sophisticationLevel: 1,
  },
  propensity: {
    score: 0,
    segment: 'cold',
    reasoning: 'Fallback automático — resposta do modelo não passou na validação de schema',
  },
  confidence: 0,
};
