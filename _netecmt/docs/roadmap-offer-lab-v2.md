# Roadmap: Offer Lab v2 — Scoring Inteligente + Integração Pipeline

## Status Atual

### O que funciona
- Wizard 4 steps (Promessa → Stacking → Bônus → Escassez)
- Score de Irresistibilidade (0-100) via equação Hormozi
- Sliders de fatores (sidebar)
- Checklist estático
- Save no Firestore (`brands/{id}/offers/{id}`)
- Tela de sucesso após salvar

### Problemas identificados
1. **Score não reflete conteúdo real** — 80% do score vem dos sliders, Steps 1-2 contribuem apenas 0-10 pts binários
2. **Zero feedback de AI** — `evaluateOfferQuality()` existe em `scoring.ts` com Brain Council (Kennedy + Brunson) mas NUNCA é chamada
3. **Insights genéricos** — `generateAnalysis()` retorna 4 frases estáticas
4. **Desconectado do pipeline** — Offer Lab não alimenta Copy, Social, Campaigns, Calendar
5. **Modelo errado na AI Evaluation** — `evaluateOfferQuality()` usa Flash (DEFAULT_GEMINI_MODEL) mas deveria usar Pro, como todas as outras avaliações críticas do sistema

---

## Modelos Gemini por Fase

| Fase | Chamada AI | Modelo | Justificativa | Custo/chamada |
|------|-----------|--------|---------------|--------------|
| **F1-1** Score calculation | Nenhuma (pura fórmula) | — | Zero AI, só math | 0 créditos |
| **F1-2** Feedback por step | Nenhuma (regras locais) | — | Lógica estática no frontend | 0 créditos |
| **F1-3** AI Evaluation final | `evaluateOfferQuality()` | **PRO** (`gemini-3-pro-preview`) | Avaliação crítica com Brain Council, mesmo padrão de Debate/Scorecard/Autopsy | 2 créditos |
| **F2-1** Copy context | Nenhuma nova (copy já chama) | — | Só injeta dados no prompt existente | 0 extra |
| **F3-1** Social context | Nenhuma nova | — | Só injeta dados no prompt existente | 0 extra |

### Padrão do projeto (referência)
```
PRO (gemini-3-pro-preview) — tarefas de julgamento/avaliação:
  ├── Social Debate (4 conselheiros)
  ├── Social Scorecard
  ├── Funnel Autopsy
  ├── Audience Analysis
  ├── Spy Strategic Analysis
  ├── Automation Council
  └── Offer Evaluation ← CORRIGIR de Flash para Pro

FLASH (gemini-2.5-flash) — tarefas de geração/bulk:
  ├── Copy generation
  ├── Social hooks generation
  ├── Calendar content generation
  ├── Research dossier generation
  └── Embeddings/RAG
```

**Bug atual:** `scoring.ts:193` usa `DEFAULT_GEMINI_MODEL` (Flash). Deve ser `PRO_GEMINI_MODEL`.

---

## Fase 1: Scoring Inteligente (Sprint atual)

**Objetivo:** O score deve reagir ao conteúdo real que o usuário escreve, não só aos sliders.

### F1-1: Score que reflete conteúdo (calculator.ts)

Atualizar `OfferLabEngine.calculateScore()` para considerar:

| Fator | Pontos | Como medir |
|-------|--------|-----------|
| **Promessa** (Step 1) | 0-15 pts | `promise.length > 20` (+5), contém número/resultado específico (+5), contém prazo (+5) |
| **Ancoragem de Preço** (Step 1) | 0-10 pts | `perceivedValue / corePrice >= 10x` (+10), `>= 5x` (+5) |
| **Value Stacking** (Step 2) | 0-10 pts | `stacking.length >= 3` (+5), todos com nome E valor (+5) |
| **Bônus** (Step 3) | 0-10 pts | `bonuses.length >= 2` (+5), todos com descrição de objeção (+5) |
| **Garantia** (Step 4) | 0-10 pts | `riskReversal.length > 50` (+5), contém "dias" ou "garantia" (+5) |
| **Escassez** (Step 4) | 0-5 pts | `scarcity.length > 10` (+5) |
| **Equação Hormozi (sliders)** | 0-40 pts | Mantém fórmula atual mas com peso reduzido de 80→40 |

