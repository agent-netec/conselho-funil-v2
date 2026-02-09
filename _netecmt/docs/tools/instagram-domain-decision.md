# ADR: Instagram API Domain — graph.instagram.com

**Data:** 08/02/2026
**Status:** Aceito
**Contexto:** Sprint 32 (S32-IG-01)

## Decisao

O adapter Instagram usa `https://graph.instagram.com/v21.0` como base URL.

## Justificativa

- `graph.instagram.com` e o dominio oficial da Instagram Graph API para contas Business/Creator
- `graph.facebook.com` tambem e valido (Instagram e subsidiaria do Meta) mas `graph.instagram.com` e o dominio preferencial na documentacao oficial
- O adapter S32-IG-01 foi implementado com `graph.instagram.com` e esta funcional

## Ambos Dominios Sao Validos

- `https://graph.instagram.com/v21.0/{endpoint}` — preferencial
- `https://graph.facebook.com/v21.0/{endpoint}` — alternativa valida

## Impacto

Nenhuma mudanca necessaria. Apenas documentacao para referencia futura.
