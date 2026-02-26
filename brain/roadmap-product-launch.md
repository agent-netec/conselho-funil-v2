# Plano: Product Launch — UX/UI Redesign + Onboarding + Production Readiness

**Status:** PLANEJADO — documentado durante QA Sprint I.
**Data:** 2026-02-16

**Principio:** NADA do que existe hoje e sagrado. Paleta de cores, nome do produto, layout,
estrutura de navegacao — tudo pode e deve mudar se necessario para entregar um produto
profissional e coerente.

---

## PARTE 1: ESTADO ATUAL

### Jornada do Usuario Hoje

```
1. Visita o site → NAO EXISTE landing page (so login/signup)
2. Signup → Nome + Email + Senha (minimo 6 chars, sem verificacao de email)
3. Redirect para Dashboard → Cards vazios, "Bom dia, Estrategista"
4. Ve "+ Criar Primeira Marca" no header → Clica
5. Wizard 4 steps → Identity, Audience, Offer, Confirm
6. Redirect para Dashboard → Ainda confuso sobre o que fazer
7. Precisa descobrir sozinho que deve:
   - Ir em Brand Hub para cores/logo/AI config
   - Ir em Assets para upload de docs
   - Ir em Settings para integracoes
   - Entender os 23+ items da sidebar
```

### Problemas da Jornada Atual
1. **Sem landing page** — usuario nao sabe o que e o produto antes de criar conta
2. **Sem verificacao de email** — qualquer email fake cria conta
3. **Sem onboarding pos-signup** — dashboard mostra cards vazios sem guia
4. **Marca incompleta** — wizard so cobre 30% da configuracao (sem cores, logo, AI, assets)
5. **Sidebar sobrecarregada** — 23+ items em 5 grupos, sem contexto do que cada um faz
6. **Sem "getting started"** — nenhum tooltip, tour, ou checklist de primeiro uso
7. **Quick Action "/library" quebrado** — rota nao existe
8. **Sem empty states guiados** — paginas mostram "0 items" sem explicar como popular

### Identidade Atual
- **Nome:** Conselho de Funil
- **Como chama o usuario:** "Estrategista"
- **Referencia ao produto:** "Conselho", "Linha de Ouro"
- **Conselheiros:** 23 especialistas de marketing (Russell Brunson, Dan Kennedy, etc.)
- **Paleta:** Emerald/zinc (dark mode only)
- **Sidebar:** 5 grupos, 23+ items

---

## PARTE 2: SPRINT UX/UI — REDESIGN COMPLETO

### A. Renomeacao do Produto

#### A.1 Definir Novo Nome
- **Decisao necessaria:** Qual sera o novo nome do produto?
- **Impacto:** Alterar em todos os lugares:
  - Auth pages (login, signup)
  - Dashboard greeting
  - Sidebar header/logo
  - Document titles (`<title>`)
  - Meta tags (OG, Twitter)
  - Email templates (futuro)
  - Landing page
  - Favicon, manifest.json
  - API responses que mencionam o nome
- **Arquivos chave:**
  - `app/src/app/layout.tsx` — metadata, title
  - `app/src/components/layout/sidebar.tsx` — logo/nome no sidebar
  - `app/src/app/(auth)/login/page.tsx` — "Bem-vindo ao Conselho"
  - `app/src/app/(auth)/signup/page.tsx` — "Criar conta"
  - `app/src/app/page.tsx` — dashboard greeting
  - `app/public/` — favicon, manifest.json, OG images

#### A.2 Redefinir Terminologia
- **"Estrategista"** → manter ou mudar como o sistema chama o usuario?
- **"Conselho"** → manter como referencia aos conselheiros IA?
- **"Linha de Ouro"** → manter como conceito estrategico?
- **Glossario:** Criar documento de terminologia oficial do produto

### B. Nova Paleta de Cores e Design System

