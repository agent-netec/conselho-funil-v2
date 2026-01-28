# 📜 Contract: Vision Intelligence API (ST-11.2)

**Lane:** AI / Retrieval  
**Agentes:** Athos (Arch) -> Darllyson (Dev)

## 1. Interface de Entrada (Payload)
O endpoint `/api/ai/analyze-visual` deve aceitar:

```typescript
interface VisionAnalysisRequest {
  imageUri: string;      // GS:// or HTTP link for internal processing
  brandId: string;       // Contexto da marca para o tom de voz
  context?: string;      // Contexto adicional (ex: "Anúncio de Facebook")
}
```

## 2. Esquema de Saída (Output)
A resposta deve ser um JSON estruturado seguindo as heurísticas de NanoBanana:

```typescript
interface VisualInsights {
  score: number;             // 0-100 (Overall conversion potential)
  heuristics: {
    legibility: {
      score: number;
      feedback: string;
    };
    colorPsychology: {
      score: number;
      feedback: string;
      dominantEmotions: string[];
    };
    visualHooks: {
      presence: boolean;
      types: string[];       // ["faces", "arrows", "social_proof"]
      effectiveness: string;
    };
  };
  strategicAdvice: string;   // Recomendação direta do "Diretor de Arte"
}
```

## 3. Integração com RAG
Os insights gerados DEVEM ser salvos no Pinecone no namespace `visual` com os seguintes metadados:
- `assetType: "visual_analysis"`
- `brandId: string`
- `heuristics_summary: string`

## 4. Gate de Segurança
- Validação de MimeType (Apenas `image/*`).
- Limite de 5MB por imagem.
- Chamada bloqueada se `GOOGLE_AI_API_KEY` estiver ausente.
