# Contract: CouncilOutput (v1.1)
ID: C-1.5.1
Status: STABLE
Owner: Athos (Arch)

## Visão Geral
Este contrato define a interface de comunicação entre o Motor de IA (RAG) e a UI de Entrega de Ativos (Beta Launchpad). Ele foi otimizado para permitir a renderização imediata de comparativos de benchmarks de 2026.

## Estrutura de Dados (TypeScript)

```typescript
interface CouncilOutput {
  strategy: {
    summary: string;
    steps: string[];
    rationale: string;
  };
  market_data: {
    metric: string; // Chave técnica (ex: "CPC", "ROAS")
    label: string;  // Nome amigável para exibição no card
    value: string;  // Valor atual ou sugerido
    benchmark_2026: string; // O benchmark alvo de 2026 para comparação
    unit: "%" | "currency" | "number" | "ratio"; // Define formatação na UI
    status: "success" | "warning" | "danger" | "neutral"; // Define a cor do card/indicador
    source_context: string;
  }[];
  assets: {
    type: "DM_SCRIPT" | "STORY_SEQUENCE" | "AD_COPY" | "HOOK" | "VSL_OUTLINE";
    title: string;
    content: string;
    counselor_reference: string;
  }[];
}
```

## Regras de Validação
1. O campo `assets` deve conter pelo menos 1 script se a intenção for conversão social.
2. `market_data` deve sempre incluir o `benchmark_2026` para permitir a renderização de mini-gráficos comparativos.
3. O campo `status` em `market_data` deve ser calculado pela IA comparando o `value` com o `benchmark_2026`.
4. A resposta da IA deve ser um JSON válido que siga este schema.