#### B.1 Definir Nova Paleta
- **NAO se apegar ao emerald/zinc atual**
- **Definir:**
  - Primary color (brand principal)
  - Secondary color (accent)
  - Success/Warning/Error states
  - Neutral scale (backgrounds, borders, text)
  - Gradient tokens (se usar gradientes)
- **Dark mode:** Manter como padrao? Adicionar light mode?
- **Ferramenta:** Usar Tailwind CSS design tokens

#### B.2 Criar Design Tokens
- **Novo arquivo:** `app/src/styles/design-tokens.ts` ou CSS custom properties
- **Padrao:** Tailwind `theme.extend.colors` no `tailwind.config.ts`
- **Tokens:** Cores, spacing, typography, shadows, border-radius, transitions
- **Consistencia:** Todos os componentes devem usar tokens, ZERO cores hardcoded

#### B.3 Atualizar Componentes Base
- **Botoes:** Primary, secondary, ghost, destructive — com nova paleta
- **Cards:** Padrao unico para todos os cards do sistema
- **Inputs:** Forms consistentes (hoje cada pagina tem estilo diferente)
- **Modals:** Padrao unico (hoje mistura fullscreen, sidebar, center)
- **Badges:** Status badges consistentes (Ativo, Pendente, Erro, etc.)
- **Tables:** Padrao unico para tabelas/listas

#### B.4 Typografia
- **Definir:** Font principal (heading), font secundaria (body)
- **Scale:** h1-h6, body-lg, body, body-sm, caption
- **Pesos:** Regular, medium, semibold, bold
- **Google Fonts ou self-hosted**

### C. Redesign de Navegacao

#### C.1 Simplificar Sidebar
- **Problema atual:** 23+ items em 5 grupos — overwhelming para novo usuario
- **Opcoes:**
  - **Progressive disclosure:** Mostrar items conforme usuario avanca
  - **Role-based:** Sidebar adapta ao tipo de usuario (gestor de trafego vs copywriter vs dono)
  - **Agrupamento reduzido:** Consolidar funcionalidades similares
  - **Favoritos:** Usuario pina os items que mais usa
- **Mobile:** Sidebar responsiva (hoje nao esta claro se funciona em mobile)

#### C.2 Redesign Header
- **Brand Selector** — manter mas melhorar UX (hoje e um dropdown simples)
- **Busca global** — adicionar? (buscar em funnels, brands, assets, etc.)
- **Notificacoes** — badge funcional (hoje sem backend)
- **Profile menu** — quick access a settings, logout

#### C.3 Breadcrumbs e Contexto
- **Adicionar:** Breadcrumbs para navegacao profunda (ex: Brands > mkthoney > Brand Hub)
- **Melhoria:** Cada pagina mostra claramente ONDE o usuario esta e COMO voltar

### D. Landing Page

#### D.1 Criar Landing Page Publica
- **Rota:** `/` para usuarios nao autenticados (hoje redireciona para /login)
- **Secoes:**
  - Hero: proposta de valor + CTA
  - Features: o que o produto faz (com screenshots)
  - Como funciona: 3-4 steps
  - Conselheiros: apresentar os 23 especialistas
  - Pricing (se aplicavel)
  - CTA final: "Criar conta gratis"
  - Footer: links, termos, contato
- **Novo arquivo:** `app/src/app/(public)/page.tsx` ou split no layout
- **SEO:** Meta tags, OG images, structured data, sitemap

#### D.2 Paginas Complementares
- **Sobre** — historia do produto, equipe
- **Pricing** — planos e precos (se SaaS)
- **Termos de uso** — LGPD/GDPR compliance
- **Politica de privacidade** — obrigatorio
- **Blog** — opcional mas bom para SEO

---

## PARTE 3: SPRINT ONBOARDING — FLUXO COMPLETO

### E. Onboarding Pos-Signup

#### E.1 Welcome Wizard (5-7 steps)
Apos signup, antes de ver o dashboard:

```
Step 1: Boas-vindas + explicacao rapida do produto (30s)
Step 2: Criar marca (nome, vertical, positioning, voiceTone) — OBRIGATORIO
Step 3: Audience + Offer (campos existentes do wizard atual)
Step 4: Visual Identity (cores, logo) — OPCIONAL, pode pular
Step 5: AI Configuration (preset rapido) — OPCIONAL, pode pular
Step 6: Primeira acao guiada:
   - "Consultar o Conselho" (chat) OU
   - "Criar seu primeiro funil" OU
   - "Analisar um concorrente"
Step 7: Checklist de proximos passos
```

#### E.2 Checklist de Completude
- **Persistente:** Badge no sidebar ou widget no dashboard
- **Items:**
  - [x] Criar conta
  - [x] Criar marca
  - [ ] Adicionar logo
  - [ ] Configurar cores
  - [ ] Fazer primeira consulta ao Conselho
  - [ ] Criar primeiro funil
  - [ ] Conectar Meta Ads (opcional)
  - [ ] Upload de brand book (opcional)
- **Progresso:** "Voce esta 40% configurado"
- **Gamification leve:** Cada item completo desbloqueia algo ou mostra parabens

#### E.3 Empty States Guiados
- **Cada pagina** com 0 items deve ter:
  - Explicacao do que a pagina faz
  - CTA para a primeira acao
  - Link para documentacao/tutorial
- **Exemplo:** Calendar vazio → "Crie seu primeiro conteudo" + botao + mini tutorial

#### E.4 Tour Interativo (Opcional)
- **Biblioteca:** `react-joyride` ou `shepherd.js`
- **Trigger:** Primeira vez que usuario acessa uma pagina
- **Tooltips:** Explicam cada elemento da interface
- **Skipavel:** "Pular tour" sempre disponivel

### F. Verificacao de Email

#### F.1 Implementar Email Verification
- **Firebase Auth:** `sendEmailVerification(auth.currentUser)`
- **Flow:** Signup → Email enviado → Usuario verifica → Acesso liberado
- **Fallback:** Permitir acesso limitado sem verificacao (mas lembrar)
- **UI:** Banner "Verifique seu email para acesso completo"

#### F.2 Password Recovery
- **Verificar:** Existe "Esqueci minha senha"?
- **Se nao:** Adicionar com `sendPasswordResetEmail(auth, email)`
- **UI:** Link na pagina de login

---

## PARTE 4: PRODUCTION READINESS — O QUE FALTA PARA IR AO AR

### G. Checklist Tecnico

#### G.1 Seguranca
- [ ] Verificar NEXT_PUBLIC_ENCRYPTION_KEY nao esta usando default hardcoded
- [ ] Verificar todas as env vars estao setadas em producao
- [ ] Firebase Security Rules auditadas (read/write por brand/user)
- [ ] Rate limiting em todas as API routes criticas
- [ ] CORS configurado corretamente
- [ ] CSP (Content Security Policy) headers
- [ ] Verificar se tokens expirados sao tratados gracefully
- [ ] Password strength requirements no signup (hoje minimo 6 chars)
- [ ] Input sanitization em todos os forms (XSS prevention)

#### G.2 Performance
- [ ] Lighthouse audit (target: 90+ em todas as metricas)
- [ ] Images otimizadas (next/image, WebP, lazy loading)
- [ ] Bundle size audit (tree shaking, code splitting)
- [ ] API response times < 2s para operacoes normais
- [ ] Gemini API com timeout e fallback adequados
- [ ] Pinecone queries otimizadas (nao usar dummy vectors)

#### G.3 SEO & Meta
- [ ] Meta tags em todas as paginas publicas
- [ ] OG images para share em redes sociais
- [ ] Sitemap.xml gerado
- [ ] Robots.txt configurado
- [ ] Structured data (JSON-LD) na landing page

#### G.4 Monitoring & Error Tracking
- [ ] Error tracking (Sentry ou similar) configurado
- [ ] Logging estruturado em todas as API routes
- [ ] Uptime monitoring (Vercel analytics ou Checkly)
- [ ] Alertas para erros criticos (Slack webhook ja existe)

