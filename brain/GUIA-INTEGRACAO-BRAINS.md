# Guia de Integracao — Brains do Conselho de Funil

> Documento mestre para a iniciativa de enriquecimento dos 23 conselheiros do app.
> Atualizado: 2026-02-14

---

## 1. Visao Geral

### O Problema
Os 23 conselheiros do Conselho de Funil existem apenas como **labels rasos** (nome + 1 frase de expertise) nos prompts do Gemini. O sistema finge ter profundidade mas envia prompts genericos. Exemplo: o Scoring Engine diz "treinado nas metodologias de Schwartz, Halbert e Brunson" mas nao injeta NENHUM framework real desses autores.

### O Objetivo
Dar **profundidade real** a cada conselheiro com frameworks de avaliacao estruturados, integrar esses brains em **TODOS os engines** do app, e criar um sistema de **evolucao continua** dos brains.

### Resultado Esperado
- Cada engine usa frameworks REAIS dos experts (nao opinioes genericas do Gemini)
- Scores sao justificados com criterios especificos e pesos definidos
- Red flags e gold standards dao feedback acionavel com exemplos antes/depois
- O usuario ve a opiniao INDIVIDUAL de cada conselheiro relevante
- Novos documentos/insights sao absorvidos pelo sistema ao longo do tempo

---

## 2. Arquitetura: Hybrid Smart

### Decisao
Adotamos a arquitetura **Hybrid Smart**: Identity Cards em codigo (sempre disponiveis) + Deep Brain no Pinecone (material de referencia, busca vetorial).

### Camada 1: Identity Cards (Obrigatoria)
- **Formato:** Arquivo `.md` com YAML frontmatter + texto narrativo + blocos JSON
- **Tamanho:** ~800-900 tokens por card (cabe em qualquer prompt)
- **Localizacao de deploy:** `app/src/data/identity-cards/` (dentro do diretorio de deploy do Vercel)
- **Conteudo:**
  - Filosofia Core (narrativa)
  - Principios Operacionais (lista numerada)
  - Voz de Analise (como o expert fala)
  - Catchphrases (frases tipicas)
  - `evaluation_frameworks` (JSON parseavel com criterios + pesos + scoring ranges)
  - `red_flags` (JSON com penalty + before/after + expert_says)
  - `gold_standards` (JSON com bonus + example + expert_says)

### Camada 2: Deep Brain (Opcional, Pinecone)
- **Conteudo:** Heuristicas detalhadas, anti-padroes, case studies, playbooks, scorecards, modelos mentais
- **Busca:** Vetorial via embedding + filtro de metadata
- **Uso:** Quando o engine precisa de profundidade ALEM do identity card (ex: chat mode, analise profunda)
- **Namespace:** `universal` com filtros de metadata

### Por que NAO tudo no Pinecone?
O Gemini ja CONHECE esses autores. O que ele precisa nao e "quem e Halbert" (ele ja sabe), mas sim COMO aplicar os frameworks de Halbert de forma consistente e estruturada. Os Identity Cards fornecem essa estrutura. O Pinecone fornece material de referencia complementar.

---

## 3. Formato do Identity Card (Aprovado)

### Template Padrao

