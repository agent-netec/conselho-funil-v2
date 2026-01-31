# ADR-002: Sincronia de contrato com tipos de Intelligence

**Status:** Accepted  
**Decisor:** Athos (Architect)  
**Data:** 31/01/2026  
**Sprint:** 22 - Stabilization

---

## 1. Contexto

Durante a estabilizacao da Sprint 22, foi identificado desvio entre o contrato de Intelligence Storage e os tipos reais em `app/src/types/intelligence.ts`, em especial para:
- `IntelligenceType` com suporte a `keyword`
- `IntelligencePlatform` com `google_autocomplete`
- `IntelligenceContent` contendo `keywordData`
- filtro `textHash` em `IntelligenceQueryFilter`

Esse desalinhamento cria risco de contrato defasado e falhas em auditorias de boundary.

---

## 2. Decisao

Atualizar o contrato `_netecmt/contracts/intelligence-storage.md` para versao `1.1.0`, espelhando as interfaces atuais do codigo e mantendo compatibilidade retroativa.

---

## 3. Consequencias

- Contrato passa a refletir os tipos efetivos usados em producao.
- Auditorias de pack e contract boundary ficam consistentes.
- Sem impacto em rotas ou schemas existentes, apenas documentacao.

---

## 4. Referencias

- **Contract atualizado:** `_netecmt/contracts/intelligence-storage.md`
- **Story Pack:** `_netecmt/packs/stories/sprint-22-stabilization/`

---

*ADR aprovado por Athos (Architect) - NETECMT v2.0*
