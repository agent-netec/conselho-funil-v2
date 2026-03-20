# Sprint 09 — Discovery Upgrades (Keywords + Spy)

> **Máxima:** Progressão Contínua — Zero Becos Sem Saída
> **Bloqueado por:** Sprint 07 (Brand Intelligence Layer)
> **Ref doc master:** Seção Discovery (auditoria)
> **Estimativa:** 5-7 dias

---

## Contexto

Keywords Miner e Spy Agent funcionam bem standalone mas dados não fluem e botões placeholder existem. Com o Brand Intelligence Layer (Sprint 07) pronto, agora os dados salvos são automaticamente consumidos por todos os engines.

---

## Tarefa 09.1 — Keywords: Clustering por Schwartz

**Ref:** M1 — Clustering semântico por estágio de consciência

Agrupar keywords por estágio de consciência do Schwartz (já temos nos brains):

```typescript
// POST /api/intelligence/keywords/cluster
// Gemini classifica cada keyword: unaware, problem_aware, solution_aware, product_aware

const prompt = `Classifique estas keywords por nível de consciência do público:
- Unaware: não sabe que tem o problema
- Problem Aware: sabe do problema, não conhece soluções
- Solution Aware: conhece soluções genéricas
- Product Aware: conhece produtos específicos

Keywords: ${terms.map(k => k.term).join(', ')}

Retorne JSON: { "clusters": [{ "stage": "problem_aware", "terms": ["keyword1", "keyword2"] }] }`;
```

### UI:
Tabs ou sections por estágio com badge de quantidade.

### Critérios de aceitação:
- [ ] Keywords agrupadas por Schwartz awareness stage
- [ ] UI mostra clusters com labels amigáveis
- [ ] Clusters salvos no Firestore (disponíveis para Brand Intelligence)
- [ ] Custo: 1 crédito

---

## Tarefa 09.2 — Keywords: Export CSV

**Ref:** M2

### Botão "Exportar CSV" com colunas:

```csv
Termo,Volume,Dificuldade,Intenção,KOS,Cluster
"como emagrecer rápido",12000,45,informational,78,problem_aware
"melhor dieta 2026",8500,62,commercial,65,solution_aware
```

### Critérios de aceitação:
- [ ] Botão "Exportar" visível na toolbar
- [ ] CSV com todas as colunas
- [ ] Encoding UTF-8
- [ ] Filtro (exportar todos ou só selecionados)

---

## Tarefa 09.3 — Spy: Descoberta de concorrentes por nicho

**Ref:** P1

### Hoje: Spy analisa URL que o usuário fornece. Não descobre concorrentes.

### Novo: Busca automática de concorrentes no nicho:

```typescript
// POST /api/intelligence/spy/discover
// Body: { brandId }

// 1. Carrega brand context (vertical, oferta, público)
// 2. Busca via Firecrawl: top 10 resultados do Google para termos do nicho
// 3. Gemini filtra/ranqueia usando contexto da marca:
//    - Concorrente direto (mesmo público, mesma oferta)
//    - Concorrente indireto (mesmo público, oferta diferente)
//    - Referência (nicho adjacente, boas práticas)
// 4. Retorna lista com nome, URL, tipo, relevância score

const prompt = `Analise estes sites encontrados para o nicho "${brand.vertical}":
${results.map(r => `- ${r.url}: ${r.title}`).join('\n')}

Contexto da marca:
- Oferta: ${brand.offer.what}
- Público: ${brand.audience.who}
- Diferencial: ${brand.offer.differentiator}

Classifique cada um como:
- "direto" (mesmo público + oferta similar)
- "indireto" (mesmo público + oferta diferente)
- "referência" (nicho adjacente + boas práticas)
- "irrelevante"

Retorne JSON: { "competitors": [{ "url", "name", "type", "relevance": 0-100, "reason" }] }`;
```

### Custo: 2 créditos

### Critérios de aceitação:
- [ ] Botão "Descobrir concorrentes" na página Discovery
- [ ] Lista de 5-10 concorrentes com tipo e relevância
- [ ] Click no concorrente → roda Spy Agent nele
- [ ] Dados salvos no Firestore

---

## Tarefa 09.4 — Spy: Scan simplificado (links de saída)

**Ref:** P3

### Em vez de crawlear 20 páginas, scan da página principal + detectar links de saída:

```typescript
// No spy analyze, adicionar:
const outboundLinks = extractOutboundLinks(scrapedContent);
// Classificar: checkout, obrigado, upsell, WhatsApp, formulário, blog, redes sociais

// UI: "Páginas do funil detectadas"
// Usuário clica para scan individual de cada link
```

### Critérios de aceitação:
- [ ] Links de saída detectados e classificados
- [ ] UI mostra como "mapa do funil"
- [ ] Click em link → roda scan nele
- [ ] Não crawlea automaticamente (economia)

---

## Tarefa 09.5 — Remover botões placeholder

**Ref:** Discovery — "O que NÃO funciona"

### Botões que existem mas não fazem nada:
- ❌ "Send to MKTHONEY Copy" → remover (Brand Intelligence Layer resolve)
- ❌ "Aplicar Insights" no funil → remover (Brand Intelligence Layer resolve)

### Critérios de aceitação:
- [ ] Zero botões que fazem toast "coming soon"
- [ ] Ações futuras ficam no Brand Intelligence Layer (automático)

---

## Tarefa 09.6 — Miner: Cruzamento com Spy via clusters

**Ref:** M3

### Botão "Descobrir concorrentes nesse ângulo" no cluster de keywords:

```
Cluster: "problem_aware" — Keywords sobre emagrecer
[Descobrir quem ranqueia para essas keywords →]
→ Usa P1 (Spy discover) com o cluster como contexto
→ 1 chamada, não 50
```

### Critérios de aceitação:
- [ ] Botão no cluster leva para Spy discover com contexto
- [ ] 1 chamada (não 1 por keyword)
- [ ] Resultado mostra concorrentes relevantes ao cluster

---

## Check de Progressão Contínua

```
Usuário minera keywords
  ↓ 50+ keywords com volume, dificuldade, intent
  ↓ Clusters por Schwartz (organizados)
  ↓ PRÓXIMO PASSO: "Exportar CSV →" ou "Descobrir concorrentes nesse cluster →"
  ↓ Brand Intelligence: keywords fluem para Copy, Social, Ads

Usuário descobre concorrentes
  ↓ 5-10 concorrentes classificados
  ↓ PRÓXIMO PASSO: "Analisar esse concorrente →" (Spy Agent)
  ↓ Spy insights → Brand Intelligence → todos os engines

Zero dados que morrem. Zero botões que não funcionam.
```
