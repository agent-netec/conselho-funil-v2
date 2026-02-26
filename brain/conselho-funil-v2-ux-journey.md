# MktHoney — Jornada do Operador Solo
## Redesign de UX, Onboarding e Lógica de Engajamento

**Versão:** 1.0 | **Data:** 25/02/2026
**Persona primária:** Operador Solo (empreendedor/infoprodutor, fatura R$10k-500k/mês)
**Frameworks aplicados:** Hook Model (Nir Eyal), Padrões de Finalização, Construção Incremental
**Base:** Análise do repositório `conselho-funil-v2` (34 sprints, 302 testes, 27 itens na sidebar)

---

## 1. DIAGNÓSTICO: POR QUE O PRODUTO NÃO RETÉM

### 1.1 Estado atual da jornada

```
Signup → Dashboard vazio → 27 itens na sidebar → "e agora?"
```

O produto tem profundidade real (6 modos de chat, funnel builder com scorecard, RAG vetorizado, Spy Agent, Autopsia de funil, Automação com Rules Runtime). Mas a superfície é hostil. O usuário que entra pela primeira vez não descobre nada disso sozinho.

### 1.2 Os 5 problemas estruturais

| # | Problema | Evidência no código |
|---|----------|-------------------|
| 1 | **Sem landing page** — ninguém sabe o que é o produto antes de criar conta | `landpage-mkthoney-structure.md` é só doc, nada implementado |
| 2 | **Onboarding superficial** — 5 steps genéricos sem trigger automático | `onboarding-store.ts`: steps fixos, sem conexão com estado real |
| 3 | **Wizard de marca é formulário, não briefing** — gera dados rasos | `step-audience.tsx`: "Quem é seu cliente ideal?" produz "mulheres 25-35" |
| 4 | **Chat é blank canvas** — sugestões fixas ignoram dados da marca | `chat-empty-state.tsx`: 4 sugestões hardcoded por modo |
| 5 | **Dashboard ignora contexto** — 4 cards genéricos, zero personalização | `page.tsx`: `NewUserDashboard()` mostra mesmos cards para todos |

### 1.3 A sidebar como sintoma

`NAV_GROUPS` em `constants.ts` define 5 grupos, 27 itens, todos expandidos por default:

- Intelligence: 9 itens
- Estratégia: 4 itens
- Execução: 7 itens
- Gestão: 4 itens
- Sistema: 2 itens

Para o Operador Solo no primeiro dia, isso é paralisia de decisão. A sidebar foi construída para a equipe de desenvolvimento navegar, não para o usuário operar.

---

## 2. A JORNADA REDESENHADA: 6 FASES

### Visão geral

```
FASE 0: Pré-Produto (Landing Page → Signup)
    ↓
FASE 1: Brand Briefing (Wizard reformulado, ~5 min)
    ↓
FASE 2: Aha Moment (Veredito Proativo do Conselho)
    ↓
FASE 3: Dashboard Contextual (sabe o que você fez, sugere o próximo passo)
    ↓
FASE 4: Segundo Loop (Funnel Builder ou Page Forensics)
    ↓
FASE 5: Terceiro Loop (Expansão — Intelligence, Automação, Social)
```

Cada fase aplica o Hook Model: **Gatilho → Ação → Recompensa → Investimento**.

---

### FASE 0: PRÉ-PRODUTO

**Objetivo:** O usuário chega na landing page, entende a proposta em 10 segundos e cria conta.

**Estado atual:** Nenhuma landing page implementada. Signup direto.

**O que precisa existir:**
- Landing page V2 implementada (estrutura já documentada em `landpage-mkthoney-structure.md`)
- Trial de 14 dias com acesso ao tier PRO (não ao Starter)
- Sem cartão de crédito no signup

**Hook Model — Fase 0:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho externo | Anúncio, indicação, post no Instagram mostrando veredito do Conselho |
| Ação | Clicar "Criar Conta Grátis" (zero fricção) |
| Recompensa | Promessa: "Seu conselho estratégico em 5 minutos" |
| Investimento | Email + senha (mínimo necessário) |

