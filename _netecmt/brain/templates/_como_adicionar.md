---
id: 21e13a84-b6d3-4062-9966-17f6b81fe570
counselor: unknown
docType: case
version: 2026-01-11.v1
---
# 📚 Como Adicionar Novos Documentos

> Guia rápido para expandir a base de conhecimento

---

## 🎯 Regra de Ouro

**Todo documento DEVE ter o frontmatter YAML no topo.**

```yaml
---
business: "generic"          # ou "daleacademy", "wa", etc
counselor: "<nome>"          # russell_brunson, dan_kennedy, interno, etc
doc_type: "<tipo>"           # identity, heuristics, anti-pattern, case, etc
scope: "general"             # high_ticket, low_ticket, quiz, vsl, etc
channel: "general"           # youtube, meta, email, ads, etc
stage: "general"             # traffic, qualify, convert, retain, monetize
status: "draft"              # draft, review, approved, deprecated
version: "YYYY-MM-DD.v1"
sources:
  - "URL ou referência"
---
```

---

## 📁 Onde Colocar Cada Tipo

| Tipo de Documento | Pasta | Quando Usar |
|-------------------|-------|-------------|
| **Novo Conselheiro** | `council/identity/` | Adicionar expert real como conselheiro |
| **Regras de Área** | `council/heuristics/` | Regras práticas SE-ENTÃO |
| **Erro Documentado** | `council/anti-patterns/` | Algo que deu errado e por quê |
| **Case Real** | `council/case-library/` | Lançamento/campanha que aconteceu |
| **Framework** | `council/mental-models/` | Modelo de pensamento (Value Equation, etc) |
| **Passo a Passo** | `council/playbooks/` | Como executar algo operacionalmente |
| **Rubrica** | `council/scorecards/` | Como avaliar/pontuar algo |
| **Decisão Tomada** | `council/decisions/` | Decisão importante + racional |
| **Tensão Legítima** | `council/contradictions/` | Quando duas regras conflitam |
| **Template de Funil** | `library/funnels/` | Estrutura reutilizável de funil |
| **Template de Campanha** | `library/campaigns/` | Estrutura de campanha |
| **Contexto de Negócio** | `business/<nome>/` | Informações do negócio |

---

## 🚀 Adicionar Rapidamente

### Novo Anti-Pattern (Erro)
```bash
# Copie o template
templates/anti_pattern_template.md → council/anti-patterns/nome_do_erro.md
# Preencha e mude status para "draft"
```

### Novo Case
```bash
# Copie o template
templates/case_template.md → council/case-library/daleacademy/nome_case.md
# Preencha e mude status para "draft"
```

### Nova Heurística
```bash
# Adicione ao arquivo existente da área
# OU crie novo arquivo em council/heuristics/
```

### Novo Conselheiro
```bash
# Copie template de identity existente
council/identity/russell_brunson.md → council/identity/novo_expert.md
# Adapte estrutura e preencha
```

---

## ✅ Checklist Antes de Salvar

- [ ] Frontmatter YAML completo?
- [ ] `status: "draft"` (nunca salvar como approved direto)?
- [ ] `version` com data atual?
- [ ] `sources` preenchido (mesmo que seja "experiência interna")?
- [ ] Nome do arquivo em snake_case?
- [ ] Pasta correta?

---

## 🔄 Fluxo de Aprovação

```
draft → review → approved
           ↓
      deprecated (se obsoleto)
```

1. **draft**: Rascunho inicial
2. **review**: Em revisão/validação
3. **approved**: Aprovado para uso pelo RAG
4. **deprecated**: Obsoleto (manter para histórico, RAG ignora)

---

## 📝 Dicas

1. **Seja específico** - "Funil de quiz para high ticket" > "Funil"
2. **Cite fontes** - Mesmo que seja "minha experiência"
3. **Use formato SE-ENTÃO** para heurísticas
4. **Inclua métricas** quando possível
5. **Versione** - Atualize a versão quando modificar

---

_Última atualização: 2024-12-22_


