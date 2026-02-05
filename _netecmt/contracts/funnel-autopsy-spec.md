# Contract: Funnel Autopsy & Scraping Engine (Sprint 23)

## 1. Definição do Motor de Extração (Scraping Engine)

O sistema de extração de conteúdo web utiliza uma arquitetura de **Resiliência em Camadas (Layered Resilience)** para garantir a captura de dados mesmo sob proteções anti-bot severas.

### 1.1. Hierarquia de Fallback
| Ordem | Provedor | Caso de Uso | Gatilho de Falha |
| :--- | :--- | :--- | :--- |
| 1 | **Firecrawl** | Deep-crawl, Cloudflare Bypass, SPA | Timeout (>30s), Erro de API, Limite de Rate |
| 2 | **Jina Reader** | Páginas Únicas, Markdown Rápido | Erro 422, Conteúdo Vazio, Bloqueio de IP |
| 3 | **Readability Local** | Sites sem proteção, Fallback Crítico | Falha no Fetch, DOM ilegível |
| 4 | **Cheerio (Raw)** | Último recurso (Texto Bruto) | N/A (Sempre retorna algo ou erro final) |

## 2. Contrato de Dados (TypeScript)

### 2.1. Interface de Saída (`ScrapedContent`)
```typescript
export interface ScrapedContent {
  title: string;
  content: string; // Markdown formatado
  method: 'firecrawl' | 'jina' | 'readability' | 'cheerio';
  metadata: {
    url: string;
    depth?: number;
    subPages?: string[]; // Apenas para Firecrawl (Deep-crawl)
    headlines?: string[]; // H1, H2 extraídos
    ctas?: string[]; // Botões e links de conversão
    screenshotUrl?: string;
  };
  error?: string;
}
```

### 2.2. Estrutura do Markdown Retornado
O Markdown deve seguir a estrutura semântica para otimização do RAG:
- `# [Título da Página]`
- `## [Seção]`
- `> [Headline de Destaque]`
- `[Botão CTA] -> (url)`

## 3. Integração Firecrawl (Especificação Técnica)

### 3.1. Configuração de Ingestão
- **Endpoint**: `https://api.firecrawl.dev/v0/scrape` (ou `/crawl` para deep)
- **Modo**: `scrape` para Autopsy rápido, `crawl` para Spy Agent.
- **Format**: `markdown` (nativo).

### 3.2. Extração de Ativos (Selectors)
O Firecrawl deve ser configurado para extrair via LLM ou seletores CSS:
- **Headlines**: `h1`, `h2`, `[class*="hero"] h3`
- **CTAs**: `a.btn`, `button`, `[role="button"]`

## 4. Fluxo de Execução (AutopsyEngine)

1. `AutopsyEngine` recebe URL.
2. Chama `extractContentFromUrl` (lib/ai/url-scraper.ts).
3. `url-scraper` tenta Firecrawl.
4. Se falhar, tenta Jina.
5. Se falhar, tenta Local.
6. Retorna `ScrapedContent` para o Engine processar as heurísticas.

---
*Assinado: Athos (Arch) - 05/02/2026*