**Decisão de tier no trial:**
O trial dá acesso ao PRO por 14 dias. Motivo: o usuário precisa experimentar o máximo de valor para criar dependência. Quando o trial acaba, fazer downgrade para Starter dói — porque ele já se acostumou com Intelligence, Spy Agent e Party Mode.

---

### FASE 1: BRAND BRIEFING (Wizard Reformulado)

**Objetivo:** Coletar dados ricos o suficiente para o Conselho gerar um veredito específico.

**Estado atual:** 7 passos no wizard (`components/brands/wizard/`):
1. `step-identity.tsx` — Nome, descrição, vertical
2. `step-audience.tsx` — Cliente ideal, dor, consciência, objeções
3. `step-offer.tsx` — Produto/serviço, preço, diferencial
4. `step-logo.tsx` — Upload de logo
5. `step-visual-identity.tsx` — Paleta, tipografia, estilo visual
6. `step-ai-config.tsx` — Configuração de IA
7. `step-confirm.tsx` — Revisão e confirmação

**Problema:** Os passos 4, 5 e 6 são atrito antes do aha moment. O usuário quer ver valor, não configurar paleta de cores.

**Redesign proposto: Wizard em 2 fases**

**Fase 1A — Briefing Estratégico (3 passos, ~3 min):**
Esses 3 passos são obrigatórios antes do primeiro acesso ao Conselho.

| Passo | Hoje | Proposto |
|-------|------|----------|
| 1. Identidade | "Nome da marca" / "Descrição" / "Vertical" | Manter como está — dados básicos necessários |
| 2. Audiência | "Quem é seu cliente ideal?" → resposta genérica | "Quem é a pessoa que MAIS precisa do que você vende?" + "Qual a maior frustração dela ANTES de te encontrar?" + exemplo embutido |
| 3. Oferta | "Produto/serviço" / "Preço" / "Diferencial" | "O que você vende, por quanto, e por que alguém compraria de VOCÊ e não do concorrente?" + "O que a pessoa pensa — mas não fala — quando vê seu preço?" |

**Fase 1B — Configuração Visual (4 passos, opcional, pós-aha moment):**
Logo, paleta, tipografia e AI config ficam para depois. Aparecem no dashboard como checklist de "Complete sua marca" (barra de progresso).

**Hook Model — Fase 1:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho interno | "Quero ver o que essa IA sabe sobre meu negócio" |
| Ação | Preencher 3 telas do briefing (~3 min) |
| Recompensa | Antecipação: "Seu Conselho está analisando..." (tela de loading com copy estratégico) |
| Investimento | Dados da marca (quanto mais preenche, mais personalizada a IA fica — e mais custa abandonar) |

**Frame mental do wizard:**
A tela de abertura do wizard deve dizer algo como:
> "Responda 3 perguntas para que seu Conselho Estratégico te conheça. Quanto mais específico você for, mais afiado será o diagnóstico."

Isso não é formulário. É briefing. A mesma fricção percebida como burocracia num contexto vira investimento no outro.

**Padrão de finalização:**
- Barra de progresso no topo: "Passo 1 de 3 — Identidade"
- Ao completar passo 3: tela de transição com animação → "Seu Conselho está analisando sua marca..." → redirect para /chat

---

### FASE 2: AHA MOMENT (Veredito Proativo)

**Objetivo:** O Conselho demonstra inteligência ANTES de o usuário perguntar qualquer coisa.

**Estado atual:** Chat abre com sugestões fixas hardcoded em `chat-empty-state.tsx`. Cursor piscando. Blank canvas.

**Redesign: O Chat que já chega com o veredito**

Após completar o Brand Briefing, o usuário é redirecionado para `/chat` (NÃO para o dashboard). O Conselho já abre com uma mensagem proativa:

```
"Analisei sua marca [nome]. Veredito inicial com base no briefing:

POSICIONAMENTO: 6/10 (clareza, diferencial, saturação)
Você se posiciona como [X] mas a dor que descreveu aponta para [Y].
Isso gera confusão na headline e na promessa do funil.

OFERTA: 7/10 (ticket vs audiência, promessa, mecanismo único)
Ticket de R$[Z] para [tipo] está dentro da faixa, mas [Kennedy],
referência em copy de venda direta, diria que você está vendendo
features, não transformação.

AUDIÊNCIA: sem score ainda
Preciso saber: qual seu canal principal de aquisição e ticket médio atual?
Com isso consigo avaliar nível de consciência e recomendar abordagem de copy.

2 ações que já posso recomendar:
1. [Ação específica baseada nos dados]
2. [Ação específica baseada nos dados]

Responde a pergunta acima e eu completo o diagnóstico."
```

