/**
 * URL Scraper Service
 * Extrai conteúdo principal de URLs para uso no RAG
 * 
 * US-13.7: Extração de Contexto via URL
 */

import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ScrapedContent {
  title: string;
  content: string;
  method?: 'jina' | 'readability' | 'cheerio' | 'gemini-vision';
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
// Limite mínimo para aceitar conteúdo extraído. Reduzido significativamente para suportar páginas muito curtas ou puramente visuais.
const MIN_CONTENT_LENGTH = 10;

/**
 * Extrai conteúdo principal de uma URL usando Jina Reader (Proxy de Nuvem com Playwright)
 * como primeira opção e Readability/Cheerio como fallback local.
 */
export async function extractContentFromUrl(url: string): Promise<ScrapedContent> {
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

    // 2. PRIMEIRA OPÇÃO: Jina Reader API
    console.log(`[URL Scraper] Tentando extração via Jina: ${sanitizedUrl}`);
    
    try {
      const jinaUrl = `https://r.jina.ai/${sanitizedUrl}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown', // Perfeito para RAG
          'X-No-Cache': 'true',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
      });

      if (jinaResponse.ok) {
        const jinaData = await jinaResponse.json();
        const content = jinaData.data?.content || jinaData.content || '';
        const title = jinaData.data?.title || jinaData.title || extractTitleFromUrl(url);

        if (content && content.length > 50) {
          console.log(`[URL Scraper] Sucesso via Jina Reader (${content.length} chars)`);
          return { title, content: cleanText(content), method: 'jina' };
        }
      }
      console.log('[URL Scraper] Jina Reader falhou ou retornou pouco conteúdo. Tentando fallback local...');
    } catch (jinaErr) {
      console.warn('[URL Scraper] Erro ao conectar ao Jina Reader:', jinaErr);
    }

    // 3. SEGUNDA OPÇÃO (FALLBACK): Readability local (Mozilla)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let html: string;
    try {
      const response = await fetch(url, {
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

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, { charThreshold: MIN_CONTENT_LENGTH });
    const article = reader.parse();
    const primaryImageUrl = findPrimaryImage(html, url);

    if (article?.textContent && article.textContent.length >= MIN_CONTENT_LENGTH) {
      return { 
        title: article.title || extractTitleFromUrl(url), 
        content: cleanText(article.textContent),
        method: 'readability',
        rawHtml: html,
        primaryImageUrl
      };
    }

    // 4. TERCEIRA OPÇÃO (ULTIMO RECURSO): Cheerio bruto
    const cheerioResult = extractWithCheerio(html, url);
    return { ...cheerioResult, method: 'cheerio', rawHtml: html, primaryImageUrl };

  } catch (error: any) {
    console.error('[URL Scraper] Erro crítico:', error);
    return { title: '', content: '', error: `Erro ao processar conteúdo: ${error.message}` };
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




