# ADR: Aprovação Sprint 13 - Intelligence Wing Foundation

**Data:** 22/01/2026  
**Status:** ✅ Aprovado  
**Participantes:** Alto Conselho (Iuran, Athos, Leticia, Wilder, Dandara)

---

## Contexto

Com a conclusão bem-sucedida da Sprint 12 (Deep Intelligence), o projeto está pronto para iniciar a expansão **Agency Engine**. O primeiro módulo proposto é a **Ala de Inteligência**, responsável por capturar, processar e entregar insights acionáveis do mundo exterior.

## Proposta Original

O usuário sugeriu 4 itens de escopo para o PRD:
1. MVP de Social Listening (monitoramento de menções)
2. Estrutura de storage para dados de inteligência
3. Interface do Intelligence Dashboard
4. Integração inicial com Twitter/X API ou similar

## Deliberação

### Pareceres dos Agentes

| Agente | Parecer | Condições |
|:-------|:--------|:----------|
| **Wilder** | ✅ Aprovar | Documentação pronta para suportar PRD |
| **Athos** | ✅ Aprovar | Revisar integração Twitter/X (API paga) |
| **Leticia** | ⚠️ Reduzir escopo | 4 itens excedem capacidade (~50-60 SP vs 40 SP disponíveis) |
| **Dandara** | ✅ Aprovar | Exigir graceful degradation para fontes externas |

### Decisões Tomadas

1. **Substituir Twitter/X API por Multi-Source Ingestion**
   - **Motivo:** API v2 do X é paga e restritiva
   - **Alternativa:** Scraping controlado + RSS + Google News

2. **Reduzir escopo para 3 itens P0/P1**
   - Intelligence Storage Foundation (P0)
   - Social Listening MVP (P0)
   - Intelligence Dashboard Skeleton (P1)

3. **Adiar integrações complexas para Sprint 14+**
   - Twitter/X API (requer avaliação de custos)
   - Competitor Intelligence
   - Alertas Automatizados

## Guardrails Aprovados

| Guardrail | Justificativa |
|:----------|:--------------|
| Multi-Tenant First | Isolamento de dados por brandId desde o início |
| Graceful Degradation | Fontes externas são instáveis |
| No Admin SDK | Restrição de ambiente (Windows 11 24H2) |
| Polling over Streaming | Simplicidade para MVP |

## Consequências

### Positivas
- Escopo realista para capacidade da sprint
- Flexibilidade na escolha de fontes de dados
- Fundação sólida para expansões futuras

### Negativas
- Atraso na integração com APIs oficiais de redes sociais
- Dashboard será skeleton (sem métricas reais) nesta sprint

## Próximos Passos

1. **Athos** → Elaborar Contract Map da Ala de Inteligência
2. **Leticia** → Criar Story Pack com acceptance criteria
3. **Darllyson** → Implementar após Story Pack Ready

---

*Assinado: Alto Conselho NETECMT*  
*Sessão de Deliberação: 22/01/2026*