**Por que isso funciona:**

| Chat hoje | Chat com veredito proativo |
|-----------|--------------------------|
| Cursor piscando + sugestões genéricas | Conselho já fala primeiro, com dados do usuário |
| Usuário precisa pensar o que perguntar | Usuário só responde "aprofunda o ponto 2" |
| Primeira resposta é reativa | Primeira resposta demonstra inteligência do sistema |
| Aha depende da qualidade da pergunta | Aha é garantido pelo sistema |

**Resolução da Tensão 1 — Score com dados limitados:**
- Cada score mostra os critérios avaliados (clareza, diferencial, saturação)
- Se não há base para score, a IA diz "Preciso de mais contexto sobre [X]" em vez de inventar
- A incompletude é calculada: gera follow-up, que gera conversa, que gera engajamento

**Resolução da Tensão 2 — Conselheiros desconhecidos:**
- Nomes de conselheiros no veredito incluem contexto inline: "[Kennedy], referência em copy de venda direta"
- Nome é chip clicável que abre card lateral com: foto, frase de impacto (marco principal), especialidade no Conselho, 2-3 marcos
- Identity cards já existem em `brain/identity-cards/` (9 conselheiros documentados) — só precisa surfar na UI

**Hook Model — Fase 2:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho interno | "Será que essa IA realmente sabe algo sobre meu negócio?" |
| Ação | Ler o veredito (10-15 segundos de streaming) |
| Recompensa | "Isso é melhor que o que minha agência me entregou em 3 meses" (variável: cada veredito é diferente) |
| Investimento | Responder o follow-up → dados acumulam → próximo veredito será melhor |

**Aha moment:** "Eu preenchi 3 telas e esse negócio já sabe mais sobre o meu problema do que minha agência depois de 3 meses de contrato."

---

### FASE 3: DASHBOARD CONTEXTUAL

**Objetivo:** Quando o usuário sai do chat, o dashboard sabe o que ele fez e sugere o próximo passo.

**Estado atual:** `page.tsx` mostra `NewUserDashboard()` com 4 cards genéricos: Criar marca, Consultar Conselho, Criar funil, Explorar templates. Nenhum leva em conta o contexto.

**Redesign: Dashboard que evolui com o usuário**

O dashboard tem 3 estados progressivos:

**Estado 1 — Pré-briefing (antes de criar marca):**
```
[Tela única com CTA]
"Seu Conselho Estratégico está esperando. Configure sua marca em 3 minutos."
[Botão: Começar Briefing →]
```

**Estado 2 — Pós-aha moment (briefing feito, veredito recebido):**
```
[Hero card com resumo do veredito]
"Sua marca [nome] foi avaliada. Posicionamento: 6/10 | Oferta: 7/10"
[Botão: Continuar conversa com o Conselho]

[Próximo passo sugerido — baseado no veredito]
"O Conselho identificou gaps no seu posicionamento. Recomendação:"
→ Criar seu primeiro funil (o Conselho vai propor arquiteturas baseadas na sua marca)
→ Analisar funil existente (cole a URL e receba diagnóstico em 5 min)

[Barra de progresso: Complete sua marca]
"Sua marca está 40% configurada. Complete para respostas mais precisas:"
☑ Briefing estratégico
☐ Logo e identidade visual
☐ Documentos de marca (RAG)
☐ Configuração de IA
[45% ████░░░░░░]
```

**Estado 3 — Usuário ativo (1+ funis, conversas recorrentes):**
```
[Stats reais — funis ativos, conversas, campanhas]
[Atividade recente com contexto]
[Alertas do Conselho — insights proativos baseados nos dados acumulados]
```

