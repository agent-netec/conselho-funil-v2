# 🏗️ Story: AI: Análise de Criativos (Gemini Vision) (ST-11.2)

**Status:** 📦 Ready  
**Prioridade:** P0  
**Responsável:** Athos (Arch)

## 📝 Descrição
Habilitar o "Olho do Conselho". Implementar a lógica multimodal para que a IA consiga analisar e criticar imagens de anúncios e páginas de vendas.

## 🎯 Critérios de Aceite
- [x] Contrato Técnico Definido (`contract.md`).
- [x] Implementação do endpoint `/api/ai/analyze-visual`.
- [x] Prompt de Heurísticas Visuais ativo (`vision-heuristics.ts`).
- [x] Integração com Gemini 2.0 Flash (Vision).

## 🛡️ Contexto Permitido
- `app/src/lib/ai/gemini.ts`
- `app/src/lib/ai/prompts/vision-heuristics.ts`
- `_netecmt/docs/ai/visual-heuristics.md`
