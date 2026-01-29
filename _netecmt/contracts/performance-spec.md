# 🛡️ Contract: Performance War Room (Sprint 18)

**Versão:** 1.0  
**Status:** DRAFT  
**Responsável:** Athos (Architect)  
**Sprint:** 18 - Performance War Room  
**Data:** 29/01/2026

---

## 1. Visão Geral

Este contrato define a arquitetura técnica para a **Performance War Room**, focando na agregação multicanal de métricas, detecção de anomalias (The Sentry) e gestão segura de chaves de API (BYO Keys).

### 🛡️ Guardrails Arquiteturais

| Guardrail | Regra | Validação |
|:----------|:------|:----------|
| **Multi-Tenant Isolation** | Chaves e métricas SEMPRE isoladas por `brandId` | Firestore Security Rules |
| **Secret Encryption** | Chaves de API devem ser criptografadas em repouso | AES-256-GCM (Client-Side/Edge) |
| **Mock-First API** | Endpoints devem suportar modo `mock=true` para testes | API Middleware |
| **Anomaly Thresholds** | Sensibilidade de alerta configurável por marca | Firestore Config |

---

## 2. Data Schema: Firestore

### 2.1 Collection: `brands/{brandId}/performance_configs`
Armazena chaves de API e configurações de monitoramento.

```typescript
interface PerformanceConfig {
  brandId: string;
  integrations: {
    meta_ads?: {
      encryptedApiKey: string; // AES-256-GCM
      accountId: string;
      status: 'active' | 'error' | 'disconnected';
      lastValidated: Timestamp;
    };
    google_ads?: {
      encryptedApiKey: string;
      accountId: string;
      status: 'active' | 'error' | 'disconnected';
      lastValidated: Timestamp;
    };
  };
  sentrySettings: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high'; // Thresholds: 50%, 30%, 15%
    notificationChannels: ('dashboard' | 'email' | 'slack')[];
  };
  updatedAt: Timestamp;
}
```

### 2.2 Collection: `brands/{brandId}/performance_metrics`
Séries temporais de métricas agregadas.

```typescript
interface PerformanceMetric {
  id: string; // `metric_{brandId}_{source}_{timestamp}`
  brandId: string;
  source: 'meta' | 'google' | 'organic' | 'aggregated';
  timestamp: Timestamp;
  data: {
    spend: number;
    revenue: number;
    roas: number;
    cac: number;
    ctr: number;
    cpc: number;
    conversions: number;
  };
  period: 'hourly' | 'daily' | 'weekly';
}
```

### 2.3 Collection: `brands/{brandId}/performance_anomalies`
Alertas gerados pelo sistema "The Sentry".

```typescript
interface PerformanceAnomaly {
  id: string;
  brandId: string;
  metricType: keyof PerformanceMetric['data'];
  severity: 'critical' | 'warning' | 'info';
  detectedAt: Timestamp;
  valueAtDetection: number;
  expectedValue: number;
  deviationPercentage: number;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  aiInsight?: {
    explanation: string; // Gerado pelo Gemini
    suggestedAction: string;
  };
}
```

---

## 3. API Endpoints

### 3.1 `GET /api/performance/metrics`
Retorna métricas agregadas para o dashboard.
- **Params**: `brandId`, `startDate`, `endDate`, `period`, `mock?`
- **Response**: `PerformanceMetric[]`

### 3.2 `POST /api/performance/integrations/validate`
Valida uma chave de API antes de salvar.
- **Body**: `{ brandId, platform, apiKey, accountId }`
- **Response**: `{ success: boolean, message: string }`

### 3.3 `GET /api/performance/anomalies`
Lista anomalias detectadas.
- **Params**: `brandId`, `status?`, `limit?`
- **Response**: `PerformanceAnomaly[]`

---

## 4. Segurança & Isolamento

### 4.1 Firestore Security Rules (Draft)
```javascript
match /brands/{brandId}/performance_configs/{docId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
}

match /brands/{brandId}/performance_metrics/{docId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/brands/$(brandId)).data.ownerId == request.auth.uid;
  allow write: if false; // Apenas via Service Account/Backend
}
```

### 4.2 Encryption Strategy
As chaves de API nunca devem ser armazenadas em texto puro.
- **Algoritmo**: AES-256-GCM.
- **Key Management**: Chave mestra em variável de ambiente (`PERFORMANCE_ENCRYPTION_KEY`).

---

## 5. Paths Autorizados (Lane: performance_war_room)

Conforme definido no `contract-map.yaml`:
- `app/src/lib/performance/**` (Lógica de agregação e Sentry)
- `app/src/app/api/performance/**` (API Routes)
- `app/src/components/performance/**` (UI components)
- `app/src/types/performance.ts` (Type definitions)

---

## 6. Referências
- **PRD:** `_netecmt/prd-sprint-18-performance-war-room.md`
- **Contract Map:** `_netecmt/core/contract-map.yaml`

---
*Veredito Técnico por Athos (Architect) - NETECMT v2.0*
