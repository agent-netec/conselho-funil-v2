# Plano: Configuracoes v2

**Status:** PLANEJADO — documentado durante QA Sprint I.
**Data:** 2026-02-16

---

## Estado Atual (Diagnostico)

### Resumo: 1 de 6 tabs funciona

| Tab | Status | Persiste? |
|-----|--------|-----------|
| Perfil | ❌ Stub | Fake save (setTimeout 1s + toast) |
| Negocio | ❌ Stub | Fake save — inputs sem state |
| Integracoes | ✅ Real | `tenants/{tenantId}/integrations/meta` |
| Notificacoes | ❌ Stub | Fake save — sem schema, toggles always ON |
| Aparencia | ❌ Parcial | React Context only — perde no refresh |
| Seguranca | ❌ Stub | Fake save — nao chama Firebase Auth |
| Sair | ✅ Real | `firebaseSignOut()` funciona |

### O handleSave() falso
Todas as tabs (exceto Integracoes) compartilham o mesmo handler:
```typescript
await new Promise(r => setTimeout(r, 1000)); // finge delay
toast.success('Salvo!'); // engana o usuario
// NAO salva nada em nenhum lugar
```

### Problemas encontrados

#### 1. Fake save em 5 tabs (CRITICO)
- Usuario ve "Salvo!" mas dados sao descartados
- Inputs sao uncontrolled — sem `value`, sem `onChange`, sem state

#### 2. Perfil nao atualiza Firebase Auth
- **Arquivo:** `app/src/app/settings/page.tsx:137-197`
- Nome e foto deveriam chamar `updateProfile(auth.currentUser, { displayName, photoURL })`
- Avatar "Alterar foto" e botao morto (sem onClick handler)
- Email e read-only (correto — Firebase Auth nao permite mudar email facilmente)

#### 3. Negocio duplica dados da Marca
- **Campos:** Nome empresa, Mercado/Nicho, Maturidade
- **Sobreposicao:** Brand ja tem `name`, `vertical`, `positioning`
- **Schema existe mas nunca usado:** `TenantContext.business` em database.ts
- **Nao existe** `updateTenant()` no firestore.ts
- **IA nao usa** — engines consultam `brand.*`, nunca `tenant.context.business`

#### 4. Notificacoes sem schema
- **Arquivo:** `app/src/app/settings/page.tsx:354-378`
- 3 toggles: funil em revisao, propostas geradas, atualizacoes
- Sempre `defaultChecked` (ON) sem `onChange`
- Nao existe `NotificationPreferences` no database.ts
- Nao existe backend de notificacoes (email, push, in-app)

#### 5. Aparencia perde no refresh
- **Arquivo:** `app/src/components/providers/branding-provider.tsx`
- `useBranding()` armazena em React Context puro
- Injeta CSS vars (`--primary-brand`) mas sem persistencia
- Reset para default (emerald/violet) ao recarregar
- Tema Dark/Light/Sistema: botoes sem logica, "Dark" sempre selecionado

#### 6. Seguranca nao muda senha
- **Arquivo:** `app/src/app/settings/page.tsx:429-461`
- Inputs sem state, sem validacao
- Nao chama `updatePassword()` do Firebase Auth
- Nao valida forca da senha
- Nao pede senha atual para confirmar

#### 7. Central de Integracoes desalinhada com o sistema
- **UI mostra:** 3 cards (Meta Ads, Google Ads, WhatsApp)
- **Sistema precisa:** 15+ integracoes externas
- **Backend tem adapters SEM UI:** Instagram, LinkedIn, Slack, Exa, Firecrawl, Bright Data, Glimpse
- **Pagina duplicada:** `/integrations` e `/settings` tab Integracoes gerenciam os mesmos dados
- **Sem validacao ao salvar:** Token invalido e aceito, erro so aparece ao usar
- **Token refresh incompleto:** Precisa de appId/appSecret nao coletados no form
- **Sem OAuth real:** Usuario cola token manualmente (friction enorme)

#### 8. Mapa completo de integracoes externas vs Central

