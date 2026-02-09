import { generateWithGemini } from '../../ai/gemini';
import { AUDIENCE_SCAN_SYSTEM_PROMPT, buildAudienceScanPrompt } from '../../ai/prompts/audience-scan';
import { saveAudienceScan } from '../../firebase/personalization';
import { getLeadEvents } from '../../firebase/journey';
import { AudienceScan } from '@/types/personalization';
import { JourneyLead, JourneyEvent } from '@/types/journey';
import { collection, query, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PropensityEngine } from './propensity';
import {
  AudienceScanResponseSchema,
  FALLBACK_SCAN_RESPONSE,
  type AudienceScanAIResponse,
} from './schemas/audience-scan-schema';

/**
 * S28-PS-01 DT-09: Retry config — exponential backoff no engine (NÃO no gemini.ts)
 * Wrapper isolado para não impactar outros chamadores de generateWithGemini.
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,          // 1s → 2s → 4s
  maxDelay: 10000,           // Cap em 10s
  retryableStatuses: [429, 500, 502, 503],
} as const;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable = RETRY_CONFIG.retryableStatuses.some(
        status => lastError!.message.includes(String(status))
      );
      if (!isRetryable || attempt === RETRY_CONFIG.maxRetries) {
        throw lastError;
      }
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelay
      );
      console.warn(`[AudienceEngine] Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * @fileoverview Audience Intelligence Engine (ST-29.1)
 * Implementa o "Deep-Scan" de audiência usando Gemini Flash.
 */
export class AudienceIntelligenceEngine {
  
  /**
   * Executa o scan profundo de audiência para uma marca.
   * Analisa leads e eventos recentes para deduzir personas.
   */
  static async runDeepScan(brandId: string, leadLimit: number = 100): Promise<AudienceScan> {
    // 1. Coletar leads recentes da marca
    const leadsRef = collection(db, 'leads');
    const qLeads = query(
      leadsRef, 
      where('brandId', '==', brandId), 
      limit(leadLimit)
    );
    const leadsSnap = await getDocs(qLeads);
    const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JourneyLead));

    if (leads.length === 0) {
      throw new Error(`Nenhum lead encontrado para a marca ${brandId}.`);
    }

    // 2. Coletar eventos desses leads (amostragem) e calcular propensão real
    const allEvents: JourneyEvent[] = [];
    let totalScore = 0;
    const segmentCounts = { hot: 0, warm: 0, cold: 0 };

    for (const lead of leads.slice(0, 20)) { 
      const events = await getLeadEvents(lead.id, 10);
      allEvents.push(...events);

      // ST-29.3: Refinamento de Propensão
      const propensity = PropensityEngine.calculate(lead, events);
      totalScore += propensity.score;
      segmentCounts[propensity.segment]++;
    }

    // 3. Preparar Prompt e chamar Gemini
    const prompt = buildAudienceScanPrompt(leads, allEvents);
    
    try {
      // S28-PS-01 DT-09: Retry wrapper — backoff exponencial 1s→2s→4s
      const aiResponse = await withRetry(() =>
        generateWithGemini(prompt, {
          systemPrompt: AUDIENCE_SCAN_SYSTEM_PROMPT,
          temperature: 0.3,
          responseMimeType: 'application/json'
        })
      );

      // S28-PS-02 DT-03: Zod safeParse + fallback (substitui JSON.parse cru)
      const result = AudienceIntelligenceEngine.parseAndValidate(aiResponse);

      // Determinar segmento predominante baseado nos dados reais calculados
      const predominantSegment = (Object.entries(segmentCounts) as [keyof typeof segmentCounts, number][])
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

      // 4. Estruturar e Salvar AudienceScan
      const scanData: Omit<AudienceScan, 'id'> = {
        brandId,
        name: `Deep-Scan ${new Date().toLocaleDateString('pt-BR')} - ${leads.length} leads`,
        persona: result.persona,
        propensity: {
          score: totalScore / Math.min(leads.length, 20),
          segment: predominantSegment,
          reasoning: result.propensity.reasoning
        },
        metadata: {
          leadCount: leads.length,
          confidence: result.confidence || 0.8,
          createdAt: Timestamp.now()
        }
      };

      const scanResult = await saveAudienceScan(brandId, scanData);
      const scanId = typeof scanResult === 'string' ? scanResult : scanResult.id;
      
      return { id: scanId, ...scanData };

    } catch (error) {
      console.error('[AudienceIntelligenceEngine] Erro no Deep-Scan:', error);
      throw new Error('Falha ao processar inteligência de audiência com IA.');
    }
  }

  /**
   * S28-PS-02 DT-03: Parse + Zod validation with safe fallback.
   * Replaces raw JSON.parse — prevents corrupted Gemini responses from propagating.
   * @internal Exported for contract tests only.
   */
  static parseAndValidate(aiResponse: string): AudienceScanAIResponse {
    let aiJson: unknown;
    try {
      aiJson = JSON.parse(aiResponse);
    } catch {
      console.error('[DeepScan] Gemini returned invalid JSON');
      return FALLBACK_SCAN_RESPONSE;
    }

    const parsed = AudienceScanResponseSchema.safeParse(aiJson);
    if (!parsed.success) {
      console.error('[DeepScan] Gemini response schema validation failed:', parsed.error.issues);
      return FALLBACK_SCAN_RESPONSE;
    }

    return parsed.data;
  }
}
