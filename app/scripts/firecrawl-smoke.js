#!/usr/bin/env node
/**
 * Firecrawl Smoke — valida scraping com URLs protegidas.
 * Uso: FIRECRAWL_API_KEY=... node scripts/firecrawl-smoke.js
 * Opcional:
 *  - FIRECRAWL_WORKER_URL=https://api.firecrawl.dev/v0/scrape
 *  - FIRECRAWL_TEST_URLS=url1,url2,url3
 *  - FIRECRAWL_MIN_CHARS=200
 *  - FIRECRAWL_TOKEN_LIMIT=120000
 */
const DEFAULT_URLS = [
  'https://www.cloudflare.com/',
  'https://www.notion.so/',
  'https://www.shopify.com/',
];

const API_KEY = (process.env.FIRECRAWL_API_KEY || '').trim();
const ENDPOINT = (process.env.FIRECRAWL_WORKER_URL || 'https://api.firecrawl.dev/v0/scrape').trim();
const MIN_CHARS = Number(process.env.FIRECRAWL_MIN_CHARS || 200);
const TOKEN_LIMIT = Number(process.env.FIRECRAWL_TOKEN_LIMIT || 120000);

const urls = (process.env.FIRECRAWL_TEST_URLS || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const targets = urls.length ? urls : DEFAULT_URLS;

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function extractHeadlines(markdown) {
  const headlines = new Set();
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,2})\s+(.+)/);
    if (match && match[2]) {
      const cleaned = match[2].replace(/\s+/g, ' ').trim();
      if (cleaned) headlines.add(cleaned);
    }
  }
  return Array.from(headlines);
}

function extractCtas(markdown) {
  const ctas = new Set();
  const regex = /\[([^\]]{2,80})\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    if (text) ctas.add(text);
  }
  return Array.from(ctas);
}

async function runOne(url) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
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
      timeout: 30000,
    }),
  });

  const status = res.status;
  const payload = await res.json().catch(() => ({}));
  const success = Boolean(payload?.success);
  const markdown = (payload?.data?.markdown || payload?.data?.content || '').trim();
  const title = payload?.data?.metadata?.title || '';

  const headlines = extractHeadlines(markdown);
  const ctas = extractCtas(markdown);
  const tokens = estimateTokens(markdown);

  const okContent = markdown.length >= MIN_CHARS;
  const okHeadlines = headlines.length > 0;
  const okCtas = ctas.length > 0;
  const okTokens = tokens <= TOKEN_LIMIT;

  return {
    url,
    status,
    success,
    title,
    markdownLength: markdown.length,
    headlinesCount: headlines.length,
    ctasCount: ctas.length,
    tokens,
    ok: success && okContent && okHeadlines && okCtas && okTokens,
    warnings: [
      !success ? 'success=false' : null,
      !okContent ? `conteudo<${MIN_CHARS}` : null,
      !okHeadlines ? 'sem-headlines' : null,
      !okCtas ? 'sem-ctas' : null,
      !okTokens ? `tokens>${TOKEN_LIMIT}` : null,
    ].filter(Boolean),
  };
}

async function main() {
  if (!API_KEY) {
    console.error('FIRECRAWL_API_KEY ausente. Abortando.');
    process.exit(1);
  }

  console.log('Firecrawl Smoke — endpoint:', ENDPOINT);
  console.log('Targets:', targets.join(', '));
  console.log('');

  const results = [];
  for (const url of targets) {
    try {
      const result = await runOne(url);
      results.push(result);
      const icon = result.ok ? '✓' : '✗';
      const warn = result.warnings.length ? `(${result.warnings.join(', ')})` : '';
      console.log(
        `${icon} ${url} → ${result.status} | title="${result.title}" | chars=${result.markdownLength} | headlines=${result.headlinesCount} | ctas=${result.ctasCount} | tokens=${result.tokens} ${warn}`
      );
    } catch (error) {
      console.log(`✗ ${url} → ERRO ${error?.message || error}`);
      results.push({ url, ok: false, warnings: ['exception'] });
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log('');
  console.log(`Resultado: ${passed}/${results.length} passou, ${failed} falhou. ${failed > 0 ? 'FALHA' : 'OK'}`);

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