| Integracao | Backend | UI na Central? | Quem consome |
|---|---|---|---|
| Meta Ads API | ✅ Completo (leads, CAPI, creatives, audiences) | ✅ Card + config | Performance, Automation, Assets |
| Google Ads API | ✅ Adapters (pause, budget, status, offline conv) | ❌ Card "Pendente" | Performance, Automation |
| Instagram API | ✅ Adapter (DM inbox, messages, send) | ❌ NAO APARECE | Social Command Center |
| LinkedIn API | ⚠️ Scaffold (healthcheck only) | ❌ NAO APARECE | Social Command Center |
| TikTok | ❌ Zero backend | ❌ So no tipo TS | Social, Ads, Calendar |
| X/Twitter | ❌ Nitter RSS fallback | ❌ NAO APARECE | Social Command Center |
| WhatsApp Business | ❌ Zero backend | ✅ Card "Pendente" | Notificacoes, CRM |
| Slack Webhooks | ✅ Funcional (send notifications) | ❌ NAO APARECE | Alerts, Kill-switch |
| Exa API | ✅ MCP adapter (semantic search) | ❌ NAO APARECE | Research, Deep Research |
| Firecrawl API | ✅ MCP adapter (scrape, crawl) | ❌ NAO APARECE | Research, Profile Analysis |
| Bright Data API | ✅ MCP adapter (social scraping) | ❌ NAO APARECE | Social Scraping |
| Glimpse API | ✅ MCP adapter (SEO/keywords) | ❌ NAO APARECE | Keywords Miner |
| Stripe | ❌ Referencia em JS | ❌ NAO APARECE | Billing |
| SendGrid/Resend | ❌ Zero | ❌ NAO APARECE | Email notifications |
| Google Analytics | ❌ Zero | ❌ NAO APARECE | Funnel tracking |

**Webhooks receivers que ja existem:**
- `POST /api/webhooks/dispatcher` — Meta/Instagram events (HMAC-SHA256 validated)
- `POST /api/webhooks/ads-metrics` — Performance data ingestion
- `POST /api/integrations/offline-conversion` — Offline conversions to CAPI

**Token storage (dual):**
- `tenants/{tenantId}/integrations/{provider}` — referencia UI (AES-256)
- `brands/{brandId}/secrets/token_{provider}` — MonaraTokenVault operacional (AES-256)

**Seguranca existente:**
- AES-256 encryption em todos os tokens
- HMAC-SHA256 validation nos webhooks
- Rate limiting por adapter (Exa: 1000/h, Firecrawl: 500/h, etc.)
- Circuit breakers com fallback chains
- Dead Letter Queue para webhooks falhados
- PII stripping no Bright Data

---

## Fase 1 — Conectar Saves Reais (PRIORIDADE MAXIMA)

### 1.1 Fix Tab Perfil
- **Arquivo:** `app/src/app/settings/page.tsx:137-197`
- **Adicionar:** State para `displayName` e `photoURL`
- **onChange:** Conectar inputs ao state
- **Save:** Chamar `updateProfile(auth.currentUser, { displayName, photoURL })`
- **Avatar:** Implementar upload via Firebase Storage → gerar URL → `updateProfile()`
- **Error handling:** Tratar erros de Firebase Auth (re-auth necessario?)

### 1.2 Decidir Tab Negocio
- **Opcao A (Recomendada):** Remover tab — Brand ja cobre todos esses dados
- **Opcao B:** Conectar a `TenantContext` — criar `updateTenantContext()` no firestore.ts
- **Se manter:** Adicionar state, onChange, save real ao Firestore
- **Se remover:** Redirect para Brand Hub com tooltip explicativo

### 1.3 Fix Tab Seguranca
- **Arquivo:** `app/src/app/settings/page.tsx:429-461`
- **Adicionar:** State para `currentPassword`, `newPassword`, `confirmPassword`
- **Validacao:**
  - Senha atual obrigatoria (`reauthenticateWithCredential()`)
  - Minimo 8 chars, 1 maiuscula, 1 numero
  - `newPassword === confirmPassword`
