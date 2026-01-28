# Technical Contract: Dashboard & Performance Benchmarks 📊

**Agente Responsável:** Athos (Architect)
**Data:** 2026-01-13
**Status:** 🏛️ APPROVED

## 1. Dashboard Payload Structure

A interface `Stats` utilizada pelo hook `useStats` e pelo componente `StatsCards` deve ser estendida para suportar benchmarks de mercado e chaves de performance de 2026.

```typescript
export interface DashboardStats {
  // Métricas de Uso (Existentes)
  activeFunnels: number;
  pendingEvaluations: number;
  decisionsThisMonth: number;
  totalConversations: number;

  // Benchmarks de Mercado (Novas Chaves 2026)
  performance_benchmarks: {
    metric: string;           // ex: 'CPC', 'CTR', 'ROAS'
    value: string;            // Valor atual do usuário
    benchmark_2026: string;   // Meta de benchmark para 2026
    status: 'success' | 'warning' | 'danger' | 'neutral';
  }[];
}
```

## 2. Lane Mapping

Esta lane cobre os seguintes caminhos no repositório:
- `app/src/app/page.tsx` (Dashboard Principal)
- `app/src/components/dashboard/**` (Widgets e Cards)
- `app/src/lib/hooks/use-stats.ts` (Data Fetching)
- `app/src/lib/firebase/firestore.ts` (Lógica de getUserStats)

## 3. Regras de Negócio (Athos)

1.  **Recência**: Os valores de `benchmark_2026` devem ser injetados via RAG ou via configuração global de `market_data`.
2.  **Cálculo de Status**:
    *   `success`: Valor atual é melhor que o benchmark.
    *   `warning`: Valor atual está dentro de uma margem de 10% do benchmark.
    *   `danger`: Valor atual está significativamente abaixo do benchmark.

---
*Assinado: Athos (Arquiteto)*
