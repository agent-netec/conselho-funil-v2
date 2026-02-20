import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import type { CounselorId } from '@/types';
import type { OfferQualityInsight } from '@/types/offer';

// ═══════════════════════════════════════════════════════
// OFFER EVALUATOR — AI evaluation with Brain Council
// Server-only (uses fs-based brain loader + Gemini)
// ═══════════════════════════════════════════════════════

export interface OfferQualityResult {
  overallQuality: number;
  insights: OfferQualityInsight[];
  summary: string;
}

const OFFER_EXPERTS: { counselorId: CounselorId; frameworkId: string }[] = [
  { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
  { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
];

function buildOfferBrainContext(): string {
  const parts: string[] = [];

  for (const { counselorId, frameworkId } of OFFER_EXPERTS) {
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

  return parts.join('\n\n---\n\n');
}

/**
 * AI-powered qualitative evaluation using Kennedy + Brunson frameworks.
 * Server-only — chamada apenas no endpoint /api/intelligence/offer/calculate-score.
 * Uses PRO_GEMINI_MODEL (gemini-3-pro-preview) for critical evaluation.
 */
export async function evaluateOfferQuality(
  offerData: { components: any; scoring: any }
): Promise<OfferQualityResult> {
  const brainContext = buildOfferBrainContext();

  const prompt = `Voce e um consultor senior de ofertas irresistiveis.
Use os frameworks dos especialistas abaixo para avaliar a oferta.

## FRAMEWORKS DOS ESPECIALISTAS
${brainContext}

## DADOS DA OFERTA
- Produto principal: ${offerData.components.coreProduct.name}
- Promessa: ${offerData.components.coreProduct.promise}
- Preco: R$ ${offerData.components.coreProduct.price}
- Valor percebido: R$ ${offerData.components.coreProduct.perceivedValue}
- Value Stack: ${offerData.components.stacking?.map((s: any) => `${s.name} (R$${s.value})`).join(', ') || 'Nenhum'}
- Bonus: ${offerData.components.bonuses?.map((b: any) => `${b.name} — resolve: ${b.description || 'nao especificado'}`).join('; ') || 'Nenhum'}
- Inversao de risco: ${offerData.components.riskReversal || 'Nao definida'}
- Escassez: ${offerData.components.scarcity || 'Nao definida'}
- Urgencia: ${offerData.components.urgency || 'Nao definida'}
- Dream Outcome: ${offerData.scoring.factors.dreamOutcome}/10
- Perceived Likelihood: ${offerData.scoring.factors.perceivedLikelihood}/10
- Time Delay: ${offerData.scoring.factors.timeDelay}/10
- Effort/Sacrifice: ${offerData.scoring.factors.effortSacrifice}/10

Baseie sua analise EXCLUSIVAMENTE nos dados fornecidos.
Para cada expert, escreva o parecer NA VOZ e NO ESTILO do expert (como se fosse ele falando).
Retorne JSON valido com a estrutura abaixo.

{
  "overallQuality": <0-100>,
  "insights": [
    {
      "counselorId": "<id>",
      "counselorName": "<nome>",
      "frameworkUsed": "<framework_id>",
      "score": <0-100>,
      "opinion": "<analise na voz do expert, 2-4 frases>",
      "redFlagsTriggered": ["<flag_ids>"],
      "goldStandardsHit": ["<standard_ids>"]
    }
  ],
  "summary": "<resumo executivo em 2 frases>"
}`;

  try {
    const response = await generateWithGemini(prompt, {
      model: PRO_GEMINI_MODEL,
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
