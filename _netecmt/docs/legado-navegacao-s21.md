# Relatório Técnico: Legado de Navegação - Sprint 21
**Agente:** Wilder (Analyst)
**Data:** 29/01/2026
**Status:** Concluído para Athos (Arch)

## 1. Mapeamento da Estrutura Atual (Sidebar)
O componente principal da navegação é o `Sidebar` em `app/src/components/layout/sidebar.tsx`. Ele consome a constante `NAV_ITEMS` definida em `app/src/lib/constants.ts`.

### Itens Atuais no Menu (NAV_ITEMS):
1. **Home** (`/`)
2. **Campanhas** (`/campaigns`)
3. **Chat** (`/chat`)
4. **Funis** (`/funnels`)
5. **Copy** (`/chat?mode=copy`) - *Alias para Chat*
6. **Ads** (`/chat?mode=ads`) - *Alias para Chat*
7. **Design** (`/chat?mode=design`) - *Alias para Chat*
8. **Social** (`/social`)
9. **Marcas** (`/brands`)
10. **Brand Hub** (`/brand-hub`)
11. **Analytics** (`/analytics`)
12. **Ativos** (`/assets`)
13. **Biblioteca** (`/library`)
14. **Vault** (`/vault`)
15. **Configurações** (`/settings`)
16. **Integrações** (`/integrations`)
17. **Automação** (`/automation`)
18. **Preditivo** (`/intelligence/predictive`)
19. **Agência** (`/dashboard`)

## 2. Funcionalidades Órfãs (Páginas sem Link Direto)
Identificamos diversas rotas de "Inteligência" e "Performance" que existem no sistema de arquivos mas não estão no menu principal:

### Ala de Inteligência:
- `/intelligence` (Dashboard Geral de Inteligência)
- `/intelligence/attribution` (Atribuição)
- `/intelligence/creative` (Análise Criativa)
- `/intelligence/journey/[leadId]` (Jornada do Lead)
- `/intelligence/ltv` (LTV)
- `/intelligence/offer-lab` (Laboratório de Ofertas - *Link apenas via Tab interna*)
- `/intelligence/personalization` (Personalização Dinâmica)

### Ala de Performance/Execução:
- `/performance` (Dashboard de Performance)
- `/performance/cross-channel` (Análise Cross-Channel)
- `/social-inbox` (Inbox Social unificado)
- `/campaign/[id]` (Rota duplicada/inconsistente com `/campaigns/[id]`)

### Funcionalidades "Escondidas" em Abas:
- **Keywords**: Atualmente é apenas uma aba dentro de `/intelligence`.
- **Spy Agent**: Funcionalidades de scan e dossiê estão dentro de abas em `/intelligence`.

## 3. Inconsistências de Ícones e UI
- **Duplicação de Ícones**:
  - `Ads` e `Analytics` usam o mesmo ícone `BarChart3`.
  - `Campanhas` e `Automação` usam o mesmo ícone `Zap`.
  - `Marcas` e `Agência` usam o mesmo ícone `Building2`.
- **Mapeamento de Ícones**: O arquivo `app/src/lib/icon-maps.ts` define o `SIDEBAR_ICONS`, mas há avisos de "Ícone não mapeado" no console para itens novos se não forem registrados manualmente.

## 4. Diagnóstico para Nova Arquitetura (Athos)
A estrutura atual é uma lista flat sem hierarquia clara. Para a nova arquitetura (Inteligência -> Estratégia -> Execução), sugerimos:

1. **Grupo Inteligência**: Unificar `/intelligence`, `/intelligence/discovery` (Keywords + Spy), e `/intelligence/attribution`.
2. **Grupo Estratégia**: Unificar `/funnels`, `/intelligence/offer-lab` (Offer Lab), e o novo `Funnel Autopsy`.
3. **Grupo Execução**: Unificar `/campaigns`, `/social`, `/social-inbox`, e `/automation`.
4. **Grupo Gestão**: `/brands`, `/brand-hub`, `/assets`, `/settings`.

## 5. Próximos Passos Recomendados
- [ ] Criar a rota `/intelligence/discovery` para centralizar Keywords e Spy Agent.
- [ ] Unificar as rotas `/campaign/` e `/campaigns/`.
- [ ] Implementar submenus ou agrupamentos na Sidebar para reduzir a carga cognitiva.
- [ ] Atualizar o `SIDEBAR_ICONS` com ícones distintos para Analytics (ex: `PieChart`) e Ads (ex: `Megaphone`).

---
*Relatório gerado por Wilder (Analyst) - NETECMT v2.0*
