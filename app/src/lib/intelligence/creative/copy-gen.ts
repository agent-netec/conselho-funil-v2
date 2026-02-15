import { Brand } from '@/types/database';
import { generateWithGemini } from '../../ai/gemini';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

/**
 * @fileoverview CopyGenerationLab - Motor de geração de variantes de copy baseado em ganchos psicológicos.
 * @module lib/intelligence/creative/copy-gen
 * @version 2.0.0
 * @story ST-26.2, Sprint H (brain integration)
 */

export type CopyAngle = 'fear' | 'greed' | 'authority' | 'curiosity';

export interface CopyGenerationInput {
  baseCopy: string;
  angle: CopyAngle;
  brand: Brand;
  targetAudience?: string;
}

export interface CopyVariant {
  headline: string;
  primaryText: string;
  angle: CopyAngle;
  rationale: string;
}

// ═══════════════════════════════════════════════════════
// ANGLE → COUNSELORS MAPPING (Sprint H)
// Max 2 counselors per angle (~800 tokens budget)
// ═══════════════════════════════════════════════════════

interface AngleCounselorMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

const ANGLE_COUNSELOR_MAP: Record<CopyAngle, AngleCounselorMapping[]> = {
  fear: [
    { counselorId: 'gary_halbert', frameworkId: 'full_copy_score' },
    { counselorId: 'john_carlton', frameworkId: 'hook_and_fascinations' },
  ],
  greed: [
    { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
    { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
  ],
  authority: [
    { counselorId: 'claude_hopkins', frameworkId: 'scientific_rigor' },
    { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
  ],
  curiosity: [
    { counselorId: 'eugene_schwartz', frameworkId: 'awareness_alignment' },
    { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
  ],
};

/**
 * Builds brain context for a specific psychological angle.
 * Loads 2 counselors, extracts framework + top 2 red_flags.
 * ~400 tokens per counselor = ~800 tokens total.
 */
function buildAngleBrainContext(angle: CopyAngle): string {
  const mappings = ANGLE_COUNSELOR_MAP[angle];
  if (!mappings) return '';

  const parts: string[] = [];

  for (const { counselorId, frameworkId } of mappings) {
    const brain = loadBrain(counselorId);
    if (!brain) continue;

    const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
    if (!frameworkJson) continue;

    const redFlags = brain.redFlags.slice(0, 2).map(rf =>
      `- **${rf.label}**: "${rf.before}" → "${rf.after}"`
    ).join('\n');

    parts.push(
      `### ${brain.name} — ${brain.subtitle}\n` +
      `**Filosofia:** ${brain.philosophy.slice(0, 200)}...\n` +
      `**Framework (${frameworkId}):**\n${frameworkJson}\n` +
      (redFlags ? `**Erros a Evitar:**\n${redFlags}` : '')
    );
  }

  if (parts.length === 0) return '';

  return `\n## ESPECIALISTAS DO CONSELHO PARA O GANCHO "${angle.toUpperCase()}"\n\n` +
    `Aplique os frameworks e princípios dos experts abaixo ao gerar as variantes:\n\n` +
    parts.join('\n\n---\n\n');
}

export class CopyGenerationLab {
  /**
   * Gera variantes de copy baseadas em um gancho específico e no BrandKit.
   */
  async generateVariants(input: CopyGenerationInput): Promise<CopyVariant[]> {
    const { baseCopy, angle, brand, targetAudience } = input;

    console.log(`[CopyGenerationLab] Gerando variantes para o gancho: ${angle}`);

    const prompt = this.buildPrompt(baseCopy, angle, brand, targetAudience);

    try {
      const response = await generateWithGemini(prompt, {
        temperature: brand.aiConfiguration?.temperature || 0.7,
        responseMimeType: 'application/json',
      });

      const parsed = this.parseAIResponse(response);

      // Garante que o ângulo retornado seja o solicitado
      return parsed.map((variant: any) => ({
        ...variant,
        angle
      }));
    } catch (error) {
      console.error(`[CopyGenerationLab] Erro ao gerar copy com Gemini:`, error);
      throw error;
    }
  }

  /**
   * Constrói o prompt estruturado para o Gemini Flash.
   * Sprint H: Agora inclui brain context dos counselors especializados por ângulo.
   */
  private buildPrompt(
    baseCopy: string,
    angle: CopyAngle,
    brand: Brand,
    targetAudience?: string
  ): string {
    const brandKit = brand.brandKit;
    const voiceGuidelines = brand.voiceTone || 'Profissional e persuasivo';
    const forbiddenTerms: string[] = [];
    const visualStyle = brandKit?.visualStyle || 'modern';

    const angleDefinitions = {
      fear: 'Foco na perda, no risco de ficar para trás (FOMO) ou nas consequências negativas de não agir.',
      greed: 'Foco no ganho, na transformação, no lucro, no status e nos benefícios exponenciais.',
      authority: 'Foco em dados, provas, expertise, posicionamento de líder de mercado e segurança.',
      curiosity: 'Foco no mistério, no "segredo", em abrir um loop mental que só é fechado com o clique.'
    };

    // Sprint H: Build brain context for this angle
    let brainSection = '';
    try {
      brainSection = buildAngleBrainContext(angle);
    } catch (e) {
      console.warn(`[CopyGenerationLab] Brain context failed for angle ${angle}:`, e);
    }

    return `
      Você é um Copywriter Sênior especialista em Resposta Direta e Psicologia de Vendas.
      Sua tarefa é criar 3 variações de um anúncio (Headline + Primary Text) baseadas em um gancho específico.
${brainSection}
      MARCA: "${brand.name}"
      POSICIONAMENTO: ${brand.positioning}
      TOM DE VOZ: ${voiceGuidelines}
      ESTILO VISUAL: ${visualStyle}
      PÚBLICO-ALVO: ${targetAudience || brand.audience?.who || 'Público geral'}

      ${forbiddenTerms.length > 0 ? `TERMOS PROIBIDOS (NÃO USE): ${forbiddenTerms.join(', ')}` : ''}

      GANCHO PSICOLÓGICO SOLICITADO: ${angle.toUpperCase()}
      DEFINIÇÃO DO GANCHO: ${angleDefinitions[angle]}
${brainSection ? `\n      Use os frameworks dos especialistas acima para fundamentar cada variante. Reflita a expertise deles na copy.\n` : ''}
      COPY BASE (REFERÊNCIA):
      "${baseCopy}"

      REQUISITOS TÉCNICOS:
      1. Headline: Curta, impactante, focada no gancho ${angle}.
      2. Primary Text: Persuasivo, respeitando o tom de voz da marca, focado na dor/desejo do gancho.
      3. Respeite rigorosamente a identidade da marca.
      4. Saída formatada para Facebook/Instagram Ads.

      RETORNE APENAS UM JSON NO FORMATO:
      [
        {
          "headline": "...",
          "primaryText": "...",
          "rationale": "Breve explicação da estratégia usada nesta variante"
        },
        ... (total 3 variantes)
      ]
    `;
  }

  /**
   * Parse seguro da resposta do Gemini.
   */
  private parseAIResponse(response: string): any[] {
    try {
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("[CopyGenerationLab] Erro no parse do JSON:", e);
      throw new Error("Falha ao processar resposta da IA.");
    }
  }
}
