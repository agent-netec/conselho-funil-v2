# Prompt de Continuação — Social Media Scraping Integration

> Copie o bloco abaixo e cole em um novo chat para continuar esta conversa.

---

```
## Contexto do Projeto

Conselho de Funil — plataforma SaaS de marketing com Next.js 16, React 19, Firebase, Gemini AI, deploy na Vercel.

## Situação Atual

A feature "Competitor Profile Analysis" (Sprint O — O-4.3) em `/api/social/profile-analysis` faz:
1. Recebe `brandId` + `profileUrl`
2. Usa Firecrawl para scrape da URL → extrai markdown
3. Envia para Gemini PRO → análise estratégica do perfil
4. Retorna relatório JSON (frequência, hooks, engajamento, pontos fortes/fracos, oportunidades)

**PROBLEMA:** Firecrawl bloqueia Instagram, TikTok e YouTube por política interna (GitHub Issue #1485). Nossos fallbacks (Jina Reader, Readability, Cheerio) também falham porque o Instagram exige login para visualizar perfis. Resultado: erro 400 para qualquer URL de rede social.

## Pesquisa realizada (2026-02-19)

Documento completo: `_netecmt/docs/tools/social-media-scraping-research.md`

**Serviços avaliados para substituir Firecrawl em URLs sociais:**

| Serviço | Preço | Destaque |
|---------|-------|----------|
| **Apify** (recomendado p/ teste) | $0 free tier ($5/mês grátis) | SDK npm `apify-client`, 95-99.9% success, perfis públicos sem login |
| **ScrapeCreators** | $10/5K créditos (sem expiração) | ~$0.002/req, pay-as-you-go |
| **SociaVault** | $29/6K créditos | Multi-plataforma, REST API limpa |
| **Xpoz** | $0 (100K/mês free) | AI-native, MCP protocol |
| **Bright Data** | $1.50/1K records | Enterprise, 98%+ success |

**Decisão pendente entre 4 opções:**
- **A)** Integrar Apify como provedor social (~4h, $0 teste)
- **B)** Integrar SociaVault multi-plataforma (~3h, $29/mês)
- **C)** Apenas melhorar mensagem de erro (~30min, $0)
- **D)** Instagram Graph API via OAuth (depende Sprint L)

## Arquivos relevantes

- **Route principal:** `app/src/app/api/social/profile-analysis/route.ts` — usa FirecrawlAdapter, Gemini PRO, 2 créditos
- **Firecrawl adapter:** `app/src/lib/mcp/adapters/firecrawl.ts` — 3-tier (browser MCP → direct API → relay)
- **URL scraper (fallback chain):** `app/src/lib/ai/url-scraper.ts` — Firecrawl → Jina → Readability → Cheerio
- **Social debate (já corrigido):** `app/src/app/api/social/debate/route.ts` — PRO→Flash fallback, maxDuration=90
- **Documento de pesquisa:** `_netecmt/docs/tools/social-media-scraping-research.md`

## Outros fixes feitos nesta sessão (2026-02-19)

1. **Gemini image models:** Removidos modelos deprecated, fallback chain: `gemini-3-pro-image-preview` → `gemini-2.5-flash-image`
2. **Client-side API key leak:** Criado `/api/intelligence/analyze/image` como proxy server-side. Corrigidos `use-file-upload.ts`, `use-multimodal-analysis.ts`, `ScaleSimulator.tsx`
3. **maxDuration:** Adicionado em 13+ routes que fazem chamada Gemini (60-90s)
4. **Social debate 500:** Adicionado PRO→Flash fallback, optional chaining em brand fields

## O que fazer agora

[INSERIR AQUI A DECISÃO: qual opção (A/B/C/D) implementar, ou continuar pesquisa]

Se for Opção A (Apify):
1. Criar `app/src/lib/mcp/adapters/apify.ts` seguindo padrão do FirecrawlAdapter
2. Atualizar `profile-analysis/route.ts` para detectar URLs sociais e usar Apify
3. Adicionar `APIFY_API_TOKEN` no `.env` e Vercel
4. Testar com perfil público do Instagram

Se for Opção C (mensagem de erro):
1. Atualizar `profile-analysis/route.ts` para detectar domínios sociais antes do scrape
2. Retornar mensagem específica: "Análise de perfis do Instagram requer integração especializada (em desenvolvimento)"
```

---

> **Uso:** Copie tudo dentro do bloco de código acima e cole como primeira mensagem em um novo chat do Claude Code.
