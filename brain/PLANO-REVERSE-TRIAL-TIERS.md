# Plano: Reverse Trial + Reestruturação de Tiers — MKTHONEY

> Documento de decisão. Criado em 2026-03-19.
> Status: EM DISCUSSÃO

---

## 0. Princípios Fundacionais do Produto

### 0.1 UX First — Experiência do Usuário como Prioridade Absoluta

O produto já é robusto com muita funcionalidade. O risco agora é virar um "painel dev do Meta Ads Manager" — poderoso mas terrível de usar.

**Regras inegociáveis:**
1. Toda feature acessível em **no máximo 2 cliques** da sidebar
2. **Zero telas intermediárias** que só redirecionam
3. **Rotas consolidadas** — cada feature tem UM endereço, não 3 caminhos diferentes
4. **Nunca depender de query params** para contexto crítico (se perdem em navegação)
5. Wizard steps dentro da **mesma página**, não em páginas separadas
6. O usuário deve **sempre saber onde está** e como voltar
7. **Simplicidade > completude** — esconder complexidade, não expor
8. Ao criar/auditar features, perguntar: "quantos cliques até o usuário fazer o que quer?"
9. **Frameworks internos nunca são expostos ao usuário** — nomes técnicos (C.H.A.P.E.U, etc.) não aparecem na UI. O usuário vê resultados, não metodologia

**Anti-padrões a eliminar:**
- Sidebar → tela → chat → tela real (3+ navegações para uma ação)
- Query params como `?campaignId=...&funnelId=...&mode=...` para contexto
- Mesma feature em rotas diferentes (`/funnels/[id]/design` + `/chat?mode=design` + `/design`)
- Botões que redirecionam para outra feature sem contexto
- Telas que mostram "dados carregando" porque precisam montar contexto de outra rota
- Nomes de frameworks técnicos visíveis ao usuário (ex: "Perfil C.H.A.P.E.U" na UI)

### 0.2 Interconectividade (já estabelecido)

Todos os engines se alimentam e se enriquecem. A Linha de Ouro garante que decisões fluem de um estágio para o próximo. Nenhum engine opera isolado.

### 0.3 Progressão Contínua — Zero Becos Sem Saída

O produto nunca pode deixar o usuário sem saber o que fazer a seguir. Toda ação completa deve gerar 3 elementos:

1. **Celebração** — mostrar o que o usuário conquistou (resultado visual, score, feedback dos conselheiros)
2. **Contexto** — explicar como isso alimentou o sistema ("Sua copy agora está na Linha de Ouro e vai informar o Design")
3. **Próximo passo** — CTA claro e contextual para a próxima ação natural ("Agora gere posts sociais baseados nessa copy →")

**Regras inegociáveis:**
1. **Nenhuma tela termina em silêncio** — após completar qualquer task, há sempre um "próximo passo" visível
2. **O aha moment acontece em < 60 segundos** — o primeiro valor percebido (verdict) deve ser imediato e impactante, não enterrado num chat
3. **Progressão guiada por padrão** — o usuário sempre vê onde está no fluxo e o que vem depois
4. **Cada ação aumenta o investimento emocional** — quanto mais o usuário avança, mais valor acumulado ele vê, mais difícil abandonar
5. **Manter o usuário na plataforma** — após cada entrega, a próxima oportunidade já está visível. Sem dead ends que empurram o usuário para fora

**Mapa de Progressão Natural:**
```
Onboarding (marca)
  ↓ aha: Verdict visual com scores + parecer dos conselheiros
  ↓ next: "Criar primeiro funil"
Funil criado
  ↓ aha: Arquitetura aprovada pelo conselho
  ↓ next: "Gerar copy com os conselheiros"
Copy aprovada
  ↓ aha: Copy na Linha de Ouro
  ↓ next: "Criar posts sociais baseados nessa copy"
Social aprovado
  ↓ aha: X posts prontos para publicar
  ↓ next: "Gerar peças visuais"
Design aprovado
  ↓ aha: Sistema visual completo
  ↓ next: "Revisar tudo no Launch Pad"
Launch Pad completo
  ↓ aha: Campanha pronta para rodar
  ↓ next: "Exportar kit" / "Diagnosticar landing page" / "Criar próximo funil"
```

**Anti-padrões a eliminar:**
- Task completa → tela fica parada sem CTA
- Resultado importante aparece como texto no chat em vez de card/evento visual
- Loading fake que não representa trabalho real
- Dashboard sem ações sugeridas ("e agora?")
- Páginas de features listadas como menu sem guia de quando usar cada uma
- Sidebar como única forma de navegação entre etapas

### 0.4 Aprendizado Contínuo

O sistema deve ficar mais inteligente a cada campanha. RAG indexa decisões, preferências são aprendidas, feedback loops enriquecem futuros outputs.

---

## 1. Contexto: Como funciona hoje

### Fluxo atual
1. Signup → `tier: 'trial'`, `trialExpiresAt: +14 dias`, `credits: 10`
2. Trial dá acesso igual ao Pro (todas as features)
3. Expiração → deveria virar `free`, mas **nunca acontece** (bug no cron)
4. Free tier tem **ZERO features** — se alguém cair nele, vê tela vazia
5. Upgrade via Stripe → webhook muda tier para `starter`/`pro`/`agency`

### Bug crítico encontrado
- Cron job (`/api/cron/trial-check`) busca campo `trialEndsAt`
- Firestore armazena como `trialExpiresAt`
- Resultado: nenhum trial é rebaixado automaticamente. Todos ficam com acesso Pro infinito.
- Localização: `lib/firebase/firestore-server.ts` linha 135

### Desalinhamento pricing vs sistema

| Aspecto | Landing page diz | Sistema real (`TIER_LIMITS`) | **Novo (decidido seção 5)** |
|---|---|---|---|
| Starter — marcas | 5 | 1 | **3** |
| Starter — preço | R$97 | — | **R$147** |
| Pro — marcas | 15 | 3 | **5** |
| Pro — preço | R$297 | — | **R$497** |
| Starter — gerações/mês | 50 | 50 queries (não enforçado) | **100 créditos** |
| Pro — gerações/mês | 200 | 300 queries (não enforçado) | **500 créditos** |
| Agency — marcas | Ilimitadas | 100 | **25** |
| Agency — preço | R$597 | — | **R$997** |

**Ação necessária:** Atualizar landing-pricing.tsx, TIER_LIMITS e TIER_FEATURES para refletir novos valores.

### Créditos: sistema duplo
- Legacy `credits: 10` (fixo no signup, nunca reseta)
- Novo `tierUsage` (definido nos tipos mas nunca incrementado)
- Nenhum enforcement real nos endpoints

---

## 2. Pesquisa de Mercado: O que os dados dizem

### Trial duration
- **7-14 dias** com urgência convertem **71% mais** que 30 dias
- 62% dos SaaS usam 14 dias (padrão do mercado)
- Trials de 7 dias ou menos: **40.4% conversão** (vs 30.6% para 61+ dias)
- Gatilhos por achievement convertem **258% mais** que por calendário

### Modelo Reverse Trial (recomendado para o MKTHONEY)
- Usuário entra com acesso **total** (Pro) por tempo limitado
- Ao expirar, **cai para Free funcional** (não perde a conta, perde features premium)
- Converte 15-25% (vs 2-5% freemium puro)
- Loss aversion: humanos sentem **2x mais dor** ao perder algo que já tinham
- Cases de sucesso: Canva, Toggl (dobrou receita), Dropbox

### Tendência 2025-2026: Créditos + Tier
- 126% de crescimento em modelos de crédito no último ano
- Tier = features (quais abas/ferramentas pode usar)
- Créditos = consumo de IA (gerações, pesquisas, design)
- Predictability > usage-based puro

### Referências de pricing (mercado BR de AI marketing)
- Jasper AI: 7 dias trial, Pro $69/mês (acesso total)
- Copy.ai: Free forever + Pro $49/mês
- Canva: 30 dias reverse trial → Free funcional

Sources:
- https://firstpagesage.com/seo-blog/saas-free-trial-conversion-rate-benchmarks/
- https://ordwaylabs.com/blog/saas-free-trial-length-conversion/
- https://userpilot.com/blog/saas-reverse-trial/
- https://www.withorb.com/blog/reverse-trial-saas
- https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models
- https://flexprice.io/blog/why-ai-companies-have-adopted-usage-based-pricing

---

## 3. Proposta: Reverse Trial de 7 dias

### Fluxo proposto
1. Signup → `tier: 'trial'`, `trialExpiresAt: +7 dias`
2. Trial = acesso Pro completo (todas features, todos conselheiros)
3. Dia 7 sem pagar → **downgrade automático para Free** (não bloqueia, limita)
4. Free = funcional mas limitado (ver seção 5)
5. Upgrade a qualquer momento via Stripe

### Sequência de emails (7 dias)
| Dia | Email | Foco |
|---|---|---|
| 1 | Boas-vindas + onboarding | "Configure sua primeira marca" |
| 3 | Feature spotlight | "Você já experimentou os conselheiros?" |
| 5 | Urgência leve | "Faltam 2 dias do seu acesso Pro" |
| 7 | Expiração | "Seu acesso Pro expirou. Upgrade ou continue no Free." |

### Gatilhos por achievement (fase 2)
- "Você criou seu primeiro funil! No Free você terá apenas 1."
- "Você gerou 3 designs — no Free terá 2/mês."
- Convertem 258% mais que emails baseados em calendário.

---

## 4. Riscos Identificados + Decisões

### RISCO 1: Usuários existentes em trial expirado
- **Situação**: Todos os usuários atuais são amigos/testers, poucos
- **Decisão**: OPÇÃO A — Reset geral, dar +7 dias a todos a partir da data de ativação
- **Implementação**: Script admin que atualiza `trialExpiresAt = now + 7 dias` para todos com `tier == 'trial'`
- **Status**: ✅ DECIDIDO (Opção A)

### RISCO 2: Free tier vazio quebra a experiência
- **Situação**: `TIER_FEATURES['free'] = []` — zero features
- **Decisão**: ✅ DECIDIDO — Free tier funcional com limites diários
- **Definição final do Free tier:**

| Recurso | Acesso | Limite |
|---|---|---|
| Dashboard | ✅ | — |
| Chat (todos conselheiros) | ✅ | **1 consulta por dia** |
| Chat Design (geração de imagem) | ❌ | Bloqueado no Free |
| Marcas | ✅ | 1 marca |
| Funis | ✅ | **1 funil novo por dia** (criação) |
| Settings / Billing | ✅ | — |
| Campaigns | ❌ | Redirect → upgrade |
| Intelligence | ❌ | Redirect → upgrade |
| Deep Research | ❌ | Redirect → upgrade |
| Discovery | ❌ | Redirect → upgrade |
| Social | ❌ | Redirect → upgrade |
| Design Studio | ❌ | Redirect → upgrade |
| Vault | ❌ | Redirect → upgrade |
| Performance | ❌ | Redirect → upgrade |
| Forensics | ❌ | Redirect → upgrade |

**Comportamento de bloqueio:** Toda página sem acesso no tier atual redireciona para página de upgrade (`/settings/billing` ou dedicada) explicando os benefícios de cada plano e por que vale a pena fazer upgrade.

**Campos no Firestore para enforcement:**
- `dailyChatCount` + `lastChatDate` — controla 1 consulta/dia
- `dailyFunnelCount` + `lastFunnelDate` — controla 1 funil/dia

- **Status**: ✅ DECIDIDO

### RISCO 3: Sidebar some tudo no free
- **Situação**: Quase tudo tem `minTier: 'starter'`, free não vê nada
- **Decisão**: ✅ DECIDIDO — Opção C (Híbrido)
  - Features 🟢 liberadas no tier: mostrar normal
  - Features 🟡 Coming Soon (ninguém tem): badge "Em breve" (independente do tier)
  - Features bloqueadas pelo tier (existem mas não tem acesso): 🔒 cadeado discreto + tooltip "Disponível no [Tier] →"
  - Features 🔴 escondidas (mortas/vazias): não aparece na sidebar
- **Status**: ✅ DECIDIDO

### RISCO 4: Desalinhamento pricing page vs sistema
- **Decisão**: ✅ DECIDIDO — Nem a landing nem o código estão corretos. Novos valores definidos na seção 5.
- **Ação**: Atualizar AMBOS (landing-pricing.tsx + tier-system.ts) com os valores da seção 5.
- **Preços novos:** Starter R$147, Pro R$497, Agency R$997
- **Marcas novas:** Starter 3, Pro 5, Agency 25
- **Status**: ✅ DECIDIDO

### RISCO 5: Créditos sem reset mensal
- **Situação**: Signup dá `credits: 10` fixos que nunca resetam. Novo sistema precisa de créditos mensais com reset.
- **Decisão**: ✅ DECIDIDO — B + C
  - **B) Reset no aniversário da assinatura** — cada usuário reseta na data que pagou (webhook do Stripe sabe a data)
  - **C) Sem acúmulo (use-it-or-lose-it)** — créditos não usados zeram no reset. Padrão do mercado (Jasper, AdCreative.ai)
  - Campos: `monthlyCredits` (baseado no tier), `creditsUsed` (reseta no aniversário)
- **Timing**: Sprint 2 (dias 8-14). No lançamento, trial usa créditos fixos do Pro (500).
- **Status**: ✅ DECIDIDO

### RISCO 6: APIs sem tier check
- **Situação**: `withTierCheck()` existe mas quase nenhuma API usa
- **Decisão**: ✅ DECIDIDO — Estender `requireBrandAccess` para retornar tier
  - Em vez de middleware separado (que adiciona 1 Firestore read extra), combinar no `requireBrandAccess` que já roda em toda API
  - `requireBrandAccess` já lê brand doc → adicionar leitura do user doc em `Promise.all` (paralelo, +0-10ms)
  - Retorna `{ userId, brandId, tier, effectiveTier }`
  - Cada route.ts verifica `effectiveTier` contra o tier mínimo da feature
  - Mapa de rota → tier mínimo como constante para referência, não como middleware
- **Timing**: Sprint 2 (dias 8-14). Durante trial todos têm acesso Pro — enforcement só importa no dia 7+.
- **Status**: ✅ DECIDIDO

---

## 5. Features por Tier — ✅ DECIDIDO

> Decisão: 3 tiers pagos (Starter, Pro, Agency) + Enterprise preparado para o futuro.
> Preços atualizados após pesquisa de mercado (2025-2026).

### Free (pós-trial) ✅ DECIDIDO
```
Preço: R$0
Marcas: 1
Funis: 1 novo por dia (criação)
Features: Dashboard, Chat, Brands, Funnels, Settings, Billing
Chat: 1 consulta por dia (todos conselheiros EXCETO Design/imagem)
Design/imagem: BLOQUEADO
Páginas premium: Redirect para página de upgrade
Objetivo: Manter o usuário engajado e sentindo falta do Pro
Enforcement: dailyChatCount + lastChatDate / dailyFunnelCount + lastFunnelDate
```

### Starter (R$147/mês) ✅ DECIDIDO
```
Preço: R$147/mês | R$117/mês (anual, -20%)
Marcas: 3
Funis: 3 ativos simultâneos (sem limite diário)
Créditos IA/mês: 100

Chat: Ilimitado, 3 modos (funnel + copy + social)
Chat Design: Só conversa/prompt — SEM geração de imagem
Campaigns: 1 campanha por marca por dia (3 marcas = até 3 campanhas/dia)
Social: Modo rápido (consome créditos)
Calendário: Básico (view + manual + export CSV)

Design Studio (geração de imagem): BLOQUEADO — Redirect → upgrade
Social modo estratégico (debate + scorecard + A/B): BLOQUEADO
Calendário batch + plano mensal: BLOQUEADO
Aprovações (workflow): BLOQUEADO
Vault: COMING SOON (feature incompleta — ver Auditoria seção 9)
Performance: BLOQUEADO — Redirect → upgrade
Intelligence: BLOQUEADO — Redirect → upgrade
Deep Research: BLOQUEADO — Redirect → upgrade
Discovery: BLOQUEADO — Redirect → upgrade
Predict: BLOQUEADO — Redirect → upgrade
Offer Lab: BLOQUEADO — Redirect → upgrade
Trends Research: BLOQUEADO
Profile Analysis: BLOQUEADO

RAG: 3 docs, 5MB

Objetivo: Freelancers e pequenos negócios — executor de conteúdo
Argumento: "Time de IA gerando copy, posts e campanhas. A alternativa é R$3.000+ com freelancer."

Lógica: Starter = execução (social rápido, campaigns limitadas, chat).
Conselheiro de Design pode ser consultado (chat/prompt) mas não gera imagens.
```

### Pro (R$497/mês) ✅ DECIDIDO
```
Preço: R$497/mês | R$397/mês (anual, -20%)
Marcas: 5
Funis: 10 ativos simultâneos
Créditos IA/mês: 500

TUDO DO STARTER +

Campaigns (Linha de Ouro completa):
  - Sem limite de campanhas por marca
  - Copy Director (propostas + scorecard)
  - Social estratégico (debate 4 conselheiros + scorecard + A/B)
  - Design Studio (geração de imagem)
  - Ads stage (planejamento + geração)
  - Launch Pad (kit + checklist + diário)

Intelligence:
  - Deep Research (dossiê + chat + persona, profundidade standard: 5+2 fontes)
  - Discovery (Keywords Miner + Spy Agent)
  - Intelligence Overview (quando RSS ativo)
  - Offer Lab (wizard + avaliação conselheiros)

Predict (análise CPS + geração de ads)
Miner: Tendência via ValueSERP

Chat:
  - Ilimitado (todos conselheiros)
  - Party Mode (2 créditos por debate)
  - Todos os modos

Calendário completo (batch + plano mensal)
Aprovações (workflow)
Trends Research + Profile Analysis
Carrossel Instagram (formato no Social)

Vault (quando funcional):
  - DNA Wizard + Council Review + Explorer

RAG: 20 docs, 25MB

Objetivo: Negócios estabelecidos, equipes pequenas — execução + estratégia completa
Argumento: "23 especialistas 24/7. Design, intel, pesquisa, ads. Stack equivalente custa R$4.700+/mês."

Lógica: Pro = acesso completo à plataforma. Estratégia + execução + inteligência.
```