**Total possível: 100 pts** com distribuição muito mais equilibrada.

### F1-2: Feedback contextual por step

Ao final de cada step, mostrar mini-feedback baseado no conteúdo:

- **Step 1 (Promessa):** "Sua promessa não contém um resultado específico. Ex: 'Fature R$10k em 30 dias'"
- **Step 2 (Stacking):** "Adicione pelo menos 3 itens ao stack para maximizar ancoragem"
- **Step 3 (Bônus):** "Bônus sem descrição de objeção valem menos — descreva qual barreira cada bônus resolve"
- **Step 4 (Escassez):** "Garantia forte = risco zero para o cliente. Detalhe mais sua garantia"

### F1-3: AI Evaluation no final (ativar evaluateOfferQuality)

Ao clicar "Finalizar Oferta", antes de salvar:

1. Chamar `POST /api/intelligence/offer/calculate-score` (já existe)
2. Este endpoint chama `OfferScoringEngine.evaluateOfferQuality()` com Brain Council
3. Mostrar tela de resultado com:
   - Score numérico
   - **Parecer do Dan Kennedy** (oferta + copy)
   - **Parecer do Russell Brunson** (value ladder)
   - **3 sugestões de melhoria** ranqueadas por impacto
   - Botão "Ajustar Oferta" (volta pro wizard) ou "Salvar como está"

**Custo estimado:** ~2 créditos (1 chamada Gemini Flash)

**Arquivos a modificar:**
- `app/src/lib/intelligence/offer/calculator.ts` — novo scoring
- `app/src/components/intelligence/offer-lab/offer-lab-wizard.tsx` — feedback por step + tela de AI evaluation
- `app/src/app/api/intelligence/offer/calculate-score/route.ts` — chamar evaluateOfferQuality

---

## Fase 2: Conectar ao Copy Engine

**Objetivo:** Copy generation usar dados do Offer Lab (não só `brand.offer` básico).

### F2-1: Offer context no copy prompt

Quando gerar copy para um funil:
1. Verificar se a brand tem ofertas salvas (`brands/{id}/offers/`)
2. Se sim, carregar a oferta ativa (status: 'active') ou a mais recente
3. Injetar no prompt de copy como contexto rico:
   - Promessa principal
   - Stack de valor completo
   - Bônus e objeções que resolvem
   - Garantia e escassez
   - Score de irresistibilidade

**Arquivos a modificar:**
- `app/src/lib/ai/prompts/copy-generation.ts` — adicionar offerContext
- `app/src/app/api/copy/generate/route.ts` — carregar offer do Firestore

### F2-2: Score de copy inclui dados reais da oferta

Atualizar copy scoring para usar dados do Offer Lab no fator "Offer" (20% do peso):
- Hoje: avalia qualitativamente pela AI
- Novo: cruza com dados reais (ancoragem, bônus, garantia)

---

## Fase 3: Conectar ao Social + Campaigns

### F3-1: Social hooks baseados na oferta

Quando gerar hooks sociais, injetar contexto de oferta para:
- Headlines com promessa calibrada
- Gatilhos de escassez reais
- Prova social baseada em garantia

**Arquivo:** `app/src/lib/ai/prompts/social-generation.ts`

### F3-2: Golden Thread — Step "Oferta"

Adicionar oferta como step opcional na Golden Thread (Campaigns):
- Entre "Funil" e "Copywriting"
- Mostra se já tem oferta salva ou permite criar
- Dados fluem para copy e social

**Arquivos:**
- `app/src/app/campaigns/[id]/page.tsx` — novo step
- `app/src/types/campaign.ts` — campo `offer`

### F3-3: Calendar posts com contexto de oferta

Posts gerados para o calendário incluem dados de oferta para manter consistência na comunicação.

---

## Fase 4: Histórico + Comparação

### F4-1: Lista de ofertas salvas

No Offer Lab, mostrar histórico com:
- Nome da oferta
- Score
- Data
- Botão "Duplicar e editar"
- Botão "Ativar" (define como oferta principal)

