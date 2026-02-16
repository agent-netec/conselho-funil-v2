# Plano: Brand Hub v2 — Onboarding Unificado + Fix AI Config

**Status:** PLANEJADO — documentado durante QA Sprint I.
**Data:** 2026-02-16

---

## Estado Atual (Diagnostico)

### O que esta funcionando
- **Wizard de criacao** — 4 steps (Identity, Audience, Offer, Confirm) cria marca no Firestore
- **Brand Hub** — Cores, tipografia, visual style, Logo Lock, AI config (temperature/topP/presets)
- **Logo Lock** — Funciona de verdade: bloqueia updates no Firestore + injeta instrucao `CRITICAL: KEEP THE LOGO IDENTICAL` no design gen
- **Brand Context Injection** — voiceTone, positioning, audience, offer injetados nos prompts de geracao
- **RAG Assets** — Upload de docs/PDFs/URLs com embedding Pinecone + status tracking
- **Brand Compliance** — Valida voice matching com threshold 0.75 + retry
- **Zustand store** — Persistencia no localStorage, troca de marca instantanea

### O que esta quebrado/incompleto

#### 1. Onboarding Fragmentado (PRINCIPAL)
O usuario precisa navegar para **4 locais diferentes** para configurar uma marca completa:

| Local | Rota | O que configura |
|-------|------|-----------------|
| Wizard (criacao) | `/brands/new` | Nome, vertical, positioning, voiceTone, audience, offer |
| Brand Detail Tab 3 | `/brands/{id}` | Cores, fonts, logos, Logo Lock, AI config |
| Brand Hub Dashboard | `/brand-hub` | **Mesma coisa** duplicada (identidade visual + contexto) |
| Assets Page | `/brands/{id}/assets` | Docs, PDFs, URLs para RAG |
| Edit Page | `/brands/{id}/edit` | Re-editar dados basicos (mesmo wizard) |

**Consequencia:** Marca criada fica sem cores, sem logo, sem AI config, sem assets. Engines usam defaults genericos. Usuario nao sabe que precisa ir em cada subpagina.

#### 2. Temperature/TopP Desconectados
A UI mostra sliders de Temperature e TopP, mas **3 dos 5 engines ignoram** esses valores:

| Engine | Temperature | TopP |
|--------|:-----------:|:----:|
| Brand Voice Translator | ✅ Usa | ✅ Usa |
| Copy Generation | ✅ Usa | ❌ Ignora |
| Content Generation | ❌ Hardcoded 0.7 | ❌ Ignora |
| Ad Generation | ❌ Hardcoded 0.7 | ❌ Ignora |
| Brand Compliance | ❌ Hardcoded 0.1 | ❌ Ignora |

**Arquivos afetados:**
- `app/src/lib/content/generation-engine.ts:248` — `temperature: 0.7` hardcoded
- `app/src/lib/intelligence/creative-engine/ad-generator.ts:299` — `temperature: 0.7` hardcoded
- `app/src/lib/intelligence/creative/copy-gen.ts:109` — usa temperature mas ignora topP

#### 3. Personalidade e So Preset de Numeros
Os 4 perfis (Agressivo/Sobrio/Criativo/Equilibrado) sao apenas combinacoes de temperature + topP:
```typescript
const AI_PRESETS = {
  agressivo: { temperature: 0.9, topP: 0.95 },
  sobrio: { temperature: 0.3, topP: 0.7 },
  criativo: { temperature: 0.8, topP: 0.9 },
  equilibrado: { temperature: 0.6, topP: 0.85 },
};
```
**Nao injetam instrucao no prompt** (ex: "seja agressivo e disruptivo nas headlines"). Apenas mudam numeros que metade dos engines ignora.

#### 4. Campos Mortos no Schema
- `presencePenalty` e `frequencyPenalty` existem no tipo mas a Gemini API nao suporta esses parametros (sao da OpenAI). Codigo morto.

#### 5. Delete Sem Cascade
- `deleteBrand()` nao remove funnels, conversations, copy proposals, content_calendar, automation_rules, social_interactions. Dados orfaos ficam no Firestore.

#### 6. Paginas Duplicadas
- `/brand-hub` e `/brands/{id}` Tab "Brand Hub" sao **a mesma funcionalidade** com componentes diferentes. Confuso e duplica manutencao.

---

## Fase 1 — Onboarding Unificado (PRIORIDADE MAXIMA)