**Padrão de finalização — Barra de progresso da marca:**
A barra funciona como o "perfil 60% completo" do LinkedIn. Cada item completado dá micro-celebração (checkmark animado, cor que muda, texto que atualiza).

O onboarding store (`onboarding-store.ts`) precisa ser refatorado:
- Steps atuais são genéricos e não trigam automaticamente
- Proposta: steps conectados ao estado real da marca no Firestore
- Quando o usuário completa a logo no Brand Hub, o checklist atualiza sozinho

**Sidebar progressiva (ver seção 4 para detalhes):**
No Estado 2, a sidebar mostra apenas os itens relevantes para o tier e o estágio do usuário.

**Hook Model — Fase 3:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho externo | Email/notificação: "Seu Conselho tem um insight novo sobre sua marca" |
| Ação | Abrir o dashboard, ver o progresso, clicar no próximo passo |
| Recompensa | Barra de progresso avançando + novo insight do Conselho |
| Investimento | Completar mais dados (logo, RAG docs) → produto fica melhor |

---

### FASE 4: SEGUNDO LOOP (Funnel Builder ou Page Forensics)

**Objetivo:** O usuário transforma o diagnóstico em ação.

**Dois caminhos baseados no perfil:**

| Caminho | Para quem | Ação | Tempo | Resultado |
|---------|-----------|------|-------|-----------|
| **A: Funnel Builder** | Quem quer criar algo novo | Wizard de 5 passos → Conselho gera propostas com scorecard | ~20 min | 2-3 propostas de funil com scores, riscos e ROI |
| **B: Page Forensics** | Quem já tem funil com URL | Cola URL → IA analisa e diagnostica | ~5 min | Relatório forense com pontos de otimização |

O dashboard sugere o caminho com base no veredito:
- Se o veredito apontou gaps de posicionamento → sugere Funnel Builder ("construa a arquitetura certa desde o início")
- Se o veredito disse que a oferta é boa mas precisa otimizar → sugere Page Forensics ("descubra onde seu funil atual está perdendo")

**Hook Model — Fase 4:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho interno | "Agora que sei meu diagnóstico, quero agir" |
| Ação | Completar o Funnel Builder wizard OU colar URL no Forensics |
| Recompensa | Scorecard com nota + recomendações acionáveis (variável: cada funil gera resultado diferente) |
| Investimento | Funil criado fica salvo, dados acumulam, propostas melhoram |

**Padrão de finalização:**
- Funnel Builder: barra de progresso 5 passos + celebração ao gerar propostas
- Page Forensics: loading com "Analisando [URL]..." + reveal gradual do diagnóstico
- Ambos terminam com 3 CTAs claros: EXECUTAR, AJUSTAR, MATAR (já existe no código)

---

### FASE 5: TERCEIRO LOOP (Expansão)

**Objetivo:** O usuário descobre features avançadas que justificam o upgrade de tier.

Para usuários no trial (PRO por 14 dias), essa fase acontece naturalmente. Para usuários no Starter, features avançadas aparecem como "Disponível no PRO" — visíveis mas trancadas.

**Features de expansão por ordem de descoberta natural:**

1. **Spy Agent** — "Descubra o que seus concorrentes estão fazendo" (aparece após criar funil)
2. **Offer Lab** — "Teste sua oferta contra o framework Hormozi" (aparece após Page Forensics)
3. **Content Calendar** — "Automatize sua presença social" (aparece após 3+ conversas com o Conselho)
4. **Party Mode** — "Coloque 3 especialistas para debater sua estratégia ao vivo" (aparece após 5+ conversas)

**Hook Model — Fase 5:**

| Componente | Aplicação |
|-----------|-----------|
| Gatilho interno | "Quero ir mais fundo / preciso escalar" |
| Ação | Explorar feature avançada ou fazer upgrade |
| Recompensa | Insight que não conseguiria sozinho (Spy Agent mostra o que concorrente está gastando) |
| Investimento | Mais dados, mais histórico, mais dependência do ecossistema |

---

## 3. DIVISÃO DE TIERS E IMPACTO NA UI

### 3.1 Tiers definidos

