# Technical Contract: Brand Hub & Logo Governance (E18) 🛡️

**Agente Responsável:** Athos (Architect)
**Data:** 2026-01-12
**Status:** 🏛️ APPROVED

## 1. Schema Extensions (Firestore)

### 1.1 Collection: `brands`
O objeto `brandKit` será estendido para suportar a complexidade do PRD do Iuran.

```typescript
export interface BrandKit {
  colors: {
    primary: string;    // HEX
    secondary: string;  // HEX
    accent: string;     // HEX
    background: string; // HEX
    variants?: {        // Para gradientes ou tons alternativos
      primaryLight?: string;
      primaryDark?: string;
    }
  };
  typography: {
    primaryFont: string;   // Headline font (ex: 'Inter')
    secondaryFont: string; // Body font (ex: 'Roboto')
    systemFallback: 'serif' | 'sans-serif' | 'mono';
  };
  visualStyle: 'minimalist' | 'aggressive' | 'luxury' | 'corporate' | 'modern';
  logoLock: {
    variants: {
      primary: LogoAsset;   // Logo principal (Vertical/Standard)
      horizontal?: LogoAsset; // Logo horizontal
      icon?: LogoAsset;      // Símbolo/Favicon
    };
    locked: boolean; // Trava global de governança
  };
  aiConfiguration: { // Added for ST-12.2
    inference: {
      temperature: number;      // 0.0 a 1.0
      topP: number;             // 0.0 a 1.0
      frequencyPenalty: number; // 0.0 a 1.0
      presencePenalty: number;  // 0.0 a 1.0
    };
    voiceGuidelines: string;    // Prompt fixo de tom de voz
    forbiddenTerms: string[];   // Lista de palavras proibidas
  };
  updatedAt: Timestamp;
}

export interface LogoAsset {
  url: string;        // Firebase Storage URL
  storagePath: string; // Path no Storage para deleção
  format: 'svg' | 'png' | 'webp';
  svgRaw?: string;    // Conteúdo da SVG para manipulação em tempo real pela IA (opcional)
}
```

### 1.2 Collection: `brand_assets` (Whitelist)
A governança será exercida através do filtro `isApprovedForAI`.

```typescript
// Filtro padrão para o motor RAG do NanoBanana/Darllyson
const approvedAssetsQuery = query(
  collection(db, "brand_assets"),
  where("brandId", "==", currentBrandId),
  where("isApprovedForAI", "==", true),
  where("status", "==", "ready")
);
```

## 2. SVG Persistence & Manipulation Logic

Para permitir que o **Conselho de Design (NanoBanana)** sugira variações de cores mantendo a integridade do logo:

1.  **Upload**: O sistema prioriza SVGs. Ao fazer upload, o `svgRaw` é extraído e limpo (sanitized).
2.  **Color Swap**: A IA pode ler o `svgRaw` e sugerir alterações de `fill` baseadas na paleta do `BrandKit`.
3.  **Locking**: Se `logoLock.locked` for `true`, a API de salvamento de assets deve bloquear qualquer atualização no objeto `logoLock.variants`.

## 3. Segurança & Roles (Gatekeeper)

*   **Edit Permission**: Apenas usuários com `role: 'admin'` no objeto `User` ou `Tenant` podem realizar operações de escrita no `BrandHub`.
*   **Audit Log**: Toda alteração no `logoLock` deve gerar um log na sub-coleção `audit_logs` da marca.

---
*Assinado: Athos (Arquiteto)*
