---
id: "22-2"
title: "Img2Img Reference Pipeline"
status: "ready-for-dev"
last_updated: 2026-01-11
---

# Contexto
- Story pack original: `_netecmt/archive/sprints/story-pack-visual-pipeline.md`.
- Modelos recomendados: prompts em `gemini-3-flash-preview`; geração em `gemini-3-pro-image-preview` (Nano Banana Pro).
- Heurísticas e frameworks: ver Design Brain (frameworks, scorecard, anti-patterns) em `allowed-context.md`.

# Tarefas
1) Enriquecer prompt (Flash):
   - Gerar 3 variações (padrão/alternativa/criativa) com termos de iluminação, composição e nitidez.
   - Incluir menção explícita de uso de referências e prioridade do logo.
2) Preparar referências:
   - Carregar `primaryLogoUrl` e até 3 fotos `isApprovedForAI` (suporte até 14 refs conforme modelo).
   - Montar `image_references` priorizando logoLock.
3) Chamada de geração (Nano Banana Pro):
   - `aspect_ratio: 16:9`, `image_size: 2K` (opcional 4K).
   - Enviar 3 prompts/variações e coletar 3 imagens.
4) Pós-processo e edição (multi-turno opcional):
   - Suportar prompt de ajuste para reusar a imagem gerada.
5) Qualidade e logging:
   - Validar com checklist (legibilidade 200x112, contraste, CTA).
   - Logar refs usadas e modelo invocado; tratar falhas do motor.

# Critérios de aceite
- 3 prompts enviados contendo referências (logo + fotos) e heurísticas avançadas.
- 3 imagens retornadas com logo intacto e legíveis; menção de uso das refs no prompt.
- Checklist de qualidade aprovado; em caso de falha do motor, erro tratado e reportado.
