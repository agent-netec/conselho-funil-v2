# 🔭 Contract: Competitor Intelligence & Asset Library (ST-14.3)

**Versão:** 1.0  
**Status:** Draft / Ready for Review  
**Responsável:** Athos (Architect)  
**Sprint:** 14 - Intelligence Expansion  
**Data:** 24/01/2026

---

## 1. Visão Geral

Este contrato define as especificações técnicas para a **Biblioteca de Ativos de Inteligência** e o fluxo de dados entre o **Spy Agent** (coleta) e a produção de conteúdo. O objetivo é garantir que insights sobre infraestrutura técnica, funis e Landing Pages de concorrentes sejam estruturados de forma a alimentar diretamente o processo criativo da marca.

### 🛡️ Guardrails Arquiteturais (Sprint 14)

| Guardrail | Regra | Validação |
|:----------|:------|:----------|
| **Asset Immutability** | Ativos de inteligência (screenshots, tech logs) são imutáveis após coleta | Write-once policy em sub-collections |
| **Contextual Linking** | Todo insight deve estar vinculado a um `competitorId` e `brandId` | Schema validation |
| **Privacy First** | URLs de checkout/obrigado capturadas não devem conter PII (Personal Identifiable Information) | Sanitização de URL via Regex |
| **IA-Ready Schema** | Dados estruturados para consumo imediato por prompts de Copy DNA | JSON-LD friendly structure |

---

## 2. Firestore: Schema de Competidores e Ativos

### 2.1 Estrutura de Collections (Expansão)

```
firestore/
├── brands/
│   └── {brandId}/
│       └── intelligence/
│           ├── {docId}                 # Menções, trends (Sprint 13)
│           └── competitors/            # NOVO: Cadastro de Concorrentes
│               ├── {competitorId}/
│               │   ├── dossiers/       # NOVO: Histórico de Dossiês (PDF refs)
│               │   └── assets/         # NOVO: Biblioteca de Ativos (Screenshots, Tech Logs)
│               └── _config/            # Configurações de monitoramento de concorrentes
```

### 2.2 Interface: CompetitorProfile

```typescript
export interface CompetitorProfile {
  id: string;
  brandId: string;
  name: string;
  websiteUrl: string;
  socialMedia: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  category: string[];                   // ex: ['Direct', 'Indirect', 'Aspirational']
  status: 'active' | 'archived';
  lastSpyScan?: Timestamp;              // Última execução do Spy Agent
  techStack?: CompetitorTechStack;      // Consolidado da última análise
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompetitorTechStack {
  cms?: string;                         // ex: 'WordPress', 'Webflow'
  analytics: string[];                  // ex: ['GTM', 'Meta Pixel']
  marketing: string[];                  // ex: ['ActiveCampaign', 'Klaviyo']
  payments: string[];                   // ex: ['Stripe', 'Hotmart']
  infrastructure: string[];             // ex: ['Cloudflare', 'AWS']
  updatedAt: Timestamp;
}
```

### 2.3 Interface: IntelligenceAsset (ST-14.3)

```typescript
/**
 * Ativos capturados pelo Spy Agent (Funnel & LP Tracker)
 * Collection: brands/{brandId}/intelligence/competitors/{competitorId}/assets
 */
export interface IntelligenceAsset {
  id: string;
  competitorId: string;
  brandId: string;
  type: 'screenshot' | 'tech_log' | 'html_snapshot' | 'funnel_map';
  
  // === METADATA DE CAPTURA ===
  url: string;                          // URL onde o ativo foi gerado
  pageType: 'landing_page' | 'checkout' | 'upsell' | 'thank_you' | 'vsl' | 'other';
  capturedAt: Timestamp;
  
  // === CONTEÚDO ===
  storagePath: string;                  // Caminho no Firebase Storage (para imagens/HTML)
  publicUrl?: string;                   // URL pública (se aplicável)
  
  // === INSIGHTS (Gerados por IA após captura) ===
  analysis?: {
    headline?: string;                  // Headline principal extraída
    offerType?: string;                 // ex: 'Free Trial', 'Direct Sale'
    visualStyle?: string[];             // ex: 'Minimalist', 'Aggressive'
    techDetected?: string[];            // Tecnologias específicas desta página
  };
  
  version: number;
}
```

---

## 3. Pinecone: Expansão de Metadados

Os vetores de inteligência competitiva devem permitir busca semântica por estratégias de funil.

### 3.1 Schema de Vetores (Competitor Insights)

```typescript
interface CompetitorVectorMetadata {
  brandId: string;
  competitorId: string;
  type: 'competitor_insight';
  subType: 'tech_stack' | 'funnel_strategy' | 'swot_analysis';
  
  // === CONTEÚDO PARA BUSCA ===
  content: string;                      // Texto da análise ou descrição da tecnologia
  tags: string[];                       // ['checkout_optimization', 'retention_strategy']
  
  // === REFERÊNCIAS ===
  assetId?: string;                     // Link para o IntelligenceAsset no Firestore
  collectedAt: number;
}
```

---

## 4. Fluxo de Dados: Intelligence to Production

Para que os insights fluam para a produção de conteúdo, o contrato estabelece o **"Context Bridge"**:

1. **Spy Agent (Darllyson)**: Captura ativos e salva em `intelligence/competitors/{id}/assets`.
2. **Analyst Agent (IA)**: Processa o `IntelligenceAsset`, gera o `analysis` e salva o vetor no Pinecone.
3. **Asset Library (UI)**: Exibe os ativos de forma visual para o usuário.
4. **Content Generator (IA)**: Ao criar um novo funil, o sistema busca no Pinecone vetores do tipo `competitor_insight` filtrados pela `brandId` para injetar como contexto de "Benchmarking" no prompt.

---

## 5. Paths Autorizados (Update Lane Contract)

```yaml
intelligence_wing:
  paths:
    # ... caminhos anteriores ...
    - "app/src/types/competitors.ts"
    - "app/src/lib/intelligence/competitors/**"
    - "app/src/components/intelligence/competitors/**"
    - "app/src/app/api/intelligence/spy/**"
```

---

## 6. Validação de Implementação (Checklist Athos)

- [ ] **Sanitização**: O Spy Agent remove tokens de sessão das URLs capturadas?
- [ ] **Isolamento**: O `brandId` está presente em todas as sub-collections de competidores?
- [ ] **Storage**: Screenshots estão sendo salvos com o path `brands/{brandId}/competitors/{competitorId}/{assetId}.png`?
- [ ] **IA-Ready**: O campo `analysis` do `IntelligenceAsset` contém dados estruturados suficientes para um prompt?

---
*Contract definido por Athos (Architect) - NETECMT v2.0*  
*Sprint 14 | Intelligence Expansion | Versão 1.0*
