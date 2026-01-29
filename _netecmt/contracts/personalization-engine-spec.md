# Personalization Engine Spec: "The Maestro" 🎼

**Lane:** Operations / Personalization  
**Status:** 🟡 Active (Draft)  
**Versão:** 1.0.0  
**Architect:** Athos (Arch)

## 1. Visão Geral
O **Personalization Engine** (Maestro) é o middleware central que orquestra a inteligência do Conselho (Autopsy, Offer Lab, Brand Voice) e a traduz em ações concretas nos canais de tráfego. Ele gerencia o **Lead State** baseado no framework de Eugene Schwartz.

## 2. Lead State Management (Eugene Schwartz Framework)
O estado de cada lead é armazenado no Firestore em `brands/{brandId}/leads/{leadId}`.

### Níveis de Consciência (Awareness Levels)
1. **UNAWARE**: O lead não sabe que tem um problema.
2. **PROBLEM_AWARE**: Sabe que tem um problema, mas não conhece soluções.
3. **SOLUTION_AWARE**: Conhece soluções, mas não o seu produto.
4. **PRODUCT_AWARE**: Conhece seu produto, mas não está convencido.
5. **MOST_AWARE**: Conhece bem e está pronto para comprar.

### Estrutura do Lead State
```typescript
interface LeadState {
  uid: string;
  brandId: string;
  currentAwareness: 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';
  lastInteraction: {
    type: 'ad_click' | 'dm_received' | 'comment_made' | 'page_view';
    platform: 'meta' | 'instagram' | 'web';
    timestamp: string;
    contentId?: string;
  };
  tags: string[];
  score: number; // 0-100
  metadata: Record<string, any>;
}
```

## 3. Arquitetura do Maestro
O Maestro opera em um ciclo de **Percepção -> Deliberação -> Execução**.

1. **Percepção (Webhooks/Events)**: Recebe eventos via `WebhookDispatcher`.
2. **Deliberação (Intelligence Bridge)**: 
   - Consulta o `LeadState`.
   - Chama o `ContextAssembler` para buscar ativos no `Creative Vault`.
   - Valida com o `BrandVoiceTranslator`.
3. **Execução (Operation Adapters)**: Dispara ações via `MetaAdsAdapter` ou `InstagramAdapter`.

## 4. Fluxo de Automação (Example: Retargeting)
1. **Trigger**: `Funnel Autopsy` detecta queda na página de checkout.
2. **Maestro**: Identifica leads que saíram do checkout (`PRODUCT_AWARE`).
3. **Ação**: Dispara comando para `MetaAdsAdapter` para incluir esses leads em um "Custom Audience" de Retargeting com oferta de "Garantia Estendida" (vinda do `Offer Lab`).

## 5. Security & Multi-tenancy
- **Isolamento**: Todo processamento é prefixado por `brandId`.
- **Tokens**: O Maestro nunca armazena tokens. Ele solicita ao `MonaraTokenVault` via `brandId`.