### Agency (R$997/mês) ✅ DECIDIDO
```
Preço: R$997/mês | R$797/mês (anual, -20%)
Marcas: 25
Funis: Ilimitados
Créditos IA/mês: 2000

TUDO DO PRO +

Performance (War Room):
  - Métricas reais Meta + Google Ads
  - Cross-channel consolidado
  - AI Advisor (insights Gemini)
  - Anomalias (Sentry Engine)
  - Segmentos (hot/warm/cold)

Personalization:
  - Import de leads Meta
  - Deep-Scan com persona psicográfica
  - Segmentação automática
  - Regras de conteúdo dinâmico

Deep Research profundidade "deep" (10+3 fontes)
Relatórios PDF (Spy Agent, campanhas)

RAG: 100 docs, 100MB

Objetivo: Agências e media buyers gerenciando múltiplos clientes com tráfego pago ativo
Argumento: "25 marcas, métricas reais, personalização com leads. R$997 é o custo de 1 estagiário."

Lógica: Agency = Pro + volume + ads + personalização.
Performance e Personalization dependem de Meta/Google Ads — faz sentido para quem opera ads.
```

### Enterprise (FUTURO — preparado, não lançado)
```
Preço: Sob consulta (ou R$1.997/mês)
Marcas: Custom
Funis: Ilimitados
Créditos IA/mês: Custom

TUDO DO AGENCY +

Attribution (qual campanha gerou a venda)
LTV Analysis (lifetime value do cliente)
Journey Tracking (mapeamento da jornada)
Creative Analysis (performance de criativos)
Predictive avançado (ML real, não Gemini)
A/B Testing nativo
Remarketing/CRM com IA (briefing → execução)
Webhooks de pagamento (ROAS real via Hotmart/Stripe/Kiwify)
Multi-user (equipe com permissões e papéis)
White-label
API access
Dedicated support

Status: NÃO LANÇAR — preparar tipos e gating no código, ativar quando features estiverem prontas.
```

### Tabela comparativa

| | Free | Starter (R$147) | Pro (R$497) | Agency (R$997) | Enterprise (futuro) |
|---|---|---|---|---|---|
| Marcas | 1 | 3 | 5 | 25 | Custom |
| Funis | 1/dia | 3 ativos | 10 ativos | Ilimitados | Ilimitados |
| Créditos/mês | 1 chat/dia | 100 | 500 | 2000 | Custom |
| Chat | 1/dia | Ilimitado (3 modos) | Ilimitado (todos) | Ilimitado (todos) | Ilimitado |
| Social | ❌ | Rápido | Rápido + Estratégico | Rápido + Estratégico | Tudo |
| Calendário | ❌ | Básico | Completo + batch | Completo + batch | Tudo |
| Design (imagem) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Campaigns | ❌ | 1/marca/dia | Ilimitadas | Ilimitadas | Ilimitadas |
| Intelligence | ❌ | ❌ | ✅ | ✅ | ✅ |
| Deep Research | ❌ | ❌ | Standard (5+2) | Deep (10+3) | Deep |
| Discovery | ❌ | ❌ | ✅ | ✅ | ✅ |
| Predict | ❌ | ❌ | ✅ | ✅ | ✅ |
| Offer Lab | ❌ | ❌ | ✅ | ✅ | ✅ |
| Performance | ❌ | ❌ | ❌ | ✅ | ✅ |
| Personalization | ❌ | ❌ | ❌ | ✅ | ✅ |
| PDF Reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| Attribution/LTV | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-user | ❌ | ❌ | ❌ | ❌ | ✅ |
| White-label/API | ❌ | ❌ | ❌ | ❌ | ✅ |
| RAG | ❌ | 3 docs, 5MB | 20 docs, 25MB | 100 docs, 100MB | Custom |

### Desconto anual (20%)

| Tier | Mensal | Anual/mês | Economia/ano |
|---|---|---|---|
| Starter | R$147 | R$117 | R$360 |
| Pro | R$497 | R$397 | R$1.200 |
| Agency | R$997 | R$797 | R$2.400 |

---

## 5.1 Análise de Custos por Tier

> Pesquisa realizada em 2026-03-19. Câmbio: $1 = R$5,70.

### Modelos usados no produto

| Modelo | Variável no código | Custo |
|---|---|---|
| `gemini-2.5-flash` | `DEFAULT_GEMINI_MODEL` | $0.15/1M input, $0.60/1M output |
| `gemini-2.5-pro` | `PRO_GEMINI_MODEL` | $1.25/1M input, $10.00/1M output |
| `gemini-2.0-flash` | Hardcoded (campaign briefing) | $0.10/1M input, $0.40/1M output |
| `gemini-3.1-flash-image-preview` | Design generate (primário) | ~$0.04/imagem |
| `gemini-3-pro-image-preview` | Design generate (fallback) | ~$0.06-0.08/imagem |
| `gemini-2.5-flash-image` | Design generate (fallback 2) | ~$0.02-0.03/imagem |
| `gemini-embedding-001` | RAG/Pinecone | Grátis |

**Nota:** Chat usa 2.5-pro para TODAS as mensagens — é o maior custo variável.

### APIs externas

| API | Custo | Usado em |
|---|---|---|
| Exa Search | ~$0.01/busca | Deep Research |
| Firecrawl | ~$0.005/scrape | Spy, Research, Audience |
| DataForSEO | ~R$0.34/mês shared | Keywords Miner |
| Pinecone | ~R$143-285/mês fixo (shared) | RAG |
| Firebase | ~R$0.57-2.28/user/mês | Storage + reads + writes |

### Custo por tier (BRL)

| Tier | Preço | Custo típico | Margem típica | Custo pior caso | Margem mínima |
|---|---|---|---|---|---|
| **Starter R$147** | R$147 | **R$14** | **90%** | R$40 | **73%** |
| **Pro R$497** | R$497 | **R$36** | **93%** | R$143 | **71%** |
| **Agency R$997** | R$997 | **R$104** | **90%** | R$371 | **63%** |

### Infra fixa mensal (independe de nº de usuários)

| Serviço | Custo/mês (BRL) |
|---|---|
| Vercel Pro | R$114 |
| Pinecone Serverless | R$143-285 |
| Firebase (Blaze) | R$57-171 |
| DataForSEO | R$68 |
| Firecrawl (Growth) | R$108-222 |
| Exa | R$57-143 |
| Domínio/SSL | R$29 |
| **Total fixo** | **R$570-1.030/mês** |

Amortizado: 100 usuários = +R$6-10/user. 1000 usuários = +R$0.60-1/user.

### Otimizações de custo identificadas

| Otimização | Impacto |
|---|---|
| Chat geral → 2.5-flash (Pro só para party/copy/debate) | **Maior impacto** — custo do chat cai ~95% |
| Limitar upscale por tier | Menor volume de imagens 3.x |
| Cache de análises (Design analyze, Predict scoring) | Evita chamadas repetidas ao 2.5-pro |

### Pesquisa de mercado — referência de preços

Para replicar o MKTHONEY com ferramentas separadas, um usuário precisaria de 11+ ferramentas custando **$835+/mês** (R$4.760+).
Com planos intermediários: **R$8.500-14.000/mês**.

Referências de pricing individual:
- Jasper Pro: $69/mês (só copy)
- AdCreative.ai Pro: $249/mês (só ad creative)
- SEMrush Pro: $140/mês (só SEO/intel)
- ClickFunnels: $97-297/mês (só funis)
- Predis.ai Agency: $249/mês (só social)
- HubSpot Marketing Pro: $890/mês (automação)

---

## 6. Plano de Lançamento + Implementação

> Estratégia: Trial de 7 dias dá acesso Pro a todos.
> Isso cria um buffer — temos 7 dias após o lançamento para entregar
> features do Starter antes que alguém precise pagar.

### 6.0 Estado das features no lançamento (Dia 0)

**🟢 LIBERADO (funciona end-to-end):**

| Feature | Tier mínimo |
|---|---|
| Dashboard/Home | Todos |
| Onboarding (3 steps → marca → verdict) | Todos |
| Brands (criar/editar completo) | Todos |
| Chat (geral + todos conselheiros) | Todos (Free=1/dia) |
| Funnels (criar + gerar propostas) | Todos |
| Campaigns (Linha de Ouro) | Starter+ |
| Copy Director | Pro |
| Design Studio (geração de imagem, 1 por vez) | Pro |
| Deep Research (dossiê + chat + persona) | Pro |
| Discovery — Keywords Miner | Pro |
| Discovery — Spy Agent | Pro |
| Offer Lab | Pro |
| Predict (análise CPS + geração de ads) | Pro |
| Chat — Party Mode | Pro |

**🟡 COMING SOON (no tier mas com badge, sem acesso):**

| Feature | Tier | Depende de |
|---|---|---|
| Social (modo rápido — post completo) | Starter | Sprint 1 |
| Social (estratégico — debate + scorecard) | Pro | Sprint 1 + 2 |
| Calendário (básico + export CSV) | Starter | Sprint 1 |
| Calendário (batch + plano mensal) | Pro | Sprint 3 |
| Aprovações (workflow + export) | Pro | Sprint 2 |
| Trends Research | Pro | Sprint 2 |
| Profile Analysis | Pro | Sprint 2 |
| Launch Pad | Pro | Sprint 3 |
| Carrossel Instagram | Pro | Futuro |
| Performance (War Room) | Agency | OAuth Meta/Google |
| Personalization (import + segmentação) | Agency | OAuth Meta |
| PDF Reports | Agency | Futuro |
| Vault | — | Redesign completo |

**🔴 ESCONDER DA UI (não mostrar):**

| Feature | Motivo |
|---|---|
| Intelligence Overview | Dados sempre zerados |
| Page Forensics | Morto (redirect ativo) |
| Upscale (botão no Design) | Handler quebrado |
| Benchmarks/Sparklines (Dashboard) | Dados fake |
| Cross-channel (Performance) | Sem link, depende de OAuth |

### 6.1 Pré-lançamento — Fundação técnica

1. ✅ Definir features/limites de cada tier — **FEITO (seção 5)**
2. Atualizar `TIER_FEATURES` e `TIER_LIMITS` em `tier-system.ts` (novos valores)
3. Atualizar `TIER_FEATURES['free']` com features básicas
4. Atualizar `NAV_GROUPS` em `constants.ts` com `minTier` corretos
5. Sidebar: cadeado ou hide (decisão pendente — Risco 3)
6. Atualizar `landing-pricing.tsx` com novos preços (R$147/R$497/R$997)
7. Corrigir bug do cron (`trialEndsAt` → `trialExpiresAt`)
8. Mudar trial de 14→7 dias no signup
9. Esconder features 🔴 da UI (Intelligence Overview, Forensics, Upscale, Sparklines)
10. Adicionar badges "Em breve" nas features 🟡

### 6.2 Sprint 1 (Dias 1-7 pós-lançamento) — Viabilizar Starter

**Objetivo:** Quando trials expiram no dia 7, Starter tem valor real.

| Tarefa | Esforço | Impacto |
|---|---|---|
| Social → output post completo (hook + corpo + CTA + hashtags) | Médio | **Crítico** — diferencial Starter |
| Calendário → receber posts completos do Social | Baixo | Depende do item acima |
| Calendário → export CSV (download da semana) | Baixo | Saída tangível para o usuário |

### 6.3 Sprint 2 (Dias 8-14) — Enriquecer Pro

| Tarefa | Esforço | Impacto |
|---|---|---|
| Social estratégico → debate + scorecard com output completo | Baixo | Vem "grátis" do Sprint 1 |
| Trends Research → persistir no Firestore | Baixo | Dados deixam de morrer |
| Profile Analysis → persistir no Firestore | Baixo | Dados deixam de morrer |
| Aprovações → export como saída real | Baixo | Fecha o ciclo |

### 6.4 Sprint 3 (Dias 15-21) — Features de volume

| Tarefa | Esforço | Impacto |
|---|---|---|
| Calendário batch + plano mensal → batch generation | Médio | Planning editorial real |
| Trends → botão "Gerar sobre isso" (1 clique) | Baixo | Pesquisa vira ação |
| Profile Analysis → alimentar geração de posts | Médio | Inteligência competitiva real |

### 6.5 Futuro (pós-estabilização)

| Feature | Depende de | Esforço |
|---|---|---|
| Performance (War Room) | Setup OAuth Meta/Google (etapa 1 da seção 9) | Médio (setup) |
| Personalization | OAuth Meta configurado | Baixo (feature pronta) |
| Launch Pad (5 blocos) | Campanhas consolidadas (12.9) | Alto |
| Vault (redesign) | Brand Intelligence Layer | Alto |
| Intelligence Overview | ScoutAgent + RSS cron | Médio |
| Carrossel Instagram | Social completo + Design generate | Médio |
| PDF Reports | Lib client-side (react-pdf) | Baixo |
| Brand Intelligence Layer | Expandir brand-context.ts | Médio |

### 6.6 Reverse Trial — Ativação

| Tarefa | Fase |
|---|---|
| Corrigir bug cron (`trialEndsAt` → `trialExpiresAt`) | Pré-lançamento |
| Mudar trial 14→7 dias no signup | Pré-lançamento |
| Reset trials existentes (script admin) | Pré-lançamento |
| Ajustar emails para sequência de 7 dias | Pré-lançamento |
| Stripe price IDs atualizados para novos valores | Pré-lançamento |
| Créditos mensais por tier + reset automático | Sprint 2 |
| `withTierCheck` nas APIs críticas | Sprint 2 |
| Gatilhos de conversão por achievement | Sprint 3 |

---

## 7. Arquivos Impactados

| Arquivo | Mudança | Fase |
|---|---|---|
| `lib/tier-system.ts` | Redefinir TIER_LIMITS, TIER_FEATURES, TIER_ORDER | 1 |
| `lib/constants.ts` | Ajustar minTier nos NAV_GROUPS | 1 |
| `components/layout/sidebar.tsx` | Cadeado em items locked (se decidido) | 1 |
| `lib/firebase/firestore-server.ts` | Fix bug `trialEndsAt` → `trialExpiresAt` | 2 |
| `app/api/users/route.ts` | Trial de 14→7 dias | 2 |
| `lib/hooks/use-tier.ts` | Default 14→7 dias | 2 |
| `app/api/cron/trial-check/route.ts` | Ajustar emails para 7 dias | 2 |
| `components/landing/landing-pricing.tsx` | Alinhar com limites reais | 2 |
| `lib/stripe/client.ts` | Sem mudança (prices continuam iguais) | — |
| `app/api/payments/webhook/route.ts` | Sem mudança (já funciona) | — |

---

## 8. Perguntas em Aberto

1. ~~**O que entra no Free tier?**~~ ✅ DECIDIDO
2. ~~**Sidebar: cadeado ou esconder?**~~ ✅ DECIDIDO (Híbrido: cadeado + "Em breve" + esconder mortas)
3. ~~**Limites por tier: landing ou código é a verdade?**~~ ✅ DECIDIDO (novos valores na seção 5)
4. ~~**Quantos créditos por tier por mês?**~~ ✅ DECIDIDO (Starter 100, Pro 500, Agency 2000)
5. ~~**Trial de 7 dias é o ideal? Ou 10?**~~ ✅ DECIDIDO — 7 dias + achievement triggers (fase 2). Extensão automática por milestones: ex: criou funil → +2 dias. Combina urgência com recompensa. Convertem 258% mais que calendário puro.
6. ~~**Starter deveria ter acesso a Social/Design?**~~ ✅ DECIDIDO (Social sim, Design geração não)
7. ~~**Free pode gerar algum conteúdo com IA?**~~ ✅ DECIDIDO (1 consulta/dia, 1 funil/dia)
8. ~~**Pro: quais features, limites, créditos?**~~ ✅ DECIDIDO (R$497/mês, 5 marcas, 500 créditos, acesso completo)
9. ~~**Agency: quais features, limites, créditos?**~~ ✅ DECIDIDO (R$997/mês, 25 marcas, 2000 créditos, Pro + Performance + Personalization)
10. ~~**Enterprise: quais features, limites, créditos?**~~ ✅ DECIDIDO (futuro, preparado no código, não lançar)
11. **Performance: qual opção de revenue real usar?** 🔴 PENDENTE (ver Auditoria seção 9)

---

## 9. Auditoria de Features — Estado Real

> Antes de alocar features nos tiers, cada uma foi auditada para verificar
> se realmente funciona. Features incompletas são marcadas COMING SOON.

### Vault (Creative Vault) — 🟡 COMING SOON
- **O que deveria ser:** Repositório inteligente da marca — biblioteca de conteúdo aprovado, Copy DNA (padrões extraídos de copy), media assets, review queue, autopilot de conteúdo
- **O que funciona:** DNA Wizard (extrai padrões de copy), Council Review (4 conselheiros dão nota), Explorer (lista posts/DNA/media)
- **O que NÃO funciona:**
  - Review Queue sempre vazia — Autopilot não está conectado (API `/api/content/autopilot` não existe)
  - Publicação para Instagram/LinkedIn — OAuth não implementado
  - A/B Testing — depende de publicação
  - Config — tab vazia
- **Integração com outros setores:** NENHUMA. Posts do Social não vão para o Vault. Designs não vão para o Vault. Campanhas não alimentam o Vault. DNA no Pinecone existe mas nenhum conselheiro consome.
- **Decisão:** Marcar como COMING SOON em todos os tiers. Não incluir na proposta de valor até que:
  1. Social/Campaigns alimentem o Vault automaticamente
  2. DNA seja consumido pelos conselheiros na geração de copy
  3. Autopilot funcione (gera → review → aprova → agenda)
- **Aba na sidebar:** Mostrar com badge "Em breve" ou esconder até estar pronto

### Intelligence Overview — 🔴 INFRAESTRUTURA PRONTA, DADOS VAZIOS
- **O que é:** Dashboard principal de Intelligence. Mostra KPIs (menções, sentimento, top keyword, KOS), social volume chart (Twitter/Reddit), emoções públicas (pie chart), keyword ranking, sentiment gauge, AI analyst insight.
- **O que funciona:**
  - Keyword Ranking: ✅ funciona se o usuário salvou keywords (via Discovery ou manualmente)
  - Componentes visuais (gráficos, gauges, charts): ✅ renderizam corretamente
  - Hooks de leitura (`useIntelligenceStats`, `useKeywordIntelligence`): ✅ leem do Firestore
- **O que NÃO funciona:**
  - Social Volume (Twitter/Reddit): ❌ sempre vazio — collection `intelligence` nunca é alimentada
  - Public Emotion: ❌ sempre vazio
  - Sentiment Gauge: ❌ sempre 0
  - Analyst Insight: ❌ sem dados para analisar
- **Causa raiz:** Existe um `ScoutAgent` (`lib/agents/scout/scout-agent.ts`) que sabe coletar dados via RSS (Google News, Reddit). MAS não existe nenhum endpoint, cron ou botão que o chame. O agente está 100% desconectado.
- **Dados de keywords vêm de:** `brands/{brandId}/keywords` (manual ou Discovery) + `brands/{brandId}/intelligence` type:keyword (mineradas)

