# Prompt para Agente de Geração de Vídeo/Imagens — MktHoney Landing Page

Cole este prompt inteiro em uma nova sessão de agente AI.

---

## Contexto do Projeto

Estou construindo a landing page do **MktHoney** (mkthoney.com) — uma plataforma SaaS de marketing com IA que substitui agências externas. O produto reúne 23 "conselheiros" AI baseados em lendas do marketing (Gary Halbert, Eugene Schwartz, Russell Brunson, etc.) que trabalham juntos pela marca do usuário: estratégia, conteúdo, análise competitiva e automação de campanhas, 24/7.

### Identidade Visual
- **Paleta:** Fundo escuro (#0D0B09), Gold (#E6B447), Honey (#AB8648), Bronze (#895F29), Sand (#CAB792), Cream (#F5E8CE)
- **Estilo:** Premium, dark-mode, dourado sobre preto. Estética de fintech/consultoria de luxo — NÃO tech startup genérica
- **Anti-AI-slop:** Zero gradientes neon, zero elementos genéricos. Tudo deve parecer feito à mão, com intenção

### O que preciso

Preciso gerar **assets visuais** para a landing page:

1. **Vídeo de fundo do Hero (PRIORIDADE):** Loop de 8-15 segundos, abstrato, partículas douradas flutuando e conectando-se sobre fundo preto/marrom escuro. Movimento lento e elegante. Estilo mesh/grid sutil. Sem texto, sem logos — apenas ambiente. Resolução: 1920x1080 mínimo. Formato: MP4 ou WebM.

2. **Imagens de background/texturas (SECUNDÁRIO):**
   - Textura de grid sutil em dourado sobre preto (para pattern CSS)
   - Textura de "noise" dourado (grain overlay)
   - Gradiente abstrato dourado (para glow sections)

---

## Recursos Disponíveis — API Gemini

Você tem acesso à **API do Google Gemini** neste projeto. Use-a diretamente.

### API Key
Leia o arquivo `.env.local` na raiz do projeto da landing page:
```
c:\Users\phsed\OneDrive\Desktop\CURSOR\CONSELHO DE FUNIL\_netecmt\docs\landpage\mkthoney-landing-page-skeleton\.env.local
```
A variável `GEMINI_API_KEY` contém a chave. Use-a para autenticar as chamadas.

Alternativamente, a mesma key está em:
```
c:\Users\phsed\OneDrive\Desktop\CURSOR\CONSELHO DE FUNIL\app\.env.production.local
```
Na variável `GOOGLE_AI_API_KEY`.

### Para Geração de VÍDEO — Use VEO 3
- **Modelo:** Veo 3 (via Gemini API)
- **Endpoint:** Use a API generativa do Google (google.generativeai ou REST endpoint)
- **IMPORTANTE:** Antes de gerar, leia a documentação atualizada do VEO 3:
  - Busque: "Google Veo 3 API documentation 2026" ou "Gemini API video generation Veo 3"
  - Verifique: endpoint correto, parâmetros suportados, formato de request/response
  - O VEO 3 pode estar disponível via `generateVideo` ou endpoint específico na API generativa
- **Prompt sugerido para o vídeo:**
  ```
  Abstract, slow-moving particles of warm gold (#E6B447, #F5D060) floating and drifting across a deep dark background (#0D0B09, #1A1510). Particles occasionally connect with thin golden lines forming a subtle mesh network. Gentle radial glows pulse softly. No text, no logos, no faces. Cinematic, premium feel. Smooth camera drift. 8-second seamless loop. Dark luxury aesthetic, like a high-end fintech or private banking visual. Film grain texture. 4K quality.
  ```

### Para Geração de IMAGENS — Use Gemini + Imagen 3
- **Modelo:** Gemini 2.0 Flash (para prompting) + Imagen 3 (para geração via `generateImage`)
- **Modelo alternativo:** Gemini 3.0 Pro Preview (para qualidade superior, se disponível)
- **IMPORTANTE:** Antes de gerar, leia a documentação atualizada:
  - Busque: "Gemini API image generation Imagen 3 documentation 2026"
  - Busque: "Google AI Studio Imagen 3 API"
  - Verifique: como usar `generateImage` ou `generate_content` com output de imagem
- **Prompts sugeridos para imagens:**

  **Textura Grid:**
  ```
  Seamless tileable texture. Minimal geometric grid pattern made of very thin golden lines (#E6B447 at 8% opacity) on pure black background (#0D0B09). Lines are 1px wide, forming 60x60 pixel squares. Subtle, barely visible. No noise, no gradient. Clean, mathematical precision.
  ```

  **Textura Noise/Grain:**
  ```
  Seamless tileable texture. Film grain noise in warm gold tones (#E6B447, #C99A30) on transparent/black background. Very subtle, approximately 3-5% opacity equivalent. Fine grain, not coarse. Similar to 35mm film grain but in golden tones. 512x512 pixels.
  ```

  **Glow abstrato:**
  ```
  Abstract soft radial glow. Center: warm bright gold (#F5D060) fading to amber (#E6B447) then to dark bronze (#895F29) then to pure black (#0D0B09). No hard edges, extremely smooth gaussian blur transition. No objects, no shapes — just light. Premium, moody, dark luxury feel. 1920x600 pixels, landscape orientation.
  ```

### Modelo Nano Banana
Se disponível no contexto da API, o modelo **nano banana** pode ser usado para testes rápidos e iterações antes de gastar tokens nos modelos maiores. Use-o para prototipar prompts e validar a direção visual antes de gerar na qualidade final.

---

## Onde Salvar os Outputs

Salve todos os assets gerados em:
```
c:\Users\phsed\OneDrive\Desktop\CURSOR\CONSELHO DE FUNIL\_netecmt\docs\landpage\mkthoney-landing-page-skeleton\public\
```

Nomes sugeridos:
- `hero-bg-video.mp4` ou `hero-bg-video.webm`
- `texture-grid.png`
- `texture-grain.png`
- `glow-abstract.png`

---

## Instruções de Implementação

Após gerar os assets:

1. **Vídeo:** Salve em `/public/` e eu integrarei no `Hero.tsx` como `<video>` substituindo o `ParticleCanvas` atual (ou como camada adicional)
2. **Texturas:** Salve em `/public/` para uso como `background-image` no CSS
3. Se o VEO 3 não estiver disponível via API, gere o vídeo no **Google AI Studio** (aistudio.google.com) manualmente e forneça o link de download
4. Se Imagen 3 não estiver disponível via API, use o AI Studio para gerar as imagens

---

## Checklist Final

- [ ] Ler .env.local para obter GEMINI_API_KEY
- [ ] Ler documentação atualizada do VEO 3 (busca web)
- [ ] Ler documentação atualizada do Imagen 3 / Gemini image generation (busca web)
- [ ] Gerar vídeo hero background (VEO 3)
- [ ] Gerar textura grid (Imagen 3)
- [ ] Gerar textura grain (Imagen 3)
- [ ] Gerar glow abstrato (Imagen 3)
- [ ] Salvar tudo em /public/
- [ ] Reportar resultados e próximos passos