### F4-2: Comparação A/B de ofertas

Selecionar 2 ofertas e comparar lado a lado:
- Score
- Fatores
- AI analysis diffs

### F4-3: Conectar com A/B Testing (scaffolding existente)

Ativar campo `offerId` em `types/ab-testing.ts` e `types/personalization.ts`.

---

## Prioridade de Implementação

| Fase | Impacto | Esforço | Dependência |
|------|---------|---------|-------------|
| **F1 (Scoring)** | ALTO — UX crítica | Médio (1 sprint) | Nenhuma |
| **F2 (Copy)** | ALTO — valor direto | Baixo (poucas linhas) | Nenhuma |
| **F3 (Social/Campaigns)** | Médio | Médio | F2 idealmente |
| **F4 (Histórico)** | Médio | Baixo-Médio | F1 |

**Recomendação:** Fazer F1 + F2 juntas. F1 melhora a experiência imediata do Offer Lab, F2 faz os dados fluírem para copy (onde o impacto é direto).

---

## Firebase / Firestore — Mudanças Necessárias

### Por Fase

| Fase | Mudança Firebase | Detalhes |
|------|-----------------|----------|
| **F1-1** Score calculation | **Nenhuma** | Lógica pura em `calculator.ts`, `OfferDocument.scoring` já suporta |
| **F1-2** Feedback por step | **Nenhuma** | Frontend-only |
| **F1-3** AI Evaluation | **Sim — novo campo** | Adicionar `aiEvaluation` ao doc: `{ overallQuality, insights[], summary }` |
| **F2** Copy context | **Nenhuma** | Apenas lê de `brands/{id}/offers/` existente |
| **F3-2** Golden Thread | **Sim — novo campo** | Adicionar `offer` ao doc de campaign |
| **F4-1** Histórico | **Nenhuma** | `OfferDocument.status` já tem `'draft' \| 'active' \| 'archived'` |

### Schema: Campo `aiEvaluation` (F1-3)

```typescript
// Adicionar ao OfferDocument (types/offer.ts)
aiEvaluation?: {
  overallQuality: number;        // 0-100, score qualitativo AI
  insights: {
    counselorId: string;          // 'dan_kennedy_copy' | 'russell_brunson'
    counselorName: string;
    frameworkUsed: string;
    score: number;
    opinion: string;              // Parecer na voz do expert
    redFlagsTriggered: string[];
    goldStandardsHit: string[];
  }[];
  summary: string;                // Resumo executivo
  evaluatedAt: Timestamp;
};
```

### Schema: Campo `offer` em Campaign (F3-2)

```typescript
// Adicionar ao Campaign document
offer?: {
  offerId: string;                // ref para brands/{id}/offers/{offerId}
  name: string;
  score: number;
  promise: string;
};
```

### Security Rules

Atualmente `firestore.rules` NÃO tem match para `brands/{brandId}/offers/{offerId}`.
Funciona em modo de teste (deploy), mas para produção real precisa de:

```
match /brands/{brandId}/offers/{offerId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && exists(/databases/$(database)/documents/brands/$(brandId))
    && get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
}
```

**Nota:** Firestore é schemaless — campos novos não precisam de migration. Basta escrever e o TypeScript garante consistência. Nenhum índice composto é necessário para as queries planejadas.

---

## Conexões Existentes (Referência)

```
CONECTADO (ativo):
├── Sidebar/Nav → Strategy group
├── Brand Wizard → brand.offer (versão simples)
├── Funnel Wizard → herda brand.offer
├── Copy Generation → 20% do scoring weight
├── Funnel Autopsy → heurística "offer"
├── Brain Council → Kennedy (offer_architecture) + Brunson (value_ladder)
├── Intelligence Assets → tipo "offer" no dashboard
└── Prediction Engine → fator offer_structure (20%)

DESCONECTADO:
├── Social Generation → métricas definidas mas dados não fluem
├── Campaigns/Golden Thread → zero referência
├── Calendar/Automação → zero referência
├── A/B Testing → campo existe mas não usado
└── Personalization → campo existe mas não usado
```
