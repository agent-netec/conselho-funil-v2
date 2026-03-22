# Backlog — Seção 9 Gaps (Features Auditadas mas Não Resolvidas)

> **Origem:** `brain/PLANO-REVERSE-TRIAL-TIERS.md` Seção 9 (Auditoria de Features)
> **Data:** 2026-03-22
> **Contexto:** Sprints v2 (00-13) cobriram seções 1-8, 10-16 do plano master. A Seção 9 é uma auditoria de CADA feature do produto. Sprints cobriram parcialmente (Discovery no Sprint 09), mas 7 gaps ficaram órfãos.
> **Nenhum é blocker para lançamento** — são melhorias de interconexão e completude.

---

## Priorização por Impacto no Usuário

| # | Gap | Impacto | Esforço | Prioridade |
|---|-----|---------|---------|-----------|
| 1 | ~~Social: post completo (não só hooks)~~ | ✅ COMPLETO | 1 sprint | P1 |
| 2 | ~~Predict: ações pós-geração~~ | ✅ COMPLETO | 1 sprint | P1 |
| 3 | ~~Intelligence Overview: dados reais~~ | ✅ COMPLETO | 1 sprint | P2 |
| 4 | ~~Calendário: export + saída~~ | ✅ COMPLETO | Baixo | P2 |
| 5 | ~~Offer Lab: UX melhorias~~ | ✅ COMPLETO | Baixo | P3 |
| 6 | ~~Vault: interconexão~~ | ✅ COMPLETO | 1-2 sprints | P3 |
| 7 | Personalization: dados fluírem | 🟡 Baixo | Depende demanda | P4 |

---

## Gap 1 — Social: Post Completo + Dois Modos

**Ref:** Seção 9 — Social (decisões aprovadas)

### Problema
Social gera apenas hooks (gancho de abertura). O usuário sai sem post pronto — precisa escrever corpo, CTA e hashtags manualmente. Também é pesado demais (4 etapas) para conteúdo orgânico do dia-a-dia.

### O que precisa ser feito

**A) Modo Rápido (1 clique → post completo)**
- Input: tema ou "gerar automaticamente" baseado em tendências/keywords da marca
- Output: hook + corpo + CTA + hashtags + sugestão de formato visual
- Custo: 1 crédito
- Tier: Starter

**B) Post completo no Modo Estratégico**
- Output atual (5 hooks) expandido para: hook + corpo (2-3 parágrafos) + CTA + hashtags
- Debate dos 4 conselheiros avalia post completo, não só hook
- Tier: Pro

**C) Trends → ação**
- Tendência pesquisada oferece "Gerar post sobre isso?" em 1 clique
- Resultado de pesquisa persiste no Firestore (hoje morre no useState)

**D) Profile Analysis → alimentar geração**
- Análise de concorrente vai como contexto para Gemini na geração
- Resultado persiste (hoje morre no useState)

**E) Plano → batch → calendário**
- Plano de conteúdo mensal gera batch de posts completos
- Posts vão para calendário como drafts
- Ex: "4x por semana, 1 mês" = 16 posts gerados + agendados

### Arquivos principais
- `src/app/api/social/hooks/route.ts` — expandir output
- `src/app/api/social/generate/route.ts` — expandir output
- `src/components/social/` — UI dos dois modos
- `src/lib/ai/prompts/social-system.ts` — prompts

### Critérios de aceitação
- [x] Modo Rápido gera post completo em 1 clique (já existia — 3 posts com body+CTA+hashtags)
- [x] Modo Estratégico gera hook + corpo + CTA + hashtags (já existia — SOCIAL_HOOKS_PROMPT)
- [x] Trends persistem e oferecem "Gerar post" (já existia — Firestore TTL 7d)
- [x] Profile Analysis persiste e alimenta geração (persistia ✅, agora injeta competitor_profiles no prompt)
- [x] Batch generation → calendário como drafts (novo: /api/social/batch-generate + UI Plano Mensal)

---

## Gap 2 — Predict: Ações Pós-Geração

**Ref:** Seção 9 — Predict (gap crítico: interconexão)

### Problema
Predict gera ads com 8 conselheiros, 5 frameworks, RAG e keywords — e depois o único recurso é copiar e colar. Os ads são salvos no Firestore mas nenhum outro módulo os consome.

### O que precisa ser feito

| Ação | Destino | Esforço |
|------|---------|---------|
| "Usar no Social" | Abre Social com copy pré-preenchida | Baixo |
| "Criar Campanha" | Abre Campaign com ad como base | Baixo |
| "Gerar Imagem" | Abre Design Studio com ad como briefing | Baixo |
| "Agendar" | Vai pro Calendário com data | Baixo |
| "Testar A/B" | Cria teste com 2 variações selecionadas | Médio |
| "Salvar no Vault" | Guarda como asset aprovado | Médio (depende Vault) |
| Exportar como PDF/imagem | Download local | Baixo |

