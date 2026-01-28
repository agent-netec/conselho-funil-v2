# Contrato: Ads Design Engine (NanoBanana)
ID: ST-11.9

**Lane:** AI / Design
**Status:** 🟠 Draft for Review
**Versão:** 1.0.0

## 1. Definição do Objeto de Saída (NANOBANANA_PROMPT)
Todo briefing gerado pelo motor de Ads deve seguir rigorosamente este esquema JSON para garantir que o frontend e as integrações de geração de imagem funcionem corretamente.

```typescript
export interface AdsDesignContract {
  // Identificação da Campanha
  platform: 'meta' | 'google' | 'linkedin' | 'universal';
  format: 'square' | 'landscape' | 'vertical' | 'portrait';
  safeZone: 'feed' | 'stories' | 'reels' | 'search' | 'display';

  // Ativos de Texto (Copy)
  assets: {
    primaryText?: string;    // Meta: 125-280 chars | LinkedIn: 150-600 chars
    headline?: string;       // Meta: 40 chars | Google: 30 chars | LinkedIn: 70 chars
    description?: string;    // Meta: 30 chars | Google: 90 chars
    callToAction?: string;   // ex: 'Saiba Mais', 'Comprar Agora'
    headlines?: string[];    // Exclusivo Google Responsive Ads (Array de 5-15)
    descriptions?: string[]; // Exclusivo Google Responsive Ads (Array de 2-4)
  };

  // Ativos Visuais (Design)
  visualPrompt: string;      // Prompt otimizado para IA Generativa (Midjourney/DALL-E)
  aspectRatio: '1:1' | '16:9' | '4:5' | '9:16';
  
  // Contexto de Marca
  brandContext: {
    colors: string[];        // Array de Hexadecimais do BrandKit
    style: string;           // Estilo visual definido na marca
    logoUsage?: string;      // Instrução de uso do logo (ex: 'Top Left', 'Watermark')
  };

  // Heurísticas C.H.A.P.E.U
  strategy: {
    contrastFocus: string;   // Onde o contraste deve ser mais forte
    hierarchyOrder: string[]; // Ordem de leitura visual esperada
    anthropomorphism?: string; // Se deve usar rostos/pessoas e qual expressão
    proximityLogic: string;  // Relação entre os elementos
    balanceType: 'symmetrical' | 'asymmetrical';
    unityTheme: string;      // Tema unificador
  };
}
```

## 2. Travas Técnicas por Plataforma
| Plataforma | Headline (Chars) | Body/Primary (Chars) | Desc (Chars) | Aspect Ratio |
| :--- | :--- | :--- | :--- | :--- |
| **Meta Feed** | 40 | 125 (Rec.) | 30 | 1:1, 4:5 |
| **Meta Stories** | 40 | N/A | N/A | 9:16 |
| **Google Search** | 30 | N/A | 90 | N/A |
| **Google Display** | 30 | N/A | 90 | 1.91:1, 1:1 |
| **LinkedIn Feed** | 70 | 150 (Rec.) | N/A | 1.91:1, 1:1 |

## 3. Regras de Negócio (Engine Constraints)
1. **Multi-Variant**: O motor deve sempre gerar pelo menos 3 variações com ângulos de marketing distintos.
2. **Safe Zone Awareness**: Se `safeZone` for `stories` ou `reels`, o `visualPrompt` deve incluir instruções para manter elementos críticos fora das áreas de sobreposição da UI (topo e base).
3. **Contrast First**: O `visualPrompt` deve obrigatoriamente incluir termos que reforcem o contraste (ex: "High contrast", "Vibrant against dark background") para garantir o C.H.A.P.E.U.
