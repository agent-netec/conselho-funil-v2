# 📦 Story Pack: Sprint 21 - UX/UI War Room & Navigation Restructuring

**Agente:** Leticia (Scrum Master)  
**Data:** 29/01/2026  
**Status:** `ready`  
**Referência Técnica:** `_netecmt/contracts/navigation-schema.yaml`

---

## 🎯 Objetivo do Pack
Reestruturar a experiência de navegação do Conselho de Funil, migrando de uma lista plana para uma hierarquia lógica baseada no fluxo de valor: **Inteligência -> Estratégia -> Execução -> Gestão**.

---

## 📑 Stories

### 1. [ST-21.1] Implementar Sidebar Hierárquica (Core Navigation)
**Descrição:** Atualizar o componente de Sidebar para suportar o agrupamento lógico definido no contrato do Athos.
- **Critérios de Aceitação:**
  - Implementar os 4 grupos principais: `intelligence`, `strategy`, `execution`, `management`.
  - Cada grupo deve exibir seu `label` e `icon` correspondente (Lucide).
  - Itens de menu devem estar aninhados em seus respectivos grupos.
  - Sidebar deve ser colapsável, mantendo a semântica visual dos grupos.
- **Contrato:** `navigation.groups` em `navigation-schema.yaml`.

### 2. [ST-21.2] Criar Páginas Âncoras e Discovery Hub
**Descrição:** Implementar as rotas e estruturas básicas para as novas páginas de Inteligência.
- **Critérios de Aceitação:**
  - Criar `/intelligence` (Dashboard de Insights).
  - Criar `/intelligence/discovery` (Discovery Hub) com placeholders para "Keywords" e "Spy Agent".
  - Garantir que o breadcrumb reflita a nova hierarquia.
- **Contrato:** `navigation.groups[0].items` em `navigation-schema.yaml`.

### 3. [ST-21.3] Unificação de Rotas e Refatoração de Links
**Descrição:** Corrigir redirecionamentos e unificar rotas conforme o novo mapa de navegação.
- **Critérios de Aceitação:**
  - Unificar `/campaign` e `/campaigns` para `/campaigns`.
  - Atualizar links de `Ads` e `Copy` para apontarem para o Chat com os parâmetros de modo corretos (`?mode=ads`, `?mode=copy`).
  - Implementar o `Funnel Autopsy` em `/strategy/autopsy`.
- **Contrato:** `navigation.groups[1]` e `navigation.groups[2]` em `navigation-schema.yaml`.

### 4. [ST-21.4] Sincronização de Ícones e Tipagem
**Descrição:** Garantir que todos os ícones Lucide definidos no contrato estejam mapeados e disponíveis no sistema.
- **Critérios de Aceitação:**
  - Atualizar `app/src/lib/icon-maps.ts` com os novos ícones: `Stethoscope`, `Beaker`, `Compass`, `Brain`, `Zap`, `ShieldCheck`.
  - Validar a tipagem `LucideIcon` em todos os novos mapeamentos.
- **Contrato:** `icon_mapping` em `navigation-schema.yaml`.

---

## 🛑 Definition of Ready (DoR)
- [x] Contrato de Navegação assinado pelo Athos.
- [x] Mapeamento de ícones validado.
- [x] Stories quebradas e priorizadas.
- [x] Dependências de rotas identificadas.

## ✅ Definition of Done (DoD)
- [ ] Sidebar refatorada e funcional.
- [ ] Todas as novas rotas respondendo (mesmo que com placeholders).
- [ ] Ícones consistentes com o contrato.
- [ ] UX Audit aprovado pela Dandara (QA).

---
*NETECMT v2.0 | Leticia (SM)*
