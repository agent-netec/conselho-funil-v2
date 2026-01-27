import { generateWithGemini } from '../../ai/gemini';
import { AUDIENCE_SCAN_SYSTEM_PROMPT, buildAudienceScanPrompt } from '../../ai/prompts/audience-scan';
import { saveAudienceScan } from '../../firebase/personalization';
import { getLeadEvents } from '../../firebase/journey';
import { AudienceScan } from '@/types/personalization';
import { JourneyLead, JourneyEvent } from '@/types/journey';
import { collection, query, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PropensityEngine } from './propensity';

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
      const aiResponse = await generateWithGemini(prompt, {
        systemPrompt: AUDIENCE_SCAN_SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: 'application/json'
      } as any);

      const result = JSON.parse(aiResponse);

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

      const scanId = await saveAudienceScan(brandId, scanData);
      
      return { id: scanId, ...scanData };

    } catch (error) {
      console.error('[AudienceIntelligenceEngine] Erro no Deep-Scan:', error);
      throw new Error('Falha ao processar inteligência de audiência com IA.');
    }
  }
}
