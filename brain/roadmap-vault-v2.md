# Plano: Creative Vault v2

**Status:** PLANEJADO — documentado durante QA Sprint I.
**Data:** 2026-02-16

---

## Estado Atual (Diagnostico)

### O que esta funcionando
- **DNA Templates** — CRUD completo em `brands/{brandId}/vault/dna/`. Tipos: hook, structure, style_guide, template. Sincronizado com Pinecone para busca semantica via `VaultSearchService`
- **Vault Library** — Posts aprovados em `brands/{brandId}/vault/library/` com variantes multi-plataforma (X, LinkedIn, Instagram)
- **Approval Workflow** — Maquina de estados completa: draft → review → approved → published → archived. Historico append-only
- **Vault Explorer** — 3 sub-tabs (Library, Copy DNA, Media Assets) com grid/list toggle, busca, duplicar, deletar
- **Media Assets** — `brands/{brandId}/vault/assets/` com thumbnails em grid 6 colunas
- **Contadores reais** — "0 APROVADOS" e "0 DNA TEMPLATES" sao queries reais ao Firestore

### Arquitetura existente (nao conectada)
- **ContentCurationEngine** (`lib/agents/publisher/curation-engine.ts`) — Busca insights de alta relevancia (>0.7), encontra Copy DNA compativel via semantic search
- **AdaptationPipeline** (`lib/agents/publisher/adaptation-pipeline.ts`) — Gera variantes multi-plataforma via Gemini 2.0 Flash
- **Publisher Jobs** (`brands/{brandId}/publisher/jobs`) — Fila de publicacao real
- **Approval Engine** (`lib/content/approval-engine.ts`) — Status machine com historico (192 linhas)

### O que esta quebrado/incompleto

#### 1. Content Autopilot desconectado (CRITICO)
- `ContentCurationEngine` e `AdaptationPipeline` existem como classes mas **nenhum trigger** (CRON, webhook, API route) as executa
- Review Queue fica eternamente vazia
- A mensagem "O Content Autopilot notificara voce..." e promessa nao cumprida

#### 2. Botao "+ Novo Ativo" sem handler
- Botao existe no header mas sem `onClick` — nao faz nada ao clicar

#### 3. Botao "Historico" sem handler
- Botao existe no header mas sem `onClick` — nao faz nada ao clicar
- Dados de historico existem em `content_calendar/{itemId}/history` (append-only)

#### 4. Aba "Configuracoes" vazia
- `TabsTrigger` definido mas sem `TabsContent` — tab abre em branco
- Deveria ter: regras de auto-aprovacao, notificacoes, gerenciamento de DNA, toggles de integracao

#### 5. "Editar" na Review Queue e stub
- Botao "Editar" no approval workspace nao implementado

#### 6. "Ver Detalhes" no Explorer e stub
- Botao presente mas sem handler implementado

#### 7. Sem auto-refresh na Review Queue
- Nao faz polling — usuario precisa recarregar pagina manualmente

---

## Fase 1 — Ativar Content Autopilot (PRIORIDADE MAXIMA)

### 1.1 Criar API Route para Content Autopilot
- **Novo arquivo:** `app/src/app/api/content/autopilot/route.ts`
- **Flow:**
  1. Recebe brandId
  2. Busca insights recentes com `relevance > 0.7` em `brands/{brandId}/intelligence/`
  3. Chama `ContentCurationEngine.curate(insights, brandDNA)`
  4. Chama `AdaptationPipeline.adapt(curatedContent, platforms)`
  5. Salva variantes na Review Queue com `status: 'review'`
  6. Retorna count de items criados
- **Modelo:** DEFAULT_GEMINI_MODEL (geracao em batch)

### 1.2 Configurar CRON ou Trigger Manual
- **Opcao A (MVP):** Botao "Rodar Autopilot" na pagina do Vault
- **Opcao B (Ideal):** Vercel CRON a cada 6h: `/api/cron/content-autopilot`
- **Opcao C (Event-driven):** Trigger quando novo insight com relevance > 0.7 e salvo
- **Recomendacao:** Comecar com Opcao A (botao manual) + migrar para Opcao B

### 1.3 Conectar Botoes Stub
- **"+ Novo Ativo"** → Abrir modal com opcoes:
  - Criar DNA Template manualmente
  - Upload de media asset
  - Criar post manualmente (draft)
- **"Historico"** → Modal ou drawer listando `approval_history` subcollection
- **"Editar"** na Review Queue → Inline editor de copy por plataforma
- **"Ver Detalhes"** no Explorer → Modal com todas as variantes + metricas

### 1.4 Implementar Tab Configuracoes
- **Novo conteudo no TabsContent "settings":**
  - Toggle: Auto-aprovar quando score > X (threshold configuravel)
  - Toggle: Notificar por email/in-app quando novo item na fila
  - Lista de plataformas ativas (X, LinkedIn, Instagram)
  - Frequencia do Autopilot (manual, 6h, 12h, 24h)

### Creditos: 1 por execucao do Autopilot (geracao multi-plataforma)

---

## Fase 2 — DNA Templates Melhorados

### 2.1 Criacao Assistida de DNA
- **Novo:** Wizard para criar DNA Template com ajuda da IA
- **Flow:**
  1. Usuario cola exemplo de copy que gosta
  2. Gemini extrai padrao: hook type, structure, tone, CTA style
  3. Salva como DNA Template com tags automaticas
- **Beneficio:** Facilita criacao sem expertise em copywriting

