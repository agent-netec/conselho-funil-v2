# Sprint 13 — Funnel Intelligence (Funis que Pensam)

> **Status:** 🟢 COMPLETO (2026-03-22)
> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Princípio:** Interconectividade — funis devem consumir TODA a inteligência da marca
> **Bloqueado por:** Sprint 07 (Brand Intelligence Layer)
> **Ref doc master:** Seção 11 (Auditoria: Funis)
> **Estimativa:** 1-2 sessões

---

## Contexto

Funis são gerados de forma genérica: o Brain Context (Identity Cards dos 6 conselheiros de funil) existe como código pronto mas NUNCA é chamado. O diferencial competitivo é coletado no wizard mas descartado antes de chegar ao prompt. RAG busca chunks genéricos sem considerar a marca. Zero memória de funis anteriores. O resultado: funis parecidos independente da marca.

**Diagnóstico (7 gaps encontrados):**

| # | Gap | Impacto | Root Cause |
|---|-----|---------|-----------|
| 1 | Brain Context não chamado | ~400 tokens de frameworks de conselheiros ausentes | `buildFunnelBrainContext()` existe mas nunca importada no route.ts |
| 2 | Differentiator perdido no wizard → API | Proposta de valor única nunca chega na IA | `FunnelContext` type não tem campo, form não envia |
| 3 | RAG genérica | Knowledge retrieval não customizado à marca | Função ignora brand context, não chama `retrieveBrandChunks()` |
| 4 | Zero memória de funis anteriores | Risco de funis repetitivos | Nenhum código carrega funis anteriores |
| 5 | Wizard re-pergunta dados da marca | Fricção UX desnecessária | Sem pre-fill da brand.audience |
| 6 | Budget ausente do wizard | R$500/mês vs R$50k/mês = funis iguais | Campo não existe |
| 7 | `minSimilarity: 0.2` no RAG | Chunks irrelevantes podem entrar | Threshold muito baixo |

---

## Tarefa 13.1 — Injetar Brain Context na Geração

### Arquivo: `src/app/api/funnels/generate/route.ts`

**Ação:** Importar e chamar `buildFunnelBrainContext()` antes de montar o prompt.

```typescript
// ADICIONAR após brandContext (linha ~113)
import { buildFunnelBrainContext } from '@/lib/ai/prompts/funnel-brain-context';

const brainContext = await buildFunnelBrainContext();

// Injetar no prompt (linha ~140)
contextPrompt = `${brainContext}\n\n${brandContext}\n\n${contextPrompt}`;
```

### Critérios de aceitação:
- [ ] `buildFunnelBrainContext()` chamado no generate route
- [ ] Contexto dos 6 conselheiros presente no prompt enviado ao Gemini
- [ ] Build passa

---

## Tarefa 13.2 — Differentiator no Fluxo Completo

### 3 arquivos:

**A) Tipo** — `src/types/database.ts`
- Adicionar `differentiator?: string` em `FunnelContext.offer`

**B) Wizard** — `src/app/(app)/funnels/new/page.tsx`
- Incluir `formData.differential` no objeto `context.offer` ao criar o funil:
  ```typescript
  offer: {
    what: formData.product,
    ticket: formData.ticket,
    type: formData.productType as any,
    differentiator: formData.differential,
  }
  ```

**C) Prompt builder** — `src/lib/ai/prompts/funnel-generation.ts`
- Adicionar linha no `buildFunnelContextPrompt()`:
  ```
  - **Diferencial Competitivo:** ${context.offer.differentiator || 'Não informado'}
  ```

### Critérios de aceitação:
- [ ] Differentiator persiste no Firestore (`funnels/{id}.context.offer.differentiator`)
- [ ] Differentiator aparece no prompt do Gemini
- [ ] Build passa

---

## Tarefa 13.3 — RAG Brand-Specific

### Arquivo: `src/app/api/funnels/generate/route.ts`

**Ação:** Além da RAG genérica, buscar chunks da marca.

```typescript
// ADICIONAR após retrieveForFunnelCreation (linha ~131)
import { retrieveBrandChunks } from '@/lib/ai/rag';

let brandKnowledge = '';
if (funnel?.brandId) {
  const brandChunks = await retrieveBrandChunks(funnel.brandId,
    `${context.objective} ${context.audience?.who} ${context.offer?.what}`, 10);
  if (brandChunks.length > 0) {
    brandKnowledge = `\n\n## CONHECIMENTO ESPECÍFICO DA MARCA\n\n${
      brandChunks.map(c => c.content).join('\n\n')
    }`;
  }
}
```

### Arquivo: `src/lib/ai/rag.ts`
- Aumentar `minSimilarity` de `0.2` para `0.4` em `retrieveForFunnelCreation()`

### Critérios de aceitação:
- [ ] Chunks da marca são incluídos no prompt quando brandId existe
- [ ] `minSimilarity` subiu para 0.4
- [ ] Build passa

---

## Tarefa 13.4 — Memória de Funis Anteriores

### Arquivo: `src/app/api/funnels/generate/route.ts`

**Ação:** Carregar funis anteriores da mesma marca como "evite repetir".