#### Plano para tornar funcional — Opções analisadas

**Opção A — APIs oficiais das plataformas**
- Twitter/X API v2: $100/mês por 10k tweets. Funciona mas caro, limite baixo
- Reddit API: Grátis com rate limits. Viável
- Instagram Graph API: Só acessa posts da própria conta, não busca menções externas
- LinkedIn API: Muito restrita, quase impossível para monitoramento
- **Veredicto:** Caro e com cobertura limitada (Instagram/LinkedIn não permitem busca externa)

**Opção B — RSS + Google News + Reddit RSS (RECOMENDADA fase 1)**
- ScoutAgent já existe e parseia RSS
- Google News RSS: `https://news.google.com/rss/search?q=KEYWORD` — grátis, sem API key
- Reddit RSS: `https://www.reddit.com/search.rss?q=KEYWORD` — grátis
- Google Alerts RSS: usuário cria alertas e cola feed
- **Custo:** Zero
- **Sem violação de ToS** (RSS é público por design)
- **Cobertura:** Google News indexa milhares de fontes (blogs, portais, notícias). Reddit tem discussões reais
- **O que falta construir:**

| Item | Esforço |
|---|---|
| Endpoint `/api/cron/scout-collect` que chama o ScoutAgent | Baixo |
| Config no Vercel Cron (rodar 1x/dia) | Baixo |
| Análise de sentimento/emoção via Gemini nos itens coletados | Médio |
| Tela para usuário definir keywords a monitorar (parcialmente existe no Discovery) | Baixo |
| Deduplicação (não salvar mesmo artigo 2x) | Baixo |

- **Total estimado:** 1 sprint

**Opção C — Scraping via Bright Data / Firecrawl**
- BrightDataAdapter já existe no código, Firecrawl usado no Deep Research
- Bright Data: ~$500+/mês para volume razoável
- Scraping de Twitter viola ToS
- **Veredicto:** Caro e arriscado. Fase 3 se houver demanda Enterprise

### Offer Lab — 🟢 FUNCIONAL (melhorias de UX pendentes) → PRO
- **O que é:** Wizard de engenharia de oferta baseado em Hormozi ($100M Offers) + Russell Brunson (Value Ladder). 4 passos: Promessa → Empilhamento de Valor → Bônus → Escassez/Garantia. Avaliação IA com Brain Council (Dan Kennedy + Russell Brunson).
- **O que funciona:**
  - ✅ Wizard de 4 passos com scoring em tempo real (fórmula Hormozi: 40pts sliders + 60pts conteúdo)
  - ✅ Avaliação IA real com Gemini Pro + Brain Council (Dan Kennedy Copy + Russell Brunson)
  - ✅ Persistência no Firestore (`brands/{brandId}/offers/`)
  - ✅ Lista de ofertas com ativar/arquivar/duplicar
  - ✅ Comparação lado a lado de 2 ofertas
  - ✅ Integração com Campaigns (auto-linka ao salvar com `?campaignId=xxx`)
  - ✅ Copy generation e Social debate consultam oferta ativa
- **O que NÃO funciona:** Nada está quebrado — feature completa
- **Conecta com:** Campaigns (auto-link), Copy generation (usa oferta ativa), Social debate (incorpora dados)
- **Tier:** PRO — estratégia pura, não depende de dados externos
- **Avaliação:** Uma das features mais completas do produto. Production-ready.

#### Melhorias de UX identificadas (backlog)

1. **Sugestões da IA não são acionáveis:**
   - Hoje: IA dá sugestões de melhoria no final, mas o usuário precisa voltar manualmente nos passos e reescrever
   - **Melhoria:** Cada sugestão da IA deveria ser um botão/placeholder clicável. Ao clicar, o texto sugerido é inserido automaticamente no campo correspondente (promessa, bônus, garantia, etc.)
   - Após aplicar sugestões → botão "Reavaliar" para recalcular score

2. **Fluxo de volta para Campanha:**
   - Hoje: Após melhorar a oferta, o usuário precisa manualmente voltar à campanha e regenerar
   - **Melhoria:** Botão "Aplicar e Regenerar Campanha" que salva a oferta atualizada E dispara regeneração da campanha vinculada em um clique

3. **Frontend pobre em relação ao resto do produto:**
   - Wizard visualmente abaixo do padrão do restante do sistema (cards, animações, premium feel)
   - **Melhoria:** Redesign visual seguindo o padrão card-premium do sistema (gradientes, motion, ícones contextuais)

- **Status das melhorias:** 🟡 BACKLOG — não bloqueia lançamento, mas deve ser priorizado para melhorar conversão e experiência

### Predict (Analisador de Conversão + Gerador de Ads) — 🟢 FUNCIONAL (interconexão ausente) → PRO
- **O que é:** Usuário cola texto de marketing (VSL, ad copy, landing page) → IA analisa potencial de conversão com score 0-100 (CPS) → gera 3-5 variações otimizadas de anúncios (Meta Feed, Meta Stories, Google Search).
- **O que funciona:**
  - ✅ Análise de texto real com Gemini (extrai headlines, CTAs, hooks)
  - ✅ Scoring CPS com Brain Council — 6 dimensões, 8+ conselheiros reais (Halbert, Ogilvy, Dan Kennedy, Sugarman, Carlton, Schwartz, Hopkins, Brunson)
  - ✅ Geração de ads com RAG + keywords da marca + brain context + 5 frameworks (Schwartz, Halbert AIDA, Brunson Story, Cialdini, Ogilvy)
  - ✅ Cada variação tem CPS estimado + tone match da marca
  - ✅ Benchmark contra base histórica de predições
  - ✅ Persistência: predictions (90 dias TTL), ads (30 dias TTL)
  - ✅ Guard de créditos (5 créditos por geração de ads)
- **O que NÃO funciona:** Nada está quebrado tecnicamente
- **Tier:** PRO — IA pura, não depende de dados externos
- **Avaliação:** Pipeline text → score → ads é uma das features mais impressionantes do produto

#### Gap crítico: Interconexão pós-geração

Depois que os ads são gerados, o único recurso é **copiar e colar** (botão "Copiar" em cada card). Os ads são salvos no Firestore mas nenhum outro módulo os consome.

**O que NÃO existe e deveria:**

| Ação | Status | Valor |
|---|---|---|
| "Usar no Social" → Abre Social com copy pré-preenchida | ❌ Não existe | Alto |
| "Criar Campanha" → Abre Campaign com ad como base | ❌ Não existe | Alto |
| "Gerar Imagem" → Abre Design Studio com ad como briefing | ❌ Não existe | Alto |
| "Salvar no Vault" → Guarda como asset aprovado | ❌ Não existe | Médio (Vault é Coming Soon) |
| "Agendar" → Vai pro Calendário com data | ❌ Não existe | Médio |
| "Testar A/B" → Cria teste com 2 variações selecionadas | ❌ Não existe | Médio |
| Exportar como PDF/imagem | ❌ Não existe | Baixo |
| Publicar direto no Meta/Google Ads | ❌ Não existe | Baixo (depende de OAuth) |

**Fluxo ideal pós-geração:**
```
Predict gera ads
    ├→ "Usar no Social" → Social com copy pré-preenchida
    ├→ "Criar Campanha" → Campaign com ad como base
    ├→ "Gerar Imagem" → Design Studio com ad como briefing
    ├→ "Salvar no Vault" → Asset aprovado (quando Vault estiver pronto)
    ├→ "Agendar" → Calendário com data
    └→ "Testar A/B" → Teste com 2 variações selecionadas
```

- **Problema:** O usuário gera ads com 8 conselheiros, 5 frameworks, RAG, keywords... e depois copia e cola manualmente no Meta Ads Manager. É o mesmo gap de interconectividade identificado no Vault.
- **Status das melhorias:** 🟡 BACKLOG — feature funciona standalone, mas perde valor sem interconexão

### Deep Research — 🟢 FUNCIONAL → PRO
- **O que é:** Pesquisa de mercado profunda com IA. Tópico → busca fontes reais na web (Exa + Firecrawl) → Gemini sintetiza dossiê completo → chat para refinar → análise de audiência → integração com RAG.
- **O que funciona:**
  - ✅ Busca real via Exa (semantic search) + Firecrawl (web scraping)
  - ✅ Síntese com Gemini + Brain Council (Schwartz awareness + Brunson value ladder)
  - ✅ Chat de refinamento com brand context (corrigido nesta sessão)
  - ✅ Análise de audiência com persona + brand context (corrigido nesta sessão)
  - ✅ Salvar persona como idealClient na marca
  - ✅ Adicionar seções ao RAG/Pinecone
  - ✅ Cache de dossiês (24h), persistência no Firestore
  - ✅ URLs customizadas (Instagram, YouTube, blogs) via Firecrawl
  - ✅ Histórico de dossiês na sidebar
  - ✅ 3 profundidades: quick (3 fontes), standard (5+2 enriquecidas), deep (10+3)
- **Bugs corrigidos nesta sessão:**
  - ✅ 500 error — migrado de client SDK para Admin SDK
  - ✅ Serialização "object of type eb" — toPlainObject()
  - ✅ dossierId vazio — strip id antes de salvar
  - ✅ Brand context injetado no chat, audience e síntese
- **Gaps:**
  - ⚠️ Dossiê não alimenta outros módulos automaticamente (Brand Intelligence Layer resolve)
  - ⚠️ Persona do audience vs idealClient do Personalization — dois caminhos, não se comunicam
  - ⚠️ RAG chunks adicionados mas consumo por conselheiros incerto
- **Tier:** PRO — IA pura, não depende de dados externos
- **Avaliação:** Production-ready. Pipeline Exa → Firecrawl → Gemini → Firestore → RAG é real e robusto.

#### Funcionalidades futuras decididas

**1. Botão "Criar Campanha" a partir do dossiê**
- Pré-preenche formulário de campanha com dados do dossiê: público-alvo, segmento, concorrentes como contexto
- Usuário define oferta, objetivo, etc. — não é geração automática, é pré-preenchimento inteligente
- **Esforço:** Baixo — passar dados de um lugar para outro
- **Prioridade:** Alta — fecha o ciclo research → ação

**2. Botão "Criar Posts Social" a partir do dossiê**
- Abre Social com contexto pré-injetado: "Baseado na tendência X do seu mercado, gere posts que posicionem a marca como autoridade em Y"
- Social gera com conselheiros + brand context + dados do dossiê
- **Esforço:** Baixo-Médio — integração entre Deep Research e Social, não módulo novo
- **Prioridade:** Alta — aproveita módulo existente

**Descartado:** "Criar Posts de Blog" — não existe módulo de blog no sistema, viraria copy-paste. O Chat já serve para sugerir tópicos se o usuário pedir.

- **Status das funcionalidades futuras:** 🟡 BACKLOG — priorizar após reverse trial

### Discovery — 🟢 FUNCIONAL (interconexão ausente) → PRO
- **O que é:** Hub de descoberta com Keywords Miner (descobre o que as pessoas buscam) + Spy Agent (analisa sites de concorrentes).
- **Keywords Miner funciona:**
  - ✅ Google Autocomplete real (~50 sugestões em português, sem API key)
  - ✅ Intent classification via Gemini (transactional/commercial/informational/navigational)
  - ✅ DataForSEO para volume/dificuldade reais (se configurado), fallback Gemini
  - ✅ KOS (Keyword Opportunity Score): `(Volume × 0.4) + (Relevance × 0.4) - (Difficulty × 0.2)`
  - ✅ Keywords correlacionadas (LSI, longtail, FAQ) via Gemini
  - ✅ Salvar keywords na marca (`brands/{brandId}/keywords`, max 100)
  - ✅ 1 crédito por mineração
- **Spy Agent funciona:**
  - ✅ Scraping real (respeita robots.txt, fallback Jina/Readability)
  - ✅ Tech Stack por heurística: CMS, Analytics, Marketing, Pagamentos, Infra (~60% accuracy)
  - ✅ Análise estratégica via Gemini Pro: forças/fraquezas, emular/evitar, insights acionáveis
  - ✅ Design System: cores, tipografia, espaçamento detectados
  - ✅ Salvar como estudo de caso no Firestore
  - ✅ 2 créditos por análise
- **Assets Panel:** ✅ Agrega resultados de 4 collections (audience scans, autopsies, offers, keywords)
- **O que NÃO funciona:**
  - ❌ "Send to MKTHONEY Copy" — botão existe mas só toast "coming soon"
  - ❌ "Aplicar Insights" no funil — botão existe mas não implementado
  - ❌ Tracking recorrente de concorrente — análise one-shot, sem monitoramento
  - ❌ DataForSEO provavelmente não configurado — fallback Gemini (estimativas)
- **Conecta com:** Keywords → Intelligence Overview (ranking). Keywords → RAG. Spy → nada (insights não fluem).
- **Tier:** PRO — IA pura, não depende de ads
- **Avaliação:** 70% funcional. Keywords sólido. Spy Agent bom para análise pontual. Gap: dados não fluem + botões placeholder.
- **Nota:** Discussão detalhada realizada (sessão 2026-03-19)

#### Decisões — Spy Agent Upgrade

Briefing original propunha 5 features (discover, apply-insight, scan-full, monitor, PDF report). Após análise honesta, decisões:

| Feature | Decisão | Justificativa |
|---|---|---|
| P1 — Descoberta de concorrentes por nicho | ✅ MANTER | Busca Firecrawl + **filtro/ranqueamento via Gemini** usando contexto da marca (vertical, oferta, público). Retorna score de relevância e classifica: concorrente direto, indireto, referência. |
| P2 — Aplicar Insight | ✅ MANTER (redesenhado) | NÃO fazer 3 injeções hardcoded com redirect. Implementar via **Brand Intelligence Layer** — Spy salva insights padronizados na marca, qualquer módulo (copy, design, campanhas, offer lab) consulta automaticamente. |
| P3 — Scan de funil completo | ✅ MANTER (simplificado) | NÃO fazer crawl de 20 páginas. Scan da página principal + detectar links de saída (checkout, obrigado, upsell, WhatsApp) + apresentar como "páginas do funil detectadas". Usuário clica para scan individual. |
| P4 — Monitor de mudanças | ❌ ELIMINADO | Stack errada (SQL vs Firestore), custo operacional alto (300 scrapes/dia), cron Vercel limitado, falsos positivos por hash, ROI baixo. |
| P5 — Relatório PDF | ⏳ ADIADO | Só implementar quando tier Agency existir. Usar lib client-side (react-pdf/html2pdf.js), não Puppeteer serverless. Conteúdo gerado por Gemini, não template fixo. |

#### Decisões — Keywords Miner Upgrade

Briefing original propunha 4 melhorias. Após análise, decisões:

| Feature | Decisão | Justificativa |
|---|---|---|
| M1 — Clustering semântico | ✅ MANTER (melhorado) | Agrupar keywords por **estágio de consciência do Schwartz** (inconsciente → mais consciente), não só por intenção genérica. Já temos Schwartz nos brains do sistema — alinha Miner com a filosofia do produto. Complexidade baixa. |
| M2 — Export CSV | ✅ ADICIONAR | Não estava no briefing original mas é essencial para uso externo (ads, SEO, social). Botão de download com termo, volume, dificuldade, intent, KOS. Muito baixa complexidade, alto valor. |
| M3 — Cruzamento com Spy Agent | ✅ MANTER (simplificado) | NÃO fazer "ver quem ranqueia" por keyword individual (50 chamadas Firecrawl = custo alto). Cruzar no nível do **cluster** — botão "Descobrir concorrentes nesse ângulo" usa a P1 do Spy com o cluster como contexto. Uma chamada, não 50. |
| M4 — Predição de tendência | ✅ MANTER (Pro-only) | Usar **ValueSERP** ($9/mês, não SerpAPI $50). Cache de 7 dias obrigatório. Chamar de **"Tendência"**, não "Predição" (é Gemini extrapolando 12 meses, não ML real). Limite: 20 consultas/mês por marca. Pro-only. |
| M5 — Gerar Tópico / Enviar ao conselheiro | ⏳ BAIXA PRIORIDADE | Depende do Brand Intelligence Layer. Com o Layer, conselheiros já recebem keywords automaticamente — botão vira quase redundante. Implementar por último. |

#### Decisão — Assets Panel

**Status:** Será **deprecado** quando o Brand Intelligence Layer for implementado.
- Hoje é um agregador passivo — mostra que dados existem mas não faz nada com eles
- Está na página errada (Discovery) mas agrega dados de Deep Research e Offer Lab
- Sem relação entre assets, sem ações, metadata bruta em JSON
- O Brand Intelligence Layer substitui o propósito: lugar centralizado onde todos os dados vivem e cada módulo consulta

**Decisão adicional — duplo propósito do Miner:**
O Miner serve para **uso externo** (ads, SEO, social — por isso o export) E para **uso interno** (alimentar conselheiros, campanhas, copy via Brand Intelligence Layer). Ambos são prioritários.

#### Priorização real (Discovery como um todo)
1. **Brand Intelligence Layer** (fundação — habilita Spy P2, Miner interno, e interconexão de todos os módulos)
2. **Miner: Clustering com Schwartz** (M1 — organiza para uso externo + alimenta contexto interno)
3. **Miner: Export CSV** (M2 — valor imediato para uso externo)
4. **Spy: Descoberta de concorrentes** (P1 com Gemini filtering + contexto da marca)
5. **Miner: Cruzamento com Spy via clusters** (M3 — conecta os dois módulos)
6. **Spy: Aplicar Insight** (P2 via Brand Intelligence Layer, automático)
7. **Spy: Scan simplificado** (P3 — links de saída, sem crawl)
8. **Miner: Tendência via ValueSERP** (M4 — Pro-only, $9/mês)
9. Miner: Enviar ao conselheiro (M5 — quando Layer estiver pronto)
10. Spy: PDF report (futuro, tier Agency)

### Social — 🟢 FUNCIONAL (entrega incompleta + pesquisas decorativas)

- **O que é:** Gerador de hooks (ganchos de abertura) para redes sociais com debate de 4 conselheiros e scorecard calibrado.
- **O que funciona:**
  - ✅ Wizard de 4 etapas (config → geração → debate → scorecard)
  - ✅ 5 hooks com estilo, raciocínio e framework dos conselheiros
  - ✅ Debate com 4 especialistas (Rachel Karten, Lia Haberman, Nikita Beer, Justin Welsh)
  - ✅ Scorecard 0-100 em 4 dimensões + red flags + gold standards
  - ✅ Variações A/B (3 por hook)
  - ✅ Case studies com Pinecone
  - ✅ Integração Golden Thread (campanha)
  - ✅ Envio para calendário editorial
  - ✅ Trend Research (Exa Search + Firecrawl + Gemini → 5-8 tendências)
  - ✅ Profile Analysis (Firecrawl + Gemini → forças/fraquezas de concorrente)