#### G.5 Legal & Compliance
- [ ] Termos de uso redigidos
- [ ] Politica de privacidade (LGPD compliance)
- [ ] Cookie consent banner (se usar cookies/analytics)
- [ ] Direito de exclusao de dados (LGPD Art. 18)
- [ ] Data Processing Agreement (se processar dados de terceiros)

### H. Checklist de Features Minimas para Launch

#### H.1 Must-Have (Blocker para launch)
- [ ] **Landing page** com proposta de valor clara
- [ ] **Signup/Login** funcionais com verificacao de email
- [ ] **Onboarding** que guia usuario ate primeira acao util
- [ ] **Brand creation** completo (wizard expandido)
- [ ] **Chat com Conselho** funcionando (core feature)
- [ ] **Funil builder** gerando propostas reais
- [ ] **Settings que salvam** (fix fake save)
- [ ] **Seguranca basica** (encryption keys, auth guard, input sanitization)
- [ ] **Termos de uso + Privacidade** publicados
- [ ] **Empty states** guiados em todas as paginas

#### H.2 Should-Have (Importante mas nao blocker)
- [ ] **Content Calendar** sem erro 500
- [ ] **Social hooks** funcionando (ja fixado)
- [ ] **Assets upload** com feedback correto (fix asset invisivel)
- [ ] **Brand Hub** com AI config conectado aos engines
- [ ] **Meta Ads integration** com validacao de token
- [ ] **Export de dados** basico (CSV de funnels/copies)
- [ ] **Notificacoes in-app** minimas (aprovacoes pendentes)

#### H.3 Nice-to-Have (Pode esperar v1.1)
- [ ] Light mode / tema customizavel
- [ ] Google Ads integration
- [ ] TikTok integration
- [ ] Social Command Center real
- [ ] Automation v2 com conselho de ads
- [ ] Content Autopilot ativado
- [ ] Creative Vault completo
- [ ] Keywords Miner com DataForSEO
- [ ] A/B Testing social
- [ ] Multi-language support
- [ ] Mobile responsive completo

### I. Integracoes Minimas para Launch

| Integracao | Prioridade | Status atual | Necessario para launch? |
|---|---|---|---|
| Gemini API | CRITICA | ✅ Funcional | Sim — core do produto |
| Pinecone | CRITICA | ✅ Funcional | Sim — RAG |
| Firebase Auth | CRITICA | ✅ Funcional | Sim — auth |
| Firebase Firestore | CRITICA | ✅ Funcional | Sim — data |
| Firebase Storage | CRITICA | ✅ Funcional | Sim — uploads |
| Meta Ads | ALTA | ⚠️ OAuth funcional mas Standard Access (so testers) — convite de tester NAO funciona | Requer App Review para Advanced Access |
| Exa | ALTA | ✅ Funcional | Sim — research |
| Firecrawl | ALTA | ✅ Funcional | Sim — research |
| Slack | MEDIA | ✅ Funcional | Nao — nice to have |
| Stripe | MEDIA | ❌ Nao existe | Se for SaaS pago, sim |
| SendGrid/Resend | MEDIA | ❌ Nao existe | Sim — email verification |
| Google Ads | BAIXA | ⚠️ Backend parcial | Nao — v1.1 |
| Instagram | BAIXA | ⚠️ Adapter existe | Nao — v1.1 |
| TikTok | BAIXA | ❌ Zero | Nao — v1.1 |

---

## PARTE 5: SPRINTS SUGERIDOS

### Sprint N — UX/UI Foundation (Independente)
1. Definir novo nome do produto
2. Definir nova paleta de cores + design tokens
3. Definir tipografia
4. Criar componentes base (botoes, cards, inputs, modals, badges)
5. Redesign sidebar (simplificacao + progressive disclosure)
6. Redesign header (busca global, notificacoes)
7. Aplicar nova identidade em todas as paginas