| | STARTER (R$97/mês) | PRO (R$297/mês) | AGENCY (R$597/mês) |
|---|---|---|---|
| **Posicionamento** | "Entenda seu marketing" | "Opere como uma agência" | "Escale sem equipe" |
| **Marcas** | 1 | 3 | 10+ |
| **Chat — Modos** | Geral + 1 especializado | Todos os 6 | Todos os 6 |
| **Chat — Party Mode** | Não | Sim | Sim |
| **Chat — Veredito proativo** | Sim | Sim | Sim |
| **Chat — Consultas/mês** | 50 | 300 | 1.000 |
| **Chat — Histórico** | Últimas 10 | Ilimitado | Ilimitado |
| **Funnel Builder** | 1 funil ativo | 5 funis ativos | Ilimitado |
| **Page Forensics** | 3 análises/mês | 15 análises/mês | Ilimitado |
| **Offer Lab** | Não | Sim | Sim |
| **Brand Hub — RAG docs** | 3 docs, 5MB cada | 20 docs, 25MB cada | Ilimitado |
| **Brand Hub — Visual** | Básico | Completo | Completo + White-label |
| **Intelligence Wing** | Não | Completo | Completo |
| **Execução (Campanhas, Social, Automação)** | Não | Completo | Completo |
| **Integrações (Meta, Google, Instagram)** | Não | Sim | Sim |
| **LinkedIn + Webhook/API** | Não | Não | Sim |
| **Biblioteca de Ativos** | 50 assets | 500 assets | Ilimitado |
| **Vault** | Não | Sim | Sim |
| **RBAC** | Não | Não | Sim (Sprint 37+) |

### 3.2 Sidebar por tier

A sidebar deve ser dinâmica — mostra apenas o que o tier permite.

**STARTER (8 itens, 3 grupos):**
```
ESTRATÉGIA
  Funis
  Page Forensics

CONSELHO
  Chat (com badge do modo disponível)

GESTÃO
  Minha Marca
  Biblioteca de Ativos

SISTEMA
  Configurações
  Meu Plano (com badge "Upgrade")
```

**PRO (22 itens, 5 grupos):**
Tudo habilitado exceto RBAC e White-label. Novos itens aparecem com badge "Novo" por 7 dias após upgrade.

**AGENCY (27 itens, 5 grupos):**
Tudo habilitado. Inclui workspace switcher no topo da sidebar.

### 3.3 Features trancadas — como mostrar

Features do tier superior aparecem na sidebar com ícone de cadeado e tooltip "Disponível no PRO". Ao clicar, abre modal com:
- O que a feature faz (1 frase)
- O que você ganha (benefício concreto)
- Botão de upgrade

Não esconder features — mostrar trancadas. Isso cria desejo e mostra a profundidade do produto.

---

## 4. PADRÕES DE FINALIZAÇÃO E MICRO-RECOMPENSAS

### 4.1 Onde colocar barras de progresso

| Contexto | Tipo | Gatilho de conclusão |
|----------|------|---------------------|
| Brand Briefing (wizard) | Barra linear 3 passos | Completar cada passo |
| Configuração da marca (pós-aha) | Barra % com checklist | Completar logo, visual, RAG, AI config |
| Funnel Builder | Barra linear 5 passos | Completar cada etapa do wizard |
| Trial PRO (14 dias) | Countdown + barra de features usadas | Timer + "Você usou 7 de 12 features PRO" |

### 4.2 Micro-celebrações

| Evento | Recompensa |
|--------|-----------|
| Completar Brand Briefing | Transição animada: "Seu Conselho está analisando..." |
| Receber primeiro veredito | Nenhuma interrupção — o veredito em si é a recompensa |
| Completar marca 100% | Badge "Marca Configurada" + mensagem do Conselho: "Agora posso te dar respostas 3x mais precisas" |
| Criar primeiro funil | Scorecard com animação de reveal (scores aparecem um a um) |
| Completar Page Forensics | Diagnóstico visual com pontos verdes/amarelos/vermelhos |
| Upgrade de tier | Badge + desbloqueio visual de itens na sidebar (animação) |

### 4.3 Construção incremental

O princípio: o usuário nunca precisa completar tudo de uma vez. Pode pausar, sair e voltar.

