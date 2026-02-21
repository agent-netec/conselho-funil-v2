# Pesquisa: Scraping de Redes Sociais — Decisão Pendente

> **Data:** 2026-02-19
> **Status:** PENDENTE — aguardando decisão
> **Contexto:** Profile Analysis (`/api/social/profile-analysis`) retorna 400 para URLs do Instagram
> **Impacto:** Feature O-4.3 (Competitor Profile Analysis) não funciona para redes sociais

---

## 1. Problema

A feature de análise de perfil de competidor usa **Firecrawl** para scrape da URL → **Gemini PRO** para análise.

**Resultado atual:**
- URLs de blogs, sites, landing pages → funciona normalmente
- URLs do Instagram, TikTok, YouTube → **erro 400** ("Não foi possível acessar o perfil")

**Causa raiz:** O Firecrawl bloqueia redes sociais por política interna da empresa. Confirmado no [GitHub Issue #1485](https://github.com/firecrawl/firecrawl/issues/1485):

> *"As a company, we made the decision to block the scraping of certain sites."*

---

## 2. Ferramentas que já temos — nenhuma funciona

| Ferramenta | Status | Motivo |
|-----------|--------|--------|
| **Firecrawl** (primário) | Bloqueado | Política interna bloqueia redes sociais |
| **Jina Reader** (fallback 1) | Não funciona | Respeita login wall do Instagram — testado, retorna página de login |
| **Readability** (fallback 2) | Não funciona | Sem JS rendering, recebe HTML de login |
| **Cheerio** (fallback 3) | Não funciona | Sem JS rendering, mesmo problema |

**Conclusão:** Nenhum web scraper genérico consegue acessar perfis do Instagram. É necessário um serviço especializado que use as APIs internas do Instagram.

---

## 3. Alternativas pesquisadas (dados de fev/2026)

### Tier 1 — Recomendadas (custo-benefício)

#### Apify (RECOMENDADA para teste)
- **Site:** https://apify.com/apify/instagram-profile-scraper
- **Preço:** Free tier ($5/mês de créditos grátis) / Starter $39/mês
- **Pay-per-result:** ~$0.40/1K perfis (via `apidojo/instagram-scraper`)
- **Login IG necessário:** Não (apenas perfis públicos)
- **SDK:** `apify-client` no npm (TypeScript)
- **Dados retornados:** username, fullName, biography, followersCount, postsCount, isVerified, categoryName, profilePicUrl, latestPosts (com likes/comments/captions)
- **Confiabilidade:** 95-99.9% para perfis públicos
- **Redes suportadas:** Instagram, TikTok, YouTube, Twitter/X, Facebook, LinkedIn

```typescript
// Exemplo REST (sem SDK)
const res = await fetch(
  `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: ['natgeo'] }) }
);
const items = await res.json();
// items[0] = { username, fullName, biography, followersCount, ... }
```

#### ScrapeCreators
- **Site:** https://scrapecreators.com
- **Preço:** $10 por 5.000 créditos (pay-as-you-go, sem expiração)
- **Custo por perfil:** ~$0.002/request
- **Login IG necessário:** Não
- **Integração:** REST API simples
- **Destaque:** Sem mensalidade, créditos permanentes

#### SociaVault
- **Site:** https://sociavault.com
- **Preço:** Trial grátis (50 créditos) / Starter $29 (6K créditos)
- **Login IG necessário:** Não
- **Redes:** Instagram, TikTok, YouTube, Twitter/X
- **Destaque:** Endpoints específicos por tipo de dado (perfil, posts, reels, comentários)
- **API:** REST com fetch nativo, exemplos em JavaScript

```javascript
// Exemplo SociaVault
const res = await fetch(
  `https://api.sociavault.com/v1/scrape/instagram/profile?username=natgeo`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);
