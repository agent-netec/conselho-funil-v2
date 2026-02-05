# Story: Testes de Fumaça & Validação
**ID**: S23-ST-04
**Status**: COMPLETED
**Sprint**: 23

## 📝 Descrição
Realizar testes de fumaça em URLs conhecidas por bloqueios (Cloudflare) para validar a eficácia do Firecrawl.

## ✅ Critérios de Aceite (DoD)
- [x] Teste bem-sucedido em pelo menos 3 domínios protegidos.
- [x] Validação de que Headlines e CTAs estão sendo extraídos.
- [x] Verificação de que o deep-crawl não excede os limites de tokens/budget.

## 🏗️ Tarefas Técnicas
1. Criar script de teste rápido ou usar o console de dev.
2. Validar extração em domínios críticos (ex: landing pages complexas).
3. Documentar resultados no relatório de estabilização.

## ✅ Resultado
- Smoke test executado com 3/3 domínios aprovados.

## 🛑 Bloqueios / Dependências
- S23-ST-03 (Fallback)