```markdown
---
counselor: <id_do_counselor>
domain: copy | funnel | social | ads | design
doc_type: identity_card
version: 2026.v1
token_estimate: <estimativa_tokens>
---

# <Nome> — <Especialidade em 3-5 palavras>

## Filosofia Core
"<Frase iconica>" <Paragrafo explicando a abordagem central>

## Principios Operacionais
1. **<Principio 1>**: <Descricao>
2. **<Principio 2>**: <Descricao>
... (3-5 principios)

## Voz de Analise
<Como o expert fala, critica e elogia>

## Catchphrases
- "<Frase tipica 1>"
- "<Frase tipica 2>"
... (3-4 frases)

## evaluation_frameworks

```json
{
  "<framework_1_id>": {
    "description": "<O que avalia>",
    "criteria": [
      {
        "id": "<criterio_id>",
        "label": "<Nome legivel>",
        "weight": 0.XX,
        "scoring": {
          "90_100": "<Descricao de excelencia>",
          "60_89": "<Descricao boa>",
          "30_59": "<Descricao fraca>",
          "0_29": "<Descricao pessima>"
        }
      }
    ]
  }
}
```

## red_flags

```json
[
  {
    "id": "<flag_id>",
    "label": "<O que esta errado>",
    "penalty": -XX,
    "before": "<Exemplo ruim>",
    "after": "<Exemplo corrigido>",
    "<expert>_says": "<Opiniao na voz do expert>"
  }
]
```

## gold_standards

```json
[
  {
    "id": "<standard_id>",
    "label": "<O que esta excelente>",
    "bonus": XX,
    "example": "<Exemplo de excelencia>",
    "<expert>_says": "<Elogio na voz do expert>"
  }
]
```

### Regras do Formato
1. **Pesos devem somar 1.0** dentro de cada framework
2. **4 faixas de scoring** obrigatorias: 90_100, 60_89, 30_59, 0_29
3. **Red flags tem penalty negativa** (-10 a -25)
4. **Gold standards tem bonus positivo** (+10 a +20)
5. **Before/After obrigatorio** em red flags (exemplo concreto)
6. **Expert_says** usa campo generico `expertSays` no TypeScript (o campo no MD varia: halbert_says, schwartz_says, etc.)
7. **Token estimate** no frontmatter para controle de budget

---

## 4. Inventario dos 23 Conselheiros

### Copy Council (9 cards) — PRONTOS
| ID | Expert | Especialidade | Card |
|----|--------|---------------|------|
| gary_halbert | Gary Halbert | Headlines & Psicologia | brain/identity-cards/gary_halbert.md |
| eugene_schwartz | Eugene Schwartz | Consciencia de Mercado | brain/identity-cards/eugene_schwartz.md |
| joseph_sugarman | Joseph Sugarman | Narrativa & Estrutura | brain/identity-cards/joseph_sugarman.md |
| dan_kennedy | Dan Kennedy | Oferta & Urgencia | brain/identity-cards/dan_kennedy.md |
| david_ogilvy | David Ogilvy | Brand Premium & Big Idea | brain/identity-cards/david_ogilvy.md |
| claude_hopkins | Claude Hopkins | Metodo Cientifico | brain/identity-cards/claude_hopkins.md |
| john_carlton | John Carlton | Voz Autentica & Hooks | brain/identity-cards/john_carlton.md |
| drayton_bird | Drayton Bird | Simplicidade & Eficiencia | brain/identity-cards/drayton_bird.md |
| frank_kern_copy | Frank Kern | Fluxo de Vendas & Sequencias | brain/identity-cards/frank_kern.md |

### Funnel Council (6 cards) — A CRIAR
| ID | Expert | Especialidade | Fonte existente |
|----|--------|---------------|-----------------|
| russell_brunson | Russell Brunson | Arquitetura de Funil | _netecmt/brain/council/identity/ |
| dan_kennedy_funnel | Dan Kennedy | Oferta & Copy (visao funil) | _netecmt/brain/council/identity/ |
| frank_kern_funnel | Frank Kern | Psicologia & Comportamento | _netecmt/brain/council/identity/ |
| sam_ovens | Sam Ovens | Aquisicao & Qualificacao | _netecmt/brain/council/identity/ |
| ryan_deiss | Ryan Deiss | LTV & Retencao | _netecmt/brain/council/identity/ |
| perry_belcher | Perry Belcher | Monetizacao Simples | _netecmt/brain/council/identity/ |

### Social Council (4 cards) — A CRIAR
| ID | Expert | Especialidade | Fonte existente |
|----|--------|---------------|-----------------|
| lia_haberman | Lia Haberman | Algoritmo & Mudancas | _netecmt/brain/social/identity/ |
| rachel_karten | Rachel Karten | Criativo & Hooks | _netecmt/brain/social/identity/ |
| nikita_beer | Nikita Beer | Viralizacao & Trends | _netecmt/brain/social/identity/ |
| justin_welsh | Justin Welsh | Funil Social | _netecmt/brain/social/identity/ |

### Ads Council (4 cards) — A CRIAR (do zero)
| ID | Expert | Especialidade | Fonte existente |
|----|--------|---------------|-----------------|
| justin_brooke | Justin Brooke | Estrategia & Escala | Nenhuma |
| nicholas_kusmich | Nicholas Kusmich | Meta Ads & Contexto | Nenhuma |
| jon_loomer | Jon Loomer | Analytics & Tecnico | Nenhuma |
| savannah_sanchez | Savannah Sanchez | TikTok & UGC | Nenhuma |

### Design (1 card) — A CRIAR
| ID | Expert | Especialidade | Fonte existente |
|----|--------|---------------|-----------------|
| design_director | Diretor de Arte | Direcao Visual & UX | Framework C.H.A.P.E.U existente |

---

## 5. Regras de Contexto para Prompts (Gemini)

### Limite de Experts por Prompt
- **Maximo: 3-4 identity cards por prompt** — alem disso a qualidade degrada
- Para mais experts: usar **chamadas paralelas** ao Gemini (uma por expert ou grupo pequeno)
- **Budget total de instrucoes do expert: ~2.500 tokens** por chamada

### Mapeamento Dimensao → Experts
Cada dimensao de scoring usa 2-3 experts especificos (NAO todos):

| Dimensao | Experts Primarios | Frameworks |
|----------|-------------------|------------|
| headline_strength | Halbert + Ogilvy | headline_score, headline_excellence |
| cta_effectiveness | Bird + Kennedy | action_clarity, cta_clarity |
| hook_quality | Carlton + Sugarman | hook_and_fascinations, opening_pull |
| offer_structure | Kennedy + Brunson | offer_architecture, value_ladder |
| funnel_coherence | Sugarman + Schwartz | slippery_slide, awareness_alignment |
| trust_signals | Hopkins + Ogilvy | proof_layering, facts_over_adjectives |

### Temperatura por Uso
| Tarefa | Temperatura | Justificativa |
|--------|-------------|---------------|
| Scoring (CPS) | 0.1 | Consistencia maxima entre execucoes |
| Recomendacoes | 0.3 | Alguma variacao para sugestoes uteis |
| Geracao de copy | 0.7 | Criatividade controlada |
| Chat mode | 0.5 | Balanco entre criatividade e precisao |
| Party mode (debate) | 0.6 | Personalidade dos experts |

### Estrutura do Prompt (System vs User)
- **System Instruction:** Persona do expert + principios + voz + catchphrases (parte narrativa do identity card)
- **User Context:** Frameworks JSON (criterios + pesos + scoring) + dados do funil do usuario
- **Nunca misturar:** Nao colocar dados do usuario na system instruction

### Anti-Alucinacao
1. **Grounded Prompting:** Sempre incluir "Baseie sua analise EXCLUSIVAMENTE nos dados fornecidos. Se nao ha dados suficientes para uma dimensao, diga explicitamente."
2. **Response Schema:** Usar `responseMimeType: 'application/json'` + `responseSchema` com minimum/maximum para scores (0-100)
3. **Evidence Required:** O prompt deve exigir `evidence[]` com citacoes LITERAIS dos dados de entrada
4. **Confidence Flag:** Incluir campo `confidence: 'high' | 'medium' | 'low'` para cada dimensao

---

## 6. Estrategia de Ingestao no Pinecone (Deep Brain)

### Conteudo para Ingestao
Material rico existente em `_netecmt/brain/`:

| Diretorio | Conteudo | Qtd |
|-----------|----------|-----|
| council/heuristics/ | Heuristicas por dominio | 10+ |
| council/anti-patterns/ | Anti-padroes de funil | 9 |
| council/mental-models/ | Modelos mentais (value ladder, awareness, etc.) | 8 |
| council/case-library/ | Estudos de caso | 4 |
| council/playbooks/ | Playbooks | 2 |
| council/scorecards/ | Scorecards | 2 |
| social/heuristics/ | Heuristicas por plataforma | 4 |
| social/playbooks/ | Playbooks sociais | 3 |
| social/scorecards/ | Scorecard de conteudo | 1 |

### Metadata Obrigatoria por Chunk

```json
{
  "document_id": "council-heuristics-oferta-copy",
  "chunk_number": 3,
  "total_chunks": 7,
  "counselor": "dan_kennedy",
  "counselors_relevant": ["dan_kennedy", "perry_belcher", "russell_brunson"],
  "domain": "funnel",
  "dataType": "counselor_knowledge",
  "content_type": "heuristic | anti_pattern | mental_model | case_study | playbook | scorecard",
  "topics": ["oferta", "value_stacking", "preco"],
  "version": "2026.v1",
  "updated_at": "2026-02-14",
  "content_hash": "<sha256_dos_primeiros_500_chars>",
  "source_file": "_netecmt/brain/council/heuristics/oferta_copy.md"
}
```

### Regras de Metadata
1. **`counselors_relevant`**: Lista de TODOS os conselheiros que podem se beneficiar desse chunk (nao apenas o autor). Ex: um anti-pattern de "copy sem prova" e relevante para Halbert, Hopkins e Ogilvy.
2. **`content_hash`**: SHA-256 dos primeiros 500 chars do texto original. Usado para detectar se o conteudo mudou e precisa re-ingestao.
3. **`version`**: Permite ter versoes em paralelo e deprecar versoes antigas.
4. **`topics`**: Lista de topicos para filtragem combinada com busca vetorial.

### Estrategia de Chunking (Structure-Aware)

**NAO usar chunking por tamanho fixo (500 tokens).** Usar chunking por estrutura do markdown:

1. **Split por headers (##):** Cada secao vira um chunk
2. **Blocos JSON sao atomicos:** Nunca quebrar um bloco JSON no meio
3. **Contexto do pai:** Cada chunk inclui o titulo do documento + header pai como prefixo
4. **Tamanho alvo:** 300-800 tokens por chunk (flexivel baseado na estrutura)
5. **Overlap:** 2-3 frases de overlap entre chunks adjacentes da mesma secao

Exemplo:
```
Chunk 1: "# Dan Kennedy — Oferta & Urgencia\n## Principio: Value Stacking\n<conteudo>"
Chunk 2: "# Dan Kennedy — Oferta & Urgencia\n## Principio: Risk Reversal\n<conteudo>"
Chunk 3: "# Dan Kennedy — Oferta & Urgencia\n## Red Flags\n<bloco JSON completo>"
```

### Pipeline de Retrieval

```
1. Query do usuario → Gerar embedding (gemini-embedding-001, 768 dims)
2. Pinecone query: topK=10, filter: { domain: "copy", dataType: "counselor_knowledge" }
3. Reranking: score de similaridade × DATA_TYPE_BOOST × relevancia ao counselor ativo
4. Select top 3-5 chunks
5. Injetar como contexto no prompt (user section, nao system)
6. Grounded prompting: "Use APENAS os dados fornecidos abaixo para fundamentar sua analise"
```

### Versionamento de Conteudo

Para atualizar conteudo ja ingerido:
1. Calcular `content_hash` do novo conteudo
2. Comparar com `content_hash` existente no Pinecone (query por `document_id`)
3. Se diferente: **delete all chunks** desse `document_id` → **upsert novos chunks**
4. Se igual: skip (conteudo nao mudou)

---

## 7. Migracoes de Provedor (Criticas)

### 7.1 Embedding Model: text-embedding-004 → gemini-embedding-001

**Status:** text-embedding-004 DEPRECIADO desde Janeiro 2026
**Impacto:** Funciona hoje mas pode parar a qualquer momento
**Migracao:**

| Item | Atual | Novo |
|------|-------|------|
| Modelo | text-embedding-004 | gemini-embedding-001 |
| Endpoint | v1beta/models/text-embedding-004:embedContent | v1beta/models/gemini-embedding-001:embedContent |
| Dimensoes | 768 | 768 (usar outputDimensionality: 768) |
| Compatibilidade | — | Backward-compatible com Pinecone existente |

**Arquivo:** `app/src/lib/ai/embeddings.ts`
- Linha 100: Trocar endpoint para gemini-embedding-001
- Linha 107: Trocar model para models/gemini-embedding-001
- Linha 194: Trocar model no batch
- Linha 209: Trocar endpoint no batch
- Linha 216: Trocar model no body do batch

**Plano:** Migrar NA FASE 1 antes de ingerir Deep Brain. Fazer com `outputDimensionality: 768` para manter compatibilidade com o indice Pinecone existente (768 dims).

**Teste:** Gerar embedding de uma query conhecida com o novo modelo, verificar que a busca no Pinecone retorna resultados similares.

### 7.2 LLM: gemini-2.0-flash → gemini-2.5-flash

**Status:** gemini-2.0-flash deprecia em 31 Marco 2026
**Impacto:** Temos ~45 dias para migrar
**Migracao:**

| Item | Atual | Novo |
|------|-------|------|
| Modelo | gemini-2.0-flash | gemini-2.5-flash |
| Env var | GEMINI_MODEL | GEMINI_MODEL (mudar valor) |
| Context window | 1M tokens | 1M tokens |
| Structured output | Sim | Sim (melhorado) |

**Plano:** Mudar o valor da env var `GEMINI_MODEL` no Vercel. O codigo ja le dinamicamente via `process.env.GEMINI_MODEL`. Testar todas as features antes de mudar em producao.

### 7.3 Bug de Namespace (brand- vs brand_)

**Status:** Bug ativo — pode estar causando perda de contexto de marca
**Descricao:** `rag-helpers-fixed.ts` usa `brand-{brandId}` e `context-assembler.ts` usa `brand_{brandId}`
**Impacto:** Dados ingeridos com um formato nao sao encontrados pelo outro
**Fix:** Padronizar para `brand_{brandId}` (underscore) em ambos os arquivos

---

## 8. Sistema de Evolucao dos Brains

### Principio
Os brains NAO sao estaticos. O negocio evolui, novos insights surgem, plataformas mudam algoritmos, e novas tecnicas emergem. O sistema deve absorver novos documentos automaticamente.

### Cadencia de Atualizacao

| Frequencia | Tipo de Conteudo | Processo |
|------------|------------------|----------|
| Diario | Trends de plataforma, mudancas de algoritmo | Cron job analisa feeds → gera insight → Pinecone |
| Semanal | Novos case studies, resultados de campanhas | Upload manual → processamento → Pinecone |
| Mensal | Revisao de heuristicas, novos anti-padroes | Review dos identity cards, ajuste de pesos/criterios |
| Trimestral | Novos conselheiros, novas plataformas | Criar identity cards novos, expandir engines |
| Anual | Revisao completa de frameworks | Recalibrar scores, atualizar version dos cards |

### Pipeline de Ingestao Continua

```
1. Novo documento chega (upload, API, cron)
2. Classificacao automatica:
   - Qual domain? (copy, funnel, social, ads, design)
   - Quais counselors relevantes?
   - Qual content_type? (heuristic, case_study, trend, etc.)
