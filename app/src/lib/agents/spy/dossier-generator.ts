import { CompetitorProfile, IntelligenceAsset } from '@/types/competitors';
import { generateWithGemini } from '@/lib/ai/gemini';
import { BUILD_DOSSIER_PROMPT } from '@/lib/ai/prompts/intelligence-dossier';
import { updateCompetitorProfile, createIntelligenceAsset } from '@/lib/firebase/intelligence';
import { upsertToPinecone } from '@/lib/ai/pinecone';
import { Timestamp } from 'firebase/firestore';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';

/**
 * @fileoverview Dossier Generator - Inteligência por trás do botão "Gerar Dossiê"
 */

export interface DossierResult {
  headline: string;
  offerType: string;
  visualStyle: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  executiveSummary: string;
}

function normalizeDossierResult(
  result: Partial<DossierResult>,
  fallbackText: string
): DossierResult {
  return {
    headline: result.headline ?? 'Dossie gerado',
    offerType: result.offerType ?? 'unknown',
    visualStyle: Array.isArray(result.visualStyle) ? result.visualStyle : [],
    swot: {
      strengths: Array.isArray(result.swot?.strengths) ? result.swot?.strengths : [],
      weaknesses: Array.isArray(result.swot?.weaknesses) ? result.swot?.weaknesses : [],
      opportunities: Array.isArray(result.swot?.opportunities) ? result.swot?.opportunities : [],
      threats: Array.isArray(result.swot?.threats) ? result.swot?.threats : [],
    },
    executiveSummary: result.executiveSummary ?? fallbackText,
  };
}

function parseDossierResponse(raw: string): DossierResult {
  const trimmed = (raw || '').trim();
  const tryParse = (value: string) => {
    try {
      return JSON.parse(value) as Partial<DossierResult>;
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) {
    return normalizeDossierResult(direct, trimmed);
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const extracted = tryParse(trimmed.slice(start, end + 1));
    if (extracted) {
      return normalizeDossierResult(extracted, trimmed);
    }
  }

  return normalizeDossierResult({}, trimmed || 'Resposta sem formato JSON.');
}

export class DossierGenerator {
  /**
   * Gera um dossiê completo usando Gemini e salva os resultados
   */
  static async generate(
    brandId: string,
    competitor: CompetitorProfile,
    assets: IntelligenceAsset[]
  ): Promise<DossierResult> {
    console.log(`[DossierGenerator] Iniciando geração para ${competitor.name}...`);

    if (!competitor.techStack) {
      throw new Error('Tech Stack é necessária para gerar o dossiê.');
    }

    // 1. Construir Prompt e Chamar Gemini
    const prompt = BUILD_DOSSIER_PROMPT(competitor.name, competitor.techStack, assets);
    
    const response = await generateWithGemini(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.3,
    });

    const analysis = parseDossierResponse(response);

    // 2. Persistência no Firestore (IntelligenceAsset do tipo 'funnel_map' ou similar para o dossiê)
    const dossierAsset: Omit<IntelligenceAsset, 'id'> = {
      brandId,
      competitorId: competitor.id,
      type: 'funnel_map',
      url: competitor.websiteUrl,
      pageType: 'other',
      capturedAt: Timestamp.now(),
      storagePath: '', // Dossiê é textual/JSON por enquanto
      version: 1,
      analysis: {
        headline: analysis.headline,
        offerType: analysis.offerType,
        visualStyle: analysis.visualStyle,
        techDetected: [
          competitor.techStack.cms,
          ...competitor.techStack.analytics,
          ...competitor.techStack.marketing,
          ...competitor.techStack.payments
        ].filter(Boolean) as string[],
      }
    };

    const assetId = await createIntelligenceAsset(brandId, competitor.id, dossierAsset);

    // 3. Indexação no Pinecone (Context Bridge)
    await this.indexToPinecone(brandId, competitor.id, assetId, analysis);

    return analysis;
  }

  /**
   * Indexa a análise no Pinecone para busca semântica futura
   */
  private static async indexToPinecone(
    brandId: string,
    competitorId: string,
    assetId: string,
    analysis: DossierResult
  ) {
    const content = `
      Dossiê do Concorrente: ${analysis.headline}
      Tipo de Oferta: ${analysis.offerType}
      Resumo Executivo: ${analysis.executiveSummary}
      SWOT - Forças: ${analysis.swot.strengths.join(', ')}
      SWOT - Fraquezas: ${analysis.swot.weaknesses.join(', ')}
    `;

    const [embedding] = await generateEmbeddingsBatch([content]);

    const record = {
      id: `dossier-${assetId}`,
      values: embedding,
      metadata: {
        brandId,
        competitorId,
        assetId,
        type: 'competitor_insight',
        subType: 'swot_analysis',
        content: content,
        collectedAt: Date.now(),
      }
    };

    await upsertToPinecone([record], { namespace: `brand-${brandId}` });
  }
}
