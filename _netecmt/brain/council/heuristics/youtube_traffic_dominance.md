---
id: 1986b438-3ee0-4cc4-8022-024d57a79b57
counselor: sam_ovens
docType: heuristic
version: 2024-12-25.v1
business: generic
scope: traffic
channel: youtube_ads
stage: acquisition
status: approved
sources:
  - "MadMuscles Case Study 2025"
  - "Sam Ovens - Consulting.com"
  - "YouTube Ads Best Practices 2024"
legacyDocType: heuristics
---
# Heurísticas: Dominância com YouTube Ads

## Contexto de Aplicação

Este documento apresenta regras práticas para usar YouTube Ads como canal principal de aquisição. Especialmente relevante para quiz funnels, produtos de consideração média, e nichos onde Meta está saturado ou restrito.

## 12 Regras de YouTube Ads para Escala

### 1. Se Meta está saturado ou restrito no seu nicho, ENTÃO YouTube é sua alternativa de escala

**Porque:** YouTube tem menos advertisers, mais inventory, menos restrições em alguns nichos.
**Exceção:** Produtos de impulso puro (YouTube é consideração média-alta).
**Aplicação:** Testar YouTube com 10-20% do budget Meta.
**Métrica:** CAC comparativo YouTube vs Meta.
**Referência:** MadMuscles: ~$10M/ano em YouTube Ads.

### 2. Se você está gastando > $100k/mês em Meta e CPMs estão subindo, ENTÃO YouTube é escape valve

**Porque:** Diversificação de canais reduz dependência e risco.
**Exceção:** Meta ainda performando dentro de target.
**Aplicação:** Mover 20-30% do budget para YouTube ao atingir limite de escala.
**Métrica:** CPM trend, ROAS trend, escala alcançável.

### 3. Se seu produto precisa de explicação, ENTÃO YouTube é superior

**Porque:** Formato de vídeo longo permite educar antes de converter.
**Exceção:** Produto extremamente simples de entender.
**Aplicação:** Criativos de 30s-2min que explicam problema e solução.
**Métrica:** View through rate, conversão assistida.

### 4. Se seu ticket é > R$500, ENTÃO YouTube converte melhor que Meta

**Porque:** Audiência YouTube é mais paciente, aceita conteúdo longo, decisão mais considerada.
**Exceção:** Ofertas de impulso (flash sales).
**Aplicação:** YouTube para high ticket, Meta para low ticket volume.
**Métrica:** Taxa de conversão por ticket range.

### 5. Se você não está usando Skippable In-Stream, ENTÃO está perdendo o formato vencedor

**Porque:** In-stream permite hook nos primeiros 5s + conteúdo completo.
**Exceção:** Remarketing pode usar outros formatos.
**Aplicação:** 80%+ do budget em Skippable In-Stream.
**Métrica:** CTR por formato.

### 6. Se seu hook não funciona em 5 segundos, ENTÃO você está pagando por skip

**Porque:** Usuário pode pular após 5s. Hook fraco = impressão desperdiçada.
**Exceção:** Nenhuma - sempre otimizar hook.
**Aplicação:** Testar 10-20 variações de hook por criativo base.
**Métrica:** View rate (% que assiste > 30s).

### 7. Se você está usando apenas Target CPA, ENTÃO está limitando escala

**Porque:** Performance Max e tROAS podem escalar além de tCPA.
**Exceção:** Budget muito baixo (< $10k/mês).
**Aplicação:** tCPA para validar, tROAS/Performance Max para escalar.
**Métrica:** Volume de conversões vs. eficiência.

### 8. Se você não tem remarketing no YouTube, ENTÃO está deixando dinheiro na mesa

**Porque:** Visitantes não-convertidos são audiência quente.
**Exceção:** Nenhuma.
**Aplicação:** Remarketing para visitantes de quiz, cart abandoners, etc.
**Métrica:** ROAS de remarketing vs. cold.

### 9. Se seus criativos YouTube são adaptações de Meta, ENTÃO você está sub-otimizando