3. Chunking structure-aware
4. Enriquecimento de metadata
5. Geracao de embeddings (gemini-embedding-001)
6. Upsert no Pinecone com metadata completa
7. Log no Firestore (ingestion_log) para auditoria
```

### Atualizacao de Identity Cards
Quando novos insights sao frequentes e consistentes:
1. Revisar o identity card do conselheiro relevante
2. Adicionar novos criterios ao `evaluation_frameworks` se necessario
3. Adicionar novos `red_flags` ou `gold_standards` baseados em padroes observados
4. Incrementar `version` no frontmatter
5. **Nunca exceder ~900 tokens** por card (se precisar de mais, vai pro Pinecone)

### Auditoria
Manter tabela `ingestion_log` no Firestore:
```json
{
  "document_id": "...",
  "source_file": "...",
  "chunks_created": 7,
  "counselors_tagged": ["halbert", "ogilvy"],
  "domain": "copy",
  "content_hash": "...",
  "ingested_at": "2026-02-14T...",
  "ingested_by": "system | user_id",
  "version": "2026.v1",
  "status": "active | deprecated | replaced"
}
```

---

## 9. Integracao nos Engines (Mapa Completo)

### Tier 1 — Impacto Maximo (Fase 3)

| Engine | Arquivo | Estado Atual | Integracao Alvo |
|--------|---------|--------------|-----------------|
| Scoring Engine | predictor/scoring-engine.ts | Prompt generico menciona 3 autores | Injetar evaluation_frameworks JSON dos 2-3 experts por dimensao |
| Recommendations | predictor/recommendations.ts | COPYWRITING_FRAMEWORKS hardcoded | Substituir por red_flags + gold_standards reais |
| Autopsy Engine | autopsy/engine.ts | "Heuristicas Wilder" genericas | Frameworks de funnel council por etapa |
| Text Analyzer | text-analyzer/ad-copy-analyzer.ts | Mencao generica a 3 copywriters | Frameworks de Halbert + Schwartz + Bird |

### Tier 2 — Cobertura Ampla (Fase 4)

| Engine | Arquivo | Estado Atual | Integracao Alvo |
|--------|---------|--------------|-----------------|
| Content Generation | content/generation-engine.ts | Zero counselor | Brain do expert mais relevante por tipo |
| Creative Scoring | creative/scoring.ts | Formula-only (ROI) | + Score qualitativo via brain frameworks |
| Ads Generation | ai/prompts/ads-generation.ts | 1-line expertise | Identity cards completos dos 4 ads counselors |
| Social Generation | api/social/generate/route.ts | Templates existem mas nao usados | Conectar templates + identity cards social |

### Tier 3 — Profundidade (Fase 5)

| Engine | Arquivo | Estado Atual | Integracao Alvo |
|--------|---------|--------------|-----------------|
| Offer Lab | offer-lab/scoring.ts | Formula-only | Kennedy offer_architecture + Brunson value_ladder |
| Research Engine | research/engine.ts | Zero counselor | Perspectiva de conselheiros na sintese |
| A/B Testing | ab-testing/engine.ts | Zero counselor | Avaliacao pela lente dos experts |
| Chat System | ai/prompts/chat-system.ts | 1-line por counselor | Resumo do identity card completo |
| Party Mode | ai/prompts/party-mode.ts | 2-3 linhas por agent | Frameworks + principios de cada expert |

### Padrao de Integracao (como cada engine usa o brain)

```typescript
// 1. Carregar o brain
const brain = await loadBrain('gary_halbert');