```

### Tier 2 — Alternativas

| Serviço | Preço | Destaque | Quando usar |
|---------|-------|----------|-------------|
| **Xpoz** | $0 (100K/mês free) | AI-native, MCP protocol | Alto volume grátis |
| **EnsembleData** | $100/mês | Dados estruturados | Enterprise, influencer marketing |
| **Bright Data** | $1.50/1K records | 98%+ success rate, 150M+ IPs | Escala massiva |
| **ScrapingBee** | $49/mês | General-purpose | Evitar — custo imprevisível para IG |

### Tier 3 — Open Source (alto risco, manutenção constante)

- `instagram-without-api-node` — fotos públicas sem credenciais
- `instapro` — dados públicos sem API key
- `instagram-web-api` — `getUserByUsername` sem auth

**Risco:** Rate limiting agressivo (~200 req/hora), TLS fingerprinting, quebram frequentemente. Não recomendado para produção.

---

## 4. Contexto legal

**Meta v. Bright Data (jan/2024):** Tribunal federal dos EUA decidiu que scraping de dados públicos do Instagram **sem login** não viola os termos de uso da Meta. A Meta desistiu da ação em fev/2024. Scraping de dados públicos sem login é legalmente seguro nos EUA.

---

## 5. Barreiras técnicas do Instagram

| Barreira | Detalhe |
|----------|---------|
| Login wall | Perfis públicos exigem autenticação para visualização completa |
| Rate limiting | ~200 req/hora por IP não autenticado |
| IP blocking | IPs de datacenter (AWS/GCP/Vercel) bloqueados instantaneamente |
| Browser fingerprinting | TLS handshake, HTTP/2 frames, header analysis |
| Behavioral analysis | ML models detectam padrões de bot |
| API changes | Parâmetros internos mudam a cada 2-4 semanas |

---

## 6. Opções de implementação

### Opção A — Apify como provedor de social media (RECOMENDADA)
- **Esforço:** ~4h (criar adapter + integrar no profile-analysis)
- **Custo:** $0 para teste (free tier) → ~$0.40/1K perfis em produção
- **Fluxo:** Detectar URL social → usar Apify em vez de Firecrawl → Gemini analisa dados estruturados
- **Vantagem:** Dados já vêm estruturados (JSON), Gemini recebe dados melhores que markdown scrapeado

### Opção B — SociaVault (multi-plataforma)
- **Esforço:** ~3h (REST API mais simples)
- **Custo:** $29/mês para 6K créditos
- **Vantagem:** API limpa com endpoints por tipo de dado

### Opção C — Melhorar apenas a mensagem de erro (mínimo)
- **Esforço:** ~30min
- **Custo:** $0
- **Fluxo:** Detectar URL de rede social → mostrar mensagem clara ao usuário
- **Desvantagem:** Feature continua não funcionando para redes sociais

### Opção D — Instagram Graph API (apenas conta própria)
- **Esforço:** Depende do OAuth (Sprint L)
- **Custo:** $0
- **Limitação:** Funciona apenas para a conta do próprio usuário (Business/Creator)
- **Quando:** Após Sprint L (OAuth)

---

## 7. Recomendação

**Curto prazo (agora):** Opção C — melhorar mensagem de erro + documentar limitação
**Médio prazo (Sprint P/Q):** Opção A — integrar Apify free tier para validar
**Longo prazo (Sprint L+):** Opção D — Graph API para conta própria do usuário

---

## 8. Env vars necessárias (quando implementar)

```env
# Apify (Opção A)
APIFY_API_TOKEN=apify_api_xxxxx

# SociaVault (Opção B)
SOCIAVAULT_API_KEY=sv_xxxxx

# Instagram Graph API (Opção D - Sprint L)
INSTAGRAM_APP_ID=xxxxx
INSTAGRAM_APP_SECRET=xxxxx
```

---

## Referências

- [Firecrawl GitHub Issue #1485 — Social blocking](https://github.com/firecrawl/firecrawl/issues/1485)
- [Apify Instagram Profile Scraper](https://apify.com/apify/instagram-profile-scraper)
- [Apify Instagram Scraper Pay-Per-Result](https://apify.com/apidojo/instagram-scraper)
- [ScrapeCreators](https://scrapecreators.com)
- [SociaVault Instagram API](https://sociavault.com/blog/how-to-scrape-instagram-data)
- [Xpoz Social Scraping](https://www.xpoz.ai)
- [Bright Data Instagram Scraper](https://brightdata.com/products/web-scraper/instagram)
- [Meta v. Bright Data — TechCrunch](https://techcrunch.com/2024/02/26/meta-drops-lawsuit-against-web-scraping-firm-bright-data-that-sold-millions-of-instagram-records/)
- [Jina Reader Limitations — GitHub Issue #146](https://github.com/jina-ai/reader/issues/146)