- **Save:** `updatePassword(auth.currentUser, newPassword)`
- **Error handling:** Session expirada, senha fraca, etc.

### 1.4 Fix Tab Notificacoes
- **Opcao A (MVP):** Salvar preferences no localStorage (funcional imediato)
- **Opcao B (Ideal):** Criar campo `notificationPrefs` no User document
  ```typescript
  notificationPrefs: {
    funnelReview: boolean;
    proposals: boolean;
    updates: boolean;
  }
  ```
- **Conectar:** State + onChange + save real
- **Backend futuro:** Usar preferences para filtrar notificacoes in-app/email

### Creditos: 0

---

## Fase 2 — Fix Aparencia + Tema

### 2.1 Persistir Branding
- **Arquivo:** `app/src/components/providers/branding-provider.tsx`
- **Opcao A (MVP):** Persistir em localStorage
  ```typescript
  const [branding, setBranding] = useState(() => {
    const saved = localStorage.getItem('agency-branding');
    return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
  });
  ```
- **Opcao B (Ideal):** Salvar em `tenants/{tenantId}/branding` no Firestore
- **Em ambos:** Manter injecao de CSS vars no mount

### 2.2 Implementar Tema Dark/Light
- **Arquivo:** `app/src/app/settings/page.tsx:381-427`
- **Adicionar:** State para tema selecionado
- **Logica:**
  - Dark: `document.documentElement.classList.add('dark')`
  - Light: `document.documentElement.classList.remove('dark')`
  - Sistema: `prefers-color-scheme` media query listener
- **Persistir:** localStorage `theme-preference`
- **Provider:** Criar `ThemeProvider` ou expandir `BrandingProvider`

### 2.3 Eliminar Duplicacao com Brand Hub
- **Decisao:** Aparencia (Settings) = theming da PLATAFORMA (cores do sidebar, botoes)
- **Brand Hub** = identidade visual da MARCA (cores da marca, tipografia, logos)
- **Clarificar:** Renomear tab para "Tema da Plataforma" ou "White Label"
- **Diferenciar:** Cores da plataforma (emerald) ≠ cores da marca (brand.brandKit.colors)

### Creditos: 0

---

## Fase 3 — Central de Integracoes Completa (Sprint L = OAuth)

A Central de Integracoes (`/integrations`) deve ser o UNICO hub para gerenciar TODAS as conexoes externas. Hoje mostra 3 cards mas o sistema precisa de 15+.

### 3.1 Reorganizar em Categorias

**Nova estrutura da pagina `/integrations`:**

```
Central de Integracoes
├── Plataformas de Ads (Meta Ads, Google Ads, TikTok Ads)
├── Redes Sociais (Instagram, LinkedIn, X/Twitter, TikTok)
├── Comunicacao (WhatsApp, Slack, Email)
├── Pesquisa & Dados (Exa, Firecrawl, Bright Data, Glimpse)
└── Status & Health (dashboard de todas as conexoes)
```

### 3.2 Ads: Google Ads + TikTok Ads UI
- **Google Ads:** Formulario com Client ID, Client Secret, Developer Token, Customer ID
  - Backend: `GoogleAdsAdapter` ja existe (pause, budget, status, offline conv)
  - Save: `MonaraTokenVault` + `saveIntegration()`
- **TikTok Ads:** Formulario com App ID, Secret, Access Token
  - Backend: precisa criar `TikTokAdsAdapter`
  - Save: mesmo padrao dual storage

### 3.3 Social: Instagram + LinkedIn + X
- **Instagram:** Formulario com Access Token + Page ID
  - Backend: `InstagramAdapter` ja existe (DM inbox, messages)
  - Conectar: salvar em `brands/{brandId}/secrets/instagram`
- **LinkedIn:** Formulario com Access Token + Organization ID
  - Backend: `LinkedInAdapter` ja existe (scaffold)
  - Conectar: salvar em `brands/{brandId}/secrets/linkedin`
- **X/Twitter:** Formulario com API Key + Bearer Token
  - Backend: precisa criar adapter (ou manter Nitter RSS como fallback free)