// 2. Extrair framework relevante
const framework = brain.evaluationFrameworks['headline_score'];

// 3. Montar prompt com framework JSON
const prompt = buildScoringPromptFromBrain('gary_halbert', 'headline_score');

// 4. Enviar ao Gemini com temperature 0.1
const result = await generateWithGemini(prompt, { temperature: 0.1 });

// 5. Resposta inclui opiniao do expert com red_flags e gold_standards
// result.counselorOpinions[0].redFlagsTriggered
// result.counselorOpinions[0].goldStandardsHit
```

---

## 10. Prioridade de Execucao

### Sprint A: Infraestrutura + Identity Cards
- [x] 9 identity cards de Copy (prontos)
- [ ] BrainLoader (types.ts, loader.ts, prompt-builder.ts)
- [ ] Migracao de embedding model (text-embedding-004 → gemini-embedding-001)
- [ ] Fix bug namespace (brand- → brand_)
- [ ] Mover identity cards para app/src/data/identity-cards/
- [ ] 14 identity cards restantes (funnel, social, ads, design)

### Sprint B: Tier 1 Engines
- [ ] Scoring Engine com frameworks reais por dimensao
- [ ] Recommendations com red_flags/gold_standards
- [ ] Autopsy com funnel council frameworks
- [ ] Text Analyzer com copy council frameworks
- [ ] UI: Secao "Opiniao do Conselho" no Predictive Engine

### Sprint C: Tier 2 Engines
- [ ] Content Generation com brains por tipo
- [ ] Creative Scoring com avaliacao qualitativa
- [ ] Ads Generation com identity cards completos
- [ ] Social Generation com templates + identity cards

### Sprint D: Tier 3 + Deep Brain + Evolucao
- [ ] Offer Lab, Research, A/B Testing com brains
- [ ] Chat System e Party Mode enriquecidos
- [ ] Ingestao Deep Brain no Pinecone (com metadata)
- [ ] Pipeline de ingestao continua
- [ ] Migracao LLM (gemini-2.0-flash → gemini-2.5-flash)

---

## 11. Verificacao por Sprint

### Sprint A — Testes de Infra
- [ ] `loadBrain('gary_halbert')` retorna objeto parseado com todos os campos
- [ ] `loadBrainsByDomain('copy')` retorna 9 brains
- [ ] `getAllBrains()` retorna 23 brains
- [ ] `buildScoringPromptFromBrain('gary_halbert', 'headline_score')` gera prompt valido
- [ ] Embedding com gemini-embedding-001 gera vetor de 768 dims
- [ ] Busca no Pinecone com novo embedding retorna resultados coerentes

### Sprint B — Testes de Integracao
- [ ] Scoring Engine retorna `counselorOpinions[]` com score + opinion + redFlagsTriggered
- [ ] Cada dimensao mostra opiniao de 2-3 experts especificos (nao genericos)
- [ ] Recommendations incluem antes/depois dos red_flags reais
- [ ] UI do Predictive Engine mostra cards individuais por expert

### Sprint C — Testes de Geracao
- [ ] Ads gerados incluem counselorInsights referenciando framework especifico
- [ ] Social posts gerados seguem heuristicas de plataforma
- [ ] Content generation usa brain relevante ao tipo

### Sprint D — Testes de Profundidade
- [ ] Chat mode injeta identity cards completos no system prompt
- [ ] Party mode debates referenciam frameworks especificos
- [ ] Pinecone query com filter `counselor: 'dan_kennedy'` retorna chunks relevantes
- [ ] Pipeline de ingestao processa novo documento e disponibiliza em <5 min

---

## 12. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Token overflow (muitos experts no prompt) | Qualidade degrada, custo sobe | Max 3-4 experts + budget de 2.500 tokens |
| Embedding model para de funcionar | RAG quebra completamente | Migrar ANTES da Fase 6 (Sprint A) |
| LLM deprecated | App inteira para | Migrar ate 15 Marco 2026 (buffer de 2 semanas) |
| Namespace bug perde contexto | Respostas sem dados da marca | Fix na Sprint A |
| Identity cards ficam desatualizados | Conselhos obsoletos | Pipeline de evolucao + revisao trimestral |
| Pinecone chunks mal tagados | Expert recebe info irrelevante | Metadata obrigatoria + validacao na ingestao |

---

## Apendice A: Arquivos Criticos

### Novos (a criar)
- `app/src/lib/intelligence/brains/types.ts`
- `app/src/lib/intelligence/brains/loader.ts`
- `app/src/lib/intelligence/brains/prompt-builder.ts`
- `app/src/data/identity-cards/*.md` (23 arquivos)

### A modificar
- `app/src/lib/ai/embeddings.ts` (migracao embedding model)
- `app/src/lib/ai/context-assembler.ts` (fix namespace)
- `app/src/lib/intelligence/predictor/scoring-engine.ts` (frameworks reais)
- `app/src/lib/intelligence/predictor/recommendations.ts` (red flags reais)
- `app/src/lib/intelligence/autopsy/engine.ts` (funnel council)
- `app/src/lib/intelligence/text-analyzer/ad-copy-analyzer.ts` (copy council)
- `app/src/lib/content/generation-engine.ts` (brain por tipo)
- `app/src/lib/ai/prompts/ads-generation.ts` (identity cards ads)
- `app/src/lib/ai/prompts/chat-system.ts` (identity cards por modo)
- `app/src/lib/ai/prompts/party-mode.ts` (frameworks + principios)
- `app/src/components/intelligence/predictor/prediction-panel.tsx` (UI opiniao conselho)

### Fontes de conteudo
- `brain/identity-cards/` (9 copy cards prontos)
- `_netecmt/brain/council/` (identity, heuristics, anti-patterns, mental-models, case-library, playbooks, scorecards)
- `_netecmt/brain/social/` (identity, heuristics, playbooks, scorecards)

---

## Apendice B: Decisoes Tecnicas

1. **Identity cards em filesystem (nao banco):** Cards sao lidos via `fs.readFileSync` no server-side do Next.js. Simples, rapido, versionavel via git.

2. **Cache em memoria (Map):** BrainLoader carrega todos os cards uma vez e guarda em Map. Invalidacao: restart do server (aceitavel para cards que mudam raramente).

3. **JSON dentro de Markdown:** Os evaluation_frameworks sao JSON puro dentro de code blocks no MD. O loader parseia especificamente esses blocos. Isso permite que o arquivo seja legivel como documentacao E parseavel como dados.

4. **Gemini ja conhece os autores:** NAO estamos "ensinando" o Gemini quem e Halbert. Estamos fornecendo uma ESTRUTURA CONSISTENTE de avaliacao para que ele aplique o conhecimento que ja tem de forma padronizada e mensuravel.

5. **Pinecone Deep Brain e complementar:** A maioria das operacoes funciona SEM Pinecone (usando apenas identity cards). O Pinecone adiciona profundidade para chat avancado e analises profundas.
