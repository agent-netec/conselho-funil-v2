import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '../../ai/gemini';
import { VaultContent } from '@/types/vault';
import { normalizePlatform, type SocialPlatform } from '@/types/social-platform';

/**
 * Serviço de Validação de Marca e Plataforma (ST-16.6)
 * Responsável por garantir que o conteúdo gerado respeite os guardrails.
 */
export class BrandValidationService {
  /**
   * Valida um conteúdo gerado contra os guardrails da marca e plataforma.
   */
  async validateContent(
    brandId: string,
    content: VaultContent,
    brandKit: any
  ): Promise<{
    valid: boolean;
    issues: { platform: SocialPlatform; type: 'length' | 'tone' | 'compliance'; message: string }[];
  }> {
    const issues: { platform: SocialPlatform; type: 'length' | 'tone' | 'compliance'; message: string }[] = [];

    for (const variant of content.variants) {
      // 1. Validação de Comprimento (Hard Guardrail)
      if (normalizePlatform(variant.platform) === 'x' && variant.copy.length > 280) {
        issues.push({
          platform: variant.platform,
          type: 'length',
          message: `O post excede 280 caracteres (atual: ${variant.copy.length}).`
        });
      }

      // 2. Validação de Tom de Voz via IA (Soft Guardrail)
      const toneCheckPrompt = `
        Aja como um especialista em Branding e QA de conteúdo.
        Avalie se o texto abaixo respeita o Tom de Voz da marca.

        TOM DE VOZ DA MARCA:
        ${JSON.stringify(brandKit)}

        PLATAFORMA: ${variant.platform}
        CONTEÚDO:
        "${variant.copy}"

        Responda APENAS com um JSON no formato:
        { "isConsistent": boolean, "feedback": "por que é ou não consistente" }
      `;

      try {
        const response = await generateWithGemini(toneCheckPrompt, {
          model: DEFAULT_GEMINI_MODEL,
          temperature: 0.1,
          responseMimeType: 'application/json'
        });
        const result = JSON.parse(response);

        if (!result.isConsistent) {
          issues.push({
            platform: variant.platform,
            type: 'tone',
            message: `Inconsistência de tom: ${result.feedback}`
          });
        }
      } catch (error) {
        console.error(`[Validation] Erro ao validar tom para ${variant.platform}:`, error);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
