/**
 * Sprint D: Server-only variant evaluator using brain frameworks.
 * Separated from engine.ts because loader.ts uses `fs` (Node.js only)
 * and engine.ts is imported into client components via auto-optimizer → ab-test-results.
 *
 * Experts: Halbert (headline_score) + Ogilvy (big_idea_test) + Bird (simplicity_efficiency)
 */
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// A/B TESTING → EXPERTS MAPPING (Brain Integration — Sprint D)
// ═══════════════════════════════════════════════════════

interface VariantExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

const VARIANT_EXPERT_MAP: VariantExpertMapping[] = [
  { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
  { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
  { counselorId: 'drayton_bird', frameworkId: 'simplicity_efficiency' },
];

function buildVariantBrainContext(): string {
  const parts: string[] = [];

  for (const { counselorId, frameworkId } of VARIANT_EXPERT_MAP) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
    if (!frameworkJson) continue;

    const redFlags = brain.redFlags.slice(0, 3).map(rf =>
      `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
    ).join('\n');

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
      (redFlags ? `**Erros Comuns:**\n${redFlags}` : '')
    );
  }

  return parts.join('\n\n---\n\n');
}

export interface VariantEvaluation {
  variantId: string;
  variantName: string;
  qualityScore: number;
  counselorInsights: Array<{
    counselorId: string;
    counselorName: string;
    frameworkUsed: string;
    opinion: string;
  }>;
  recommendation: string;
}

export interface VariantEvaluationResult {
  evaluations: VariantEvaluation[];
  winner: string;
  reasoning: string;
}

/**
 * AI-powered qualitative evaluation of variant content.
 * Uses Halbert (headlines), Ogilvy (big idea), Bird (simplicity) frameworks.
 * Must be called from server-side only (API routes).
 */
export async function evaluateVariants(
  variants: Array<{ id: string; name: string; headline?: string; copy?: string }>
): Promise<VariantEvaluationResult> {
  const brainContext = buildVariantBrainContext();

  const variantsDescription = variants.map((v, i) =>
    `Variante ${i + 1} (${v.id}): "${v.name}"\n  Headline: ${v.headline || 'N/A'}\n  Copy: ${v.copy || 'N/A'}`
  ).join('\n\n');

  const prompt = `Voce e um painel de 3 especialistas em copy avaliando variantes de A/B test.
Use os frameworks abaixo para uma analise qualitativa do CONTEUDO de cada variante.

## FRAMEWORKS DOS ESPECIALISTAS
${brainContext}

## VARIANTES PARA AVALIACAO
${variantsDescription}

Baseie sua analise EXCLUSIVAMENTE nos dados fornecidos.
Se nao ha dados suficientes para uma dimensao, diga explicitamente.
Retorne JSON valido com a estrutura abaixo.

{
  "evaluations": [
    {
      "variantId": "<id>",
      "variantName": "<name>",
      "qualityScore": <0-100>,
      "counselorInsights": [
        {
          "counselorId": "<id>",
          "counselorName": "<nome>",
          "frameworkUsed": "<framework_id>",
          "opinion": "<analise na voz do expert>"
        }
      ],
      "recommendation": "<sugestao de melhoria>"
    }
  ],
  "winner": "<id da variante recomendada>",
  "reasoning": "<justificativa>"
}`;

  try {
    const response = await generateWithGemini(prompt, {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.1,
      responseMimeType: 'application/json',
      feature: 'ab_variant_evaluation',
    });

    const parsed = JSON.parse(response) as VariantEvaluationResult;
    return {
      evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
      winner: parsed.winner ?? '',
      reasoning: parsed.reasoning ?? '',
    };
  } catch {
    return {
      evaluations: [],
      winner: '',
      reasoning: 'Avaliacao qualitativa indisponivel.',
    };
  }
}