### Sprint O — Landing Page + Auth (Depende Sprint N)
1. Criar landing page publica
2. Paginas complementares (termos, privacidade, pricing)
3. Redesign login/signup com nova identidade
4. Email verification
5. Password recovery
6. SEO meta tags + OG images + sitemap

### Sprint P — Onboarding Completo (Depende Sprints N + Brand Hub v2 F1)
1. Welcome wizard pos-signup (5-7 steps)
2. Checklist de completude persistente
3. Empty states guiados em todas as paginas
4. Tour interativo (opcional)
5. Fix link "/library" quebrado
6. Dashboard redesign com guidance para novos usuarios

### Sprint Q — Production Hardening (Paralelo)
1. Security audit (encryption keys, auth rules, CORS, CSP)
2. Performance audit (Lighthouse, bundle size)
3. Error tracking (Sentry)
4. Monitoring (uptime, alertas)
5. Legal (termos, privacidade, LGPD)
6. Fix todos os bugs criticos dos roadmaps anteriores:
   - Calendar 500 error
   - Asset invisivel
   - LogoLock undefined
   - Settings fake save
   - Temperature/topP desconectados

### Sprint R — Integracoes de Launch (Depende Sprint L parcialmente)
1. Email service (SendGrid/Resend) — para verificacao
2. Stripe — se for SaaS pago
3. Meta Ads — validacao de token ao salvar
4. Health dashboard na Central de Integracoes
5. **Meta Advanced Access (App Review)** — necessario para usuarios terceiros conectarem via OAuth
   - Preparar descricao de casos de uso para cada permissao (ads_read, ads_management, etc.)
   - Gravar screencast mostrando o app usando as permissoes
   - Configurar Privacy Policy URL (obrigatorio)
   - Completar Business Verification (documentos da empresa)
   - Submeter para App Review (~3-5 dias uteis)
   - **BLOQUEIO ATUAL:** Convite de Testador nao funciona de forma confiavel — Advanced Access elimina essa dependencia
   - **Workaround temporario:** Token manual via UI (usuario gera no Graph API Explorer e cola em /integrations)

---

## Dependencias entre Sprints

```
Sprint N (UX/UI Foundation)
    ↓
Sprint O (Landing + Auth) ←── pode comecar em paralelo ao final de N
    ↓
Sprint P (Onboarding) ←── depende de N + Brand Hub v2 Fase 1
    ↓
Sprint Q (Production) ←── pode rodar em paralelo com O e P
    ↓
Sprint R (Integracoes) ←── depende de Sprint L (OAuth) para ads/social
    ↓
🚀 LAUNCH
```

**Estimativa de ordem:**
- Sprint N pode comecar IMEDIATAMENTE (nao depende de nada)
- Sprint Q (security/performance) pode rodar em paralelo desde o inicio
- Sprint O e P dependem de N
- Sprint R depende de decisoes de negocio (pricing model, plataformas alvo)

---

## Nota sobre Roadmaps Existentes

Este roadmap de launch CONSOLIDA e PRIORIZA os fixes dos roadmaps individuais:
- `roadmap-brand-hub-v2.md` → Fase 1 (onboarding unificado) vira parte do Sprint P
- `roadmap-settings-v2.md` → Fase 1 (fix fake saves) vira parte do Sprint Q
- `roadmap-assets-v2.md` → Fase 1 (3 bugs) vira parte do Sprint Q
- `roadmap-calendar-v2.md` → Fase 1 (fix 500) vira parte do Sprint Q
- `roadmap-vault-v2.md` → Fase 1 (ativar Autopilot) pode esperar v1.1
- `roadmap-social-v2.md` → Fase 1 (CSS fix) vira Sprint Q, resto v1.1
- `roadmap-automation-v2.md` → Fase 1 (fix hardcoded) vira Sprint Q, resto v1.1
- `roadmap-settings-v2.md` → Fase 3 (integracoes) vira Sprint R