### 1.1 Expandir Wizard de Criacao para 6-7 Steps
- **Arquivo:** `app/src/app/brands/new/page.tsx`
- **Steps atuais (manter):** Identity → Audience → Offer
- **Novos steps (adicionar):**
  - **Step 4: Visual Identity** — Cores (primary, secondary, accent), visual style, tipografia
  - **Step 5: Logo** — Upload de logo principal (com preview), Logo Lock toggle
  - **Step 6: AI Configuration** — Preset rapido (Agressivo/Sobrio/Criativo/Equilibrado) com explicacao do impacto
  - **Step 7: Confirmacao** — Review completo de TODOS os dados
- **Cada step e OPCIONAL** (exceto Identity) — usuario pode pular e configurar depois
- **Progress bar** mostra completude da marca (ex: "Marca 60% configurada")

### 1.2 Brand Completeness Score
- **Novo:** Indicador visual de completude na listagem de marcas e no header
- **Campos:** nome ✅, audience ✅, offer ✅, cores ❌, logo ❌, AI config ❌, assets ❌
- **Nudge:** "Sua marca esta 60% configurada. Complete o Brand Hub para resultados melhores."
- **Arquivo:** `app/src/components/brands/brand-completeness.tsx` (novo)

### 1.3 Eliminar Duplicacao brand-hub vs brands/[id]
- **Decisao:** Manter `/brands/{id}` com tabs como pagina principal da marca
- **Redirecionar** `/brand-hub` para `/brands/{selectedBrandId}` tab Brand Hub
- **Ou:** Transformar `/brand-hub` em redirect simples
- **Resultado:** Um unico local para gerenciar identidade visual

### Creditos: 0 (operacao interna)

---

## Fase 2 — Fix AI Configuration (Cirurgico)

### 2.1 Conectar Temperature/TopP em Todos os Engines
Substituir hardcoded por brand settings em cada engine:

**Content Generation:**
- **Arquivo:** `app/src/lib/content/generation-engine.ts:248`
- **De:** `temperature: 0.7`
- **Para:** `temperature: brand?.aiConfiguration?.temperature || 0.7`
- Adicionar: `topP: brand?.aiConfiguration?.topP || 0.95`

**Ad Generation:**
- **Arquivo:** `app/src/lib/intelligence/creative-engine/ad-generator.ts:299`
- **De:** `temperature: 0.7`
- **Para:** `temperature: brand?.aiConfiguration?.temperature || 0.7`
- Adicionar: `topP: brand?.aiConfiguration?.topP || 0.95`

**Copy Generation:**
- **Arquivo:** `app/src/lib/intelligence/creative/copy-gen.ts:109`
- Adicionar: `topP: brand?.aiConfiguration?.topP || 0.95`

**Brand Compliance:**
- **Arquivo:** `app/src/lib/intelligence/creative-engine/brand-compliance.ts`
- Manter `temperature: 0.1` — intencional para avaliacao precisa (documentar)

### 2.2 Personalidade Injetada no Prompt
Em vez de apenas mudar numeros, cada perfil injeta instrucao textual:

```typescript
const PERSONALITY_INSTRUCTIONS = {
  agressivo: 'Use headlines disruptivas, CTAs diretos e urgentes. Desafie o status quo. Linguagem provocativa.',
  sobrio: 'Mantenha tom institucional e profissional. Dados e fatos. Evite hiperboles e exclamacoes.',
  criativo: 'Explore metaforas, storytelling e angulos inesperados. Surpreenda o leitor.',
  equilibrado: 'Balance criatividade com clareza. Tom conversacional mas informado. Headlines atraentes sem exagero.',
};
```

- **Injetar** no system prompt de cada engine junto com voiceTone e positioning
- **Arquivo:** `app/src/lib/ai/formatters.ts` — expandir `formatBrandContextForFunnel()` e similares

### 2.3 Remover Campos Mortos
- **Arquivo:** `app/src/types/database.ts`
- Remover `presencePenalty` e `frequencyPenalty` do tipo `aiConfiguration`
- Nao sao suportados pela Gemini API

### Creditos: 0

---

## Fase 3 — Brand Hub UX Melhorado

### 3.1 Inline Editing na Visao Geral
- **Arquivo:** `app/src/app/brands/[id]/page.tsx` Tab "Visao Geral"
- **Atualmente:** Read-only cards com botao "Editar" que redireciona para wizard
- **Ideal:** Click-to-edit inline em cada campo. Salva automaticamente.
- **Beneficio:** Editar positioning sem sair da pagina

### 3.2 Color Palette Generator
- **Novo:** Dado uma cor primaria, sugerir palette harmonizada automaticamente
- **Usando:** Algoritmos de color harmony (complementary, analogous, triadic)
- **Ou:** Gemini sugere palette baseado no vertical + visual style da marca
- **Arquivo:** `app/src/components/brands/color-palette-generator.tsx` (novo)