```typescript
// ADICIONAR antes do prompt building
let previousFunnelsContext = '';
if (funnel?.brandId) {
  const previousFunnels = await getUserFunnelsAdmin(userId);
  const sameBrand = previousFunnels.filter(f => f.brandId === funnel.brandId && f.id !== funnelId);
  if (sameBrand.length > 0) {
    previousFunnelsContext = `\n\n## FUNIS ANTERIORES DESTA MARCA (evite repetir)\n\n${
      sameBrand.slice(0, 5).map(f =>
        `- "${f.name}" — Objetivo: ${f.context?.objective}, Canal: ${f.context?.channel?.main}, Status: ${f.status}`
      ).join('\n')
    }\n\nIMPORTANTE: Proponha estratégias DIFERENTES das listadas acima.`;
  }
}
```

### Critérios de aceitação:
- [ ] Funis anteriores da mesma marca são listados no prompt
- [ ] IA recebe instrução para não repetir
- [ ] Build passa

---

## Tarefa 13.5 — Pre-fill do Wizard com Dados da Marca

### Arquivo: `src/app/(app)/funnels/new/page.tsx`

**Ação:** Quando `activeBrand` existe e tem audience/pain/awareness, pre-preencher o form.

```typescript
useEffect(() => {
  if (!activeBrand) return;
  setFormData(prev => ({
    ...prev,
    audience: prev.audience || activeBrand.audience?.idealClient || '',
    pain: prev.pain || activeBrand.audience?.pain || '',
    awareness: prev.awareness || activeBrand.audience?.awareness || '',
    objection: prev.objection || activeBrand.audience?.objections?.[0] || '',
    differential: prev.differential || activeBrand.offer?.differentiator || '',
    product: prev.product || activeBrand.offer?.what || '',
    ticket: prev.ticket || (activeBrand.offer?.ticket ? String(activeBrand.offer.ticket) : ''),
    productType: prev.productType || activeBrand.offer?.type || '',
  }));
}, [activeBrand]);
```

### Critérios de aceitação:
- [ ] Wizard pre-preenche campos quando marca ativa tem os dados
- [ ] Usuário pode editar os valores pre-preenchidos
- [ ] Sem pre-fill quando marca não tem dados (campos ficam vazios)
- [ ] Build passa

---

## Tarefa 13.6 — Budget no Wizard (Opcional)

### Arquivos:
- `src/types/database.ts` — Adicionar `budget?: string` em `FunnelContext`
- `src/app/(app)/funnels/new/page.tsx` — Adicionar select de faixa no Step 3 (Oferta):
  - "Não invisto em tráfego"
  - "Até R$ 1.000/mês"
  - "R$ 1.000 - R$ 5.000/mês"
  - "R$ 5.000 - R$ 20.000/mês"
  - "R$ 20.000 - R$ 50.000/mês"
  - "R$ 50.000+/mês"
- `src/lib/ai/prompts/funnel-generation.ts` — Incluir no prompt:
  ```
  - **Budget de Tráfego:** ${context.budget || 'Não informado'}
  ```

### Critérios de aceitação:
- [ ] Select de budget aparece no wizard
- [ ] Budget chega no prompt do Gemini
- [ ] Funis diferem significativamente baseado no budget
- [ ] Build passa

---

## Checklist de Execução

- [x] **Tarefa 13.1** — Brain Context injetado (2026-03-22) ✅
- [x] **Tarefa 13.2** — Differentiator fluxo completo (2026-03-22) ✅
- [x] **Tarefa 13.3** — RAG brand-specific + minSimilarity 0.4 (2026-03-22) ✅
- [x] **Tarefa 13.4** — Memória de funis anteriores (2026-03-22) ✅
- [x] **Tarefa 13.5** — Pre-fill do wizard (2026-03-22) ✅
- [x] **Tarefa 13.6** — Budget no wizard (2026-03-22) ✅
- [x] **Build final** — Build passou limpo ✅

---

## Arquivos Envolvidos (referência rápida)

| Tarefa | Arquivo | Ação |
|--------|---------|------|
| 13.1 | `api/funnels/generate/route.ts` | + import + call buildFunnelBrainContext |
| 13.2a | `types/database.ts` | + differentiator no FunnelContext |
| 13.2b | `funnels/new/page.tsx` | + enviar differential no context |
| 13.2c | `prompts/funnel-generation.ts` | + differentiator no prompt |
| 13.3a | `api/funnels/generate/route.ts` | + retrieveBrandChunks |
| 13.3b | `lib/ai/rag.ts` | + minSimilarity 0.2 → 0.4 |
| 13.4 | `api/funnels/generate/route.ts` | + previous funnels loader |
| 13.5 | `funnels/new/page.tsx` | + useEffect pre-fill |
| 13.6a | `types/database.ts` | + budget no FunnelContext |
| 13.6b | `funnels/new/page.tsx` | + select de budget |
| 13.6c | `prompts/funnel-generation.ts` | + budget no prompt |

---

## Impacto Esperado

Antes: Funis genéricos, sempre parecidos, sem personalidade da marca.
Depois: Funis que:
- Usam frameworks dos 6 conselheiros (Brunson, Kennedy, Kern, Ovens, Deiss, Belcher)
- Incorporam o diferencial competitivo da marca
- Consultam conhecimento específico da marca via RAG
- Evitam repetir estratégias de funis anteriores
- Pre-preenchem dados da marca para reduzir fricção
- Adaptam complexidade ao budget disponível
