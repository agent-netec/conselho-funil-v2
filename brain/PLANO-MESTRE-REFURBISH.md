# MKTHONEY — Plano Mestre de Refurbish

> Documento operacional completo para transformar Conselho de Funil em produto vendavel.
> Gerado: 2026-02-25 | Referencia: `brain/architecture-map.md`

---

## INDICE

1. [Decisoes Tomadas e Pendentes](#1-decisoes)
2. [Restricoes Imutaveis](#2-restricoes)
3. [FASE 0 — Stop the Bleeding](#3-fase-0)
4. [FASE 1 — First Impression](#4-fase-1)
5. [FASE 2 — Legal & Financeiro](#5-fase-2)
6. [FASE 3 — Depth](#6-fase-3)
7. [FASE 4 — Scale](#7-fase-4)
8. [Rename Checklist Completo](#8-rename)
9. [Impacto em Rotas e APIs](#9-rotas)
10. [Impacto em Banco de Dados](#10-banco)
11. [Impacto na Vercel e Deploy](#11-vercel)
12. [Paginas Legais Obrigatorias](#12-legal)
13. [Gateway de Pagamento](#13-pagamento)
14. [Riscos e Penalidades](#14-riscos)

---

## 1. DECISOES TOMADAS E PENDENTES {#1-decisoes}

| # | Decisao | Status | Valor |
|---|---------|--------|-------|
| 1 | Nome final | DECIDIDO | **MKTHONEY** |
| 2 | Copy landing | PENDENTE ENVIO | Pasta separada (usuario envia) |
| 3 | Pricing model | **PENDENTE** | 1 tier vs 3 tiers |
| 4 | Paleta de cores | **PENDENTE** | Buscando inspiracoes |
| 5 | Features stub | DECIDIDO | "Coming Soon" com lock icon |
| 6 | Embedding migration | RESOLVIDO | Ja feito no Sprint A (gemini-embedding-001) |
| 7 | Dominio producao | **PENDENTE** | mkthoney.com? |
| 8 | CNPJ/Razao Social | **PENDENTE** | Obrigatorio p/ NFS-e e footer |
| 9 | Gateway pagamento | **PENDENTE** | Stripe BR vs Asaas vs Kiwify |
| 10 | Trial com ou sem cartao | **PENDENTE** | Sem cartao = mais seguro juridicamente |

---

## 2. RESTRICOES IMUTAVEIS {#2-restricoes}

Estes identificadores NAO PODEM ser alterados sem migrar TODOS os dados:

```
Firebase Project ID:        conselho-de-funil
Firebase Auth Domain:       conselho-de-funil.firebaseapp.com
Firebase Storage Bucket:    conselho-de-funil.firebasestorage.app
Google Service Account:     conselho-funil-ads@conselho-de-funil.iam.gserviceaccount.com
Pinecone Index:             cf-dev-assets (768 dims)
Vercel Project ID:          prj_8podHAHln4uS1umkkAMBszyVrgs2
```

**Impacto:** ZERO para o usuario final. Todos sao backend-only. O usuario nunca ve esses nomes.
O produto pode se chamar MKTHONEY sem tocar nesses IDs.

---

## 3. FASE 0 — STOP THE BLEEDING {#3-fase-0}

**Objetivo:** Eliminar tudo que mente, quebra, ou engana o usuario.
**Dependencias:** Nenhuma decisao pendente.
**Estimativa:** 30-40h

### 3.1 Fix Settings Fake Saves (5 tabs)

| Tab | Arquivo | Problema | Solucao |
|-----|---------|----------|---------|
| General | `app/src/app/settings/general/page.tsx` | Toast "Salvo!" mas nao persiste | Conectar a Firestore `users/{uid}/preferences` |
| Branding | `app/src/app/settings/branding/page.tsx` | Salva local mas perde no refresh | Sincronizar com BrandingProvider + Firestore |
| Notifications | `app/src/app/settings/notifications/page.tsx` | Completamente fake | Criar collection `users/{uid}/notification_preferences` |
| Tracking | `app/src/app/settings/tracking/page.tsx` | Gera script mas nao salva config | Persistir tracking config em brand subcollection |
| Payments | `app/src/app/settings/integrations/payments/page.tsx` | Webhook URL gerada mas nao validada | Conectar validacao + persistencia |

**Rotas API afetadas:** Nenhuma nova — usar Firebase direto (pattern de useBrands).
**Banco de dados:** Criar 2 subcollections novas em `users/{uid}`.

### 3.2 Remover Dados Hardcoded

| Local | Arquivo | Dado Fake | Substituir por |
|-------|---------|-----------|----------------|
| Automation dashboard | `app/src/app/automation/page.tsx` | "142 acoes executadas" | `useAutomationStats()` → Firestore count real |
| Automation dashboard | `app/src/app/automation/page.tsx` | "R$ 12.450 otimizados" | Empty state: "Nenhuma acao executada ainda" |
| Assets metrics | `app/src/components/assets/*.tsx` | "+2.4%" trend arrows | Calcular trend real ou remover |

**Banco de dados:** Nenhuma mudanca. Apenas queries reais.

### 3.3 Fix Calendar Error 500

| Arquivo | Problema | Solucao |
|---------|----------|---------|
| `app/src/app/api/content/calendar/route.ts` | POST retorna 500 (auth/validation) | Fix auth check + error handling |

**Rotas API afetadas:** `POST /api/content/calendar`
**Banco de dados:** Nenhuma mudanca.

### 3.4 Fix Offer Lab

| Arquivo | Problema | Solucao |
|---------|----------|---------|
| `app/src/app/offer-lab/page.tsx` | IA nunca chamada na geracao | Wiring: wizard submit → POST /api/offer/generate |
| `app/src/app/api/offer/generate/route.ts` | Pode estar usando modelo errado | Verificar: usar PRO_GEMINI_MODEL p/ scoring |

**Rotas API afetadas:** `POST /api/offer/generate` (verificar se existe ou criar).
**Banco de dados:** Verificar se `brands/{brandId}/offers` esta sendo populada.

### 3.5 Fix Temperatura/TopP

| Engine | Arquivo | Problema |
|--------|---------|----------|
| Copy Engine | `app/src/lib/ai/copy-engine.ts` | Ignora brand.aiConfig.temperature |
| Social Engine | `app/src/lib/ai/social-engine.ts` | Ignora brand.aiConfig.temperature |
| Chat Engine | `app/src/app/api/chat/route.ts` | Ignora brand.aiConfig.temperature |

**Solucao:** Ler `brand.aiConfig.temperature` e `brand.aiConfig.topP` e passar para Gemini.
**Banco de dados:** Nenhuma mudanca. Dados ja existem em `brands/{brandId}`.

### 3.6 Fix Bug Critico: Meta Data Deletion URL

| Arquivo | Problema | Solucao |
|---------|----------|---------|
| `app/src/app/api/auth/meta/data-deletion/route.ts` (linha 42) | URL hardcoded para preview temp: `https://app-rho-flax-25.vercel.app/data-deletion?code=...` | Usar `new URL(req.url).origin` |

**Impacto se nao corrigir:** Meta vai rejeitar callbacks de data-deletion pos-launch.

### 3.7 Embedding Comments Cleanup

| Arquivo | Linha | Atual | Novo |
|---------|-------|-------|------|
| `app/src/lib/ai/pinecone.ts` | 3 | `// text-embedding-004` | `// gemini-embedding-001 (migrated Sprint A)` |
| `app/src/types/database.ts` | 250 | `para text-embedding-004` | `para gemini-embedding-001` |
| `app/src/lib/ai/pinecone-migration.ts` | 13 | `text-embedding-004` | `gemini-embedding-001 ou text-embedding-004` |

**Status:** Apenas comentarios. Zero risco.

### 3.8 Gemini 2.0 → 2.5 Migration Check

| Item | Verificar |
|------|-----------|
| Env var `GEMINI_MODEL` | Confirmar que aponta para `gemini-2.5-flash` (nao 2.0) |
| Env var `GEMINI_PRO_MODEL` | Confirmar que aponta para `gemini-3-pro-preview` |
| Deadline | Gemini 2.0 depreca 31/03/2026 (34 dias) |

**Acao:** Verificar no Vercel Dashboard → Environment Variables.

---

## 4. FASE 1 — FIRST IMPRESSION {#4-fase-1}

**Objetivo:** Fazer o primeiro contato do usuario ser impecavel.
**Dependencias:** Decisoes 2 (copy landing), 4 (paleta), 7 (dominio).
**Estimativa:** 60-80h

### 4.1 Rename UI → MKTHONEY

**Ver secao 8 para checklist completo de rename.**

Resumo: 52+ referencias em 35+ arquivos. Mudancas divididas em:
- 8 labels de chat mode em `constants.ts`
- 5 page headers em TSX
- 5 button labels ("Consultar Conselho" → "Perguntar ao MKTHONEY" ou similar)
- 3 export footers
- 2 URLs externas
- Meta title em `layout.tsx`
- 20+ documentos internos

### 4.2 Landing Page

| Item | Status | Dependencia |
|------|--------|-------------|
| Copy | Pendente envio | Usuario envia pasta |
| Design/UI | Pendente | Paleta de cores |
| Implementacao | Pendente | Copy + Design |
| Rota | `app/src/app/(public)/page.tsx` ou `/landing` | — |

**Novas rotas necessarias:**
- `/` (landing publica) — atualmente redireciona para dashboard
- `/pricing` — pagina de precos
- `/login` — ja existe
- `/signup` — ja existe ou precisa criar

**Decisao arquitetural:** Separar rotas publicas de rotas autenticadas.
Opcao A: Route group `(public)` vs `(app)` no app router.
Opcao B: Subdominio `app.mkthoney.com` para o produto.

### 4.3 Onboarding Wizard

| Fase | Steps | Obrigatorio? | Dados Coletados |
|------|-------|-------------|-----------------|
| 1A | 3-4 steps | SIM | Nome da marca, nicho, site, objetivo |
| 1B | 3-4 steps | NAO | Publico-alvo, canais, orcamento, tom de voz |

**Componentes novos:**
- `app/src/components/onboarding/wizard.tsx`
- `app/src/components/onboarding/steps/*.tsx`

**API nova:** Nenhuma — usa `createBrand()` + `updateBrand()` existentes.
**Banco de dados:** Nenhuma mudanca. Dados salvos em `brands/{brandId}`.

### 4.4 Veredito Proativo

| Item | Descricao |
|------|-----------|
| Trigger | Ao finalizar wizard 1A |
| Acao | Council debate automatico usando dados do wizard |
| Output | Card com veredito + proximos passos |
| API | `POST /api/chat` com mode `funnel_creation` e context do wizard |

**API afetada:** Usa `/api/chat` existente. Nenhuma nova.

### 4.5 Dashboard Contextual

| Estado | Condicao | Conteudo |
|--------|----------|----------|
| Pre-briefing | Sem brand criada | "Crie sua primeira marca" + wizard |
| Pos-Aha | Brand criada, sem funil | Veredito + "Criar primeiro funil" |
| Ativo | Brand + funnels existem | Metricas reais + quick actions |

**Arquivo:** `app/src/app/(app)/page.tsx` (dashboard principal)
**Banco de dados:** Nenhuma mudanca. Condicional baseado em queries existentes.

### 4.6 Sidebar Progressiva

| Tier | Items Visiveis | Lock |
|------|---------------|------|
| Free/Trial | Dashboard, Chat, Brands, Funnels, Copy | — |
| Pro | + Assets, Automation, Calendar, Vault, Settings | Lock icon nos free |
| Agency | + Intelligence (todos), Admin, Reports | Lock icon nos pro |

**Arquivo:** `app/src/components/layout/sidebar.tsx`
**Dependencia:** Decisao 3 (pricing model).

### 4.7 Email Verification

| Item | Opcao |
|------|-------|
| Provider | SendGrid, Resend, ou AWS SES |
| Trigger | Pos-signup |
| Template | "Bem-vindo ao MKTHONEY" + verificar email |

**API nova:** `POST /api/auth/verify-email`
**Banco de dados:** Campo `emailVerified: boolean` em `users/{uid}` (Firebase Auth ja tem).

---

## 5. FASE 2 — LEGAL & FINANCEIRO {#5-fase-2}

**Objetivo:** Compliance total para venda no Brasil.
**Dependencias:** Decisoes 8 (CNPJ), 9 (gateway), 10 (trial).
**Estimativa:** 40-50h

### 5.1 Paginas Legais OBRIGATORIAS (antes do lancamento)

| Pagina | Rota | Base Legal | Conteudo Minimo |
|--------|------|-----------|-----------------|
| Termos de Uso | `/terms` | CDC Art. 46 + Marco Civil Art. 7 | Contrato de adesao, licenca SaaS, limitacao responsabilidade |
| Politica de Privacidade | `/privacy` | LGPD Art. 9 | Controlador, finalidades, base legal, compartilhamento, retencao, direitos |
| Politica de Cookies | `/cookies` | LGPD + ANPD Guidelines | Categorias (essencial, analitico, marketing), finalidades, retencao |
| Politica de Reembolso | `/refund` | CDC Art. 49 | 7 dias arrependimento, pro-rata, processo cancelamento |

**Novas rotas:** 4 paginas estaticas no route group `(public)`.
**Banco de dados:** Nenhuma mudanca.

### 5.2 Cookie Consent Banner (OBRIGATORIO)

| Requisito | Implementacao |
|-----------|---------------|
| Modelo opt-in | Nao carregar analytics/tracking antes do aceite |
| Banner em camadas | Resumo + "Gerenciar Cookies" com detalhes |
| Opcao recusar | Botao "Recusar nao-essenciais" |
| Registro consentimento | Salvar em `users/{uid}/consent` ou localStorage + server |
| Granularidade | Essenciais (sem opcao), Analiticos, Marketing |

**Componente novo:** `app/src/components/legal/cookie-banner.tsx`
**Impacto PostHog:** So inicializar APOS aceite de cookies analiticos.

### 5.3 Informacoes da Empresa no Footer (OBRIGATORIO)

| Dado | Base Legal |
|------|-----------|
| Razao Social | Decreto 7.962/2013 Art. 2 |
| CNPJ | Decreto 7.962/2013 Art. 2 |
| Endereco | Decreto 7.962/2013 Art. 2 |
| Email de contato | Decreto 7.962/2013 Art. 2 |
| Canal LGPD | LGPD Art. 41 |

**Dependencia:** Decisao 8 (CNPJ/Razao Social).

### 5.4 Sistema de Pagamento

| Feature | Obrigatorio? | Detalhes |
|---------|-------------|---------|
| Checkout page | SIM | Preco em BRL, total visivel, condicoes claras |
| Assinatura recorrente | SIM | Informar valor, periodicidade, data cobranca |
| Trial disclosure | SIM | "Apos 14 dias, sera cobrado R$ X/mes" |
| Botao cancelar | SIM | Em Settings, mesmo canal da contratacao |
| Reembolso 7 dias | SIM | Automatico (CDC Art. 49) |
| NFS-e | SIM | Emissao automatica a cada cobranca |
| Recibo/fatura | SIM | Email a cada cobranca |

**Novas rotas API:**
- `POST /api/payments/checkout` — criar sessao de pagamento
- `POST /api/payments/webhook` — receber eventos do gateway
- `POST /api/payments/cancel` — cancelar assinatura
- `GET /api/payments/invoices` — listar faturas
- `POST /api/user/export-data` — portabilidade LGPD
- `POST /api/user/delete-account` — exclusao LGPD

**Novas paginas:**
- `/pricing` — planos e precos
- `/checkout` — fluxo de pagamento
- `/settings/billing` — gerenciar assinatura, faturas, cancelar

**Banco de dados — novas collections:**
- `subscriptions/{uid}` — status, plano, gateway_id, trial_end, next_billing
- `invoices/{invoiceId}` — valor, data, status, nfse_id
- `users/{uid}/consent` — registro de consentimentos LGPD

### 5.5 Comparativo Gateways

| Gateway | Taxa | NFS-e Auto | Pix | Recorrencia | Melhor para |
|---------|------|-----------|-----|-------------|-------------|
| **Stripe BR** | 3.99% + R$0.39 | Nao (integrar) | Sim | Nativa | Tech-first, internacional |
| **Asaas** | Variavel | **SIM** | Sim | Nativa | **SaaS BR com NFS-e** |
| **Kiwify** | 7.90% | Sim | Sim | Sim | Simplicidade, inicio rapido |
| **Hotmart** | ~9.9% | Sim | Sim | Sim | Infoprodutos, afiliados |

**Recomendacao:** Asaas (NFS-e automatica + recorrencia nativa + focado em SaaS BR) ou Stripe BR (se planeja internacionalizar).

---

## 6. FASE 3 — DEPTH {#6-fase-3}

**Objetivo:** Features que justificam o preco.
**Dependencias:** Fase 0 + Fase 1 completas.
**Estimativa:** 40-50h

### 6.1 Content Autopilot — Ativar Triggers

| Item | Arquivo | Status | Acao |
|------|---------|--------|------|
| CurationEngine | `app/src/lib/vault/curation-engine.ts` | Classe existe | Conectar trigger |
| AdaptationEngine | `app/src/lib/vault/adaptation-engine.ts` | Classe existe | Conectar trigger |
| Cron trigger | `app/src/app/api/cron/content-autopilot/route.ts` | Existe | Verificar se chamado |
| UI vazia | Vault page | "Content Autopilot will notify..." | Mostrar fila real |

**Banco de dados:** Usar `brands/{brandId}/vault_library` (ja existe).

### 6.2 Brand Hub — Wizard Unificado

| Step | Dados | Tela Atual |
|------|-------|-----------|
| 1 | Nome, nicho, URL | Brand create |
| 2 | Logo, cores, tipografia | Brand kit |
| 3 | Publico-alvo, dor, desejo | Audience |
| 4 | Oferta principal, preco, garantia | Offer |
| 5 | Canais ativos, orcamento | Channels |
| 6 | Tom de voz, personalidade | Voice |
| 7 | Config IA (temperatura, modelo) | AI Config |

**Rotas:** Nenhuma nova. Usa `PUT /api/brands/{brandId}`.
**Banco de dados:** Nenhuma mudanca. Todos campos ja existem em `brands/{brandId}`.

### 6.3 Tier System + Feature Flags

| Feature | Free/Trial | Pro | Agency |
|---------|-----------|-----|--------|
| Brands | 1 | 5 | Ilimitado |
| Funnels/mes | 3 | 20 | Ilimitado |
| Chat messages/mes | 50 | 500 | Ilimitado |
| Assets | 10 | 100 | Ilimitado |
| Copy types | Headline, Email | Todos 6 | Todos 6 |
| Intelligence | Discovery only | + Attribution | Todos |
| Automation | — | 5 rules | Ilimitado |
| Party Mode | — | Sim | Sim |
| Export PDF | — | Sim | Sim |

**Implementacao:**
- `app/src/lib/tier-system.ts` — logica de limites
- `app/src/lib/hooks/use-tier.ts` — hook para checar acesso
- Middleware para API routes: checar tier antes de processar

**Banco de dados:** Campo `tier: 'free' | 'trial' | 'pro' | 'agency'` em `users/{uid}` ou `subscriptions/{uid}`.

### 6.4 Coming Soon Lock

| Componente | Implementacao |
|------------|---------------|
| Sidebar item | Icone de cadeado + tooltip "Coming Soon" |
| Page guard | Redirect para upgrade se tier insuficiente |
| Feature card | Blur + overlay "Disponivel no plano Pro" |

**Paginas para lock (stubs):**
- `/intelligence/ab-testing`
- `/intelligence/creative`
- `/intelligence/personalization`
- `/intelligence/predict`
- `/intelligence/journey`
- `/intelligence/ltv`
- `/intelligence/research`

### 6.5 Email Sequence 14 Dias (Trial Nurturing)

| Dia | Email | Objetivo |
|-----|-------|----------|
| 0 | Bem-vindo ao MKTHONEY | Aha moment: criar primeira marca |
| 1 | Primeiro conselho gratis | Engajar com chat |
| 3 | Seu funil em 5 minutos | Converter em funil |
| 5 | Copy que vende | Mostrar copy engine |
| 7 | Meio do trial | Urgencia + features pro |
| 10 | Cases de sucesso | Social proof |
| 12 | Ultimo aviso | Urgencia final |
| 14 | Trial expirou | Upgrade CTA |

**Provider:** SendGrid, Resend, ou Loops.so
**API nova:** `POST /api/email/trigger` + cron job diario.

---

## 7. FASE 4 — SCALE {#7-fase-4}

**Objetivo:** Features que dependem de OAuth real.
**Dependencias:** Sprint L (OAuth), Meta Advanced Access.
**Estimativa:** 80-100h (pos-launch)

- [ ] OAuth real para todos os providers
- [ ] Social publishing (postar direto do app)
- [ ] Automation com dados reais de ads
- [ ] Calendar publishing
- [ ] Meta Advanced Access (App Review)
- [ ] Multi-workspace (Agency tier)

---

## 8. RENAME CHECKLIST COMPLETO {#8-rename}

### 8.1 Arquivos Criticos (18 arquivos — funcionalidade)

| # | Arquivo | Mudanca | Risco |
|---|---------|---------|-------|
| 1 | `app/src/lib/constants.ts` | 8 labels de chat mode ("Conselho" → "MKTHONEY") | MEDIO |
| 2 | `app/src/app/layout.tsx` | Meta title "Conselho de Funil" → "MKTHONEY" | ALTO (SEO) |
| 3 | `app/src/app/integrations/page.tsx` | Placeholder + service account instructions | MEDIO |
| 4 | `app/src/app/funnels/[id]/copy/page.tsx` | Header title | BAIXO |
| 5 | `app/src/app/funnels/[id]/design/page.tsx` | Header title | BAIXO |
| 6 | `app/src/app/funnels/[id]/page.tsx` | Botao "Consultar Conselho" | BAIXO |
| 7 | `app/src/app/welcome/page.tsx` | Botao "Consultar o Conselho" | BAIXO |
| 8 | `app/src/app/page.tsx` | Titulo secao landing | BAIXO |
| 9 | `app/src/components/dashboard/quick-actions.tsx` | Botao "Consultar Conselho" | BAIXO |
| 10 | `app/src/components/assets/asset-detail-modal.tsx` | Botao "Consultar Conselho" | BAIXO |
| 11 | `app/src/components/vault/approval-workspace.tsx` | Botao "Consultar Conselho" | BAIXO |
| 12 | `app/src/components/funnels/export-dialog.tsx` | Footer link export | MEDIO |
| 13 | `app/src/app/api/funnels/export/route.ts` | Footer texto + URL export | MEDIO |
| 14 | `app/src/components/modals/paywall-modal.tsx` | URL pricing | MEDIO |
| 15 | `app/.firebaserc` | **NAO MUDAR** — Firebase project ID | CRITICO |
| 16 | `app/src/lib/firebase/admin.ts` | **NAO MUDAR** — fallback project ID | CRITICO |
| 17 | `app/scripts/seed-test-data.js` | **NAO MUDAR** — Firebase config teste | CRITICO |
| 18 | `app/.env.example` | Comentarios (opcional) | BAIXO |

### 8.2 Documentacao (17+ arquivos)

| Arquivo | Prioridade |
|---------|-----------|
| `brain/GUIA-USO-PLATAFORMA.md` | Media |
| `brain/conselho-funil-v2-ux-journey.md` | Media |
| `brain/architecture-map.md` | Alta |
| `brain/roadmap-*.md` (8 arquivos) | Baixa |
| `brain/testes-manuais-bugs.md` | Baixa |
| `_netecmt/prd-master-funcionalidades.md` | Media |
| `_netecmt/project-context.md` | Media |
| `_netecmt/contracts/intelligence-storage.md` | Baixa |
| `_netecmt/docs/tools/*.md` | Baixa |
| `CLAUDE.md` | Alta |

### 8.3 O Que NAO Mudar

| Item | Motivo |
|------|--------|
| Firebase Project ID `conselho-de-funil` | Imutavel — todo o banco depende disso |
| Firebase Auth Domain | Imutavel — ligado ao project ID |
| Firebase Storage Bucket | Imutavel — todos os uploads |
| Google Service Account email | Imutavel — ligado ao GCP project |
| Pinecone Index `cf-dev-assets` | Interno, nao visivel ao usuario |
| Nomes de collections Firestore | Genericos (brands, funnels, etc) — nao tem "conselho" |
| Nomes de API routes | Genericos (/api/chat, /api/funnels) — nao tem "conselho" |

---

## 9. IMPACTO EM ROTAS E APIs {#9-rotas}

### 9.1 Rotas Existentes — Nenhuma muda de path

As 119 API routes usam nomes genericos. Nenhuma contem "conselho":
- `/api/chat` ✓
- `/api/funnels/*` ✓
- `/api/copy/*` ✓
- `/api/social/*` ✓
- `/api/intelligence/*` ✓
- `/api/automation/*` ✓
- etc.

### 9.2 Rotas NOVAS necessarias

| Rota | Fase | Tipo | Proposito |
|------|------|------|-----------|
| `/` (publica) | F1 | Page | Landing page |
| `/pricing` | F1 | Page | Planos e precos |
| `/terms` | F2 | Page | Termos de uso |
| `/privacy` | F2 | Page | Politica de privacidade |
| `/cookies` | F2 | Page | Politica de cookies |
| `/refund` | F2 | Page | Politica de reembolso |
| `/checkout` | F2 | Page | Fluxo de pagamento |
| `/settings/billing` | F2 | Page | Gerenciar assinatura |
| `POST /api/payments/checkout` | F2 | API | Criar sessao pagamento |
| `POST /api/payments/webhook` | F2 | API | Webhook do gateway |
| `POST /api/payments/cancel` | F2 | API | Cancelar assinatura |
| `GET /api/payments/invoices` | F2 | API | Listar faturas |
| `POST /api/user/export-data` | F2 | API | Portabilidade LGPD |
| `POST /api/user/delete-account` | F2 | API | Exclusao LGPD |
| `POST /api/auth/verify-email` | F1 | API | Verificacao email |
| `POST /api/email/trigger` | F3 | API | Email sequence trigger |

### 9.3 Rotas com Redirect (dominio novo)

Se dominio mudar para `mkthoney.com`:
- `conselho-de-funil.vercel.app` → 301 redirect → `mkthoney.com`
- Todos OAuth callbacks automaticos (usam `new URL(req.url).origin`)
- Excecao: Meta data-deletion hardcoded (FIX na Fase 0)

---

## 10. IMPACTO NO BANCO DE DADOS {#10-banco}

### 10.1 Collections Existentes — ZERO mudancas de schema

Todas as collections usam nomes genericos:
- `users`, `brands`, `funnels`, `conversations`, `campaigns`, etc.
- Nenhuma tem "conselho" no nome ou nos campos.

### 10.2 Novas Collections/Subcollections

| Collection | Fase | Campos Principais |
|------------|------|-------------------|
| `subscriptions/{uid}` | F2 | tier, gatewayId, status, trialEnd, nextBilling, createdAt |
| `invoices/{invoiceId}` | F2 | userId, amount, currency, status, nfseId, paidAt |
| `users/{uid}/consent` | F2 | cookieConsent, termsAccepted, privacyAccepted, timestamps |
| `users/{uid}/notification_preferences` | F0 | email, push, frequency, categories |

### 10.3 Campos Novos em Collections Existentes

| Collection | Campo Novo | Fase | Tipo |
|------------|-----------|------|------|
| `users/{uid}` | `tier` | F3 | `'free' \| 'trial' \| 'pro' \| 'agency'` |
| `users/{uid}` | `trialStartedAt` | F2 | Timestamp |
| `users/{uid}` | `onboardingCompleted` | F1 | boolean |

### 10.4 Indexes Firestore Novos

| Collection | Campos | Fase |
|------------|--------|------|
| `subscriptions` | `userId, status` | F2 |
| `invoices` | `userId, createdAt desc` | F2 |

---

## 11. IMPACTO NA VERCEL E DEPLOY {#11-vercel}

### 11.1 Projeto Vercel Atual

```
Project:    app (prj_8podHAHln4uS1umkkAMBszyVrgs2)
Region:     gru1 (Sao Paulo)
Root Dir:   app/
Domain:     conselho-de-funil.vercel.app (auto)
```

### 11.2 Mudancas Necessarias

| Acao | Quando | Como |
|------|--------|------|
| Adicionar custom domain | Antes do launch | Vercel Dashboard → Domains → Add `mkthoney.com` |
| Configurar DNS | Antes do launch | Apontar nameservers ou CNAME para Vercel |
| SSL | Automatico | Vercel gera certificado automaticamente |
| Redirect antigo → novo | No launch | Vercel Dashboard → Redirects: 301 `conselho-de-funil.vercel.app` → `mkthoney.com` |
| Env vars | No launch | Adicionar `NEXT_PUBLIC_APP_URL=https://mkthoney.com` |

### 11.3 OAuth Provider Updates (ANTES do launch)

| Provider | Dashboard | Acao |
|----------|-----------|------|
| Meta/Facebook | developers.facebook.com | Adicionar `https://mkthoney.com/api/auth/meta/callback` |
| Google | console.cloud.google.com | Adicionar `https://mkthoney.com/api/auth/google/callback` |
| Instagram | developers.facebook.com | Adicionar `https://mkthoney.com/api/auth/instagram/callback` |
| LinkedIn | developer.linkedin.com | Adicionar `https://mkthoney.com/api/auth/linkedin/callback` |
| TikTok | developers.tiktok.com | Adicionar `https://mkthoney.com/api/auth/tiktok/callback` |

**IMPORTANTE:** Manter URLs antigas ativas durante transicao. Adicionar, NAO substituir.

### 11.4 Vercel Environment Variables Novas

| Variavel | Valor | Fase |
|----------|-------|------|
| `NEXT_PUBLIC_APP_URL` | `https://mkthoney.com` | F1 |
| `STRIPE_SECRET_KEY` ou `ASAAS_API_KEY` | Do gateway | F2 |
| `STRIPE_WEBHOOK_SECRET` ou equivalente | Do gateway | F2 |
| `SENDGRID_API_KEY` ou `RESEND_API_KEY` | Do email provider | F1 |

---

## 12. PAGINAS LEGAIS — CONTEUDO MINIMO {#12-legal}

### 12.1 Termos de Uso

```
Obrigatorio conter:
1. Identificacao da empresa (razao social, CNPJ, endereco)
2. Descricao do servico (o que o MKTHONEY faz)
3. Condicoes de uso (o que o usuario pode/nao pode)
4. Licenca SaaS (nao-exclusiva, nao-transferivel)
5. Propriedade intelectual (conteudo gerado pela IA)
6. Limitacao de responsabilidade
7. Disponibilidade e SLA
8. Condicoes de suspensao/cancelamento
9. Modificacoes nos termos (30 dias de aviso)
10. Lei aplicavel (legislacao brasileira)
11. Foro (comarca da empresa)
```

### 12.2 Politica de Privacidade

```
Obrigatorio conter (LGPD Art. 9):
1. Identidade do controlador
2. Contato do encarregado/canal LGPD
3. Finalidades do processamento (por categoria)
4. Base legal para cada processamento
5. Tipos de dados coletados
6. Compartilhamento com terceiros:
   - Google (Gemini AI, Firebase, Analytics)
   - Pinecone (vetores semanticos)
   - Vercel (hosting, edge functions)
   - Meta/Google/TikTok/LinkedIn (OAuth, ads data)
   - PostHog (analytics)
   - Gateway de pagamento
7. Transferencia internacional (servidores fora do BR)
8. Periodo de retencao por tipo de dado
9. Direitos do titular (acesso, correcao, exclusao, portabilidade)
10. Processo para exercer direitos
11. Cookies (resumo, link para politica de cookies)
```

### 12.3 Politica de Cookies

```
Obrigatorio conter:
1. O que sao cookies
2. Categorias usadas:
   - Essenciais: sessao Firebase Auth, CSRF
   - Analiticos: PostHog, Google Analytics
   - Marketing: Meta Pixel, Google Ads tag (se aplicavel)
3. Finalidade de cada cookie
4. Periodo de retencao
5. Terceiros que recebem dados
6. Como gerenciar/desativar
7. Link para politica de privacidade
```

### 12.4 Politica de Reembolso

```
Obrigatorio conter:
1. Direito de arrependimento (7 dias, CDC Art. 49)
2. Processo de reembolso (como solicitar)
3. Prazo de estorno (imediato no cartao, pode levar ciclo de fatura)
4. Pro-rata para cancelamento apos 7 dias
5. Sem reembolso para creditos consumidos (se aplicavel)
6. Canal de suporte para disputas
```

---

## 13. GATEWAY DE PAGAMENTO — DECISAO {#13-pagamento}

### Recomendacao: Asaas (SaaS BR) ou Stripe (Internacional)

**Se foco Brasil:** Asaas
- NFS-e automatica (economia de ~4h/mes)
- Boleto + Pix + Cartao
- API REST simples
- Recorrencia nativa com dunning
- Painel de cobrancas

**Se foco Internacional:** Stripe BR
- Pix + Boleto + Cartao
- Ecossistema global (expansao futura)
- Billing Portal nativo
- Webhooks robustos
- Customer Portal (self-service)

**Se quer lancar rapido:** Kiwify
- Zero config
- Checkout pronto
- NFS-e inclusa
- Mas taxa mais alta (7.9%)

---

## 14. RISCOS E PENALIDADES {#14-riscos}

| Violacao | Penalidade | Probabilidade |
|----------|-----------|---------------|
| LGPD — nao conformidade | Ate 2% faturamento BR (max R$ 50M) | Media (ANPD ativa) |
| NFS-e — nao emissao | Ate 100% do valor da nota | Alta (fiscalizacao municipal) |
| CDC — negar arrependimento 7 dias | Procon + Juizado Especial | Alta |
| Marco Civil — nao reter logs 6 meses | Sancoes administrativas | Baixa |
| Decreto e-commerce — sem info empresa | Multas administrativas | Media |

---

## ORDEM DE EXECUCAO RECOMENDADA

```
SEMANA 1-2:  FASE 0 (Stop the Bleeding)
             → Fix Settings, hardcoded, Calendar, Offer Lab, Meta URL, Gemini check

SEMANA 3-4:  FASE 1 (First Impression) — Parte 1
             → Rename UI, Landing page (se assets prontos), Sidebar lock

SEMANA 5-6:  FASE 1 — Parte 2
             → Onboarding wizard, Veredito proativo, Dashboard contextual

SEMANA 7-8:  FASE 2 (Legal & Financeiro)
             → 4 paginas legais, Cookie banner, Payment gateway, Checkout

SEMANA 9-10: FASE 3 (Depth)
             → Content Autopilot, Brand Hub wizard, Tier system, Coming Soon locks

SEMANA 11-12: QA + Deploy producao
              → Dominio, SSL, OAuth updates, testes E2E, NFS-e

POS-LAUNCH:  FASE 4 (Scale)
             → OAuth real, Social publishing, Automation dados reais
```

---

## REFERENCIAS CRUZADAS

| Documento | Path |
|-----------|------|
| Architecture Map | `brain/architecture-map.md` |
| UX Journey | `brain/conselho-funil-v2-ux-journey.md` |
| Product Launch Roadmap | `brain/roadmap-product-launch.md` |
| Landing Copy V1 | `_netecmt/docs/landpage/COPY-LANDING-PAGE-V1.md` |
| Landing Copy V2 | `_netecmt/docs/landpage/COPY-LANDING-PAGE-V2.md` |
| OAuth Setup Checklist | `brain/oauth-setup-checklist.md` |
| Meta OAuth Troubleshooting | `_netecmt/docs/troubleshooting/meta-ads-oauth-permissions.md` |
| All module roadmaps | `brain/roadmap-*.md` |
