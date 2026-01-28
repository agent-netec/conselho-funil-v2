---
id: c0d31ff1-d218-43c2-bab7-880d0ee4105e
counselor: sam_ovens
docType: case
version: 2024-12-22.v1
business: example_saas
scope: saas
channel: meta_ads
stage: qualify
status: approved
outcome: success
---
# Case: Quiz Funnel para SaaS B2B

> Redução de 60% no CAC de calls qualificadas usando quiz de diagnóstico.

## 📋 Contexto

| Campo | Valor |
|-------|-------|
| **Tipo de negócio** | SaaS B2B (automação de marketing) |
| **Ticket** | R$500-2.000/mês (recorrente) |
| **Modelo** | Demo → Trial → Contrato |
| **Canal principal** | Meta Ads |
| **Problema** | CAC de call alto, baixa qualificação |

## 🎯 Situação Inicial

### Funil Anterior
```
Ad → Landing Page → Formulário → Call de Demo
```

### Métricas Antes
| Métrica | Valor |
|---------|-------|
| Custo por lead | R$45 |
| Taxa de agendamento | 25% |
| Taxa de show | 50% |
| Taxa de qualificação | 40% |
| **Custo por call qualificada** | **R$900** |

### Problemas Identificados
1. Leads não sabiam se eram fit
2. Muitas calls com empresas pequenas demais
3. Equipe de vendas frustrada
4. Desperdício de budget em leads errados

## 💡 Solução Implementada

### Novo Funil
```
Ad (problema) → Quiz (8 perguntas) → Resultado Segmentado → 
CTA diferenciado por score → Call/Trial/Nurture
```

### Estrutura do Quiz

**Pergunta 1: Tamanho da lista de emails**
- < 1.000 → 0 pontos (disqualify)
- 1.000-10.000 → 1 ponto
- > 10.000 → 2 pontos

**Pergunta 2: Faturamento mensal**
- < R$20k → 0 pontos (disqualify)
- R$20-100k → 1 ponto
- > R$100k → 2 pontos

**Pergunta 3: Ferramenta atual**
- Nenhuma → 1 ponto (alto potencial)
- Básica (Mailchimp) → 2 pontos (pronto para upgrade)
- Avançada (HubSpot) → 0 pontos (difícil migração)

**Pergunta 4: Principal dor**
- "Não sei se funciona" → Foco em analytics
- "Demora muito" → Foco em automação
- "Não escala" → Foco em enterprise

**Pergunta 5-8:** Refinamento + coleta de dados

### Segmentação por Score

| Score | Segmento | CTA | Destino |
|-------|----------|-----|---------|
| 0-3 | Não qualificado | "Baixe nosso guia" | Lead magnet + nurture |
| 4-6 | Qualificado básico | "Teste grátis 14 dias" | Trial self-service |
| 7-10 | Qualificado premium | "Agende demo personalizada" | Call com vendedor |

### Página de Resultado

```
"Seu Diagnóstico de Automação"

Score: 8/10 - Empresa Pronta para Escalar

Baseado nas suas respostas, identificamos:
✅ Sua lista tem potencial de crescimento
✅ Seu faturamento justifica investimento
⚠️ Sua ferramenta atual está limitando crescimento

Recomendação: Demo personalizada com nosso especialista
[Agendar Demo em 15min] ← CTA principal

Não tem tempo agora?
[Receber análise detalhada por email] ← CTA secundário
```

## 📊 Resultados

### Métricas Depois (90 dias)
| Métrica | Antes | Depois | Δ |
|---------|-------|--------|---|
| Custo por lead | R$45 | R$38 | -15% |
| Taxa de agendamento | 25% | 45% | +80% |
| Taxa de show | 50% | 75% | +50% |
| Taxa de qualificação | 40% | 85% | +112% |
| **Custo por call qualificada** | **R$900** | **R$360** | **-60%** |

### ROI do Projeto
- Investimento: ~R$15.000 (setup + design + dev)
- Economia mensal: ~R$25.000 (baseado em 50 calls/mês)
- Payback: < 1 mês

## 🔑 Aprendizados

### O Que Funcionou
1. **Self-qualification:** Lead decide se é fit antes de gastar tempo
2. **Segmentação dinâmica:** Cada segmento recebe CTA adequado
3. **Dados ricos:** Quiz coletou insights para personalizar call
4. **Expectativa alinhada:** Lead chega sabendo o que esperar

### O Que Ajustaríamos
1. Quiz inicial era longo (12 perguntas) → Reduzido para 8
2. Resultado era genérico → Adicionamos personalização
3. Nurture de não-qualificados era fraco → Criamos sequência específica

### Armadilhas Evitadas
- ❌ Quiz muito longo (> 10 perguntas)
- ❌ Perguntas que não filtram de verdade
- ❌ Resultado igual para todos
- ❌ CTA único independente do score

## 📐 Framework Replicável

### Para Implementar Quiz Funnel

1. **Defina critérios de qualificação** (3-5 critérios inegociáveis)
2. **Transforme critérios em perguntas** (respostas = pontos)
3. **Crie 3 segmentos** (não qualificado, básico, premium)
4. **Defina CTA por segmento** (cada um tem destino próprio)
5. **Personalize resultado** (diagnóstico, não só score)
6. **Configure nurture** (especialmente para não-qualificados)

## 🔗 Relacionados

- [Heurística: Aquisição & Qualificação](../heuristics/aquisicao_qualificacao.md)
- [Anti-pattern: Qualificação Tardia](../anti-patterns/qualificacao_tardia.md)
- [Scorecard de Funil](../scorecards/scorecard_funnel.md)


