import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { analyzeMultimodalWithGemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { extractContentFromUrl, ScrapedContent } from '@/lib/ai/url-scraper';
import { createAsset, updateAssetStatus } from '@/lib/firebase/assets';
import { processAssetText } from '@/lib/firebase/assets-server';
import type { BrandAsset } from '@/types/database';

type IngestResponse = {
  success: boolean;
  data?: { title?: string; content: string; method?: string };
  assetId?: string;
  error?: string;
};

const MIN_TEXT_LENGTH = 120;
const VISION_MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB para evitar downloads gigantes

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildAssetPayload(params: {
  brandId: string;
  userId: string;
  url: string;
  scraped: { title?: string; content: string; method?: string };
}): Omit<BrandAsset, 'id'> {
  const { brandId, userId, url, scraped } = params;
  const now = Timestamp.now();

  return {
    brandId,
    userId,
    name: scraped.title || 'URL sem título',
    originalName: url,
    type: 'url',
    mimeType: 'text/html',
    size: 0,
    url,
    sourceUrl: url,
    extractedText: scraped.content,
    status: 'processing',
    isApprovedForAI: false,
    createdAt: now,
    metadata: {
      sourceType: 'url',
      sourceUrl: url,
      originalName: scraped.title || url,
      isApprovedForAI: false,
      extractedAt: new Date().toISOString(),
      processingMethod: (scraped.method as 'jina' | 'gemini-vision' | 'readability' | 'cheerio') || 'readability',
    },
  };
}

async function tryVisionFallback(imageUrl: string | undefined, pageUrl: string) {
  if (!imageUrl) return null;
  if (!isGeminiConfigured()) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem para OCR (${response.status})`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength > VISION_MAX_IMAGE_BYTES) {
    throw new Error('Imagem principal muito grande para OCR (limite 8MB)');
  }

  const base64 = buffer.toString('base64');
  const prompt = `
Você é um especialista em CRO e Marketing Direto.
Extraia TODO o texto visível da screenshot/imagem desta página (${pageUrl}).
- Preserve a ordem lógica (topo → rodapé).
- Capture headlines, CTAs, preços, bullet points e disclaimers.
- Retorne somente a transcrição em português/inglês conforme a origem, sem comentários.`;

  const text = await analyzeMultimodalWithGemini(prompt, base64, mimeType, {
    temperature: 0.2,
  });

  const cleaned = text.trim();
  if (!cleaned) return null;

  return { content: cleaned, method: 'gemini-vision' as const };
}

export async function POST(request: NextRequest): Promise<NextResponse<IngestResponse>> {
  try {
    const body = await request.json();
    const { url, brandId, userId } = body ?? {};

    if (!url || typeof url !== 'string' || !isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'URL inválida. Use apenas http:// ou https://' },
        { status: 400 }
      );
    }

    if (!brandId || typeof brandId !== 'string' || !brandId.trim()) {
      return NextResponse.json(
        { success: false, error: 'brandId é obrigatório' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`[Ingest URL] Extraindo conteúdo para ${url}`);
    const scraped: ScrapedContent = await extractContentFromUrl(url);

    // Tentativa de fallback com visão se o conteúdo for muito curto (página visual)
    let finalContent = scraped.content?.trim() || '';
    let method = scraped.method;

    if ((!finalContent || finalContent.length < MIN_TEXT_LENGTH) && scraped.primaryImageUrl) {
      try {
        const vision = await tryVisionFallback(scraped.primaryImageUrl, url);
        if (vision?.content) {
          finalContent = vision.content;
          method = vision.method;
        }
      } catch (visionErr) {
        console.warn('[Ingest URL] Fallback de visão falhou:', visionErr);
      }
    }

    if (!finalContent || finalContent.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Não foi possível extrair conteúdo textual desta página. Ela pode ser puramente visual ou bloquear scraping.',
        },
        { status: 400 }
      );
    }

    const payload = buildAssetPayload({
      brandId: brandId.trim(),
      userId: userId.trim(),
      url,
      scraped: { title: scraped.title, content: finalContent, method },
    });

    const assetId = await createAsset(payload);

    // Processamento assíncrono (chunking + embeddings)
    processAssetText(assetId, finalContent).catch(async (err) => {
      console.error(`[Ingest URL] Erro no processamento do asset ${assetId}:`, err);
      await updateAssetStatus(
        assetId,
        'error',
        err instanceof Error ? err.message : 'Erro desconhecido no processamento'
      );
    });

    return NextResponse.json({
      success: true,
      data: { title: payload.name, content: finalContent, method: payload.metadata?.processingMethod },
      assetId,
    });
  } catch (error: any) {
    console.error('[Ingest URL] Erro crítico na API:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar a URL' },
      { status: 500 }
    );
  }
}