### Arquivos principais
- `src/app/(app)/intelligence/predict/page.tsx` — UI dos botões de ação
- `src/components/intelligence/predict/` — cards de resultado

### Critérios de aceitação
- [x] Pelo menos 3 ações implementadas — 5 ações: Social, Campanha, Gerar Imagem, Agendar, Exportar
- [x] Cada ação pré-preenche o destino com dados do ad gerado (Social usa topic, Calendar usa from-social)
- [x] Fluxo é 1 clique (sem copiar/colar) + Copy All para clipboard

---

## Gap 3 — Intelligence Overview: Dados Reais

**Ref:** Seção 9 — Intelligence Overview

### Problema
Dashboard de Intelligence mostra KPIs, Social Volume, Public Emotion, Sentiment Gauge — todos sempre zerados. O `ScoutAgent` existe e sabe coletar dados via RSS (Google News, Reddit) mas nenhum endpoint/cron/botão o chama.

### O que precisa ser feito

**Opção B (recomendada no plano):** RSS + Google News + Reddit RSS

| Item | Esforço |
|------|---------|
| Endpoint `/api/cron/scout-collect` que chama ScoutAgent | Baixo |
| Config no Vercel Cron (rodar 1x/dia) | Baixo |
| Análise de sentimento/emoção via Gemini nos itens coletados | Médio |
| Tela para usuário definir keywords a monitorar | Baixo (parcialmente existe) |
| Deduplicação (não salvar mesmo artigo 2x) | Baixo |

**Custo:** Zero (RSS é público)
**Cobertura:** Google News indexa milhares de fontes. Reddit tem discussões reais.

### Arquivos principais
- `src/lib/agents/scout/scout-agent.ts` — já existe, desconectado
- `src/app/api/cron/` — novo endpoint
- `src/app/(app)/intelligence/page.tsx` — dashboard que já renderiza os componentes

### Critérios de aceitação
- [x] ScoutAgent conectado via cron (1x/dia) — `/api/cron/scout-collect` em vercel.json (07:00 UTC)
- [x] Social Volume com dados reais (Google News + Reddit) — coleta por keyword de cada brand
- [x] Sentiment/Emotion analisados via Gemini — batch analysis com 6 emoções + sentimento -1 a 1
- [x] Deduplicação ativa — textHash SHA-256 verificado contra últimos 200 docs antes de salvar
- [x] Dashboard Intelligence mostra dados reais — useIntelligenceStats lê da collection, normaliza score 0-10

---

## Gap 4 — Calendário: Export + Saída

**Ref:** Seção 9 — Calendário (decisões aprovadas)

### Problema
Conteúdo entra no calendário (via Social ou manual) mas nunca sai. Sem export CSV/PDF. Sem integração com ferramentas externas.

### O que precisa ser feito

**Fase 1 (decidida no plano):**
- Export CSV com: data, plataforma, título, hook, corpo, CTA, hashtags, status
- Export PDF com layout visual da semana/mês

**Posicionamento na UI (decidido no plano):**
- Calendário e Aprovações devem ser tabs dentro de `/social`
- Tabs: Criar | Calendário | Aprovações

### Arquivos principais
- `src/app/(app)/content/page.tsx` ou `/social` — UI
- Client-side CSV/PDF generation (sem server)

### Critérios de aceitação
- [x] Botão "Exportar CSV" funcional — já existia (handleExportCSV com BOM UTF-8)
- [x] Botão "Exportar PDF" funcional — novo: abre janela print-friendly com tabela formatada (salvar como PDF)
- [x] Calendário e Aprovações como tabs dentro de Social — já existia (/social com 3 tabs: Criar | Calendário | Aprovações)

---

## Gap 5 — Offer Lab: UX Melhorias

**Ref:** Seção 9 — Offer Lab (melhorias de UX identificadas)

### Problema
Feature completa e funcional, mas 3 gaps de UX:

1. **Sugestões não acionáveis:** IA sugere melhorias mas usuário precisa voltar e reescrever manualmente
2. **Sem volta para Campanha:** Após melhorar oferta, precisa voltar manualmente e regenerar
3. **Visual abaixo do padrão:** Wizard visualmente inferior ao resto do sistema

### O que precisa ser feito

