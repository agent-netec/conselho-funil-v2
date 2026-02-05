/**
 * URL Scraper Service
 * Extrai conteúdo principal de URLs para uso no RAG
 * 
 * US-13.7: Extração de Contexto via URL
 */

import * as cheerio from 'cheerio';

import { AICostGuard } from './cost-guard';

export interface ScrapedContent {
  title: string;
  content: string;
  method?: 'firecrawl' | 'jina' | 'readability' | 'cheerio' | 'gemini-vision';
  metadata?: {
    url: string;
    depth?: number;
    subPages?: string[];
    headlines?: string[];
    ctas?: string[];
    screenshotUrl?: string;
  };
  error?: string;
  /**
   * HTML bruto capturado durante o scraping.
   * Usado para identificar imagens de fallback (páginas puramente visuais).
   */
  rawHtml?: string;
  /**
   * Imagem principal da página (og:image ou primeira <img> relevante).
   */
  primaryImageUrl?: string;
}

const FETCH_TIMEOUT = 10000; // 10 segundos
const FIRECRAWL_TIMEOUT = 30000; // 30 segundos
// Limite mínimo para aceitar conteúdo extraído. Reduzido significativamente para suportar páginas muito curtas ou puramente visuais.
const MIN_CONTENT_LENGTH = 10;
type JSDOMType = typeof import('jsdom').JSDOM;
type ReadabilityType = typeof import('@mozilla/readability').Readability;

/**
 * Extrai conteúdo principal de uma URL usando Jina Reader (Proxy de Nuvem com Playwright)
 * como primeira opção e Readability/Cheerio como fallback local.
 */
