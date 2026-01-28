# 🏗️ Contrato Técnico: Strategic Handoff & Atomic Persistence

Este contrato define a estrutura de dados e o fluxo de sincronia para a "Linha de Ouro" (Golden Thread), garantindo que os ativos aprovados sejam persistidos no Manifesto da Campanha sem perda de contexto.

## 1. Estrutura de Dados (Manifesto)

A coleção central será `campaigns`, onde o `docId` corresponde ao `campaignId`. A partir da ST-11.21, o `campaignId` deve ser gerado de forma única (ex: `funnelId_timestamp` ou UUID), separando-se do ID da estratégia original.

```typescript
export interface CampaignContext {
  id: string;            // Campaign ID (Único por execução)
  funnelId: string;      // ID do Funil de Origem (Estratégia)
  brandId: string;       // Vínculo com a marca para RAG de design
  userId: string;
  name: string;          // Nome da Campanha (pode diferir do Funil)
  status: 'planning' | 'active' | 'archived' | 'completed';
  
  // O Cérebro (Dados Estáticos do Funil)
  funnel: {
    type: string;
    architecture: string;
    targetAudience: string;
    mainGoal: string;
    stages: FunnelStage[];
    summary: string;
  };

  // A Voz (Dados Dinâmicos de Copy - Sincronizados na Aprovação)
  copywriting?: {
    bigIdea: string;
    headlines: string[];
    mainScript: string;
    tone: string;
    keyBenefits: string[];
    counselor_reference: string; // Referência do copywriter que aprovou
  };

  // A Atenção (Dados Dinâmicos de Social - Sincronizados na Aprovação)
  social?: {
    hooks: SocialHook[];
    platforms: string[];
    strategy_summary: string;
    updatedAt: Timestamp;
  };

  // O Visual (Dados Dinâmicos de Design)
  design?: {
    visualStyle: string;
    colorPalette: string[];
    visualPrompts: string[];
    assets: DesignAsset[];
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 2. Fluxo de Persistência Atômica

Para evitar o estado "Pendente" (retrabalho), as APIs de decisão devem seguir este protocolo:

1.  **Atomic Upsert:** Toda aprovação de ativo (`copy`, `social`, `design`) deve executar um `setDoc(campaignRef, data, { merge: true })` no Manifesto.
2.  **Confirmation Lock:** O frontend deve aguardar o `success` da API antes de liberar o redirecionamento.
3.  **Context Injection:** O Manifesto deve ser injetado como `system_message` em cada novo Conselho convocado, garantindo que o Social "leia" a Copy aprovada no Manifesto, e não em coleções esparsas.

## 3. Regra de IDs (Escalabilidade)

- **ID do Funil (funnelId):** Identificador imutável da arquitetura estratégica (Blueprint).
- **ID da Campanha (campaignId):** Identificador único de uma instância de execução. 
  - Regra: `campaignId = funnelId + "_" + generateShortId()` ou similar.
  - Objetivo: Permitir que o usuário rode o mesmo funil várias vezes (ex: "Teste A", "Lançamento Oficial") sem sobrescrever dados.

---
*Assinado: Athos (Arch)*
