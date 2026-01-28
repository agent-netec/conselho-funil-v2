---
id: "22-2"
name: "Img2Img Reference Pipeline"
status: "ready-for-dev"
last_updated: 2026-01-11
---

# Objetivo
Habilitar envio de referências visuais reais (logoLock + fotos aprovadas) para o motor de imagem, com prompts enriquecidos por heurísticas avançadas de iluminação/composição/nitidez.

# Escopo
- API: `app/src/app/api/design/generate/route.ts`.
- Modelos alvo:
  - Prompting e orquestração: `gemini-3-flash-preview` (texto, brainstorming, variações).
  - Geração de imagem: `gemini-3-pro-image-preview` (Nano Banana Pro).
- Entradas obrigatórias:
  - `primaryLogoUrl` (logoLock).
  - Até 3 fotos aprovadas (`isApprovedForAI`), expandível até 14 refs conforme capacidade do modelo.
- Saídas: criativos com menção explícita de uso de referências e respeito à identidade visual.

# Requisitos funcionais
1. Carregar BrandKit/BrandAssets aprovados antes da chamada do motor de imagem.
2. Construir `enrichedPrompt` incorporando heurísticas de:
   - Iluminação: rim lighting, cinematic, studio soft box.
   - Composição: rule of thirds, leading lines, negative space.
   - Nitidez/detalle: 8k, highly detailed, depth of field, F-stop 1.8.
3. Enviar `image_references` ao motor (`gemini-3-pro-image-preview`) priorizando `logoLock` com instrução “KEEP THE LOGO IDENTICAL AS PROVIDED”.
4. Gerar no mínimo 3 variações por requisição (padrão/alternativa/criativa).
5. Configurar imagem com:
   - `aspect_ratio`: 16:9.
   - `image_size`: 2K (2048x2048). Opcional 4K quando solicitado.
6. Suportar fluxo multi-turno (editar imagem gerada) quando um prompt de ajuste for recebido.
7. Opcional: habilitar grounding (Google Search) quando o prompt solicitar aderência a fatos/estilo contextual.

# Requisitos não-funcionais
- Performance: 30–60s por lote de 3 imagens é aceitável (característica do modelo).
- Custo: seguir pricing do Nano Banana Pro conforme doc de comparação.
- Observabilidade: registrar no log a lista de refs usadas e modelo invocado.

# Critérios de aceite
- Prompt enviado ao modelo inclui menção explícita de uso das referências e lista as URLs (ou IDs) priorizando logoLock.
- `enrichedPrompt` contém pelo menos um termo de iluminação, um de composição e um de nitidez/qualidade avançada.
- Retorna 3 imagens válidas respeitando o logo e legibilidade; falhas do motor são tratadas e reportadas.
- Checklist de qualidade (legibilidade 200x112, contraste, CTA claro) passado para cada variação.

# Notas de integração
- Use `gemini-3-flash-preview` para gerar os 3 prompts/variações e `gemini-3-pro-image-preview` para a geração final.
- Referências autorizadas estão em `allowed-context.md` (Design Brain frameworks, anti-patterns e scorecard).