- **O que NÃO funciona:**
  - ❌ Gera só hooks, não post completo (sem corpo, CTA, hashtags)
  - ❌ Trends e Profile Analysis são **decorativos** — resultados não alimentam geração de hooks, não persistem, morrem no useState
  - ❌ Nenhuma conexão com Design Studio (hook aprovado não vira briefing visual)
  - ❌ Não usa keywords da marca (Miner), nem insights do Spy, nem pesquisa de mercado, nem personas
  - ❌ Plano de conteúdo gerado no Step 1 (pilares + calendário sugerido) não alimenta o calendário editorial
  - ❌ Sem publicação real em nenhuma rede social
  - ❌ Fluxo de 4 etapas é pesado demais para conteúdo orgânico do dia-a-dia
- **Conecta com:** Campanha (Golden Thread) ✅, Calendário ✅, Offer Lab (debate) ✅. Não conecta com: Design, Keywords, Spy, Deep Research, Personalization.

#### Decisões — Social Upgrade

| Melhoria | Decisão | Justificativa |
|---|---|---|
| Dois modos de uso | ✅ IMPLEMENTAR | **Modo Rápido** (1 clique → post completo para orgânico diário) + **Modo Estratégico** (4 etapas com debate para campanhas de conversão). Resolve problema de volume. |
| Post completo | ✅ IMPLEMENTAR | Output deve ser: hook + corpo + CTA + hashtags + sugestão de formato visual. Usuário sai com conteúdo **pronto para postar**. |
| Plano → Calendário | ✅ IMPLEMENTAR | Plano de conteúdo gerado vira batch de posts no calendário. Ex: "4x por semana, 1 mês" = 16 posts gerados + agendados como draft. |
| Conexão com Design | ✅ IMPLEMENTAR | Hook aprovado gera briefing automático para Design Studio (formato, texto, tom, paleta da marca). |
| Keywords nos posts | ✅ IMPLEMENTAR (depende Brand Intelligence Layer) | Keywords da marca alimentam tópicos, texto e hashtags. |
| Trends → sugerir tópicos | ✅ IMPLEMENTAR | Trend pesquisada deve oferecer "Gerar hooks sobre isso?" em 1 clique. Resultado deve persistir na marca. |
| Profile Analysis → alimentar geração | ✅ IMPLEMENTAR | Análise de concorrente deve ir como contexto para o Gemini na geração de hooks (contra-atacar pontos fracos, replicar pontos fortes). |
| Trends + Keywords cruzamento | ✅ IMPLEMENTAR (depende Brand Intelligence Layer) | Tendência em alta → keywords associadas. Keywords de alto KOS → verificar se é tendência. |
| Persistência de pesquisas | ✅ IMPLEMENTAR | Trends e Profile Analysis salvos no Firestore/Brand Intelligence Layer, não só useState. |

#### Priorização Social
1. Post completo (hook + corpo + CTA + hashtags) — valor imediato
2. Dois modos (rápido + estratégico) — resolve volume
3. Trends sugerir tópicos + persistência — pesquisa vira ação
4. Profile Analysis alimentar geração — inteligência competitiva real
5. Plano → batch generation → calendário — planejamento editorial completo
6. Conexão com Design — elimina trabalho manual
7. Keywords + Trends cruzamento (depende Brand Intelligence Layer)

### Calendário Editorial + Aprovações — 🟢 FUNCIONAL (sem saída + conteúdo incompleto)

- **O que é:** Calendário editorial com views semanal/mensal, drag-and-drop, status workflow, e dashboard de aprovações.
- **O que funciona:**
  - ✅ CRUD de itens no calendário
  - ✅ Drag-and-drop para reordenar
  - ✅ Status workflow: Draft → Pending Review → Approved → Scheduled → Published
  - ✅ Recebe hooks do Social Wizard como drafts
  - ✅ Aprovações com state machine, rejeição com comentário obrigatório
  - ✅ Histórico de aprovação imutável (subcollection)
  - ✅ Templates reutilizáveis
  - ✅ Criação manual de itens
- **O que NÃO funciona:**
  - ❌ Conteúdo que chega é incompleto (só hooks, não posts completos)
  - ❌ Sem export (CSV, PDF — nada sai do calendário)
  - ❌ Sem integração com ferramentas externas (Buffer, mLabs, Later)
  - ❌ Sem publicação direta em redes sociais
  - ❌ "Gerar Semana" com lógica básica
  - ❌ Não alimenta Design Studio (post aprovado deveria virar briefing visual)
  - ❌ Não alimenta Brand Intelligence Layer (histórico de conteúdo produzido)

#### Decisões — Calendário + Aprovações

**Posicionamento na UI:**
- Calendário e Aprovações devem ser **abas dentro de `/social`**, não páginas separadas
- Tabs: **Criar | Calendário | Aprovações**
- Elimina navegação desnecessária — fluxo natural: gerar → organizar → revisar → exportar

**De quem recebe:**

| Fonte | O que recebe |
|---|---|
| Social (batch generation) | Posts completos do plano mensal (decisão aprovada) |
| Social (modo rápido) | Post completo individual |
| Manual | Usuário cria direto no calendário |
| Futuro: Brand Intelligence Layer | Datas relevantes do nicho, sugestões de tendências, keywords sazonais |

**Para quem alimenta:**

| Destino | O que envia |
|---|---|
| Design Studio | Post aprovado → briefing visual automático |
| Brand Intelligence Layer | Histórico de conteúdo produzido (evita repetição, conselheiros sabem o que já foi feito) |
| Export (externo) | CSV/PDF com posts da semana prontos para Buffer/mLabs/Instagram |
| Futuro: Métricas | Post publicado → usuário marca engajamento → alimenta case studies |

**Saída do calendário:**

| Opção | Decisão | Justificativa |
|---|---|---|
| A — Export CSV/PDF | ✅ FASE 1 | Valor imediato, muito baixa complexidade. Usuário leva para qualquer ferramenta. |
| B — Integração Buffer/mLabs | ⏳ FUTURO | Alta complexidade (cada ferramenta = 1 integração). Só quando fizer sentido comercial. |
| C — Publicação direta nas redes | ❌ NUNCA | Custo de manutenção das APIs sociais não justifica. Deixar para Buffer/mLabs. |

**Tiers:**

| Componente | Tier | Justificativa |
|---|---|---|
| Social modo rápido (1 post/dia) | Starter | Mínimo útil, atrai upgrade |
| Social modo estratégico (debate + scorecard + A/B) | Pro | Diferencial premium |
| Calendário (view + manual + export CSV) | Starter | Baixa complexidade, alto valor |
| Calendário (batch generation + plano mensal) | Pro | Volume é valor Pro |
| Aprovações (workflow completo) | Pro | Faz sentido para quem produz volume |
| Trends Research | Pro | Custa créditos (Exa + Firecrawl + Gemini) |
| Profile Analysis | Pro | Custa créditos (scraping + Gemini) |

---

### 🔴 P0 — Brands: Reestruturação Completa (MAIOR IMPACTO NO USUÁRIO)

#### Problemas críticos encontrados

**1. Navegação caótica — usuário de barata tonta:**
- 4+ caminhos diferentes para editar dados da marca, nenhum completo
- Wizard de criação (7 steps) vs página de edição (3 steps cortados) vs Brand Hub (tab escondida) vs Assets (ícone imperceptível)
- Checklist cobra "Complete o Brand Hub" mas não linka para o Brand Hub
- Usuário não consegue encontrar onde editar cores, fontes, logo após a criação

**2. Bug: inputs de cores e tipografia não renderizavam no Brand Hub:**
- O componente `brand-kit-form.tsx` tinha os dados no state mas os inputs não existiam na UI
- Checklist cobrava "Paleta de cores" e "Tipografia" mas era impossível preencher
- **FIX APLICADO:** Inputs de cores (color picker + hex + preview), tipografia (15 fontes + preview ao vivo) e estilo visual agora renderizam

**3. Dropdowns limitados:**
- Vertical: só 9 opções (SaaS, Infoprodutos, E-commerce, Serviços, Consultoria, Agência, Educação, Saúde, Outro)
- Faltam: Restaurante, Moda, Fitness, Beleza, Imobiliário, Finanças, Advocacia, Pets, Personal Brand, Mídia, etc.
- Tipo de oferta: só 6 opções, sem "Outro" com texto livre
- Onboarding nem tem "Outro" no vertical
- **O sistema NÃO muda comportamento baseado no vertical** — é só texto no prompt. Qualquer valor funciona.

**4. Features mortas/órfãs na brand detail:**
- **Projetos:** CRUD funciona mas zero integração (funis/campanhas não linkam). Botão "Abrir" não tem handler.
- **Voice Profile Editor:** componente existe mas não está embeddado em nenhuma página. Inacessível.
- **Tab Contexto RAG:** duplica a página `/brands/{id}/assets` (mesmos dados, mesma funcionalidade)

**5. Assets/RAG escondido:**
- Ícone quase imperceptível para acessar documentos da marca
- Não existe como step no onboarding/wizard
- `isApprovedForAI` default = false (deveria ser true)
- Só o Chat consome os assets (Social, Copy, Design, Offer Lab ignoram)

**6. Checklist psicologicamente negativo:**
- 45% é o máximo para quem completou TODO o wizard normalmente (steps opcionais pulados)
- Assets RAG como critério de completude é injusto (feature avançada, escondida)
- Alerta amarelo permanente dá sensação de "marca quebrada"

**7. Audiência/Awareness mal aproveitados:**
- Nível de consciência (Schwartz) preenchido no Step 2 mas só Deep Research usa
- Objeções preenchidas mas só Deep Research usa
- Chat, Social, Copy, Design, Offer Lab ignoram esses dados estratégicos

#### Decisões aprovadas

**Página única de edição (substitui tudo):**

| Seção | Campos | Status |
|---|---|---|
| Identidade | Nome, vertical (autocomplete + texto livre), posicionamento, tom | Colapsável |
| Audiência | Quem, dor, awareness (3 perguntas simples → classificação automática), objeções (com sugestões por nicho) | Colapsável |
| Oferta | O que vende, ticket, tipo (chips + "outro"), diferencial | Colapsável |
| Visual | Cores (picker + hex + preview + paletas sugeridas por nicho), estilo visual | Colapsável |
| Tipografia | Fonte headline, fonte body, fallback (catálogo visual com preview) | Colapsável |
| Logo | Upload, variantes, lock | Colapsável |
| Voz | Tom, vocabulário preferido, termos proibidos, frases exemplo (HOJE ÓRFÃO — integrar) | Colapsável |
| Personagens | Ambassador, founder, mascot, etc. | Colapsável |
| IA | Preset, temperatura, topP | Colapsável |
| Documentos | Upload PDFs/URLs inline, lista de assets, aprovação IA (default=true) | Colapsável |

**Onboarding/Wizard melhorado:**
- Steps 1-3: obrigatórios (identidade, audiência, oferta)
- Step 4: Visual + Logo (opcional, pulável)
- Step 5: Documentos/Assets (opcional, pulável) — NOVO
- Step 6: Confirmação
- AI config removido do wizard (default "equilibrado", editar depois)

**Dropdowns:**
- Vertical: autocomplete com sugestões + texto livre (qualquer valor aceito pelo sistema)
- Tipo de oferta: chips comuns + "Outro" com texto livre
- Igualar onboarding e wizard (hoje divergem)

**Awareness no onboarding:**
- Substituir select técnico por 3 perguntas simples:
  - "Seu público sabe que tem o problema?" → Sim/Não
  - "Seu público já procura soluções?" → Sim/Não
  - "Seu público conhece seu produto?" → Sim/Não
- 3 respostas = awareness classificado automaticamente sem saber Schwartz

**Objeções com sugestões por nicho:**
- Gemini gera 5-8 objeções comuns do vertical → usuário marca as que aplicam

**Eliminar:**
- Página `/brands/{id}/assets` separada → fica na seção "Documentos" da página única
- Tab "Contexto RAG" → fica na seção "Documentos"
- Tab "Visão Geral" read-only → página única já edita tudo
- Projetos → esconder até ter integração real

**Checklist:**
- Mostrar só se < 45% (dados obrigatórios incompletos)
- Cada item é link clicável para a seção correspondente na página única
- Assets RAG removido como critério de completude
- `isApprovedForAI` default = true

**Cores — duas personas:**
- Quem já tem marca: color picker + input hex + preview
- Quem está criando: paletas sugeridas por nicho (SaaS=azul/roxo, Saúde=verde/branco, Moda=preto/dourado)
- Futuro: extração automática de paleta da URL do site

**Fontes — melhorias futuras:**
- Catálogo visual (ver como fica, não só nome)
- Sugestão por estilo visual (minimalist→Inter, luxury→Playfair)
- Hoje só Design consome fontes no prompt — Brand Intelligence Layer deve expandir

**Onde fontes e cores são usadas hoje vs deveria:**

| Módulo | Usa hoje | Deveria usar |
|---|---|---|
| Design (imagens) | ✅ | ✅ |
| Copy/Campanhas | ❌ | ✅ (Brand Intelligence Layer) |
| Social | ❌ | ✅ (Brand Intelligence Layer) |
| Landing Pages | ❌ | ✅ (renderizar com fontes/cores da marca) |
| Chat | ✅ Só display | ✅ (usar para recomendar) |

---

### Features Enterprise — PENDENTE DISCUSSÃO

As seguintes features foram alocadas como candidatas ao tier Enterprise mas ainda não foram auditadas em detalhe:

| Feature | Status | Notas |
|---|---|---|
| Attribution | ⏳ Pendente | Atribuição de conversão — qual campanha gerou a venda |
| LTV | ⏳ Pendente | Lifetime value do cliente |
| Journey | ⏳ Pendente | Mapeamento da jornada do cliente |
| Creative | ⏳ Pendente | Análise de performance de criativos |
| Predictive (avançado) | ⏳ Pendente | Análise preditiva avançada (diferente do Predict básico) |
| A/B Testing | ⏳ Pendente | Testes A/B de copy/design/oferta |

**Decisão:** Auditar cada feature individualmente numa próxima sessão antes de formalizar o tier Enterprise.

---

### Personalization — 🟢 FUNCIONAL (última milha ausente) → ENTERPRISE (COMING SOON no Pro)
- **O que é:** Importa leads reais do Meta → IA analisa e cria persona psicográfica → cria regras de conteúdo dinâmico por segmento (hot/warm/cold).
- **O que funciona:**
  - ✅ Import de leads do Meta (real, paginação, até 500/formulário)
  - ✅ Deep-Scan com Gemini Flash (persona: demographics, dores, desejos, objeções, sofisticação 1-5)
  - ✅ Propensity Engine (scoring real: page_view=0.1, click=0.2, form_submit=0.5, purchase=1.0)
  - ✅ Segmentação hot/warm/cold automática
  - ✅ Editor de regras dinâmicas (CRUD completo)
  - ✅ Resolver de regras em runtime
  - ✅ Conexão com Offer Lab (dropdown de ofertas no editor)
- **O que NÃO funciona / incerto:**
  - ⚠️ Aplicação das regras no funil — Resolver retorna variações mas nenhum funil/landing consome. Middleware marcado como dead code (DT-07)
  - ⚠️ VSL ID — campo existe mas sem entrega de vídeo confirmada
  - ⚠️ Depende 100% de Meta Ads configurado (tokens com `leads_retrieval`)
- **Tier:** Import de leads + regras dinâmicas → **Enterprise**. Criação manual de persona → **Pro** (via idealClient existente ou Deep Research audience)

#### Gap crítico: Dados da persona não fluem para o sistema

O Deep-Scan gera dados valiosos (persona, dores, desejos, objeções, segmentos) mas **nenhum outro módulo consulta**:

| Módulo | Deveria usar persona? | Usa hoje? |
|---|---|---|
| Copy Director | Sim — ajustar tom, gatilhos, objeções | ❌ |
| Social | Sim — posts por segmento hot/warm/cold | ❌ |
| Predict/Ads | Sim — variações por persona | ❌ |
| Chat (Consultar MKTHONEY) | Sim — responder com base na persona real | ❌ |
| Offer Lab | Sim — sugerir bônus que resolvem objeções reais | ❌ |
| Deep Research | Sim — cruzar persona com dados de mercado | ❌ |
| Funil/Landing | Sim — headline/VSL/oferta dinâmicos | ❌ (dead code) |

#### Feature futura: "Criar Campanha de Remarketing / CRM"

A partir dos segmentos e persona do Personalization, o usuário deveria poder clicar um botão e gerar:

**Remarketing (ads):**
- Pega segmento (ex: "warm leads com objeção de preço")
- Gera copy de ads específica para esse segmento (Predict + persona)
- Sugere orçamento e formato (Meta Retargeting, Google Display)
- Monta briefing completo da campanha

**CRM (email/nutrição):**
- Pega segmento + nível de sofisticação
- Gera sequência de emails ajustada:
  - **Cold**: educar, gerar consciência (conteúdo, artigos)
  - **Warm**: aprofundar, prova social (cases, depoimentos)
  - **Hot**: converter, urgência (oferta, escassez, garantia)
- Sugere cadência (intervalos entre emails)
- Tom e gatilhos baseados na persona real

**O que precisaria construir:**

| Funcionalidade | Existe? | Esforço |
|---|---|---|
| Botão "Criar Campanha de Remarketing" na UI | ❌ | Baixo |
| Template de campanha por segmento | ❌ | Médio |
| Geração de copy por segmento (adaptar Predict) | ✅ Parcial | Baixo |
| Sequência de emails de nutrição | ❌ | Médio-Alto |
| Editor visual de fluxo de emails | ❌ | Alto |
| Integração email (Resend existe para transacional) | ✅ Parcial | Médio |
| Audience sync para Meta Custom Audiences | ❌ | Médio |

**Dois caminhos:**

**Caminho A — MVP (gera briefing, não executa) — RECOMENDADO fase 1**
- Botão → IA gera briefing completo: segmento alvo, persona, copy sugerida, formato, orçamento
- CRM: sequência de 3-5 emails com subject + body gerados
- Usuário copia e executa no Meta Ads Manager / ferramenta de email
- **Esforço:** 1 sprint. **Valor:** Alto — plano acionável gerado por IA