export async function extractContentFromUrl(
  url: string, 
  options: { userId?: string; brandId?: string } = {}
): Promise<ScrapedContent> {
  const { userId = 'system', brandId } = options;

  try {
    // 0. Sanitização extrema (Prevenção contra double-paste do usuário)
    let sanitizedUrl = url.trim();
    if (sanitizedUrl.includes('https://') && sanitizedUrl.lastIndexOf('https://') > 0) {
      sanitizedUrl = sanitizedUrl.substring(0, sanitizedUrl.lastIndexOf('https://')).trim();
    }
    if (sanitizedUrl.includes('http://') && sanitizedUrl.lastIndexOf('http://') > 0) {
      sanitizedUrl = sanitizedUrl.substring(0, sanitizedUrl.lastIndexOf('http://')).trim();
    }

    // 1. Validação básica de URL
    if (!isValidUrl(sanitizedUrl)) {
      return { title: '', content: '', error: `URL inválida: ${sanitizedUrl}` };
    }

    // Budget Check
    const hasBudget = await AICostGuard.checkBudget({ userId, brandId, model: 'firecrawl', feature: 'url_scraping' });
    if (!hasBudget) return { title: '', content: '', error: 'Budget limit exceeded for URL scraping.' };

    // 1. PRIMEIRA OPÇÃO: Firecrawl
    console.log(`[URL Scraper] Tentando extração via Firecrawl: ${sanitizedUrl}`);
    const firecrawlResult = await fetchFromFirecrawl(sanitizedUrl, { userId, brandId });
    if (firecrawlResult?.content && firecrawlResult.content.length >= MIN_CONTENT_LENGTH) {
      console.log(`[URL Scraper] Sucesso via Firecrawl (${firecrawlResult.content.length} chars)`);
      return firecrawlResult;
    }

    console.log('[URL Scraper] Firecrawl falhou ou retornou pouco conteúdo. Tentando Jina...');

    // 2. SEGUNDA OPÇÃO (FALLBACK): Jina Reader API
    console.log(`[URL Scraper] Tentando extração via Jina: ${sanitizedUrl}`);
    
    try {
      const jinaUrl = `https://r.jina.ai/${sanitizedUrl}`;
      const jinaApiKey = (process.env.JINA_API_KEY ?? '').trim();
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown', // Perfeito para RAG
        'X-No-Cache': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      if (jinaApiKey) {
        headers.Authorization = `Bearer ${jinaApiKey}`;
      }

      const jinaResponse = await fetch(jinaUrl, { headers });

      if (jinaResponse.ok) {
        const jinaData = await jinaResponse.json();
        const content = jinaData.data?.content || jinaData.content || '';
        const title = jinaData.data?.title || jinaData.title || extractTitleFromUrl(sanitizedUrl);

        if (content && content.length > 50) {
          console.log(`[URL Scraper] Sucesso via Jina Reader (${content.length} chars)`);
          
          // Log Usage
          await AICostGuard.logUsage(
            { userId, brandId, model: 'jina-reader', feature: 'url_scraping' },
            { inputTokens: AICostGuard.estimateTokens(url), outputTokens: AICostGuard.estimateTokens(content) },
            'jina'
          );

          return { 
            title, 
            content: cleanText(content), 
            method: 'jina',
            metadata: { url: sanitizedUrl }
          };
        }
      }

      console.log('[URL Scraper] Jina Reader falhou ou retornou pouco conteúdo. Tentando fallback local...');
    } catch (jinaErr) {
      console.warn('[URL Scraper] Erro ao conectar ao Jina Reader:', jinaErr);
    }

    // 3. TERCEIRA OPÇÃO (FALLBACK): Readability local (Mozilla)
    let JSDOM: JSDOMType | undefined;
    let Readability: ReadabilityType | undefined;
    try {
      ({ JSDOM } = await import('jsdom'));
      ({ Readability } = await import('@mozilla/readability'));
    } catch (importError) {
      console.error('[URL Scraper] Falha ao carregar jsdom/readability:', importError);
      return {
        title: '',
        content: '',
        error:
          'Falha ao iniciar parser HTML local. Tente novamente ou habilite o Jina Reader.',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let html: string;
    try {
      const response = await fetch(sanitizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = await response.text();
    } catch (fetchErr) {
      return { title: '', content: '', error: 'Falha ao acessar a URL. O site pode estar bloqueando acessos automatizados.' };
    }

    const dom = new JSDOM(html, { url: sanitizedUrl });
    const reader = new Readability(dom.window.document, { charThreshold: MIN_CONTENT_LENGTH });
    const article = reader.parse();
    const primaryImageUrl = findPrimaryImage(html, sanitizedUrl);

    if (article?.textContent && article.textContent.length >= MIN_CONTENT_LENGTH) {
      return { 
        title: article.title || extractTitleFromUrl(sanitizedUrl), 
        content: cleanText(article.textContent),
        method: 'readability',
        metadata: { url: sanitizedUrl },
        rawHtml: html,
        primaryImageUrl
      };
    }

    // 4. QUARTA OPÇÃO (ULTIMO RECURSO): Cheerio bruto
    const cheerioResult = extractWithCheerio(html, sanitizedUrl);
    return { 
      ...cheerioResult, 
      method: 'cheerio', 
      metadata: { url: sanitizedUrl },
      rawHtml: html, 
      primaryImageUrl 
    };

  } catch (error: any) {
    console.error('[URL Scraper] Erro crítico:', error);
    return { title: '', content: '', error: `Erro ao processar conteúdo: ${error.message}` };
  }
}

/**
 * Firecrawl: extrai markdown via API cloud (deep-crawl bypass).
 */
async function fetchFromFirecrawl(
  url: string, 
  options: { userId?: string; brandId?: string } = {}
): Promise<ScrapedContent | null> {
  const apiKey = (process.env.FIRECRAWL_API_KEY ?? '').trim();
  if (!apiKey) {
    console.warn('[URL Scraper] FIRECRAWL_API_KEY não configurada. Pulando Firecrawl.');
    return null;
  }

  const endpoint = (process.env.FIRECRAWL_WORKER_URL ?? 'https://api.firecrawl.dev/v0/scrape').trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT + 1000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          includeHtml: false,
          includeRawHtml: false,
          onlyMainContent: true,
          removeTags: ['script', 'style', 'noscript'],
          screenshot: false,
          fullPageScreenshot: false,
        },
        timeout: FIRECRAWL_TIMEOUT,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[URL Scraper] Firecrawl falhou (HTTP ${response.status}).`);
      return null;
    }

    const payload = await response.json();
    if (!payload?.success) {
      console.warn('[URL Scraper] Firecrawl retornou sucesso=false.');
      return null;
    }

    const data = payload.data ?? {};
    const markdown = (data.markdown || data.content || '').trim();
    if (!markdown) {
      console.warn('[URL Scraper] Firecrawl retornou conteúdo vazio.');
      return null;
    }

    const title = data.metadata?.title || extractTitleFromUrl(url);
    const headlines = extractHeadlinesFromMarkdown(markdown);
    const ctas = extractCtasFromMarkdown(markdown);

    if (options.userId) {
      await AICostGuard.logUsage(
        { userId: options.userId, brandId: options.brandId, model: 'firecrawl', feature: 'url_scraping' },
        { inputTokens: AICostGuard.estimateTokens(url), outputTokens: AICostGuard.estimateTokens(markdown) },
        'firecrawl'
      );
    }

    return {
      title,
      content: markdown,
      method: 'firecrawl',
      metadata: {
        url,
        headlines: headlines.length ? headlines : undefined,
        ctas: ctas.length ? ctas : undefined,
      },
    };
  } catch (error) {
    console.warn('[URL Scraper] Erro ao conectar ao Firecrawl:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fallback: extrai conteúdo com Cheerio
 * Tenta encontrar tags comuns de artigos
 */
function extractWithCheerio(html: string, url: string): ScrapedContent {
  try {
    const $ = cheerio.load(html);

    // Remove scripts, styles, menus, footers
    $('script, style, nav, header, footer, aside, .menu, .navigation, .sidebar').remove();

    // Tenta encontrar o conteúdo principal
    let content = '';
    const contentSelectors = [
      'article',
      '.article',
      '.post',
      '.content',
      '.post-content',
      '.article-body',
      '.entry-content',
      'main',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        if (content.length >= MIN_CONTENT_LENGTH) {
          break;
        }
      }
    }

    // Se não encontrou nada nos seletores comuns, pega o body removendo apenas scripts e estilos
    if (content.length < MIN_CONTENT_LENGTH) {
      console.log('[URL Scraper] Conteúdo curto via seletores. Pegando body total...');
      // Recarrega o body sem scripts/styles
      const $full = cheerio.load(html);
      $full('script, style, nav, footer, iframe, noscript').remove();
      content = $full('body').text();
    }

    // Limpar texto
    const cleanContent = cleanText(content);

    // Se ainda assim for vazio, lança erro descritivo
    if (cleanContent.length === 0) {
      return {
        title: '',
        content: '',
        error: 'Não foi possível extrair conteúdo textual desta página (ela pode ser puramente visual ou protegida).',
      };
    }

    // Título
    const title = $('title').text() || $('h1').first().text() || extractTitleFromUrl(url);

    return {
      title: cleanText(title),
      content: cleanContent,
      primaryImageUrl: findPrimaryImage(html, url),
      metadata: { url },
    };
  } catch (error: any) {
    return {
      title: '',
      content: '',
      error: `Erro ao fazer parse do HTML: ${error.message}`,
    };
  }
}

/**
 * Captura a imagem principal (og:image ou primeira <img> relevante)
 */
function findPrimaryImage(html: string, baseUrl: string): string | undefined {
  try {
    const $ = cheerio.load(html);

    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    const firstImg = $('img[src]').first().attr('src');

    const candidate = ogImage || twitterImage || firstImg;
    if (!candidate) return undefined;

    try {
      return new URL(candidate, baseUrl).toString();
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Valida se a URL é válida e segura
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extrai título da URL (fallback)
 */
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const lastPart = pathname.split('/').filter(Boolean).pop() || '';
    
    // Remove extensões e hifens
    return lastPart
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();
  } catch {
    return 'Documento sem título';
  }
}

/**
 * Limpa texto: remove espaços extras, quebras de linha múltiplas, etc
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Múltiplos espaços → 1 espaço
    .replace(/\n{3,}/g, '\n\n')     // Múltiplas quebras → 2 quebras
    .trim();
}

function extractHeadlinesFromMarkdown(markdown: string): string[] {
  const headlines = new Set<string>();
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,2})\s+(.+)/);
    if (match?.[2]) {
      const cleaned = cleanText(match[2]);
      if (cleaned) headlines.add(cleaned);
    }
  }
  return Array.from(headlines);
}

function extractCtasFromMarkdown(markdown: string): string[] {
  const ctas = new Set<string>();
  const regex = /\[([^\]]{2,80})\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const text = cleanText(match[1]);
    if (text) ctas.add(text);
  }
  return Array.from(ctas);
}