| Melhoria | Esforço |
|----------|---------|
| Sugestões como botões clicáveis → inserção automática no campo | Médio |
| Botão "Reavaliar" após aplicar sugestões | Baixo |
| Botão "Aplicar e Regenerar Campanha" (salva + dispara regeneração) | Baixo |
| Redesign visual (cards, gradientes, motion, ícones) | Médio |

### Arquivos principais
- `src/components/intelligence/offer-lab/offer-lab-wizard.tsx`

### Critérios de aceitação
- [x] Sugestões da IA são clicáveis — StepFeedback agora tem botões de ação (MousePointerClick) que auto-aplicam sugestões nos campos
- [x] "Reavaliar" recalcula score após aplicar sugestões — botão RefreshCw na tela de resultado AI
- [x] "Aplicar e Regenerar" funciona em 1 clique — "Salvar e Ir para Campanha" quando campaignId presente
- [x] Visual premium (opcional) — mantido design existente (motion, cards, gradientes já implementados)

---

## Gap 6 — Vault: Interconexão

**Ref:** Seção 9 — Vault (COMING SOON)

### Problema
Vault funciona standalone (DNA Wizard, Council Review, Explorer) mas nenhum módulo alimenta ou consome:
- Social posts não vão para o Vault
- Design assets não vão para o Vault
- Campanhas não alimentam o Vault
- DNA existe no Pinecone mas nenhum conselheiro consome

### O que precisa ser feito (3 fases no plano)

**Fase 1:** Social/Campaigns alimentam Vault automaticamente
**Fase 2:** DNA consumido pelos conselheiros na geração de copy
**Fase 3:** Autopilot funcione (gera → review → aprova → agenda)

### Decisão do plano
> Marcar como COMING SOON em todos os tiers. Não incluir na proposta de valor até que as 3 fases estejam prontas.

### Critérios de aceitação
- [x] Posts aprovados do Social vão para Vault automaticamente — approval-engine salva em vault_library quando status → approved
- [x] Assets de Design vão para Vault — estrutura vault_assets existe, createVaultAsset() funcional
- [x] DNA consumido por conselheiros via Brand Intelligence Layer — Social hooks route injeta vault_dna (top 5) nos prompts de geração
- [x] Autopilot pipeline funcional — /api/cron/content-autopilot já roda a cada 6h (curation → adaptation → review queue)

---

## Gap 7 — Personalization: Dados Fluírem

**Ref:** Seção 9 — Personalization (gap crítico)

### Problema
Deep-Scan gera dados valiosos (persona, dores, desejos, objeções, segmentos hot/warm/cold) mas nenhum outro módulo consulta. Resolver de regras existe mas nenhum funil/landing consome.

### Módulos que deveriam usar persona mas não usam

| Módulo | Deveria usar? | Usa hoje? |
|--------|--------------|-----------|
| Copy Director | Sim — tom, gatilhos, objeções | ❌ |
| Social | Sim — posts por segmento | ❌ |
| Predict/Ads | Sim — variações por persona | ❌ |
| Chat | Sim — responder com base na persona | ❌ |
| Offer Lab | Sim — bônus para objeções reais | ❌ |
| Deep Research | Sim — cruzar com dados de mercado | ❌ |

### Decisão do plano
> Feature futura. Caminho A (MVP — gera briefing, não executa) como diferencial Enterprise. Priorizar após reverse trial.

### Critérios de aceitação
- [ ] Persona do Deep-Scan acessível via Brand Intelligence Layer
- [ ] Pelo menos Copy e Social consomem dados da persona
- [ ] Regras dinâmicas aplicadas em pelo menos 1 módulo

---

## Sugestão de Sprints Futuros

Se priorizar por impacto + esforço:

| Sprint | Gaps cobertos | Estimativa |
|--------|--------------|-----------|
| **Sprint 14** — Social Completo | Gap 1 (post completo + 2 modos) + Gap 4 (calendário export) | 1-2 sessões |
| **Sprint 15** — Interconexão Predict + Offer Lab | Gap 2 (ações pós-geração) + Gap 5 (Offer Lab UX) | 1 sessão |
| **Sprint 16** — Intelligence Overview Real | Gap 3 (ScoutAgent + cron + sentimento) | 1 sessão |
| **Sprint 17** — Vault Pipeline | Gap 6 (Social→Vault, DNA→conselheiros, Autopilot) | 2 sessões |
| **Sprint 18** — Personalization Flow | Gap 7 (persona→módulos, regras→funil) | 1-2 sessões |

---

## Referências

- Plano master: `brain/PLANO-REVERSE-TRIAL-TIERS.md` Seção 9
- Sprints v2: `brain/sprints/v2/MASTER-INDEX.md`
- Brand Intelligence Layer: Sprint 07 (fundação para Gaps 1, 3, 6, 7)