**Caminho B — Execução integrada (gera e executa) — fase futura**
- Remarketing: sobe Custom Audience para Meta + cria campanha via API
- CRM: dispara sequência via Resend ou integração
- **Esforço:** 3-4 sprints (depende de OAuth Meta). **Valor:** Muito alto

> **Sugestão:** Caminho A agora como diferencial Enterprise. Nenhum concorrente (Jasper, Copy.ai) oferece "dos leads reais até campanha de remarketing com IA". Caminho B quando OAuth estiver pronto.
>
> **Status:** 🔴 PENDENTE — feature futura, priorizar após reverse trial

---

## 10. Brand Intelligence Layer — Solução para Interconexão

> Padrão identificado: Vault, Predict, Offer Lab, Deep Research, Personalization
> geram dados valiosos que morrem isolados. Cada feature funciona bem sozinha
> mas não conversa com as outras.

### Solução: Camada central que todos consultam

Ao invés de criar conexão ponto-a-ponto entre cada feature (dezenas de conexões), expandir o `brand-context.ts` existente para carregar tudo de um lugar:

```
Brand Intelligence Layer (1 lugar, todos consultam)
├── Persona ativa (do Deep-Scan ou do idealClient)
│   ├── dores, desejos, objeções, sofisticação
│   └── segmentos hot/warm/cold
├── Oferta ativa (do Offer Lab)
│   ├── promessa, preço, valor percebido
│   └── bônus, garantia, escassez
├── DNA de copy (do Vault, quando funcionar)
│   └── padrões que performaram
├── Keywords (do Discovery/Intelligence)
│   └── oportunidades rankeadas por KOS
├── Research insights (do Deep Research)
│   └── tendências, ameaças, recomendações
└── Brand base (já existe no brand-context.ts)
    └── nome, vertical, tom, público, oferta, idealClient
```

### Impacto: cada engine fica mais inteligente

| Engine | Hoje | Com Brand Intelligence Layer |
|---|---|---|
| Copy Director | Gera copy genérica | "Seu público hot tem objeção X, use gatilho Y" |
| Social | Posts sem contexto de persona | Posts ajustados por segmento |
| Predict/Ads | Ads genéricos | Variações específicas por persona |
| Chat | Não conhece persona nem oferta | Responde com base em dados reais |
| Offer Lab | Bônus sem contexto | Sugere bônus que resolvem objeções reais da persona |
| Deep Research | Análise sem cruzar com leads | Cruza persona com dados de mercado |

### Implementação incremental

| Etapa | O que | Esforço |
|---|---|---|
| 1 | Expandir `brand-context.ts` para carregar persona + oferta ativa + keywords | Baixo (1 dia) |
| 2 | Injetar nos prompts de Copy/Social/Ads/Chat (mesmo padrão do Deep Research) | Médio (2-3 dias) |
| 3 | Injetar no Offer Lab (sugerir bônus baseados nas objeções da persona) | Baixo (1 dia) |
| 4 | Injetar no Predict (gerar ads específicos por segmento) | Baixo (1 dia) |

> **Recomendação:** Fazer etapa 1 junto com o reverse trial (1 dia de trabalho).
> O `brand-context.ts` já existe e já é usado pelo Deep Research e Chat.
> Expandir = todos os engines que consultam brand context ganham persona + oferta automaticamente.
>
> **Decisão:** 🔴 PENDENTE — aguardando priorização do owner

#### Sugestão técnica

> **Fase 1: Opção B (RSS)** — custo zero, ScoutAgent 70% pronto, 1 sprint para conectar.
> Fluxo: Usuário salva keywords → Cron diário chama ScoutAgent → busca Google News + Reddit RSS → Gemini analisa sentimento/emoção → salva no Firestore → Overview renderiza dados reais.
>
> **Fase 2: Opção A (APIs pagas)** — quando houver demanda Enterprise, adicionar Twitter API e Reddit API oficial como fontes extras.
>
> **Status:** 🔴 PENDENTE — aguardando decisão do owner e priorização vs outras features

### Performance (War Room) — 🟢 FUNCIONAL (com ressalvas) → ENTERPRISE ONLY
- **O que é:** Dashboard tático de métricas de anúncios. ROAS, Spend, CAC, Revenue em tempo real. Cross-channel (Meta + Google consolidado). Segmentos hot/warm/cold. AI Advisor com Gemini.
- **O que funciona:**
  - Busca real de métricas do Meta Graph API (v21.0) e Google Ads API (v18)
  - Cache inteligente no Firestore (15 min, fallback para cache antigo se API falha)
  - Validação de tokens Meta/Google
  - Diagnóstico quando dados estão ausentes (status de tokens, permissões, erros)
  - Cross-channel: consolida Meta + Google em visão unificada (ROAS blendado, CPA, distribuição de spend)
  - Segmentos: breakdown por hot/warm/cold leads
  - AI Advisor: Gemini gera insights estratégicos baseados nos dados reais
- **O que NÃO funciona / é placeholder:**
  - ROAS usa receita simulada (conversões × 100) — não puxa receita real
  - Anomalias são mock — SentryEngine existe mas rota retorna dados fake
  - TikTok — schema pronto, adapter não implementado
  - Revenue real — campo sempre 0
- **Dependências externas:** Só funciona se o usuário conectou Meta Ads e/ou Google Ads
- **Decisão:** Tier **Agency** (R$997/mês). Quem paga esse tier gerencia múltiplas marcas com ads ativos.

#### 3 Etapas para Performance funcionar em produção

**Etapa 1 — Setup da plataforma (VOCÊ faz, uma vez)**
O que precisa ser feito antes de qualquer usuário poder conectar:
- [ ] Criar conta MCC no Google Ads → obter Developer Token
- [ ] Configurar app Meta com produto "Marketing API" adicionado
- [ ] Configurar "Facebook Login for Business" (NÃO o clássico)
- [ ] Criar `config_id` com permissões: `ads_read`, `business_management`, `instagram_basic`, `pages_show_list`
- [ ] Colocar app Meta em modo "Live" (requer App Review do Meta — pode levar dias/semanas)
- [ ] Publicar Google OAuth consent screen (sair de "Testing" — limite de 100 users)
- [ ] Registrar redirect URIs de todos os providers no dashboard deles
- [ ] Adicionar todas as env vars no Vercel (ver `brain/oauth-setup-checklist.md`)
- **Sem isso feito, nenhum usuário consegue conectar. O botão existe mas falha.**
- **Referência completa:** `brain/oauth-setup-checklist.md`

**Etapa 2 — Conexão por marca (USUÁRIO faz, por marca)**
Cada marca que roda ads precisa de sua própria conexão:
- **Meta:** Clicar "Conectar Meta" → OAuth popup → autorizar → escolher Ad Account → pronto
- **Google:** Adicionar email da Service Account (`conselho-funil-ads@conselho-de-funil.iam.gserviceaccount.com`) como usuário na conta Google Ads → informar Customer ID na página de integrações → pronto
- **Repete para cada marca** com contas de ads diferentes
- Google é mais simples (sem OAuth popup, sem token expirando)
- Meta é mais burocrático (OAuth, token de 60 dias, refresh automático já implementado)

**Etapa 3 — Revenue real (decisão pendente)**
Hoje ROAS é inventado (`conversões × 100`). Para ROAS e ROI reais, precisa de revenue real. Opções:

**Opção A — Confiar no pixel (RECOMENDADA para fase 1)**
- Se o pixel do Meta/Google está configurado com `purchase value`, a API já retorna revenue real
- Meta: campo `action_values` nos insights
- Google: campo `conversion_value` no searchStream
- **O que mudar no código:** Usar esses campos ao invés de `conversões × 100`
- **Complexidade:** BAIXA — é uma mudança no adapter, ~10 linhas
- **Limitação:** Só funciona se o cliente configurou o pixel corretamente com valor de compra. Se o pixel só dispara "lead" ou "purchase" sem valor, retorna 0
- **Cobertura:** Funciona para e-commerces e infoprodutores que usam pixel com valor. Não funciona para leads B2B sem valor monetário no pixel

**Opção B — Webhook de meio de pagamento (IDEAL para fase 2)**
- Usuário conecta Stripe, Hotmart, Kiwify, Eduzz, etc. via webhook
- Cada transação chega no MKTHONEY com: valor, data, origem (UTM), produto
- MKTHONEY cruza transação com click/campanha de origem → revenue real com atribuição
- **O que construir:**
  - Endpoints de webhook para cada gateway (Stripe, Hotmart, Kiwify, Eduzz)
  - Collection `transactions` no Firestore (brandId, amount, source, campaignId, createdAt)
  - Engine de matching: transação ↔ campanha (por UTM ou click ID)
  - Modelo de atribuição (last click para começar, multi-touch depois)
- **Complexidade:** ALTA — projeto de 2-3 sprints
- **Cobertura:** Revenue real para qualquer modelo de negócio. ROAS e ROI 100% reais
- **Valor:** Diferencial enorme vs concorrência. Poucos tools fazem isso nativamente

**Opção C — Input manual**
- Usuário informa receita mensal por campanha/marca via formulário
- **Complexidade:** BAIXA
- **Limitação:** Depende do usuário lembrar de atualizar. Dados sempre defasados
- **Uso:** Fallback para quem não tem pixel nem webhook

#### Sugestão do sistema (opinião técnica)

> **Fase 1: Opção A (pixel) + Opção C (manual como fallback)**
> Baixo esforço, já resolve para e-commerces e infoprodutores. O campo `action_values` do Meta e `conversion_value` do Google já existem — é só usar. Para quem não tem pixel com valor, oferece input manual.
>
> **Fase 2: Opção B (webhooks de pagamento)**
> É o diferencial real. Quando um usuário Enterprise conecta Hotmart + Meta e vê ROAS real por campanha, com atribuição, direto no dashboard — isso é algo que Jasper/Copy.ai não fazem. Justifica o preço Enterprise.
>
> **Ordem:** A+C primeiro (1-2 dias de dev), B depois (2-3 sprints).
>
> **Status:** 🔴 PENDENTE — aguardando decisão do owner

---

## 11. Auditoria: Funis

> **Status:** ✅ DECISÕES TOMADAS
> **Prioridade:** P1 — Core do produto, tudo nasce aqui

### 11.1 Funil ≠ Campanha — Separação de identidade

**Problema:** Hoje `proposalId` pode virar `campaignId`. `/campaigns/[id]` aceita IDs de funil e campanha. A fronteira é borrada — o usuário não sabe quando saiu da estratégia e entrou na execução.

**Decisão:** Separação clara:
- **Funil** = estratégia (objetivo, público, oferta, arquitetura, propostas)
- **Campanha** = execução (copy, social, design, calendário, aprovações)
- Fluxo: `Funil → Aprovar proposta → Criar Campanha`
- Campanha nasce do funil (`campaign.funnelId`), herda contexto, mas tem vida própria
- Um funil pode gerar múltiplas campanhas (ex: A/B de copy)

### 11.2 Funis saem "muito parecidos" — Diagnóstico

**Causas identificadas:**
1. **RAG query genérica** — `"Funil de sales Canal: meta Público: empreendedores"` retorna sempre os mesmos chunks
2. **Prompt não força diversidade** — pede "2 propostas diferentes" sem definir como diferenciar
3. **Brain Context NÃO é injetado** — `buildFunnelBrainContext()` existe em `funnel-brain-context.ts` mas NUNCA é chamado no `route.ts`
4. **Brand Context superficial** — não carrega keywords, research, personas, spy insights, histórico
5. **Temperatura alta (0.8)** — varia palavras mas não diversifica estrutura
6. **Zero memória** — não sabe dos funis anteriores da mesma marca

**Correções imediatas (baixo custo):**
- Injetar Brain Context (código pronto, só falta chamar)
- Melhorar RAG query (incluir vertical, dor, ticket, consciência)
- Forçar diversidade no prompt ("Proposta 1: curto/direto, Proposta 2: longo/nutrição")
- Reduzir temperatura para 0.6

**Correções de médio prazo (Brand Intelligence Layer):**
- Carregar keywords, research, personas, spy insights no contexto
- Carregar funis anteriores como "evite repetir"
- Usar dados reais de mercado das pesquisas

### 11.3 Step 1 — Objetivo: de 4 para 10 opções + Roteador Estratégico

**Problema:** 4 objetivos (leads, sales, calls, retention) não cobrem o mercado real. Infoprodutor de lançamento, coach de webinar, negócio freemium — nenhum se encaixa.

**Novos objetivos aprovados (10):**

| ID | Label | Arquitetura típica |
|---|---|---|
| `leads` | Captar Leads | Ad → Lead Magnet → Thank You → Email Sequence |
| `sales` | Venda Direta (Evergreen) | Ad → Landing/VSL → Checkout → Upsell → Thank You |
| `calls` | Agendar Calls | Ad → Landing → Aplicação → Calendário → Follow-up |
| `retention` | Reter/Upsell | Email → Oferta Exclusiva → Checkout → Onboarding |
| `launch` | Lançamento | Ad → Inscrição → CPL1-3 → Abertura → Checkout → Fechamento |
| `webinar` | Webinar/Masterclass | Ad → Registro → Reminder → Webinar → Oferta → Follow-up |
| `tripwire` | Tripwire/SLO | Ad → Landing Irresistível → Checkout → OTO1 → OTO2 → Email |
| `application` | Aplicação/High-Ticket | Ad → Landing → Formulário → Análise → Call → Proposta |
| `community` | Comunidade/Grupo | Ad → Landing → Grupo → Conteúdo de Valor → Oferta Interna |
| `awareness` | Awareness/Branding | Conteúdo Orgânico → Social Proof → Remarketing → Nurture |

**Filosofia do Roteador:** As arquiteturas são REFERÊNCIA, não template. São o "chão mínimo" que evita erros grosseiros. A IA adapta com base no contexto único (ticket, maturidade, consciência, canal, brand, vertical, histórico). O roteador condiciona silenciosamente: arquiteturas de referência no RAG, experts com mais peso, métricas obrigatórias, range de etapas.

**UI:** Grid com 10 cards agrupados em 3 categorias: Aquisição, Conversão, Retenção.

### 11.4 Step 2 — Audiência: ICP estruturado + Awareness como motor

**Problemas:**
1. Duplicação com Brand — marca já tem audience/pain/awareness/objections, funil pede tudo de novo
2. Texto livre sem estrutura — ICPs fracos
3. UMA dor, UMA objeção — público real tem 3-5 de cada
4. Falta `most_aware` na UI (existe no type)
5. Awareness é decorativo — não condiciona nada além de texto no prompt

**Decisões:**
- **Herança da Brand:** Se linkado, pré-carrega e pergunta "mesmo público ou segmento diferente?"
- **ICP Estruturado:** Quem é, faixa de renda, onde consome conteúdo, sofisticação, top 3 dores, top 3 objeções
- **Awareness como co-roteador:** Adicionar `most_aware` + Awareness × Objective = Estratégia. Condiciona todos os engines (tom da copy, tipo de hook, estilo do design)

### 11.5 Step 3 — Oferta: Escada de Valor completa

**Problemas:**
1. "Descreva sua oferta" vago — qual oferta? principal? entrada? grátis?
2. Ticket é string (não número) — Brand tenta `.toLocaleString()` e pode quebrar
3. Tipo é texto livre (nem dropdown)
4. Sem escada de valor — não pergunta order bump, upsell, downsell, garantia, bônus
5. **Differentiator NÃO chega** nos prompts de geração de funil e copy (campo coletado mas não consumido)
6. Duplicação com Brand

**Decisões:**
- **Herança da Brand** (mesmo padrão)
- **Formulário estruturado:** Nome, tipo (dropdown 8+), preço (número), promocional, parcelamento, garantia, modelo (venda única/recorrente/freemium/trial)
- **Escada de valor:** Toggles para lead magnet, order bump, upsell, downsell (cada um com preço + descrição)
- **Prova/Resultado:** Campo para resultado concreto → alimenta social proof real
- **Fix crítico:** Injetar `differentiator` nos prompts (dado existe, não chega)

### 11.6 Step 4 — Canais: por camada + budget

**Problemas:**
1. 6 canais fixos — faltam WhatsApp, LinkedIn, Pinterest, Telegram, Podcast, Afiliados, Indicação, SMS, Marketplaces
2. Primário + Secundário mistura camadas (aquisição ≠ nutrição ≠ conversão)
3. Canal não condiciona formato de conteúdo
4. Canal secundário ignorado por Copy, Social, Design
5. Sem budget — R$500/mês vs R$50k/mês = funis radicalmente diferentes
6. Resíduo `channel.main` vs `channels.primary` no código

**Decisões:**
- **Canais por camada:** Aquisição (1-3 de 10+), Nutrição (1-3 de 6+), Conversão (1 de 6+)
- **Budget:** Select de faixa (não invisto até R$50k+) → condiciona complexidade do funil
- **Restrições por canal:** Cada canal carrega formatos/restrições silenciosamente para Design e Social

### 11.7 Step 5 — Confirmação

**Problemas menores:** Resumo incompleto (não mostra todos os campos), sem edição inline.
**Decisão:** Exibir todos os campos + botão editar por seção.

### 11.8 Outros problemas identificados

| Problema | Severidade | Status |
|---|---|---|
| Funnel Autopsy — componentes podem estar inacessíveis | Média | Verificar |
| Templates — funcionalidade possivelmente fantasma | Média | Verificar |
| Analytics decorativas — sem dados reais | Baixa | Depende de tracking |
| Kanban sem filtros (brand, objetivo, data) | Baixa | Futuro |

---

## 12. Campanhas (Linha de Ouro) — Auditoria Completa

**Feature:** Command Center de campanhas — orquestra 6 estágios: Funil → Oferta → Copy → Social → Design → Ads.
**Arquivos-chave:** `types/campaign.ts`, `app/(app)/campaigns/[id]/page.tsx`, `lib/ai/campaign-context.ts`, `api/campaigns/`
**Filosofia:** A Linha de Ouro é o manifesto unificado que conecta todas as decisões de uma campanha.

### 12.1 Campanha Fantasma (Virtual Campaign Fallback) — FUNDAÇÃO

**Problema:** Quando usuário abre `/campaigns/[id]`, se não existe documento na collection `campaigns`:
1. Carrega funil da collection `funnels`
2. Escaneia copy aprovada em `funnels/{id}/copyProposals`
3. Monta objeto "virtual" com `id = funnelId` (contradiz separação Funil ≠ Campanha)
4. Persiste silenciosamente no Firestore com `setDoc({ merge: true })`

