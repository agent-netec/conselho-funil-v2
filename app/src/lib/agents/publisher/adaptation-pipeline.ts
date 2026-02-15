import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '../../ai/gemini';
import { PUBLISHER_ADAPTATION_PROMPT } from '../../ai/prompts/publisher-adaptation';
import { saveVaultContent, updatePublisherJob } from '../../firebase/vault';
import { getBrand } from '../../firebase/firestore';
import type { IntelligenceDocument } from '@/types/intelligence';
import type { CopyDNA, VaultContent } from '@/types/vault';
import { normalizePlatform, type SocialPlatform } from '@/types/social-platform';
import type { PublisherJob } from '@/types/publisher';

export interface AdaptationResult {
  variants: {
    platform: SocialPlatform;
    copy: string;
    metadata: Record<string, any>;
  }[];
}

/**
 * Pipeline de Adaptação Multi-Plataforma (ST-16.3)
 */
export class AdaptationPipeline {
  /**
   * Executa o processo de adaptação de um insight usando Gemini 2.0 Flash.
   */
  async adaptInsight(
    brandId: string,
    insight: IntelligenceDocument,
    copyDNA: CopyDNA[],
    jobId: string
  ): Promise<string | null> {
    console.log(`[AdaptationPipeline] Iniciando adaptação para o Job: ${jobId}`);

    try {
      // 1. Atualizar status do job para 'adapting'
      await updatePublisherJob(brandId, jobId, { status: 'adapting' });

      // 2. Preparar contexto para a IA
      const brand = await getBrand(brandId);
      const brandContext = brand ? JSON.stringify(brand.brandKit || {}) : 'Tom de voz profissional';
      
      const dnaContext = copyDNA.map(d => `[${d.type}] ${d.name}: ${d.content}`).join('\n---\n');
      const insightContext = `Título: ${insight.content.title}\nConteúdo: ${insight.content.text}\nAnálise: ${insight.analysis?.summary || ''}`;

      // 3. Chamar Gemini (modelo via GEMINI_MODEL ou gemini-2.0-flash)
      const prompt = PUBLISHER_ADAPTATION_PROMPT
        .replace('{{insight}}', insightContext)
        .replace('{{copyDNA}}', dnaContext)
        .replace('{{brandContext}}', brandContext);

      const responseText = await generateWithGemini(prompt, {
        model: DEFAULT_GEMINI_MODEL,
        temperature: 0.7,
        responseMimeType: 'application/json'
      });

      const result: AdaptationResult = JSON.parse(responseText);

      // 4. Validar Guardrails (X 280 chars) — normalizePlatform() para compat PascalCase
      const validatedVariants = result.variants.map(v => {
        if (normalizePlatform(v.platform) === 'x' && v.copy.length > 280) {
          console.warn(`[AdaptationPipeline] Post do X excedeu 280 caracteres (${v.copy.length}). Truncando...`);
          v.copy = v.copy.substring(0, 277) + '...';
        }
        return v;
      });

      // 5. Salvar no Vault Library com status 'review'
      const contentId = await saveVaultContent(brandId, {
        id: '', // Auto-gerado pelo vault
        sourceInsightId: insight.id,
        status: 'review',
        variants: validatedVariants.map(v => ({
          platform: v.platform,
          copy: v.copy,
          mediaRefs: [],
          metadata: v.metadata
        })),
        approvalChain: {},
      });

      // 6. Finalizar Job
      await updatePublisherJob(brandId, jobId, {
        status: 'completed',
        outputContentId: contentId
      });

      console.log(`[AdaptationPipeline] Adaptação concluída. Conteúdo salvo: ${contentId}`);
      return contentId;

    } catch (error: any) {
      console.error(`[AdaptationPipeline] Erro na adaptação do Job ${jobId}:`, error);
      
      await updatePublisherJob(brandId, jobId, {
        status: 'failed',
        errors: [error.message || 'Erro desconhecido na adaptação']
      });
      
      return null;
    }
  }
}
