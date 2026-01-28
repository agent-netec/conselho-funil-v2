# Story Pack: E22-2 (Pipeline Img2Img & Prompt Engineering)

## 🎯 Objetivo
Habilitar o envio de referências visuais reais (Logos e Fotos da Marca) para o motor de imagem do Google AI, garantindo fidelidade absoluta à identidade visual e aplicando engenharia de prompt avançada.

## 📝 User Stories
- **US-22.2**: Integração de Referências Visuais (Img2Img/Reference).
- **US-22.3**: Engenharia de Prompt Visual Automática (Lighting, Framing, Composition).

## 🛠️ Contrato Técnico
### 1. Extensão da API de Geração
Atualizar `app/src/app/api/design/generate/route.ts` para processar `image_references`:
- O sistema deve buscar a `primaryLogoUrl` (do Logo Lock) e até 3 fotos aprovadas (`isApprovedForAI`).
- Esses arquivos devem ser enviados como URLs de referência ou metadados de semente visual para o motor de imagem.

### 2. Prompt Engineering sênior
Integrar as heurísticas de:
- **Iluminação:** Rim lighting, Cinematic, Studio soft box.
- **Composição:** Rule of thirds, Leading lines, Negative space.
- **Nitidez:** 8k, highly detailed, photorealistic.

## 📋 Tasks para Amelia
1. [ ] Atualizar a lógica da API de geração para carregar o `BrandKit` e os `BrandAssets` aprovados antes de chamar o motor de imagem.
2. [ ] Construir o `enrichedPrompt` avançado injetando termos técnicos de fotografia e direção de arte extraídos das novas heurísticas.
3. [ ] Implementar o campo `image_references` na chamada do motor de imagem (Google Imagen/NanoBanana).
4. [ ] Garantir que o `logoLock` seja prioridade máxima no prompt (ex: "KEEP THE LOGO IDENTICAL AS PROVIDED").

## 🧪 Critérios de Aceite
- Ao gerar uma imagem, a IA deve citar que está usando as referências da marca.
- O prompt enviado para a API deve conter termos técnicos avançados (ex: "F-stop 1.8", "Depth of field").
- A logo da marca deve aparecer de forma proeminente e correta no criativo.