### 3.3 Brand Preview Card
- **Novo:** Preview ao vivo de como a marca aparece em diferentes contextos
- **Exemplos:** Card de ad, post social, email header — usando cores, fonts e logo da marca
- **Arquivo:** `app/src/components/brands/brand-preview.tsx` (novo)

### Creditos: 0-1

---

## Fase 4 — Cascade Delete + Governanca

### 4.1 Cascade Delete
- **Arquivo:** `app/src/lib/firebase/brands.ts` → `deleteBrand()`
- **Adicionar:** Delete em cascata de:
  - `brands/{brandId}/content_calendar/*`
  - `brands/{brandId}/automation_rules/*`
  - `brands/{brandId}/automation_logs/*`
  - `brands/{brandId}/social_interactions/*`
  - `brands/{brandId}/voice_profiles/*`
  - `brands/{brandId}/audit_logs/*`
  - `brand_assets` where brandId matches
  - Funnels, conversations, proposals associados
- **Confirmacao dupla:** "Deletar marca apaga TODOS os dados associados. Digite o nome da marca para confirmar."
- **Soft delete opcional:** Marcar como `deletedAt: Timestamp` em vez de remover

### 4.2 Brand Export
- **Novo:** Exportar toda a configuracao da marca como JSON
- **Uso:** Backup antes de deletar, ou template para criar marca similar
- **Arquivo:** `app/src/app/api/brands/[brandId]/export/route.ts` (novo)

### 4.3 Brand Duplication
- **Novo:** "Duplicar Marca" cria copia com nome "{nome} (copia)"
- **Copia:** Todos os dados da marca, BrandKit, AI config
- **Nao copia:** Funnels, conversations, content calendar (sao especificos)
- **Uso:** Criar marcas similares rapidamente (agencia com multiplos clientes)

### Creditos: 0

---

## Fase 5 — Brand Voice Avancado

### 5.1 Voice Profile Editor
- **Expandir** VoiceProfile alem do simples dropdown de 5 opcoes
- **Campos:** tom principal, tom secundario, vocabulario preferido, termos proibidos, exemplos de frases da marca
- **Arquivo:** `app/src/components/brands/voice-profile-editor.tsx` (novo)

### 5.2 Brand Voice Sample Generation
- **Novo:** Apos configurar voice, gerar 3-5 exemplos de como a marca "falaria" em diferentes contextos
- **Validacao:** Usuario aprova/rejeita exemplos para calibrar o perfil
- **Persiste:** Exemplos aprovados viram reference no embedding (RAG)

### 5.3 Multi-Language Brand Voice
- **Novo:** Configurar tom de voz por idioma (PT-BR, EN, ES)
- **Uso:** Marcas que produzem conteudo em multiplos idiomas
- **Arquivo:** Expandir VoiceProfile com `language` field

### Creditos: 1 por geracao de exemplos

---

## Arquivos Criticos

| Arquivo | Fase | Acao |
|---------|------|------|
| `app/src/app/brands/new/page.tsx` | 1 | Expandir wizard para 6-7 steps |
| `app/src/app/brand-hub/page.tsx` | 1 | Redirect para brands/[id] |
| `app/src/app/brands/[id]/page.tsx` | 1,3 | Inline editing + completeness |
| `app/src/lib/content/generation-engine.ts` | 2 | Fix temperature hardcoded |
| `app/src/lib/intelligence/creative-engine/ad-generator.ts` | 2 | Fix temperature hardcoded |
| `app/src/lib/intelligence/creative/copy-gen.ts` | 2 | Adicionar topP |
| `app/src/lib/ai/formatters.ts` | 2 | Injetar personality instructions |
| `app/src/types/database.ts` | 2 | Remover campos mortos |
| `app/src/lib/firebase/brands.ts` | 4 | Cascade delete |
| `app/src/components/brands/brand-kit-form.tsx` | 1,2,3 | Reutilizar no wizard |

## Arquivos Novos

| Arquivo | Fase |
|---------|------|
| `app/src/components/brands/brand-completeness.tsx` | 1 |
| `app/src/components/brands/color-palette-generator.tsx` | 3 |
| `app/src/components/brands/brand-preview.tsx` | 3 |
| `app/src/components/brands/voice-profile-editor.tsx` | 5 |
| `app/src/app/api/brands/[brandId]/export/route.ts` | 4 |

## Dependencias

```
Fase 1 (Onboarding) → Independente, pode ser feita em qualquer sprint
Fase 2 (Fix AI Config) → Independente, fix cirurgico
Fase 3 (UX) → Depende parcialmente da Fase 1
Fase 4 (Cascade Delete) → Independente
Fase 5 (Voice) → Depende da Fase 2 (personality injection)
```

**Fases 1 e 2 podem rodar em paralelo e NAO dependem de OAuth ou outros sprints.**
