# Sprint H — Consolidation (Duplicacoes + Brain Extras)

> Fase: Pos-Auditoria — Unificacao e Polimento
> Status: PENDENTE
> Dependencia: Sprint G concluido
> Estimativa: ~14h total

---

## Resumo

Unificar as rotas duplicadas de ad generation, integrar brain context no Copy Generation Lab, e adicionar red_flags ao prompt de copy. Este sprint reduz divida tecnica e eleva a qualidade das ultimas engines sem brain.

---

## Tarefas

### H1. Unificar Ad Generation (P1-4)

- **Rota 1:** `app/src/app/api/intelligence/creative/generate-ads/route.ts` (SEM brain, SEM RAG)
- **Rota 2:** `app/src/app/api/campaigns/[id]/generate-ads/route.ts` (COM brain, COM RAG)
- **Problema:** Mesmo proposito, implementacoes 100% diferentes, brain inconsistente
- **Mudanca:**
  1. Rota 1 se torna o endpoint canonico. Adicionar:
     - Brain context (importar `buildAdsBrainContext()` de `ads-brain-context.ts`)
     - RAG context (replicar padrao da Rota 2)
     - Brand context (replicar padrao da Rota 2)
  2. Rota 2 se torna proxy leve que:
     - Extrai campaign context do Firestore
     - Chama Rota 1 internamente (ou reutiliza mesma funcao)
     - Atualiza `campaigns/{campaignId}.ads` apos geracao
  3. Unificar custo: 5 creditos para ambas
  4. Unificar persistencia: salvar em `brands/{brandId}/generated_ads` sempre
- **PRESERVAR:** Output da Rota 2 (strategy + insights) — adicionar ao output da Rota 1
- **Estimativa:** 8-12h
- **Verificacao:** Ambas as rotas retornam ads com brain context. Rota 2 e proxy da Rota 1
- **Status:** PENDENTE

#### Prompt de Handoff — H1 → H2

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprints E/F/G concluidos. Sprint H e sobre consolidacao.

TAREFA CONCLUIDA (H1): Ad generation unificada.
- /api/intelligence/creative/generate-ads agora e o endpoint canonico (com brain + RAG + brand context)
- /api/campaigns/[id]/generate-ads agora e proxy leve que chama o canonico
- Custo unificado: 5 creditos
- Persistencia: brands/{brandId}/generated_ads

PROXIMA TAREFA (H2): Copy Generation Lab — Brain Integration.

ARQUIVO: app/src/lib/intelligence/creative/copy-gen.ts (ou buscar por CopyGenerationLab)

PROBLEMA: O Copy Generation Lab gera variantes por angulo psicologico (fear, greed, authority, curiosity) usando apenas brand voice. NAO usa identity cards.

REFERENCIA: Ler copy-brain-context.ts criado no Sprint F para entender o padrao.

MAPEAMENTO ANGULO → COUNSELORS:
- fear: gary_halbert (psychological_triggers) + john_carlton (hook_and_fascinations)
- greed: joseph_sugarman (slippery_slide) + dan_kennedy_copy (offer_architecture)
- authority: claude_hopkins (scientific_testing) + david_ogilvy (big_idea_test)
- curiosity: eugene_schwartz (awareness_alignment) + gary_halbert (headline_score)

MUDANCA:
1. No arquivo copy-gen.ts (ou equivalente): adicionar ANGLE_COUNSELOR_MAP
2. Criar metodo buildAngleBrainContext(angle) dentro da classe ou como funcao standalone
3. Para cada angulo: loadBrain() dos 2 counselors, extrair framework relevante + red_flags (top 2)
4. Injetar no prompt de geracao (metodo buildPrompt ou equivalente)
5. NAO alterar a interface publica da classe nem o formato de output

FUNCOES DISPONIVEIS:
import { loadBrain, getFramework } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';

TOKEN BUDGET: 2 counselors × ~400 tokens = ~800 tokens por angulo (confortavel para Gemini Flash)

VERIFICACAO: Variantes de copy refletem expertise dos counselors especificos do angulo. Fear copy usa Halbert triggers, authority usa Hopkins proofs, etc.
```

---

### H2. Copy Generation Lab — Brain Integration (P2-1)

- **Arquivo:** `app/src/lib/intelligence/creative/copy-gen.ts` (buscar `CopyGenerationLab`)
- **Problema:** Gera variantes por angulo (fear/greed/authority/curiosity) sem identity cards
- **Mapeamento angulo → counselors:**
  - fear → halbert (psychological_triggers) + carlton (hook_and_fascinations)
  - greed → sugarman (slippery_slide) + kennedy_copy (offer_architecture)
  - authority → hopkins (scientific_testing) + ogilvy (big_idea_test)
  - curiosity → schwartz (awareness_alignment) + halbert (headline_score)
- **Mudanca:**
  1. Adicionar `ANGLE_COUNSELOR_MAP`
  2. Criar `buildAngleBrainContext(angle)` — carrega 2 counselors, extrai frameworks + red_flags
  3. Injetar no prompt de geracao
- **PRESERVAR:** Interface publica da classe, formato de output
- **Token budget:** ~800 tokens por angulo
- **Estimativa:** 3-4h
- **Verificacao:** Variantes refletem expertise dos counselors especificos
- **Status:** PENDENTE

#### Prompt de Handoff — H2 → Build

```
CONTEXTO: Projeto Conselho de Funil v2, Next.js 16, app/ como root.
Sprint H — consolidacao.

TAREFAS CONCLUIDAS:
- H1: Ad generation unificada (endpoint canonico + proxy)
- H2: Copy Generation Lab com brain integration (4 angulos × 2 counselors)

TAREFA FINAL: Build verification.
Rodar: cd app && npm run build
Verificar: Zero erros, anotar tempo de compilacao.
Se houver erros: corrigir apenas erros introduzidos neste sprint (NAO erros pre-existentes).

APOS BUILD: Sprint H completo. Atualizar changelog no sprint-h.md.
```

---

## Verificacao Sprint H

- [ ] Ad generation unificada: endpoint canonico com brain + RAG + brand
- [ ] Rota de campaigns e proxy do canonico
- [ ] Custo unificado de ads: 5 creditos
- [ ] Copy Lab usa brain context por angulo
- [ ] Variantes de fear/greed/authority/curiosity refletem counselors especificos
- [ ] Build sem erros (`npm run build` no diretorio `app/`)

---

## Changelog

| Data | Tarefa | Status | Observacoes |
|------|--------|--------|-------------|
| | H1 Ad generation unificada | PENDENTE | |
| | H2 Copy Lab brain integration | PENDENTE | |
| | Build verification | PENDENTE | |
