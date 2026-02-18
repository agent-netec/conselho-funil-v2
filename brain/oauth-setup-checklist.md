# OAuth Setup Checklist — Conselho de Funil

> **Criado:** 2026-02-18 (Sprint U)
> **Domínio produção:** verificar URL real no Vercel Dashboard

---

## 1. Redirect URIs a Registrar em Cada Provider

Cada provider OAuth exige que o `redirect_uri` esteja **pré-cadastrado** no console do desenvolvedor.
O código usa URLs dinâmicas (`new URL(req.url).origin`), então funciona em qualquer domínio — mas o provider precisa aprovar esse domínio.

| Provider | redirect_uri | Onde cadastrar |
|----------|-------------|----------------|
| **Meta** | `https://SEU-DOMINIO/api/auth/meta/callback` | [developers.facebook.com](https://developers.facebook.com) > App > Settings > Valid OAuth Redirect URIs |
| **Google** | `https://SEU-DOMINIO/api/auth/google/callback` | [console.cloud.google.com](https://console.cloud.google.com) > APIs & Services > Credentials > OAuth 2.0 Client > Authorized redirect URIs |
| **Instagram** | `https://SEU-DOMINIO/api/auth/instagram/callback` | Mesmo app Meta (Facebook Login > Settings > Valid OAuth Redirect URIs) |
| **LinkedIn** | `https://SEU-DOMINIO/api/auth/linkedin/callback` | [linkedin.com/developers](https://www.linkedin.com/developers/) > App > Auth > Authorized redirect URLs |
| **TikTok** | `https://SEU-DOMINIO/api/auth/tiktok/callback` | [business-api.tiktok.com](https://business-api.tiktok.com) > App > Settings > Callback URL |

---

## 2. Variáveis de Ambiente Necessárias (Vercel)

Cada OAuth callback route lê env vars específicas. Sem elas, o callback retorna `?error=*_config`.

| Variável | Usado por | Onde obter |
|----------|-----------|------------|
| `META_APP_ID` | Meta + Instagram | developers.facebook.com > App Dashboard |
| `META_APP_SECRET` | Meta + Instagram | developers.facebook.com > App Dashboard > Settings > Basic |
| `GOOGLE_CLIENT_ID` | Google | console.cloud.google.com > Credentials |
| `GOOGLE_CLIENT_SECRET` | Google | console.cloud.google.com > Credentials |
| `GOOGLE_DEVELOPER_TOKEN` | Google Ads | Google Ads API Center (dentro da conta MCC) |
| `LINKEDIN_CLIENT_ID` | LinkedIn | linkedin.com/developers > App > Auth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | linkedin.com/developers > App > Auth |
| `TIKTOK_APP_ID` | TikTok | business-api.tiktok.com > App Management |
| `TIKTOK_APP_SECRET` | TikTok | business-api.tiktok.com > App Management |

### Como adicionar no Vercel (sem bug de whitespace)
```bash
# SEMPRE usar printf (não echo) para evitar \n trailing
printf 'VALOR_SEM_ESPACOS' | vercel env add META_APP_ID production

# Verificar após adicionar
vercel env pull .env.local
```

---

## 3. Escopos (Scopes) Requeridos por Provider

### Meta (Facebook + Instagram)
- `ads_read` — leitura de campanhas e métricas
- `read_insights` — insights de performance
- `ads_management` — gestão de campanhas (opcional, para automação)
- `instagram_basic` — perfil e mídia do Instagram
- `instagram_manage_insights` — métricas do Instagram
- `pages_show_list` — listar páginas vinculadas
- `instagram_manage_comments` — responder comentários (Sprint V)
- `instagram_content_publish` — publicar no Instagram (Sprint V)

### Google
- `https://www.googleapis.com/auth/adwords` — Google Ads completo
- Refresh token requer `access_type=offline` + `prompt=consent`

### LinkedIn
- `r_ads` — leitura de campanhas
- `r_ads_reporting` — relatórios de performance
- `w_member_social` — publicar posts (Sprint V)

### TikTok
- `ad.read` — leitura de anúncios
- `ad.write` — gestão de anúncios

---

## 4. Duração dos Tokens

| Provider | Access Token | Refresh Token | Auto-refresh implementado? |
|----------|-------------|---------------|---------------------------|
| Meta | 60 dias (long-lived) | N/A (usa fb_exchange_token) | Sim (`token-refresh.ts`) |
| Google | 1 hora | Permanente (até revogado) | Sim (`token-refresh.ts`) |
| Instagram | 60 dias (via Meta) | N/A | Sim (compartilha Meta) |
| LinkedIn | 60 dias | 365 dias | Não (pendente Sprint V+) |
| TikTok | 24 horas | 365 dias | Não (pendente Sprint V+) |

---

## 5. Checklist Antes de Ativar OAuth em Produção

- [ ] Domínio de produção definido e propagado
- [ ] Redirect URIs cadastrados em TODOS os providers (tabela acima)
- [ ] Env vars adicionadas no Vercel (tabela acima)
- [ ] App Meta em modo "Live" (não "Development") — requer App Review para escopos especiais
- [ ] Google OAuth consent screen publicado (não "Testing") — limite de 100 users em teste
- [ ] LinkedIn App verificada (se necessário para escopos ads)
- [ ] TikTok App aprovada pelo TikTok for Business

---

## 6. Fluxo Manual (sem OAuth popup)

Se o usuário preferir inserir tokens manualmente (System User Token para Meta, por ex.),
a página `/integrations` tem formulários completos com campos para:
- Meta: adAccountId, accessToken, appId, appSecret
- Google: customerId, developerToken, clientId, clientSecret, refreshToken, accessToken
- LinkedIn: accountId, accessToken, clientId, clientSecret
- TikTok: advertiserId, accessToken, appId, appSecret

Esses formulários fazem dual storage: MonaraTokenVault (criptografado) + Firestore integrations doc (status UI).
