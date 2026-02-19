# Gemini Image Generation — Modelos e Incidentes

> Referencia rapida para quando a geracao de imagem parar de funcionar.

## Modelos Ativos (Fev 2026)

| Model ID | Codinome | Status | ~Latencia | Uso no Projeto |
|---|---|---|---|---|
| `gemini-3-pro-image-preview` | Nano Banana Pro | Preview | ~30s | **Primario** — qualidade maxima, text rendering, ate 4K |
| `gemini-2.5-flash-image` | Nano Banana | Stable/GA | ~8s | **Fallback** — volume, drafts rapidos, maior disponibilidade |

## Modelos Descontinuados (NAO USAR)

| Model ID | Desligado em | Substituido por |
|---|---|---|
| `gemini-2.0-flash-exp-image-generation` | 14 Nov 2025 | `gemini-2.5-flash-image` |
| `gemini-2.5-flash-image-preview` | 15 Jan 2026 | `gemini-2.5-flash-image` (sem "-preview") |
| `imagen-4.0-generate-preview-06-06` | 17 Fev 2026 | `imagen-4.0-generate` (GA) |

## Arquivos do Projeto que Usam Esses Modelos

| Arquivo | Funcao |
|---|---|
| `app/src/app/api/design/generate/route.ts` | Geracao de imagem principal (fallback chain) |
| `app/src/app/api/test-image/route.ts` | Endpoint de teste — testa todos os modelos |

## Fallback Chain (Ordem de Tentativa)

```
gemini-3-pro-image-preview  →  gemini-2.5-flash-image
      (Pro, 30s)                   (Flash, 8s)
```

Se o Pro retornar 503 (overload) ou qualquer erro, o sistema tenta automaticamente o Flash.

## Configuracao da API

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent`
- **Auth:** Header `x-goog-api-key` com `GOOGLE_AI_API_KEY`
- **responseModalities:** `['TEXT', 'IMAGE']` (obrigatorio para image output)
- **imageConfig.aspectRatio:** `'1:1'`, `'16:9'`, `'9:16'`, `'4:3'`, `'3:4'`

## Incidente 1: 500 "Todas as variacoes falharam" (19 Fev 2026)

**Sintoma:** POST `/api/design/generate` retorna 500 com mensagem generica.
**Causa raiz:** Multiplos bugs:
1. Variavel `response` declarada em bloco `try` e acessada fora do escopo
2. Catch block engolia erros sem adicionar ao array `generationErrors`
3. Parametro invalido `imageSize: '2K'` (nao existe na API)
**Fix:** Commit `2745bf81e` — merge de try/catch, captura de todos os erros, remocao de params invalidos.

## Incidente 2: 503 UNAVAILABLE (19 Fev 2026)

**Sintoma:** Apos fix do Incidente 1, erro detalhado mostra: `"This model is currently experiencing high demand"`.
**Causa raiz:** `gemini-3-pro-image-preview` sobrecarregado (Preview = rate limits mais agressivos).
**Fix:** Commit `eed12fd4a` — fallback chain com multiplos modelos.

## Incidente 3: Modelo Deprecated no Fallback (19 Fev 2026)

**Sintoma:** Fallback chain incluia `gemini-2.0-flash-exp-image-generation` que retorna 404 (desligado desde Nov 2025).
**Causa raiz:** Modelo experimental descontinuado, ID do 2.5 Flash estava errado (`gemini-2.5-flash-preview-05-20` em vez de `gemini-2.5-flash-image`).
**Fix:** Commit `2493d6a6c` — removido EXP, corrigido IDs para modelos pre-cadastrados.

## Checklist: Quando a Geracao de Imagem Parar

1. Testar `/api/test-image` para ver quais modelos respondem
2. Verificar [Release Notes do Gemini API](https://ai.google.dev/gemini-api/docs/changelog) para deprecacoes
3. Verificar [Pagina de Modelos](https://ai.google.dev/gemini-api/docs/models) para IDs atuais
4. Verificar [Status Page do Google AI](https://status.cloud.google.com/) para outages
5. Se modelo foi descontinuado: atualizar `IMAGE_MODELS` em `design/generate/route.ts` e `test-image/route.ts`
6. Se ambos os modelos falharem: considerar Imagen 4 (`imagen-4.0-generate`) como alternativa

## Links Uteis

- [Modelos Gemini API](https://ai.google.dev/gemini-api/docs/models)
- [Nano Banana Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Changelog / Release Notes](https://ai.google.dev/gemini-api/docs/changelog)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Contract 22-2: img2img Reference Pipeline](_netecmt/packs/stories/22-2-img2img-reference-pipeline/contract.md)