**Porque:** Formato e expectativa do usuário são diferentes.
**Exceção:** Testes iniciais para validar conceito.
**Aplicação:** Criativos nativos para YouTube: mais longos, mais educativos.
**Métrica:** Performance de nativo vs. adaptado.

### 10. Se você não está usando Custom Intent audiences, ENTÃO está perdendo targeting poderoso

**Porque:** Custom Intent permite targetar por pesquisas no Google.
**Exceção:** Nenhuma.
**Aplicação:** Criar audiences baseadas em keywords de intenção.
**Métrica:** Performance por tipo de audience.

### 11. Se você está gastando > $50k/mês e não tem exclusions, ENTÃO está desperdiçando

**Porque:** Sem exclusions, você paga por impressões em canais irrelevantes.
**Exceção:** Performance Max (menos controle).
**Aplicação:** Excluir: kids content, live streams, canais não-alvo.
**Métrica:** CTR antes/depois de exclusions.

### 12. Se seu funil é quiz, ENTÃO YouTube é canal ideal

**Porque:** Quiz requer consideração; YouTube audiência está em modo consideração.
**Exceção:** Quiz muito curto/simples.
**Aplicação:** Ad educativo → Quiz → Resultado → Oferta.
**Métrica:** Taxa de conclusão de quiz por fonte.
**Referência:** MadMuscles: YouTube → Quiz = 10M visitas/mês.

## Estrutura de Campanha Recomendada

### Arquitetura de Conta

```
Account
├── Cold Traffic
│   ├── Campaign: Custom Intent (keywords de problema)
│   ├── Campaign: Custom Intent (keywords de solução)
│   ├── Campaign: Affinity (interesses relacionados)
│   └── Campaign: Lookalike (similar to converters)
├── Warm Traffic
│   ├── Campaign: Remarketing Site (30 dias)
│   ├── Campaign: Video Viewers (engajados)
│   └── Campaign: Cart Abandoners
└── Scale
    ├── Campaign: Performance Max (validados)
    └── Campaign: tROAS (alto budget)
```

### Estrutura de Criativo

```
0-5s: HOOK (prender atenção, não pode ser pulado)
      "Se você [problema], preste atenção..."
      
5-30s: PROBLEMA (amplificar dor)
       Descrever situação atual, consequências
       
30-60s: SOLUÇÃO (apresentar método)
        Introduzir quiz/produto como caminho
        
60-90s: PROVA (credibilidade)
        Resultados, números, depoimentos
        
90-120s: CTA (ação clara)
         "Clique para fazer o quiz gratuito"
```

## Métricas de Benchmark YouTube

| Métrica | Ruim | OK | Bom | Excelente |
|---------|------|-----|-----|-----------|
| View Rate (30s+) | <15% | 15-25% | 25-35% | >35% |
| CTR | <0.3% | 0.3-0.7% | 0.7-1.5% | >1.5% |
| CPV | >R$0.15 | R$0.10-0.15 | R$0.05-0.10 | <R$0.05 |
| CPC (para quiz) | >R$5 | R$2-5 | R$1-2 | <R$1 |
| ROAS (30 dias) | <2x | 2-3x | 3-5x | >5x |

## Checklist de Implementação

### Setup Inicial
- [ ] Pixel de conversão instalado
- [ ] Audiences base criadas (Custom Intent, Affinity)
- [ ] Exclusions configuradas (kids, irrelevant)
- [ ] Conversões configuradas corretamente

### Produção de Criativos
- [ ] 5+ hooks diferentes testados
- [ ] Estrutura nativa YouTube (não adaptação)
- [ ] Duração adequada (30s-2min)
- [ ] CTA claro no final

### Lançamento
- [ ] Budget inicial: $50-100/dia por campaign
- [ ] tCPA inicial (após 15-20 conversões: testar tROAS)
- [ ] Monitoring diário primeiros 7 dias
- [ ] Kill campaigns com CTR < 0.3% após $500

### Escala
- [ ] Aumentar budget 20% a cada 3-5 dias
- [ ] Adicionar novas audiences
- [ ] Testar Performance Max
- [ ] Expandir para mais países

