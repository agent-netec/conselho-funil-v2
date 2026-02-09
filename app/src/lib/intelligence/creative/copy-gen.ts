import { Brand } from '@/types/database';
import { generateWithGemini } from '../../ai/gemini';

/**
 * @fileoverview CopyGenerationLab - Motor de geração de variantes de copy baseado em ganchos psicológicos.
 * @module lib/intelligence/creative/copy-gen
 * @version 1.0.0
 * @story ST-26.2
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

    return `
      Você é um Copywriter Sênior especialista em Resposta Direta e Psicologia de Vendas.
      Sua tarefa é criar 3 variações de um anúncio (Headline + Primary Text) baseadas em um gancho específico.

      MARCA: "${brand.name}"
      POSICIONAMENTO: ${brand.positioning}
      TOM DE VOZ: ${voiceGuidelines}
      ESTILO VISUAL: ${visualStyle}
      PÚBLICO-ALVO: ${targetAudience || brand.audience?.who || 'Público geral'}
      
      ${forbiddenTerms.length > 0 ? `TERMOS PROIBIDOS (NÃO USE): ${forbiddenTerms.join(', ')}` : ''}

      GANCHO PSICOLÓGICO SOLICITADO: ${angle.toUpperCase()}
      DEFINIÇÃO DO GANCHO: ${angleDefinitions[angle]}

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