Na listagem, cria "campanhas virtuais" de todos os funnels aprovados sem campanha associada.

**Consequências:**
- `campaignId = funnelId` — sem separação real
- Manifesto nasce com dados incompletos (`keyBenefits: []`, `architecture: ''`)
- Persistência sem consentimento do usuário
- Retries silenciosos em permission-denied (até 5x)

**Decisão:** ✅ Eliminar virtual campaigns.
- Campanha criada **explicitamente** via botão "Iniciar Campanha" no funil aprovado
- Campaign ID único (`campaign_${timestamp}_${shortId}`), nunca igual ao funnelId
- Manifesto preenchido completo na criação (proposta aprovada + contexto + marca)
- `/campaigns` mostra só campanhas reais; funis sem campanha ficam em `/funnels` com badge "Pronto para campanha"

### 12.2 Awareness e Campos Perdidos no Manifesto — FUNDAÇÃO

**Problema:** O tipo `CampaignContext.funnel` tem apenas 6 campos genéricos. O `campaign-context.ts` tenta carregar `campaign.funnel?.awareness` e `campaign.audience?.awareness` — ambos não existem no tipo. Resultado: awareness é **sempre string vazia** em todos os engines downstream.

Também perdidos: dor principal, objeção, diferencial competitivo, canal, scorecard da proposta.

**Quem sofre:** Todos os engines. Design não sabe se é tráfego frio/quente. Social gera hooks sem estágio de consciência. Ads não calibra por awareness. Copy não recebe diferencial.

**Decisão:** ✅ Expandir `CampaignContext.funnel` com todos os campos coletados:
```
funnel: {
  // Existentes
  type, architecture, targetAudience, mainGoal, stages, summary,
  // Novos — do wizard
  awareness,           // nível de consciência Schwartz
  pain,                // dor principal (ou top 3)
  objection,           // objeção principal
  differentiator,      // diferencial competitivo
  // Novos — da proposta aprovada
  proposalName,        // qual proposta foi escolhida
  proposalVersion,     // versão
  scorecard,           // avaliação da proposta
  // Novos — contexto de canal
  primaryChannel,
  secondaryChannel,
  channelLayers,       // acquisition/nurture/conversion (futuro)
}
```

### 12.3 Offer Stage Desconectado

**Problema:** Estágio "Oferta" aponta para `/intelligence/offer-lab?campaignId=[id]` (feature separada). Manifesto salva apenas 4 campos superficiais (`offerId, name, score, promise`). Escada de Valor (order bump, upsell, downsell, lead magnet) não é capturada. `campaign-context.ts` só usa `offerPromise` (1 de 4).

**Decisão:** ✅ Oferta herda da marca com opção de customizar por campanha. Quando implementarmos Escada de Valor (decisão do audit de Funis 11.3), esses dados fluem para o manifesto. Offer Lab permanece como ferramenta de refinamento, não como estágio obrigatório.

### 12.4 Copy Stage: Dados Rasos no Manifesto

**Problema:**
- `mainScript` é copy inteiro como string plana (sem estrutura headline/subheadline/CTA/body/proof)
- `tone` recebe `awarenessStage` no fallback (coisas diferentes)
- `keyBenefits: []` — sempre vazio, nunca populado
- Sem scorecard da copy no manifesto
- Sem variação A/B escolhida

**Consequência:** Social gera hooks baseado em `bigIdea` + string plana. Design recebe `tone` que na verdade é awareness level.

**Decisão:** ✅ Enriquecer manifesto de copy:
- Estruturar mainScript em seções (headline, subheadline, body, CTA, proof)
- Separar `tone` de `awareness` (campos distintos)
- Persistir keyBenefits reais (extraídos da copy aprovada)
- Incluir scorecard (5 dimensões) no manifesto
- Registrar qual variação A/B foi escolhida (se houver)

### 12.5 Social Stage: Hooks sem Contexto de Debate

**Problema:**
- `debate` é uma string — debate de 4 conselheiros vira texto plano
- `evaluation` é `Record<string, unknown>` — scores do scorecard se perdem
- Hooks sem priorização — 10 hooks salvos, sem saber qual é o melhor
- `contentPlan.posts` sem distinção de quais foram aprovados

**Decisão:** ✅ Salvar scores por hook individualmente. Marcar hooks aprovados vs gerados. Estruturar evaluation com tipo real. Debate pode permanecer como string (é contexto qualitativo). Posts aprovados marcados com flag `approved: true`.

### 12.6 Ads Auto-Gerado Sem Revisão

**Problema:** Ao clicar no estágio "Ads", se não existe, o sistema auto-gera via API gastando 5 créditos sem consentimento. Sem input do usuário (budget, objetivo de tráfego, plataforma preferida). Sem prévia/rascunho.

**Decisão:** ✅ Ads deve ter wizard/configuração antes de gerar:
1. Tela de configuração: budget disponível, objetivo (tráfego/conversão/awareness), plataformas
2. Preview do que será gerado (sem custo)
3. Confirmação explícita antes de gastar créditos
4. Resultado estruturado (não só via chat)

### 12.7 Metrics: Webhooks que Não Existem

**Problema:** O tipo define `metrics?: { clicks, impressions, spend, conversions }` e `MonitoringDashboard` renderiza métricas. Mas não existe nenhum webhook endpoint. `const [metrics] = useState<Metric[]>([])` — nunca atualizado. Dashboard sempre mostra zeros.

**Decisão:** ✅ Esconder MonitoringDashboard da UI até ter funcionalidade real. Substituir pelo "Diário de Campanha" (entrada manual de métricas) no Launch Pad (12.10). Webhooks são feature Enterprise futura.

### 12.8 Congruência Falsa

**Problema:** "Congruência" mede `stages preenchidos / total` — é progresso, não congruência. Uma campanha com copy de "urgência", social de "educação" e design "minimalista" marca 100% de congruência.

**Decisão:** ✅ Renomear para "Progresso" imediatamente. Congruência real (análise IA de coerência entre estágios) é feature futura — pode ser parte do Launch Pad como "Relatório de Coerência" que analisa se a Linha de Ouro forma narrativa consistente.

### 12.9 Navegação Fragmentada entre Funis e Campanhas — FUNDAÇÃO

**Problema:**
- Copy → `/funnels/[id]/copy?campaignId=...`
- Social → `/funnels/[id]/social?campaignId=...`
- Design → `/chat?mode=design&funnelId=...&campaignId=...`
- Ads → `/chat?mode=ads&funnelId=...&campaignId=...`

Copy/Social vivem em `/funnels/`, Design/Ads vivem em `/chat`. `campaignId` por query param pode se perder.

**Decisão:** ✅ Namespace unificado:
```
/campaigns/[id]           → Command Center (hub)
/campaigns/[id]/copy      → Estágio de Copy
/campaigns/[id]/social    → Estágio de Social
/campaigns/[id]/design    → Estágio de Design
/campaigns/[id]/ads       → Estágio de Ads
/campaigns/[id]/launch    → Launch Pad (12.10)
```
Cada página carrega manifesto via `campaignId` da URL. Header com stepper mostrando posição na Linha de Ouro. Componentes existentes reutilizados.

### 12.10 Launch Pad — O Estágio Final (NOVO)

**Problema:** Após completar 5 estágios, o usuário enfrenta sensação de vazio. "O que faço com isso? Para onde levo? Fiz algo que será utilizado?" O sistema não entrega output acionável nem acompanhamento.

**Decisão:** ✅ Substituir "Métricas (Webhook)" por "Launch Pad" como estágio 6 real. Composto por 5 blocos:

**Bloco 1 — Kit de Campanha (Exportação)**
- PDF Executivo — briefing completo, formatado, com logo da marca
- Pack de Copy — toda copy aprovada, organizada por estágio do funil
- Pack de Social — hooks + calendário exportável (CSV)
- Pack de Design — assets aprovados em ZIP por plataforma/formato
- Plano de Mídia — budget, canais, audiências, benchmarks
- Botão "Baixar Kit Completo"

**Bloco 2 — Checklist de Lançamento (Acionável)**
Checklist real com estados (não texto genérico):
- [ ] Configurar pixel na landing page (link para guia)
- [ ] Subir criativos no Ads Manager (assets prontos para download)
- [ ] Agendar posts da semana 1 (conteúdo copiável)
- [ ] Configurar audiências (dados da estratégia)
- [ ] Ativar campanha (data sugerida)

Cada item clicável, marcável, com dados reais da campanha.

**Bloco 3 — Diário de Campanha (Acompanhamento)**
- Entrada manual de métricas semanais (spend, clicks, conversions)
- Cálculo automático de ROI, CPA, ROAS
- IA compara com benchmarks do Ads: "Seu CPA está 30% acima do target"
- Timeline visual: semana 1, 2, 3...

**Bloco 4 — Iteração Inteligente**
- "Não performou? Criar variação" → herda manifesto, abre pontos fracos para ajuste
- "Performou bem? Escalar" → sugere aumento de budget, novos canais, novas audiências
- "Outro ângulo?" → Campanha v2 com mesmo funil mas proposta diferente

**Bloco 5 — Feedback Loop**
- Usuário marca campanha como "sucesso" ou "fracasso" + motivo
- Dados alimentam RAG: futuras campanhas aprendem com o que funcionou
- Conselheiros ficam mais inteligentes a cada campanha completada

### 12.11 Resumo de Prioridades — Campanhas

| Problema | Severidade | Categoria | Status |
|---|---|---|---|
| 12.1 Virtual Campaign / ID | Crítica | Fundação | ✅ Aprovado |
| 12.2 Awareness + campos perdidos | Crítica | Fundação | ✅ Aprovado |
| 12.9 Navegação fragmentada | Alta | Fundação | ✅ Aprovado |
| 12.4 Copy raso no manifesto | Alta | Qualidade dados | ✅ Aprovado |
| 12.5 Social sem scores | Alta | Qualidade dados | ✅ Aprovado |
| 12.3 Offer desconectado | Média | Qualidade dados | ✅ Aprovado |
| 12.6 Ads auto-gerado | Média | UX/Produto | ✅ Aprovado |
| 12.8 Congruência falsa | Baixa | UX/Produto | ✅ Aprovado |
| 12.7 Metrics/Webhooks inexistentes | Baixa | Placeholder | ✅ Aprovado (esconder) |
| 12.10 Launch Pad | Alta | Novo estágio | ✅ Aprovado |

**Ordem de execução:** 12.1 → 12.2 → 12.9 → 12.4+12.5 → 12.3 → 12.6 → 12.10 → 12.8 → 12.7

---

## 13. Design Studio — Auditoria Completa

**Feature:** Sistema de design inteligente com 4 etapas (Análise → Inputs Criativos → Planejamento → Geração). Usa framework do Design Director, personagens da marca, referências de inspiração, e sistema visual de campanha com peças interconectadas.
**Arquivos-chave:** `api/design/{analyze,plan,generate,upscale}`, `types/design-system.ts`, `types/ads-design.ts`, `lib/ai/prompts/design.ts`, `components/design/*`
**Status do plano de 6 fases:** Todas implementadas (Tipos, Personagens, Análise, Inspirações, UI, Sistema Visual, Preferências). Feature mais completa do produto.

### 13.0 Navegação Fragmentada do Design — UX FIRST

**Problema:** Para chegar ao Design Studio, existem 3 caminhos:
1. Sidebar → "Design" → `/design` (standalone, 938 linhas) → seleciona campanha
2. Sidebar → Funis → abre funil → aba Design → `/funnels/[id]/design` (682 linhas)
3. Command Center → clica "Design" → redireciona para `/chat?mode=design&funnelId=...&campaignId=...`

Três caminhos diferentes para a mesma feature. Nenhum é direto. Viola princípio UX First (0.1).

**Decisão:** ✅ Consolidar em `/campaigns/[id]/design` (alinhado com 12.9). Sidebar → Campanhas → Campanha → Design = 2 cliques. Eliminar `/design` standalone e `/funnels/[id]/design`. Extrair wizard para componente compartilhado `DesignWizard`.

### 13.1 Geração Única Hardcoded (Sem Variações)

**Problema:** `isSingleGeneration = true` hardcoded em `/api/design/generate` (linha 123). Hotfix para timeout 504. Resultado: usuário gasta 5 créditos e recebe 1 imagem sem opção. Para ver outra, gasta mais 5. No Copy recebe 2-3 propostas. No Social, múltiplos hooks. No Design: 1 take-it-or-leave-it.

Sistema de preferências precisa de "escolhido vs rejeitado" para aprender — mas nunca há comparação.

**Decisão:** ✅ Gerar 2 variações por prompt (não 3, para evitar timeout). Custo permanece 5 créditos. Se timeout persistir, gerar sequencialmente (imagem 1, depois imagem 2) com progress indicator. Escolha alimenta sistema de preferências.

### 13.2 Plan Não Carrega Campaign Context

**Problema:** `/api/design/plan` não chama `loadCampaignContext()`. O `/analyze` carrega, o `/generate` carrega, mas o `/plan` — que gera os prompts visuais — não. Recebe contexto do frontend (campos de texto do wizard) em vez dos dados aprovados do manifesto.

Prompts visuais planejados sem Big Idea, hooks aprovados, tom de copy, ou estágio de consciência.

**Decisão:** ✅ Injetar `loadCampaignContext(campaignId)` no plan. Dados reais do manifesto têm prioridade sobre inputs do frontend.

### 13.3 Sem Avaliação Pós-Geração

**Problema:** Design Director tem 2 frameworks de avaliação no brain (`visual_impact_score` + `chapeu_compliance`) com red flags e gold standards. Nenhum é usado pós-geração.

Comparação entre engines:
| Engine | Avaliação pós-geração |
|---|---|
| Copy | Scorecard 5 dimensões |
| Social | Debate 4 conselheiros + Scorecard |
| Design | ❌ Nenhuma |

O Director analisa ANTES (etapa 1) mas nunca avalia DEPOIS (etapa 4).

**Decisão:** ✅ Implementar avaliação pós-geração. Enviar imagem + prompt + contexto ao Gemini Vision com frameworks do brain. Retorna score (0-100) + feedback específico. Custo: 0 créditos (informacional, Flash model). Pode ser opt-in ("Avaliar com o Director").

### 13.4 Director Trabalha Sozinho

**Problema:** No Social, 4 conselheiros debatem. No Design, é 1 só. Sem tensão criativa, sem perspectivas diferentes.

**Decisão:** ✅ Não criar novos brains. Na etapa de análise (etapa 1), o Director apresenta 2-3 abordagens diferentes:
- "Abordagem Editorial: cenário lifestyle, luz natural, storytelling visual"
- "Abordagem Conversão: produto em destaque, CTA bold, urgência"
- "Abordagem Minimalista: fundo limpo, tipografia protagonista"
O usuário escolhe a abordagem. Substitui debate e mantém Director como autoridade.

### 13.5 Duas Páginas Duplicadas

**Problema:** `/funnels/[id]/design/page.tsx` (682 linhas) + `/design/page.tsx` (938 linhas) = 1620 linhas fazendo quase a mesma coisa. Comportamentos diferentes, manutenção dobrada.

**Decisão:** ✅ Extrair wizard para componente `DesignWizard` que recebe `campaignId`. Página `/campaigns/[id]/design` renderiza esse componente. Eliminar as outras duas rotas. (Alinhado com 13.0)

### 13.6 Upscale Quebrado

**Problema:** Backend retorna base64 (payload enorme), frontend tem `handleUpscale` vazio/stub. Botão "Upscale HD" existe na UI e não funciona.

**Decisão:** ✅ Curto prazo: remover botão da UI (UX First — não mostrar feature quebrada). Médio prazo: implementar corretamente (upload para Storage como `/generate` faz).

### 13.7 Texto na Imagem Não Verificado

**Problema:** Sistema injeta `copyHeadline` e regras de idioma no prompt. Mas modelos de imagem são ruins com texto — erros ortográficos, idioma errado, posição ruim. Sem verificação pós-geração.

**Decisão:** ✅ Gerar imagem SEM texto embutido + entregar texto formatado separadamente como overlay. O card já mostra seção de copy (headline/primaryText/CTA). Nota: "Adicione o texto no seu editor (Canva, Figma)." Mais honesto e mais útil que texto mal renderizado.

### 13.8 Awareness Vazio (Dependência 12.2)

**Problema:** `loadCampaignContext()` retorna `awareness: ''` (problema 12.2). Design Director recebe contexto sem estágio de consciência. Não sabe se é tráfego frio ou quente.

**Decisão:** ✅ Já resolvido pelo 12.2. Sem ação adicional — quando awareness fluir no manifesto, Design Director se beneficia automaticamente.

### 13.9 Sem Histórico/Versionamento de Designs

**Problema:** Cada imagem é salva como `brand_asset` individual disperso. Sem galeria da campanha, sem comparação v1 vs v2, sem revisitar sessões anteriores.

**Decisão:** ✅ No Design wizard (etapa 4), manter mini-galeria com todos os designs gerados nesta sessão para comparação. No Launch Pad (12.10), "Pack de Design" agrupa assets da campanha. Histórico completo entre sessões = feature futura.

### 13.10 C.H.A.P.E.U: De Framework Rígido para Princípios Flexíveis

**Problema:** O framework C.H.A.P.E.U está cimentado em 17 pontos do código — tipos, prompts, API routes, brain, UI. Marcado como "RIGOROSO" e "OBRIGATÓRIO". Preferências do usuário são explicitamente secundárias ("mantendo compliance C.H.A.P.E.U"). Resultado: outputs engessados, features novas silenciadas, nome horrível visível ao usuário.

**Pontos de injeção identificados:**
- `design.ts` — 4 perfis hardcoded (conversão, storytelling, educativo, prova_social)
- `ads-design.ts` — Zod schema forçando 5 campos de strategy obrigatórios
- `design-system.ts` — `chapeuProfile` como campo required
- `design-plan/route.ts` — Bloco "INSTRUÇÕES C.H.A.P.E.U — RIGOROSO"
- `design-brain-context.ts` — Carrega `chapeu_compliance` como framework obrigatório
- UI — Labels "C.H.A.P.E.U" visíveis ao usuário em 3 componentes
- Regra explícita: "Incline para preferências mantendo compliance C.H.A.P.E.U"

**O que é bom (o conceito):** Hierarquia visual clara, ação única, pensar em composição antes de gerar.

**O que é ruim (a implementação):** 6 campos obrigatórios por geração, 4 perfis hardcoded, nome na UI, silencia abordagens que não encaixam (carrossel narrativo, meme, post autêntico).