| O que salva | Onde salva | Quando restaura |
|-------------|-----------|-----------------|
| Progresso do wizard | Zustand persist + Firestore | Ao reabrir /brands/new |
| Conversa com Conselho | Firestore (já existe) | Ao reabrir /chat |
| Rascunho de funil | Firestore (já existe) | Ao reabrir /funnels/[id] |
| Checklist de onboarding | Zustand persist (já existe) | Sidebar widget |
| Features trancadas clicadas | Analytics (PostHog) | Para timing de email de upgrade |

---

## 5. SIDEBAR PROGRESSIVA — ESPECIFICAÇÃO

### 5.1 Lógica de exibição

```typescript
// Pseudo-código da sidebar progressiva
function getVisibleNavGroups(userTier: Tier, brandStatus: BrandStatus): NavGroup[] {
  const groups = [];

  // SEMPRE visível
  groups.push(STRATEGY_GROUP.filter(item => isAllowedForTier(item, userTier)));
  groups.push(COUNCIL_GROUP); // Chat sempre disponível
  groups.push(MANAGEMENT_GROUP.filter(item => isAllowedForTier(item, userTier)));
  groups.push(SYSTEM_GROUP);

  // PRO e AGENCY
  if (userTier >= 'pro') {
    groups.push(INTELLIGENCE_GROUP);
    groups.push(EXECUTION_GROUP);
  }

  // Itens trancados aparecem com cadeado
  return groups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      locked: !isAllowedForTier(item, userTier),
      isNew: wasRecentlyUnlocked(item, userTier),
    }))
  }));
}
```

### 5.2 Mudanças necessárias no código

| Arquivo | Mudança |
|---------|---------|
| `lib/constants.ts` → `NAV_GROUPS` | Adicionar campo `minTier` a cada item |
| `components/layout/sidebar.tsx` | Filtrar itens por tier + renderizar cadeado para trancados |
| `lib/stores/onboarding-store.ts` | Refatorar para conectar com estado real da marca no Firestore |
| `components/layout/onboarding-checklist.tsx` | Substituir steps fixos por steps dinâmicos baseados no tier |
| `app/page.tsx` | 3 estados de dashboard (pré-briefing, pós-aha, ativo) |
| `components/chat/chat-empty-state.tsx` | Substituir sugestões fixas por veredito proativo baseado em dados da marca |
| `components/brands/wizard/` | Reorganizar em Fase 1A (3 passos obrigatórios) e Fase 1B (4 passos opcionais) |

---

## 6. EMAILS E GATILHOS EXTERNOS

O Hook Model exige gatilhos externos para trazer o usuário de volta. Sem eles, o loop morre.

### 6.1 Sequência de emails (Trial PRO — 14 dias)

| Dia | Assunto | Objetivo |
|-----|---------|----------|
| 0 | "Seu Conselho Estratégico está pronto" | Trazer de volta para completar briefing (se não completou) |
| 1 | "Seu veredito inicial — [nome da marca]" | Resumo do veredito + CTA para continuar conversa |
| 3 | "O Conselho tem uma recomendação de funil para você" | Empurrar para Fase 4 (Funnel Builder) |
| 5 | "3 coisas que seu concorrente está fazendo (e você não)" | Apresentar Spy Agent (feature PRO) |
| 7 | "Meio do trial: você já usou X de 12 features" | Progresso + FOMO de features não exploradas |
| 10 | "Party Mode: 3 especialistas debateram sua estratégia" | Entregar valor proativo de feature PRO que o cara não explorou |
| 12 | "Seu trial acaba em 2 dias" | Urgência + comparativo Starter vs PRO |
| 14 | "Trial encerrado — o que você mantém e o que perde" | Perda aversão: lista específica do que vira Starter |

### 6.2 Notificações in-app

| Trigger | Notificação |
|---------|-------------|
| Marca 100% configurada | "Seu Conselho agora tem contexto completo. As respostas ficaram 3x mais precisas." |
| 5 conversas no chat | "Party Mode desbloqueado — convoque 3 especialistas para debater sua estratégia" (se tier permitir) |
| Funil criado há 7 dias sem ação | "Seu funil [nome] foi avaliado 8/10 mas está parado. O Conselho sugere: [ação]" |
| Nova feature no tier desbloqueada por upgrade | Badge "Novo" na sidebar por 7 dias |

