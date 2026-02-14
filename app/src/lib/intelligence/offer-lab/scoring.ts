import { OfferDocument } from '@/types/offer';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// OFFER → EXPERTS MAPPING (Brain Integration — Sprint D)
// ═══════════════════════════════════════════════════════

interface OfferExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

const OFFER_EXPERT_MAP: Record<string, OfferExpertMapping[]> = {
  offer_quality: [
    { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
    { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
  ],
};

function buildOfferBrainContext(): string {
  const parts: string[] = [];

  for (const [, experts] of Object.entries(OFFER_EXPERT_MAP)) {
    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      const redFlags = brain.redFlags.slice(0, 3).map(rf =>
        `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
      ).join('\n');

      const goldStandards = brain.goldStandards.slice(0, 2).map(gs =>
        `- **${gs.label}**: ${gs.example}`
      ).join('\n');

      parts.push(
        `### ${brain.name} — ${brain.subtitle}\n` +
        `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
        `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
        (redFlags ? `**Erros Comuns:**\n${redFlags}\n` : '') +
        (goldStandards ? `**Padroes de Excelencia:**\n${goldStandards}` : '')
      );
    }
  }

  return parts.join('\n\n---\n\n');
}

export interface OfferQualityInsight {
  counselorId: string;
  counselorName: string;
  frameworkUsed: string;
  score: number;
  opinion: string;
  redFlagsTriggered: string[];
  goldStandardsHit: string[];
}

export interface OfferQualityResult {
  overallQuality: number;
  insights: OfferQualityInsight[];
  summary: string;
}

/**
 * Motor de Scoring de Ofertas (Offer Irresistibility Engine)
 * Baseado na Equação de Valor: (Sonho * Probabilidade) / (Tempo * Esforço)
 */
export class OfferScoringEngine {
  /**
   * Calcula o Irresistibility Score de uma oferta.
   * Retorna um score de 0 a 100 e os fatores detalhados.
   */
  static calculateScore(offerData: Omit<OfferDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const { dreamOutcome, perceivedLikelihood, timeDelay, effortSacrifice } = offerData.scoring.factors;

    // 1. Cálculo Base da Equação de Valor
    // Numerador: O que o cliente ganha (Desejo)
    // Denominador: O que o cliente "paga" em atrito (Resistência)
    // Usamos uma escala de 1-10 para os fatores para evitar divisão por zero e normalizar.
    
    const numerator = dreamOutcome * perceivedLikelihood;
    const denominator = (timeDelay + effortSacrifice) || 1; // Evita divisão por zero
    
    // O valor bruto pode variar muito, então normalizamos para uma escala de 0-100
    // O valor máximo teórico (10*10)/(1+1) = 50
    // O valor mínimo teórico (1*1)/(10+10) = 0.05
    const rawScore = numerator / denominator;
    
    // Normalização (ajustada para que uma oferta "boa" fique acima de 70)
    // 50 -> 100
    // 10 -> 70
    // 1 -> 20
    let normalizedScore = Math.min(100, Math.round((rawScore / 50) * 100));

    // 2. Bônus por Componentes da Oferta
    let bonusPoints = 0;
    
    // Bônus por Ancoragem de Preço (Valor Percebido vs Preço Real)
    const priceAnchorRatio = offerData.components.coreProduct.perceivedValue / (offerData.components.coreProduct.price || 1);
    if (priceAnchorRatio >= 10) bonusPoints += 10;
    else if (priceAnchorRatio >= 5) bonusPoints += 5;

    // Bônus por Bônus Complementares
    const avgBonusComplementarity = offerData.components.bonuses.reduce((acc, b) => acc + (b.complementarityScore ?? 0), 0) / (offerData.components.bonuses.length || 1);
    if (avgBonusComplementarity > 80 && offerData.components.bonuses.length >= 3) bonusPoints += 10;

    // Bônus por Inversão de Risco
    if (offerData.components.riskReversal.length > 50) bonusPoints += 5;

    // Bônus por Escassez/Urgência
    if (offerData.components.scarcity && offerData.components.urgency) bonusPoints += 5;

    const finalScore = Math.min(100, normalizedScore + bonusPoints);

    return {
      total: finalScore,
      factors: {
        dreamOutcome,
        perceivedLikelihood,
        timeDelay,
        effortSacrifice
      },
      analysis: this.generateAnalysis(finalScore, rawScore, priceAnchorRatio)
    };
  }

  private static generateAnalysis(score: number, rawScore: number, anchorRatio: number): string[] {
    const insights: string[] = [];

    if (score < 50) insights.push("Oferta Fraca: O atrito (tempo/esforço) está matando o desejo.");
    if (anchorRatio < 3) insights.push("Ancoragem Insuficiente: Aumente o valor percebido ou adicione bônus de alto valor.");
    if (score >= 80) insights.push("Oferta Irresistível: Excelente equilíbrio entre promessa e facilidade de execução.");

    return insights;
  }

  /**
   * Sprint D: AI-powered qualitative evaluation using Kennedy + Brunson frameworks.
   * Complements calculateScore() (pure formula) with expert-grounded insights.
   */
  static async evaluateOfferQuality(
    offerData: Omit<OfferDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OfferQualityResult> {
    const brainContext = buildOfferBrainContext();

    const prompt = `Voce e um consultor senior de ofertas irresistiveis.
Use os frameworks dos especialistas abaixo para avaliar a oferta.

## FRAMEWORKS DOS ESPECIALISTAS
${brainContext}

## DADOS DA OFERTA
- Produto principal: ${offerData.components.coreProduct.name}
- Preco: R$ ${offerData.components.coreProduct.price}
- Valor percebido: R$ ${offerData.components.coreProduct.perceivedValue}
- Bonus: ${offerData.components.bonuses.map(b => b.name).join(', ') || 'Nenhum'}
- Inversao de risco: ${offerData.components.riskReversal || 'Nao definida'}
- Escassez: ${offerData.components.scarcity || 'Nao definida'}
- Urgencia: ${offerData.components.urgency || 'Nao definida'}
- Dream Outcome: ${offerData.scoring.factors.dreamOutcome}/10
- Perceived Likelihood: ${offerData.scoring.factors.perceivedLikelihood}/10
- Time Delay: ${offerData.scoring.factors.timeDelay}/10
- Effort/Sacrifice: ${offerData.scoring.factors.effortSacrifice}/10

Baseie sua analise EXCLUSIVAMENTE nos dados fornecidos.
Retorne JSON valido com a estrutura abaixo.

{
  "overallQuality": <0-100>,
  "insights": [
    {
      "counselorId": "<id>",
      "counselorName": "<nome>",
      "frameworkUsed": "<framework_id>",
      "score": <0-100>,
      "opinion": "<analise na voz do expert>",
      "redFlagsTriggered": ["<flag_ids>"],
      "goldStandardsHit": ["<standard_ids>"]
    }
  ],
  "summary": "<resumo executivo>"
}`;

    try {
      const response = await generateWithGemini(prompt, {
        model: DEFAULT_GEMINI_MODEL,
        temperature: 0.1,
        responseMimeType: 'application/json',
        feature: 'offer_quality_evaluation',
      });

      const parsed = JSON.parse(response) as OfferQualityResult;
      return {
        overallQuality: parsed.overallQuality ?? 50,
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        summary: parsed.summary ?? '',
      };
    } catch {
      return {
        overallQuality: 0,
        insights: [],
        summary: 'Avaliacao qualitativa indisponivel.',
      };
    }
  }
}
