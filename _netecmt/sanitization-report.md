# Relatório de Saneamento de Rotas - NETECMT v2.0
Data: 2026-01-30
Agentes: Wilder (Analyst), Athos (Arch), Dandara (QA)

## 1. Mapeamento de Rotas Físicas (Wilder)

### 💀 Legado Morto (Para Deleção)
- `app/src/app/analytics/`: Absorvido pelo `Performance War Room` (/performance) e `Intelligence Dashboard` (/intelligence).
- `app/src/app/campaign/`: Duplicidade do padrão plural `campaigns`. A rota `/campaign/[id]` deve ser movida ou redirecionada para `/campaigns/[id]`.
- `app/src/app/debug-test/`: Pasta de desenvolvimento/teste que não deve estar em produção.

### 🕵️ Ativas mas Ocultas (Fora da Sidebar)
- `/intelligence/personalization`: Rota de personalização dinâmica, acessível via botão no Dashboard, mas não listada na sidebar.
- `/intelligence/predictive`: Rota de análise preditiva existente mas não mapeada no contrato.

---

## 2. Validação Arquitetural (Athos)

### Atualizações no `navigation-schema.yaml` (v1.1.0)
- **Inclusão de `/performance`**: Mapeado como "Performance (War Room)" no grupo de Inteligência.
- **Inclusão de `/vault` e `/brand-hub`**: Confirmados como rotas essenciais de Gestão.
- **Unificação de Campanhas**: Mantido o padrão `/campaigns` com alias para `/campaign`.

### Decisões de Hierarquia
- O `Dossiê` permanecerá como estado local dentro de `/intelligence` por enquanto, para manter a fluidez da análise sem recargas de página.
- Rotas `/analytics` e `/performance` (API) foram consolidadas sob a lógica do War Room.

---

## 3. Relatório de Consistência UI/UX (Dandara)

### Inconsistências Detectadas
- **404 Warning**: A pasta `/campaign` (singular) causa confusão. Se deletada sem redirecionamento, quebrará links antigos.
- **Visual "War Room"**: A página `/performance` já segue o padrão Dark/High-Contrast, mas `/analytics` ainda usa o layout antigo (Zinc/White).
- **Dossiê**: A falta de uma URL própria para o Dossiê impede o compartilhamento direto de uma análise específica.

---

## 🚀 Plano de Cleanup (Próximos Passos)

1. [ ] **Deletar**: `app/src/app/analytics/`
2. [ ] **Deletar**: `app/src/app/debug-test/`
3. [ ] **Migrar/Redirecionar**: Conteúdo de `app/src/app/campaign/[id]` para `app/src/app/campaigns/[id]` e deletar pasta singular.
4. [ ] **Assinar**: `navigation-schema.yaml` v1.1.0 (CONCLUÍDO).