### 3.4 Comunicacao: WhatsApp + Slack + Email
- **WhatsApp Business:** Formulario com Phone Number ID + Access Token
  - Backend: precisa criar adapter
- **Slack:** Formulario com Webhook URL (ja funcional no backend)
  - Backend: `sendSlackNotification()` ja existe
  - Conectar: salvar webhook URL no Firestore em vez de env var
- **Email (SendGrid/Resend):** Formulario com API Key + From Address
  - Backend: precisa criar adapter

### 3.5 Pesquisa & Dados: Exa + Firecrawl + Bright Data + Glimpse
- **Decisao:** Estas sao configs de ADMIN (chaves de API do sistema)
- **Opcao A:** Manter em env vars (nao expor na UI)
- **Opcao B:** Mover para UI com secao "Avancado" para power users
- **Recomendacao:** Opcao A para MVP — sao APIs do sistema, nao do usuario
- **Mostrar status:** Badge "Ativo"/"Inativo" baseado em healthcheck

### 3.6 OAuth Flow Real (TODAS as plataformas)
- **Substituir:** Manual token paste → OAuth 2.0 redirect flow
- **Flow por plataforma:**
  - Meta: OAuth → `fb_exchange_token` → long-lived token → auto-refresh
  - Google: OAuth → refresh_token → auto-refresh
  - Instagram: Mesmo flow Meta (compartilham Graph API)
  - LinkedIn: OAuth 2.0 → access_token + refresh_token
  - TikTok: OAuth → access_token
- **Novos arquivos:**
  - `app/src/app/api/auth/meta/callback/route.ts`
  - `app/src/app/api/auth/google/callback/route.ts`
  - `app/src/app/api/auth/instagram/callback/route.ts`
  - `app/src/app/api/auth/linkedin/callback/route.ts`
  - `app/src/app/api/auth/tiktok/callback/route.ts`
- **Coletar appId/appSecret:** Necessario para token refresh automatico (hoje nao coletados)

### 3.7 Validacao ao Salvar + Health Dashboard
- **Pre-save:** Chamar `/api/performance/integrations/validate` ANTES de salvar (endpoint ja existe!)
- **Health Dashboard:** Secao no topo da Central mostrando:
  - Status real-time de cada integracao (Ativo/Expirado/Erro)
  - Ultimo sync, proximo refresh, rate limit restante
  - Alertas: "Token Meta expira em 5 dias"
- **Auto-refresh:** Corrigir `ensureFreshToken()` para funcionar com appId/appSecret salvos

### 3.8 Eliminar Duplicacao /integrations vs /settings
- **Decisao:** `/integrations` e a pagina principal (rica, com guidance)
- **Settings > Integracoes:** Redirect para `/integrations` ou remover tab
- **Resultado:** Um unico local para gerenciar conexoes

### Creditos: 0

---

## Fase 4 — Funcionalidades Avancadas

### 4.1 Notificacoes Backend Real
- **Prerequisito:** Fase 1.4 (schema + preferences salvos)
- **Canais:** In-app (ja existe parcialmente), Email (futuro), Push (futuro)
- **Triggers:**
  - Funil em revisao → quando status muda para `review`
  - Propostas geradas → quando Content Autopilot cria items
  - Atualizacoes → announcements manuais do admin
- **Arquivo novo:** `app/src/lib/notifications/notification-service.ts`

### 4.2 2FA / MFA
- **Expandir** tab Seguranca
- **Firebase Auth:** Suporta TOTP (Google Authenticator) e SMS
- **Flow:** Ativar 2FA → scan QR code → verificar codigo → salvar
- **UI:** Toggle de 2FA + QR code modal

### 4.3 API Keys Management
- **Novo sub-tab:** Em Integracoes
- **Para:** Usuarios que querem acessar API do Conselho programaticamente
- **CRUD:** Criar/revogar API keys com scopes

### 4.4 Export de Dados (LGPD)
- **Novo:** Botao "Exportar meus dados" na tab Seguranca
- **Gera:** ZIP com todos os dados do usuario (brands, funnels, conversations, assets)
- **Compliance:** LGPD/GDPR exige que usuario possa exportar seus dados

