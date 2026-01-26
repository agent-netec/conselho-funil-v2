import { 
  SocialInteraction, 
  BrandVoiceSuggestion 
} from '@/types/social-inbox';
import { Brand } from '@/types/database';
import { generateWithGemini } from '../../ai/gemini';
import { SOCIAL_RESPONSE_PROMPT } from '../../ai/prompts/social-generation';

/**
 * @fileoverview BrandVoiceTranslator - Motor de tradução de voz da marca usando Gemini.
 * @module lib/agents/engagement/brand-voice-translator
 * @version 1.1.0
 */

export class BrandVoiceTranslator {
  /**
   * Gera sugestões de resposta baseadas no contexto da interação e BrandKit.
   * @param interaction Interação social
   * @param brand Objeto da marca contendo BrandKit e configurações
   */
  async generateSuggestions(
    interaction: SocialInteraction, 
    brand: Brand
  ): Promise<BrandVoiceSuggestion> {
    console.log(`[BrandVoiceTranslator] Gerando sugestões para interação ${interaction.id} da marca ${brand.name}`);

    const prompt = this.buildPrompt(interaction, brand);
    
    try {
      const response = await generateWithGemini(prompt, {
        temperature: brand.aiConfiguration?.temperature || 0.7,
        topP: brand.aiConfiguration?.topP || 0.9,
        responseMimeType: 'application/json',
      });

      // O prompt SOCIAL_RESPONSE_PROMPT deve ser configurado para retornar JSON estruturado
      // Para este MVP, vamos simular o parse do retorno estruturado
      const parsedResponse = this.parseAIResponse(response);

      return {
        id: Math.random().toString(36).substring(7),
        interactionId: interaction.id,
        options: parsedResponse.options,
        contextUsed: {
          brandKitVersion: brand.brandKit?.updatedAt?.toString() || '1.0.0',
          historyDepth: 0,
        }
      };
    } catch (error) {
      console.error(`[BrandVoiceTranslator] Erro ao gerar sugestões com Gemini:`, error);
      throw error;
    }
  }

  /**
   * Constrói o prompt contextualizado para o Gemini.
   */
  private buildPrompt(interaction: SocialInteraction, brand: Brand): string {
    const voiceGuidelines = brand.voiceTone || 'Profissional e prestativo';
    const audienceInfo = brand.audience?.who || 'Público geral';
    
    return `
      Você é o Brand Voice Translator da marca "${brand.name}".
      Sua tarefa é gerar 3 opções de resposta para uma interação social.
      
      DIRETRIZES DE VOZ DA MARCA:
      ${voiceGuidelines}
      
      PÚBLICO-ALVO:
      ${audienceInfo}
      
      INTERAÇÃO RECEBIDA (${interaction.platform}):
      "${interaction.content.text}"
      
      REQUISITOS:
      1. Gere 3 variantes: Safe (Segura/Padrão), Creative (Engajadora/Viral), Direct (Direta/Objetiva).
      2. Mantenha o tom de voz da marca em todas.
      3. Se o sentimento for negativo, seja empático e tente desarmar a situação.
      4. Retorne APENAS um objeto JSON no formato:
      {
        "options": [
          { "text": "...", "tone": "Safe", "goal": "..." },
          { "text": "...", "tone": "Creative", "goal": "..." },
          { "text": "...", "tone": "Direct", "goal": "..." }
        ]
      }
    `;
  }

  /**
   * Faz o parse da resposta da IA para o formato do contrato.
   */
  private parseAIResponse(response: string): any {
    try {
      // Limpa possíveis marcações de markdown do JSON
      const jsonStr = response.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Erro ao fazer parse da resposta da IA:", e);
      return {
        options: [
          { text: response, tone: "Safe", goal: "Response", confidence: 0.5 }
        ]
      };
    }
  }

  /**
   * Valida se a resposta segue os guardrails de segurança.
   */
  validateSafety(text: string, interaction: SocialInteraction): boolean {
    if (interaction.metadata.sentimentLabel === 'negative') {
      // Exige revisão humana para sentimentos negativos
      console.warn(`[BrandVoiceTranslator] Safety Gate: Bloqueando envio automático para sentimento negativo na interação ${interaction.id}`);
      return false;
    }
    return true;
  }

  /**
   * Verifica se o texto contém termos proibidos pela marca.
   */
  checkForbiddenTerms(text: string, forbiddenTerms: string[]): string[] {
    const found = forbiddenTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
    return found;
  }
}