**Decisão:** ✅ Transformar, não eliminar.
1. **Rebrand:** Eliminar nome "C.H.A.P.E.U" de toda UI e prompts. Princípios viram "Diretrizes de Arte" (implícitas, não nomeadas)
2. **De obrigatório para contextual:** Prompt muda de "TODOS os 6 pilares RIGOROSO" para "Considere hierarquia visual, atmosfera e ação desejada. Aplique rigor adequado ao formato."
3. **Eliminar schema forçado:** `strategy` block com 5 campos obrigatórios sai do `AdsDesignContract`. Se Director quer comentar composição, comenta em texto livre
4. **Perfis viram sugestões:** Em vez de lookup table hardcoded, Director analisa contexto e recomenda abordagem. Inteligência real, não mapeamento
5. **Preferências do usuário têm prioridade:** Inverter regra — "princípios de arte informam, preferências do usuário decidem"

**Arquivos impactados:**

| Arquivo | Mudança |
|---|---|
| `lib/ai/prompts/design.ts` | Remover `CHAPEU_PROFILES`, `getChapeuProfilePrompt()`, rebrand system prompt |
| `types/ads-design.ts` | `strategy` block vira opcional ou texto livre |
| `types/design-system.ts` | `chapeuProfile` → `artDirection: string` (opcional) |
| `lib/ai/prompts/design-brain-context.ts` | Manter brain loading, remover enforcement "RIGOROSO" |
| `data/identity-cards/design_director.md` | Princípios continuam, nome muda, tom menos prescritivo |
| `api/design/plan/route.ts` | Remover bloco "INSTRUÇÕES C.H.A.P.E.U — RIGOROSO" |
| `components/design/analysis-result.tsx` | Label "C.H.A.P.E.U" → remover ou "Direção de Arte" |
| `components/chat/design-generation-card.tsx` | Label "C.H.A.P.E.U" → "Estratégia Visual" |
| `app/(app)/funnels/[id]/design/page.tsx` | Labels C.H.A.P.E.U → remover |

### 13.11 Carrossel como Formato no Social (Não no Design)

**Contexto:** Briefing detalhado de feature de carrossel Instagram foi avaliado. A visão de produto é boa (carrossel narrativo de 5-10 slides com Hook → Problema → Valor → CTA, subject consistency com foto de referência, export ZIP), mas a implementação proposta criava feature isolada com stack errada (Pages Router), sem usar infra existente (auth, Gemini wrapper, brand context, brain, créditos).

**Decisão:** ✅ Carrossel vive no Social Wizard como formato de output (ao lado de reels, stories, posts estáticos). NÃO é feature do Design.

**Fluxo:**
```
Social Wizard → Formato: "Carrossel" → Gera script narrativo (5-10 slides)
→ Preview swipe horizontal → Gera imagens via /api/design/generate (infra existente)
→ Export ZIP (slide_01.png, slide_02.png, etc.)
```

**O que usa da infra existente:**
- `/api/design/generate` para imagens (Nano Banana 2, brand assets, characters)
- `loadCampaignContext()` para contexto da Linha de Ouro
- Brand characters para subject consistency (foto de referência)
- Inspiration references para style consistency
- Sistema de créditos existente
- Auth existente (`requireBrandAccess`)

**O que é realmente novo:**
1. Lógica de carrossel no `/api/design/plan` — quando formato = carousel, gerar array de slides interconectados com narrativa
2. Componente de preview de carrossel — slides lado a lado com scroll horizontal simulando swipe
3. Endpoint de export ZIP com JSZip (~50 linhas)
4. Prompts de carrossel (narrativa slide a slide) adaptados ao contexto da campanha

**Custo:** 15 créditos por carrossel (pacote 5-10 slides) ou 5 por slide individual.

### 13.12 Resumo de Prioridades — Design Studio

| Problema | Severidade | Categoria | Status |
|---|---|---|---|
| 13.0 Navegação fragmentada (3 caminhos) | Crítica | UX First | ✅ Aprovado |
| 13.10 C.H.A.P.E.U engessando outputs | Alta | Framework | ✅ Aprovado |
| 13.2 Plan sem campaign context | Alta | Qualidade output | ✅ Aprovado |
| 13.3 Sem avaliação pós-geração | Alta | Interconectividade | ✅ Aprovado |
| 13.1 Geração única hardcoded | Alta | UX | ✅ Aprovado |
| 13.5 Duas páginas duplicadas | Média | Manutenção | ✅ Aprovado |
| 13.4 Director trabalha sozinho | Média | Profundidade | ✅ Aprovado |
| 13.7 Texto na imagem | Média | Limitação técnica | ✅ Aprovado |
| 13.6 Upscale quebrado | Média | Feature quebrada | ✅ Aprovado |
| 13.9 Sem histórico de designs | Média | UX | ✅ Aprovado |
| 13.8 Awareness vazio | Alta | Dependência 12.2 | ✅ (resolvido por 12.2) |
| 13.11 Carrossel no Social | Média | Nova feature | ✅ Aprovado |

**Ordem de execução:** 13.0+13.5 (consolidar rotas) → 13.10 (flexibilizar framework) → 13.2 (campaign context no plan) → 13.1+13.3+13.4 (variações + avaliação + abordagens) → 13.7+13.6 (texto + upscale) → 13.9 (galeria) → 13.11 (carrossel)

---

## 14. Chat (Conselheiros) — Auditoria Completa

**Feature:** Interface unificada de conversa com 23 conselheiros em 5 conselhos (Funnel 6, Copy 9, Social 4, Ads 4, Design 1). 7 modos, Party Mode (debate multi-expert), RAG com Pinecone, brain injection via Identity Cards, Context Assembly hierárquico.
**Arquivos-chave:** `api/chat/route.ts`, `lib/ai/context-assembler.ts`, `lib/ai/prompts/party-mode.ts`, `lib/intelligence/brains/`, `components/chat/*`

### 14.1 Chat como "Lixeira de Features" — UX FIRST

**Problema:** O Chat absorveu features que deveriam ser páginas próprias:
- Design → `/chat?mode=design&funnelId=...&campaignId=...`
- Ads → `/chat?mode=ads&funnelId=...&campaignId=...`
- Copy e Social também existem como modos do chat

Resultado: 7 modos numa página, cada um com comportamento/output diferente. Design gera imagens dentro do chat. Ads gera estratégia JSON. O chat tenta ser tudo.

**Decisão:** ✅ Com 12.9 e 13.0 aprovados, Design e Ads saem do chat para páginas próprias. Chat fica com **3 modos core:**
- **Geral** — conversa aberta com qualquer conselheiro
- **Campanha** — conversa contextualizada na campanha ativa (substituindo funnel/copy/social separados)
- **Party** — debate formal entre experts selecionados

### 14.2 Contexto por Query Params (Frágil)

**Problema:** Chat recebe contexto via 5 query params (`id`, `funnelId`, `campaignId`, `mode`, `from`). Se perde em navegação. Auto-detection de campanha pode pegar a errada silenciosamente.

**Decisão:** ✅ Quando Chat vive dentro de `/campaigns/[id]/...`, campaignId vem da URL naturalmente. Para chat geral (não vinculado a campanha), contexto vem do brand ativo via `useActiveBrand`. Eliminar dependência de query params para contexto crítico.

### 14.3 23 Conselheiros Desconhecidos

**Problema:** Usuário médio não sabe quem é Gary Halbert ou Eugene Schwartz. Party Mode exige que o usuário selecione de um grid de 23 cards. Só existem 3 combos pré-montados.

**Decisão:** ✅ Três mudanças:
1. **Smart suggestions** — sistema recomenda quais conselheiros chamar baseado no contexto (campanha, objetivo, estágio de consciência, tema da pergunta)
2. **Combos expandidos** por objetivo: "Quero lançar produto", "Quero escalar tráfego", "Quero criar conteúdo viral", "Quero melhorar minha oferta", etc.
3. **Card de apresentação** na primeira vez que cada conselheiro fala (ver 14.11)

### 14.4 Custo Flat (1 Crédito = 1 Mensagem)

**Problema:** Perguntar "o que é um funil?" custa 1 crédito. Party Mode com 5 experts custa 1 crédito. O custo real para o sistema varia dramaticamente.

**Decisão:** ✅ Party Mode passa a custar **2 créditos** (reflete custo real do Pro model + multi-agent). Chat normal permanece 1 crédito. Transparente e justo.

### 14.5 Sem Memória entre Conversas

**Problema:** Cada conversa começa do zero. Conselheiro não sabe o que discutiram antes, quais decisões foram tomadas, qual feedback o usuário deu. RAG puxa chunks genéricos, não contexto conversacional.

**Decisão:** ✅ Ao iniciar nova conversa na mesma campanha, carregar **resumo das últimas 3 conversas** como contexto adicional. O resumo seria gerado automaticamente ao encerrar/arquivar conversa (via Flash model, custo mínimo). Feature de médio prazo — não bloqueia outras melhorias.

### 14.6 Outputs Estruturados Frágeis

**Problema:** Tags `[COUNCIL_OUTPUT]`, `[NANOBANANA_PROMPT]`, `[ADS_STRATEGY]` detectadas por regex. Se o LLM formata diferente, o regex falha e o usuário vê JSON bruto.

**Decisão:** ✅ Com Design e Ads fora do chat, `[NANOBANANA_PROMPT]` e `[ADS_STRATEGY]` são eliminados. Tags restantes (`[COUNCIL_OUTPUT]`, `[VEREDITO]`) recebem parser robusto com fallback (se falhar, renderiza como markdown formatado).

### 14.7 Verdict como Feature Isolada

**Problema:** Verdict gerado uma vez no onboarding (0 créditos). Vive dentro de uma conversa. Se o usuário melhora a marca, não tem como re-gerar. Ações sugeridas não linkam para features.

**Decisão:** ✅ Mover Verdict para a **página da marca** (sempre visível, re-gerável). Ações sugeridas linkam para features correspondentes ("Melhore sua oferta" → Offer Lab, "Defina seu público" → ICP Builder). Ao re-gerar, compara com veredito anterior mostrando evolução.

### 14.8 Conversas sem Organização

**Problema:** Sidebar mostra todas as conversas em lista plana por data. Sem filtro por marca, campanha, modo ou tema. Após 20+ conversas, impossível encontrar algo.

**Decisão:** ✅ Agrupar conversas automaticamente por marca/campanha + busca por conteúdo. Conversas vinculadas a campanha aparecem na seção da campanha. Chat geral agrupado por marca.

### 14.9 Upload de Arquivo Escondido

**Problema:** Chat suporta upload de imagens/PDFs com análise automática por Gemini Vision. Feature poderosa mas quase invisível — sem onboarding, tooltip ou menção.

**Decisão:** ✅ Adicionar hint contextual: na primeira vez que o usuário usa o chat, tooltip discreto no ícone de anexo: "Envie imagens ou PDFs — o conselheiro analisa e comenta." Power feature, discovery sutil.

### 14.10 Dual Sidebar

**Problema:** Chat tem sidebar própria (conversas) que compete com sidebar principal do app. Desktop: duas sidebars. Mobile: menus conflitantes.

**Decisão:** ✅ Integrar conversas como seção expansível na sidebar principal quando em modo chat. Sidebar do chat como componente separado é eliminada. Menos poluição visual, navegação unificada.

### 14.11 Conselheiros com Vida — TRANSFORMAÇÃO CENTRAL

**Problema fundamental:** Os 23 conselheiros falam com **voz única e genérica**. Os Identity Cards existem (filosofia, princípios, voz, catchphrases) mas na prática a resposta sai toda igual — um bloco de texto monocromático sem personalidade, sem formatação rica, sem follow-ups, sem identidade visual.

É como ter 23 atores vestindo a mesma roupa e falando do mesmo jeito.

**Decisão:** ✅ Transformação completa em 6 eixos:

**Eixo 1 — Voz Individual**
Cada conselheiro responde com personalidade própria:
- Schwartz: professoral, didático, usa exemplos históricos
- Halbert: agressivo, direto, frases curtas e imperativas
- Ogilvy: elegante, parágrafos longos, referências culturais
- Gary Vee (via Rachel Karten): energético, informal, dados de plataforma
- Design Director: preciso, vocabulário de composição visual

**Implementação:** Quando o sistema identifica o conselheiro mais relevante (via RAG), usa o Identity Card COMPLETO como system prompt. Instrução: "Você É [Nome]. Responda como essa pessoa falaria. Use seu tom, suas expressões, seu estilo." Output assinado por 1 conselheiro, não "o conselho".

**Eixo 2 — Identidade Visual por Conselheiro**
- **Foto/avatar** — ilustração estilizada para cada conselheiro
- **Badge de especialidade** — "🎯 Headlines & Psicologia de Vendas" abaixo do nome
- **Bloco visual** — cada resposta tem header com foto + nome + badge
- **Cor accent** — cada conselho tem sua cor (já existe), cada conselheiro tem um tom dentro da paleta

**Eixo 3 — Formatação Rica**
- **Negrito** para pontos-chave e conceitos
- **Emojis estratégicos** — 🎯 ação, ⚠️ alerta, 💡 insight, 📊 dado
- **Cards destacados** para frameworks e recomendações
- **Espaçamento** generoso entre seções
- **Quotes** quando referencia outro conselheiro

**Eixo 4 — Sugestões de Follow-up**
Toda resposta termina com 2-3 botões clicáveis:
- Aprofundamento no tema atual
- Aplicação prática ao contexto do usuário
- **Cross-referência**: "💬 Quer ouvir o Nicholas Kusmich sobre como alinhar o tráfego com esse nível de consciência?"

**Eixo 5 — Routing Inteligente entre Conselheiros**
Se o tema cruza domínios, o sistema sugere automaticamente:
- "Esse tema cruza com Social e Ads. Quer chamar a Rachel Karten (hooks pra Instagram) e o Kusmich (Meta Ads) pra mesa?"
- Não é o usuário que precisa saber quem chamar — o **sistema recomenda**
- Pode evoluir para multi-speaker automático (Party Light): 2-3 vozes sem debate formal, apenas perspectivas complementares

**Eixo 6 — Card de Apresentação (primeira vez)**
Na primeira vez que cada conselheiro fala ao usuário, aparece card:

> 📚 **Eugene Schwartz** (1927-2004)
> Autor de *Breakthrough Advertising*, considerado o maior copywriter da história.
> **Por que ouvir:** Inventou o conceito de "Níveis de Consciência" — como falar com cada tipo de público. Toda grande campanha usa seu framework.
> **Especialidade:** Saber EXATAMENTE o que dizer para cada tipo de pessoa.

Aparece uma vez. Depois: só foto + nome + uma linha de expertise.
O card **vende o conselheiro** — não é bio, é "por que dar atenção a essa pessoa".

**Arquivos impactados:**

| Arquivo | Mudança |
|---|---|
| `api/chat/route.ts` | Selecionar 1 conselheiro primário (não "conselho"), usar identity card completo como system prompt |
| `lib/ai/prompts/chat-system.ts` | Prompt individual por conselheiro, não genérico por conselho |
| `lib/intelligence/brains/prompt-builder.ts` | Modo "full persona" — injeta identidade completa (não truncada) |
| `data/identity-cards/*.md` | Enriquecer seção de voz com exemplos de formatação, estilo de frase, nível de formalidade |
| `components/chat/chat-message-bubble.tsx` | Renderizar header com foto + nome + badge. Formatação rica. Botões de follow-up |
| `components/chat/counselor-card.tsx` | CRIAR — card de apresentação do conselheiro |
| `components/chat/follow-up-suggestions.tsx` | CRIAR — botões de sugestão de próxima pergunta |
| `components/chat/chat-empty-state.tsx` | Atualizar sugestões iniciais para incluir conselheiros relevantes com foto |
| Assets | CRIAR — 23 ilustrações/fotos tratadas de conselheiros |

### 14.12 Resumo de Prioridades — Chat

| Problema | Severidade | Categoria | Status |
|---|---|---|---|
| 14.11 Conselheiros com Vida (voz, visual, follow-up, routing) | Crítica | Produto/Diferencial | ✅ Aprovado |
| 14.1 Chat como lixeira de features | Crítica | UX First | ✅ Aprovado |
| 14.2 Contexto por query params | Alta | Fundação | ✅ Aprovado |
| 14.3 23 conselheiros desconhecidos | Alta | UX | ✅ Aprovado |
| 14.8 Conversas sem organização | Média | UX | ✅ Aprovado |
| 14.7 Verdict isolado | Média | Produto | ✅ Aprovado |
| 14.4 Custo flat | Média | Negócio | ✅ Aprovado |
| 14.5 Sem memória entre conversas | Média | Interconectividade | ✅ Aprovado |
| 14.6 Outputs estruturados frágeis | Média | Técnico | ✅ Aprovado |
| 14.10 Dual sidebar | Baixa | UX | ✅ Aprovado |
| 14.9 Upload escondido | Baixa | Discovery | ✅ Aprovado |

**Ordem de execução:** 14.1 (simplificar modos) → 14.11 (conselheiros com vida — eixos 1-3 primeiro, depois 4-6) → 14.2+14.10 (contexto + sidebar) → 14.3 (smart suggestions) → 14.8 (organização) → 14.7 (verdict) → 14.4+14.6 (custo + outputs) → 14.5 (memória) → 14.9 (upload)

---

## 15. Page Forensics — Auditoria

### Estado Atual
- **Rota:** `/strategy/autopsy` — REDIRECIONADA para `/funnels` no next.config.ts (feature inacessível)
- **Página:** `src/app/(app)/strategy/autopsy/page.tsx` (492 linhas) — existe mas ninguém chega nela
- **API:** `POST /api/intelligence/autopsy/run` (125 linhas)
- **Engine:** `src/lib/intelligence/autopsy/engine.ts` (208 linhas)
- **Heurísticas:** Hook (Carlton+Halbert), Story (Sugarman+Schwartz), Offer (Kennedy+Brunson), Friction (Bird+Hopkins), Trust (Hopkins+Ogilvy)
- **Scraping:** Firecrawl → Jina → Readability → Cheerio (fallback chain robusto)

### 15.1 Feature morta — Redirect ativo

**Problema:** `next.config.ts:24` redireciona `/strategy/autopsy` → `/funnels`. O link na sidebar e no Intelligence Hub levam o usuário para Funis, não para Forensics. A página existe mas é inacessível pela navegação normal.

**Decisão:** ✅ NÃO reviver a rota. A feature será absorvida como capacidade interna (ver 15.6).

### 15.2 Zero cobrança de créditos

**Problema:** A API route NÃO chama `updateUserUsage()`. Billing page promete "3 forensics/mês" (starter), "15/mês" (pro), "ilimitado" (agency), mas `monthlyPageForensics` nunca é verificado. Quem achar a rota direta da API usa infinitamente sem custo.

