---
id: 0c4887b1-38a0-4209-b2bb-22268512636d
counselor: russell_brunson
docType: case
version: 2024-12-25.v1
docSubtype: anti-pattern
business: null
scope: quiz_funnel
channel: all
stage: acquisition
status: approved
severity: high
legacyDocType: anti-pattern
---
# Anti-Pattern: Single Landing Page

> Uma landing page única é como tentar vender o mesmo remédio para todas as doenças.

## 🚫 O Erro

Usar uma única landing page para todo o tráfego, independente de fonte, segmento demográfico, ou ângulo de criativo. Especialmente crítico em quiz funnels onde micro-segmentação é a chave da escala.

## 🔍 Como Identificar

### Sintomas Claros
- Mesma URL para todos os ads
- Landing page "genérica" que tenta falar com todos
- Copy que não menciona nenhum segmento específico
- Imagens que não refletem audiência específica
- Headline única para múltiplos ângulos de criativo

### Métricas de Alerta
- CTR estagnado independente de criativo
- CVR consistente mas baixo (< 10%)
- Escala travada: mais budget = mesmos resultados
- Criativos "saturando" rápido

## 📉 Por Que Falha

| Problema | Impacto |
|----------|---------|
| Desconexão criativo → LP | Promessa do ad não confirmada |
| Mensagem diluída | Tenta falar com todos, ressoa com ninguém |
| Sem personalização visual | Audiência não se vê refletida |
| Limitação de escala | Uma LP = um slice do mercado |
| Testes de criativo invalidados | LP constante limita aprendizado |

### A Matemática do Problema

```
Exemplo:
- Mercado total: 10M pessoas
- 1 LP genérica: atinge ~10% = 1M pessoas
- 50 LPs segmentadas: atinge ~50% = 5M pessoas

Resultado: 5x mais mercado acessível
```

## ✅ Correção

### Princípio: Message Match + Segment Match

```
Cada combinação de:
CRIATIVO + SEGMENTO + ÂNGULO
deve ter sua própria landing page
```

### Framework de Segmentação

**Nível 1: Básico (5-10 LPs)**
- Por objetivo principal (3-5 variantes)
- Por fonte de tráfego (2-3 variantes)

**Nível 2: Intermediário (20-50 LPs)**
- Por objetivo x demografia
- Por ângulo de criativo
- Por nível de consciência

**Nível 3: Avançado (100+ LPs)**
- Combinações completas
- Personalização dinâmica
- A/B testing em escala

### Exemplo de Segmentação (Fitness)

| LP | Segmento | Headline | Imagem |
|----|----------|----------|--------|
| LP-1 | Homens 25-34, perda peso | "Perca 10kg em 12 semanas sem academia" | Homem 30 anos, antes/depois |
| LP-2 | Mulheres 35-44, definição | "Defina seu corpo após os 35" | Mulher 40 anos, definida |
| LP-3 | Homens 45+, energia | "Recupere a energia dos seus 30" | Homem 50 anos, ativo |
| LP-4 | Mulheres 25-34, perda peso | "Emagreça de forma saudável" | Mulher 28 anos, transformação |

**Referência:** MadMuscles usa 493 landing pages para 10M visitas/mês.

## 🎯 Implementação Prática

### Fase 1: Identificar Segmentos

1. Listar objetivos principais (3-5)
2. Listar demografias relevantes (3-5)
3. Listar ângulos de criativo (3-5)
4. Criar matriz de combinações

### Fase 2: Priorizar

1. Começar com top 10 combinações
2. Criar LPs para cada
3. Testar por 2-4 semanas
4. Identificar vencedoras

### Fase 3: Escalar

1. Expandir combinações vencedoras
2. Adicionar mais segmentos
3. Testar novos ângulos
4. Iterar baseado em dados

### Estrutura de LP Segmentada

```
[Headline específica para segmento]
↓
[Hero image que reflete audiência]
↓
[Sub-headline com dor específica]
↓
[Quiz CTA]
↓
[Prova social do segmento]
↓
[FAQ específico]
```

## 📊 Métricas de Sucesso

| Métrica | Antes (1 LP) | Depois (50 LPs) |
|---------|--------------|-----------------|
| CTR médio | 1.5% | 2.5% (+67%) |
| CVR (LP → Quiz) | 8% | 15% (+87%) |
| Escala máxima | $30k/mês | $150k/mês (+400%) |
| Criativos vencedores | 3-5 | 20-30 |

## 🔗 Relacionados

- [Case: MadMuscles Quiz Funnel](../case-library/quiz/madmuscles-quiz-funnel-2025.md)
- [Heurística: Quiz Funnel Scale](../heuristics/quiz_funnel_scale.md)
- [Mental Model: Micro-Segmentation](../mental-models/micro_segmentation_framework.md)