### 2.2 DNA Performance Tracking
- **Expandir:** `performance_metrics` no DNA Template
- **Adicionar:** `conversion_rate`, `engagement_rate`, `best_platform`
- **Source:** Quando post usando DNA e publicado, trackear resultado e atualizar DNA
- **UI:** Badge de performance nos cards do DNA (ex: "Este DNA gera 2.3x mais engajamento")

### 2.3 DNA Recommendations
- **Novo:** Baseado no historico de aprovacoes, sugerir DNA Templates mais efetivos
- **Semantic:** Quando usuario cria post manual, sugerir DNA similar ao que ja funcionou
- **UI:** Secao "DNA Recomendados" no Vault Explorer

### Creditos: 1 por criacao assistida

---

## Fase 3 — Review Queue Avancada

### 3.1 Bulk Actions
- **Novo:** Selecionar multiplos items e aprovar/rejeitar em batch
- **UI:** Checkboxes nos cards + barra de acoes flutuante
- **Util:** Quando Autopilot gera varios posts de uma vez

### 3.2 Edit Inline Completo
- **Implementar:** Editor de copy por plataforma na Review Queue
- **Features:** Markdown, preview por plataforma (card Twitter, card Instagram, card LinkedIn)
- **Auto-save:** Salvar draft a cada 5s
- **Regenerate:** Botao "Regenerar esta variante" mantendo DNA + tema

### 3.3 Scheduling Integrado
- **Novo:** Ao aprovar, opcionalmente agendar no Content Calendar
- **UI:** Date picker inline na aprovacao
- **Conecta:** `createCalendarItem()` do Content Calendar

### 3.4 Auto-Refresh com Polling
- **Implementar:** Verificar novos items a cada 30s quando tab Review Queue ativa
- **Badge:** Mostrar contador de novos items no tab

### Creditos: 0

---

## Fase 4 — Publicacao Real (Depende Sprint L — OAuth)

### 4.1 Conectar Publisher Jobs
- **Prerequisito:** OAuth Meta/Google/TikTok (Sprint L)
- **Flow:** Vault Library → "Publicar" → selecionar plataforma → Publisher Job → API real
- **Status tracking:** `published` com link para o post real

### 4.2 Metricas Pos-Publicacao
- **Apos publicar:** Monitorar engajamento por 24-72h
- **Feedback loop:** Atualizar DNA Template com performance real
- **Comparativo:** "Posts usando DNA #3 tem 40% mais engajamento que DNA #7"

### 4.3 A/B Testing Automatico
- **Novo:** Publicar 2 variantes do mesmo conteudo (ex: hook A vs hook B)
- **Medir:** Qual variante performa melhor
- **Aprender:** Atualizar DNA com variante vencedora

### Creditos: 0 (APIs de publicacao)

---

## Fase 5 — Integracao com Conselho

### 5.1 Debate do Conselho antes de Aprovar
- **Reutilizar:** `buildPartyPrompt()` + `buildPartyBrainContext()`
- **Flow:** Antes de aprovar post na Review Queue, consultar conselheiros sociais
- **Modelo:** PRO_GEMINI_MODEL (decisao critica)
- **UI:** Parecer do conselho visivel na Review Queue

### 5.2 Copy DNA Avaliado pelo Conselho
- **Novo:** Ao criar DNA Template, conselheiros avaliam qualidade
- **Score:** Cada conselheiro da nota + feedback
- **Ranking:** DNA Templates ordenados por score do conselho

### Creditos: 1 por consulta ao conselho

---

## Arquivos Criticos

| Arquivo | Fase | Acao |
|---------|------|------|
| `app/src/app/vault/page.tsx` | 1 | Conectar botoes stub + tab settings |
| `app/src/components/vault/approval-workspace.tsx` | 1,3 | Implementar editar + bulk actions |
| `app/src/components/vault/vault-explorer.tsx` | 1,2 | Ver Detalhes + DNA recommendations |
| `app/src/lib/agents/publisher/curation-engine.ts` | 1 | Ja existe, precisa de trigger |
| `app/src/lib/agents/publisher/adaptation-pipeline.ts` | 1 | Ja existe, precisa de trigger |
| `app/src/lib/firebase/vault.ts` | 1,2 | CRUD ja funcional, expandir queries |
| `app/src/lib/vault/search-service.ts` | 2 | Expandir semantic search para recommendations |
| `app/src/lib/content/approval-engine.ts` | 3 | Status machine ja funcional |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/app/api/content/autopilot/route.ts` | 1 |
| `app/src/app/api/cron/content-autopilot/route.ts` | 1 |
| `app/src/components/vault/dna-wizard.tsx` | 2 |
| `app/src/components/vault/vault-settings.tsx` | 1 |
| `app/src/components/vault/review-editor.tsx` | 3 |

## Dependencias

```
Fase 1 (Ativar Autopilot) → Independente, pode ser feita em qualquer sprint
Fase 2 (DNA Melhorado) → Depende parcialmente da Fase 1
Fase 3 (Review Queue) → Depende da Fase 1 (precisa ter items na fila)
Fase 4 (Publicacao Real) → Depende do Sprint L (OAuth)
Fase 5 (Conselho) → Independente, pode rodar com Fase 1
```

**Fase 1 e critica** — sem o trigger do Content Autopilot, o Vault inteiro e uma "fabrica desligada".
A boa noticia: as pecas ja existem (`ContentCurationEngine`, `AdaptationPipeline`), so falta ligar.