**Decisão:** ✅ Será corrigido quando integrado nos novos pontos de entrada (Spy Agent, Launch Pad, Chat). Cada ponto de entrada cobra seus próprios créditos.

### 15.3 Componente duplicado não usado

**Problema:** `AutopsyReportView.tsx` (218 linhas) — componente alternativo com Framer Motion, Progress bars, Badges. A página principal NÃO importa este componente, renderiza tudo inline. Código morto.

**Decisão:** ✅ Deletar `AutopsyReportView.tsx`. Quando necessário, criar componente novo alinhado ao ponto de entrada que usar.

### 15.4 Rota fragmentada (UX First violado)

**Problema:** Sidebar → "Análise" → "Forensics" → `/strategy/autopsy` → redirect → `/funnels`. Intelligence Hub → tab "Autopsy" → mesmo redirect. Caminho completamente isolado e quebrado.

**Decisão:** ✅ Eliminar a rota standalone. Remover redirect do next.config.ts. Remover entrada da sidebar e do Intelligence Hub NAV.

### 15.5 Sem integração com Campanhas

**Problema:** O resultado do Forensics NÃO alimenta nenhuma outra feature. Não injeta no CampaignContext, não aparece como contexto no chat, não informa decisões de copy ou design. Case Studies ficam isolados na biblioteca.

**Decisão:** ✅ Integrar nos 3 pontos de entrada definidos em 15.6.

### 15.6 Decisão Arquitetural — De Feature para Capacidade

**Diagnóstico:** Page Forensics concorre diretamente com Spy Agent (mesmo scraping, mesma infra, mesma collection `case_studies`, mesmo tipo de output). Ambas fazem: scrape URL → análise por IA → relatório → salva como estudo de caso. A duplicação é injustificável.

**Decisão:** ✅ **Forensics deixa de ser feature standalone e vira capacidade interna.**

O `AutopsyEngine` sobrevive como serviço interno. A página standalone morre.

**3 pontos de entrada:**

| Ponto de Entrada | Contexto | Como funciona |
|---|---|---|
| **Spy Agent** | Análise de concorrente | Ao analisar concorrente, adiciona camada de heurísticas de conversão ao relatório existente. Um único relatório completo (estratégia + qualidade). |
| **Launch Pad (Campanhas)** | Health check pré-lançamento | Usuário colou URL do funil → roda Forensics como diagnóstico antes de investir em tráfego. Score e recomendações alimentam o CampaignContext. |
| **Chat** | Análise conversacional | Usuário cola URL → conselheiros relevantes analisam automaticamente. Carlton comenta hook, Schwartz comenta awareness, Brunson comenta oferta. Cada um com sua voz. |

### 15.7 `depth` parameter ignorado

**Problema:** UI sempre envia `depth: 'quick'`. API aceita `quick | deep` mas o engine nunca diferencia — faz sempre a mesma análise.

**Decisão:** ✅ Implementar diferenciação real quando integrado:
- **Quick** (Spy Agent, Chat): análise de texto via Gemini, 1 chamada, ~30s
- **Deep** (Launch Pad): + Playwright para screenshot real, Core Web Vitals, teste mobile, análise visual via Gemini Vision. ~90s

### 15.8 Naming confuso

**Problema:** 5 nomes diferentes: "Forensics de Página", "Autopsy", "Diagnóstico Forense", "Funnel Autopsy", "Page Forensics".

**Decisão:** ✅ Nome interno único: `PageDiagnostic`. Nos pontos de entrada, o nome varia conforme contexto:
- Spy Agent: "Diagnóstico de Conversão" (seção do relatório)
- Launch Pad: "Health Check" (passo do checklist)
- Chat: sem nome — é só a análise que os conselheiros fazem quando recebem URL

### 15.9 Brain Integration — Melhor do produto (positivo)

**Nota:** O engine usa 10 experts com frameworks reais mapeados por heurística. Cada finding referencia o expert e framework específico. É o uso mais sofisticado de Identity Cards no produto inteiro. Preservar e expandir.

### 15.10 "Insight do Athos" hardcoded

**Problema:** Texto estático na página menciona "Athos" e "Wilder" — nomes que não existem no produto.

**Decisão:** ✅ Morre junto com a página standalone. Nos novos pontos de entrada, os insights são dos conselheiros reais.

### 15.11 Potencial não explorado

**O que o engine poderia fazer com a infra existente mas não faz:**
- **Playwright MCP**: screenshot real, Core Web Vitals, teste mobile, detecção de popups/exit-intent
- **Gemini Vision**: análise de hierarquia visual, posicionamento de CTA, contraste, coerência de design
- **Brand Context**: comparar página analisada vs posicionamento da marca do usuário
- **Multi-página**: Firecrawl pode crawlear site inteiro → análise de funil completo (LP → checkout → thank you)
- **Histórico**: re-analisar mesma URL após mudanças → evolução do score
- **Benchmarking**: comparar múltiplos concorrentes lado a lado

**Decisão:** ✅ Potencial a ser explorado gradualmente conforme os pontos de entrada amadurecem. Prioridade: Gemini Vision + Brand Context (maior impacto, menor esforço).

### 15.12 O que deletar

| Arquivo/Config | Ação |
|---|---|
| `next.config.ts` redirect `/strategy/autopsy` → `/funnels` | REMOVER |
| `src/app/(app)/strategy/autopsy/page.tsx` | DELETAR |
| `src/components/funnel-autopsy/AutopsyReportView.tsx` | DELETAR |
| `src/lib/constants.ts` entrada "page-forensics" na sidebar | REMOVER |
| `src/app/(app)/intelligence/page.tsx` entrada "autopsy" no NAV | REMOVER |
| `src/lib/intelligence/autopsy/engine.ts` | PRESERVAR (serviço interno) |
| `src/types/autopsy.ts` | PRESERVAR (tipos do engine) |
| `src/app/api/intelligence/autopsy/run/route.ts` | REFATORAR (será chamado pelos novos pontos de entrada) |

### 15.13 Resumo de Prioridades — Page Forensics

| Problema | Severidade | Categoria | Status |
|---|---|---|---|
| 15.6 De feature para capacidade (absorver em Spy/Launch/Chat) | Crítica | Arquitetura/UX First | ✅ Aprovado |
| 15.1 Feature morta (redirect ativo) | Alta | UX | ✅ Aprovado (morre com 15.6) |
| 15.4 Rota fragmentada | Alta | UX First | ✅ Aprovado (morre com 15.6) |
| 15.2 Zero cobrança de créditos | Alta | Negócio | ✅ Aprovado (resolve com novos pontos de entrada) |
| 15.5 Sem integração com Campanhas | Alta | Interconectividade | ✅ Aprovado (resolve com 15.6) |
| 15.7 Depth ignorado | Média | Produto | ✅ Aprovado |
| 15.11 Potencial não explorado | Média | Roadmap | ✅ Aprovado |
| 15.3 Componente duplicado | Baixa | Limpeza | ✅ Aprovado |
| 15.8 Naming confuso | Baixa | Consistência | ✅ Aprovado |
| 15.10 Texto hardcoded morto | Baixa | Limpeza | ✅ Aprovado |

**Ordem de execução:** 15.12 (limpeza — deletar página, componente, rotas mortas) → 15.6 (integrar engine no Spy Agent como primeiro ponto) → 15.6 (integrar no Launch Pad) → 15.6 (integrar no Chat) → 15.7 (depth real com Playwright) → 15.11 (potencial gradual)

---

## 16. Dashboard + Onboarding + Performance — Auditoria

### Estado Atual

Existem **3 páginas** que funcionam como "dashboard" do produto:

| Página | Rota | Linhas | Função |
|---|---|---|---|
| Home | `/home` | 417 | Dashboard principal com state machine (welcome/pre-briefing/post-aha/active) |
| Performance | `/performance` | 386 | War Room com métricas de Ads (ROAS, spend, CAC, LTV, anomalias) |
| Cross-Channel | `/performance/cross-channel` | ~200 | Visão cross-platform (Meta, Google, TikTok) — não linkada |

**Onboarding:** Modal de 3 steps (Identidade, Audiência, Oferta) → Transição fake 3.5s → Chat com verdict proativo

### 16.1 Onboarding — Zero Aha Moment

**Jornada atual do novo usuário:**
1. Signup → `/welcome` (spinner inútil) → redirect `/home`
2. `/home` estado "welcome" → 3 opções sem guia claro (criar marca, chat vazio, explorar vazio)
3. Clica "Criar marca" → Modal com 12 campos em 3 steps (~3min)
4. Submit → Tela fake "Analisando sua marca..." (3.5s, progresso fake — timer, não trabalho real)
5. Redirect → `/chat?from=onboarding` → Chat gera verdict como mensagem de texto
6. Usuário volta ao dashboard → vê scores no estado "post-aha"

**Tempo até primeiro valor:** ~4-5 minutos. E quando chega, é texto no chat.

**Decisão:** ✅ Redesenhar aha moment:
- `/welcome` morre (redirect direto para `/home`)
- Após onboarding, o **Verdict aparece como card visual fullscreen** (scores animados, parecer dos conselheiros com identidade visual, diagnóstico por área) — NÃO como mensagem de chat
- CTA claro no final do verdict: "Criar seu primeiro funil →" com contexto da marca pré-carregado
- O verdict TAMBÉM fica salvo para exibir no dashboard posteriormente

### 16.2 Onboarding — Opções iniciais não guiam

**Problema:** Estado "welcome" oferece 3 opções igualmente pesadas:
- "Criar sua marca" ← o caminho certo
- "Consultar MKTHONEY" → chat sem contexto de marca = experiência vazia
- "Explorar a plataforma" → `/funnels` sem marca = lista vazia
- "Pular e ir para o dashboard" → vai pra `/chat`, não pro dashboard

**Decisão:** ✅ O onboarding deve ter **um caminho claro**, não um menu de escolhas. O wizard de marca é obrigatório — sem marca, o produto não funciona. Remover opções que levam a experiências vazias.

### 16.3 Transição fake de 3.5s

**Problema:** `OnboardingTransition` mostra barra de progresso animada por 3.5s. É um timer — o verdict é gerado DEPOIS, quando o chat carrega. O progresso não representa nenhum trabalho real.

**Decisão:** ✅ Se vai mostrar transição, que seja real:
- Opção A: Gerar o verdict DURANTE a transição (não no chat depois) e mostrar progresso real
- Opção B: Eliminar a transição e ir direto para o card de verdict com skeleton loading enquanto gera

### 16.4 Duas dashboards desconectadas

**Problema:** Home mostra métricas de PRODUTO (funis, avaliações, decisões, conversas). Performance mostra métricas de NEGÓCIO (ROAS, spend, CAC, revenue, LTV). Zero conexão entre elas.

**Decisão:** ✅ Unificar em **uma única Dashboard adaptativa**. A state machine do Home cresce para incluir métricas de performance quando disponíveis:

| Estado | Conteúdo |
|---|---|
| **Welcome** | Onboarding guiado (caminho único) |
| **Pre-briefing** | CTA de briefing (mantém) |
| **Post-aha** | Verdict visual + Brand Progress + próximo passo |
| **Active (sem ads)** | KPIs de produto + créditos + atividade + health da marca + campanhas ativas |
| **Active (com ads)** | Tudo acima + KPIs reais (ROAS, spend, CAC) inline + anomalias + insights AI |

A rota `/performance` vira uma **seção expandida** ou um "modo detalhado" do dashboard, não uma página separada.

### 16.5 Home "active" state é pobre

**Problema:** Quando o usuário já tem funis, o dashboard mostra 4 cards de contagem (funis, avaliações, decisões, conversas) + lista de funis recentes + 4 botões. Não mostra: health da marca, score de posicionamento, créditos restantes, campanhas ativas, nenhuma métrica de performance.

**Decisão:** ✅ Estado "active" deve mostrar:
- **Health da marca** (score do último verdict, atualizado periodicamente)
- **Créditos restantes** (barra visual)
- **Campanha ativa** com progresso na Linha de Ouro (em qual estágio está)
- **Próxima ação sugerida** baseada no estado atual ("Você tem copy aprovada sem social. Criar posts →")
- **KPIs reais** se tiver integração de ads

### 16.6 Verdict desaparece quando cria funil

**Problema:** O VerdictSummary (scores + ação) só aparece no estado "post-aha" — quando NÃO tem funis. Ao criar o primeiro funil, o estado muda para "active" e o verdict some para sempre.

**Decisão:** ✅ O verdict é permanente. Deve ser acessível sempre como "Health Score da Marca" no dashboard e atualizado periodicamente conforme a marca evolui.

### 16.7 Benchmarks com sparklines fake

**Problema:** `StatsCards` renderiza "Benchmarks 2026" com sparklines SVG hardcoded que não representam dados reais. Os pontos são fixos independente dos valores.

**Decisão:** ✅ Remover sparklines fake. Quando houver dados reais (integração de ads), usar dados reais. Sem dados = não mostrar gráfico fake.

### 16.8 War Room assume integração de Ads

**Problema:** Performance inteira depende de Meta/Google Ads conectados. Sem integração = tela vazia. Inútil para tráfego orgânico, infoprodutores sem ads, plano starter.

**Decisão:** ✅ Quando integrado no dashboard unificado (16.4), mostrar seção de performance apenas quando há dados. Não mostrar tela vazia. Para usuários sem ads, o dashboard foca em métricas de produto e progresso.

### 16.9 Acknowledge de anomalia é console.log

**Problema:** Linha 299 do performance page: `onAcknowledge={(id) => console.log('Acknowledge:', id)}`. O botão não faz nada.

**Decisão:** ✅ Implementar persistência real (update status no Firestore) quando integrar ao dashboard.

### 16.10 AI Insight dispara múltiplas vezes

**Problema:** O `useEffect` que gera insights via Gemini tem 6 dependências (metrics, anomalies, segment, selectedBrand, blendedMetrics.roas, segmentDataForAdvisor). Na prática, dispara 2-3 vezes ao carregar porque as deps mudam em cascata. Cada disparo = chamada Gemini.

**Decisão:** ✅ Debounce + cache. Gerar insight uma vez ao carregar e só regerar quando o usuário explicitamente muda o segmento ou clica "refresh".

### 16.11 `/api/reporting/generate` requer admin

**Problema:** O endpoint de AI insights chama `verifyAdminRole`. Usuários normais não veem insights. A UI não mostra erro — só "Insight indisponível".

**Decisão:** ✅ Remover restrição de admin. Insights de performance são para todos os usuários com integração de ads.

### 16.12 Bugs menores

- **Data em inglês** — Performance page usa `toLocaleDateString('en-US')`, deveria ser `pt-BR`
- **"Pular e ir para o dashboard"** — link vai pra `/chat`, não pro dashboard
- **Cross-channel** — página existe em `/performance/cross-channel` mas não é linkada de nenhum lugar
- **BrandProgress pede items avançados** — logo, visual identity, RAG assets, AI config são relevantes para usuários avançados, não para quem acabou de criar a marca. Confunde o novo usuário.

### 16.13 Progressão Contínua — Aplicação no Onboarding e Dashboard

O Dashboard é o **hub central de progressão**. Ele deve refletir o princípio 0.3 (Progressão Contínua) em todos os estados:

**Cada estado do dashboard sugere o próximo passo:**

| Estado | O que mostra | Próximo passo sugerido |
|---|---|---|
| Welcome | Boas-vindas | "Criar sua marca" (único caminho) |
| Pre-briefing | Marca sem briefing | "Completar briefing" (3 min) |
| Post-aha | Verdict com scores | "Criar primeiro funil baseado no seu posicionamento →" |
| Active (1 funil) | Funil em andamento | Próximo estágio da Linha de Ouro ("Gerar copy →") |
| Active (campanha completa) | Launch Pad | "Diagnosticar landing page" / "Criar próximo funil" / "Exportar kit" |
| Active (com ads) | Métricas reais | "Seu ROAS caiu 15%. Ver recomendações →" |

**Cada feature auditada precisa de "next step" ao completar:**

| Feature | Ao completar | Próximo passo sugerido |
|---|---|---|
| Funil (Seção 11) | Funil aprovado | "Gerar copy para este funil →" |
| Copy (Seção 12, campanhas) | Copy aprovada | "Criar posts sociais →" |
| Social (Seção 12) | Posts gerados | "Gerar peças visuais →" |
| Design (Seção 13) | Sistema visual aprovado | "Revisar no Launch Pad →" |
| Launch Pad (Seção 12) | Kit exportado | "Diagnosticar sua LP →" / "Criar próximo funil →" |
| Intelligence (Seção 9) | Dossier gerado | "Usar insights no próximo funil →" |
| Chat (Seção 14) | Conselho recebido | "Aplicar na campanha ativa →" |

### 16.14 Resumo de Prioridades — Dashboard + Onboarding

| Problema | Severidade | Categoria | Status |
|---|---|---|---|
| 16.1 Zero aha moment no onboarding | Crítica | Progressão/Retenção | ✅ Aprovado |
| 16.4 Duas dashboards desconectadas | Crítica | UX First | ✅ Aprovado |
| 16.13 Progressão contínua em toda a plataforma | Crítica | Princípio Fundacional | ✅ Aprovado |
| 16.5 Estado "active" pobre | Alta | Produto | ✅ Aprovado |
| 16.6 Verdict desaparece | Alta | UX | ✅ Aprovado |
| 16.2 Opções iniciais não guiam | Alta | Onboarding/Retenção | ✅ Aprovado |
| 16.8 War Room assume ads | Alta | Produto | ✅ Aprovado |
| 16.3 Transição fake | Média | UX/Honestidade | ✅ Aprovado |
| 16.11 Reporting requer admin | Média | Bug | ✅ Aprovado |
| 16.10 AI Insight dispara múltiplas vezes | Média | Performance/Custo | ✅ Aprovado |
| 16.7 Sparklines fake | Baixa | Honestidade visual | ✅ Aprovado |
| 16.9 Acknowledge = console.log | Baixa | Bug | ✅ Aprovado |
| 16.12 Bugs menores (data en-US, links errados) | Baixa | Bugs | ✅ Aprovado |

**Ordem de execução:** 16.1 (aha moment — verdict visual) → 16.2+16.3 (fluxo único de onboarding) → 16.4 (unificar dashboards) → 16.5+16.6 (estado active completo + verdict permanente) → 16.13 (next steps em cada feature) → 16.8+16.11 (performance para todos) → 16.10+16.7+16.9+16.12 (fixes)
