import { CreativePerformance } from '../../../types/creative';
import { generateWithGemini } from '@/lib/ai/gemini';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// CREATIVE QUALITY → EXPERTS MAPPING (Brain Integration — Sprint C)
// ═══════════════════════════════════════════════════════

interface CreativeExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** 2 experts for headline quality + 2 for copy body quality */
const CREATIVE_EXPERT_MAP: Record<string, CreativeExpertMapping[]> = {
  headline: [
    { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
    { counselorId: 'david_ogilvy', frameworkId: 'headline_excellence' },
  ],
  copy_body: [
    { counselorId: 'john_carlton', frameworkId: 'hook_and_fascinations' },
    { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
  ],
};

/** Weight for combining ROI score (60%) + Quality score (40%) */
const ROI_WEIGHT = 0.6;
const QUALITY_WEIGHT = 0.4;

/**
 * Sprint C: Builds brain context for creative quality evaluation.
 * Loads frameworks + red_flags from headline and copy body experts.
 */
function buildCreativeQualityContext(): string {
  const parts: string[] = [];

  for (const [area, experts] of Object.entries(CREATIVE_EXPERT_MAP)) {
    const expertParts: string[] = [];

    for (const { counselorId, frameworkId } of experts) {
      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      const redFlags = brain.redFlags.slice(0, 3).map(rf =>
        `- ${rf.id}: "${rf.label}" (penalty: ${rf.penalty})`
      ).join('\n');

      const goldStandards = brain.goldStandards.slice(0, 2).map(gs =>
        `- ${gs.id}: "${gs.label}" (bonus: +${gs.bonus})`
      ).join('\n');

      expertParts.push(
        `#### ${brain.name} — ${frameworkId}\n` +
        `${frameworkJson}\n` +
        (redFlags ? `Red Flags:\n${redFlags}\n` : '') +
        (goldStandards ? `Gold Standards:\n${goldStandards}` : '')
      );
    }

    if (expertParts.length > 0) {
      parts.push(`### ${area}\n${expertParts.join('\n\n')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * ST-26.1: Creative Profit Scoring Engine
 * Sprint C: + Qualitative brain-based copy scoring
 *
 * Score final = ROI Score (60%) + Quality Score (40%)
 */
export class CreativeScoringEngine {
  /**
   * Calcula o Profit Score de um criativo (0-100)
   * Formula: ((LTV Atribuido - Spend) / Spend) * Fator de Eficiencia
   */
  static calculateScore(performance: CreativePerformance['metrics']): number {
    const { ltvAttributed, spend } = performance;

    if (spend <= 0) return 0;

    const netProfit = ltvAttributed - spend;
    const roi = netProfit / spend;

    // Normalizacao para escala 0-100 (Exemplo: ROI de 5x = Score 100)
    const score = Math.min(Math.max((roi / 5) * 100, 0), 100);

    return Math.round(score);
  }

  /**
   * Ordena criativos pelo lucro liquido real
   */
  static rankByProfit(creatives: CreativePerformance[]): CreativePerformance[] {
    return [...creatives].sort((a, b) => {
      const profitA = a.metrics.ltvAttributed - a.metrics.spend;
      const profitB = b.metrics.ltvAttributed - b.metrics.spend;
      return profitB - profitA;
    });
  }

  /**
   * Sprint C: Avalia a qualidade da copy de um criativo usando brain frameworks.
   * Retorna score de 0-100 baseado nos criterios reais dos experts.
   */
  static async calculateQualityScore(
    copyText: string,
    options?: { headline?: string; brandVoice?: string; targetAudience?: string }
  ): Promise<{ qualityScore: number; feedback: string; redFlagsTriggered: string[] }> {
    const frameworkContext = buildCreativeQualityContext();

    if (!frameworkContext) {
      return { qualityScore: 50, feedback: 'Brain frameworks not available.', redFlagsTriggered: [] };
    }

    const prompt = `Voce e um painel de especialistas avaliando a qualidade de copy de um ativo criativo (ad copy).
Baseie sua analise EXCLUSIVAMENTE nos frameworks fornecidos abaixo.

## Copy do Criativo
${options?.headline ? `Headline: "${options.headline}"\n` : ''}Texto: "${copyText}"
${options?.brandVoice ? `Brand Voice: ${options.brandVoice}` : ''}
${options?.targetAudience ? `Target Audience: ${options.targetAudience}` : ''}

## Frameworks de Avaliacao
${frameworkContext}

## Formato de Resposta (JSON)
{
  "qualityScore": 75,
  "feedback": "Avaliacao resumida da qualidade da copy com base nos frameworks (2-3 frases em portugues)",
  "redFlagsTriggered": ["flag_id_1"]
}

REGRAS:
- qualityScore: 0-100, baseado nos criterios e pesos dos frameworks.
- feedback: Conciso, 2-3 frases, referenciando os criterios do framework.
- redFlagsTriggered: IDs dos red flags aplicaveis. Array vazio se nenhum.`;

    try {
      const raw = await generateWithGemini(prompt, {
        temperature: 0.1,
        responseMimeType: 'application/json',
        feature: 'creative_quality_scoring',
      });

      const parsed = JSON.parse(raw.trim());
      return {
        qualityScore: Math.min(Math.max(parsed.qualityScore || 50, 0), 100),
        feedback: parsed.feedback || '',
        redFlagsTriggered: parsed.redFlagsTriggered || [],
      };
    } catch (error) {
      console.error('[CreativeScoring] Quality scoring failed:', error);
      return { qualityScore: 50, feedback: 'Quality scoring unavailable.', redFlagsTriggered: [] };
    }
  }

  /**
   * Sprint C: Combina ROI Score + Quality Score para score final.
   * ROI Weight: 60% | Quality Weight: 40%
   */
  static calculateFinalScore(roiScore: number, qualityScore: number): number {
    return Math.round(roiScore * ROI_WEIGHT + qualityScore * QUALITY_WEIGHT);
  }
}