### Creditos: 0

---

## Arquivos Criticos

| Arquivo | Fase | Acao |
|---------|------|------|
| `app/src/app/settings/page.tsx` | 1,2 | Conectar saves reais em todas as tabs |
| `app/src/components/providers/branding-provider.tsx` | 2 | Persistir em localStorage ou Firestore |
| `app/src/components/agency/BrandingSettings.tsx` | 2 | Manter, mas clarificar vs Brand Hub |
| `app/src/lib/firebase/firestore.ts` | 1 | Adicionar `updateTenantContext()` ou `updateUserPrefs()` |
| `app/src/lib/firebase/auth.ts` | 1 | Expor `updateProfile()`, `updatePassword()`, `reauthenticate()` |
| `app/src/types/database.ts` | 1 | Adicionar `NotificationPreferences` ao User type |

## Arquivos Criticos Adicionais (Fase 3)

| Arquivo | Acao |
|---------|------|
| `app/src/app/integrations/page.tsx` | Expandir de 3 para 15+ cards com categorias |
| `app/src/lib/integrations/social/instagram-adapter.ts` | Ja existe, precisa de UI na Central |
| `app/src/lib/integrations/social/linkedin-adapter.ts` | Ja existe (scaffold), precisa de UI |
| `app/src/lib/automation/adapters/google.ts` | Ja existe, precisa de UI config |
| `app/src/lib/notifications/slack.ts` | Ja existe, precisa de UI config |
| `app/src/lib/integrations/ads/token-refresh.ts` | Fix: coletar appId/appSecret |
| `app/src/app/api/performance/integrations/validate/route.ts` | Ja existe, conectar ao save |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/app/api/auth/meta/callback/route.ts` | 3 |
| `app/src/app/api/auth/google/callback/route.ts` | 3 |
| `app/src/app/api/auth/instagram/callback/route.ts` | 3 |
| `app/src/app/api/auth/linkedin/callback/route.ts` | 3 |
| `app/src/app/api/auth/tiktok/callback/route.ts` | 3 |
| `app/src/lib/integrations/ads/tiktok-adapter.ts` | 3 |
| `app/src/lib/integrations/social/x-adapter.ts` | 3 |
| `app/src/lib/integrations/messaging/whatsapp-adapter.ts` | 3 |
| `app/src/lib/integrations/messaging/email-adapter.ts` | 3 |
| `app/src/lib/notifications/notification-service.ts` | 4 |

## Dependencias

```
Fase 1 (Conectar saves) → Independente, URGENTE
Fase 2 (Aparencia/Tema) → Independente
Fase 3 (Central de Integracoes) → Depende Sprint L (OAuth) para ads/social
       → Slack/Exa/Firecrawl podem ser feitos antes (nao precisam OAuth)
Fase 4 (Avancados) → Depende Fases 1-2
```

**Fase 1 e a mais urgente** — fake save engana o usuario e e um problema de confianca critico.

**Fase 3 e a mais complexa** — e o Sprint L inteiro. A Central de Integracoes deveria ser o
hub unico onde TODOS os modulos (Social, Automation, Calendar, Assets, Vault, Performance)
consultam credenciais. Hoje cada modulo faz seu proprio lookup, fragmentado.

**Quem consome de quem (mapa de dependencias):**
```
Central de Integracoes (salva tokens)
    ↓ MonaraTokenVault / Firestore secrets
    ├── Performance Dashboard → Meta/Google metrics
    ├── Automation Engine → Meta/Google pause/budget/creative
    ├── Social Command Center → Instagram/LinkedIn/X inbox
    ├── Social Hooks → Instagram/TikTok/LinkedIn/X publishing
    ├── Content Calendar → scheduling + publishing
    ├── Creative Vault → publishing jobs
    ├── Assets Library → import creatives from ad platforms
    ├── Deep Research → Exa + Firecrawl + Bright Data
    ├── Keywords Miner → Glimpse + Exa
    ├── Notifications → Slack + Email + WhatsApp
    └── Webhook Receivers → validate signatures from Meta/Google
```
