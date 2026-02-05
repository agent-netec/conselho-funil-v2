export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { AutopsyEngine } from '@/lib/intelligence/autopsy/engine';
import { extractContentFromUrl } from '@/lib/ai/url-scraper';
import { AutopsyRunRequest, AutopsyRunResponse } from '@/types/autopsy';
import { v4 as uuidv4 } from 'uuid';
import { parseJsonBody } from '@/app/api/_utils/parse-json';

/**
 * Handler para execução do diagnóstico forense de funil.
 * POST /api/intelligence/autopsy/run
 * 
 * Este endpoint utiliza o Browser MCP (via Monara) para scraping
 * e o Gemini 1.5 Pro para análise heurística.
 */
export async function GET() {
  return NextResponse.json({ message: 'Autopsy API is alive' });
}

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody<AutopsyRunRequest>(req);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const { brandId, url, depth = 'quick', context } = body;

    if (!brandId || !url) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (brandId, url).' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // 1. Scraping via Monara (Browser MCP) - Fallback para url-scraper local
    // Nota: Em produção, aqui invocaríamos o MCP via Monara. 
    // Por enquanto, usamos o extractContentFromUrl que já integra Jina/Readability.
    console.log(`[AUTOPSY] Iniciando scraping para: ${url}`);
    const scraped = await extractContentFromUrl(url, { brandId });

    if (scraped.error) {
      return NextResponse.json(
        { error: `Falha no scraping: ${scraped.error}` },
        { status: 422 }
      );
    }
    if (!scraped.content?.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo insuficiente para análise.' },
        { status: 422 }
      );
    }

    const loadTimeMs = Date.now() - startTime;

    // 2. Detecção básica de Tech Stack (Heurística simples via HTML)
    const techStack: string[] = [];
    if (scraped.rawHtml) {
      if (scraped.rawHtml.includes('elementor')) techStack.push('Elementor');
      if (scraped.rawHtml.includes('clickfunnels')) techStack.push('ClickFunnels');
      if (scraped.rawHtml.includes('wp-content')) techStack.push('WordPress');
      if (scraped.rawHtml.includes('hotmart')) techStack.push('Hotmart');
    }

    // 3. Executar o motor de diagnóstico (Gemini 2.0 Flash)
    console.log(`[AUTOPSY] Executando análise heurística via Gemini 2.0 Flash`);
    const report = await AutopsyEngine.analyzeContent(
      url,
      scraped.content,
      body,
      {
        loadTimeMs,
        techStack,
        screenshotUrl: scraped.primaryImageUrl // Fallback para imagem principal se não houver screenshot real
      }
    );

    const response: AutopsyRunResponse = {
      id: `aut_${uuidv4()}`,
      status: 'completed',
      url,
      timestamp: Date.now(),
      report
    };

    // TODO: Persistir no Firestore: brands/{brandId}/autopsies/{id}

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[AUTOPSY_API_ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar o diagnóstico.' },
      { status: 500 }
    );
  }
}
// trigger redeploy 02/05/2026 12:48:19
