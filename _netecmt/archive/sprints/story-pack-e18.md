# Story Pack: E18-1 & E18-2 (Brand Hub Foundation)

## 🎯 Objetivo
Implementar a infraestrutura de dados e a interface base do Brand Hub, incluindo o sistema de Logo Lock.

## 📝 User Stories
- **US-18.1**: Configuração do BrandKit (Cores, Fontes, Estilo).
- **US-18.2**: Logo Lock (Persistência de SVG/Imagens de Logo).

## 🛠️ Contrato Técnico (Lane Contract)
### Firestore: `brands` collection
A interface `Brand` em `app/src/types/database.ts` deve ser estendida:

```typescript
export interface BrandKit {
  colors: {
    primary: string;    // HEX
    secondary: string;  // HEX
    accent: string;     // HEX
    background: string; // HEX
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
  };
  visualStyle: 'minimalist' | 'aggressive' | 'luxury' | 'corporate' | 'modern';
  logoLock: {
    primaryLogoUrl: string;
    secondaryLogoUrl?: string;
    iconUrl?: string;
    locked: boolean; // Se true, a IA não pode sugerir variações
  };
}

// Update Brand interface
export interface Brand {
  // ... campos existentes ...
  brandKit?: BrandKit;
  updatedAt: string;
}
```

## 📋 Tasks para Amelia
1. [ ] **Update Types**: Atualizar `app/src/types/database.ts` com a nova interface `BrandKit`.
2. [ ] **Update Lib**: Adicionar função `updateBrandKit(brandId, kit)` em `app/src/lib/firebase/brands.ts`.
3. [ ] **UI Component**: Criar `components/brands/brand-kit-form.tsx` usando Shadcn (Input Color, Select).
4. [ ] **Brand Hub Page**: Criar/Atualizar a página de gerenciamento da marca para incluir o formulário do BrandKit.
5. [ ] **Logo Upload**: Implementar upload específico para as logos no `brandKit.logoLock`.

## 🧪 Critérios de Aceite Técnicos
- O formulário deve validar cores HEX.
- O `logoLock.locked` deve vir como `true` por padrão ao subir uma logo.
- A troca de marca no seletor global deve carregar o BrandKit correto.



