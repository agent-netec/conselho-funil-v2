# Especificação de APIs de Redes Sociais (DMs/Comentários)

**Lane:** Social Intelligence  
**Status:** 🟢 Ready for Implementation  
**Versão:** 1.0.0

## 1. Escopo de Integração
Este contrato define a interface para ingestão e resposta em redes sociais (Instagram, TikTok, LinkedIn, X).

## 2. Interface de Ingestão (Webhooks/Polling)
```typescript
export interface SocialInteraction {
  id: string;
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'x';
  type: 'dm' | 'comment';
  externalId: string;      // ID original na plataforma
  author: {
    id: string;
    username: string;
    isFollower: boolean;
    sentiment?: number;    // Calculado na ingestão
  };
  content: {
    text: string;
    mediaUrl?: string;
    timestamp: string;
  };
  context?: {
    postId?: string;       // Se for comentário
    threadId?: string;     // Se for DM
  };
}
```

## 3. Interface de Resposta (Brand Voice Translation)
Toda resposta gerada deve passar pelo `BrandVoiceTranslator` antes de ser enviada à plataforma.

```typescript
export interface SocialResponse {
  interactionId: string;
  rawResponse: string;      // Resposta pura do RAG
  translatedResponse: string; // Resposta após Brand Voice Translator
  metadata: {
    toneMatch: number;      // 0.0 a 1.0
    safetyCheck: boolean;
    counselorId: string;    // Especialista que orientou a resposta
  };
}
```

## 4. Regras de Negócio (The Social Gates)
1. **Gate de Sentimento**: Interações com sentimento < 0.3 (ódio/crítica severa) devem ser sinalizadas para revisão humana imediata.
2. **Gate de SLA**: Respostas automáticas devem ser geradas em < 30s.
3. **Gate de Frequência**: Máximo de 3 respostas automáticas por thread/usuário antes de exigir intervenção.