---

## 7. MÉTRICAS DE SUCESSO

| Métrica | Estado atual | Meta |
|---------|-------------|------|
| Tempo do signup ao aha moment | Desconhecido (sem tracking) | < 8 minutos |
| % de usuários que completam Brand Briefing | Desconhecido | > 70% |
| % de usuários que recebem veredito proativo | 0% (não existe) | > 65% |
| % de usuários que criam funil (Fase 4) | Desconhecido | > 30% |
| Trial → Pagante (conversão) | N/A | > 15% |
| Starter → PRO (upgrade) | N/A | > 20% em 60 dias |
| DAU/MAU (engajamento) | N/A | > 25% |
| Churn mensal | N/A | < 8% |

---

## 8. PRIORIZAÇÃO DE IMPLEMENTAÇÃO

### Sprint recomendada: S36-UX (antes ou paralela ao Advanced Reporting)

| Prioridade | Item | Esforço | Impacto |
|-----------|------|---------|---------|
| **P0** | Wizard em 2 fases (3 passos obrigatórios + 4 opcionais) | ~8h | Alto — melhora qualidade dos dados para IA |
| **P0** | Veredito proativo no chat (substituir blank canvas) | ~12h | Crítico — é o aha moment inteiro |
| **P0** | Dashboard contextual (3 estados) | ~10h | Alto — resolve o "e agora?" pós-aha |
| **P0** | Sidebar progressiva por tier | ~6h | Alto — resolve paralisia de 27 itens |
| **P1** | Cards de conselheiros (inline no chat) | ~4h | Médio — resolve tensão de autoridade |
| **P1** | Barra de progresso da marca (checklist pós-aha) | ~4h | Médio — micro-recompensas |
| **P1** | Tier system (feature flags por plano) | ~10h | Alto — monetização |
| **P2** | Sequência de emails (trial 14 dias) | ~8h | Médio — retenção |
| **P2** | Notificações in-app | ~6h | Médio — re-engajamento |
| **P2** | Landing page V2 implementação | ~16h | Alto, mas depende de design final |

**Esforço total estimado P0:** ~36h
**Esforço total estimado P0+P1:** ~52h
**Esforço total completo:** ~84h

---

## 9. RISCOS E CONTRA-PONTOS

| Risco | Mitigação |
|-------|-----------|
| Veredito proativo genérico (dados rasos do wizard) | Perguntas do wizard com exemplos embutidos + IA que admite limitações em vez de inventar |
| Sidebar trancada frustra em vez de motivar | Features trancadas mostram preview do que fazem + trial PRO dá acesso completo por 14 dias |
| 3 tiers complica pricing | Starter a R$97 é barreira baixa, PRO a R$297 é o anchor, Agency existe mas não é foco inicial |
| Refatorar onboarding durante sprints de feature | Sprint dedicada de UX — não tentar enfiar dentro de S36 (Reporting) |
| Custo de tokens aumenta com veredito proativo | Veredito usa gemini-2.0-flash (barato) + cacheável por marca (mesmo contexto = mesma chamada base) |

---

## 10. MAPA DE DEPENDÊNCIAS COM ROADMAP EXISTENTE

```
S35 (Predictive Intelligence) ✅ CONCLUÍDA
    ↓
S36-UX (Esta sprint — Onboarding & Journey) ← INSERIR AQUI
    ↓
S36 (Advanced Reporting) — pode rodar em paralelo
    ↓
S37 (Enterprise Foundation — Multi-Workspace + RBAC)
    ↓
S38+ (White-Label, Img2Img, Beyond)
```

A sprint de UX deve entrar ANTES do Enterprise Foundation (S37) porque:
1. O tier system precisa existir antes do RBAC
2. A sidebar progressiva precisa existir antes de multi-workspace
3. Sem onboarding funcional, Enterprise escala um produto que ninguém entende

---

*Documento gerado com base na análise completa do repositório conselho-funil-v2 (256 commits, 34 sprints, 302 testes, 27 itens de sidebar, 9 identity cards, 7 passos de wizard, 6 modos de chat).*
